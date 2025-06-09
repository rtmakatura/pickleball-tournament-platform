// src/components/ui/ConfirmDialog.jsx
import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Button, Modal } from './';

/**
 * ConfirmDialog Component - For confirming destructive actions
 * 
 * Props:
 * - isOpen: boolean - Whether dialog is visible
 * - onClose: function - Called when dialog is closed
 * - onConfirm: function - Called when user confirms action
 * - title: string - Dialog title
 * - message: string - Confirmation message
 * - confirmText: string - Text for confirm button
 * - cancelText: string - Text for cancel button
 * - type: 'danger' | 'warning' - Dialog type for styling
 * - loading: boolean - Whether action is in progress
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
  const handleConfirm = () => {
    onConfirm();
  };

  const iconConfig = {
    danger: {
      icon: Trash2,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    warning: {
      icon: AlertTriangle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    }
  };

  const config = iconConfig[type];
  const Icon = config.icon;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="sm"
    >
      <div className="text-center">
        {/* Icon */}
        <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${config.bgColor} mb-4`}>
          <Icon className={`h-6 w-6 ${config.color}`} />
        </div>

        {/* Title */}
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {title}
        </h3>

        {/* Message */}
        <p className="text-sm text-gray-500 mb-6">
          {message}
        </p>

        {/* Actions */}
        <div className="flex space-x-3 justify-center">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>
          
          <Button
            variant="danger"
            onClick={handleConfirm}
            loading={loading}
            disabled={loading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;