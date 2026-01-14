'use client';

import { SelectHTMLAttributes, LabelHTMLAttributes } from 'react';

/**
 * Props for FormSelect component
 */
interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  labelProps?: LabelHTMLAttributes<HTMLLabelElement>;
}

/**
 * Reusable form select component with label and error handling
 * 
 * Features:
 * - Consistent styling with FormInput
 * - Error state visualization
 * - Accessible label association
 * - Placeholder option support
 * 
 * @example
 * ```tsx
 * <FormSelect
 *   label="Category"
 *   value={category}
 *   onChange={(e) => setCategory(e.target.value)}
 *   options={categories}
 *   error={errors.category}
 * />
 * ```
 */
export default function FormSelect({
  label,
  error,
  id,
  options,
  placeholder = 'Select an option',
  labelProps,
  className = '',
  ...selectProps
}: FormSelectProps) {
  // Generate ID if not provided (for label association)
  const selectId = id || `select-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="space-y-1">
      <label
        htmlFor={selectId}
        className="block text-sm font-medium text-gray-700 mb-1"
        {...labelProps}
      >
        {label}
      </label>
      <select
        id={selectId}
        className={`w-full px-4 py-2.5 border rounded-lg transition-colors
          focus:ring-2 focus:ring-blue-500 focus:border-transparent
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}
          ${className}`}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${selectId}-error` : undefined}
        {...selectProps}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p
          id={`${selectId}-error`}
          className="mt-1 text-sm text-red-600"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}


