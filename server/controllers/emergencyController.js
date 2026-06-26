const EmergencyRequest = require('../models/EmergencyRequest');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Create emergency request
// @route   POST /api/emergency
// @access  Private
const createEmergencyRequest = async (req, res) => {
  try {
    const { patientName, bloodGroup, hospital, contactNumber, notes, latitude, longitude } = req.body;

    // Validation
    if (!patientName || !bloodGroup || !hospital || !contactNumber) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    if (!validBloodGroups.includes(bloodGroup)) {
      return res.status(400).json({ message: 'Invalid blood group' });
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
      requesterLocation,
      requester: req.user.id,
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
    const emergencyRequests = await EmergencyRequest.find({ status: 'active' })
      .populate('requester', 'name email phone')
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
      .populate('requester', 'name email phone');

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

// @desc    Update emergency request status
// @route   PUT /api/emergency/:id
// @access  Private
const updateEmergencyRequest = async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = ['active', 'fulfilled', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const emergencyRequest = await EmergencyRequest.findById(req.params.id);

    if (!emergencyRequest) {
      return res.status(404).json({ message: 'Emergency request not found' });
    }

    // Check if user is the requester
    if (emergencyRequest.requester.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this request' });
    }

    emergencyRequest.status = status;
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

module.exports = {
  createEmergencyRequest,
  getEmergencyRequests,
  getEmergencyRequestById,
  updateEmergencyRequest,
};
