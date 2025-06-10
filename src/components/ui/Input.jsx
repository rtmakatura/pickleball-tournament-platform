// src/components/ui/Input.jsx
import React from 'react';

/**
 * Input Component - A reusable form input field
 * 
 * Props:
 * - label: string - Label text above the input
 * - type: string - HTML input type (text, email, password, number, date, etc.)
 * - placeholder: string - Placeholder text
 * - value: string/number - Input value (controlled component)
 * - onChange: function - Called when input value changes
 * - error: string - Error message to display
 * - required: boolean - Whether field is required
 * - disabled: boolean - Whether input is disabled
 * - helperText: string - Helper text below input
 */
const Input = ({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  helperText,
  className = '',
  ...props
}) => {
  // Generate unique ID for accessibility (label-input connection)
  const inputId = React.useId();

  // Input styling - changes based on error state
  const inputClasses = `
    w-full px-3 py-2 border rounded-md shadow-sm text-sm
    focus:outline-none focus:ring-2 focus:ring-offset-0
    disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
    ${error 
      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
      : 'border-gray-300 focus:border-green-500 focus:ring-green-500'
    }
    ${className}
  `.trim();

  return (
    <div className="space-y-1">
      {/* Label */}
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Input Field */}
      <input
        id={inputId}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={inputClasses}
        {...props}
      />

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-600 flex items-center">
          <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path 
              fillRule="evenodd" 
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
              clipRule="evenodd" 
            />
          </svg>
          {error}
        </p>
      )}

      {/* Helper Text */}
      {helperText && !error && (
        <p className="text-sm text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  );
};

export default Input;