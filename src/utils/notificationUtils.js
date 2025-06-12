// src/utils/notificationUtils.js - Utilities for formatting and managing notifications

import { formatDistanceToNow } from 'date-fns';

/**
 * Notification types
 */
export const NOTIFICATION_TYPES = {
  COMMENT_REPLY: 'comment_reply',
  MENTION: 'mention',
  EVENT_UPDATE: 'event_update',
  PAYMENT_REMINDER: 'payment_reminder',
  RESULT_POSTED: 'result_posted',
  EVENT_REMINDER: 'event_reminder'
};

/**
 * Notification priorities
 */
export const NOTIFICATION_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

/**
 * Format notification message based on type and data
 * @param {string} type - Notification type
 * @param {Object} data - Notification data
 * @returns {Object} Formatted notification with title and message
 */
export const formatNotificationMessage = (type, data) => {
  const { authorName, eventName, eventType, divisionName, commentText } = data;
  
  switch (type) {
    case NOTIFICATION_TYPES.COMMENT_REPLY:
      return {
        title: 'New Reply',
        message: `${authorName} replied to your comment in ${eventName}`,
        preview: commentText ? `"${commentText.substring(0, 100)}${commentText.length > 100 ? '...' : ''}"` : '',
        icon: '💬'
      };
      
    case NOTIFICATION_TYPES.MENTION:
      return {
        title: 'You were mentioned',
        message: `${authorName} mentioned you in ${eventName}${divisionName ? ` (${divisionName})` : ''}`,
        preview: commentText ? `"${commentText.substring(0, 100)}${commentText.length > 100 ? '...' : ''}"` : '',
        icon: '@'
      };
      
    case NOTIFICATION_TYPES.EVENT_UPDATE:
      return {
        title: 'Event Updated',
        message: `${eventName} has been updated`,
        preview: data.updateDetails || 'Check the event for details',
        icon: '📅'
      };
      
    case NOTIFICATION_TYPES.PAYMENT_REMINDER:
      return {
        title: 'Payment Due',
        message: `Payment due for ${eventName}${divisionName ? ` (${divisionName})` : ''}`,
        preview: data.amount ? `Amount: $${data.amount}` : '',
        icon: '💰'
      };
      
    case NOTIFICATION_TYPES.RESULT_POSTED:
      return {
        title: 'Results Posted',
        message: `Results are available for ${eventName}${divisionName ? ` (${divisionName})` : ''}`,
        preview: 'Check your placement and awards',
        icon: '🏆'
      };
      
    case NOTIFICATION_TYPES.EVENT_REMINDER:
      return {
        title: 'Event Reminder',
        message: `${eventName} is coming up soon`,
        preview: data.timeUntil || 'Check the event details',
        icon: '⏰'
      };
      
    default:
      return {
        title: 'Notification',
        message: data.message || 'You have a new notification',
        preview: '',
        icon: '🔔'
      };
  }
};

/**
 * Get notification priority based on type
 * @param {string} type - Notification type
 * @returns {string} Priority level
 */
export const getNotificationPriority = (type) => {
  switch (type) {
    case NOTIFICATION_TYPES.MENTION:
    case NOTIFICATION_TYPES.COMMENT_REPLY:
      return NOTIFICATION_PRIORITIES.MEDIUM;
      
    case NOTIFICATION_TYPES.PAYMENT_REMINDER:
      return NOTIFICATION_PRIORITIES.HIGH;
      
    case NOTIFICATION_TYPES.EVENT_REMINDER:
      return NOTIFICATION_PRIORITIES.HIGH;
      
    case NOTIFICATION_TYPES.EVENT_UPDATE:
      return NOTIFICATION_PRIORITIES.MEDIUM;
      
    case NOTIFICATION_TYPES.RESULT_POSTED:
      return NOTIFICATION_PRIORITIES.LOW;
      
    default:
      return NOTIFICATION_PRIORITIES.LOW;
  }
};

/**
 * Format notification timestamp for display
 * @param {Date|string} timestamp - Notification timestamp
 * @returns {string} Formatted time string
 */
export const formatNotificationTime = (timestamp) => {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now - date) / (1000 * 60 * 60);
  
  if (diffInHours < 1) {
    return 'Just now';
  } else if (diffInHours < 24) {
    return formatDistanceToNow(date, { addSuffix: true });
  } else if (diffInHours < 48) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }
};

/**
 * Group notifications by date for display
 * @param {Array} notifications - Array of notification objects
 * @returns {Object} Grouped notifications by date
 */
export const groupNotificationsByDate = (notifications) => {
  if (!notifications || !Array.isArray(notifications)) return {};
  
  const groups = {};
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  
  notifications.forEach(notification => {
    const notificationDate = new Date(notification.createdAt);
    const notificationDay = new Date(notificationDate.getFullYear(), notificationDate.getMonth(), notificationDate.getDate());
    
    let groupKey;
    if (notificationDay.getTime() === today.getTime()) {
      groupKey = 'Today';
    } else if (notificationDay.getTime() === yesterday.getTime()) {
      groupKey = 'Yesterday';
    } else if (notificationDay.getTime() > yesterday.getTime() - 5 * 24 * 60 * 60 * 1000) {
      groupKey = 'This Week';
    } else {
      groupKey = 'Earlier';
    }
    
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(notification);
  });
  
  // Sort within each group by newest first
  Object.keys(groups).forEach(key => {
    groups[key].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  });
  
  return groups;
};

