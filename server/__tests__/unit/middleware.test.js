/**
 * ESM-Compatible Unit Tests - Authentication Middleware (No Database)
 * 
 * Tests JWT authentication middleware in isolation.
 * No database connection required.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { default as jwt } from 'jsonwebtoken';
import {
  tokenFactory,
  adminTokenFactory,
  expiredTokenFactory,
  invalidTokenFactory,
  tamperedTokenFactory,
  shortLivedTokenFactory,
  malformedTokenFactory,
  tokenPayloadFactory,
} from '../factories/token.factory.js';
import {
  mockRequestFactory,
  mockResponseFactory,
  mockNextFactory,
  middlewareContextFactory,
  authenticatedRequestFactory,
  requestWithUserFactory,
} from '../factories/request.factory.js';

// Mock environment
process.env.JWT_SECRET = 'test-secret-key-for-unit-tests';

// Import middleware after setting up environment
const { secureRoute } = await import('../../middleware/auth.js');
const { checkAdmin } = await import('../../middleware/checkAdmin.js');

describe('ESM Authentication Middleware - No Database', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    const context = middlewareContextFactory();
    mockReq = context.req;
    mockRes = context.res;
    mockNext = context.next;
  });

  describe('secureRoute Middleware', () => {
    describe('Valid Token Cases', () => {
      it('should allow request with valid JWT token', () => {
        const token = tokenFactory();
        mockReq.cookies.auth_token = token;

        secureRoute(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalledTimes(1);
        expect(mockNext).toHaveBeenCalledWith();
        expect(mockReq.user).toBeDefined();
        expect(mockReq.user.id).toBe('user123');
        expect(mockReq.user.role).toBe('user');
        expect(mockRes.status).not.toHaveBeenCalled();
      });

      it('should decode token and attach user data to request', () => {
        const userData = {
          id: 'admin456',
          role: 'admin',
          email: 'admin@example.com',
        };
        const token = tokenFactory(userData, { expiresIn: '1h' });
        mockReq.cookies.auth_token = token;

        secureRoute(mockReq, mockRes, mockNext);

        expect(mockReq.user).toMatchObject({
          id: userData.id,
          role: userData.role,
          email: userData.email,
        });
        expect(mockReq.user).toHaveProperty('iat'); // issued at
        expect(mockReq.user).toHaveProperty('exp'); // expiration
      });

      it('should handle token with minimal data', () => {
        const token = tokenFactory({ id: 'user789', role: undefined, email: undefined });
        mockReq.cookies.auth_token = token;

        secureRoute(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect(mockReq.user.id).toBe('user789');
      });
    });

    describe('Missing Token Cases', () => {
      it('should reject request without auth_token cookie', () => {
        secureRoute(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
        expect(mockNext).not.toHaveBeenCalled();
        expect(mockReq.user).toBeUndefined();
      });

      it('should reject request with empty auth_token', () => {
        mockReq.cookies.auth_token = '';

        secureRoute(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
        expect(mockNext).not.toHaveBeenCalled();
      });

      it('should reject request with null auth_token', () => {
        mockReq.cookies.auth_token = null;

        secureRoute(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
        expect(mockNext).not.toHaveBeenCalled();
      });

      it('should reject request with undefined auth_token', () => {
        mockReq.cookies.auth_token = undefined;

        secureRoute(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockNext).not.toHaveBeenCalled();
      });
    });

    describe('Invalid Token Cases', () => {
      it('should reject malformed JWT token', () => {
        mockReq.cookies.auth_token = malformedTokenFactory();

        secureRoute(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
        expect(mockNext).not.toHaveBeenCalled();
      });

      it('should reject token with invalid signature', () => {
        const token = invalidTokenFactory();
        mockReq.cookies.auth_token = token;

        secureRoute(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
        expect(mockNext).not.toHaveBeenCalled();
      });

      it('should reject completely invalid token string', () => {
        mockReq.cookies.auth_token = 'totally-invalid-token';

        secureRoute(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockNext).not.toHaveBeenCalled();
      });

      it('should reject token with tampered payload', () => {
        const tamperedToken = tamperedTokenFactory();
        mockReq.cookies.auth_token = tamperedToken;

        secureRoute(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockNext).not.toHaveBeenCalled();
      });

      it('should reject token with missing parts', () => {
        mockReq.cookies.auth_token = 'only.two';

        secureRoute(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockNext).not.toHaveBeenCalled();
      });
    });

    describe('Expired Token Cases', () => {
      it('should reject expired JWT token', () => {
        const expiredToken = expiredTokenFactory();
        mockReq.cookies.auth_token = expiredToken;

        secureRoute(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
        expect(mockNext).not.toHaveBeenCalled();
      });

      it('should reject token that just expired', () => {
        // Use fake timers for deterministic time control
        jest.useFakeTimers();
        const now = Date.now();
        jest.setSystemTime(now);

        // Create token that expires in 1 second (expiresIn uses seconds for numbers)
        const token = shortLivedTokenFactory(1);
        
        // Advance time by 2 seconds (2000ms) to ensure token is expired
        jest.advanceTimersByTime(2000);

        mockReq.cookies.auth_token = token;
        secureRoute(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockNext).not.toHaveBeenCalled();

        // Restore real timers
        jest.useRealTimers();
      });
    });

    describe('Token Format Edge Cases', () => {
      it('should reject token with extra whitespace', () => {
        const validToken = jwt.sign({ id: 'user123' }, process.env.JWT_SECRET);
        mockReq.cookies.auth_token = `  ${validToken}  `;

        secureRoute(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockNext).not.toHaveBeenCalled();
      });

      it('should reject Base64-like string that is not JWT', () => {
        mockReq.cookies.auth_token = 'aGVsbG8ud29ybGQ=';

        secureRoute(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockNext).not.toHaveBeenCalled();
      });

      it('should reject token with SQL injection attempt', () => {
        mockReq.cookies.auth_token = "'; DROP TABLE users; --";

        secureRoute(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockNext).not.toHaveBeenCalled();
      });

      it('should handle very long token string', () => {
        mockReq.cookies.auth_token = 'a'.repeat(10000);

        secureRoute(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockNext).not.toHaveBeenCalled();
      });
    });

    describe('Token Payload Validation', () => {
      it('should accept token with valid user ID', () => {
        const token = tokenFactory({ id: '507f1f77bcf86cd799439011' });
        mockReq.cookies.auth_token = token;

        secureRoute(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect(mockReq.user.id).toBe('507f1f77bcf86cd799439011');
      });

      it('should accept token with extra custom fields', () => {
        const token = tokenFactory({
          id: 'user123',
          role: 'user',
          email: 'test@example.com',
          customField: 'custom-value',
        });
        mockReq.cookies.auth_token = token;

        secureRoute(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect(mockReq.user.customField).toBe('custom-value');
      });
    });

    describe('Error Handling', () => {
      it('should handle JSON parse errors gracefully', () => {
        // Create a token with invalid JSON in payload
        const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
        const payload = 'invalid-json-payload';
        const signature = 'signature';
        mockReq.cookies.auth_token = `${header}.${payload}.${signature}`;

        secureRoute(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockNext).not.toHaveBeenCalled();
      });

      it('should not expose secret in error messages', () => {
        mockReq.cookies.auth_token = 'invalid-token';

        secureRoute(mockReq, mockRes, mockNext);

        expect(mockRes.json).toHaveBeenCalled();
        const errorResponse = mockRes.json.mock.calls[0][0];
        expect(JSON.stringify(errorResponse)).not.toContain(process.env.JWT_SECRET);
      });
    });
  });

  describe('checkAdmin Middleware', () => {
    describe('Valid Admin Cases', () => {
      it('should allow request when user has admin role', () => {
        mockReq = requestWithUserFactory({ id: 'admin123', role: 'admin' });

        checkAdmin(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalledTimes(1);
        expect(mockNext).toHaveBeenCalledWith();
        expect(mockRes.status).not.toHaveBeenCalled();
      });

      it('should allow admin with additional user properties', () => {
        mockReq = requestWithUserFactory({
          id: 'admin123',
          role: 'admin',
          email: 'admin@example.com',
          name: 'Admin User',
        });

        checkAdmin(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect(mockRes.status).not.toHaveBeenCalled();
      });
    });

    describe('Non-Admin User Cases', () => {
      it('should reject request when user has user role', () => {
        mockReq = requestWithUserFactory({ id: 'user123', role: 'user' });

        checkAdmin(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockRes.json).toHaveBeenCalledWith({ message: 'Access denied. Admins only.' });
        expect(mockNext).not.toHaveBeenCalled();
      });

      it('should reject request when role is undefined', () => {
        mockReq = requestWithUserFactory({ id: 'user123', role: undefined });

        checkAdmin(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockNext).not.toHaveBeenCalled();
      });

      it('should reject request when role is null', () => {
        mockReq = requestWithUserFactory({ id: 'user123', role: null });

        checkAdmin(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockNext).not.toHaveBeenCalled();
      });

      it('should reject request when role is empty string', () => {
        mockReq = requestWithUserFactory({ id: 'user123', role: '' });

        checkAdmin(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockNext).not.toHaveBeenCalled();
      });
    });

    describe('Missing User Cases', () => {
      it('should reject request when user object is undefined', () => {
        mockReq.user = undefined;

        checkAdmin(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockRes.json).toHaveBeenCalledWith({ message: 'Access denied. Admins only.' });
        expect(mockNext).not.toHaveBeenCalled();
      });

      it('should reject request when user object is null', () => {
        mockReq.user = null;

        checkAdmin(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockNext).not.toHaveBeenCalled();
      });

      it('should reject request when user object is missing', () => {
        // Don't set mockReq.user at all

        checkAdmin(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockNext).not.toHaveBeenCalled();
      });
    });

    describe('Case Sensitivity', () => {
      it('should reject role with uppercase ADMIN', () => {
        mockReq = requestWithUserFactory({ id: 'user123', role: 'ADMIN' });

        checkAdmin(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockNext).not.toHaveBeenCalled();
      });

      it('should reject role with mixed case Admin', () => {
        mockReq = requestWithUserFactory({ id: 'user123', role: 'Admin' });

        checkAdmin(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockNext).not.toHaveBeenCalled();
      });

      it('should reject role with whitespace', () => {
        mockReq = requestWithUserFactory({ id: 'user123', role: ' admin ' });

        checkAdmin(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockNext).not.toHaveBeenCalled();
      });
    });

    describe('Invalid Role Values', () => {
      it('should reject numeric role', () => {
        mockReq = requestWithUserFactory({ id: 'user123', role: 123 });

        checkAdmin(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockNext).not.toHaveBeenCalled();
      });

      it('should reject boolean role', () => {
        mockReq = requestWithUserFactory({ id: 'user123', role: true });

        checkAdmin(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockNext).not.toHaveBeenCalled();
      });

      it('should reject object role', () => {
        mockReq = requestWithUserFactory({ id: 'user123', role: { type: 'admin' } });

        checkAdmin(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockNext).not.toHaveBeenCalled();
      });

      it('should reject array role', () => {
        mockReq = requestWithUserFactory({ id: 'user123', role: ['admin'] });

        checkAdmin(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockNext).not.toHaveBeenCalled();
      });
    });

    describe('Privilege Escalation Attempts', () => {
      it('should not allow moderator role', () => {
        mockReq = requestWithUserFactory({ id: 'user123', role: 'moderator' });

        checkAdmin(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockNext).not.toHaveBeenCalled();
      });

      it('should not allow superuser role', () => {
        mockReq = requestWithUserFactory({ id: 'user123', role: 'superuser' });

        checkAdmin(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockNext).not.toHaveBeenCalled();
      });

      it('should not allow root role', () => {
        mockReq = requestWithUserFactory({ id: 'user123', role: 'root' });

        checkAdmin(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockNext).not.toHaveBeenCalled();
      });
    });
  });

  describe('Middleware Chain - secureRoute → checkAdmin', () => {
    it('should successfully chain for admin user', () => {
      const token = adminTokenFactory();
      mockReq.cookies.auth_token = token;

      // First middleware
      secureRoute(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeDefined();

      // Reset mock
      mockNext.mockClear();

      // Second middleware
      checkAdmin(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should stop at secureRoute if no token', () => {
      // No token
      secureRoute(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();

      // checkAdmin should not be reached
      expect(mockReq.user).toBeUndefined();
    });

    it('should stop at checkAdmin if user is not admin', () => {
      const token = tokenFactory({ role: 'user' });
      mockReq.cookies.auth_token = token;

      // First middleware passes
      secureRoute(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
      mockNext.mockClear();

      // Second middleware fails
      checkAdmin(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should stop at secureRoute if token is invalid', () => {
      mockReq.cookies.auth_token = 'invalid-token';

      secureRoute(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockReq.user).toBeUndefined();
    });
  });

  describe('Security Edge Cases', () => {
    it('should not allow JWT algorithm confusion attacks', () => {
      // Try to use 'none' algorithm
      const token = jwt.sign({ id: 'admin123', role: 'admin' }, '', { algorithm: 'none' });
      mockReq.cookies.auth_token = token;

      secureRoute(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should not expose sensitive information in errors', () => {
      mockReq.cookies.auth_token = 'malicious-token';

      secureRoute(mockReq, mockRes, mockNext);

      const errorResponse = mockRes.json.mock.calls[0][0];
      expect(errorResponse.error).toBe('Invalid or expired token');
      expect(JSON.stringify(errorResponse)).not.toContain('jwt');
      expect(JSON.stringify(errorResponse)).not.toContain('verify');
    });
  });
});
