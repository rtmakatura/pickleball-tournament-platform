// src/components/ui/Alert.jsx
import React from 'react';
import { CheckCircle, AlertCircle, XCircle, Info, X } from 'lucide-react';

/**
 * Alert Component - For showing notifications and messages
 * 
 * Props:
 * - type: 'success' | 'warning' | 'error' | 'info' - Alert style
 * - title: string - Alert title
 * - message: string - Alert message
 * - onClose: function - Called when close button clicked
 * - className: string - Additional CSS classes
 */
export const Alert = ({ 
  type = 'info',
  title,
  message,
  onClose,
  actions,
  className = '' 
}) => {
  console.log('🚨 Alert component props:', { type, title, message: typeof message, actions: !!actions });
  // Icon and styling for each alert type
  const alertConfig = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      iconColor: 'text-green-400',
      titleColor: 'text-green-800',
      messageColor: 'text-green-700'
    },
    warning: {
      icon: AlertCircle,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      iconColor: 'text-yellow-400',
      titleColor: 'text-yellow-800',
      messageColor: 'text-yellow-700'
    },
    error: {
      icon: XCircle,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      iconColor: 'text-red-400',
      titleColor: 'text-red-800',
      messageColor: 'text-red-700'
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-400',
      titleColor: 'text-blue-800',
      messageColor: 'text-blue-700'
    }
  };

  const config = alertConfig[type];
  const Icon = config.icon;

  return (
    <div className={`
      rounded-md border p-4 ${config.bgColor} ${config.borderColor} ${className}
    `}>
      <div className="flex">
        <div className="flex-shrink-0">
          <Icon className={`h-5 w-5 ${config.iconColor}`} />
        </div>
        
        <div className="ml-3 flex-1">
          {title && (
            <h3 className={`text-sm font-medium ${config.titleColor}`}>
              {title}
            </h3>
          )}
          {message && (
            <div className={`${title ? 'mt-2' : ''} text-sm ${config.messageColor}`}>
              {typeof message === 'string' ? <p>{message}</p> : message}
            </div>
          )}
          {actions && (
            <div className="mt-3">
              {actions}
            </div>
          )}
        </div>

        {onClose && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                onClick={onClose}
                className={`
                  inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2
                  ${config.iconColor} hover:${config.bgColor}
                `}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alert;