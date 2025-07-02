// src/components/ui/ConfirmDialog.jsx
import React from 'react';
import { AlertTriangle, Trash2, Archive, RotateCcw } from 'lucide-react';
import Button from './Button.jsx';
import Modal from './Modal.jsx';

/**
 * ConfirmDialog Component - Clean, minimal confirmation dialogs
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

  const getIcon = (type) => {
    switch (type) {
      case 'danger':
        return Trash2;
      case 'archive':
        return Archive;
      case 'restore':
        return RotateCcw;
      default:
        return AlertTriangle;
    }
  };

  const getConfirmVariant = (type) => {
    return type === 'danger' ? 'danger' : 'primary';
  };

  const Icon = getIcon(type);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="sm"
    >
      <div className="p-6 text-center">
        {/* Icon */}
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
          <Icon className="h-6 w-6 text-gray-600" />
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {title}
        </h3>

        {/* Message */}
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
          {message}
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="sm:order-1"
          >
            {cancelText}
          </Button>
          
          <Button
            variant={getConfirmVariant(type)}
            onClick={handleConfirm}
            loading={loading}
            disabled={loading}
            className="sm:order-2"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;