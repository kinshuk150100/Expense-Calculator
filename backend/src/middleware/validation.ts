import { type Request, type Response, type NextFunction } from 'express';
import type { ApiResponse, CreateExpenseInput, Expense } from '@splitwise/shared';
import { sanitizeExpenseInput } from '../utils/sanitize.js';

export function validateCreateExpense(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Sanitize input first
  const sanitized = sanitizeExpenseInput(req.body);
  if (!sanitized) {
    const response: ApiResponse<null> = {
      success: false,
      error: 'Invalid input data. Please check all fields.'
    };
    res.status(400).json(response);
    return;
  }

  // Replace req.body with sanitized data
  req.body = sanitized;
  const { amount, category, note, date } = sanitized;

  const errors: string[] = [];

  // Validate amount
  if (amount === undefined || amount === null) {
    errors.push('Amount is required');
  } else if (typeof amount !== 'number') {
    errors.push('Amount must be a number');
  } else if (amount <= 0) {
    errors.push('Amount must be greater than 0');
  }

  // Validate category
  if (!category || typeof category !== 'string') {
    errors.push('Category is required and must be a string');
  } else if (category.trim().length === 0) {
    errors.push('Category cannot be empty');
  } else if (category.length > 50) {
    errors.push('Category must be less than 50 characters');
  }

  // Validate note
  if (!note || typeof note !== 'string') {
    errors.push('Note is required and must be a string');
  } else if (note.trim().length === 0) {
    errors.push('Note cannot be empty');
  } else if (note.length > 500) {
    errors.push('Note must be less than 500 characters');
  }

  // Validate date
  if (!date || typeof date !== 'string') {
    errors.push('Date is required and must be a string');
  } else {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      errors.push('Date must be a valid ISO date string');
    }
  }

  if (errors.length > 0) {
    const response: ApiResponse<null> = {
      success: false,
      error: errors.join(', ')
    };
    res.status(400).json(response);
    return;
  }

  next();
}

/**
 * Validate expenses array for AI insights endpoint
 */
export function validateExpensesArray(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { expenses } = req.body;

  const errors: string[] = [];

  // Validate expenses array
  if (!expenses) {
    errors.push('Expenses array is required');
  } else if (!Array.isArray(expenses)) {
    errors.push('Expenses must be an array');
  } else if (expenses.length === 0) {
    errors.push('Expenses array cannot be empty');
  } else {
    // Validate each expense in the array
    expenses.forEach((expense: Expense, index: number) => {
      if (!expense.amount || typeof expense.amount !== 'number' || expense.amount <= 0) {
        errors.push(`Expense at index ${index}: amount must be a positive number`);
      }
      if (!expense.category || typeof expense.category !== 'string' || expense.category.trim().length === 0) {
        errors.push(`Expense at index ${index}: category is required and must be a non-empty string`);
      }
      if (!expense.note || typeof expense.note !== 'string' || expense.note.trim().length === 0) {
        errors.push(`Expense at index ${index}: note is required and must be a non-empty string`);
      }
      if (!expense.date || typeof expense.date !== 'string') {
        errors.push(`Expense at index ${index}: date is required and must be a string`);
      } else {
        const dateObj = new Date(expense.date);
        if (isNaN(dateObj.getTime())) {
          errors.push(`Expense at index ${index}: date must be a valid ISO date string`);
        }
      }
    });
  }

  if (errors.length > 0) {
    const response: ApiResponse<null> = {
      success: false,
      error: errors.join('; ')
    };
    res.status(400).json(response);
    return;
  }

  next();
}
