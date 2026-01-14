'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import toast from 'react-hot-toast';
import { getAuthToken, removeAuthToken, getCurrentUser, login as apiLogin, logout as apiLogout } from '@/lib/api';
import type { LoginInput, LoginResponse } from '@splitwise/shared';

interface AuthContextType {
  user: LoginResponse['user'] | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider Component
 * 
 * Provides authentication state and methods to child components
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LoginResponse['user'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on client side before doing any auth checks
  useEffect(() => {
    setIsClient(true);
  }, []);

  /**
   * Check if user is authenticated by verifying token
   * Since we're using httpOnly cookies, we always try to fetch the user
   * The backend will validate the cookie and return user data or error
   * This function is designed to never hang - it has aggressive timeouts
   */
  const checkAuth = useCallback(async () => {
    setIsLoading(true);
    
    // Create a promise that will reject after 1 second (very aggressive timeout)
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Auth check timeout')), 1000);
    });
    
    try {
      // Race between getCurrentUser and timeout
      const userData = await Promise.race([
        getCurrentUser(),
        timeoutPromise
      ]);
      setUser(userData);
    } catch (error) {
      // If API call fails (network error, timeout, or invalid token), treat as not authenticated
      // This is expected if user is not logged in - 401, 403, network errors, etc.
      console.log('Auth check: User not authenticated', error instanceof Error ? error.message : 'Unknown error');
      removeAuthToken();
      setUser(null);
    } finally {
      // Always set loading to false, regardless of success or failure
      // Using finally ensures this always executes
      setIsLoading(false);
    }
  }, []);

  /**
   * Login user
   * Shows toast notification on error
   */
  const login = useCallback(async (credentials: LoginInput) => {
    try {
      const result = await apiLogin(credentials);
      setUser(result.user);
    } catch (error) {
      // Error toast is handled by the calling component
      throw error;
    }
  }, []);

  /**
   * Logout user
   * Shows toast notification on success
   */
  const logout = useCallback(async () => {
    try {
      await apiLogout();
      setUser(null);
      toast.success('Logged out successfully');
    } catch (error) {
      // Even if API call fails, remove token and user
      removeAuthToken();
      setUser(null);
      toast.error('Error during logout, but you have been logged out');
    }
  }, []);

  // Check authentication on mount (only on client side)
  useEffect(() => {
    // Don't run auth check during SSR
    if (!isClient) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    let safetyTimeout: NodeJS.Timeout;
    let forceTimeout: NodeJS.Timeout;
    
    // AGGRESSIVE safety timeout - force loading to false after 2 seconds MAX
    // This ensures the page NEVER gets stuck on loading
    forceTimeout = setTimeout(() => {
      if (isMounted) {
        console.warn('Auth check timeout - forcing loading state to false');
        setIsLoading(false);
      }
    }, 2000); // 2 second MAX timeout - page will show content even if auth check fails

    // Additional safety timeout for cleanup
    safetyTimeout = setTimeout(() => {
      if (isMounted) {
        console.warn('Auth check still loading after safety timeout - forcing false');
        setIsLoading(false);
      }
    }, 1500); // 1.5 second safety check

    // Wrap checkAuth in try-catch to ensure finally always runs
    Promise.resolve(checkAuth())
      .catch((error) => {
        console.error('Auth check error:', error);
        if (isMounted) {
          setIsLoading(false);
        }
      })
      .finally(() => {
        if (safetyTimeout) {
          clearTimeout(safetyTimeout);
        }
        if (forceTimeout) {
          clearTimeout(forceTimeout);
        }
      });

    return () => {
      isMounted = false;
      if (safetyTimeout) {
        clearTimeout(safetyTimeout);
      }
      if (forceTimeout) {
        clearTimeout(forceTimeout);
      }
    };
  }, [checkAuth, isClient]);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

