// src/hooks/useNotificationBadge.js - FIXED: Correct import path and integrated with existing system

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useMembers } from './useMembers';
import { useNotifications } from './useNotifications';

/**
 * useNotificationBadge Hook - Simplified hook for notification badge display
 * Uses existing notification system and provides debounced updates
 * 
 * @param {Object} options - Configuration options
 * @returns {Object} Badge state and actions
 */
export const useNotificationBadge = (options = {}) => {
  const { 
    debounceMs = 500,
    enableSound = false,
    autoMarkAsRead = false 
  } = options;

  const { user } = useAuth();
  const { members } = useMembers();
  const currentMember = members.find(m => m.authUid === user?.uid);

  // Use the main notification hook with real-time updates
  const {
    notifications,
    loading,
    unreadCount,
    hasNew,
    markAsRead,
    markAllAsRead
  } = useNotifications(currentMember?.id, {
    realTime: true,
    enableSound,
    autoMarkAsRead
  });

  // Debounced state to prevent rapid re-renders
  const [stableState, setStableState] = useState({
    count: 0,
    hasHighPriority: false,
    hasNew: false,
    lastUpdate: new Date()
  });

  // Check for high priority notifications
  const hasHighPriority = notifications.some(notification => 
    !notification.isRead && (
      notification.priority === 'high' || 
      notification.priority === 'urgent' ||
      notification.type === 'payment_reminder' ||
      notification.type === 'event_reminder'
    )
  );

  // Debounce updates to prevent flickering
  useEffect(() => {
    const timer = setTimeout(() => {
      const newState = {
        count: unreadCount,
        hasHighPriority,
        hasNew,
        lastUpdate: new Date()
      };

      // Only update if values have actually changed
      if (
        newState.count !== stableState.count ||
        newState.hasHighPriority !== stableState.hasHighPriority ||
        newState.hasNew !== stableState.hasNew
      ) {
        setStableState(newState);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [unreadCount, hasHighPriority, hasNew, debounceMs, stableState]);

  // Quick mark as read function
  const quickMarkAsRead = useCallback(async (notificationId) => {
    try {
      await markAsRead(notificationId);
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }, [markAsRead]);

  // Mark all as read function
  const markAllRead = useCallback(async () => {
    try {
      await markAllAsRead();
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }, [markAllAsRead]);

  // Get recent unread notifications (for preview)
  const getRecentNotifications = useCallback((limit = 3) => {
    return notifications
      .filter(n => !n.isRead)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);
  }, [notifications]);

  return {
    // Badge display data
    count: stableState.count,
    hasHighPriority: stableState.hasHighPriority,
    hasNew: stableState.hasNew,
    
    // State indicators
    loading,
    isEmpty: stableState.count === 0,
    hasNotifications: stableState.count > 0,
    
    // Actions
    markAsRead: quickMarkAsRead,
    markAllAsRead: markAllRead,
    
    // Utility functions
    getRecentNotifications,
    
    // Raw data (if needed)
    notifications,
    
    // Computed display properties
    displayCount: stableState.count > 99 ? '99+' : stableState.count.toString(),
    shouldAnimate: stableState.hasNew,
    shouldShowBadge: stableState.count > 0,
    badgeColor: stableState.hasHighPriority ? 'red' : 'blue',
    
    // Accessibility properties
    ariaLabel: `${stableState.count} unread notification${stableState.count !== 1 ? 's' : ''}${stableState.hasHighPriority ? ' including high priority' : ''}`,
    
    // Debug info (remove in production)
    debug: {
      memberId: currentMember?.id,
      lastUpdate: stableState.lastUpdate,
      notificationCount: notifications.length
    }
  };
};

/**
 * Simple notification counter hook (lightweight version)
 * For cases where you only need the count
 */
export const useNotificationCount = () => {
  const { user } = useAuth();
  const { members } = useMembers();
  const currentMember = members.find(m => m.authUid === user?.uid);

  const { unreadCount, loading } = useNotifications(currentMember?.id, {
    realTime: true
  });

  return {
    count: unreadCount,
    loading,
    hasNotifications: unreadCount > 0
  };
};

/**
 * Notification status hook (for header/navigation use)
 * Provides minimal state with stable updates
 */
export const useNotificationStatus = () => {
  const badge = useNotificationBadge({ debounceMs: 1000 });
  
  return {
    count: badge.count,
    hasHighPriority: badge.hasHighPriority,
    shouldShow: badge.shouldShowBadge,
    displayText: badge.displayCount,
    ariaLabel: badge.ariaLabel
  };
};

export default useNotificationBadge;