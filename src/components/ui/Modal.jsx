// src/components/ui/Modal.jsx - FIXED: Better header action styling and layout
import React from 'react';
import { X } from 'lucide-react';

/**
 * Modal Component - A reusable popup dialog with improved header actions
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
      {/* FIXED: Improved modal header button styles */}
      <style jsx>{`
        .modal-header-action {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .modal-header-button {
          min-height: 36px;
          min-width: 80px;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s ease;
          border: 1px solid transparent;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          white-space: nowrap;
        }
        
        .modal-header-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .modal-header-button-primary {
          background-color: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }
        
        .modal-header-button-primary:hover:not(:disabled) {
          background-color: #2563eb;
          border-color: #2563eb;
        }
        
        .modal-header-button-danger {
          background-color: white;
          color: #dc2626;
          border-color: #dc2626;
        }
        
        .modal-header-button-danger:hover:not(:disabled) {
          background-color: #dc2626;
          color: white;
        }
        
        .modal-header-button-loading {
          position: relative;
        }
        
        .modal-header-button-loading .loading-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-right: 8px;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        /* Mobile optimizations */
        @media (max-width: 768px) {
          .modal-header-button {
            min-height: 40px;
            min-width: 90px;
            padding: 10px 18px;
            font-size: 15px;
          }
          
          .modal-header-action {
            gap: 10px;
          }
        }
      `}</style>

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
          {/* FIXED: Enhanced Modal Header with better action support */}
          <div className="flex items-center justify-between p-4 border-b bg-white">
            <h2 className="text-lg font-semibold text-gray-900 flex-1 mr-4">
              {title}
            </h2>
            
            {/* FIXED: Better header action layout */}
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
 * FIXED: Modal Header Button Components for consistent styling
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
  ...props 
}) => {
  const baseClass = 'modal-header-button';
  const variantClass = `modal-header-button-${variant}`;
  const loadingClass = loading ? 'modal-header-button-loading' : '';
  
  return (
    <button
      type={type}
      form={form}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClass} ${variantClass} ${loadingClass} ${className}`}
      {...props}
    >
      {loading && <div className="loading-spinner" />}
      {children}
    </button>
  );
};

export default Modal;