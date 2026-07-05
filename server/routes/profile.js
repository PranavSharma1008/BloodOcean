const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, updateAvatar, removeAvatar, getPublicProfile } = require('../controllers/profileController');
const protect = require('../middleware/auth');

router.get('/', protect, getProfile);
router.put('/', protect, updateProfile);
router.put('/avatar', protect, updateAvatar);
router.delete('/avatar', protect, removeAvatar);
router.get('/:id', protect, getPublicProfile);

module.exports = router;
