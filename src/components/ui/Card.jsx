// src/components/ui/Card.jsx
import React from 'react';

/**
 * Card Component - Reusable card container with optional header and actions
 */
const Card = ({
  title,
  subtitle,
  actions,
  children,
  className = ''
}) => {
  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      {(title || subtitle || actions) && (
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              {title && (
                <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
              )}
              {subtitle && (
                <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
              )}
            </div>
            
            {actions && (
              <div className="flex items-center space-x-2">
                {Array.isArray(actions) ? actions.map((action, index) => (
                  <React.Fragment key={index}>{action}</React.Fragment>
                )) : actions}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Content */}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

export default Card;