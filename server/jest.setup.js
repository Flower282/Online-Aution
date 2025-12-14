/**
 * Jest Setup File - Runs before each test file
 * 
 * Loads environment variables from .env.test for test environment.
 * This runs in each test worker process before tests execute.
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory of the current module (ESM equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.test file before any tests run
// override: true ensures test values take precedence over existing env vars
dotenv.config({ 
  path: join(__dirname, '.env.test'),
  override: true
});

// Verify critical environment variables are loaded
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  Warning: JWT_SECRET not loaded from .env.test');
  console.warn('   Tests may fail due to missing JWT_SECRET');
}

// Ensure NODE_ENV is set to 'test'
if (process.env.NODE_ENV !== 'test') {
  process.env.NODE_ENV = 'test';
}

// Log once to confirm setup (only if not already logged)
if (!global.__JEST_SETUP_LOGGED__) {
  console.log('✅ Test environment configured from .env.test');
  console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`   JWT_SECRET: ${process.env.JWT_SECRET ? '***' + process.env.JWT_SECRET.slice(-8) : 'NOT SET'}`);
  global.__JEST_SETUP_LOGGED__ = true;
}
