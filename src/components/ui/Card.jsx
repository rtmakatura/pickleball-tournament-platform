// src/components/ui/Card.jsx
import React from 'react';

/**
 * Card Component - A container for organizing content
 * 
 * Props:
 * - title: string - Card header title
 * - subtitle: string - Card header subtitle
 * - children: React nodes - Card content
 * - actions: React node - Header action buttons
 * - className: string - Additional CSS classes
 */
export const Card = ({ 
  title, 
  subtitle, 
  children, 
  actions,
  className = '' 
}) => (
  <div className={`bg-white rounded-lg border shadow-sm ${className}`}>
    {/* Card Header - only show if title or actions provided */}
    {(title || actions) && (
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            {title && (
              <h3 className="text-lg font-medium text-gray-900">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="mt-1 text-sm text-gray-500">
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex space-x-2">
              {actions}
            </div>
          )}
        </div>
      </div>
    )}

    {/* Card Body */}
    <div className="px-6 py-4">
      {children}
    </div>
  </div>
);

/**
 * CardGrid Component - For laying out multiple cards
 */
export const CardGrid = ({ children, className = '' }) => (
  <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
    {children}
  </div>
);

export default Card;