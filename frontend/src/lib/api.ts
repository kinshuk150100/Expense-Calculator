import type {
  Expense,
  CreateExpenseInput,
  ExpenseSummary,
  ApiResponse,
  AIInsightsResponse,
  LoginInput,
  LoginResponse,
  RegisterInput,
} from "@splitwise/shared";

/**
 * API Base URL
 * Can be configured via NEXT_PUBLIC_API_URL environment variable
 * Defaults to localhost:4000 for development
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

/**
 * API utility functions for communicating with the backend
 * All functions include comprehensive error handling for network and HTTP errors
 */

/**
 * Handles API response with proper error handling
 *
 * This function:
 * 1. Checks HTTP status codes (200-299 are considered success)
 * 2. Attempts to parse error messages from API response
 * 3. Throws descriptive errors for different failure scenarios
 *
 * @template T - The expected response data type
 * @param response - The fetch Response object
 * @returns Promise resolving to the response data
 * @throws Error with descriptive message if request fails
 */
async function handleResponse<T>(response: Response): Promise<T> {
  // Check if response status is in success range (200-299)
  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;

    try {
      // Try to extract error message from API response
      const data: ApiResponse<T> = await response.json();
      errorMessage = data.error || errorMessage;
    } catch {
      // If response is not JSON, use status text
      errorMessage = response.statusText || errorMessage;
    }

    // Create error with status code for better handling
    const error = new Error(errorMessage) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  // Parse successful response
  const data: ApiResponse<T> = await response.json();

  // Validate response structure
  // Note: For DELETE operations, data.data might be null/undefined, which is valid
  if (!data.success) {
    throw new Error(data.error || "Request failed");
  }

  // For DELETE operations, data.data might be null/undefined, which is acceptable
  // Return data.data (which might be null for DELETE operations)
  return data.data as T;
}

/**
 * Pagination parameters for fetching expenses
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * Response type for paginated expenses
 */
export interface PaginatedExpensesResponse {
  expenses: Expense[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Fetches expenses from the backend with pagination support
 *
 * @param params - Optional pagination parameters
 * @returns Promise resolving to paginated expenses response
 * @throws Error if network request fails or backend returns error
 *
 * @example
 * ```ts
 * const { expenses, pagination } = await fetchExpenses({ page: 1, limit: 50 });
 * ```
 */
export async function fetchExpenses(
  params?: PaginationParams
): Promise<PaginatedExpensesResponse> {
  try {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const url = `${API_BASE_URL}/expenses${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;

    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include", // Include httpOnly cookies
    });

    return await handleResponse<PaginatedExpensesResponse>(response);
  } catch (error) {
    // Detect network errors (backend not running, CORS issues, etc.)
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(
        "Unable to connect to server. Please check if the backend is running."
      );
    }
    throw error;
  }
}

/**
 * Get custom categories for the current user
 * @returns Promise resolving to array of category names
 * @throws Error if request fails
 */
export async function getCustomCategories(): Promise<string[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/categories`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include",
    });

    return await handleResponse<string[]>(response);
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(
        "Unable to connect to server. Please check if the backend is running."
      );
    }
    throw error;
  }
}

/**
 * Add a custom category for the current user
 * @param categoryName - The name of the category to add
 * @returns Promise resolving to the created category
 * @throws Error if request fails
 */
export async function addCustomCategory(
  categoryName: string
): Promise<{ categoryName: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/categories`, {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify({ categoryName }),
    });

    return await handleResponse<{ categoryName: string }>(response);
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(
        "Unable to connect to server. Please check if the backend is running."
      );
    }
    throw error;
  }
}

/**
 * Delete a custom category for the current user
 * @param categoryName - The name of the category to delete
 * @throws Error if request fails
 */
export async function deleteCustomCategory(
  categoryName: string
): Promise<void> {
  try {
    const encodedCategoryName = encodeURIComponent(categoryName);
    const response = await fetch(
      `${API_BASE_URL}/categories/${encodedCategoryName}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include",
      }
    );

    await handleResponse<null>(response);
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(
        "Unable to connect to server. Please check if the backend is running."
      );
    }
    throw error;
  }
}

/**
 * Get salary reminder for the current user
 * @returns Promise resolving to salary reminder or null if not set
 * @throws Error if request fails
 */
