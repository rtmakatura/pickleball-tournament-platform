// src/components/ui/ConfirmDialog.jsx
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Button from './Button';

/**
 * ConfirmDialog Component - Modal confirmation dialog
 */
const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
  loading = false
}) => {
  if (!isOpen) return null;

  const typeConfig = {
    danger: {
      icon: AlertTriangle,
      iconColor: 'text-red-600',
      buttonVariant: 'danger'
    },
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-yellow-600',
      buttonVariant: 'primary'
    },
    info: {
      icon: AlertTriangle,
      iconColor: 'text-blue-600',
      buttonVariant: 'primary'
    }
  };

  const config = typeConfig[type] || typeConfig.danger;
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        {/* Backdrop */}
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" />

        {/* Dialog */}
        <div className="relative inline-block w-full max-w-lg text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:align-middle">
          <div className="px-6 py-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Icon className={`h-6 w-6 ${config.iconColor}`} />
              </div>
              
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {title}
                </h3>
                <p className="text-sm text-gray-500">
                  {message}
                </p>
              </div>
            </div>
          </div>
          
          <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              {cancelText}
            </Button>
            
            <Button
              variant={config.buttonVariant}
              onClick={onConfirm}
              loading={loading}
              disabled={loading}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;