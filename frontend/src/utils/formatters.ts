/**
 * Utility functions for formatting data
 */

/**
 * Formats a number as currency (Indian Rupees)
 * @param amount - The amount to format
 * @returns Formatted currency string (e.g., "₹25.50")
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
}

/**
 * Formats a date string to a readable format
 * @param dateString - ISO date string
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export function formatDate(
  dateString: string,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }
): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', options);
}

/**
 * Gets the current month name and year
 * @returns Formatted month and year string (e.g., "January 2025")
 */
export function getCurrentMonthName(): string {
  return new Date().toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Calculates percentage of a value relative to total
 * @param value - The value to calculate percentage for
 * @param total - The total value
 * @param decimals - Number of decimal places (default: 1)
 * @returns Percentage string (e.g., "25.5%")
 */
export function calculatePercentage(
  value: number,
  total: number,
  decimals: number = 1
): string {
  if (total === 0) return '0%';
  return `${((value / total) * 100).toFixed(decimals)}%`;
}

