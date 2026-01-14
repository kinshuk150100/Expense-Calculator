/**
 * Environment variable validation and configuration
 * Ensures all required environment variables are set
 */

/**
 * Validates required environment variables
 * Throws error if any required variables are missing
 */
export function validateEnv(): void {
  const required: string[] = [];
  const optional: Record<string, string> = {
    PORT: '4000',
    FRONTEND_URL: 'http://localhost:3000',
    MYSQL_HOST: 'localhost',
    MYSQL_PORT: '3306',
    MYSQL_USER: 'splitwise',
    MYSQL_PASSWORD: 'splitwise123',
    MYSQL_DATABASE: 'splitwise',
    JWT_EXPIRES_IN: '7d',
    NODE_ENV: 'development',
  };

  // JWT_SECRET is required in production
  if (process.env.NODE_ENV === 'production') {
    required.push('JWT_SECRET');
  } else {
    // In development, warn if missing but don't fail
    if (!process.env.JWT_SECRET) {
      console.warn('⚠️  WARNING: JWT_SECRET not set. Using default (INSECURE - only for development)');
    }
  }

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      `Please set them in your .env file or environment.`
    );
  }
}

/**
 * Get environment variable with default value
 */
export function getEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

/**
 * Get required environment variable
 * Throws error if not set
 */
export function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value;
}

