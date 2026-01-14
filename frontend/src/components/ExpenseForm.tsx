'use client';

import { useState, useEffect } from 'react';
import { Formik, Form, Field, FormikHelpers } from 'formik';
import type { CreateExpenseInput } from '@splitwise/shared';
import Card from './ui/Card';
import Button from './ui/Button';
import FormInput from './ui/FormInput';
import FormSelect from './ui/FormSelect';
import { EXPENSE_CATEGORIES } from '@/constants';
import { expenseValidationSchema } from '@/schemas/expenseSchema';
import { getCustomCategories, addCustomCategory, deleteCustomCategory } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

/**
 * Props for ExpenseForm component
 */
interface ExpenseFormProps {
    /** Callback function called when form is submitted successfully */
    onSubmit: (expense: CreateExpenseInput) => Promise<void>;
    /** Whether the form is currently submitting */
    isLoading?: boolean;
}

/**
 * Initial form values
 */
const initialValues: CreateExpenseInput = {
    amount: 0,
    category: '',
    note: '',
    date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
};

/**
 * ExpenseForm Component
 * 
 * A form component for creating new expenses with Formik and Yup validation.
 * 
 * Features:
 * - Formik for form state management
 * - Yup schema validation
 * - Real-time validation and error display
 * - Automatic form reset on successful submission
 * - Accessible form inputs with proper labels
 * 
 * @example
 * ```tsx
 * <ExpenseForm 
 *   onSubmit={handleSubmit} 
 *   isLoading={isSubmitting} 
 * />
 * ```
 */
