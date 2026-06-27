const express = require('express');
const router = express.Router();
const {
  createEmergencyRequest,
  getEmergencyRequests,
  getEmergencyRequestById,
  updateEmergencyRequest,
  deleteEmergencyRequest,
} = require('../controllers/emergencyController');
const protect = require('../middleware/auth');

router.route('/').get(protect, getEmergencyRequests).post(protect, createEmergencyRequest);
router.route('/:id').get(protect, getEmergencyRequestById).put(protect, updateEmergencyRequest).delete(protect, deleteEmergencyRequest);

module.exports = router;
