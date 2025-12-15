/**
 * ESM-Compatible Unit Tests - Error Handling (No Database)
 * 
 * Tests HTTP error responses: 400, 401, 403, 404, 500
 * All database operations are mocked using ESM syntax.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import {
  userFactory,
  signupPayloadFactory,
  loginPayloadFactory,
  passwordChangePayloadFactory,
  userWithHashedPasswordFactory,
  inactiveUserFactory,
} from '../factories/user.factory.js';
import {
  tokenFactory,
  adminTokenFactory,
  expiredTokenFactory,
  invalidTokenFactory,
  tamperedTokenFactory,
} from '../factories/token.factory.js';
import { productFactory } from '../factories/product.factory.js';

// Mock modules BEFORE importing
const mockConnectDB = jest.fn(() => Promise.resolve(true));
await jest.unstable_mockModule('../../connection.js', () => ({
  connectDB: mockConnectDB,
}));

// Mock User model
const mockUserFindOne = jest.fn();
const mockUserFindById = jest.fn();
const mockUserSave = jest.fn();
await jest.unstable_mockModule('../../models/user.js', () => ({
  default: class User {
    constructor(data) {
      Object.assign(this, data);
    }
    save() {
      return mockUserSave(this);
    }
    static findOne(query) {
      return mockUserFindOne(query);
    }
    static findById(id) {
      return mockUserFindById(id);
    }
  }
}));

// Mock Product model
const mockProductFind = jest.fn();
const mockProductFindById = jest.fn();
const mockProductSave = jest.fn();
await jest.unstable_mockModule('../../models/product.js', () => ({
  default: class Product {
    constructor(data) {
      Object.assign(this, data);
    }
    save() {
      return mockProductSave(this);
    }
    static find(query) {
      return mockProductFind(query);
    }
    static findById(id) {
      return mockProductFindById(id);
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
  getClientIp: jest.fn(() => '127.0.0.1'),
  getLocationFromIp: jest.fn(() => Promise.resolve({ city: 'Test', country: 'Test' })),
}));

// Mock cloudinary
await jest.unstable_mockModule('../../services/cloudinaryService.js', () => ({
  default: jest.fn(() => Promise.resolve('https://example.com/image.jpg')),
}));

// Import modules AFTER mocking
const { default: express } = await import('express');
const { default: request } = await import('supertest');
const { default: cookieParser } = await import('cookie-parser');
const { default: jwt } = await import('jsonwebtoken');
const { default: bcrypt } = await import('bcrypt');
const { default: userAuthRouter } = await import('../../routes/userAuth.js');
const { default: auctionRouter } = await import('../../routes/auction.js');
const { default: userRouter } = await import('../../routes/user.js');
const { secureRoute } = await import('../../middleware/auth.js');

process.env.JWT_SECRET = 'test-secret';

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  
  app.use('/api/auth', userAuthRouter);
  app.use('/api/user', secureRoute, userRouter);
  app.use('/api/auction', secureRoute, auctionRouter);
  
  return app;
};

describe('ESM HTTP Error Handling - No Database', () => {
  let app;

  beforeEach(() => {
    app = createApp();
    jest.clearAllMocks();
  });

  describe('400 Bad Request - Validation Errors', () => {
    describe('Missing Required Fields', () => {
      it('should return 400 for signup with missing name', async () => {
        const payload = signupPayloadFactory({ name: undefined });
        delete payload.name;

        const response = await request(app)
          .post('/api/auth/signup')
          .send(payload)
          .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('required');
      });

      it('should return 400 for signup with missing email', async () => {
        const payload = signupPayloadFactory({ email: undefined });
        delete payload.email;

        const response = await request(app)
          .post('/api/auth/signup')
          .send(payload)
          .expect(400);

        expect(response.body.error).toContain('required');
      });

      it('should return 400 for login with missing credentials', async () => {
        const payload = loginPayloadFactory({ password: undefined });
        delete payload.password;

        const response = await request(app)
          .post('/api/auth/login')
          .send(payload)
          .expect(400);

        expect(response.body.error).toContain('required');
      });

      it('should return 400 for password change with missing fields', async () => {
        const token = tokenFactory();
        const payload = passwordChangePayloadFactory({ newPassword: undefined, confirmPassword: undefined });
        delete payload.newPassword;
        delete payload.confirmPassword;

        const response = await request(app)
          .patch('/api/user')
          .set('Cookie', `auth_token=${token}`)
          .send(payload)
          .expect(400);

        expect(response.body.error).toContain('fields');
      });
    });

    describe('Invalid Data Format', () => {
      it('should return 400 for non-existent user in login', async () => {
        mockUserFindOne.mockResolvedValue(null);

        const payload = loginPayloadFactory({ email: 'nonexistent@example.com' });

        const response = await request(app)
          .post('/api/auth/login')
          .send(payload)
          .expect(400);

        expect(response.body.error).toBe('User not found');
      });

      it('should return 400 for duplicate email in signup', async () => {
        const existingUser = userFactory({ email: 'exists@example.com' });
        mockUserFindOne.mockResolvedValue(existingUser);

        const payload = signupPayloadFactory({ email: 'exists@example.com' });

        const response = await request(app)
          .post('/api/auth/signup')
          .send(payload)
          .expect(400);

        expect(response.body.error).toBe('User already exists');
      });

      it('should return 400 for password mismatch', async () => {
        const token = tokenFactory();
        const user = userFactory({ password: 'hashed' });
        mockUserFindById.mockResolvedValue(user);

        const payload = passwordChangePayloadFactory({
          newPassword: 'new1',
          confirmPassword: 'new2',
        });

        const response = await request(app)
          .patch('/api/user')
          .set('Cookie', `auth_token=${token}`)
          .send(payload)
          .expect(400);

        expect(response.body.error).toContain('do not match');
      });

      it('should return 400 for reusing old password', async () => {
        const token = tokenFactory();
        const user = userFactory({ password: 'hashed' });
        mockUserFindById.mockResolvedValue(user);

        const payload = passwordChangePayloadFactory({
          currentPassword: 'password',
          newPassword: 'password',
          confirmPassword: 'password',
        });

        const response = await request(app)
          .patch('/api/user')
          .set('Cookie', `auth_token=${token}`)
          .send(payload)
          .expect(400);

        expect(response.body.error).toContain("can't reuse");
      });
    });

    describe('Malformed Requests', () => {
      it('should handle malformed JSON gracefully', async () => {
        const response = await request(app)
          .post('/api/auth/signup')
          .set('Content-Type', 'application/json')
          .send('{"invalid": json}')
          .expect(400);

        expect(response.error).toBeTruthy();
      });

      it('should handle empty request body', async () => {
        const response = await request(app)
          .post('/api/auth/signup')
          .send({})
          .expect(400);

        expect(response.body.error).toBeDefined();
      });
    });
  });

  describe('401 Unauthorized - Authentication Errors', () => {
    describe('Missing Authentication', () => {
      it('should return 401 when accessing protected route without token', async () => {
        const response = await request(app)
          .get('/api/user')
          .expect(401);

        expect(response.body).toHaveProperty('error', 'Unauthorized');
        expect(response.body).toHaveProperty('code', 'TOKEN_MISSING');
      });

      it('should return 401 for auction list without authentication', async () => {
        const response = await request(app)
          .get('/api/auction')
          .expect(401);

        expect(response.body.error).toBe('Unauthorized');
        expect(response.body.code).toBe('TOKEN_MISSING');
      });

      it('should return 401 for creating auction without auth', async () => {
        const response = await request(app)
          .post('/api/auction')
          .send({ itemName: 'Test' })
          .expect(401);

        expect(response.body.error).toBe('Unauthorized');
        expect(response.body.code).toBe('TOKEN_MISSING');
      });
    });

    describe('Invalid Token', () => {
      it('should return 401 for invalid JWT token', async () => {
        const invalidToken = 'invalid.token.here';

        const response = await request(app)
          .get('/api/user')
          .set('Cookie', `auth_token=${invalidToken}`)
          .expect(401);

        expect(response.body.error).toBe('Invalid token');
        expect(response.body.code).toBe('TOKEN_INVALID');
      });

      it('should return 401 for expired JWT token', async () => {
        const expiredToken = expiredTokenFactory();

        const response = await request(app)
          .get('/api/user')
          .set('Cookie', `auth_token=${expiredToken}`)
          .expect(401);

        expect(response.body.error).toBe('Access token expired');
        expect(response.body.code).toBe('TOKEN_EXPIRED');
      });

      it('should return 401 for tampered JWT token', async () => {
        const tamperedToken = tamperedTokenFactory();

        const response = await request(app)
          .get('/api/user')
          .set('Cookie', `auth_token=${tamperedToken}`)
          .expect(401);

        expect(response.body.error).toBe('Invalid token');
        expect(response.body.code).toBe('TOKEN_INVALID');
      });

      it('should return 401 for token with wrong signature', async () => {
        const wrongToken = invalidTokenFactory();

        const response = await request(app)
          .get('/api/user')
          .set('Cookie', `auth_token=${wrongToken}`)
          .expect(401);

        expect(response.body.error).toBe('Invalid token');
        expect(response.body.code).toBe('TOKEN_INVALID');
      });
    });

    describe('Invalid Credentials', () => {
      it('should return 401 for incorrect password', async () => {
        const correctPassword = 'correctpass';
        const user = await userWithHashedPasswordFactory(correctPassword, {
          _id: 'user123',
          isActive: true,
        });

        mockUserFindOne.mockResolvedValue(user);

        const payload = loginPayloadFactory({
          email: user.email,
          password: 'wrongpass',
        });

        const response = await request(app)
          .post('/api/auth/login')
          .send(payload)
          .expect(401);

        expect(response.body.error).toBe('Invalid Credentials');
      });

      it('should return 401 for wrong current password in password change', async () => {
        const token = tokenFactory();
        const user = await userWithHashedPasswordFactory('correctpass', {
          _id: 'user123',
        });

        mockUserFindById.mockResolvedValue(user);

        const payload = passwordChangePayloadFactory({
          currentPassword: 'wrongpass',
        });

        const response = await request(app)
          .patch('/api/user')
          .set('Cookie', `auth_token=${token}`)
          .send(payload)
          .expect(401);

        expect(response.body.error).toContain('incorrect');
      });
    });
  });

  describe('403 Forbidden - Authorization Errors', () => {
    describe('Insufficient Permissions', () => {
      it('should return 403 when non-admin tries to delete auction', async () => {
        const userToken = tokenFactory({ role: 'user' });

        const response = await request(app)
          .delete('/api/auction/123')
          .set('Cookie', `auth_token=${userToken}`)
          .expect(403);

        expect(response.body.message).toBe('Access denied. Admins only.');
      });

      it('should return 403 when user without role tries admin action', async () => {
        const token = tokenFactory({ role: undefined });

        const response = await request(app)
          .delete('/api/auction/123')
          .set('Cookie', `auth_token=${token}`)
          .expect(403);

        expect(response.body.message).toContain('Admins only');
      });
    });

    describe('Account Status', () => {
      it('should return 403 for inactive user login', async () => {
        const user = await userWithHashedPasswordFactory('password', {
          email: 'inactive@example.com',
          isActive: false,
        });

        mockUserFindOne.mockResolvedValue(user);

        const payload = loginPayloadFactory({
          email: 'inactive@example.com',
          password: 'password',
        });

        const response = await request(app)
          .post('/api/auth/login')
          .send(payload)
          .expect(403);

        expect(response.body.error).toContain('vô hiệu hóa');
      });
    });

    describe('Role Validation', () => {
      it('should return 403 for uppercase ADMIN role', async () => {
        const token = tokenFactory({ role: 'ADMIN' });

        const response = await request(app)
          .delete('/api/auction/123')
          .set('Cookie', `auth_token=${token}`)
          .expect(403);

        expect(response.body.message).toBe('Access denied. Admins only.');
      });

      it('should return 403 for moderator role', async () => {
        const token = tokenFactory({ role: 'moderator' });

        const response = await request(app)
          .delete('/api/auction/123')
          .set('Cookie', `auth_token=${token}`)
          .expect(403);

        expect(response.body.message).toBe('Access denied. Admins only.');
      });
    });
  });

  describe('404 Not Found - Resource Errors', () => {
    it('should return 404 for non-existent user', async () => {
      const token = tokenFactory({ id: 'nonexistent123' });
      mockUserFindById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/user')
        .set('Cookie', `auth_token=${token}`)
        .expect(404);

      expect(response.body.message).toBe('User not found');
    });

    it('should return 404 for non-existent auction', async () => {
      const token = tokenFactory();
      mockProductFindById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/auction/nonexistent123')
        .set('Cookie', `auth_token=${token}`)
        .expect(404);

      expect(response.body.message).toBe('Auction not found');
    });

    it('should return 404 when user not found in password change', async () => {
      const token = tokenFactory();
      mockUserFindById.mockResolvedValue(null);

      const payload = passwordChangePayloadFactory();

      const response = await request(app)
        .patch('/api/user')
        .set('Cookie', `auth_token=${token}`)
        .send(payload)
        .expect(404);

      expect(response.body.error).toBe('User not found.');
    });
  });

  describe('500 Internal Server Error', () => {
    it('should return 500 when database operation fails', async () => {
      mockUserFindOne.mockRejectedValue(new Error('Database connection failed'));

      const payload = loginPayloadFactory();

      const response = await request(app)
        .post('/api/auth/login')
        .send(payload)
        .expect(500);

      expect(response.body.error).toBeDefined();
    });

    it('should return 500 when user save fails in signup', async () => {
      mockUserFindOne.mockResolvedValue(null);
      mockUserSave.mockRejectedValue(new Error('Save failed'));

      const payload = signupPayloadFactory();

      const response = await request(app)
        .post('/api/auth/signup')
        .send(payload)
        .expect(500);

      expect(response.body.error).toBe('Server error');
    });

    it('should return 500 when auction fetch fails', async () => {
      const token = tokenFactory();
      mockProductFind.mockRejectedValue(new Error('Query failed'));

      const response = await request(app)
        .get('/api/auction')
        .set('Cookie', `auth_token=${token}`)
        .expect(500);

      expect(response.body.message).toContain('Error');
    });

    it('should handle unexpected errors gracefully', async () => {
      const token = tokenFactory();
      mockUserFindById.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const response = await request(app)
        .get('/api/user')
        .set('Cookie', `auth_token=${token}`)
        .expect(500);

      expect(response.body.message).toBe('Server error');
    });
  });

  describe('Error Response Format', () => {
    it('should return consistent error format for 400', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(typeof response.body.error).toBe('string');
    });

    it('should return consistent error format for 401', async () => {
      const response = await request(app)
        .get('/api/user')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('code');
      expect(response.body.error).toBe('Unauthorized');
      expect(response.body.code).toBe('TOKEN_MISSING');
    });

    it('should return consistent error format for 403', async () => {
      const token = tokenFactory({ role: 'user' });

      const response = await request(app)
        .delete('/api/auction/123')
        .set('Cookie', `auth_token=${token}`)
        .expect(403);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Admins only');
    });

    it('should return consistent error format for 404', async () => {
      const token = tokenFactory();
      mockUserFindById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/user')
        .set('Cookie', `auth_token=${token}`)
        .expect(404);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('User not found');
    });

    it('should not expose sensitive information in errors', async () => {
      mockUserFindOne.mockRejectedValue(new Error('Database password is wrong'));

      const payload = loginPayloadFactory();

      const response = await request(app)
        .post('/api/auth/login')
        .send(payload)
        .expect(500);

      // Should not expose database details
      expect(JSON.stringify(response.body)).not.toContain('Database password');
      expect(response.body.error).toBeDefined();
    });
  });

  describe('HTTP Method Validation', () => {
    it('should return appropriate error for unsupported methods', async () => {
      const payload = signupPayloadFactory();

      const response = await request(app)
        .put('/api/auth/signup')
        .send(payload)
        .expect(404);

      // Express returns 404 for undefined routes
    });
  });
});
