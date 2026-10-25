const { body } = require('express-validator');

const passwordRules = body('password')
  .isString()
  .isLength({ min: 8, max: 128 })
  .matches(/[A-Za-z]/)
  .matches(/\d/);

const registerValidators = [
  body('name').isString().trim().isLength({ min: 2, max: 80 }),
  body('email').isEmail().normalizeEmail(),
  passwordRules,
];

const loginValidators = [
  body('email').isEmail().normalizeEmail(),
  body('password').isString().isLength({ min: 1, max: 128 }),
];

const forgotPasswordValidators = [
  body('email').isEmail().normalizeEmail(),
];

const resetPasswordValidators = [
  body('email').isEmail().normalizeEmail(),
  body('token').isString().trim().isLength({ min: 4, max: 64 }),
  passwordRules,
];

module.exports = {
  registerValidators,
  loginValidators,
  forgotPasswordValidators,
  resetPasswordValidators,
};
