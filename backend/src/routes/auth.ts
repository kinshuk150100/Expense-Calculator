import { Router, type Request, type Response } from 'express';
import { body, validationResult } from 'express-validator';
import db from '../db.js';
import { hashPassword, comparePassword, generateToken } from '../utils/auth.js';
import { sanitizeString, sanitizeEmail } from '../utils/sanitize.js';
import { logger } from '../utils/logger.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';
import { BadRequestError, ConflictError, UnauthorizedError, InternalServerError } from '../utils/errors.js';
import type { ApiResponse, LoginInput, LoginResponse, RegisterInput } from '@splitwise/shared';

const router = Router();

/**
 * Validation middleware for registration
 */
const validateRegister = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters')
    .escape(), // Prevent XSS
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
    .isLength({ max: 255 })
    .withMessage('Email must be less than 255 characters'),
  body('password')
    .isLength({ min: 6, max: 100 })
    .withMessage('Password must be between 6 and 100 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
];

/**
 * Validation middleware for login
 */
const validateLogin = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

/**
 * POST /auth/register
 * Register a new user
 */
router.post('/register', authRateLimiter, validateRegister, async (req: Request, res: Response) => {
  const connection = await db.getClient();
  
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(err => err.msg).join(', ');
      throw new BadRequestError(errorMessages);
    }

    // Sanitize input
    const name = sanitizeString(req.body.name || '');
    const email = sanitizeEmail(req.body.email || '');
    const password = String(req.body.password || '').trim();

    if (!name || !email || !password) {
      throw new BadRequestError('Name, email, and password are required');
    }

    // Start transaction
    await connection.query('START TRANSACTION');

    try {
      // Check if user already exists
      const [existingRows] = await connection.query(
        'SELECT id FROM users WHERE email = ?',
        [email]
      ) as [any[], any];
      
      if (Array.isArray(existingRows) && existingRows.length > 0) {
        await connection.query('ROLLBACK');
        throw new ConflictError('User with this email already exists');
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user
      const id = db.generateUUID();
      await connection.query(`
        INSERT INTO users (id, name, email, password, createdAt)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [id, name, email, hashedPassword]);

      await connection.query('COMMIT');

      logger.info('User registered', { userId: id, email });

      // Generate token
      const token = generateToken(id, email);

      // Set httpOnly cookie for token
      const isProduction = process.env.NODE_ENV === 'production';
      res.cookie('authToken', token, {
        httpOnly: true,
        secure: isProduction, // Only send over HTTPS in production
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
      });

      const response: ApiResponse<LoginResponse> = {
        success: true,
        data: {
          token, // Still return token for localStorage fallback (can be removed later)
          user: {
            id,
            name,
            email
          }
        },
        message: 'User registered successfully'
      };

      res.status(201).json(response);
    } catch (error) {
      await connection.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    if (error instanceof BadRequestError || error instanceof ConflictError) {
      const response: ApiResponse<null> = {
        success: false,
        error: error.message
      };
      return res.status(error.statusCode).json(response);
    }
    
    logger.error('Registration error', { error });
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to register user'
    };
    res.status(500).json(response);
  } finally {
    connection.release();
  }
});

/**
 * POST /auth/login
 * Login user
 */
router.post('/login', authRateLimiter, validateLogin, async (req: Request, res: Response) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(err => err.msg).join(', ');
      throw new BadRequestError(errorMessages);
    }

    // Sanitize input
    const email = sanitizeEmail(req.body.email || '');
    const password = String(req.body.password || '').trim();

    if (!email || !password) {
      throw new BadRequestError('Email and password are required');
    }

    // Find user by email
    const result = await db.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (result.rows.length === 0) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const user = result.rows[0];

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Generate token
    const token = generateToken(user.id, user.email);

    logger.info('User logged in', { userId: user.id, email: user.email });

    // Set httpOnly cookie for token
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    const response: ApiResponse<LoginResponse> = {
      success: true,
      data: {
        token, // Still return token for localStorage fallback
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        }
      },
      message: 'Login successful'
    };

    res.json(response);
  } catch (error) {
    if (error instanceof BadRequestError || error instanceof UnauthorizedError) {
      const response: ApiResponse<null> = {
        success: false,
        error: error.message
      };
      return res.status(error.statusCode).json(response);
    }
    
    logger.error('Login error', { error });
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to login'
    };
    res.status(500).json(response);
  }
});

/**
 * POST /auth/logout
 * Logout user - clears httpOnly cookie
 */
router.post('/logout', (_req: Request, res: Response) => {
  // Clear auth cookie
  res.clearCookie('authToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });

  const response: ApiResponse<null> = {
    success: true,
    message: 'Logout successful'
  };
  res.json(response);
});

/**
 * GET /auth/me
 * Get current user info
 */
router.get('/me', async (req: Request, res: Response) => {
  try {
    // Check for token in Authorization header or httpOnly cookie
    let token: string | undefined;
    
    // First, try to get token from Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    
    // If no token in header, try to get from httpOnly cookie
    if (!token && req.cookies && req.cookies.authToken) {
      token = req.cookies.authToken;
    }
    
    if (!token) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'No token provided'
      };
      res.status(401).json(response);
      return;
    }

    const { verifyToken } = await import('../utils/auth.js');
    const decoded = verifyToken(token);

    if (!decoded) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Invalid token'
      };
      res.status(401).json(response);
      return;
    }

    const result = await db.query(
      'SELECT id, name, email, createdAt FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'User not found'
      };
      res.status(404).json(response);
      return;
    }

    const user = result.rows[0];

    const response: ApiResponse<{ id: string; name: string; email: string }> = {
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    };

    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get user info'
    };
    res.status(500).json(response);
  }
});

export default router;
