const express = require('express');
const router = express.Router();
const { register, login, getMe, forgotPassword, resetPassword, testEmail } = require('../controllers/authController');
const protect = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/test-email', testEmail);
router.get('/me', protect, getMe);

module.exports = router;
