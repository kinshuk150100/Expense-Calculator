'use client';

import { useMemo } from 'react';
import type { Expense } from '@splitwise/shared';
import Card from './ui/Card';
import {
  formatCurrency,
  getCurrentMonthName,
  calculatePercentage,
} from '@/utils/formatters';

/**
 * Props for MonthlySummary component
 */
interface MonthlySummaryProps {
  /** Array of all expenses to filter and summarize */
  expenses: Expense[];
  /** Selected month (0-11, where 0 = January). If null, shows current month */
  selectedMonth?: number | null;
  /** Selected year. If null, shows current year */
  selectedYear?: number | null;
}

/**
 * MonthlySummary Component
 * 
 * Displays a summary of expenses for the current month, including:
 * - Total amount spent
 * - Number of expenses
 * - Category-wise breakdown with percentages
 * 
 * Features:
 * - Automatic filtering for current month
 * - Category totals calculation
 * - Visual progress bars for category spending
 * - Responsive design
 * 
 * @example
 * ```tsx
 * <MonthlySummary expenses={allExpenses} />
 * ```
 */
export default function MonthlySummary({ 
  expenses, 
  selectedMonth = null,
  selectedYear = null 
}: MonthlySummaryProps) {
  /**
   * Calculates monthly summary data
   * Memoized to prevent recalculation on every render
   */
  const summary = useMemo(() => {
    const now = new Date();
    const targetMonth = selectedMonth !== null ? selectedMonth : now.getMonth();
    const targetYear = selectedYear !== null ? selectedYear : now.getFullYear();

    // Filter expenses for selected month/year (or current month/year if not selected)
    // Since expenses are already filtered in parent, we can use them directly
    const monthlyExpenses = expenses;

    // Calculate total amount for the month
    const total = monthlyExpenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );

    // Calculate totals per category
    const categoryTotals: Record<string, number> = {};
    monthlyExpenses.forEach((expense) => {
      categoryTotals[expense.category] =
        (categoryTotals[expense.category] || 0) + expense.amount;
    });

    // Sort categories by amount (descending) for better visualization
    const sortedCategories = Object.entries(categoryTotals).sort(
      (a, b) => b[1] - a[1]
    );

    return {
      total,
      categoryTotals,
      sortedCategories,
      count: monthlyExpenses.length,
    };
  }, [expenses]);

  /**
   * Gets a color for category progress bar based on index
   * Cycles through colors for visual variety
   */
  const getCategoryColor = (index: number): string => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-red-500',
      'bg-orange-500',
    ];
    return colors[index % colors.length];
  };

  /**
   * Get the display title based on selected month/year
   */
  const getTitle = () => {
    if (selectedMonth !== null && selectedYear !== null) {
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      return `Summary - ${monthNames[selectedMonth]} ${selectedYear}`;
    } else if (selectedMonth !== null) {
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      return `Summary - ${monthNames[selectedMonth]}`;
    } else if (selectedYear !== null) {
      return `Summary - Year ${selectedYear}`;
    }
    return `Monthly Summary - ${getCurrentMonthName()}`;
  };

  return (
    <Card title={getTitle()}>
      {/* Total Expenses Card */}
      <div className="mb-6">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white shadow-lg">
          <p className="text-sm font-medium opacity-90 mb-1">Total Expenses</p>
          <p className="text-3xl sm:text-4xl font-bold mb-2">
            {formatCurrency(summary.total)}
          </p>
          <p className="text-sm opacity-90">
            {summary.count} {summary.count === 1 ? 'expense' : 'expenses'}
          </p>
        </div>
      </div>

      {/* Category Breakdown */}
      {summary.sortedCategories.length > 0 ? (
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            By Category
          </h3>
          <div className="space-y-4">
            {summary.sortedCategories.map(([category, amount], index) => {
              const percentage = (amount / summary.total) * 100;

              return (
                <div key={category} className="space-y-2">
                  {/* Category name and amount */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">{category}</span>
                    <span className="text-gray-600 font-semibold">
                      {formatCurrency(amount)} ({calculatePercentage(amount, summary.total)})
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`${getCategoryColor(index)} h-2.5 rounded-full transition-all duration-300`}
                      style={{ width: `${percentage}%` }}
                      role="progressbar"
                      aria-valuenow={percentage}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${category}: ${percentage.toFixed(1)}%`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <div className="text-3xl mb-2">📅</div>
          <p className="text-sm">
            {selectedMonth !== null || selectedYear !== null
              ? 'No expenses found for the selected period'
              : 'No expenses for this month yet'}
          </p>
        </div>
      )}
    </Card>
  );
}
