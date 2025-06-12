// src/components/notifications/index.js - Export all notification components

export { default as NotificationCenter } from './NotificationCenter';
export { default as NotificationItem } from './NotificationItem';
export { 
  default as NotificationBadge, 
  NotificationDot, 
  NotificationBadgeWithText, 
  InlineNotificationCount 
} from './NotificationBadge';

// Re-export notification utilities for convenience
export {
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
} from '../../utils/notificationUtils';