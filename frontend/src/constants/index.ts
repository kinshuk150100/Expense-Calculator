/**
 * Application-wide constants
 */

/**
 * Available expense categories
 * @constant
 */
export const EXPENSE_CATEGORIES = [
  'Food',
  'Transport',
  'Shopping',
  'Bills',
  'Entertainment',
  'Healthcare',
  'Education',
  'Other',
] as const;

/**
 * Category color mappings for UI
 * @constant
 */
export const CATEGORY_COLORS: Record<string, string> = {
  Food: 'bg-orange-100 text-orange-800',
  Transport: 'bg-blue-100 text-blue-800',
  Shopping: 'bg-purple-100 text-purple-800',
  Bills: 'bg-red-100 text-red-800',
  Entertainment: 'bg-pink-100 text-pink-800',
  Healthcare: 'bg-green-100 text-green-800',
  Education: 'bg-indigo-100 text-indigo-800',
  Other: 'bg-gray-100 text-gray-800',
};

/**
 * Insight type icons mapping
 * @constant
 */
export const INSIGHT_TYPE_ICONS: Record<string, string> = {
  overspending: '⚠️',
  savings_suggestion: '💡',
  trend: '📊',
  recommendation: '💬',
};

/**
 * Insight type labels for display
 * @constant
 */
export const INSIGHT_TYPE_LABELS: Record<string, string> = {
  overspending: 'Overspending Alert',
  savings_suggestion: 'Savings Tip',
  trend: 'Spending Trend',
  recommendation: 'Recommendation',
};

/**
 * Responsive breakpoints (matching Tailwind defaults)
 * @constant
 */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;


