const EmergencyRequest = require('../models/EmergencyRequest');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Donation = require('../models/Donation');
const { startTracking, endTracking, broadcastToTracking, getIO } = require('../sockets/tracking');

// @desc    Create emergency request
// @route   POST /api/emergency
// @access  Private
const createEmergencyRequest = async (req, res) => {
  try {
    const { patientName, bloodGroup, hospital, contactNumber, notes, latitude, longitude, expiresAt, unitsNeeded } = req.body;

    // Validation
    if (!patientName || !bloodGroup || !hospital || !contactNumber) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    if (!unitsNeeded || unitsNeeded < 1) {
      return res.status(400).json({ message: 'Units needed must be at least 1' });
    }

    const contactDigits = contactNumber.replace(/\D/g, '');
    if (!/^\d{10}$/.test(contactDigits)) {
      return res.status(400).json({ message: 'Contact number must be exactly 10 digits' });
    }

    const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    if (!validBloodGroups.includes(bloodGroup)) {
      return res.status(400).json({ message: 'Invalid blood group' });
    }

    // Validate expiresAt if provided
    let requestExpiresAt;
    if (expiresAt) {
      requestExpiresAt = new Date(expiresAt);
      if (isNaN(requestExpiresAt.getTime()) || requestExpiresAt <= new Date()) {
        return res.status(400).json({ message: 'Expiry must be a valid future date/time' });
      }
    }

    // Get user's location if not provided
    let requesterLocation = { type: 'Point', coordinates: [0, 0] };
    
    if (latitude && longitude) {
      requesterLocation = {
        type: 'Point',
        coordinates: [longitude, latitude],
      };
    } else {
      // Use user's stored location
      const user = await User.findById(req.user.id);
      if (user && user.location && user.location.coordinates[0] !== 0 && user.location.coordinates[1] !== 0) {
        requesterLocation = user.location;
      }
    }

    const emergencyRequest = await EmergencyRequest.create({
      patientName,
      bloodGroup,
      hospital,
      contactNumber,
      notes: notes || '',
      unitsNeeded: unitsNeeded || 1,
      requesterLocation,
      requester: req.user.id,
      expiresAt: requestExpiresAt || undefined,
    });

    // Find matching donors and create notifications
    const searchRadius = 20; // Default 20km radius for emergency matching
    const radiusInRadians = searchRadius / 6371;

    const matchingDonors = await User.find({
      _id: { $ne: req.user.id },
      bloodGroup: bloodGroup,
      available: true,
      profileCompleted: true,
      location: {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: requesterLocation.coordinates,
          },
          $maxDistance: radiusInRadians * 6371000,
        },
      },
    }).select('_id name');

    // Create notifications for matching donors
    const notificationPromises = matchingDonors.map((donor) => {
      return Notification.create({
        donorId: donor._id,
        requestId: emergencyRequest._id,
        message: `Emergency blood request for ${bloodGroup} at ${hospital}. Patient: ${patientName}`,
        status: 'unread',
      });
    });

    await Promise.all(notificationPromises);

    res.status(201).json({
      success: true,
      message: 'Emergency request created successfully',
      emergencyRequest,
      matchedDonors: matchingDonors.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all emergency requests
// @route   GET /api/emergency
// @access  Private
const getEmergencyRequests = async (req, res) => {
  try {
    // Auto-remove expired and requests older than 7 days
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const expiredIds = await EmergencyRequest.find({
      $or: [
        { expiresAt: { $lt: now } },
        { createdAt: { $lt: sevenDaysAgo } },
      ],
      status: 'active',
    }).select('_id');

    if (expiredIds.length > 0) {
      const ids = expiredIds.map(r => r._id);
      await EmergencyRequest.deleteMany({ _id: { $in: ids } });
      await Notification.deleteMany({ requestId: { $in: ids } });
    }

    // Get active requests sorted by date (newest first)
    const emergencyRequests = await EmergencyRequest.find({ status: 'active' })
      .populate('requester', 'name email phone state district city')
      .populate('responders.donor', 'name email phone bloodGroup unitsCanDonate bloodCharges')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: emergencyRequests.length,
      emergencyRequests,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get emergency request by ID
// @route   GET /api/emergency/:id
// @access  Private
const getEmergencyRequestById = async (req, res) => {
  try {
    const emergencyRequest = await EmergencyRequest.findById(req.params.id)
      .populate('requester', 'name email phone state district city');

    if (!emergencyRequest) {
      return res.status(404).json({ message: 'Emergency request not found' });
    }

    res.status(200).json({
      success: true,
      emergencyRequest,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update emergency request
// @route   PUT /api/emergency/:id
// @access  Private
const updateEmergencyRequest = async (req, res) => {
  try {
    const { patientName, bloodGroup, hospital, contactNumber, notes, status, latitude, longitude } = req.body;

    const emergencyRequest = await EmergencyRequest.findById(req.params.id);

    if (!emergencyRequest) {
      return res.status(404).json({ message: 'Emergency request not found' });
    }

    // Validate blood group if provided
    if (bloodGroup) {
      const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
      if (!validBloodGroups.includes(bloodGroup)) {
        return res.status(400).json({ message: 'Invalid blood group' });
      }
    }

    // Validate status if provided
    if (status) {
      const validStatuses = ['active', 'fulfilled', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
    }

    // Update fields if provided
    if (patientName) emergencyRequest.patientName = patientName;
    if (bloodGroup) emergencyRequest.bloodGroup = bloodGroup;
    if (hospital) emergencyRequest.hospital = hospital;
    if (contactNumber) emergencyRequest.contactNumber = contactNumber;
    if (notes !== undefined) emergencyRequest.notes = notes;
    if (status) emergencyRequest.status = status;

    // Update location if provided
    if (latitude && longitude) {
      emergencyRequest.requesterLocation = {
        type: 'Point',
        coordinates: [longitude, latitude],
      };
    }

    await emergencyRequest.save();

    res.status(200).json({
      success: true,
      message: 'Emergency request updated successfully',
      emergencyRequest,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete emergency request
// @route   DELETE /api/emergency/:id
// @access  Private
const deleteEmergencyRequest = async (req, res) => {
  try {
    const emergencyRequest = await EmergencyRequest.findById(req.params.id);

    if (!emergencyRequest) {
      return res.status(404).json({ message: 'Emergency request not found' });
    }

    if (emergencyRequest.requester.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the requester can delete this request' });
    }

    await EmergencyRequest.findByIdAndDelete(req.params.id);

    // Delete associated notifications
    await Notification.deleteMany({ requestId: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Emergency request deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Respond to emergency request
// @route   POST /api/emergency/:id/respond
// @access  Private
const respondToRequest = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !['accepted', 'declined', 'pending'].includes(status)) {
      return res.status(400).json({ message: 'Status must be "accepted", "declined", or "pending"' });
    }

    const emergencyRequest = await EmergencyRequest.findById(req.params.id);

    if (!emergencyRequest) {
      return res.status(404).json({ message: 'Emergency request not found' });
    }

    if (emergencyRequest.status !== 'active') {
      return res.status(400).json({ message: 'This request is no longer active' });
    }

    if (emergencyRequest.requester.toString() === req.user.id) {
      return res.status(400).json({ message: 'You cannot respond to your own request' });
    }

    const donor = await User.findById(req.user.id).select('name phone bloodGroup unitsCanDonate bloodCharges city state district location avatar age gender religion');
    const donorUnits = donor?.unitsCanDonate || 1;
    const remainingNeeded = emergencyRequest.unitsNeeded - emergencyRequest.unitsFulfilled;

    const existingResponse = emergencyRequest.responders.find(
      (r) => r.donor.toString() === req.user.id
    );

    const storeStatus = status === 'accepted' ? 'pending' : status;

    if (existingResponse) {
      if (existingResponse.status === 'accepted') {
        return res.status(400).json({ message: 'You have already been accepted for this request' });
      }
      if (existingResponse.status === 'declined') {
        return res.status(400).json({ message: 'You were declined for this request and cannot respond again.' });
      }
      existingResponse.status = storeStatus;
      existingResponse.respondedAt = Date.now();
      existingResponse.units = Math.min(donorUnits, remainingNeeded);
    } else {
      emergencyRequest.responders.push({
        donor: req.user.id,
        status: storeStatus,
        units: Math.min(donorUnits, remainingNeeded),
      });
    }

    await emergencyRequest.save();

    if (status === 'accepted' || status === 'pending') {
      const chargeInfo = donor?.bloodCharges && donor.bloodCharges > 0
        ? ` (Charge: ₹${donor.bloodCharges}/unit)`
        : ' (Free)';
      const unitsInfo = donorUnits < remainingNeeded
        ? ` This donor has only ${donorUnits} unit(s) to donate.`
        : ` They can donate ${Math.min(donorUnits, remainingNeeded)} unit(s).`;
      await Notification.create({
        donorId: emergencyRequest.requester,
        requestId: emergencyRequest._id,
        relatedUserId: donor._id,
        type: 'emergency_response',
        message: `${donor?.name || 'A donor'} is available to donate ${emergencyRequest.bloodGroup} blood.${unitsInfo} Contact: ${donor?.phone || 'N/A'}${chargeInfo}`,
        status: 'unread',
        actionTaken: 'pending',
      });

      const io = getIO();
      if (io) {
        io.to(`user:${String(emergencyRequest.requester)}`).emit('new_notification');
      }
    }

    const displayMessage = status === 'accepted' || status === 'pending'
      ? 'Your offer to help has been sent. Waiting for requester approval.'
      : `Response recorded as "${status}"`;

    res.status(200).json({
      success: true,
      message: displayMessage,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Requester accepts a pending responder and starts tracking
// @route   PUT /api/emergency/:id/responder/:donorId/accept
// @access  Private
const acceptResponder = async (req, res) => {
  try {
    const emergencyRequest = await EmergencyRequest.findById(req.params.id);

    if (!emergencyRequest) {
      return res.status(404).json({ message: 'Emergency request not found' });
    }

    if (emergencyRequest.requester.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the requester can accept responders' });
    }

    if (emergencyRequest.status !== 'active') {
      return res.status(400).json({ message: 'This request is no longer active' });
    }

    const responder = emergencyRequest.responders.find(
      (r) => r.donor.toString() === req.params.donorId
    );

    if (!responder) {
      return res.status(404).json({ message: 'Responder not found' });
    }

    if (responder.status !== 'pending') {
      return res.status(400).json({ message: 'Responder is not in pending state' });
    }

    responder.status = 'accepted';

    const donationUnits = responder.units || 1;
    emergencyRequest.unitsFulfilled += donationUnits;
    const remainingNeeded = emergencyRequest.unitsNeeded - emergencyRequest.unitsFulfilled;

    if (remainingNeeded <= 0) {
      emergencyRequest.status = 'fulfilled';
    }

    await emergencyRequest.save();

    const donor = await User.findById(req.params.donorId).select('name');

    const existingDonation = await Donation.findOne({ donor: req.params.donorId, requestId: emergencyRequest._id });
    if (!existingDonation) {
      await Donation.create({
        donor: req.params.donorId,
        recipientName: emergencyRequest.patientName,
        bloodGroup: emergencyRequest.bloodGroup,
        hospital: emergencyRequest.hospital,
        units: donationUnits,
        donationDate: new Date(),
        requestId: emergencyRequest._id,
        notes: emergencyRequest.notes || 'Donated via emergency request',
      });
    }

    await Notification.updateMany(
      { requestId: emergencyRequest._id, relatedUserId: req.params.donorId, type: 'emergency_response' },
      { actionTaken: 'accepted' }
    );

    await Notification.create({
      donorId: req.params.donorId,
      requestId: emergencyRequest._id,
      relatedUserId: req.user.id,
      type: 'emergency_response',
      message: `Your offer to help ${emergencyRequest.patientName} has been accepted. You are donating ${donationUnits} unit(s).`,
      status: 'unread',
      actionTaken: 'accepted',
    });

    if (remainingNeeded > 0) {
      await Notification.create({
        donorId: emergencyRequest.requester,
        requestId: emergencyRequest._id,
        relatedUserId: req.user.id,
        type: 'emergency_response',
        message: `${donor?.name || 'A donor'} has donated ${donationUnits} unit(s). Still need ${remainingNeeded} more unit(s) for ${emergencyRequest.patientName}.`,
        status: 'unread',
        actionTaken: 'fulfilled',
      });
    }

    const io = getIO();
    if (io) {
      io.to(`user:${req.params.donorId}`).emit('responder_status_changed', {
        requestId: String(emergencyRequest._id),
        status: 'accepted',
      });

      if (remainingNeeded <= 0) {
        io.to(`user:${String(emergencyRequest.requester)}`).emit('request_completed', {
          requestId: String(emergencyRequest._id),
        });
        io.to(`user:${req.params.donorId}`).emit('request_completed', {
          requestId: String(emergencyRequest._id),
        });
      }
    }

    if (remainingNeeded <= 0) {
      const { endTracking, cleanupTrackingRoom } = require('../sockets/tracking');
      endTracking(String(emergencyRequest._id));
      try {
        cleanupTrackingRoom(String(emergencyRequest._id));
      } catch (err) {
        // ignore
      }
    } else {
      startTracking(String(emergencyRequest._id), String(emergencyRequest.requester), String(req.params.donorId));
      broadcastToTracking(String(emergencyRequest._id), 'tracking_started', {
        requestId: String(emergencyRequest._id),
        requesterId: String(emergencyRequest.requester),
        donorId: String(req.params.donorId),
      });
    }

    res.status(200).json({
      success: true,
      message: remainingNeeded <= 0
        ? 'Responder accepted. All units fulfilled! Request completed.'
        : `Responder accepted. ${remainingNeeded} more unit(s) still needed.`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Requester declines a pending responder
// @route   PUT /api/emergency/:id/responder/:donorId/decline
// @access  Private
const declineResponder = async (req, res) => {
  try {
    const emergencyRequest = await EmergencyRequest.findById(req.params.id);

    if (!emergencyRequest) {
      return res.status(404).json({ message: 'Emergency request not found' });
    }

    if (emergencyRequest.requester.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the requester can decline responders' });
    }

    const responder = emergencyRequest.responders.find(
      (r) => r.donor.toString() === req.params.donorId
    );

    if (!responder) {
      return res.status(404).json({ message: 'Responder not found' });
    }

    if (responder.status !== 'pending') {
      return res.status(400).json({ message: 'Responder is not in pending state' });
    }

    responder.status = 'declined';

    await emergencyRequest.save();

    await Notification.updateMany(
      { requestId: emergencyRequest._id, relatedUserId: req.params.donorId, type: 'emergency_response' },
      { actionTaken: 'declined' }
    );

    await Notification.create({
      donorId: req.params.donorId,
      requestId: emergencyRequest._id,
      relatedUserId: req.user.id,
      type: 'emergency_response',
      message: `Your offer to help ${emergencyRequest.patientName} was declined.`,
      status: 'unread',
      actionTaken: 'declined',
    });

    const io = getIO();
    if (io) {
      io.to(`user:${req.params.donorId}`).emit('responder_status_changed', {
        requestId: String(emergencyRequest._id),
        status: 'declined',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Responder declined.',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get responders for a request
// @route   GET /api/emergency/:id/responders
// @access  Private
const getResponders = async (req, res) => {
  try {
    const emergencyRequest = await EmergencyRequest.findById(req.params.id)
      .populate('responders.donor', 'name email phone bloodGroup');

    if (!emergencyRequest) {
      return res.status(404).json({ message: 'Emergency request not found' });
    }

    const isRequester = emergencyRequest.requester.toString() === req.user.id;
    const isResponder = emergencyRequest.responders.some(
      (r) => r.donor && r.donor._id.toString() === req.user.id
    );

    if (!isRequester && !isResponder) {
      return res.status(403).json({ message: 'Not authorized to view responders' });
    }

    res.status(200).json({
      success: true,
      responders: emergencyRequest.responders,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

    // @desc    Get emergency tracking session details
// @route   GET /api/emergency/:id/tracking
// @access  Private
const getEmergencyTrackingSession = async (req, res) => {
  try {
    const emergencyRequest = await EmergencyRequest.findById(req.params.id)
      .populate('requester', 'name email phone bloodGroup city state district avatar');

    if (!emergencyRequest) {
      return res.status(404).json({ message: 'Emergency request not found' });
    }

    const acceptedResponder = emergencyRequest.responders.find(
      (r) => r.status === 'accepted'
    );

    if (!acceptedResponder) {
      return res.status(400).json({ message: 'No accepted responder found for this request' });
    }

    const donor = await User.findById(acceptedResponder.donor).select('name email phone bloodGroup city state district location avatar');

    const isRequester = emergencyRequest.requester._id.toString() === req.user.id;
    const isDonor = String(acceptedResponder.donor) === req.user.id;

    if (!isRequester && !isDonor) {
      return res.status(403).json({ message: 'Not authorized to view tracking for this request' });
    }

    const requesterCoords = emergencyRequest.requesterLocation?.coordinates || [0, 0];
    const donorCoords = donor.location?.coordinates || [0, 0];

    res.status(200).json({
      success: true,
      tracking: {
        requestId: String(emergencyRequest._id),
        requester: {
          id: String(emergencyRequest.requester._id),
          name: emergencyRequest.requester.name,
          location: { coordinates: requesterCoords },
          phone: emergencyRequest.requester.phone,
        },
        donor: {
          id: String(donor._id),
          name: donor.name,
          location: { coordinates: donorCoords },
          phone: donor.phone,
        },
        status: 'accepted',
        bloodGroup: emergencyRequest.bloodGroup,
        hospital: emergencyRequest.hospital,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Complete an emergency request (donor arrived, donation done)
// @route   PUT /api/emergency/:id/complete
// @access  Private (donor or requester)
const completeEmergencyRequest = async (req, res) => {
  try {
    const emergencyRequest = await EmergencyRequest.findById(req.params.id);

    if (!emergencyRequest) {
      return res.status(404).json({ message: 'Emergency request not found' });
    }

    if (emergencyRequest.status !== 'active') {
      return res.status(400).json({ message: 'Request is not active' });
    }

    const isRequester = emergencyRequest.requester.toString() === req.user.id;
    const isAcceptedResponder = emergencyRequest.responders.some(
      (r) => r.donor.toString() === req.user.id && r.status === 'accepted'
    );

    if (!isRequester && !isAcceptedResponder) {
      return res.status(403).json({ message: 'Not authorized to complete this request' });
    }

    emergencyRequest.status = 'fulfilled';
    await emergencyRequest.save();

    const { endTracking, cleanupTrackingRoom } = require('../sockets/tracking');
    endTracking(String(emergencyRequest._id));
    try {
      cleanupTrackingRoom(String(emergencyRequest._id));
    } catch (err) {
      // ignore
    }

    const io = getIO();
    if (io) {
      io.to(`user:${String(emergencyRequest.requester)}`).emit('request_completed', {
        requestId: String(emergencyRequest._id),
      });

      const acceptedDonor = emergencyRequest.responders.find((r) => r.status === 'accepted');
      if (acceptedDonor) {
        io.to(`user:${String(acceptedDonor.donor)}`).emit('request_completed', {
          requestId: String(emergencyRequest._id),
        });
      }
    }

    await Notification.deleteMany({ requestId: emergencyRequest._id });

    res.status(200).json({
      success: true,
      message: 'Request completed successfully.',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createEmergencyRequest,
  getEmergencyRequests,
  getEmergencyRequestById,
  updateEmergencyRequest,
  deleteEmergencyRequest,
  respondToRequest,
  acceptResponder,
  declineResponder,
  getResponders,
  getEmergencyTrackingSession,
  completeEmergencyRequest,
};
