const BloodRequest = require('../models/BloodRequest');
const Notification = require('../models/Notification');
const User = require('../models/User');
const sendError = require('../utils/sendError');
const { startTracking, broadcastToTracking } = require('../sockets/tracking');

// @desc    Create blood request to a specific donor
// @route   POST /api/blood-requests
// @access  Private
const createBloodRequest = async (req, res) => {
  try {
    const { donorId, bloodGroup, hospital, contactNumber, notes, latitude, longitude } = req.body;

    if (!donorId || !bloodGroup || !hospital || !contactNumber) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    if (!validBloodGroups.includes(bloodGroup)) {
      return res.status(400).json({ message: 'Invalid blood group' });
    }

    if (donorId === req.user.id) {
      return res.status(400).json({ message: 'You cannot request blood from yourself' });
    }

    const donor = await User.findById(donorId);
    if (!donor) {
      return res.status(404).json({ message: 'Donor not found' });
    }

    let requesterLocation = { type: 'Point', coordinates: [0, 0] };
    if (latitude && longitude) {
      requesterLocation = { type: 'Point', coordinates: [longitude, latitude] };
    } else {
      const requester = await User.findById(req.user.id);
      if (requester && requester.location && requester.location.coordinates[0] !== 0 && requester.location.coordinates[1] !== 0) {
        requesterLocation = requester.location;
      }
    }

    const bloodRequest = await BloodRequest.create({
      requester: req.user.id,
      donor: donorId,
      bloodGroup,
      hospital,
      contactNumber,
      notes: notes || '',
      requesterLocation,
    });

    const donorMsg = `🩸 Urgent Blood Request! ${req.user.name || 'A user'} needs ${bloodGroup} blood at ${hospital}. Contact: ${contactNumber}`;

    await Notification.create({
      donorId: donorId,
      bloodRequestId: bloodRequest._id,
      relatedUserId: req.user.id,
      type: 'donor_request',
      message: donorMsg,
      status: 'unread',
      actionTaken: 'pending',
    });

    await Notification.create({
      donorId: req.user.id,
      bloodRequestId: bloodRequest._id,
      relatedUserId: donorId,
      type: 'blood_request_update',
      message: `Blood request sent to ${donor.name} for ${bloodGroup} at ${hospital}.`,
      status: 'unread',
      actionTaken: 'pending',
    });

    // Real-time socket notification push
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${donorId}`).emit('new_notification', {
        type: 'donor_request',
        message: donorMsg,
        bloodRequestId: bloodRequest._id,
        relatedUserId: req.user.id,
      });
      io.to(`user:${req.user.id}`).emit('new_notification');
    }

    // Optional email notification
    try {
      const sendEmail = require('../utils/sendEmail');
      if (donor.email) {
        await sendEmail({
          to: donor.email,
          subject: `🚨 Urgent Blood Request (${bloodGroup}) - BloodOcean`,
          text: `Hello ${donor.name},\n\n${req.user.name || 'A user'} urgently needs ${bloodGroup} blood at ${hospital}.\n\nContact Number: ${contactNumber}\nNotes: ${notes || 'None'}\n\nPlease log in to BloodOcean to view the location and accept this request!\n\nBloodOcean Team`,
        });
      }
    } catch (emailErr) {
      console.warn('Failed to send blood request notification email:', emailErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Blood request sent successfully',
      bloodRequest,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Get my blood requests (as requester or donor)
// @route   GET /api/blood-requests
// @access  Private
const getMyBloodRequests = async (req, res) => {
  try {
    const requests = await BloodRequest.find({
      $or: [
        { requester: req.user.id },
        { donor: req.user.id },
      ],
    })
      .populate('requester', 'name email phone bloodGroup city state district location avatar')
      .populate('donor', 'name email phone bloodGroup city state district location avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Accept blood request and share location
// @route   PUT /api/blood-requests/:id/accept
// @access  Private
const acceptBloodRequest = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const bloodRequest = await BloodRequest.findById(req.params.id);

    if (!bloodRequest) {
      return res.status(404).json({ message: 'Blood request not found' });
    }

    if (bloodRequest.donor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to accept this request' });
    }

    if (bloodRequest.status !== 'pending') {
      return res.status(400).json({ message: 'This request is no longer pending' });
    }

    bloodRequest.status = 'accepted';
    bloodRequest.acceptedAt = Date.now();

    if (latitude && longitude) {
      bloodRequest.donorLocation = {
        type: 'Point',
        coordinates: [longitude, latitude],
      };
    }

    await bloodRequest.save();

    await Notification.create({
      donorId: bloodRequest.requester,
      bloodRequestId: bloodRequest._id,
      type: 'blood_request_update',
      message: `${bloodRequest.donor?.name || 'A donor'} has accepted your blood request for ${bloodRequest.bloodGroup}. You can now view each other's locations on the map.`,
      status: 'unread',
      actionTaken: 'accepted',
    });

    await Notification.create({
      donorId: bloodRequest.donor,
      bloodRequestId: bloodRequest._id,
      type: 'donor_request',
      message: `You accepted the blood request for ${bloodRequest.bloodGroup}. You can now view each other's locations on the map.`,
      status: 'unread',
      actionTaken: 'accepted',
    });

    // Start live tracking session for donor and requester
    startTracking(String(bloodRequest._id), String(bloodRequest.requester), String(bloodRequest.donor));
    broadcastToTracking(String(bloodRequest._id), 'tracking_started', {
      requestId: String(bloodRequest._id),
      requesterId: String(bloodRequest.requester),
      donorId: String(bloodRequest.donor),
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${bloodRequest.requester}`).emit('new_notification');
      io.to(`user:${bloodRequest.donor}`).emit('new_notification');
    }

    res.status(200).json({
      success: true,
      message: 'Blood request accepted',
      bloodRequest,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Decline blood request
// @route   PUT /api/blood-requests/:id/decline
// @access  Private
const declineBloodRequest = async (req, res) => {
  try {
    const bloodRequest = await BloodRequest.findById(req.params.id);

    if (!bloodRequest) {
      return res.status(404).json({ message: 'Blood request not found' });
    }

    if (bloodRequest.donor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to decline this request' });
    }

    if (bloodRequest.status !== 'pending') {
      return res.status(400).json({ message: 'This request is no longer pending' });
    }

    bloodRequest.status = 'declined';
    await bloodRequest.save();

    await Notification.create({
      donorId: bloodRequest.requester,
      bloodRequestId: bloodRequest._id,
      type: 'blood_request_update',
      message: `${bloodRequest.donor?.name || 'A donor'} declined your blood request for ${bloodRequest.bloodGroup}.`,
      status: 'unread',
      actionTaken: 'declined',
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${bloodRequest.requester}`).emit('new_notification');
    }

    res.status(200).json({
      success: true,
      message: 'Blood request declined',
      bloodRequest,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Complete blood request
// @route   PUT /api/blood-requests/:id/complete
// @access  Private
const completeBloodRequest = async (req, res) => {
  try {
    const bloodRequest = await BloodRequest.findById(req.params.id);

    if (!bloodRequest) {
      return res.status(404).json({ message: 'Blood request not found' });
    }

    const isRequester = bloodRequest.requester.toString() === req.user.id;
    const isDonor = bloodRequest.donor.toString() === req.user.id;

    if (!isRequester && !isDonor) {
      return res.status(403).json({ message: 'Not authorized to complete this request' });
    }

    if (bloodRequest.status !== 'accepted') {
      return res.status(400).json({ message: 'Request must be accepted before completion' });
    }

    bloodRequest.status = 'completed';
    bloodRequest.completedAt = Date.now();
    await bloodRequest.save();

    const otherUserId = isRequester ? bloodRequest.donor : bloodRequest.requester;
    await Notification.create({
      donorId: otherUserId,
      bloodRequestId: bloodRequest._id,
      type: 'blood_request_update',
      message: `The blood request for ${bloodRequest.bloodGroup} has been marked as completed.`,
      status: 'unread',
      actionTaken: 'completed',
    });

    const { endTracking, broadcastToTracking, cleanupTrackingRoom } = require('../sockets/tracking');
    endTracking(String(bloodRequest._id));
    broadcastToTracking(String(bloodRequest._id), 'tracking_ended', {
      requestId: String(bloodRequest._id),
      reason: 'completed',
    });
    // Ensure sockets in the tracking room stop sharing and leave the room
    try {
      cleanupTrackingRoom(String(bloodRequest._id));
    } catch (err) {
      // ignore cleanup errors
    }

    const io = require('../sockets/tracking').getIO();
    if (io) {
      io.to(`user:${String(bloodRequest.requester)}`).emit('request_completed', {
        requestId: String(bloodRequest._id),
      });
      io.to(`user:${String(bloodRequest.donor)}`).emit('request_completed', {
        requestId: String(bloodRequest._id),
      });
    }

    res.status(200).json({
      success: true,
      message: 'Blood request completed',
      bloodRequest,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Get blood request by ID
// @route   GET /api/blood-requests/:id
// @access  Private
const getBloodRequestById = async (req, res) => {
  try {
    const bloodRequest = await BloodRequest.findById(req.params.id)
      .populate('requester', 'name email phone bloodGroup city state district location avatar')
      .populate('donor', 'name email phone bloodGroup city state district location avatar');

    if (!bloodRequest) {
      return res.status(404).json({ message: 'Blood request not found' });
    }

    const isRequester = bloodRequest.requester._id.toString() === req.user.id;
    const isDonor = bloodRequest.donor._id.toString() === req.user.id;

    if (!isRequester && !isDonor) {
      return res.status(403).json({ message: 'Not authorized to view this request' });
    }

    res.status(200).json({
      success: true,
      bloodRequest,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// NEW: Get tracking session details
// @route   GET /api/blood-requests/:id/tracking
// @access  Private
const getTrackingSession = async (req, res) => {
  try {
    const bloodRequest = await BloodRequest.findById(req.params.id)
      .populate('requester', 'name email phone bloodGroup city state district location avatar')
      .populate('donor', 'name email phone bloodGroup city state district location avatar');

    if (!bloodRequest) {
      return res.status(404).json({ message: 'Blood request not found' });
    }

    if (bloodRequest.status !== 'accepted') {
      return res.status(400).json({ message: 'Tracking is only available for accepted requests' });
    }

    const isRequester = bloodRequest.requester._id.toString() === req.user.id;
    const isDonor = bloodRequest.donor._id.toString() === req.user.id;

    if (!isRequester && !isDonor) {
      return res.status(403).json({ message: 'Not authorized to view tracking for this request' });
    }

    res.status(200).json({
      success: true,
      tracking: {
        requestId: String(bloodRequest._id),
        requester: {
          id: String(bloodRequest.requester._id),
          name: bloodRequest.requester.name,
          location: bloodRequest.requester.location?.coordinates || [0, 0],
        },
        donor: {
          id: String(bloodRequest.donor._id),
          name: bloodRequest.donor.name,
          location: bloodRequest.donorLocation?.coordinates || [0, 0],
        },
        status: bloodRequest.status,
        bloodGroup: bloodRequest.bloodGroup,
        hospital: bloodRequest.hospital,
      },
    });
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = {
  createBloodRequest,
  getMyBloodRequests,
  getBloodRequestById,
  getTrackingSession,
  acceptBloodRequest,
  declineBloodRequest,
  completeBloodRequest,
};
