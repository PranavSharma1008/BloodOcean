const express = require('express');
const router = express.Router();
const {
  createDonation,
  getDonations,
  getDonationById,
  deleteDonation,
} = require('../controllers/donationController');
const protect = require('../middleware/auth');

router.route('/').get(protect, getDonations).post(protect, createDonation);
router.route('/:id').get(protect, getDonationById).delete(protect, deleteDonation);

module.exports = router;
