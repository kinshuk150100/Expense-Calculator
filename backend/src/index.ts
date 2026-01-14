// Load environment variables first
import 'dotenv/config';

import express, { type Express, type Request, type Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import type { ApiResponse } from '@splitwise/shared';
import expensesRouter from './routes/expenses.js';
import aiRouter from './routes/ai.js';
import authRouter from './routes/auth.js';
import categoriesRouter from './routes/categories.js';
import salaryRouter from './routes/salary.js';
import { logger } from './utils/logger.js';
import { requestLogger } from './middleware/requestLogger.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './utils/errors.js';
import { validateEnv } from './config/env.js';

// Validate environment variables before starting
try {
  validateEnv();
} catch (error) {
  console.error('❌ Environment validation failed:', error instanceof Error ? error.message : error);
  process.exit(1);
}

// Initialize database (async, don't block)
import db from './db.js';
db.initialize().catch((error) => {
  logger.error('Database initialization failed', { error });
  process.exit(1);
});

const app: Express = express();
const PORT = process.env.PORT || 4000;

// Middleware
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// CORS configuration
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing
app.use(express.json({ limit: '10mb' })); // Add payload size limit
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser (for httpOnly cookie support)
app.use(cookieParser());

// Request logging
app.use(requestLogger);

// Rate limiting (apply to all routes except health check)
app.use('/api', apiRateLimiter);
app.use('/auth', apiRateLimiter);
app.use('/expenses', apiRateLimiter);
app.use('/categories', apiRateLimiter);
app.use('/salary', apiRateLimiter);
app.use('/ai', apiRateLimiter);

// Health check endpoint
app.get('/health', async (_req: Request, res: Response) => {
  try {
    // Test database connection
    const db = (await import('./db.js')).default;
    await db.testConnection();
    
    const response: ApiResponse<{ status: string; database: string }> = {
      success: true,
      data: { 
        status: 'ok',
        database: 'connected'
      },
      message: 'Backend is running'
    };
    res.json(response);
  } catch (error) {
    logger.error('Health check failed', { error });
    const response: ApiResponse<{ status: string; database: string }> = {
      success: false,
      data: {
        status: 'error',
        database: 'disconnected'
      },
      error: 'Database connection failed'
    };
    res.status(503).json(response);
  }
});

// API routes
app.get('/api', (_req: Request, res: Response) => {
  const response: ApiResponse<{ message: string }> = {
    success: true,
    data: { message: 'Welcome to Splitwise API' }
  };
  res.json(response);
});

// Auth routes
app.use('/auth', authRouter);

// Expense routes
app.use('/expenses', expensesRouter);

// Custom categories routes
app.use('/categories', categoriesRouter);

// Salary reminder routes
app.use('/salary', salaryRouter);

// AI routes
app.use('/ai', aiRouter);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  logger.info('Backend server started', { port: PORT });
  logger.info('Database', { 
    type: 'MySQL',
    host: process.env.MYSQL_HOST || 'localhost',
    database: process.env.MYSQL_DATABASE || 'splitwise'
  });
  logger.info('AI Service status', { 
    enabled: !!process.env.OPENAI_API_KEY,
    mode: process.env.OPENAI_API_KEY ? 'OpenAI API' : 'Mock mode'
  });
  
  // Keep console.log for startup (visible to user)
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📊 Database: MySQL (${process.env.MYSQL_HOST || 'localhost'}:${process.env.MYSQL_PORT || '3306'})`);
  console.log(`🤖 AI Service: ${process.env.OPENAI_API_KEY ? 'OpenAI API enabled' : 'Mock mode (set OPENAI_API_KEY to enable)'}`);
});

// Graceful shutdown handlers
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully`);
  
  server.close(async () => {
    logger.info('HTTP server closed');
    try {
      const dbModule = await import('./db.js');
      const db = dbModule.default;
      if (db && typeof db.close === 'function') {
        await db.close();
        logger.info('Database connection pool closed');
      }
    } catch (error) {
      logger.error('Error closing database', { error });
    }
    process.exit(0);
  });
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

