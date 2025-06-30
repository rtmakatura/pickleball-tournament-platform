// src/hooks/index.js (UPDATED - Added notification badge hooks)

// Export all hooks
export { useAuth } from './useAuth';
export { useMembers } from './useMembers';
export { useLeagues } from './useLeagues';
export { useTournaments } from './useTournaments';
export { useComments } from './useComments';
export { useNotifications } from './useNotifications';

// NEW: Notification badge hooks
export { 
  default as useNotificationBadge, 
  useNotificationCount, 
  useNotificationStatus 
} from './useNotificationBadge';