// src/components/tournament/CustomDivisionDropdown.jsx - TARGETED FIX for division dropdown issue
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * CustomDivisionDropdown - Specifically designed to replace the problematic native select
 * in the division selector that's causing full-width dropdown issues
 */
const CustomDivisionDropdown = ({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Select an option...',
  error,
  required = false,
  disabled = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  // Find selected option
  const selectedOption = options.find(opt => opt.value === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  // Handle option selection
  const handleOptionSelect = (optionValue) => {
    // Create a synthetic event that matches what the Select component expects
    const syntheticEvent = {
      target: { value: optionValue }
    };
    onChange(syntheticEvent);
    setIsOpen(false);
  };

  // Toggle dropdown
  const toggleDropdown = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
  };

  // Generate unique ID
  const selectId = React.useId();

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

      {/* Custom Dropdown Container */}
      <div className="relative" ref={dropdownRef}>
        {/* Dropdown Button */}
        <button
          ref={buttonRef}
          type="button"
          id={selectId}
          className={`
            w-full px-3 py-2 border rounded-md shadow-sm text-sm
            focus:outline-none focus:ring-2 focus:ring-offset-0
            disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
            bg-white cursor-pointer flex items-center justify-between text-left
            ${error 
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
              : 'border-gray-300 focus:border-green-500 focus:ring-green-500'
            }
            ${isOpen ? 'ring-2 ring-green-500 border-green-500' : ''}
            ${className}
          `}
          onClick={toggleDropdown}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className={`block truncate ${!selectedOption ? 'text-gray-500' : 'text-gray-900'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown 
            className={`h-4 w-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ml-2 ${
              isOpen ? 'transform rotate-180' : ''
            }`} 
          />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div 
            className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
            style={{ 
              minWidth: '100%',
              maxWidth: '100%' // Ensure it doesn't exceed container width
            }}
          >
            <div className="py-1" role="listbox">
              {options.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500 italic">
                  No options available
                </div>
              ) : (
                options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`
                      w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none
                      flex items-center justify-between transition-colors duration-150
                      ${option.value === value ? 'bg-green-50 text-green-900' : 'text-gray-900'}
                    `}
                    onClick={() => handleOptionSelect(option.value)}
                    role="option"
                    aria-selected={option.value === value}
                  >
                    <span className="block truncate pr-2">{option.label}</span>
                    {option.value === value && (
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
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
    </div>
  );
};

export default CustomDivisionDropdown;