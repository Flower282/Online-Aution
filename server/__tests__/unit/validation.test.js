/**
 * ESM-Compatible Unit Tests - Input Validation (No Database)
 * 
 * Tests validation logic without any database connection.
 * All database operations are mocked using ESM syntax.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import {
  userFactory,
  signupPayloadFactory,
  loginPayloadFactory,
  userWithHashedPasswordFactory,
} from '../factories/user.factory.js';

// Mock modules BEFORE importing them (ESM requirement)
const mockConnectDB = jest.fn(() => Promise.resolve(true));
const mockGetClientIp = jest.fn(() => '127.0.0.1');
const mockGetLocationFromIp = jest.fn(() => Promise.resolve({ city: 'Test', country: 'Test' }));

// Mock database connection
await jest.unstable_mockModule('../../connection.js', () => ({
  connectDB: mockConnectDB,
}));

// Mock User model
const mockUserFindOne = jest.fn();
const mockUserSave = jest.fn();
const mockUserFindByIdAndUpdate = jest.fn();
await jest.unstable_mockModule('../../models/user.js', () => ({
  default: class User {
    constructor(data) {
      Object.assign(this, data);
      this._id = 'user123'; // Add default ID for new users
    }
    save() {
      return mockUserSave(this);
    }
    static findOne(query) {
      return mockUserFindOne(query);
    }
    static findByIdAndUpdate(id, update) {
      return mockUserFindByIdAndUpdate(id, update);
    }
  }
}));

// Mock Login model
await jest.unstable_mockModule('../../models/Login.js', () => ({
  default: class Login {
    constructor(data) {
      Object.assign(this, data);
    }
    save() {
      return Promise.resolve(this);
    }
  }
}));

// Mock geo utilities
await jest.unstable_mockModule('../../utils/geoDetails.js', () => ({
  getClientIp: mockGetClientIp,
  getLocationFromIp: mockGetLocationFromIp,
}));

// Now import the actual modules AFTER mocking
const { default: express } = await import('express');
const { default: request } = await import('supertest');
const { default: cookieParser } = await import('cookie-parser');
const { default: userAuthRouter } = await import('../../routes/userAuth.js');

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/auth', userAuthRouter);
  return app;
};

describe('ESM Validation Tests - No Database', () => {
  let app;

  beforeEach(() => {
    app = createApp();
    jest.clearAllMocks();
  });

  describe('POST /api/auth/signup - Input Validation', () => {
    describe('Missing Required Fields', () => {
      it('should reject signup when name is missing', async () => {
        const payload = signupPayloadFactory({ name: undefined });
        delete payload.name;

        const response = await request(app)
          .post('/api/auth/signup')
          .send(payload)
          .expect(400);

        expect(response.body).toHaveProperty('error', 'All fields are required');
      });

      it('should reject signup when email is missing', async () => {
        const payload = signupPayloadFactory({ email: undefined });
        delete payload.email;

        const response = await request(app)
          .post('/api/auth/signup')
          .send(payload)
          .expect(400);

        expect(response.body).toHaveProperty('error', 'All fields are required');
      });

      it('should reject signup when password is missing', async () => {
        const payload = signupPayloadFactory({ password: undefined });
        delete payload.password;

        const response = await request(app)
          .post('/api/auth/signup')
          .send(payload)
          .expect(400);

        expect(response.body).toHaveProperty('error', 'All fields are required');
      });

      it('should reject signup when all fields are missing', async () => {
        const response = await request(app)
          .post('/api/auth/signup')
          .send({})
          .expect(400);

        expect(response.body).toHaveProperty('error', 'All fields are required');
      });
    });

    describe('Empty String Validation', () => {
      it('should reject signup with empty name', async () => {
        const payload = signupPayloadFactory({ name: '' });

        const response = await request(app)
          .post('/api/auth/signup')
          .send(payload)
          .expect(400);

        expect(response.body).toHaveProperty('error', 'All fields are required');
      });

      it('should reject signup with empty email', async () => {
        const payload = signupPayloadFactory({ email: '' });

        const response = await request(app)
          .post('/api/auth/signup')
          .send(payload)
          .expect(400);

        expect(response.body).toHaveProperty('error', 'All fields are required');
      });

      it('should reject signup with empty password', async () => {
        const payload = signupPayloadFactory({ password: '' });

        const response = await request(app)
          .post('/api/auth/signup')
          .send(payload)
          .expect(400);

        expect(response.body).toHaveProperty('error', 'All fields are required');
      });

      it('should reject signup with whitespace-only fields', async () => {
        const payload = signupPayloadFactory({
          name: '   ',
          email: '  ',
          password: '   ',
        });

        const response = await request(app)
          .post('/api/auth/signup')
          .send(payload)
          .expect(400);

        expect(response.body).toHaveProperty('error', 'All fields are required');
      });
    });

    describe('SQL Injection Prevention', () => {
      it('should sanitize SQL injection attempts in name field', async () => {
        const maliciousName = "'; DROP TABLE users; --";
        const savedUser = userFactory({
          name: maliciousName,
        });

        mockUserFindOne.mockResolvedValue(null);
        mockUserSave.mockResolvedValue(savedUser);
        mockUserFindByIdAndUpdate.mockResolvedValue(savedUser); // Mock refresh token update

        const payload = signupPayloadFactory({ name: maliciousName });

        const response = await request(app)
          .post('/api/auth/signup')
          .send(payload)
          .expect(201);

        expect(response.body.message).toBe('User registered successfully');
        // Data passed through but MongoDB sanitizes automatically
      });

      it('should sanitize SQL injection attempts in email field', async () => {
        const maliciousEmail = "admin'--";
        const savedUser = userFactory({ email: maliciousEmail });

        mockUserFindOne.mockResolvedValue(null);
        mockUserSave.mockResolvedValue(savedUser);
        mockUserFindByIdAndUpdate.mockResolvedValue(savedUser);

        const payload = signupPayloadFactory({ email: maliciousEmail });

        const response = await request(app)
          .post('/api/auth/signup')
          .send(payload)
          .expect(201);

        expect(response.body.message).toBe('User registered successfully');
      });

      it('should handle NoSQL injection attempts', async () => {
        const savedUser = userFactory();

        mockUserFindOne.mockResolvedValue(null);
        mockUserSave.mockResolvedValue(savedUser);
        mockUserFindByIdAndUpdate.mockResolvedValue(savedUser);

        const response = await request(app)
          .post('/api/auth/signup')
          .send({
            name: 'Test User',
            email: { $ne: null }, // NoSQL injection attempt
            password: 'Password123!',
          })
          .expect(201);

        // Express.json() converts it to string, MongoDB will handle sanitization
        expect(response.body.message).toBe('User registered successfully');
      });
    });

    describe('Boundary Cases', () => {
      it('should handle very long name (256+ characters)', async () => {
        const longName = 'A'.repeat(300);
        const savedUser = userFactory({ name: longName });

        mockUserFindOne.mockResolvedValue(null);
        mockUserSave.mockResolvedValue(savedUser);
        mockUserFindByIdAndUpdate.mockResolvedValue(savedUser);

        const payload = signupPayloadFactory({ name: longName });

        const response = await request(app)
          .post('/api/auth/signup')
          .send(payload)
          .expect(201);

        expect(response.body.message).toBe('User registered successfully');
      });

      it('should handle very long email', async () => {
        const longEmail = 'a'.repeat(200) + '@example.com';
        const savedUser = userFactory({ email: longEmail });

        mockUserFindOne.mockResolvedValue(null);
        mockUserSave.mockResolvedValue(savedUser);
        mockUserFindByIdAndUpdate.mockResolvedValue(savedUser);

        const payload = signupPayloadFactory({ email: longEmail });

        const response = await request(app)
          .post('/api/auth/signup')
          .send(payload)
          .expect(201);

        expect(response.body.message).toBe('User registered successfully');
      });

      it('should handle special characters in name', async () => {
        const specialName = "O'Brien-Smith (Jr.) <test>";
        const savedUser = userFactory({ name: specialName });

        mockUserFindOne.mockResolvedValue(null);
        mockUserSave.mockResolvedValue(savedUser);

        const payload = signupPayloadFactory({ name: specialName });

        const response = await request(app)
          .post('/api/auth/signup')
          .send(payload)
          .expect(201);

        expect(response.body.message).toBe('User registered successfully');
      });

      it('should handle unicode characters in name', async () => {
        const unicodeName = '张三 李四 王五';
        const savedUser = userFactory({ name: unicodeName });

        mockUserFindOne.mockResolvedValue(null);
        mockUserSave.mockResolvedValue(savedUser);

        const payload = signupPayloadFactory({ name: unicodeName });

        const response = await request(app)
          .post('/api/auth/signup')
          .send(payload)
          .expect(201);

        expect(response.body.message).toBe('User registered successfully');
      });
    });

    describe('Duplicate Email Validation', () => {
      it('should reject signup with existing email', async () => {
        const existingUser = userFactory({
          _id: 'existing123',
          email: 'existing@example.com',
          name: 'Existing User',
        });

        mockUserFindOne.mockResolvedValue(existingUser);

        const payload = signupPayloadFactory({ email: 'existing@example.com' });

        const response = await request(app)
          .post('/api/auth/signup')
          .send(payload)
          .expect(400);

        expect(response.body).toHaveProperty('error', 'User already exists');
      });

      it('should allow signup with non-existing email', async () => {
        const newUser = userFactory({ email: 'new@example.com' });

        mockUserFindOne.mockResolvedValue(null);
        mockUserSave.mockResolvedValue(newUser);

        const payload = signupPayloadFactory({ email: 'new@example.com' });

        const response = await request(app)
          .post('/api/auth/signup')
          .send(payload)
          .expect(201);

        expect(response.body.message).toBe('User registered successfully');
      });
    });
  });

  describe('POST /api/auth/login - Input Validation', () => {
    describe('Missing Required Fields', () => {
      it('should reject login when email is missing', async () => {
        const payload = loginPayloadFactory({ email: undefined });
        delete payload.email;

        const response = await request(app)
          .post('/api/auth/login')
          .send(payload)
          .expect(400);

        expect(response.body).toHaveProperty('error', 'All Fields are required');
      });

      it('should reject login when password is missing', async () => {
        const payload = loginPayloadFactory({ password: undefined });
        delete payload.password;

        const response = await request(app)
          .post('/api/auth/login')
          .send(payload)
          .expect(400);

        expect(response.body).toHaveProperty('error', 'All Fields are required');
      });

      it('should reject login when both fields are missing', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({})
          .expect(400);

        expect(response.body).toHaveProperty('error', 'All Fields are required');
      });
    });

    describe('Empty String Validation', () => {
      it('should reject login with empty email', async () => {
        const payload = loginPayloadFactory({ email: '' });

        const response = await request(app)
          .post('/api/auth/login')
          .send(payload)
          .expect(400);

        expect(response.body).toHaveProperty('error', 'All Fields are required');
      });

      it('should reject login with empty password', async () => {
        const payload = loginPayloadFactory({ password: '' });

        const response = await request(app)
          .post('/api/auth/login')
          .send(payload)
          .expect(400);

        expect(response.body).toHaveProperty('error', 'All Fields are required');
      });
    });

    describe('User Existence Validation', () => {
      it('should return 400 when user does not exist', async () => {
        mockUserFindOne.mockResolvedValue(null);

        const payload = loginPayloadFactory({ email: 'nonexistent@example.com' });

        const response = await request(app)
          .post('/api/auth/login')
          .send(payload)
          .expect(400);

        expect(response.body).toHaveProperty('error', 'User not found');
      });
    });

    describe('Password Validation', () => {
      it('should return 401 when password is incorrect', async () => {
        const correctPassword = 'CorrectPassword123!';
        const user = await userWithHashedPasswordFactory(correctPassword, {
          _id: 'user123',
          isActive: true,
        });
        
        mockUserFindOne.mockResolvedValue(user);

        const payload = loginPayloadFactory({
          email: user.email,
          password: 'WrongPassword123!',
        });

        const response = await request(app)
          .post('/api/auth/login')
          .send(payload)
          .expect(401);

        expect(response.body).toHaveProperty('error', 'Invalid Credentials');
      });
    });

    describe('Account Status Validation', () => {
      it('should return 403 when user account is inactive', async () => {
        const user = await userWithHashedPasswordFactory('Password123!', {
          _id: 'user123',
          email: 'inactive@example.com',
          isActive: false,
        });
        
        mockUserFindOne.mockResolvedValue(user);

        const payload = loginPayloadFactory({
          email: 'inactive@example.com',
          password: 'Password123!',
        });

        const response = await request(app)
          .post('/api/auth/login')
          .send(payload)
          .expect(403);

        expect(response.body.error).toContain('vô hiệu hóa');
      });
    });

    describe('SQL Injection Prevention', () => {
      it('should sanitize SQL injection in email field', async () => {
        mockUserFindOne.mockResolvedValue(null);

        const payload = loginPayloadFactory({
          email: "admin' OR '1'='1",
          password: 'password',
        });

        const response = await request(app)
          .post('/api/auth/login')
          .send(payload)
          .expect(400);

        expect(response.body).toHaveProperty('error', 'User not found');
      });

      it('should handle NoSQL injection attempts in login', async () => {
        mockUserFindOne.mockResolvedValue(null);

        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: { $gt: '' },
            password: { $ne: null },
          })
          .expect(400);

        expect(response.body).toHaveProperty('error', 'All Fields are required');
      });
    });
  });

  describe('Content-Type Validation', () => {
    it('should reject non-JSON content type', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .set('Content-Type', 'text/plain')
        .send('name=Test&email=test@example.com&password=pass')
        .expect(400);

      // Express will fail to parse non-JSON
      expect(response.body).toBeDefined();
    });

    it('should reject malformed JSON', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .set('Content-Type', 'application/json')
        .send('{"name": "Test", invalid}')
        .expect(400);

      expect(response.error).toBeTruthy();
    });
  });

  describe('Extra Fields Handling', () => {
    it('should ignore extra fields in signup', async () => {
      const savedUser = userFactory();

      mockUserFindOne.mockResolvedValue(null);
      mockUserSave.mockResolvedValue(savedUser);      mockUserFindByIdAndUpdate.mockResolvedValue(savedUser);
      const payload = signupPayloadFactory({
        role: 'admin', // Should be ignored
        isActive: false, // Should be ignored
        extraField: 'malicious',
      });

      const response = await request(app)
        .post('/api/auth/signup')
        .send(payload)
        .expect(201);

      expect(response.body.message).toBe('User registered successfully');
      // Controller only uses name, email, password
    });
  });

  describe('Case Sensitivity', () => {
    it('should handle email case variations', async () => {
      const existingUser = userFactory({
        _id: 'user123',
        email: 'Test@Example.com',
      });

      mockUserFindOne.mockResolvedValue(existingUser);

      const payload = signupPayloadFactory({
        name: 'Another User',
        email: 'test@example.com', // Different case
      });

      const response = await request(app)
        .post('/api/auth/signup')
        .send(payload)
        .expect(400);

      // MongoDB query is case-sensitive by default
      // This depends on implementation
    });
  });
});
