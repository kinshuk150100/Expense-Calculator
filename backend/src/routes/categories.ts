import { Router, type Request, type Response } from 'express';
import db from '../db.js';
import { authenticate, type AuthRequest } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';
import { sanitizeString } from '../utils/sanitize.js';
import type { ApiResponse } from '@splitwise/shared';

const router = Router();

/**
 * GET /categories
 * Get all custom categories for the authenticated user
 */
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'User ID not found in request'
      };
      return res.status(401).json(response);
    }

    const result = await db.query(`
      SELECT categoryName
      FROM custom_categories
      WHERE userId = ?
      ORDER BY categoryName ASC
    `, [userId]);

    const categoryNames = result.rows.map(row => row.categoryName);

    const response: ApiResponse<string[]> = {
      success: true,
      data: categoryNames
    };

    res.json(response);
  } catch (error) {
    logger.error('Error fetching custom categories', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.userId,
    });
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch custom categories'
    };
    res.status(500).json(response);
  }
});

/**
 * POST /categories
 * Add a new custom category for the authenticated user
 */
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'User ID not found in request'
      };
      return res.status(401).json(response);
    }

    const { categoryName } = req.body;

    if (!categoryName || typeof categoryName !== 'string') {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Category name is required and must be a string'
      };
      return res.status(400).json(response);
    }

    // Sanitize and validate category name
    const sanitized = sanitizeString(categoryName.trim());
    if (!sanitized || sanitized.length === 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Category name cannot be empty'
      };
      return res.status(400).json(response);
    }

    if (sanitized.length > 50) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Category name must be less than 50 characters'
      };
      return res.status(400).json(response);
    }

    // Check if category already exists for this user
    const existingResult = await db.query(`
      SELECT id FROM custom_categories
      WHERE userId = ? AND categoryName = ?
    `, [userId, sanitized]);

    if (existingResult.rows.length > 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Category already exists'
      };
      return res.status(409).json(response);
    }

    // Insert new category
    const id = db.generateUUID();
    await db.query(`
      INSERT INTO custom_categories (id, userId, categoryName, createdAt)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `, [id, userId, sanitized]);

    logger.info('Custom category created', { userId, categoryName: sanitized });

    const response: ApiResponse<{ categoryName: string }> = {
      success: true,
      data: { categoryName: sanitized },
      message: 'Custom category added successfully'
    };

    res.status(201).json(response);
  } catch (error) {
    logger.error('Error creating custom category', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.userId,
    });
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create custom category'
    };
    res.status(500).json(response);
  }
});

/**
 * DELETE /categories/:categoryName
 * Delete a custom category for the authenticated user
 */
router.delete('/:categoryName', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'User ID not found in request'
      };
      return res.status(401).json(response);
    }

    const { categoryName } = req.params;

    if (!categoryName) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Category name is required'
      };
      return res.status(400).json(response);
    }

    // Decode URL-encoded category name
    const decodedCategoryName = decodeURIComponent(categoryName);

    // Check if category exists and belongs to user
    const existingResult = await db.query(`
      SELECT id FROM custom_categories
      WHERE userId = ? AND categoryName = ?
    `, [userId, decodedCategoryName]);

    if (existingResult.rows.length === 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Category not found'
      };
      return res.status(404).json(response);
    }

    // Delete category
    await db.query(`
      DELETE FROM custom_categories
      WHERE userId = ? AND categoryName = ?
    `, [userId, decodedCategoryName]);

    logger.info('Custom category deleted', { userId, categoryName: decodedCategoryName });

    const response: ApiResponse<null> = {
      success: true,
      message: 'Custom category deleted successfully'
    };

    res.json(response);
  } catch (error) {
    logger.error('Error deleting custom category', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.userId,
    });
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete custom category'
    };
    res.status(500).json(response);
  }
});

export default router;
