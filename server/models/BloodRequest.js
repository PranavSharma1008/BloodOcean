const mongoose = require('mongoose');

const bloodRequestSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  bloodGroup: {
    type: String,
    required: true,
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
    default: '',
    trim: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'completed', 'cancelled'],
    default: 'pending',
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
  donorLocation: {
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
  acceptedAt: {
    type: Date,
  },
  completedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

bloodRequestSchema.index({ requester: 1, createdAt: -1 });
bloodRequestSchema.index({ donor: 1, createdAt: -1 });
bloodRequestSchema.index({ donorLocation: '2dsphere' });

module.exports = mongoose.model('BloodRequest', bloodRequestSchema);
