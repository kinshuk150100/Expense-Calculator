import * as Yup from 'yup';
import type { CreateExpenseInput } from '@splitwise/shared';

/**
 * Yup validation schema for expense form
 * 
 * Validates:
 * - amount: Must be a positive number greater than 0
 * - category: Must be selected (non-empty string)
 * - note: Must be provided and not empty
 * - date: Must be a valid date, not in the future
 */
export const expenseValidationSchema: Yup.ObjectSchema<CreateExpenseInput> = Yup.object({
  amount: Yup.number()
    .typeError('Amount must be a number')
    .positive('Amount must be greater than 0')
    .required('Amount is required')
    .test('max-length', 'Amount cannot exceed 6 digits', (value) => {
      if (!value) return true;
      const stringValue = value.toString().replace('.', '');
      return stringValue.length <= 6;
    }),

  category: Yup.string()
    .required('Category is required')
    .trim()
    .min(1, 'Category is required'),

  note: Yup.string()
    .required('Note is required')
    .trim()
    .min(1, 'Note cannot be empty')
    .max(200, 'Note cannot exceed 200 characters'),

  date: Yup.string()
    .required('Date is required')
    .test('valid-date', 'Date must be a valid date', (value) => {
      if (!value) return false;
      const date = new Date(value);
      return !isNaN(date.getTime());
    })
    .test('not-future', 'Date cannot be in the future', (value) => {
      if (!value) return true;
      const selectedDate = new Date(value);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today
      return selectedDate <= today;
    }),
});


