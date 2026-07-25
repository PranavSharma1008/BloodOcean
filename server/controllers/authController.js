const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const formatUser = require('../utils/formatUser');
const sendEmail = require('../utils/sendEmail');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user (role always defaults to 'user' — admin must be set in DB)
    const user = await User.create({
      name,
      email,
      password,
      role: 'user',
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: formatUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: formatUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      user: formatUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send reset password OTP email
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Please provide an email' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+resetPasswordToken');
    
    // Strict existence check: If user does not exist, ask them to sign up first
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'You do not have an account yet. Please sign up and create an account first.',
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          resetPasswordToken: otpHash,
          resetPasswordExpire: new Date(Date.now() + 15 * 60 * 1000),
        },
      }
    );

    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV] Password reset OTP for ${normalizedEmail}: ${otp}`);
    }

    const message = `Your password reset code is: ${otp}\n\nThis code will expire in 15 minutes. Check your SPAM / Junk folder if not found in Inbox.`;

    try {
      const sendResult = await sendEmail({
        to: user.email,
        subject: 'Password Reset Code — Blood Ocean',
        text: message,
      });

      if (sendResult?.skipped) {
        await User.updateOne(
          { _id: user._id },
          {
            $unset: { resetPasswordToken: '', resetPasswordExpire: '' },
          }
        );
        return res.status(500).json({
          success: false,
          message: 'Email service is not configured on the server. Please contact support.',
        });
      }
    } catch (emailError) {
      console.error('[EMAIL] Failed to send password reset email:', emailError.message);

      await User.updateOne(
        { _id: user._id },
        {
          $unset: { resetPasswordToken: '', resetPasswordExpire: '' },
        }
      );

      let hint = '';
      const svc = (process.env.EMAIL_SERVICE || '').toLowerCase();
      if (svc === 'gmail') {
        hint = ' For Gmail: enable 2FA and use a 16-character App Password (not your regular password). Generate one at https://myaccount.google.com/apppasswords';
      } else if (svc === 'sendgrid') {
        hint = ' For SendGrid: ensure EMAIL_PASS is set to a valid SendGrid API key (SG.xxxx). Verify sender email is authorized in SendGrid dashboard.';
      } else if (svc === 'resend') {
        hint = ' For Resend: ensure EMAIL_PASS is set to a valid Resend API key. Verify your domain in Resend dashboard.';
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to send reset code.' + hint,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Check in your SPAM folder.',
    });
  } catch (error) {
    console.error('[EMAIL] forgotPassword error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reset user's password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { email, token, password } = req.body;
    if (!email || !token || !password) {
      return res.status(400).json({ message: 'Email, code, and new password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');

    // Strict Security Verification: Must match exact target email and active reset token
    const user = await User.findOne({
      email: normalizedEmail,
      resetPasswordToken: tokenHash,
      resetPasswordExpire: { $gt: Date.now() },
    }).select('+resetPasswordToken +resetPasswordExpire +password');

    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: 'Security Violation: Invalid or expired reset code for this email address.' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully.',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Test email configuration
// @route   POST /api/auth/test-email
// @access  Public (but requires secret key to prevent abuse)
const testEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Please provide an email address' });
    }

    if (!process.env.EMAIL_HOST && !process.env.EMAIL_SERVICE) {
      return res.status(400).json({
        success: false,
        message: 'No email transport configured. Set EMAIL_HOST or EMAIL_SERVICE in .env',
      });
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(400).json({
        success: false,
        message: 'EMAIL_USER or EMAIL_PASS is missing in .env',
      });
    }

    await sendEmail({
      to: email,
      subject: 'Test Email — Blood Ocean',
      text: 'Your email configuration is working correctly! This is a test from Blood Ocean.',
    });

    res.json({ success: true, message: `Test email sent to ${email}. Check your inbox (and spam folder).` });
  } catch (error) {
    console.error('[EMAIL] Test failed:', error.message);
    res.status(500).json({
      success: false,
      message: `Email test failed: ${error.message}`,
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  testEmail,
};
