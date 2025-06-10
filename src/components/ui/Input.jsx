// src/components/ui/Input.jsx
import React from 'react';

/**
 * Input Component - Reusable form input with label and validation
 */
const Input = ({
  label,
  type = 'text',
  value,
  onChange,
  error,
  helperText,
  required = false,
  disabled = false,
  placeholder,
  className = '',
  ...props
}) => {
  const inputClasses = [
    'block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm',
    'focus:outline-none focus:ring-blue-500 focus:border-blue-500',
    'disabled:bg-gray-50 disabled:text-gray-500',
    error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <input
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className={inputClasses}
        {...props}
      />
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

export default Input;