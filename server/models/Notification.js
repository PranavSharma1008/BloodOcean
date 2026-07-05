const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmergencyRequest',
  },
  campId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Camp',
  },
  bloodRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BloodRequest',
  },
  relatedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  type: {
    type: String,
    enum: ['emergency', 'camp', 'donor_request', 'blood_request_update', 'emergency_response'],
    default: 'emergency',
  },
  message: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['unread', 'read'],
    default: 'unread',
  },
  actionTaken: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'completed'],
    default: 'pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

notificationSchema.index({ donorId: 1, status: 1 });
notificationSchema.index({ donorId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
