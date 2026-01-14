'use client';

import { useMemo, useState } from 'react';
import type { Expense, CreateExpenseInput } from '@splitwise/shared';
import Card from './ui/Card';
import { formatDate, formatCurrency } from '@/utils/formatters';
import { CATEGORY_COLORS } from '@/constants';
import EditExpenseModal from './EditExpenseModal';

/**
 * Props for ExpenseList component
 */
interface ExpenseListProps {
    /** Array of expenses to display */
    expenses: Expense[];
    /** Callback function to update an expense */
    onUpdateExpense: (id: string, expense: CreateExpenseInput) => Promise<Expense | void>;
    /** Whether an update is in progress */
    isUpdating?: boolean;
}

/**
 * ExpenseList Component
 * 
 * Displays a list of expenses sorted by date (newest first).
 * 
 * Features:
 * - Automatic sorting by date
 * - Category badges with color coding
 * - Responsive layout
 * - Empty state handling
 * 
 * @example
 * ```tsx
 * <ExpenseList expenses={expenses} />
 * ```
 */
function ExpenseList({ expenses, onUpdateExpense, isUpdating = false }: ExpenseListProps) {
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    /**
     * Sorts expenses by date (newest first)
     * Memoized to prevent unnecessary re-sorting
     */
    const sortedExpenses = useMemo(() => {
        return [...expenses].sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return dateB - dateA; // Newest first
        });
    }, [expenses]);

    /**
     * Gets the color class for a category badge
     * Falls back to 'Other' category color if not found
     */
    const getCategoryColor = (category: string): string => {
        return CATEGORY_COLORS[category] || CATEGORY_COLORS.Other;
    };

    // Empty state
    if (expenses.length === 0) {
        return (
            <Card title="Expenses">
                <div className="text-center py-12 px-4">
                    <div className="text-4xl mb-4">📝</div>
                    <p className="text-lg font-medium text-gray-700 mb-2">
                        No expenses found
                    </p>
                    <p className="text-sm text-gray-500">
                        Try adjusting the month/year filters or add a new expense!
                    </p>
                </div>
            </Card>
        );
    }

    return (
        <Card title="Expenses">
            <div className="space-y-3">
                {sortedExpenses.map((expense) => (
                    <div
                        key={expense.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between 
              gap-3 p-4 border border-gray-200 rounded-lg 
              hover:bg-gray-50 hover:shadow-sm transition-all
              cursor-default"
                    >
                        {/* Left side: Category, Date, and Note */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                                <span
                                    className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getCategoryColor(
                                        expense.category
                                    )}`}
                                >
                                    {expense.category}
                                </span>
                                <span className="text-sm text-gray-500 whitespace-nowrap">
                                    {formatDate(expense.date)}
                                </span>
                            </div>
                            <p className="text-gray-800 font-medium truncate">{expense.note}</p>
                        </div>

                        {/* Right side: Amount and Edit Button */}
                        <div className="text-left sm:text-right flex-shrink-0 flex items-center gap-3">
                            <p className="text-lg sm:text-xl font-bold text-gray-900">
                                {formatCurrency(expense.amount)}
                            </p>
                            <button
                                onClick={() => setEditingExpense(expense)}
                                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                aria-label="Edit expense"
                                title="Edit expense"
                                disabled={isUpdating}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            {editingExpense && (
                <EditExpenseModal
                    expense={editingExpense}
                    onClose={() => setEditingExpense(null)}
                    onUpdate={async (id, expenseData) => {
                        try {
                            await onUpdateExpense(id, expenseData);
                            setEditingExpense(null);
                        } catch (error) {
                            // Error is handled by toast in the hook
                        }
                    }}
                    isLoading={isUpdating}
                />
            )}
        </Card>
    );
}

export default ExpenseList;
