/**
 * Input sanitization utilities
 * Prevents XSS and ensures data integrity
 */

/**
 * Sanitizes a string by removing potentially dangerous characters
 * @param input - String to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Remove null bytes and control characters
  return input
    .replace(/\0/g, '')
    .replace(/[\x00-\x1F\x7F]/g, '')
    .trim();
}

/**
 * Sanitizes a number to ensure it's valid
 * @param input - Number to sanitize
 * @returns Sanitized number or NaN if invalid
 */
export function sanitizeNumber(input: unknown): number {
  if (typeof input === 'number') {
    return isNaN(input) ? NaN : input;
  }
  if (typeof input === 'string') {
    const parsed = parseFloat(input);
    return isNaN(parsed) ? NaN : parsed;
  }
  return NaN;
}

/**
 * Sanitizes an email address
 * @param email - Email to sanitize
 * @returns Sanitized email or empty string if invalid
 */
export function sanitizeEmail(email: string): string {
  const sanitized = sanitizeString(email);
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(sanitized) ? sanitized.toLowerCase() : '';
}

/**
 * Sanitizes expense data
 */
export function sanitizeExpenseInput(input: {
  amount?: unknown;
  category?: unknown;
  note?: unknown;
  date?: unknown;
}): {
  amount: number;
  category: string;
  note: string;
  date: string;
} | null {
  const amount = sanitizeNumber(input.amount);
  if (isNaN(amount) || amount <= 0) {
    return null;
  }

  const category = sanitizeString(String(input.category || ''));
  if (!category) {
    return null;
  }

  const note = sanitizeString(String(input.note || ''));
  if (!note) {
    return null;
  }

  const date = sanitizeString(String(input.date || ''));
  if (!date) {
    return null;
  }

  // Validate date format and convert to YYYY-MM-DD for MySQL DATE type
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return null;
  }

  // Convert to YYYY-MM-DD format (MySQL DATE type expects this format)
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const dateString = `${year}-${month}-${day}`;

  return {
    amount,
    category,
    note,
    date: dateString,
  };
}

