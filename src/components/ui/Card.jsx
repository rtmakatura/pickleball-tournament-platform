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
 * - ref: React ref - For navigation and scrolling support
 */
export const Card = React.forwardRef(({
  title,
  subtitle,
  children,
  actions,
  className = '',
  ...props
}, ref) => (
  <div 
    ref={ref}
    className={`bg-white rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 ease-out ${className}`}
    {...props}
  >
    {/* Card Header - only show if title or actions provided */}
    {(title || actions) && (
      <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
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
    <div className="px-8 py-6">
      {children}
    </div>
  </div>
));

// Add displayName for React DevTools
Card.displayName = 'Card';

/**
 * CardGrid Component - For laying out multiple cards
 */
export const CardGrid = ({ children, className = '' }) => (
  <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
    {children}
  </div>
);

export default Card;