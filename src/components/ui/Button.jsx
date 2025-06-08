// src/components/ui/Button.jsx
import React from 'react';

/**
 * Button Component - A reusable button with different styles
 * 
 * Props:
 * - variant: 'primary' | 'secondary' | 'danger' | 'outline' - Button style
 * - size: 'sm' | 'md' | 'lg' - Button size
 * - disabled: boolean - Whether button is disabled
 * - loading: boolean - Shows loading state
 * - children: React nodes - Button content (text, icons)
 * - onClick: function - Click handler
 * - type: 'button' | 'submit' | 'reset' - HTML button type
 */
const Button = ({ 
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  children,
  onClick,
  type = 'button',
  className = '',
  ...props
}) => {
  // Base styles that apply to all buttons
  const baseStyles = `
    inline-flex items-center justify-center font-medium rounded-md 
    transition-colors duration-200 focus:outline-none focus:ring-2 
    focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed
  `;

  // Different visual styles for different button types
  const variants = {
    primary: `
      bg-green-600 hover:bg-green-700 text-white 
      focus:ring-green-500 disabled:hover:bg-green-600
    `,
    secondary: `
      bg-gray-100 hover:bg-gray-200 text-gray-900 
      focus:ring-gray-500 disabled:hover:bg-gray-100
    `,
    danger: `
      bg-red-600 hover:bg-red-700 text-white 
      focus:ring-red-500 disabled:hover:bg-red-600
    `,
    outline: `
      border border-gray-300 bg-white hover:bg-gray-50 text-gray-700
      focus:ring-gray-500 disabled:hover:bg-white
    `
  };

  // Different sizes
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm', 
    lg: 'px-6 py-3 text-base'
  };

  // Combine all styles
  const buttonClasses = `
    ${baseStyles} 
    ${variants[variant]} 
    ${sizes[size]} 
    ${className}
  `.trim();

  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {/* Show loading spinner if loading */}
      {loading && (
        <svg 
          className="animate-spin -ml-1 mr-2 h-4 w-4" 
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