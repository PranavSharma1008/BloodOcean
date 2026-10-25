const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const formatUser = require('../utils/formatUser');
const sendEmail = require('../utils/sendEmail');
const sendError = require('../utils/sendError');

const GENERIC_AUTH_ERROR = 'Invalid credentials';
const GENERIC_RESET_MESSAGE = 'If an account exists for this email, a reset code has been sent.';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Unable to create account' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: 'user',
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: formatUser(user),
    });
  } catch (error) {
    return sendError(res, error);
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: GENERIC_AUTH_ERROR });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: GENERIC_AUTH_ERROR });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: formatUser(user),
    });
  } catch (error) {
    return sendError(res, error);
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(401).json({ message: 'Not authorized to access this route' });
    }
    res.status(200).json({
      success: true,
      user: formatUser(user),
    });
  } catch (error) {
    return sendError(res, error);
  }
};

const forgotPassword = async (req, res) => {
  try {
    const normalizedEmail = req.body.email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+resetPasswordToken');

    if (!user) {
      return res.status(200).json({
        success: true,
        message: GENERIC_RESET_MESSAGE,
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

    const message = `Your password reset code is: ${otp}\n\nThis code will expire in 15 minutes.`;

    try {
      const sendResult = await sendEmail({
        to: user.email,
        subject: 'Password Reset Code — Blood Ocean',
        text: message,
      });

      if (sendResult?.skipped) {
        await User.updateOne(
          { _id: user._id },
          { $unset: { resetPasswordToken: '', resetPasswordExpire: '' } }
        );
      }
    } catch (emailError) {
      console.error('[EMAIL] Failed to send password reset email');
      await User.updateOne(
        { _id: user._id },
        { $unset: { resetPasswordToken: '', resetPasswordExpire: '' } }
      );
    }

    return res.status(200).json({
      success: true,
      message: GENERIC_RESET_MESSAGE,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, token, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();
    const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');

    const user = await User.findOne({
      email: normalizedEmail,
      resetPasswordToken: tokenHash,
      resetPasswordExpire: { $gt: Date.now() },
    }).select('+resetPasswordToken +resetPasswordExpire +password');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request',
      });
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
    return sendError(res, error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
};
