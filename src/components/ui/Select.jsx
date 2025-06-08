// src/components/ui/Select.jsx
import React from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Select Component - A reusable dropdown select field
 * 
 * Props:
 * - label: string - Label text above the select
 * - value: string - Selected value (controlled component)
 * - onChange: function - Called when selection changes
 * - options: array - Array of {value, label} objects for dropdown options
 * - placeholder: string - Placeholder text when no option selected
 * - error: string - Error message to display
 * - required: boolean - Whether field is required
 * - disabled: boolean - Whether select is disabled
 * - helperText: string - Helper text below select
 */
const Select = ({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Select an option...',
  error,
  required = false,
  disabled = false,
  helperText,
  className = '',
  ...props
}) => {
  // Generate unique ID for accessibility
  const selectId = React.useId();

  // Select styling - changes based on error state
  const selectClasses = `
    w-full px-3 py-2 border rounded-md shadow-sm text-sm
    focus:outline-none focus:ring-2 focus:ring-offset-0
    disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
    appearance-none bg-white cursor-pointer
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
          htmlFor={selectId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Select Field Container */}
      <div className="relative">
        <select
          id={selectId}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={selectClasses}
          {...props}
        >
          {/* Placeholder option */}
          <option value="" disabled>
            {placeholder}
          </option>
          
          {/* Dynamic options */}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Custom dropdown arrow */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </div>
      </div>

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

export default Select;