/**
 * Get notification color theme based on type
 * @param {string} type - Notification type
 * @returns {Object} Color theme object
 */
export const getNotificationTheme = (type) => {
  switch (type) {
    case NOTIFICATION_TYPES.COMMENT_REPLY:
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-900',
        icon: 'text-blue-600'
      };
      
    case NOTIFICATION_TYPES.MENTION:
      return {
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        text: 'text-purple-900',
        icon: 'text-purple-600'
      };
      
    case NOTIFICATION_TYPES.EVENT_UPDATE:
      return {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-900',
        icon: 'text-green-600'
      };
      
    case NOTIFICATION_TYPES.PAYMENT_REMINDER:
      return {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        text: 'text-yellow-900',
        icon: 'text-yellow-600'
      };
      
    case NOTIFICATION_TYPES.RESULT_POSTED:
      return {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-900',
        icon: 'text-amber-600'
      };
      
    case NOTIFICATION_TYPES.EVENT_REMINDER:
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-900',
        icon: 'text-red-600'
      };
      
    default:
      return {
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        text: 'text-gray-900',
        icon: 'text-gray-600'
      };
  }
};

/**
 * Create notification summary for multiple notifications
 * @param {Array} notifications - Array of notification objects
 * @returns {Object} Summary object
 */
export const createNotificationSummary = (notifications) => {
  if (!notifications || !Array.isArray(notifications)) {
    return {
      total: 0,
      unread: 0,
      byType: {},
      mostRecent: null
    };
  }
  
  const summary = {
    total: notifications.length,
    unread: notifications.filter(n => !n.isRead).length,
    byType: {},
    mostRecent: null
  };
  
  // Count by type
  notifications.forEach(notification => {
    const type = notification.type;
    summary.byType[type] = (summary.byType[type] || 0) + 1;
  });
  
  // Find most recent
  if (notifications.length > 0) {
    summary.mostRecent = notifications.reduce((latest, current) => {
      return new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest;
    });
  }
  
  return summary;
};

/**
 * Filter notifications based on criteria
 * @param {Array} notifications - Array of notification objects
 * @param {Object} filters - Filter criteria
 * @returns {Array} Filtered notifications
 */
export const filterNotifications = (notifications, filters = {}) => {
  if (!notifications || !Array.isArray(notifications)) return [];
  
  let filtered = [...notifications];
  
  // Filter by read status
  if (filters.readStatus === 'unread') {
    filtered = filtered.filter(n => !n.isRead);
  } else if (filters.readStatus === 'read') {
    filtered = filtered.filter(n => n.isRead);
  }
  
  // Filter by type
  if (filters.type && Array.isArray(filters.type)) {
    filtered = filtered.filter(n => filters.type.includes(n.type));
  }
  
  // Filter by event
  if (filters.eventId) {
    filtered = filtered.filter(n => n.eventId === filters.eventId);
  }
  
  // Filter by date range
  if (filters.startDate) {
    const startDate = new Date(filters.startDate);
    filtered = filtered.filter(n => new Date(n.createdAt) >= startDate);
  }
  
  if (filters.endDate) {
    const endDate = new Date(filters.endDate);
    filtered = filtered.filter(n => new Date(n.createdAt) <= endDate);
  }
  
  // Filter by priority
  if (filters.priority) {
    filtered = filtered.filter(n => getNotificationPriority(n.type) === filters.priority);
  }
  
  return filtered;
};

/**
 * Generate notification action URL
 * @param {Object} notification - Notification object
 * @returns {string} URL to navigate to for the notification
 */
export const getNotificationActionUrl = (notification) => {
  const { type, eventId, eventType, commentId, divisionId } = notification.data || {};
  
  switch (type) {
    case NOTIFICATION_TYPES.COMMENT_REPLY:
    case NOTIFICATION_TYPES.MENTION:
      return `/${eventType}/${eventId}/comments${commentId ? `#comment-${commentId}` : ''}`;
      
    case NOTIFICATION_TYPES.EVENT_UPDATE:
      return `/${eventType}/${eventId}`;
      
    case NOTIFICATION_TYPES.PAYMENT_REMINDER:
      return `/${eventType}/${eventId}/payment`;
      
    case NOTIFICATION_TYPES.RESULT_POSTED:
      return `/${eventType}/${eventId}/results${divisionId ? `?division=${divisionId}` : ''}`;
      
    case NOTIFICATION_TYPES.EVENT_REMINDER:
      return `/${eventType}/${eventId}`;
      
    default:
      return '/dashboard';
  }
};

/**
 * Check if notification should show badge (is important and unread)
 * @param {Object} notification - Notification object
 * @returns {boolean} True if should show badge
 */
export const shouldShowNotificationBadge = (notification) => {
  if (!notification || notification.isRead) return false;
  
  const priority = getNotificationPriority(notification.type);
  return priority === NOTIFICATION_PRIORITIES.HIGH || priority === NOTIFICATION_PRIORITIES.URGENT;
};

export default {
  NOTIFICATION_TYPES,
  NOTIFICATION_PRIORITIES,
  formatNotificationMessage,
  getNotificationPriority,
  formatNotificationTime,
  groupNotificationsByDate,
  getNotificationTheme,
  createNotificationSummary,
  filterNotifications,
  getNotificationActionUrl,
  shouldShowNotificationBadge
};