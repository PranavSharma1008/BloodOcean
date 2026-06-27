const User = require('../models/User');
const EmergencyRequest = require('../models/EmergencyRequest');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Admin
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all emergency requests
// @route   GET /api/admin/emergency-requests
// @access  Admin
const getAllEmergencyRequests = async (req, res) => {
  try {
    const requests = await EmergencyRequest.find()
      .populate('requester', 'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete emergency request
// @route   DELETE /api/admin/emergency-requests/:id
// @access  Admin
const deleteEmergencyRequest = async (req, res) => {
  try {
    const request = await EmergencyRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Emergency request not found' });
    }

    await EmergencyRequest.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Emergency request deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get statistics
// @route   GET /api/admin/statistics
// @access  Admin
const getStatistics = async (req, res) => {
  try {
    const totalDonors = await User.countDocuments({ profileCompleted: true });
    const availableDonors = await User.countDocuments({ 
      profileCompleted: true, 
      available: true 
    });

    // Blood group distribution
    const bloodGroupDistribution = await User.aggregate([
      { $match: { profileCompleted: true, bloodGroup: { $ne: '' } } },
      {
        $group: {
          _id: '$bloodGroup',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const totalEmergencyRequests = await EmergencyRequest.countDocuments();
    const activeEmergencyRequests = await EmergencyRequest.countDocuments({ status: 'active' });
    const fulfilledEmergencyRequests = await EmergencyRequest.countDocuments({ status: 'fulfilled' });
    const cancelledEmergencyRequests = await EmergencyRequest.countDocuments({ status: 'cancelled' });

    res.status(200).json({
      success: true,
      statistics: {
        donors: {
          total: totalDonors,
          available: availableDonors,
          bloodGroupDistribution,
        },
        emergencyRequests: {
          total: totalEmergencyRequests,
          active: activeEmergencyRequests,
          fulfilled: fulfilledEmergencyRequests,
          cancelled: cancelledEmergencyRequests,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllUsers,
  deleteUser,
  getAllEmergencyRequests,
  deleteEmergencyRequest,
  getStatistics,
  };



  