export async function getSalaryReminder(): Promise<{
  id: string;
  salaryDate: number;
  createdAt: string;
  updatedAt: string;
} | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/salary`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include",
    });

    // Handle successful response with null data (no reminder set)
    if (response.ok) {
      const data: ApiResponse<{
        id: string;
        salaryDate: number;
        createdAt: string;
        updatedAt: string;
      } | null> = await response.json();

      // If API returns null data, return null
      if (!data.data || data.data === null) {
        return null;
      }

      return data.data;
    }

    // For non-200 responses, try to parse error
    if (response.status === 404) {
      return null; // Not found means no reminder set
    }

    // For other errors, use handleResponse which will throw
    return await handleResponse<{
      id: string;
      salaryDate: number;
      createdAt: string;
      updatedAt: string;
    } | null>(response);
  } catch (error) {
    // If it's a "not found" type error, return null instead of throwing
    if (error instanceof Error) {
      const errorWithStatus = error as Error & { status?: number };
      if (errorWithStatus.status === 404) {
        return null;
      }
    }
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(
        "Unable to connect to server. Please check if the backend is running."
      );
    }
    throw error;
  }
}

/**
 * Create or update salary reminder for the current user
 * @param salaryDate - Day of month (1-31) when salary is credited
 * @returns Promise resolving to the salary reminder
 * @throws Error if request fails
 */
export async function setSalaryReminder(salaryDate: number): Promise<{
  id: string;
  salaryDate: number;
  createdAt: string;
  updatedAt: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/salary`, {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify({ salaryDate }),
    });

    return await handleResponse<{
      id: string;
      salaryDate: number;
      createdAt: string;
      updatedAt: string;
    }>(response);
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(
        "Unable to connect to server. Please check if the backend is running."
      );
    }
    throw error;
  }
}

/**
 * Delete salary reminder for the current user
 * @throws Error if request fails
 */
export async function deleteSalaryReminder(): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/salary`, {
      method: "DELETE",
      headers: getAuthHeaders(),
      credentials: "include",
    });

    // For DELETE, we check success flag, not data
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const data: ApiResponse<null> = await response.json();
        errorMessage = data.error || errorMessage;
      } catch {
        errorMessage = response.statusText || errorMessage;
      }
      const error = new Error(errorMessage) as Error & { status?: number };
      error.status = response.status;
      throw error;
    }

    // Parse response to check success flag
    const data: ApiResponse<null> = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to delete salary reminder");
    }

    // DELETE operation successful (data.data is null/undefined, which is fine)
    return;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(
        "Unable to connect to server. Please check if the backend is running."
      );
    }
    throw error;
  }
}

/**
 * Creates a new expense
 *
 * @param expense - The expense data to create
 * @returns Promise resolving to the created expense with generated ID
 * @throws Error if validation fails or network request fails
 *
 * @example
 * ```ts
 * const newExpense = await createExpense({
 *   amount: 25.50,
 *   category: 'Food',
 *   note: 'Lunch',
 *   date: '2025-01-08T12:00:00Z'
 * });
 * ```
 */
export async function createExpense(
  expense: CreateExpenseInput
): Promise<Expense> {
  try {
    const response = await fetch(`${API_BASE_URL}/expenses`, {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include", // Include httpOnly cookies
      body: JSON.stringify(expense),
    });

    return await handleResponse<Expense>(response);
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(
        "Unable to connect to server. Please check if the backend is running."
      );
    }
    throw error;
  }
}

/**
 * Updates an existing expense
 *
 * @param id - The ID of the expense to update
 * @param expense - The updated expense data
 * @returns Promise resolving to the updated expense
 * @throws Error if validation fails or network request fails
 *
 * @example
 * ```ts
 * const updatedExpense = await updateExpense('expense-id', {
 *   amount: 30.00,
 *   category: 'Food',
 *   note: 'Dinner',
 *   date: '2025-01-08T12:00:00Z'
 * });
 * ```
 */
export async function updateExpense(
  id: string,
  expense: CreateExpenseInput
): Promise<Expense> {
  try {
    const response = await fetch(`${API_BASE_URL}/expenses/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      credentials: "include", // Include httpOnly cookies
      body: JSON.stringify(expense),
    });

    return await handleResponse<Expense>(response);
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(
        "Unable to connect to server. Please check if the backend is running."
      );
    }
    throw error;
  }
}

/**
 * Get custom categories for the current user
 * @returns Promise resolving to array of category names
 * @throws Error if request fails
 */

/**
 * Fetches expense summary (total and category-wise totals)
 *
 * @returns Promise resolving to expense summary
 * @throws Error if network request fails
 *
 * @example
 * ```ts
 * const summary = await fetchSummary();
 * console.log(summary.total); // Total amount
 * console.log(summary.categoryTotals); // Category breakdown
 * ```
 */
export async function fetchSummary(): Promise<ExpenseSummary> {
  try {
    const response = await fetch(`${API_BASE_URL}/expenses/summary`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include", // Include httpOnly cookies
    });

    return await handleResponse<ExpenseSummary>(response);
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(
        "Unable to connect to server. Please check if the backend is running."
      );
    }
    throw error;
  }
}

