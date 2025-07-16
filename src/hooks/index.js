// src/hooks/index.js - Clean version without duplicates

// Core authentication and data hooks
export { useAuth } from './useAuth';
export { useMembers } from './useMembers';
export { useLeagues } from './useLeagues';
export { useTournaments } from './useTournaments';

// Communication and notification hooks
export { useComments } from './useComments';
export { useNotifications } from './useNotifications';

// Results management hooks
export { useResults } from './useResults';
export { usePlayerPerformance } from './usePlayerPerformance';

// Navigation and utility hooks
export { useSmoothNavigation } from './useSmoothNavigation';

// Notification badge hooks
export { 
  default as useNotificationBadge, 
  useNotificationCount, 
  useNotificationStatus 
} from './useNotificationBadge';