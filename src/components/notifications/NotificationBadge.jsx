// src/components/notifications/NotificationBadge.jsx - Notification badge component

import React from 'react';
import { Bell } from 'lucide-react';

/**
 * NotificationBadge Component - Shows notification count with badge
 * 
 * @param {number} count - Number of unread notifications
 * @param {boolean} hasHighPriority - Whether there are high priority notifications
 * @param {Function} onClick - Click handler
 * @param {string} size - Size variant ('sm', 'md', 'lg')
 * @param {boolean} showZero - Whether to show badge when count is 0
 * @param {boolean} animate - Whether to animate the badge
 */
const NotificationBadge = ({
  count = 0,
  hasHighPriority = false,
  onClick,
  size = 'md',
  showZero = false,
  animate = true,
  className = ''
}) => {
  // Size configurations
  const sizeConfig = {
    sm: {
      icon: 'h-4 w-4',
      badge: 'h-4 w-4 text-xs',
      position: '-top-1 -right-1'
    },
    md: {
      icon: 'h-5 w-5',
      badge: 'h-5 w-5 text-xs',
      position: '-top-2 -right-2'
    },
    lg: {
      icon: 'h-6 w-6',
      badge: 'h-6 w-6 text-sm',
      position: '-top-2 -right-2'
    }
  };

  const config = sizeConfig[size] || sizeConfig.md;
  const shouldShowBadge = count > 0 || showZero;

  return (
    <button
      onClick={onClick}
      className={`
        relative inline-flex items-center justify-center p-2 rounded-lg transition-colors
        hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${className}
      `}
      aria-label={`Notifications ${count > 0 ? `(${count} unread)` : ''}`}
    >
      {/* Bell Icon */}
      <Bell 
        className={`
          ${config.icon} text-gray-600 
          ${hasHighPriority ? 'text-red-600' : ''}
          ${animate && count > 0 ? 'animate-pulse' : ''}
        `} 
      />
      
      {/* Notification Badge */}
      {shouldShowBadge && (
        <span
          className={`
            absolute ${config.position} ${config.badge}
            flex items-center justify-center rounded-full font-medium
            ${hasHighPriority 
              ? 'bg-red-500 text-white' 
              : count > 0 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-400 text-white'
            }
            ${animate && count > 0 ? 'animate-bounce' : ''}
            min-w-max px-1
          `}
          style={{
            animation: animate && count > 0 ? 'pulse 2s infinite' : 'none'
          }}
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
      
      {/* High Priority Indicator (small dot when no count but has priority) */}
      {!shouldShowBadge && hasHighPriority && (
        <span
          className={`
            absolute ${config.position}
            w-2 h-2 bg-red-500 rounded-full
            ${animate ? 'animate-ping' : ''}
          `}
        />
      )}
    </button>
  );
};

/**
 * Simple Notification Dot - For minimal notification indication
 */
export const NotificationDot = ({ 
  hasNotifications = false, 
  isHighPriority = false,
  className = '' 
}) => {
  if (!hasNotifications) return null;

  return (
    <span
      className={`
        inline-block w-2 h-2 rounded-full
        ${isHighPriority ? 'bg-red-500' : 'bg-blue-500'}
        ${className}
      `}
      aria-label="Has notifications"
    />
  );
};

/**
 * Notification Badge with Text - For use in navigation menus
 */
export const NotificationBadgeWithText = ({
  count = 0,
  text = 'Notifications',
  hasHighPriority = false,
  onClick,
  className = ''
}) => {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors
        hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${className}
      `}
      aria-label={`${text} ${count > 0 ? `(${count} unread)` : ''}`}
    >
      <span className="text-gray-700">{text}</span>
      
      {count > 0 && (
        <span
          className={`
            inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-full
            ${hasHighPriority ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}
            min-w-max
          `}
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
};

/**
 * Inline Notification Count - For displaying counts in lists or tables
 */
export const InlineNotificationCount = ({
  count = 0,
  className = '',
  size = 'sm'
}) => {
  if (count === 0) return null;

  const sizeClasses = {
    xs: 'px-1 py-0.5 text-xs',
    sm: 'px-2 py-1 text-xs',
    md: 'px-2 py-1 text-sm'
  };

  return (
    <span
      className={`
        inline-flex items-center justify-center rounded-full bg-blue-500 text-white font-medium
        ${sizeClasses[size] || sizeClasses.sm}
        ${className}
      `}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
};

export default NotificationBadge;