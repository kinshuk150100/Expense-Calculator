'use client';

import { useMemo } from 'react';

/**
 * Props for DateFilter component
 */
interface DateFilterProps {
    /** Selected month (0-11, where 0 = January) */
    selectedMonth: number | null;
    /** Selected year */
    selectedYear: number | null;
    /** Callback when month changes */
    onMonthChange: (month: number | null) => void;
    /** Callback when year changes */
    onYearChange: (year: number | null) => void;
    /** Array of expenses to determine available years */
    expenses: Array<{ date: string }>;
}

/**
 * DateFilter Component
 * 
 * Provides month and year dropdown filters for expenses.
 * 
 * Features:
 * - Month dropdown (January - December)
 * - Year dropdown (dynamically generated from expense dates)
 * - "All" option to show all expenses
 * - Responsive design
 */
export default function DateFilter({
    selectedMonth,
    selectedYear,
    onMonthChange,
    onYearChange,
    expenses,
}: DateFilterProps) {
    /**
     * Generate list of available years from 2000 to current year
     * Memoized to prevent recalculation
     */
    const availableYears = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const startYear = 2000;
        const years: number[] = [];

        // Generate years from 2000 to current year (inclusive)
        for (let year = currentYear; year >= startYear; year--) {
            years.push(year);
        }

        return years;
    }, []);

    /**
     * Month options
     */
    const monthOptions = [
        { value: 'all', label: 'All Months' },
        { value: '0', label: 'January' },
        { value: '1', label: 'February' },
        { value: '2', label: 'March' },
        { value: '3', label: 'April' },
        { value: '4', label: 'May' },
        { value: '5', label: 'June' },
        { value: '6', label: 'July' },
        { value: '7', label: 'August' },
        { value: '8', label: 'September' },
        { value: '9', label: 'October' },
        { value: '10', label: 'November' },
        { value: '11', label: 'December' },
    ];

    /**
     * Year options
     */
    const yearOptions = useMemo(() => {
        const options = [{ value: 'all', label: 'All Years' }];
        availableYears.forEach((year) => {
            options.push({ value: year.toString(), label: year.toString() });
        });
        return options;
    }, [availableYears]);

    /**
     * Handle month selection change
     */
    const handleMonthChange = (value: string) => {
        if (value === 'all') {
            onMonthChange(null);
        } else {
            onMonthChange(parseInt(value, 10));
        }
    };

    /**
     * Handle year selection change
     */
    const handleYearChange = (value: string) => {
        if (value === 'all') {
            onYearChange(null);
        } else {
            onYearChange(parseInt(value, 10));
        }
    };

    return (
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="flex-1 relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Filter by Month
                </label>
                <div className="relative">
                    <select
                        value={selectedMonth !== null ? selectedMonth.toString() : 'all'}
                        onChange={(e) => handleMonthChange(e.target.value)}
                        className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer appearance-none bg-white"
                    >
                        {monthOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    {/* Custom dropdown arrow */}
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
            </div>
            <div className="flex-1 relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Filter by Year
                </label>
                <div className="relative">
                    <select
                        value={selectedYear !== null ? selectedYear.toString() : 'all'}
                        onChange={(e) => handleYearChange(e.target.value)}
                        className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer appearance-none bg-white"
                    >
                        {yearOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    {/* Custom dropdown arrow */}
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    );
}

