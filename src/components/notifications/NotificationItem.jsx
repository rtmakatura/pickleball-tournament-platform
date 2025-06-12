// src/components/notifications/NotificationItem.jsx - Individual notification component

import React, { useState } from 'react';
import { 
  MessageSquare, 
  AtSign, 
  Calendar, 
  DollarSign, 
  Trophy, 
  Bell,
  MoreVertical,
  X,
  Check,
  ExternalLink
} from 'lucide-react';
import { 
  formatNotificationTime, 
  getNotificationTheme,
  NOTIFICATION_TYPES 
} from '../../utils/notificationUtils';

/**
 * NotificationItem Component - Display individual notification
 * 
 * @param {Object} notification - Notification object
 * @param {Function} onMarkAsRead - Mark notification as read
 * @param {Function} onDelete - Delete notification
 * @param {Function} onNavigate - Navigate to notification target
 * @param {boolean} showActions - Whether to show action buttons
 * @param {string} layout - Layout variant ('default', 'compact', 'detailed')
 */
const NotificationItem = ({
  notification,
  onMarkAsRead,
  onDelete,
  onNavigate,
  showActions = true,
  layout = 'default'
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const theme = getNotificationTheme(notification.type);
  const timeAgo = formatNotificationTime(notification.createdAt);

  // Get appropriate icon for notification type
  const getNotificationIcon = (type) => {
    switch (type) {
      case NOTIFICATION_TYPES.COMMENT_REPLY:
        return MessageSquare;
      case NOTIFICATION_TYPES.MENTION:
        return AtSign;
      case NOTIFICATION_TYPES.EVENT_UPDATE:
      case NOTIFICATION_TYPES.EVENT_REMINDER:
        return Calendar;
      case NOTIFICATION_TYPES.PAYMENT_REMINDER:
        return DollarSign;
      case NOTIFICATION_TYPES.RESULT_POSTED:
        return Trophy;
      default:
        return Bell;
    }
  };

  const IconComponent = getNotificationIcon(notification.type);

  // Handle mark as read
  const handleMarkAsRead = async () => {
    if (notification.isRead || !onMarkAsRead) return;
    
    setIsLoading(true);
    try {
      await onMarkAsRead(notification.id);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!onDelete) return;
    
    setIsLoading(true);
    try {
      await onDelete(notification.id);
    } catch (error) {
      console.error('Error deleting notification:', error);
    } finally {
      setIsLoading(false);
      setShowMenu(false);
    }
  };

  // Handle click to navigate
  const handleClick = () => {
    if (onNavigate) {
      onNavigate(notification);
    }
    
    // Auto-mark as read on click if not already read
    if (!notification.isRead) {
      handleMarkAsRead();
    }
  };

  // Render compact layout
  if (layout === 'compact') {
    return (
      <div
        className={`
          flex items-center space-x-3 p-3 border-l-4 cursor-pointer transition-colors
          ${notification.isRead ? 'bg-white border-gray-200' : `${theme.bg} ${theme.border}`}
          hover:bg-gray-50
        `}
        onClick={handleClick}
      >
        <div className={`flex-shrink-0 ${theme.icon}`}>
          <IconComponent className="h-4 w-4" />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${theme.text}`}>
            {notification.title}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {notification.message}
          </p>
        </div>
        
        <div className="flex-shrink-0">
          <span className="text-xs text-gray-400">{timeAgo}</span>
        </div>
      </div>
    );
  }

  // Render detailed layout
  if (layout === 'detailed') {
    return (
      <div
        className={`
          p-4 border rounded-lg transition-colors
          ${notification.isRead ? 'bg-white border-gray-200' : `${theme.bg} ${theme.border}`}
        `}
      >
        <div className="flex items-start space-x-3">
          <div className={`flex-shrink-0 p-2 rounded-full ${theme.bg} ${theme.icon}`}>
            <IconComponent className="h-5 w-5" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className={`text-sm font-medium ${theme.text}`}>
                  {notification.title}
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  {notification.message}
                </p>
                {notification.preview && (
                  <p className="text-xs text-gray-500 mt-2 italic">
                    {notification.preview}
                  </p>
                )}
              </div>
              
              {showActions && (
                <div className="flex items-center space-x-2 ml-4">
                  {!notification.isRead && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead();
                      }}
                      disabled={isLoading}
                      className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                      title="Mark as read"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClick();
                    }}
                    className="p-1 text-gray-600 hover:text-gray-800 transition-colors"
                    title="View details"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </button>
                  
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(!showMenu);
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    
                    {showMenu && (
                      <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                        {!notification.isRead && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead();
                              setShowMenu(false);
                            }}
                            disabled={isLoading}
                            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                          >
                            Mark as read
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete();
                          }}
                          disabled={isLoading}
                          className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-gray-400">{timeAgo}</span>
              
              {notification.priority === 'high' && (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                  High Priority
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default layout
  return (
    <div
      className={`
        flex items-start space-x-3 p-4 cursor-pointer transition-colors border-l-4
        ${notification.isRead 
          ? 'bg-white border-gray-200 hover:bg-gray-50' 
          : `${theme.bg} ${theme.border} hover:bg-opacity-80`
        }
      `}
      onClick={handleClick}
    >
      {/* Notification Icon */}
      <div className={`flex-shrink-0 ${theme.icon}`}>
        <IconComponent className="h-5 w-5" />
      </div>
      
      {/* Notification Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className={`text-sm font-medium ${notification.isRead ? 'text-gray-700' : theme.text}`}>
              {notification.title}
            </h4>
            <p className="text-sm text-gray-600 mt-1">
              {notification.message}
            </p>
            {notification.preview && (
              <p className="text-xs text-gray-500 mt-1 italic">
                {notification.preview}
              </p>
            )}
          </div>
          
          {/* Actions */}
          {showActions && (
            <div className="flex items-center space-x-1 ml-4">
              {!notification.isRead && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMarkAsRead();
                  }}
                  disabled={isLoading}
                  className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                  title="Mark as read"
                >
                  <Check className="h-4 w-4" />
                </button>
              )}
              
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(!showMenu);
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
                
                {showMenu && (
                  <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    {!notification.isRead && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead();
                          setShowMenu(false);
                        }}
                        disabled={isLoading}
                        className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Mark as read
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete();
                      }}
                      disabled={isLoading}
                      className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-400">{timeAgo}</span>
          
          <div className="flex items-center space-x-2">
            {notification.priority === 'high' && (
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                High Priority
              </span>
            )}
            
            {!notification.isRead && (
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;