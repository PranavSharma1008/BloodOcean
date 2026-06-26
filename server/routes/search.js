const express = require('express');
const router = express.Router();
const { searchNearbyDonors } = require('../controllers/searchController');
const protect = require('../middleware/auth');

router.get('/nearby', protect, searchNearbyDonors);

module.exports = router;
