'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { register } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import FormInput from '@/components/ui/FormInput';
import type { RegisterInput } from '@splitwise/shared';

/**
 * Register Page Component
 * 
 * Allows new users to create an account
 */
export default function RegisterPage() {
  const router = useRouter();
  const { checkAuth, isAuthenticated, isLoading: authLoading } = useAuth();
  const [formData, setFormData] = useState<RegisterInput>({
    name: '',
    email: '',
    password: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, router]);

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </Card>
      </div>
    );
  }

  // Don't render form if authenticated (will redirect)
  if (isAuthenticated) {
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validate passwords match
    if (formData.password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      toast.error('Passwords do not match');
      return;
    }

    // Clear any previous errors
    setPasswordError('');
    setIsLoading(true);

    try {
      await register(formData);
      // Refresh auth state after registration
      await checkAuth();
      toast.success('Registration successful! Welcome!');
      // Small delay to ensure auth state is updated
      setTimeout(() => {
        router.push('/');
      }, 100);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof RegisterInput, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Card>
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
            <p className="text-gray-600">Sign up</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <FormInput
              label="Name"
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Enter your name"
              required
              autoComplete="name"
            />

            <FormInput
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="Enter your email"
              required
              autoComplete="email"
            />

            <FormInput
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => {
                handleChange('password', e.target.value);
                // Clear password mismatch error when user starts typing
                if (passwordError && e.target.value === confirmPassword) {
                  setPasswordError('');
                }
              }}
              placeholder="Enter your password (min 6 characters)"
              required
              autoComplete="new-password"
              minLength={6}
            />

            <FormInput
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                // Validate passwords match in real-time
                if (formData.password && e.target.value && formData.password !== e.target.value) {
                  setPasswordError('Passwords do not match');
                } else {
                  setPasswordError('');
                }
              }}
              placeholder="Confirm your password"
              required
              autoComplete="new-password"
              minLength={6}
              error={passwordError}
            />

            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="w-full"
            >
              Register
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>
              Already have an account?{' '}
              <a
                href="/login"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Login here
              </a>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

