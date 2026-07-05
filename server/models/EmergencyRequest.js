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
  unitsNeeded: {
    type: Number,
    required: [true, 'Please provide units needed'],
    min: 1,
    default: 1,
  },
  unitsFulfilled: {
    type: Number,
    default: 0,
    min: 0,
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
  responders: [{
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending',
    },
    respondedAt: {
      type: Date,
      default: Date.now,
    },
    units: {
      type: Number,
      default: 1,
      min: 1,
    },
  }],
  status: {
    type: String,
    enum: ['active', 'fulfilled', 'cancelled'],
    default: 'active',
  },
  expiresAt: {
    type: Date,
    default: () => new Date(+new Date() + 24 * 60 * 60 * 1000),
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create 2dsphere index for requesterLocation field
emergencyRequestSchema.index({ requesterLocation: '2dsphere' });

module.exports = mongoose.model('EmergencyRequest', emergencyRequestSchema);
