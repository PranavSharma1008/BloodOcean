const express = require('express');
const router = express.Router();
const {
  createBloodRequest,
  getMyBloodRequests,
  getBloodRequestById,
  getTrackingSession,
  acceptBloodRequest,
  declineBloodRequest,
  completeBloodRequest,
} = require('../controllers/bloodRequestController');
const protect = require('../middleware/auth');

router.route('/').get(protect, getMyBloodRequests).post(protect, createBloodRequest);
router.get('/:id', protect, getBloodRequestById);
router.get('/:id/tracking', protect, getTrackingSession);
router.put('/:id/accept', protect, acceptBloodRequest);
router.put('/:id/decline', protect, declineBloodRequest);
router.put('/:id/complete', protect, completeBloodRequest);

module.exports = router;
