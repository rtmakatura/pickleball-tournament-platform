// src/components/auth/SignInForm.jsx
import React, { useState } from 'react';
import { Mail, Lock, LogIn } from 'lucide-react';
import { Button, Input, Alert } from '../ui';

/**
 * SignInForm Component - For existing users to sign in
 * 
 * Props:
 * - onSubmit: function - Called when form is submitted with credentials
 * - onSwitchToSignUp: function - Called to switch to sign up form
 * - loading: boolean - Whether sign in is in progress
 * - error: string - Error message to display
 */
const SignInForm = ({ 
  onSubmit, 
  onSwitchToSignUp, 
  loading = false,
  error = null 
}) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Handle input changes
  const handleChange = (field) => (e) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        email: formData.email.trim(),
        password: formData.password
      });
    } catch (err) {
      // Error handling is done by parent component
      console.error('Sign in error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const isLoading = loading || submitting;

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <LogIn className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
        <p className="text-gray-600 mt-2">
          Sign in to your PicklePortal account
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert
          type="error"
          title="Sign In Failed"
          message={error}
          className="mb-6"
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Field */}
        <Input
          label="Email Address"
          type="email"
          value={formData.email}
          onChange={handleChange('email')}
          error={errors.email}
          required
          placeholder="Enter your email"
          disabled={isLoading}
        />

        {/* Password Field */}
        <Input
          label="Password"
          type={showPassword ? "text" : "password"}
          value={formData.password}
          onChange={handleChange('password')}
          error={errors.password}
          required
          placeholder="Enter your password"
          disabled={isLoading}
        />

        {/* Show Password Toggle */}
        <div className="flex items-center">
          <input
            id="showPassword"
            type="checkbox"
            checked={showPassword}
            onChange={(e) => setShowPassword(e.target.checked)}
            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            disabled={isLoading}
          />
          <label htmlFor="showPassword" className="ml-2 block text-sm text-gray-900">
            Show password
          </label>
        </div>

        {/* Sign In Button */}
        <Button
          type="submit"
          className="w-full"
          loading={isLoading}
          disabled={isLoading}
        >
          {isLoading ? 'Signing In...' : 'Sign In'}
        </Button>

        {/* Forgot Password Link */}
        <div className="text-center">
          <button
            type="button"
            className="text-sm text-green-600 hover:text-green-500 focus:outline-none focus:underline"
            disabled={isLoading}
          >
            Forgot your password?
          </button>
        </div>

        {/* Switch to Sign Up */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToSignUp}
              className="font-medium text-green-600 hover:text-green-500 focus:outline-none focus:underline"
              disabled={isLoading}
            >
              Sign up instead
            </button>
          </p>
        </div>
      </form>

      {/* Additional Info */}
      <div className="mt-8 text-center text-xs text-gray-500">
        <p>
          Having trouble signing in? Make sure you're using the correct email and password
          for your PicklePortal account.
        </p>
      </div>
    </div>
  );
};

export default SignInForm;