// src/components/auth/SignUpForm.jsx
import React, { useState } from 'react';
import { UserPlus, Mail, Lock, User, Phone } from 'lucide-react';
import { Button, Input, Select, Alert } from '../ui';
import { SKILL_LEVELS } from '../../services/models';

/**
 * SignUpForm Component - Enhanced signup form that creates both auth account and member profile
 * 
 * Props:
 * - onSubmit: function - Called when form is submitted with signup data
 * - onSwitchToSignIn: function - Called to switch to sign in form
 * - loading: boolean - Whether signup is in progress
 * - error: string - Error message to display
 */
const SignUpForm = ({ 
  onSubmit, 
  onSwitchToSignIn, 
  loading = false,
  error = null 
}) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    skillLevel: ''
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

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
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    // Skill level validation
    if (!formData.skillLevel) {
      newErrors.skillLevel = 'Please select your skill level';
    }

    // Phone number validation (optional but must be valid if provided)
    if (formData.phoneNumber && !/^\+?[\d\s\-\(\)]{10,}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Prepare signup data
    const signupData = {
      email: formData.email.trim(),
      password: formData.password,
      memberData: {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        skillLevel: formData.skillLevel
      }
    };

    onSubmit(signupData);
  };

  // Skill level options
  const skillLevelOptions = Object.entries(SKILL_LEVELS).map(([key, value]) => ({
    value,
    label: key.charAt(0) + key.slice(1).toLowerCase()
  }));

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <UserPlus className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Join PicklePortal</h2>
        <p className="text-gray-600 mt-2">
          Create your account to participate in tournaments and leagues
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert
          type="error"
          title="Signup Failed"
          message={error}
          className="mb-6"
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              type="text"
              value={formData.firstName}
              onChange={handleChange('firstName')}
              error={errors.firstName}
              required
              placeholder="John"
            />

            <Input
              label="Last Name"
              type="text"
              value={formData.lastName}
              onChange={handleChange('lastName')}
              error={errors.lastName}
              required
              placeholder="Doe"
            />
          </div>

          <Input
            label="Phone Number"
            type="tel"
            value={formData.phoneNumber}
            onChange={handleChange('phoneNumber')}
            error={errors.phoneNumber}
            placeholder="(555) 123-4567"
            helperText="Optional - for tournament communications"
          />

          <Select
            label="Skill Level"
            value={formData.skillLevel}
            onChange={handleChange('skillLevel')}
            options={skillLevelOptions}
            error={errors.skillLevel}
            required
            placeholder="Select your current skill level"
            helperText="Be honest - this helps us match you with appropriate tournaments"
          />
        </div>

        {/* Account Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Account Information</h3>
          
          <Input
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={handleChange('email')}
            error={errors.email}
            required
            placeholder="john.doe@example.com"
            helperText="This will be your login email"
          />

          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={handleChange('password')}
            error={errors.password}
            required
            placeholder="Choose a secure password"
            helperText="At least 6 characters"
          />

          <Input
            label="Confirm Password"
            type={showPassword ? "text" : "password"}
            value={formData.confirmPassword}
            onChange={handleChange('confirmPassword')}
            error={errors.confirmPassword}
            required
            placeholder="Confirm your password"
          />

          <div className="flex items-center">
            <input
              id="showPassword"
              type="checkbox"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label htmlFor="showPassword" className="ml-2 block text-sm text-gray-900">
              Show passwords
            </label>
          </div>
        </div>

        {/* Terms and Signup */}
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">What you get:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Participate in tournaments and leagues</li>
              <li>• Track your payment status</li>
              <li>• View your game history and stats</li>
              <li>• Connect with the pickleball community</li>
            </ul>
          </div>

          <Button
            type="submit"
            className="w-full"
            loading={loading}
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </div>

        {/* Switch to Sign In */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToSignIn}
              className="font-medium text-green-600 hover:text-green-500 focus:outline-none focus:underline"
              disabled={loading}
            >
              Sign in instead
            </button>
          </p>
        </div>
      </form>
    </div>
  );
};

export default SignUpForm;