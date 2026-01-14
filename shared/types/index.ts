// Shared types for Splitwise application

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export interface Expense {
  id: string;
  userId?: string; // Optional - not exposed in API responses for security
  amount: number;
  category: string;
  note: string;
  date: string; // ISO date string
  createdAt: string; // ISO date string
}

export interface CreateExpenseInput {
  amount: number;
  category: string;
  note: string;
  date: string; // ISO date string
}

export interface ExpenseSummary {
  total: number;
  categoryTotals: Record<string, number>;
}

export interface Group {
  id: string;
  name: string;
  members: string[]; // User IDs
  expenses: string[]; // Expense IDs
  createdAt: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AIInsight {
  type: 'overspending' | 'savings_suggestion' | 'trend' | 'recommendation';
  category?: string;
  title: string;
  description: string;
  severity?: 'low' | 'medium' | 'high';
}

export interface AIInsightsResponse {
  insights: AIInsight[];
  summary: string;
  generatedAt: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface SalaryReminder {
  id: string;
  salaryDate: number; // Day of month (1-31)
  createdAt: string;
  updatedAt: string;
}

