import { Router, type Request, type Response } from 'express';
import db from '../db.js';
import { authenticate, type AuthRequest } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';
import type { ApiResponse } from '@splitwise/shared';

const router = Router();

/**
 * GET /salary
 * Get salary reminder for the authenticated user
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
      SELECT id, salaryDate, createdAt, updatedAt
      FROM salary_reminders
      WHERE userId = ?
    `, [userId]);

    if (result.rows.length === 0) {
      const response: ApiResponse<null> = {
        success: true,
        data: null,
        message: 'No salary reminder set'
      };
      return res.json(response);
    }

    const reminder = result.rows[0];

    const response: ApiResponse<{
      id: string;
      salaryDate: number;
      createdAt: string;
      updatedAt: string;
    }> = {
      success: true,
      data: {
        id: reminder.id,
        salaryDate: reminder.salaryDate,
        createdAt: reminder.createdAt,
        updatedAt: reminder.updatedAt
      }
    };

    res.json(response);
  } catch (error) {
    logger.error('Error fetching salary reminder', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.userId,
    });
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch salary reminder'
    };
    res.status(500).json(response);
  }
});

/**
 * POST /salary
 * Create or update salary reminder for the authenticated user
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

    const { salaryDate } = req.body;

    if (!salaryDate || typeof salaryDate !== 'number') {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Salary date is required and must be a number (day of month, 1-31)'
      };
      return res.status(400).json(response);
    }

    // Validate salary date (1-31)
    if (salaryDate < 1 || salaryDate > 31) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Salary date must be between 1 and 31'
      };
      return res.status(400).json(response);
    }

    // Check if reminder already exists
    const existingResult = await db.query(
      'SELECT id FROM salary_reminders WHERE userId = ?',
      [userId]
    );

    if (existingResult.rows.length > 0) {
      // Update existing reminder
      const updateResult = await db.query(`
        UPDATE salary_reminders
        SET salaryDate = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE userId = ?
      `, [salaryDate, userId]);

      // Fetch updated reminder
      const fetchResult = await db.query(`
        SELECT id, salaryDate, createdAt, updatedAt
        FROM salary_reminders
        WHERE userId = ?
      `, [userId]);

      const updated = fetchResult.rows[0];

      logger.info('Salary reminder updated', { userId, salaryDate });

      const response: ApiResponse<{
        id: string;
        salaryDate: number;
        createdAt: string;
        updatedAt: string;
      }> = {
        success: true,
        data: {
          id: updated.id,
          salaryDate: updated.salaryDate,
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt
        },
        message: 'Salary reminder updated successfully'
      };

      return res.json(response);
    } else {
      // Create new reminder
      const id = db.generateUUID();
      await db.query(`
        INSERT INTO salary_reminders (id, userId, salaryDate, createdAt, updatedAt)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [id, userId, salaryDate]);

      // Fetch created reminder
      const fetchResult = await db.query(`
        SELECT id, salaryDate, createdAt, updatedAt
        FROM salary_reminders
        WHERE id = ?
      `, [id]);

      const created = fetchResult.rows[0];

      logger.info('Salary reminder created', { userId, salaryDate });

      const response: ApiResponse<{
        id: string;
        salaryDate: number;
        createdAt: string;
        updatedAt: string;
      }> = {
        success: true,
        data: {
          id: created.id,
          salaryDate: created.salaryDate,
          createdAt: created.createdAt,
          updatedAt: created.updatedAt
        },
        message: 'Salary reminder created successfully'
      };

      return res.status(201).json(response);
    }
  } catch (error) {
    logger.error('Error creating/updating salary reminder', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.userId,
    });
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create/update salary reminder'
    };
    res.status(500).json(response);
  }
});

/**
 * DELETE /salary
 * Delete salary reminder for the authenticated user
 * Idempotent: Returns success even if reminder doesn't exist
 */
router.delete('/', authenticate, async (req: AuthRequest, res: Response) => {
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
      DELETE FROM salary_reminders
      WHERE userId = ?
    `, [userId]);

    // Idempotent delete: Return success even if nothing was deleted
    // MySQL returns affectedRows which we track in our wrapper
    const deleted = result.affectedRows > 0;

    if (deleted) {
      logger.info('Salary reminder deleted', { userId });
    } else {
      logger.info('Salary reminder delete attempted but not found (idempotent)', { userId });
    }

    const response: ApiResponse<null> = {
      success: true,
      message: deleted
        ? 'Salary reminder deleted successfully' 
        : 'Salary reminder not found (already deleted or never existed)'
    };

    res.json(response);
  } catch (error) {
    logger.error('Error deleting salary reminder', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.userId,
    });
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete salary reminder'
    };
    res.status(500).json(response);
  }
});

export default router;
