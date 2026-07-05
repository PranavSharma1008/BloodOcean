const express = require('express');
const router = express.Router();
const {
  createEmergencyRequest,
  getEmergencyRequests,
  getEmergencyRequestById,
  updateEmergencyRequest,
  deleteEmergencyRequest,
  respondToRequest,
  acceptResponder,
  declineResponder,
  getResponders,
  getEmergencyTrackingSession,
  completeEmergencyRequest,
} = require('../controllers/emergencyController');
const protect = require('../middleware/auth');

router.route('/').get(protect, getEmergencyRequests).post(protect, createEmergencyRequest);
router.route('/:id').get(protect, getEmergencyRequestById).put(protect, updateEmergencyRequest).delete(protect, deleteEmergencyRequest);
router.post('/:id/respond', protect, respondToRequest);
router.put('/:id/responder/:donorId/accept', protect, acceptResponder);
router.put('/:id/responder/:donorId/decline', protect, declineResponder);
router.get('/:id/responders', protect, getResponders);
router.get('/:id/tracking', protect, getEmergencyTrackingSession);
router.put('/:id/complete', protect, completeEmergencyRequest);

module.exports = router;
