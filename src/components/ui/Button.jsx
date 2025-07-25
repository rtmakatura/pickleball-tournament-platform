// src/components/ui/Button.jsx
import React from 'react';

/**
 * Button Component - Reusable button with various styles and states
 * 
 * Props:
 * - variant: string - Button style variant
 * - size: string - Button size
 * - disabled: boolean - Whether button is disabled
 * - loading: boolean - Whether button shows loading state
 * - onClick: function - Click handler
 * - type: string - Button type (button, submit, reset)
 * - className: string - Additional CSS classes
 * - children: ReactNode - Button content
 */
const Button = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className = '',
  children,
  ...props
}) => {
  // Base button classes
  const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ease-out';
  
  // Performance-first variant classes - minimal effects only
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white shadow-sm transition-colors duration-150',
    secondary: 'bg-white border border-gray-300 hover:bg-gray-50 focus:ring-blue-500 text-gray-700 shadow-sm transition-colors duration-150',
    outline: 'border border-gray-300 bg-white hover:bg-gray-50 hover:border-blue-500 focus:ring-blue-500 text-gray-700 transition-colors duration-150',
    danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white shadow-sm transition-colors duration-150',
    ghost: 'hover:bg-gray-100 focus:ring-blue-500 text-gray-700 transition-colors duration-150',
  };
  
  // Size classes
  const sizeClasses = {
    sm: 'px-4 py-2.5 text-sm',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base',
  };
  
  // Disabled/loading state classes
  const stateClasses = {
    disabled: 'opacity-50 cursor-not-allowed',
    loading: 'cursor-not-allowed',
  };
  
  // Combine classes
  const buttonClasses = [
    baseClasses,
    variantClasses[variant] || variantClasses.primary,
    sizeClasses[size] || sizeClasses.md,
    (disabled || loading) && stateClasses.disabled,
    className
  ].filter(Boolean).join(' ');
  
  // Handle click
  const handleClick = (e) => {
    if (disabled || loading) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };
  
  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={handleClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
};

export default Button;