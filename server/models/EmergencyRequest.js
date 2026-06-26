const mongoose = require('mongoose');

const emergencyRequestSchema = new mongoose.Schema({
  patientName: {
    type: String,
    required: [true, 'Please provide patient name'],
    trim: true,
  },
  bloodGroup: {
    type: String,
    required: [true, 'Please provide blood group'],
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  },
  hospital: {
    type: String,
    required: [true, 'Please provide hospital name'],
    trim: true,
  },
  contactNumber: {
    type: String,
    required: [true, 'Please provide contact number'],
    trim: true,
  },
  notes: {
    type: String,
    trim: true,
    default: '',
  },
  requesterLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      default: [0, 0],
    },
  },
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'fulfilled', 'cancelled'],
    default: 'active',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create 2dsphere index for requesterLocation field
emergencyRequestSchema.index({ requesterLocation: '2dsphere' });

module.exports = mongoose.model('EmergencyRequest', emergencyRequestSchema);
