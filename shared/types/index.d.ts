export interface User {
    id: string;
    name: string;
    email: string;
    createdAt: Date;
}
export interface Expense {
    id: string;
    amount: number;
    category: string;
    note: string;
    date: string;
    createdAt: string;
}
export interface CreateExpenseInput {
    amount: number;
    category: string;
    note: string;
    date: string;
}
export interface ExpenseSummary {
    total: number;
    categoryTotals: Record<string, number>;
}
export interface Group {
    id: string;
    name: string;
    members: string[];
    expenses: string[];
    createdAt: Date;
}
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
//# sourceMappingURL=index.d.ts.map