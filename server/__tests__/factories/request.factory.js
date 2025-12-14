/**
 * Request/Response Factory - Generates mock Express req/res objects for middleware tests
 * 
 * Usage:
 *   mockRequestFactory() // Basic request
 *   mockRequestFactory({ cookies: { auth_token: 'token' } }) // With cookie
 *   mockResponseFactory() // Mock response with jest functions
 */

import { jest } from '@jest/globals';

/**
 * Creates a mock Express request object
 * @param {Object} overrides - Fields to override defaults
 * @returns {Object} Mock request object
 */
export const mockRequestFactory = (overrides = {}) => ({
  cookies: {},
  headers: {},
  body: {},
  params: {},
  query: {},
  ...overrides,
});

/**
 * Creates a mock Express response object with Jest spies
 * @returns {Object} Mock response object
 */
export const mockResponseFactory = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
  };
  return res;
};

/**
 * Creates a mock Next function for middleware
 * @returns {Function} Mock next function
 */
export const mockNextFactory = () => jest.fn();

/**
 * Creates a complete middleware test context
 * @param {Object} reqOverrides - Request overrides
 * @returns {Object} { req, res, next }
 */
export const middlewareContextFactory = (reqOverrides = {}) => ({
  req: mockRequestFactory(reqOverrides),
  res: mockResponseFactory(),
  next: mockNextFactory(),
});

/**
 * Creates a request with authentication cookie
 * @param {string} token - JWT token
 * @param {Object} overrides - Additional request overrides
 * @returns {Object} Mock authenticated request
 */
export const authenticatedRequestFactory = (token, overrides = {}) => 
  mockRequestFactory({
    cookies: { auth_token: token },
    ...overrides,
  });

/**
 * Creates a request with user object (post-authentication)
 * @param {Object} user - User object to attach
 * @param {Object} overrides - Additional request overrides
 * @returns {Object} Mock request with user
 */
export const requestWithUserFactory = (user = {}, overrides = {}) => 
  mockRequestFactory({
    user: {
      id: 'user123',
      role: 'user',
      ...user,
    },
    ...overrides,
  });
