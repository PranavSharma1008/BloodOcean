const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'a_very_strong_and_secure_test_jwt_secret_with_32_plus_chars';
process.env.JWT_EXPIRE = '1h';
process.env.FRONTEND_URL = 'http://localhost:3000';

const { app } = require('../server');
const protect = require('../middleware/auth');
const admin = require('../middleware/admin');
const User = require('../models/User');
const sendError = require('../utils/sendError');

afterAll(async () => {
  await mongoose.disconnect();
});

describe('Security & Authentication Test Suite', () => {
  describe('1. Security Headers & Policy Verification', () => {
    test('should include all required OWASP security headers', async () => {
      const res = await request(app).get('/');

      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-frame-options']).toBe('DENY');
      expect(res.headers['permissions-policy']).toBe('camera=(), microphone=(), geolocation=(self)');
      expect(res.headers['content-security-policy']).toBeDefined();
      expect(res.headers['content-security-policy']).toContain("default-src 'self'");
      expect(res.headers['content-security-policy']).toContain("frame-ancestors 'none'");
      expect(res.headers['x-powered-by']).toBeUndefined();
    });

    test('should enforce CORS controls', async () => {
      const resDisallowed = await request(app)
        .get('/')
        .set('Origin', 'http://malicious-site.com');

      expect([403, 500]).toContain(resDisallowed.status);

      const resAllowed = await request(app)
        .get('/')
        .set('Origin', 'http://localhost:3000');

      expect(resAllowed.status).toBe(200);
      expect(resAllowed.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    });
  });

  describe('2. Authentication & Admin Authorization Middleware', () => {
    test('protect middleware should reject requests without token with 401', async () => {
      const req = { headers: {} };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Not authorized to access this route' });
      expect(next).not.toHaveBeenCalled();
    });

    test('protect middleware should reject invalid tokens with 401', async () => {
      const req = { headers: { authorization: 'Bearer invalid.token.here' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Not authorized to access this route' });
      expect(next).not.toHaveBeenCalled();
    });

    test('admin middleware should reject non-admin users with 403 Access denied', () => {
      const req = { user: { id: 'user123', role: 'user' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      admin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Access denied' });
      expect(next).not.toHaveBeenCalled();
    });

    test('admin middleware should allow users with role admin', () => {
      const req = { user: { id: 'admin123', role: 'admin' } };
      const res = {};
      const next = jest.fn();

      admin(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('3. Password Encryption & Hashing Security', () => {
    test('should properly hash passwords with bcrypt salt rounds = 12', async () => {
      const plainPassword = 'StrongPassword123!';
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(plainPassword, salt);

      // Verify hash format (bcrypt prefix $2a$ or $2b$)
      expect(hashedPassword).toMatch(/^\$2[ab]\$12\$/);

      // Verify correct password matches
      const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
      expect(isMatch).toBe(true);

      // Verify wrong password fails
      const wrongMatch = await bcrypt.compare('WrongPassword', hashedPassword);
      expect(wrongMatch).toBe(false);
    });

    test('User schema methods.matchPassword should accurately compare entered password', async () => {
      const user = new User({
        name: 'Test Donor',
        email: 'testdonor@example.com',
        password: 'DonorPassword123',
      });

      // Manually trigger pre-save hashing
      const salt = await bcrypt.genSalt(12);
      user.password = await bcrypt.hash(user.password, salt);

      expect(await user.matchPassword('DonorPassword123')).toBe(true);
      expect(await user.matchPassword('WrongOne')).toBe(false);
    });
  });

  describe('4. Input Validation & Error Handling (Information Disclosure Prevention)', () => {
    test('registration should reject passwords shorter than 8 characters', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'pass',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid request');
    });

    test('registration should reject passwords without numeric characters', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'purealphabetpassword',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid request');
    });

    test('registration should reject invalid emails', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'not-an-email',
          password: 'Password123',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid request');
    });

    test('sendError should convert CastError into 400 Invalid ID format', () => {
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const castError = new mongoose.Error.CastError('ObjectId', 'not-a-valid-id', 'id');

      sendError(res, castError);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid ID format' });
    });

    test('sendError should convert duplicate key error (11000) into 400 Invalid request', () => {
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const duplicateError = new Error('E11000 duplicate key');
      duplicateError.code = 11000;

      sendError(res, duplicateError);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid request' });
    });

    test('sendError should sanitize general unexpected errors into generic message without stack leak', () => {
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const secretDbError = new Error('FATAL: connection to 10.0.0.5:27017 refused with root credentials');

      sendError(res, secretDbError);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Request could not be completed' });
    });
  });

  describe('5. JWT Secret Enforcement & Token Security', () => {
    test('should generate and verify signed JWT with expiration', () => {
      const payload = { id: '507f1f77bcf86cd799439011', role: 'user' };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.id).toBe(payload.id);
      expect(decoded.role).toBe(payload.role);
      expect(decoded.exp).toBeDefined();
    });

    test('should reject tokens signed with different or tampered secret', () => {
      const payload = { id: '507f1f77bcf86cd799439011' };
      const fakeToken = jwt.sign(payload, 'wrong_secret_key_12345678901234567890');

      expect(() => {
        jwt.verify(fakeToken, process.env.JWT_SECRET);
      }).toThrow();
    });
  });
});