export default function ExpenseForm({
    onSubmit,
    isLoading = false,
}: ExpenseFormProps) {
    const { isAuthenticated } = useAuth();
    /**
     * Handles form submission
     * Converts date to ISO string and calls onSubmit
     */
    const handleSubmit = async (
        values: CreateExpenseInput,
        { resetForm, setFieldValue }: FormikHelpers<CreateExpenseInput>
    ) => {
        try {
            // Convert date to ISO string for API compatibility
            const expenseData: CreateExpenseInput = {
                ...values,
                date: new Date(values.date).toISOString(),
            };

            await onSubmit(expenseData);

            // Reset form on successful submission
            resetForm();
            // Set date back to today after reset
            setFieldValue('date', new Date().toISOString().split('T')[0]);
        } catch (error) {
            // Error is handled by parent component
            console.error('Error submitting expense:', error);
        }
    };

    // State for custom categories and input
    // Initialize as empty array to prevent SSR issues
    const [customCategories, setCustomCategories] = useState<string[]>([]);
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [customCategoryName, setCustomCategoryName] = useState('');
    const [isClient, setIsClient] = useState(false);

    // Ensure component only runs on client side
    // This prevents any SSR issues with localStorage
    useEffect(() => {
        setIsClient(true);
    }, []);

    // Load custom categories from API on mount (only if authenticated)
    useEffect(() => {
        if (!isClient || !isAuthenticated) return;
        
        const loadCategories = async () => {
            try {
                const categories = await getCustomCategories();
                setCustomCategories(categories);
            } catch (error) {
                console.error('Error loading custom categories:', error);
                // Don't show toast for initial load failure
            }
        };
        
        loadCategories();
    }, [isClient, isAuthenticated]);

    // Merge default and custom categories (only after client-side hydration)
    // During SSR, only use default categories to prevent errors
    const allCategories = isClient ? [...EXPENSE_CATEGORIES, ...customCategories] : [...EXPENSE_CATEGORIES];
    
    // Convert categories array to options format for FormSelect
    // Only show "Add Custom Category" option on client side
    const categoryOptions = [
        ...allCategories.map((cat) => ({
            value: cat,
            label: cat,
        })),
        ...(isClient ? [{ value: '__ADD_CUSTOM__', label: '+ Add Custom Category' }] : []),
    ];

    /**
     * Handles category selection change
     */
    const handleCategoryChange = (value: string, setFieldValue: (field: string, value: any) => void) => {
        if (value === '__ADD_CUSTOM__') {
            setShowCustomInput(true);
            setFieldValue('category', '');
        } else {
            setShowCustomInput(false);
            setFieldValue('category', value);
        }
    };

    /**
     * Handles adding a new custom category
     */
    const handleAddCustomCategory = async (setFieldValue: (field: string, value: any) => void) => {
        const trimmedName = customCategoryName.trim();
        if (!trimmedName || allCategories.includes(trimmedName)) {
            return;
        }

        try {
            await addCustomCategory(trimmedName);
            const newCategories = [...customCategories, trimmedName];
            setCustomCategories(newCategories);
            setFieldValue('category', trimmedName);
            setCustomCategoryName('');
            setShowCustomInput(false);
            toast.success('Custom category added successfully');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to add custom category';
            toast.error(errorMessage);
            console.error('Error adding custom category:', error);
        }
    };

    /**
     * Handles deleting a custom category
     * Only works on client side
     */
    const handleDeleteCustomCategory = async (categoryToDelete: string, currentCategory: string, setFieldValue: (field: string, value: any) => void) => {
        if (!isClient) return;
        
        try {
            await deleteCustomCategory(categoryToDelete);
            const newCategories = customCategories.filter(cat => cat !== categoryToDelete);
            setCustomCategories(newCategories);
            // Clear category field if the deleted category was selected
            if (currentCategory === categoryToDelete) {
                setFieldValue('category', '');
            }
            toast.success('Custom category deleted successfully');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to delete custom category';
            toast.error(errorMessage);
            console.error('Error deleting custom category:', error);
        }
    };

    // Don't render form content during SSR to prevent errors
    // This ensures localStorage access only happens on client
    if (!isClient) {
        return (
            <Card title="Add New Expense">
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading form...</p>
                </div>
            </Card>
        );
    }

    return (
        <Card title="Add New Expense">
            <Formik
                initialValues={initialValues}
                validationSchema={expenseValidationSchema}
                onSubmit={handleSubmit}
                enableReinitialize
            >
                {({ values, errors, touched, setFieldValue, isSubmitting }) => (
                    <Form className="space-y-5">
                        {/* Amount Input */}
                        <Field name="amount">
                            {({ field, meta }: any) => (
                                <FormInput
                                    label="Amount (₹)"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={field.value || ''}
                                    onChange={(e) => {
                                        const value = parseFloat(e.target.value) || 0;
                                        setFieldValue('amount', value);
                                    }}
                                    placeholder="0.00"
                                    error={meta.touched && meta.error ? meta.error : undefined}
                                    required
                                />
                            )}
                        </Field>

                        {/* Category Select */}
                        <Field name="category">
                            {({ field, meta }: any) => (
                                <div className="space-y-2">
                                    {!showCustomInput ? (
                                        <>
                                            <FormSelect
                                                label="Category"
                                                value={field.value}
                                                onChange={(e) => handleCategoryChange(e.target.value, setFieldValue)}
                                                options={categoryOptions}
                                                placeholder="Select a category"
                                                error={meta.touched && meta.error ? meta.error : undefined}
                                                required
                                            />
                                            {/* Custom Categories List with Delete */}
                                            {customCategories.length > 0 && (
                                                <div className="mt-2">
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Your Custom Categories
                                                    </label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {customCategories.map((cat) => (
                                                            <div
                                                                key={cat}
                                                                className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-sm"
                                                            >
                                                                <span className="text-blue-800 font-medium">{cat}</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDeleteCustomCategory(cat, field.value, setFieldValue)}
                                                                    className="ml-1 text-blue-600 hover:text-red-600 transition-colors cursor-pointer"
                                                                    aria-label={`Delete ${cat} category`}
                                                                    title={`Delete ${cat}`}
                                                                >
                                                                    <svg
                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                        className="h-4 w-4"
                                                                        fill="none"
                                                                        viewBox="0 0 24 24"
                                                                        stroke="currentColor"
                                                                        strokeWidth={2}
                                                                    >
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            d="M6 18L18 6M6 6l12 12"
                                                                        />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="space-y-2">
                                            <FormInput
                                                label="Custom Category"
                                                type="text"
                                                value={customCategoryName}
                                                onChange={(e) => setCustomCategoryName(e.target.value)}
                                                placeholder="Enter category name"
                                                maxLength={50}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handleAddCustomCategory(setFieldValue);
                                                    } else if (e.key === 'Escape') {
                                                        setShowCustomInput(false);
                                                        setCustomCategoryName('');
                                                    }
                                                }}
                                                autoFocus
                                            />
                                            <div className="flex gap-2">
                                                <Button
                                                    type="button"
                                                    variant="primary"
                                                    onClick={() => handleAddCustomCategory(setFieldValue)}
                                                    disabled={!customCategoryName.trim()}
                                                    className="flex-1"
                                                >
                                                    Add Category
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    onClick={() => {
                                                        setShowCustomInput(false);
                                                        setCustomCategoryName('');
                                                        setFieldValue('category', '');
                                                    }}
                                                    className="flex-1"
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </Field>

                        {/* Note Input */}
                        <Field name="note">
                            {({ field, meta }: any) => (
                                <FormInput
                                    label="Note"
                                    type="text"
                                    value={field.value}
                                    onChange={(e) => setFieldValue('note', e.target.value)}
                                    placeholder="What was this expense for?"
                                    error={meta.touched && meta.error ? meta.error : undefined}
                                    required
                                />
                            )}
                        </Field>

                        {/* Date Input */}
                        <Field name="date">
                            {({ field, meta }: any) => (
                                <FormInput
                                    label="Date"
                                    type="date"
                                    value={field.value}
                                    onChange={(e) => setFieldValue('date', e.target.value)}
                                    max={new Date().toISOString().split('T')[0]} // Disable dates beyond today
                                    error={meta.touched && meta.error ? meta.error : undefined}
                                    required
                                />
                            )}
                        </Field>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            variant="primary"
                            isLoading={isLoading || isSubmitting}
                            className="w-full mt-2"
                        >
                            Add Expense
                        </Button>
                    </Form>
                )}
            </Formik>
        </Card>
    );
}
