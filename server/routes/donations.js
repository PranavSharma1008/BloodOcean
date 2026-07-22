const express = require('express');
const router = express.Router();
const {
  createDonation,
  getDonations,
  getDonationById,
  updateDonation,
  deleteDonation,
} = require('../controllers/donationController');
const protect = require('../middleware/auth');

router.route('/').get(protect, getDonations).post(protect, createDonation);
router.route('/:id').get(protect, getDonationById).put(protect, updateDonation).delete(protect, deleteDonation);

module.exports = router;
