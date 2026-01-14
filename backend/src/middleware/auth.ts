import { type Request, type Response, type NextFunction } from 'express';
import type { ApiResponse } from '@splitwise/shared';
import { verifyToken } from '../utils/auth.js';
import { logger } from '../utils/logger.js';
import { UnauthorizedError } from '../utils/errors.js';

/**
 * Extend Express Request to include user info
 */
export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
}

/**
 * Authentication middleware
 * Verifies JWT token from Authorization header
 */
/**
 * Authentication middleware
 * Verifies JWT token from Authorization header or cookies
 * Supports both Bearer token and httpOnly cookie authentication
 */
export function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    let token: string | undefined;

    // Try to get token from Authorization header first
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Remove 'Bearer ' prefix
    } else {
      // Fallback to cookie (for httpOnly cookie support)
      token = req.cookies?.authToken;
    }
    
    if (!token) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'No token provided. Please login first.'
      };
      res.status(401).json(response);
      return;
    }

    // Verify token
    const decoded = verifyToken(token);
    
    if (!decoded) {
      logger.warn('Invalid token attempt', {
        ip: req.ip,
        path: req.path,
      });
      const response: ApiResponse<null> = {
        success: false,
        error: 'Invalid or expired token. Please login again.'
      };
      res.status(401).json(response);
      return;
    }

    // Attach user info to request
    req.userId = decoded.userId;
    req.userEmail = decoded.email;

    next();
  } catch (error) {
    logger.error('Authentication error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip,
      path: req.path,
    });
    const response: ApiResponse<null> = {
      success: false,
      error: 'Authentication failed'
    };
    res.status(401).json(response);
  }
}


