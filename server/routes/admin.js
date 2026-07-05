const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  deleteUser,
  getAllEmergencyRequests,
  deleteEmergencyRequest,
  getAllBloodRequests,
  deleteBloodRequest,
  getAllDonations,
  deleteDonation,
  getAllCamps,
  deleteCamp,
  getAllNotifications,
  deleteNotification,
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

// Blood Request Management
router.get('/blood-requests', protect, admin, getAllBloodRequests);
router.delete('/blood-requests/:id', protect, admin, deleteBloodRequest);

// Donation Management
router.get('/donations', protect, admin, getAllDonations);
router.delete('/donations/:id', protect, admin, deleteDonation);

// Camp Management
router.get('/camps', protect, admin, getAllCamps);
router.delete('/camps/:id', protect, admin, deleteCamp);

// Notification Management
router.get('/notifications', protect, admin, getAllNotifications);
router.delete('/notifications/:id', protect, admin, deleteNotification);

module.exports = router;
