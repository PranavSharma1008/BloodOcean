const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  deleteUser,
  getAllEmergencyRequests,
  deleteEmergencyRequest,
  getStatistics,
} = require('../controllers/adminController');
const protect = require('../middleware/auth');
const admin = require('../middleware/admin');

// Statistics
router.get('/statistics', protect, admin, getStatistics);

// User Management
router.get('/users', protect, admin, getAllUsers);
router.delete('/users/:id', protect, admin, deleteUser);

// Emergency Request Management
router.get('/emergency-requests', protect, admin, getAllEmergencyRequests);
router.delete('/emergency-requests/:id', protect, admin, deleteEmergencyRequest);

module.exports = router;
