// src/components/notifications/NotificationCenter.jsx - Main notification UI component

import React, { useState } from 'react';
import { 
  Bell, 
  CheckCheck, 
  Filter, 
  Trash2, 
  RefreshCw,
  MessageSquare,
  AtSign,
  Calendar,
  DollarSign,
  Trophy,
  Search,
  X
} from 'lucide-react';
import { Button, Card, Alert, Modal } from '../ui';
import NotificationItem from './NotificationItem';
import { useNotifications } from '../../hooks/useNotifications';
import { useAuth } from '../../hooks/useAuth';
import { useMembers } from '../../hooks/useMembers';
import { 
  NOTIFICATION_TYPES, 
  groupNotificationsByDate,
  filterNotifications 
} from '../../utils/notificationUtils';

/**
 * NotificationCenter Component - Main notification management interface
 * 
 * @param {Function} onNavigate - Navigation handler for notification clicks
 * @param {boolean} isModal - Whether component is used in a modal
 * @param {Function} onClose - Close handler for modal mode
 */
const NotificationCenter = ({ 
  onNavigate, 
  isModal = false, 
  onClose,
  modalVariant = 'default'
}) => {
  const { user } = useAuth();
  const { members } = useMembers();
  const currentMember = members.find(m => m.authUid === user?.uid);
  
  const {
    notifications,
    loading,
    error,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
    clearError
  } = useNotifications(currentMember?.id, { realTime: true });

  const [filters, setFilters] = useState({
    readStatus: 'all', // 'all', 'unread', 'read'
    type: [], // Array of notification types
    searchTerm: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [layout, setLayout] = useState('default'); // 'default', 'compact', 'detailed'
  const [actionLoading, setActionLoading] = useState(false);

  // Filter notifications based on current filters
  const filteredNotifications = filterNotifications(notifications, {
    readStatus: filters.readStatus === 'all' ? undefined : filters.readStatus,
    type: filters.type.length > 0 ? filters.type : undefined
  }).filter(notification => {
    if (!filters.searchTerm) return true;
    const searchLower = filters.searchTerm.toLowerCase();
    return notification.title.toLowerCase().includes(searchLower) ||
           notification.message.toLowerCase().includes(searchLower);
  });

  // Group filtered notifications by date
  const groupedNotifications = groupNotificationsByDate(filteredNotifications);

  // Handle notification navigation
  const handleNotificationClick = (notification) => {
    if (onNavigate) {
      onNavigate(notification);
    }
    
    if (isModal && onClose) {
      onClose();
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    setActionLoading(true);
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Error marking all as read:', error);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setActionLoading(true);
    try {
      await refresh();
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    } finally {
      setActionLoading(false);
    }
  };

  // Filter type options
  const filterTypeOptions = [
    { value: NOTIFICATION_TYPES.COMMENT_REPLY, label: 'Comment Replies', icon: MessageSquare },
    { value: NOTIFICATION_TYPES.MENTION, label: 'Mentions', icon: AtSign },
    { value: NOTIFICATION_TYPES.EVENT_UPDATE, label: 'Event Updates', icon: Calendar },
    { value: NOTIFICATION_TYPES.PAYMENT_REMINDER, label: 'Payment Reminders', icon: DollarSign },
    { value: NOTIFICATION_TYPES.RESULT_POSTED, label: 'Results Posted', icon: Trophy },
    { value: NOTIFICATION_TYPES.EVENT_REMINDER, label: 'Event Reminders', icon: Calendar }
  ];

  // Toggle filter type
  const toggleFilterType = (type) => {
    setFilters(prev => ({
      ...prev,
      type: prev.type.includes(type)
        ? prev.type.filter(t => t !== type)
        : [...prev.type, type]
    }));
  };

  const content = (
    <div className="space-y-6">
      {/* Header - moved to modal header via headerActions */}

      {/* Error Alert */}
      {error && (
        <Alert
          type="error"
          title="Error loading notifications"
          message={error}
          onClose={clearError}
        />
      )}

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Read Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filters.readStatus}
                onChange={(e) => setFilters(prev => ({ ...prev, readStatus: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Notifications</option>
                <option value="unread">Unread Only</option>
                <option value="read">Read Only</option>
              </select>
            </div>
            
            {/* Layout Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Layout
              </label>
              <select
                value={layout}
                onChange={(e) => setLayout(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="default">Default</option>
                <option value="compact">Compact</option>
                <option value="detailed">Detailed</option>
              </select>
            </div>
            
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={filters.searchTerm}
                  onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                  placeholder="Search notifications..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {filters.searchTerm && (
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, searchTerm: '' }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Type Filters */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notification Types
            </label>
            <div className="flex flex-wrap gap-2">
              {filterTypeOptions.map(option => {
                const IconComponent = option.icon;
                const isSelected = filters.type.includes(option.value);
                
                return (
                  <button
                    key={option.value}
                    onClick={() => toggleFilterType(option.value)}
                    className={`
                      flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors
                      ${isSelected 
                        ? 'bg-blue-50 border-blue-200 text-blue-900' 
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    <IconComponent className="h-4 w-4" />
                    <span className="text-sm">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Notifications List */}
      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading notifications...</p>
          </div>
        ) : Object.keys(groupedNotifications).length === 0 ? (
          <div className="text-center py-12">
            <Bell className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              {filteredNotifications.length === 0 && notifications.length > 0
                ? 'No notifications match your filters'
                : 'No notifications yet'
              }
            </h3>
            <p className="text-gray-500">
              {filteredNotifications.length === 0 && notifications.length > 0
                ? 'Try adjusting your filters to see more notifications.'
                : 'You\'ll see notifications here when there\'s activity on your events.'
              }
            </p>
          </div>
        ) : (
          Object.entries(groupedNotifications).map(([groupTitle, groupNotifications]) => (
            <div key={groupTitle} className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider px-2">
                {groupTitle}
              </h3>
              
              <div className={`space-y-1 ${layout === 'detailed' ? 'space-y-3' : ''}`}>
                {groupNotifications.map(notification => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={markAsRead}
                    onDelete={deleteNotification}
                    onNavigate={handleNotificationClick}
                    layout={layout}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer for modal */}
      {isModal && (
        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      )}
    </div>
  );

  // Return modal version if requested
  if (isModal) {
    // Create header actions for modal
    const headerActions = (
      <>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center"
        >
          <Filter className="h-4 w-4 mr-1" />
          Filters
        </Button>
        
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={actionLoading}
            className="flex items-center"
          >
            <CheckCheck className="h-4 w-4 mr-1" />
            Mark All Read
          </Button>
        )}
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={actionLoading}
          className="flex items-center"
        >
          <RefreshCw className={`h-4 w-4 ${actionLoading ? 'animate-spin' : ''}`} />
        </Button>
      </>
    );

    // Use proper navigation handler from App
    const handleNotificationNavigation = (notification) => {
      // Close modal first
      if (onClose) onClose();
      
      // Call the navigation handler passed from App
      if (onNavigate) {
        onNavigate(notification);
      }
    };

    return (
      <Modal
        isOpen={true}
        onClose={onClose}
        title={
          <div className="flex items-center space-x-3">
            <Bell className="h-6 w-6 text-gray-600" />
            <span>
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-500 text-white rounded-full">
                  {unreadCount}
                </span>
              )}
            </span>
          </div>
        }
        size="xl"
        variant={modalVariant}
        headerAction={headerActions}
      >
        {/* Pass the navigation handler to content */}
        <div onClick={(e) => {
          // Handle notification item clicks
          const notificationElement = e.target.closest('[data-notification]');
          if (notificationElement) {
            try {
              const notificationData = JSON.parse(notificationElement.getAttribute('data-notification'));
              handleNotificationNavigation(notificationData);
            } catch (error) {
              console.error('Error parsing notification data:', error);
            }
          }
        }}>
          {content}
        </div>
      </Modal>
    );
  }

  // Return card version for dashboard
  return (
    <Card>
      {content}
    </Card>
  );
};

export default NotificationCenter;