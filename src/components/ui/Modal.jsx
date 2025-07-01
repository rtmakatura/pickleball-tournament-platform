// src/components/ui/Modal.jsx - UPDATED: Enhanced header action styling with proper mobile touch support
import React from 'react';
import { X } from 'lucide-react';

/**
 * Modal Component - A reusable popup dialog with enhanced header actions
 * 
 * Props:
 * - isOpen: boolean - Controls if modal is visible
 * - onClose: function - Called when user wants to close modal
 * - title: string - Modal header title
 * - children: React nodes - Content inside the modal
 * - size: 'sm' | 'md' | 'lg' | 'xl' - Modal width
 * - headerAction: React node - Optional action button/element for header (like Update button)
 * - footerActions: React node - Optional footer actions
 */
const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  headerAction = null,
  footerActions = null
}) => {
  // Size classes for different modal widths
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg', 
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  // Close modal when clicking the backdrop (outside the modal)
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle scroll and escape key management
  React.useEffect(() => {
    if (!isOpen) return;

    // Store original overflow style
    const originalOverflow = document.body.style.overflow;
    
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';

    // Handle escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);

    // Cleanup function
    return () => {
      document.removeEventListener('keydown', handleEscape);
      // Restore original overflow style
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  // Don't render anything if modal is closed
  if (!isOpen) return null;

  return (
    <>
      {/* ENHANCED: Modal header button styles with proper mobile touch support */}
      <style dangerouslySetInnerHTML={{__html: `
        .modal-header-action {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .modal-header-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 500;
          border-radius: 8px;
          transition: all 0.2s ease;
          border: 1px solid transparent;
          cursor: pointer;
          white-space: nowrap;
          position: relative;
          text-decoration: none;
          
          /* Desktop sizing */
          min-height: 36px;
          min-width: 100px;
          padding: 8px 16px;
          font-size: 14px;
        }
        
        .modal-header-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        /* ENHANCED: Mobile - Icon-only buttons with perfect centering */
        @media (max-width: 768px) {
          .modal-header-button {
            min-height: 52px;
            min-width: 52px;
            padding: 0 !important;
            font-size: 15px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          /* Hide text on mobile, show only icons */
          .modal-header-button .button-text {
            display: none;
          }
          
          /* Perfect icon centering on mobile */
          .modal-header-button .icon {
            margin: 0 !important;
            padding: 0 !important;
            display: flex;
            align-items: center;
            justify-content: center;
            line-height: 1 !important;
            width: 24px;
            height: 24px;
          }
          
          .modal-header-button .icon svg {
            display: block;
            margin: 0 !important;
            padding: 0;
            vertical-align: middle;
          }
          
          .modal-header-action {
            gap: 8px;
          }
        }
        
        /* Desktop - Full text buttons with proper icon spacing */
        @media (min-width: 769px) {
          .modal-header-button .button-text {
            display: inline;
          }
          
          .modal-header-button .icon {
            margin-right: 8px;
            display: inline-flex;
            align-items: center;
          }
        }
        
        /* Variant styles */
        .modal-header-button-primary {
          background-color: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }
        
        .modal-header-button-primary:hover:not(:disabled) {
          background-color: #2563eb;
          border-color: #2563eb;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
        }
        
        .modal-header-button-danger {
          background-color: white;
          color: #dc2626;
          border-color: #dc2626;
        }
        
        .modal-header-button-danger:hover:not(:disabled) {
          background-color: #dc2626;
          color: white;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.25);
        }
        
        .modal-header-button-outline {
          background-color: white;
          color: #374151;
          border-color: #d1d5db;
        }
        
        .modal-header-button-outline:hover:not(:disabled) {
          background-color: #f9fafb;
          border-color: #9ca3af;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        /* Loading state */
        .modal-header-button-loading {
          cursor: wait;
        }
        
        .modal-header-button-loading:disabled {
          opacity: 0.8;
        }
        
        .loading-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-right: 8px;
          flex-shrink: 0;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        /* Active state for mobile */
        @media (max-width: 768px) {
          .modal-header-button:active:not(:disabled) {
            transform: scale(0.96);
          }
        }
        
        /* Enhanced loading state for mobile */
        @media (max-width: 768px) {
          .modal-header-button .loading-spinner {
            margin-right: 0;
            width: 20px;
            height: 20px;
          }
        }
      `}} />

      {/* Full-screen backdrop with dark overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={handleBackdropClick}
      >
        {/* Modal container */}
        <div 
          className={`
            bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]} 
            max-h-[90vh] overflow-hidden flex flex-col
          `}
        >
          {/* ENHANCED: Modal Header with better action support */}
          <div className="flex items-center justify-between p-4 border-b bg-white">
            <h2 className="text-lg font-semibold text-gray-900 flex-1 mr-4">
              {title}
            </h2>
            
            {/* Enhanced header action layout */}
            <div className="flex items-center">
              {headerAction && (
                <div className="modal-header-action mr-3">
                  {headerAction}
                </div>
              )}
              
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0 ml-2"
                title="Close"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Modal Body - scrollable if content is too long */}
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>

          {/* Optional Footer Actions */}
          {footerActions && (
            <div className="border-t bg-gray-50 px-4 py-3">
              {footerActions}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

/**
 * ENHANCED: Modal Header Button Component with responsive icon/text display
 */
export const ModalHeaderButton = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  disabled = false, 
  loading = false,
  type = 'button',
  form = null,
  className = '',
  icon = null,
  ...props 
}) => {
  const baseClass = 'modal-header-button';
  const variantClass = `modal-header-button-${variant}`;
  const loadingClass = loading ? 'modal-header-button-loading' : '';
  
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
      form={form}
      onClick={handleClick}
      disabled={disabled || loading}
      className={`${baseClass} ${variantClass} ${loadingClass} ${className}`}
      {...props}
    >
      {loading && <div className="loading-spinner" />}
      {icon && !loading && <span className="icon">{icon}</span>}
      {children && <span className="button-text">{children}</span>}
    </button>
  );
};

export default Modal;