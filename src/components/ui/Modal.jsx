// src/components/ui/Modal.jsx - UPDATED: Enhanced header action styling with proper mobile touch support
import React from 'react';
import ReactDOM from 'react-dom';
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
  footerActions = null,
  variant = 'default'
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

  // Stable modal effect with minimal dependencies
  React.useEffect(() => {
    if (!isOpen) return;

    const body = document.body;
    const originalOverflow = body.style.overflow;
    
    // Apply modal styles
    body.style.overflow = 'hidden';

    // Stable escape handler
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleEscape);
      body.style.overflow = originalOverflow || 'auto';
    };
  }, [isOpen]); // REMOVED onClose from dependencies

  // Don't render anything if modal is closed
  if (!isOpen) return null;

  // Portal the modal to document.body to escape stacking contexts
  return ReactDOM.createPortal(
    <>
      {/* ENHANCED: Modal header button styles with proper mobile touch support */}
      <style dangerouslySetInnerHTML={{__html: `
        .modal-header-action {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
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
          flex-shrink: 0;
          
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
        
        /* ENHANCED: Better mobile responsiveness */
        @media (max-width: 480px) {
          .modal-header-action {
            gap: 6px;
            margin-right: 8px;
            flex-wrap: nowrap;
            overflow: visible;
          }
          
          .modal-header-button {
            min-height: 44px;
            min-width: 44px;
            max-width: 44px;
            padding: 0 !important;
            font-size: 16px;
            border-radius: 10px;
            flex-shrink: 0;
          }
          
          /* Hide text on very small screens */
          .modal-header-button .button-text {
            display: none;
          }
          
          .modal-header-button .icon {
            margin: 0 !important;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .modal-header-button .icon svg {
            width: 18px;
            height: 18px;
            display: block;
          }
        }
        
        /* Medium mobile screens */
        @media (min-width: 481px) and (max-width: 768px) {
          .modal-header-action {
            gap: 8px;
            margin-right: 12px;
          }
          
          .modal-header-button {
            min-height: 48px;
            min-width: 48px;
            max-width: 48px;
            padding: 0 !important;
            font-size: 16px;
            border-radius: 12px;
            flex-shrink: 0;
          }
          
          /* Hide text on mobile, show only icons */
          .modal-header-button .button-text {
            display: none;
          }
          
          .modal-header-button .icon {
            margin: 0 !important;
            width: 22px;
            height: 22px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .modal-header-button .icon svg {
            width: 20px;
            height: 20px;
            display: block;
          }
        }
        
        /* Desktop - Full text buttons with proper icon spacing */
        @media (min-width: 769px) {
          .modal-header-action {
            gap: 12px;
            margin-right: 16px;
          }
          
          .modal-header-button .button-text {
            display: inline;
          }
          
          .modal-header-button .icon {
            margin-right: 8px;
            display: inline-flex;
            align-items: center;
            width: 16px;
            height: 16px;
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
        }
        
        .modal-header-button-danger:hover:not(:disabled) {
          background-color: #dc2626;
          color: white;
        }
        
        .modal-header-button-outline:hover:not(:disabled) {
          background-color: #f9fafb;
          border-color: #9ca3af;
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
          .modal-header-button .loading-spinner {
            margin-right: 0;
            width: 18px;
            height: 18px;
          }
        }
      `}} />

      {/* Full-screen backdrop with dark overlay */}
      <div 
        className="modal-backdrop fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
        onClick={handleBackdropClick}
      >
        {/* Modal container */}
        <div 
          className={`
            modal-content bg-white shadow-2xl w-full ${sizeClasses[size]} 
            max-h-[90vh] overflow-hidden flex flex-col animate-fade-in-up
            ${variant === 'notification' 
              ? 'rounded-2xl shadow-2xl border border-gray-200 ring-1 ring-gray-300' 
              : 'rounded-2xl border border-gray-200 ring-1 ring-gray-300'
            }
          `}
        >
          {/* ENHANCED: Modal Header with better action support and mobile optimization */}
          <div className={`flex items-center justify-between border-b ${
            variant === 'notification' 
              ? 'p-3 sm:p-8 bg-gradient-to-r from-gray-50 to-white border-gray-200' 
              : 'p-2 sm:p-6 bg-gradient-to-r from-gray-50 to-white border-gray-200'
          }`}>
            <h2 className={`font-semibold text-gray-900 flex-1 min-w-0 mr-2 sm:mr-4 truncate ${
              variant === 'notification' 
                ? 'text-lg sm:text-xl' 
                : 'text-base sm:text-lg'
            }`}>
              {title}
            </h2>
            
            {/* Enhanced header action layout with mobile optimization */}
            <div className="flex items-center flex-shrink-0">
              {headerAction && (
                <div className="modal-header-action">
                  {headerAction}
                </div>
              )}
              
              <button
                onClick={onClose}
                className="p-2 sm:p-1.5 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0 ml-1 sm:ml-2 min-w-[44px] min-h-[44px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center"
                title="Close"
              >
                <X className="h-5 w-5 sm:h-5 sm:w-5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Modal Body - scrollable if content is too long */}
          <div className="flex-1 overflow-y-auto">
            <div className={variant === 'notification' ? 'p-2 sm:p-6' : ''}>
              {children}
            </div>
          </div>

          {/* Optional Footer Actions */}
          {footerActions && (
            <div className="border-t bg-gray-50 px-4 py-3">
              {footerActions}
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
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

export default React.memo(Modal);