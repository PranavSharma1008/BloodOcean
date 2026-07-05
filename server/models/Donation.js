const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  recipientName: {
    type: String,
    trim: true,
    default: '',
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: true,
  },
  hospital: {
    type: String,
    trim: true,
    default: '',
  },
  units: {
    type: Number,
    default: 1,
    min: 1,
  },
  donationDate: {
    type: Date,
    default: Date.now,
  },
  notes: {
    type: String,
    trim: true,
    default: '',
  },
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmergencyRequest',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

donationSchema.index({ donor: 1, createdAt: -1 });

module.exports = mongoose.model('Donation', donationSchema);
