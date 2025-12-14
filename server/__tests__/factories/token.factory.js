/**
 * Token Factory - Generates JWT tokens for tests
 * 
 * Usage:
 *   tokenFactory() // Valid user token
 *   tokenFactory({ role: 'admin' }) // Admin token
 *   tokenFactory({ expiresIn: '-1h' }) // Expired token
 */

import jwt from 'jsonwebtoken';

/**
 * Creates a valid JWT token
 * @param {Object} payload - Token payload overrides
 * @param {Object} options - JWT sign options
 * @returns {string} JWT token
 */
export const tokenFactory = (payload = {}, options = {}) => {
  // Read JWT_SECRET dynamically to ensure it uses the value from .env.test
  const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-unit-tests';
  
  const defaultPayload = {
    id: 'user123',
    role: 'user',
    email: 'test@example.com',
  };

  const defaultOptions = {
    expiresIn: '7d',
  };

  return jwt.sign(
    { ...defaultPayload, ...payload },
    JWT_SECRET,
    { ...defaultOptions, ...options }
  );
};

/**
 * Creates an admin JWT token
 * @param {Object} payload - Token payload overrides
 * @param {Object} options - JWT sign options
 * @returns {string} Admin JWT token
 */
export const adminTokenFactory = (payload = {}, options = {}) => 
  tokenFactory({
    id: 'admin123',
    role: 'admin',
    email: 'admin@example.com',
    ...payload,
  }, options);

/**
 * Creates an expired JWT token
 * @param {Object} payload - Token payload overrides
 * @returns {string} Expired JWT token
 */
export const expiredTokenFactory = (payload = {}) => 
  tokenFactory(payload, { expiresIn: '-1h' });

/**
 * Creates a token that will expire in milliseconds
 * @param {number} ms - Milliseconds until expiration
 * @param {Object} payload - Token payload overrides
 * @returns {string} JWT token
 */
export const shortLivedTokenFactory = (ms = 1, payload = {}) => 
  tokenFactory(payload, { expiresIn: ms });

/**
 * Creates an invalid token with wrong signature
 * @param {Object} payload - Token payload
 * @returns {string} Invalid JWT token
 */
export const invalidTokenFactory = (payload = {}) => {
  const defaultPayload = {
    id: 'user123',
    role: 'user',
  };

  return jwt.sign(
    { ...defaultPayload, ...payload },
    'wrong-secret-key',
    { expiresIn: '7d' }
  );
};

/**
 * Creates a malformed token string
 * @returns {string} Malformed token
 */
export const malformedTokenFactory = () => 'not.a.valid.jwt.token';

/**
 * Creates a token with tampered payload
 * @returns {string} Tampered token
 */
export const tamperedTokenFactory = () => {
  const validToken = tokenFactory();
  const parts = validToken.split('.');
  // Tamper with the payload
  return parts[0] + '.eyJpZCI6ImFkbWluIn0.' + parts[2];
};

/**
 * Creates token payload (decoded JWT data)
 * @param {Object} overrides - Fields to override defaults
 * @returns {Object} Token payload
 */
export const tokenPayloadFactory = (overrides = {}) => ({
  id: 'user123',
  role: 'user',
  email: 'test@example.com',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
  ...overrides,
});
