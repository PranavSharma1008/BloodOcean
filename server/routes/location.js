const express = require('express');
const router = express.Router();
const { updateLocation } = require('../controllers/locationController');
const protect = require('../middleware/auth');

router.put('/location', protect, updateLocation);

module.exports = router;
