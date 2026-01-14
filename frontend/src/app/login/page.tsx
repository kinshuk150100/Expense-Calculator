'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import FormInput from '@/components/ui/FormInput';
import type { LoginInput } from '@splitwise/shared';

/**
 * Login Page Component
 * 
 * Allows users to login with email and password
 */
export default function LoginPage() {
    const router = useRouter();
    const { login, isAuthenticated, isLoading: authLoading } = useAuth();
    const [formData, setFormData] = useState<LoginInput>({
        email: '',
        password: '',
    });
    const [isLoading, setIsLoading] = useState(false);

    // Redirect if already authenticated
    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            router.push('/');
        }
    }, [authLoading, isAuthenticated, router]);

    // Show loading state while checking auth (with aggressive timeout protection)
    // After 1.5 seconds max, show login form anyway
    const [forceShowForm, setForceShowForm] = useState(false);
    
    useEffect(() => {
        // Force show login form after 1.5 seconds if still loading
        const timer = setTimeout(() => {
            setForceShowForm(true);
        }, 1500);
        
        return () => clearTimeout(timer);
    }, []);
    
    // Show loading only if auth is loading AND we haven't forced the form to show
    if (authLoading && !forceShowForm) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Card>
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading...</p>
                        <p className="mt-2 text-xs text-gray-400">This should only take a moment</p>
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
        setIsLoading(true);

        try {
            await login(formData);
            toast.success('Login successful!');
            router.push('/');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Login failed. Please try again.';
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (field: keyof LoginInput, value: string) => {
        setFormData((prev: LoginInput) => ({ ...prev, [field]: value }));
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                <Card>
                    <div className="text-center mb-6">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
                        <p className="text-gray-600">Login to your Expense Calculator account</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
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
                            onChange={(e) => handleChange('password', e.target.value)}
                            placeholder="Enter your password"
                            required
                            autoComplete="current-password"
                        />

                        <Button
                            type="submit"
                            variant="primary"
                            isLoading={isLoading}
                            className="w-full"
                        >
                            Login
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-600">
                        <p>
                            Don't have an account?{' '}
                            <a
                                href="/register"
                                className="text-blue-600 hover:text-blue-700 font-medium"
                            >
                                Register here
                            </a>
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
}

