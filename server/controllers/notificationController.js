const Notification = require('../models/Notification');
const sendError = require('../utils/sendError');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ donorId: req.user.id })
      .populate('requestId', 'patientName bloodGroup hospital status')
      .populate('campId', 'campName city district state startDate endDate')
      .populate('bloodRequestId', 'requester donor bloodGroup hospital contactNumber status requesterLocation donorLocation')
      .populate('relatedUserId', 'name phone bloodGroup city state district age gender religion disease avatar available')
      .sort({ createdAt: -1 });

    const unreadCount = await Notification.countDocuments({
      donorId: req.user.id,
      status: 'unread',
    });

    res.status(200).json({
      success: true,
      count: notifications.length,
      unreadCount,
      notifications,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notification.donorId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this notification' });
    }

    notification.status = 'read';
    await notification.save();

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      notification,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/mark-all-read
// @access  Private
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { donorId: req.user.id, status: 'unread' },
      { status: 'read' }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
};
