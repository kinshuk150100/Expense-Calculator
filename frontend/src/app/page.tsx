'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useExpenses } from '@/hooks/useExpenses';
import ExpenseForm from '@/components/ExpenseForm';
import ExpenseList from '@/components/ExpenseList';
import MonthlySummary from '@/components/MonthlySummary';
import DateFilter from '@/components/DateFilter';
import SalaryReminder from '@/components/SalaryReminder';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ConfirmModal from '@/components/ui/ConfirmModal';
import type { Expense } from '@splitwise/shared';

/**
 * Home Page Component
 * 
 * Main page of the expense tracker application.
 * 
 * Features:
 * - Expense management (create, view)
 * - Monthly summary with category breakdown
 * - Comprehensive error handling
 * - Loading states
 * 
 * Layout:
 * - Responsive grid: 1 column on mobile, 3 columns on desktop
 * - Left column: Form
 * - Right column: Summary and Expense List
 */
export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const logoutTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Custom hook for expense management
  const {
    expenses,
    isLoading,
    isSubmitting,
    error,
    loadExpenses,
    addExpense,
    updateExpenseItem,
    clearError,
  } = useExpenses();

  // Date filter state
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  /**
   * Filter expenses based on selected month and year
   * Memoized to prevent unnecessary recalculation
   */
  const filteredExpenses = useMemo(() => {
    let filtered: Expense[] = [...expenses];

    // Filter by year if selected
    if (selectedYear !== null) {
      filtered = filtered.filter((expense) => {
        const expenseYear = new Date(expense.date).getFullYear();
        return expenseYear === selectedYear;
      });
    }

    // Filter by month if selected
    if (selectedMonth !== null) {
      filtered = filtered.filter((expense) => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === selectedMonth;
      });
    }

    return filtered;
  }, [expenses, selectedMonth, selectedYear]);

  // Redirect effect - separate from conditional render
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      const timer = setTimeout(() => {
        router.push('/login');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [authLoading, isAuthenticated, router]);

  /**
   * Fetch expenses on component mount (only if authenticated)
   */
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      loadExpenses();
    }
  }, [isAuthenticated, authLoading, loadExpenses]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (logoutTimeoutRef.current) {
        clearTimeout(logoutTimeoutRef.current);
      }
    };
  }, []);

  // Show loading state while checking authentication (with timeout protection)
  // After 3 seconds, we'll show content anyway (handled by AuthContext timeout)
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <LoadingSpinner size="lg" text="Loading..." />
          <p className="mt-4 text-sm text-gray-500 text-center">
            If this takes too long, please check your connection
          </p>
        </Card>
      </div>
    );
  }

  // Don't render content if not authenticated (will redirect)
  // But only if we're sure (not loading)
  if (!isAuthenticated && !authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <LoadingSpinner size="lg" text="Redirecting to login..." />
        </Card>
      </div>
    );
  }

  /**
   * Wrapper for expense submission
   * Converts the return type to match ExpenseForm's expected signature
   */
  const handleSubmitExpense = async (expenseData: Parameters<typeof addExpense>[0]) => {
    await addExpense(expenseData);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Container with responsive padding */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header Section */}
        <header className="mb-8 sm:mb-12">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-2">
                Expense Calculator
              </h1>
              <p className="text-base sm:text-lg text-gray-600">
                Track your expenses
              </p>
            </div>
            {user && (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 hidden sm:block">
                  Welcome, <span className="font-semibold text-gray-900">{user.name}</span>
                </span>
                <Button
                  variant="danger"
                  onClick={() => setShowLogoutModal(true)}
                  className="whitespace-nowrap"
                >
                  Logout
                </Button>
              </div>
            )}
          </div>
        </header>

        {/* Loading State - Show spinner while checking auth or loading expenses */}
        {authLoading || isLoading ? (
          <Card>
            <LoadingSpinner size="lg" text="Loading expenses..." />
          </Card>
        ) : (
          /* Main Content Grid */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Left Column: Form and Salary Reminder */}
            <aside className="lg:col-span-1 space-y-6">
              <SalaryReminder />
              <ExpenseForm onSubmit={handleSubmitExpense} isLoading={isSubmitting} />
            </aside>

            {/* Right Column: Summary and List */}
            <main className="lg:col-span-2 space-y-6">
              {/* Date Filter */}
              <Card>
                <DateFilter
                  selectedMonth={selectedMonth}
                  selectedYear={selectedYear}
                  onMonthChange={setSelectedMonth}
                  onYearChange={setSelectedYear}
                  expenses={expenses}
                />
              </Card>

              <MonthlySummary
                expenses={filteredExpenses}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
              />
              <ExpenseList
                expenses={filteredExpenses}
                onUpdateExpense={updateExpenseItem}
                isUpdating={isSubmitting}
              />
            </main>
          </div>
        )}
      </div>

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutModal}
        title="Confirm Logout"
        message="Are you sure you want to logout? You will need to login again to access your expenses."
        confirmLabel="Logout"
        cancelLabel="Cancel"
        confirmVariant="danger"
        onConfirm={async () => {
          setIsLoggingOut(true);
          try {
            await logout();
            // Small delay to show toast before redirect
            logoutTimeoutRef.current = setTimeout(() => {
              router.push('/login');
            }, 500);
          } catch (error) {
            console.error('Logout error:', error);
            setIsLoggingOut(false);
            setShowLogoutModal(false);
          }
        }}
        onCancel={() => setShowLogoutModal(false)}
        isLoading={isLoggingOut}
      />
    </div>
  );
}
