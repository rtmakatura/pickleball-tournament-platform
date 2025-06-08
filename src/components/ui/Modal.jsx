// src/components/ui/Modal.jsx
import React from 'react';
import { X } from 'lucide-react';

/**
 * Modal Component - A reusable popup dialog
 * 
 * Props:
 * - isOpen: boolean - Controls if modal is visible
 * - onClose: function - Called when user wants to close modal
 * - title: string - Modal header title
 * - children: React nodes - Content inside the modal
 * - size: 'sm' | 'md' | 'lg' | 'xl' - Modal width
 */
const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md' 
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
    // Full-screen backdrop with dark overlay
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
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Modal Body - scrollable if content is too long */}
        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;