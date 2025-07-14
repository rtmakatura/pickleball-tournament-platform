// src/components/ui/Select.jsx - UPDATED: Custom dropdown that respects container boundaries
import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

/**
 * Select Component - A custom dropdown select field that respects container boundaries
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
 * - maxDropdownHeight: number - Maximum height of dropdown in pixels (default: 200)
 * - useNativeSelect: boolean - Force use of native select (for mobile compatibility)
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
  maxDropdownHeight = 200,
  useNativeSelect = false,
  ...props
}) => {
  // State for custom dropdown
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const selectRef = useRef(null);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Generate unique ID for accessibility
  const selectId = React.useId();

  // Detect if we should use native select (mobile devices) - DEBUGGING
  const shouldUseNative = useNativeSelect || false; // Temporarily force custom dropdown
  

  

  // Find selected option
  const selectedOption = options.find(opt => opt.value === value);

  // Filter options based on search term
  const filteredOptions = searchTerm 
    ? options.filter(option => 
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target) &&
          dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setSearchTerm('');
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

  // Update dropdown position when scrolling
  useEffect(() => {
    const updatePosition = () => {
      if (isOpen && dropdownRef.current && selectRef.current) {
        const rect = selectRef.current.getBoundingClientRect();
        dropdownRef.current.style.top = `${rect.bottom + 4}px`;
        dropdownRef.current.style.left = `${rect.left}px`;
        dropdownRef.current.style.minWidth = `${rect.width}px`;
      }
    };

    if (isOpen) {
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
    }

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  // Handle option selection
  const handleOptionSelect = (optionValue) => {
    const syntheticEvent = {
      target: { 
        value: optionValue,
        name: props.name || selectId 
      },
      currentTarget: { 
        value: optionValue,
        name: props.name || selectId 
      },
      type: 'change',
      preventDefault: () => {},
      stopPropagation: () => {}
    };
    onChange(syntheticEvent);
    setIsOpen(false);
    setSearchTerm('');
  };

  // Handle native select change
  const handleNativeChange = (e) => {
    onChange(e);
  };

  // Toggle dropdown
  const toggleDropdown = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
    if (!isOpen) {
      // Focus search input when opening
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 50);
    }
  };

  // Common styling classes
  const baseClasses = `
    w-full px-3 py-2 border rounded-md shadow-sm text-sm
    focus:outline-none focus:ring-2 focus:ring-offset-0
    disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
    ${error 
      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
      : 'border-gray-300 focus:border-green-500 focus:ring-green-500'
    }
    ${className}
  `.trim();

  // If using native select (mobile or forced)
  if (shouldUseNative) {
    return (
      <div className="space-y-1">
        {label && (
          <label 
            htmlFor={selectId}
            className="block text-sm font-medium text-gray-700"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          <select
            id={selectId}
            value={value}
            onChange={handleNativeChange}
            disabled={disabled}
            required={required}
            className={`${baseClasses} appearance-none bg-white cursor-pointer`}
            {...props}
          >
            <option value="" disabled>
              {placeholder}
            </option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </div>
        </div>

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

        {helperText && !error && (
          <p className="text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }

  // Custom dropdown implementation
  return (
    <>
      <div className="space-y-1">
        {label && (
          <label 
            htmlFor={selectId}
            className="block text-sm font-medium text-gray-700"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative" ref={selectRef}>
          {/* Custom Select Button */}
          <button
            type="button"
            id={selectId}
            className={`${baseClasses} bg-white cursor-pointer flex items-center justify-between text-left ${
              isOpen ? 'ring-2 ring-green-500 border-green-500' : ''
            }`}
            onClick={toggleDropdown}
            disabled={disabled}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            {...props}
          >
            <span className={`block truncate ${!selectedOption ? 'text-gray-500' : 'text-gray-900'}`}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <ChevronDown 
              className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                isOpen ? 'transform rotate-180' : ''
              }`} 
            />
          </button>
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

      {/* Custom Dropdown - PORTAL RENDERED */}
      {isOpen && typeof document !== 'undefined' && 
        ReactDOM.createPortal(
          <div
            ref={dropdownRef}
            className="fixed bg-white border border-gray-300 rounded-md shadow-lg"
            style={{
              maxHeight: maxDropdownHeight,
              minWidth: selectRef.current?.offsetWidth || '200px',
              top: selectRef.current ? selectRef.current.getBoundingClientRect().bottom + 4 : 0,
              left: selectRef.current ? selectRef.current.getBoundingClientRect().left : 0,
              zIndex: 999999
            }}
          >
            {/* Search Input */}
            {options.length > 5 && (
              <div className="p-2 border-b border-gray-200">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search options..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}

            {/* Options List */}
            <div 
              className="py-1 overflow-y-auto"
              style={{ maxHeight: options.length > 5 ? maxDropdownHeight - 50 : maxDropdownHeight }}
              role="listbox"
            >
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500 italic">
                  {searchTerm ? 'No options found' : 'No options available'}
                </div>
              ) : (
                filteredOptions.map((option) => (
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
          </div>,
          document.body
        )
      }
    </>
  );
};

export default Select;