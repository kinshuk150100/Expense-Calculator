import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import type { Expense, CreateExpenseInput } from '@splitwise/shared';
import { fetchExpenses, createExpense, updateExpense, type PaginatedExpensesResponse, type PaginationParams } from '@/lib/api';

/**
 * Custom hook for managing expenses state and operations
 * 
 * Provides:
 * - Expenses list state
 * - Loading states for different operations
 * - Error state management
 * - Functions to fetch and create expenses
 * 
 * @returns Object containing expenses state and operations
 */
export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches expenses from the API with optional pagination
   * Updates loading and error states accordingly
   * Shows toast notification on error
   * 
   * @param params - Optional pagination parameters
   */
  const loadExpenses = useCallback(async (params?: PaginationParams) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetchExpenses(params);
      setExpenses(response.expenses);
      return response;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load expenses';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error loading expenses:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Creates a new expense and adds it to the list
   * Uses optimistic update pattern - adds expense immediately to UI
   * Shows toast notifications for success and error
   * 
   * @param expenseData - The expense data to create
   * @throws Error if creation fails
   */
  const addExpense = useCallback(
    async (expenseData: CreateExpenseInput) => {
      try {
        setIsSubmitting(true);
        setError(null);
        
        // Create expense via API
        const newExpense = await createExpense(expenseData);
        
        // Optimistic update: add to beginning of list (newest first)
        setExpenses((prev) => [newExpense, ...prev]);
        
        // Show success toast
        toast.success('Expense added successfully!');
        
        return newExpense;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to create expense';
        setError(errorMessage);
        toast.error(errorMessage);
        throw err; // Re-throw to let caller handle it
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  /**
   * Updates an existing expense
   * Shows toast notifications for success and error
   * 
   * @param id - The ID of the expense to update
   * @param expenseData - The updated expense data
   * @throws Error if update fails
   */
  const updateExpenseItem = useCallback(
    async (id: string, expenseData: CreateExpenseInput) => {
      try {
        setIsSubmitting(true);
        setError(null);
        
        // Update expense via API
        const updatedExpense = await updateExpense(id, expenseData);
        
        // Update the expense in the list
        setExpenses((prev) =>
          prev.map((exp) => (exp.id === id ? updatedExpense : exp))
        );
        
        // Show success toast
        toast.success('Expense updated successfully!');
        
        return updatedExpense;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update expense';
        setError(errorMessage);
        toast.error(errorMessage);
        throw err; // Re-throw to let caller handle it
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  /**
   * Clears the current error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    expenses,
    isLoading,
    isSubmitting,
    error,
    loadExpenses,
    addExpense,
    updateExpenseItem,
    clearError,
  };
}

