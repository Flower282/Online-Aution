/**
 * User Factory - Generates fake user data for tests
 * 
 * Usage:
 *   userFactory() // Default user
 *   userFactory({ role: 'admin' }) // Admin user
 *   userFactory({ email: 'custom@test.com' }) // Custom email
 */

/**
 * Creates a user object with customizable fields
 * @param {Object} overrides - Fields to override defaults
 * @returns {Object} User object
 */
export const userFactory = (overrides = {}) => ({
  _id: 'user123',
  id: 'user123',
  name: 'Test User',
  email: 'test@example.com',
  password: 'hashedPassword123',
  role: 'user',
  isActive: true,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  ...overrides,
});

/**
 * Creates an admin user
 * @param {Object} overrides - Fields to override defaults
 * @returns {Object} Admin user object
 */
export const adminUserFactory = (overrides = {}) => 
  userFactory({
    _id: 'admin123',
    id: 'admin123',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
    ...overrides,
  });

/**
 * Creates an inactive user
 * @param {Object} overrides - Fields to override defaults
 * @returns {Object} Inactive user object
 */
export const inactiveUserFactory = (overrides = {}) => 
  userFactory({
    _id: 'inactive123',
    id: 'inactive123',
    email: 'inactive@example.com',
    isActive: false,
    ...overrides,
  });

/**
 * Creates a user signup payload (without password hash)
 * @param {Object} overrides - Fields to override defaults
 * @returns {Object} Signup payload
 */
export const signupPayloadFactory = (overrides = {}) => ({
  name: 'Test User',
  email: 'test@example.com',
  password: 'Password123!',
  ...overrides,
});

/**
 * Creates a login payload
 * @param {Object} overrides - Fields to override defaults
 * @returns {Object} Login payload
 */
export const loginPayloadFactory = (overrides = {}) => ({
  email: 'test@example.com',
  password: 'Password123!',
  ...overrides,
});

/**
 * Creates a password change payload
 * @param {Object} overrides - Fields to override defaults
 * @returns {Object} Password change payload
 */
export const passwordChangePayloadFactory = (overrides = {}) => ({
  currentPassword: 'OldPassword123!',
  newPassword: 'NewPassword123!',
  confirmPassword: 'NewPassword123!',
  ...overrides,
});

/**
 * Creates a user with hashed password (for bcrypt comparison)
 * @param {string} plainPassword - Plain text password to hash
 * @param {Object} overrides - Fields to override defaults
 * @returns {Promise<Object>} User object with hashed password
 */
export const userWithHashedPasswordFactory = async (plainPassword = 'Password123!', overrides = {}) => {
  const bcrypt = await import('bcrypt');
  const hashedPassword = await bcrypt.default.hash(plainPassword, 10);
  
  return userFactory({
    password: hashedPassword,
    ...overrides,
  });
};
