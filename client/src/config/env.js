/**
 * Centralized Environment Configuration
 * 
 * This file validates and exports all required environment variables.
 * The application will fail fast at build time if any required variable is missing.
 * 
 * For development, use .env.local with VITE_API_URL=http://localhost:4000
 * For production, set VITE_API_URL=https://your-api-domain.com
 */

// Helper function to get and validate environment variable with optional fallback for development
function getEnv(key, fallback = null) {
  const value = import.meta.env[key];
  
  // In production, require the value
  if ((!value || value === 'undefined') && import.meta.env.PROD) {
    throw new Error(
      `❌ FATAL: Required environment variable "${key}" is not defined.\n` +
      `Please ensure it's set in your .env file or passed as a build argument.\n` +
      `Example: ${key}=https://api.yourdomain.com`
    );
  }
  
  return value || fallback;
}

// Validate and export environment variables
export const env = {
  // Primary API URL - the only required environment variable
  API_URL: getEnv('VITE_API', 'http://localhost:4000'),
};

// Freeze the object to prevent mutations
Object.freeze(env);

// Log configuration in development (without exposing sensitive data)
if (import.meta.env.DEV) {
  console.log('🔧 Environment Configuration Loaded:');
  console.log(`  API_URL: ${env.API_URL}`);
}

export default env;
