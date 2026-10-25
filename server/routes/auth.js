const express = require('express');
const router = express.Router();
const { register, login, getMe, forgotPassword, resetPassword } = require('../controllers/authController');
const protect = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  registerValidators,
  loginValidators,
  forgotPasswordValidators,
  resetPasswordValidators,
} = require('../middleware/authValidators');

router.post('/register', registerValidators, validate, register);
router.post('/login', loginValidators, validate, login);
router.post('/forgot-password', forgotPasswordValidators, validate, forgotPassword);
router.post('/reset-password', resetPasswordValidators, validate, resetPassword);
router.get('/me', protect, getMe);

module.exports = router;
