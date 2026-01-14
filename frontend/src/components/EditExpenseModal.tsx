'use client';

import { useState, useEffect } from 'react';
import { Formik, Form, Field, FormikHelpers } from 'formik';
import type { Expense, CreateExpenseInput } from '@splitwise/shared';
import Button from './ui/Button';
import FormInput from './ui/FormInput';
import FormSelect from './ui/FormSelect';
import { EXPENSE_CATEGORIES } from '@/constants';
import { expenseValidationSchema } from '@/schemas/expenseSchema';
import { getCustomCategories, addCustomCategory, deleteCustomCategory } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

/**
 * Props for EditExpenseModal component
 */
interface EditExpenseModalProps {
    /** The expense to edit */
    expense: Expense;
    /** Callback function called when modal is closed */
    onClose: () => void;
    /** Callback function called when form is submitted successfully */
    onUpdate: (id: string, expense: CreateExpenseInput) => Promise<void>;
    /** Whether the form is currently submitting */
    isLoading?: boolean;
}

/**
 * EditExpenseModal Component
 * 
 * A modal component for editing existing expenses with Formik and Yup validation.
 * 
 * Features:
 * - Pre-filled form with existing expense data
 * - Formik for form state management
 * - Yup schema validation
 * - Real-time validation and error display
 * - Modal overlay with close functionality
 */
export default function EditExpenseModal({
    expense,
    onClose,
    onUpdate,
    isLoading = false,
}: EditExpenseModalProps) {
    const { isAuthenticated } = useAuth();
    // State for custom categories and input
    const [customCategories, setCustomCategories] = useState<string[]>([]);
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [customCategoryName, setCustomCategoryName] = useState('');
    const [isClient, setIsClient] = useState(false);

    // Ensure component only runs on client side
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

    /**
     * Initial form values from the expense
     */
    const initialValues: CreateExpenseInput = {
        amount: expense.amount,
        category: expense.category,
        note: expense.note,
        date: expense.date.split('T')[0], // Convert ISO date to YYYY-MM-DD format
    };

    /**
     * Handles form submission
     * Converts date to ISO string and calls onUpdate
     */
    const handleSubmit = async (
        values: CreateExpenseInput,
        { setSubmitting }: FormikHelpers<CreateExpenseInput>
    ) => {
        try {
            // Convert date to ISO string
            const expenseData: CreateExpenseInput = {
                ...values,
                date: new Date(values.date).toISOString(),
            };

            await onUpdate(expense.id, expenseData);
            setSubmitting(false);
        } catch (error) {
            setSubmitting(false);
            // Error is handled by the parent component via toast
        }
    };

    // Don't render modal content during SSR to prevent errors
    // This ensures localStorage access only happens on client
    if (!isClient) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-800">Edit Expense</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-2xl font-bold cursor-pointer"
                        aria-label="Close modal"
                    >
                        ×
                    </button>
                </div>

                <div className="p-6">
                    <Formik
                        initialValues={initialValues}
                        validationSchema={expenseValidationSchema}
                        onSubmit={handleSubmit}
                        enableReinitialize
                    >
                        {({ values, errors, touched, setFieldValue, isSubmitting, initialValues: initialFormValues }) => {
                            // Merge default and custom categories (only after client-side hydration)
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
                             * Only works on client side
                             */
                            const handleCategoryChange = (value: string) => {
                                if (!isClient) return;
                                
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
                             * Only works on client side
                             */
                            const handleAddCustomCategory = async () => {
                                if (!isClient) return;
                                
                                const trimmedName = customCategoryName.trim();
                                const currentAllCategories = [...EXPENSE_CATEGORIES, ...customCategories];
                                if (!trimmedName || currentAllCategories.includes(trimmedName)) {
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
                            const handleDeleteCustomCategory = async (categoryToDelete: string) => {
                                if (!isClient) return;
                                
                                try {
                                    await deleteCustomCategory(categoryToDelete);
                                    const newCategories = customCategories.filter(cat => cat !== categoryToDelete);
                                    setCustomCategories(newCategories);
                                    // Clear category field if the deleted category was selected
                                    if (values.category === categoryToDelete) {
                                        setFieldValue('category', initialFormValues.category);
                                    }
                                    toast.success('Custom category deleted successfully');
                                } catch (error) {
                                    const errorMessage = error instanceof Error ? error.message : 'Failed to delete custom category';
                                    toast.error(errorMessage);
                                    console.error('Error deleting custom category:', error);
                                }
                            };

                            // Check if any field has changed from initial values
                            const hasChanges = 
                                values.amount !== initialFormValues.amount ||
                                values.category !== initialFormValues.category ||
                                values.note !== initialFormValues.note ||
                                values.date !== initialFormValues.date;

                            return (
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
                                                            onChange={(e) => handleCategoryChange(e.target.value)}
                                                            options={categoryOptions}
                                                            placeholder="Select a category"
                                                            error={meta.touched && meta.error ? meta.error : undefined}
                                                            required
                                                        />
                                                        {/* Custom Categories List with Delete - Only show on client side */}
                                                        {isClient && customCategories.length > 0 && (
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
                                                                                onClick={() => handleDeleteCustomCategory(cat)}
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
                                                                    handleAddCustomCategory();
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
                                                                onClick={handleAddCustomCategory}
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
                                                                    setFieldValue('category', initialFormValues.category);
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
                                    <div className="flex gap-3 pt-4">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={onClose}
                                            className="flex-1"
                                            disabled={isSubmitting || isLoading}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            variant="primary"
                                            isLoading={isSubmitting || isLoading}
                                            className="flex-1"
                                            disabled={!hasChanges || isSubmitting || isLoading}
                                        >
                                            Update Expense
                                        </Button>
                                    </div>
                                </Form>
                            );
                        }}
                    </Formik>
                </div>
            </div>
        </div>
    );
}

