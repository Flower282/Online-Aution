/**
 * Centralized Environment Configuration
 * 
 * This file validates and exports all required environment variables.
 * The application will fail fast at build time if any required variable is missing.
 * 
 * NO FALLBACK VALUES - all variables must be explicitly set in .env or build args.
 */

// Helper function to get and validate environment variable
function getRequiredEnv(key) {
  const value = import.meta.env[key];
  
  if (!value || value === 'undefined') {
    throw new Error(
      `❌ FATAL: Required environment variable "${key}" is not defined.\n` +
      `Please ensure it's set in your .env file or passed as a build argument.\n` +
      `Example: ${key}=https://api.yourdomain.com`
    );
  }
  
  return value;
}

// Validate and export all environment variables
export const env = {
  // Primary API URL
  API_URL: getRequiredEnv('VITE_API_URL'),
  
  // API endpoints
  API: getRequiredEnv('VITE_API'),
  AUCTION_API: getRequiredEnv('VITE_AUCTION_API'),
  USER_API: getRequiredEnv('VITE_USER_API'),
  CONTACT_API: getRequiredEnv('VITE_CONTACT_API'),
  ADMIN_API: getRequiredEnv('VITE_ADMIN_API'),
};

// Freeze the object to prevent mutations
Object.freeze(env);

// Log configuration in development (without exposing sensitive data)
if (import.meta.env.DEV) {
  console.log('🔧 Environment Configuration Loaded:');
  Object.keys(env).forEach(key => {
    const value = env[key];
    const maskedValue = value.length > 30 
      ? `${value.substring(0, 30)}...` 
      : value;
    console.log(`  ${key}: ${maskedValue}`);
  });
}

export default env;
