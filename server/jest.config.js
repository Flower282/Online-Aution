/**
 * Jest Configuration for ES Modules
 * 
 * This project uses native ES modules ("type": "module" in package.json).
 * Run tests with: NODE_OPTIONS=--experimental-vm-modules npx jest
 */

export default {
  testEnvironment: 'node',
  
  // Load environment variables from .env.test in each test worker
  // setupFiles runs before each test file (in the test worker process)
  setupFiles: ['./jest.setup.js'],
  
  // Transform .js files - not needed with native ESM
  // transform: {},
  
  // Module name mapper for ESM
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  
  // Test patterns
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],
  
  // Coverage
  collectCoverageFrom: [
    'controllers/**/*.js',
    'routes/**/*.js',
    'middleware/**/*.js',
    '!**/__tests__/**',
    '!**/node_modules/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Test configuration
  testTimeout: 10000,
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
};
