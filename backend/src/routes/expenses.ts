import { Router, type Request, type Response } from 'express';
import db from '../db.js';
import { validateCreateExpense } from '../middleware/validation.js';
import { authenticate, type AuthRequest } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';
import type { ApiResponse, Expense, ExpenseSummary } from '@splitwise/shared';

const router = Router();

// POST /expenses - Create a new expense
router.post('/', authenticate, validateCreateExpense, async (req: AuthRequest, res: Response) => {
  try {
    const { amount, category, note, date } = req.body;
    const userId = req.userId;
    
    if (!userId) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'User ID not found in request'
      };
      return res.status(401).json(response);
    }

    const id = db.generateUUID();
    await db.query(`
      INSERT INTO expenses (id, userId, amount, category, note, date, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [id, userId, amount, category, note, date]);

    // Fetch the created expense
    const result = await db.query(`
      SELECT id, amount, category, note, date, createdAt
      FROM expenses
      WHERE id = ?
    `, [id]);

    const expense: Expense = {
      id: result.rows[0].id,
      amount: parseFloat(result.rows[0].amount),
      category: result.rows[0].category,
      note: result.rows[0].note,
      date: result.rows[0].date,
      createdAt: result.rows[0].createdAt
    };

    const response: ApiResponse<Expense> = {
      success: true,
      data: expense,
      message: 'Expense created successfully'
    };

    res.status(201).json(response);
  } catch (error) {
    logger.error('Error creating expense', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.userId,
    });
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create expense'
    };
    res.status(500).json(response);
  }
});

// GET /expenses - Get all expenses for the authenticated user
// Supports pagination: ?page=1&limit=50
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

    // Pagination parameters with validation
    const pageParam = req.query.page as string;
    const limitParam = req.query.limit as string;
    
    const page = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1;
    const limit = limitParam 
      ? Math.min(100, Math.max(1, parseInt(limitParam, 10)))
      : 50;
    
    // Validate parsed values
    if (isNaN(page) || isNaN(limit)) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Invalid pagination parameters'
      };
      return res.status(400).json(response);
    }
    
    const offset = (page - 1) * limit;

    // Get total count for pagination metadata
    const countResult = await db.query(
      'SELECT COUNT(*) as count FROM expenses WHERE userId = ?',
      [userId]
    );
    const totalCount = parseInt(countResult.rows[0].count, 10);

    // Get paginated expenses
    const expensesResult = await db.query(`
      SELECT id, amount, category, note, date, createdAt
      FROM expenses
      WHERE userId = ?
      ORDER BY date DESC, createdAt DESC
      LIMIT ? OFFSET ?
    `, [userId, limit, offset]);

    const expenses: Expense[] = expensesResult.rows.map(row => ({
      id: row.id,
      amount: parseFloat(row.amount),
      category: row.category,
      note: row.note,
      date: row.date,
      createdAt: row.createdAt
    }));

    const response: ApiResponse<{
      expenses: Expense[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }> = {
      success: true,
      data: {
        expenses,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      }
    };

    res.json(response);
  } catch (error) {
    logger.error('Error fetching expenses', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.userId,
    });
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch expenses'
    };
    res.status(500).json(response);
  }
});

// PUT /expenses/:id - Update an expense
router.put('/:id', authenticate, validateCreateExpense, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  
  try {
    const { amount, category, note, date } = req.body;
    const userId = req.userId;

    if (!userId) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'User ID not found in request'
      };
      return res.status(401).json(response);
    }

    // Check if expense exists and belongs to user (single query with WHERE clause)
    // This prevents TOCTOU (Time-of-check to time-of-use) vulnerability
    const existingResult = await db.query(
      'SELECT id, userId FROM expenses WHERE id = ? AND userId = ?',
      [id, userId]
    );

    if (existingResult.rows.length === 0) {
      // Don't reveal if expense exists but belongs to another user (security best practice)
      const response: ApiResponse<null> = {
        success: false,
        error: 'Expense not found'
      };
      return res.status(404).json(response);
    }

    // Update expense (already verified ownership in query above)
    await db.query(`
      UPDATE expenses 
      SET amount = ?, category = ?, note = ?, date = ?
      WHERE id = ? AND userId = ?
    `, [amount, category, note, date, id, userId]);

    // Fetch updated expense
    const updatedResult = await db.query(`
      SELECT id, amount, category, note, date, createdAt
      FROM expenses
      WHERE id = ?
    `, [id]);

    const row = updatedResult.rows[0];
    const updatedExpense: Expense = {
      id: row.id,
      amount: parseFloat(row.amount),
      category: row.category,
      note: row.note,
      date: row.date,
      createdAt: row.createdAt
    };

    const response: ApiResponse<Expense> = {
      success: true,
      data: updatedExpense,
      message: 'Expense updated successfully'
    };

    res.json(response);
  } catch (error) {
    logger.error('Error updating expense', {
      error: error instanceof Error ? error.message : 'Unknown error',
      expenseId: id,
      userId: req.userId,
    });
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update expense'
    };
    res.status(500).json(response);
  }
});

// GET /summary - Get expense summary for authenticated user
router.get('/summary', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'User ID not found in request'
      };
      return res.status(401).json(response);
    }

    // Optimized: Use SQL aggregation instead of fetching all rows
    const summaryResult = await db.query(`
      SELECT 
        category,
        SUM(amount) as categoryTotal
      FROM expenses
      WHERE userId = ?
      GROUP BY category
    `, [userId]);

    // Calculate totals from aggregated data
    let total = 0;
    const categoryTotals: Record<string, number> = {};

    for (const row of summaryResult.rows) {
      const categoryTotal = parseFloat(row.categoryTotal);
      total += categoryTotal;
      categoryTotals[row.category] = categoryTotal;
    }

    const summary: ExpenseSummary = {
      total,
      categoryTotals
    };

    const response: ApiResponse<ExpenseSummary> = {
      success: true,
      data: summary
    };

    res.json(response);
  } catch (error) {
    logger.error('Error fetching summary', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.userId,
    });
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch summary'
    };
    res.status(500).json(response);
  }
});

export default router;
