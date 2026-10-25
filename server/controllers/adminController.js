const User = require('../models/User');
const EmergencyRequest = require('../models/EmergencyRequest');
const BloodRequest = require('../models/BloodRequest');
const Donation = require('../models/Donation');
const Camp = require('../models/Camp');
const Notification = require('../models/Notification');
const sendError = require('../utils/sendError');

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
    return sendError(res, error);
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
    return sendError(res, error);
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
    return sendError(res, error);
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
    return sendError(res, error);
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
    return sendError(res, error);
  }
};

// @desc    Get all blood requests
// @route   GET /api/admin/blood-requests
// @access  Admin
const getAllBloodRequests = async (req, res) => {
  try {
    const requests = await BloodRequest.find()
      .populate('requester', 'name email phone')
      .populate('donor', 'name email phone')
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

// @desc    Delete blood request
// @route   DELETE /api/admin/blood-requests/:id
// @access  Admin
const deleteBloodRequest = async (req, res) => {
  try {
    const request = await BloodRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Blood request not found' });
    }

    await BloodRequest.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Blood request deleted successfully',
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Get all donations
// @route   GET /api/admin/donations
// @access  Admin
const getAllDonations = async (req, res) => {
  try {
    const donations = await Donation.find()
      .populate('donor', 'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: donations.length,
      donations,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Delete donation
// @route   DELETE /api/admin/donations/:id
// @access  Admin
const deleteDonation = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    await Donation.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Donation deleted successfully',
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Get all camps
// @route   GET /api/admin/camps
// @access  Admin
const getAllCamps = async (req, res) => {
  try {
    const camps = await Camp.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: camps.length,
      camps,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Delete camp
// @route   DELETE /api/admin/camps/:id
// @access  Admin
const deleteCamp = async (req, res) => {
  try {
    const camp = await Camp.findById(req.params.id);

    if (!camp) {
      return res.status(404).json({ message: 'Camp not found' });
    }

    await Camp.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Camp deleted successfully',
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Get all notifications
// @route   GET /api/admin/notifications
// @access  Admin
const getAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find()
      .populate('donorId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Delete notification
// @route   DELETE /api/admin/notifications/:id
// @access  Admin
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    await Notification.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = {
  getAllUsers,
  deleteUser,
  getAllEmergencyRequests,
  deleteEmergencyRequest,
  getAllBloodRequests,
  deleteBloodRequest,
  getAllDonations,
  deleteDonation,
  getAllCamps,
  deleteCamp,
  getAllNotifications,
  deleteNotification,
  getStatistics,
  };



  