/**
 * Gets AI-powered insights for a list of expenses
 *
 * Sends expenses to the backend AI service which analyzes spending patterns
 * and returns actionable insights (overspending alerts, savings suggestions, etc.)
 *
 * @param expenses - Array of expenses to analyze
 * @returns Promise resolving to AI insights response
 * @throws Error if network request fails or backend returns error
 *
 * @example
 * ```ts
 * const insights = await getAIInsights(expenses);
 * insights.insights.forEach(insight => {
 *   console.log(insight.title, insight.description);
 * });
 * ```
 */
export async function getAIInsights(
  expenses: Expense[]
): Promise<AIInsightsResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/ai/insights`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expenses }),
    });

    return await handleResponse<AIInsightsResponse>(response);
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(
        "Unable to connect to server. Please check if the backend is running."
      );
    }
    throw error;
  }
}

/**
 * Get custom categories for the current user
 * @returns Promise resolving to array of category names
 * @throws Error if request fails
 */

/**
 * Get authentication token from localStorage
 * Safe for SSR - returns null on server side
 */
export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem("authToken");
  } catch (error) {
    console.error("Error accessing localStorage:", error);
    return null;
  }
}

/**
 * Set authentication token in localStorage
 * Safe for SSR - no-op on server side
 */
export function setAuthToken(token: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("authToken", token);
  } catch (error) {
    console.error("Error saving to localStorage:", error);
  }
}

/**
 * Remove authentication token from localStorage
 * Safe for SSR - no-op on server side
 */
export function removeAuthToken(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("authToken");
  } catch (error) {
    console.error("Error removing from localStorage:", error);
  }
}

/**
 * Get authorization headers with token
 */
function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Register a new user
 *
 * @param userData - Registration data (name, email, password)
 * @returns Promise resolving to login response with token
 * @throws Error if registration fails
 */
export async function register(
  userData: RegisterInput
): Promise<LoginResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Include httpOnly cookies
      body: JSON.stringify(userData),
    });

    const result = await handleResponse<LoginResponse>(response);

    // Store token
    if (result.token) {
      setAuthToken(result.token);
    }

    return result;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(
        "Unable to connect to server. Please check if the backend is running."
      );
    }
    throw error;
  }
}

/**
 * Get custom categories for the current user
 * @returns Promise resolving to array of category names
 * @throws Error if request fails
 */

/**
 * Login user
 *
 * @param credentials - Login credentials (email, password)
 * @returns Promise resolving to login response with token
 * @throws Error if login fails
 */
export async function login(credentials: LoginInput): Promise<LoginResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Include httpOnly cookies
      body: JSON.stringify(credentials),
    });

    const result = await handleResponse<LoginResponse>(response);

    // Store token
    if (result.token) {
      setAuthToken(result.token);
    }

    return result;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(
        "Unable to connect to server. Please check if the backend is running."
      );
    }
    throw error;
  }
}

/**
 * Get custom categories for the current user
 * @returns Promise resolving to array of category names
 * @throws Error if request fails
 */

/**
 * Logout user
 * Removes token from localStorage
 */
export async function logout(): Promise<void> {
  try {
    const token = getAuthToken();
    if (token) {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include", // Include httpOnly cookies
      });
    }
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    // Always remove token from localStorage
    removeAuthToken();
  }
}

/**
 * Get current user info
 *
 * @returns Promise resolving to user info
 * @throws Error if token is invalid or request fails
 */
export async function getCurrentUser(): Promise<{
  id: string;
  name: string;
  email: string;
}> {
  // AGGRESSIVE timeout to prevent hanging - 800ms max
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 800); // 800ms timeout

  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include", // Include httpOnly cookies
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Check for 401/403 - these are expected when not logged in, handle gracefully
    if (response.status === 401 || response.status === 403) {
      const error = new Error("Not authenticated") as Error & {
        status?: number;
      };
      error.status = response.status;
      throw error;
    }

    return await handleResponse<{ id: string; name: string; email: string }>(
      response
    );
  } catch (error) {
    clearTimeout(timeoutId); // Ensure timeout is cleared even on error

    // Handle abort/timeout - don't throw, just return null user (handled by AuthContext)
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Auth check timeout");
    }
    // Re-throw authentication errors (401/403) - these are expected
    if (error instanceof Error) {
      const errorWithStatus = error as Error & { status?: number };
      if (errorWithStatus.status === 401 || errorWithStatus.status === 403) {
        throw error;
      }
    }
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error("Auth check failed - network error");
    }
    throw error;
  }
}

/**
 * Get custom categories for the current user
 * @returns Promise resolving to array of category names
 * @throws Error if request fails
 */
