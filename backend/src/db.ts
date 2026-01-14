import { createPool, type Pool, type PoolConnection } from 'mysql2/promise';
import { logger } from './utils/logger.js';

/**
 * MySQL Database Connection Pool
 * Uses connection pooling for better performance
 */
let pool: Pool | null = null;

/**
 * Get database connection pool
 * Creates a new pool if it doesn't exist
 */
function getPool(): Pool {
  if (!pool) {
    const connectionConfig = {
      host: process.env.MYSQL_HOST || 'localhost',
      port: parseInt(process.env.MYSQL_PORT || '3306', 10),
      user: process.env.MYSQL_USER || 'splitwise',
      password: process.env.MYSQL_PASSWORD || 'splitwise123',
      database: process.env.MYSQL_DATABASE || 'splitwise',
      waitForConnections: true,
      connectionLimit: 20,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    };

    pool = createPool(connectionConfig);

    logger.info('MySQL connection pool created', {
      host: connectionConfig.host,
      port: connectionConfig.port,
      database: connectionConfig.database,
    });
  }

  return pool;
}

/**
 * Generate UUID v4 (for MySQL compatibility)
 * MySQL doesn't have uuid_generate_v4() like PostgreSQL
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Initialize database schema
 * Creates all necessary tables and indexes
 */
async function initializeSchema(): Promise<void> {
  const connection = await getPool().getConnection();
  
  try {
    // Create users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password TEXT NOT NULL,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create index on email for faster lookups (MySQL doesn't support IF NOT EXISTS for indexes)
    try {
      await connection.query(`
        CREATE INDEX idx_users_email ON users(email)
      `);
    } catch (error: any) {
      // Ignore error if index already exists
      if (error.code !== 'ER_DUP_KEYNAME') {
        throw error;
      }
    }

    // Create expenses table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id VARCHAR(36) PRIMARY KEY,
        userId VARCHAR(36) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        category VARCHAR(50) NOT NULL,
        note VARCHAR(500) NOT NULL,
        date DATE NOT NULL,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create indexes for expenses (MySQL doesn't support IF NOT EXISTS for indexes)
    const expenseIndexes = [
      { name: 'idx_expenses_category', sql: 'CREATE INDEX idx_expenses_category ON expenses(category)' },
      { name: 'idx_expenses_date', sql: 'CREATE INDEX idx_expenses_date ON expenses(date)' },
      { name: 'idx_expenses_userId', sql: 'CREATE INDEX idx_expenses_userId ON expenses(userId)' },
      { name: 'idx_expenses_user_date', sql: 'CREATE INDEX idx_expenses_user_date ON expenses(userId, date DESC)' },
      { name: 'idx_expenses_user_category', sql: 'CREATE INDEX idx_expenses_user_category ON expenses(userId, category)' },
    ];

    for (const index of expenseIndexes) {
      try {
        await connection.query(index.sql);
      } catch (error: any) {
        // Ignore error if index already exists
        if (error.code !== 'ER_DUP_KEYNAME') {
          throw error;
        }
      }
    }

    // Create custom_categories table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS custom_categories (
        id VARCHAR(36) PRIMARY KEY,
        userId VARCHAR(36) NOT NULL,
        categoryName VARCHAR(50) NOT NULL,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_category (userId, categoryName)
      )
    `);

    // Create index (MySQL doesn't support IF NOT EXISTS for indexes)
    try {
      await connection.query(`
        CREATE INDEX idx_custom_categories_userId ON custom_categories(userId)
      `);
    } catch (error: any) {
      // Ignore error if index already exists
      if (error.code !== 'ER_DUP_KEYNAME') {
        throw error;
      }
    }

    // Create salary_reminders table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS salary_reminders (
        id VARCHAR(36) PRIMARY KEY,
        userId VARCHAR(36) NOT NULL UNIQUE,
        salaryDate INT NOT NULL CHECK (salaryDate >= 1 AND salaryDate <= 31),
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create index (MySQL doesn't support IF NOT EXISTS for indexes)
    try {
      await connection.query(`
        CREATE INDEX idx_salary_reminders_userId ON salary_reminders(userId)
      `);
    } catch (error: any) {
      // Ignore error if index already exists
      if (error.code !== 'ER_DUP_KEYNAME') {
        throw error;
      }
    }

    logger.info('Database schema initialized successfully');
  } catch (error) {
    logger.error('Error initializing database schema', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Test database connection
 */
async function testConnection(): Promise<void> {
  const connection = await getPool().getConnection();
  try {
    await connection.query('SELECT 1');
    logger.info('Database connection test successful');
  } catch (error) {
    logger.error('Database connection test failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Close database connection pool
 */
async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('Database connection pool closed');
  }
}

// Initialize database on module load
let initialized = false;
async function initialize(): Promise<void> {
  if (initialized) return;
  
  try {
    await testConnection();
    await initializeSchema();
    initialized = true;
  } catch (error) {
    logger.error('Failed to initialize database', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

// Auto-initialize (but don't block module load)
initialize().catch((error) => {
  logger.error('Database initialization error', { error });
});

// Helper function to execute query and return consistent format
async function executeQuery(text: string, params?: any[]) {
  const connection = await getPool().getConnection();
  try {
    const [rows, fields] = await connection.query(text, params);
    // mysql2 returns [rows, fields] tuple
    // For INSERT/UPDATE/DELETE, rows contains affectedRows property
    const result = rows as any;
    return { 
      rows: Array.isArray(result) ? result : (result ? [result] : []),
      rowCount: Array.isArray(result) ? result.length : (result ? 1 : 0),
      affectedRows: result?.affectedRows || (Array.isArray(result) ? result.length : (result ? 1 : 0))
    };
  } finally {
    connection.release();
  }
}

// Export pool and utility functions
export default {
  query: executeQuery,
  getClient: () => getPool().getConnection(),
  close: closePool,
  initialize,
  testConnection,
  generateUUID,
};

// For backward compatibility with existing code
export const db = {
  query: executeQuery,
  getClient: () => getPool().getConnection(),
  close: closePool,
  initialize,
  testConnection,
  generateUUID,
};
