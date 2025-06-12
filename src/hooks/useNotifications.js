// src/hooks/useNotifications.js - Hook for managing user notifications

import { useState, useEffect, useCallback } from 'react';
import firebaseOps from '../services/firebaseOperations';
import notificationService from '../services/notificationService';
import { 
  createNotificationSummary, 
  filterNotifications, 
  groupNotificationsByDate 
} from '../utils/notificationUtils';

/**
 * useNotifications Hook - Manages user notifications with real-time updates
 * 
 * @param {string} userId - The current user/member ID
 * @param {Object} options - Configuration options
 * @returns {Object} Notification state and actions
 */
export const useNotifications = (userId, options = {}) => {
  const { 
    realTime = true, 
    limit = 50,
    autoMarkAsRead = false,
    enableSound = false
  } = options;

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastChecked, setLastChecked] = useState(new Date());

  // Load user notifications
  const loadNotifications = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      if (realTime) {
        const unsubscribe = firebaseOps.subscribe(
          'notifications',
          (notificationsData) => {
            const sortedNotifications = notificationsData.sort(
              (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
            );
            setNotifications(sortedNotifications);
            
            // Check for new notifications since last check
            if (enableSound) {
              const newNotifications = sortedNotifications.filter(
                n => new Date(n.createdAt) > lastChecked && !n.isRead
              );
              if (newNotifications.length > 0) {
                playNotificationSound();
              }
            }
            
            setLastChecked(new Date());
          },
          { recipientId: userId },
          'createdAt'
        );
        
        setLoading(false);
        return unsubscribe;
      } else {
        const notificationsData = await firebaseOps.getAll(
          'notifications',
          { recipientId: userId },
          'createdAt',
          limit
        );
        
        const sortedNotifications = notificationsData.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        
        setNotifications(sortedNotifications);
        setLastChecked(new Date());
      }
    } catch (err) {
      setError(err.message);
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, realTime, limit, lastChecked, enableSound]);

  // Initialize notifications on mount
  useEffect(() => {
    let unsubscribe;
    
    if (userId) {
      const setup = async () => {
        if (realTime) {
          unsubscribe = await loadNotifications();
        } else {
          await loadNotifications();
        }
      };
      
      setup();
    }

    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [userId, loadNotifications]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    setError(null);
    
    try {
      await notificationService.markNotificationAsRead(notificationId);
      
      // Update local state immediately for better UX
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, isRead: true, readAt: new Date() }
            : notification
        )
      );
      
      return true;
    } catch (err) {
      setError(err.message);
      console.error('Error marking notification as read:', err);
      return false;
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!userId) return false;
    
    setError(null);
    
    try {
      const updatedCount = await notificationService.markAllNotificationsAsRead(userId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({
          ...notification,
          isRead: true,
          readAt: new Date()
        }))
      );
      
      return updatedCount;
    } catch (err) {
      setError(err.message);
      console.error('Error marking all notifications as read:', err);
      return false;
    }
  }, [userId]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    setError(null);
    
    try {
      await firebaseOps.remove('notifications', notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.filter(notification => notification.id !== notificationId)
      );
      
      return true;
    } catch (err) {
      setError(err.message);
      console.error('Error deleting notification:', err);
      return false;
    }
  }, []);

  // Filter notifications
  const getFilteredNotifications = useCallback((filters = {}) => {
    return filterNotifications(notifications, filters);
  }, [notifications]);

  // Get notifications grouped by date
  const getGroupedNotifications = useCallback((filters = {}) => {
    const filtered = getFilteredNotifications(filters);
    return groupNotificationsByDate(filtered);
  }, [getFilteredNotifications]);

  // Get notification summary
  const getSummary = useCallback(() => {
    return createNotificationSummary(notifications);
  }, [notifications]);

  // Get unread count
  const getUnreadCount = useCallback(() => {
    return notifications.filter(n => !n.isRead).length;
  }, [notifications]);

  // Get recent notifications (last 24 hours)
  const getRecentNotifications = useCallback(() => {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    return notifications.filter(n => new Date(n.createdAt) > oneDayAgo);
  }, [notifications]);

  // Check if user has new notifications since last check
  const hasNewNotifications = useCallback(() => {
    return notifications.some(n => 
      new Date(n.createdAt) > lastChecked && !n.isRead
    );
  }, [notifications, lastChecked]);

  // Play notification sound (if enabled)
  const playNotificationSound = useCallback(() => {
    if (!enableSound) return;
    
    try {
      // Create a simple notification sound
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (err) {
      console.warn('Could not play notification sound:', err);
    }
  }, [enableSound]);

  // Refresh notifications manually
  const refresh = useCallback(async () => {
    if (!realTime) {
      await loadNotifications();
    }
  }, [realTime, loadNotifications]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-mark as read when notifications are viewed (if enabled)
  useEffect(() => {
    if (autoMarkAsRead && notifications.length > 0) {
      const unreadNotifications = notifications.filter(n => !n.isRead);
      if (unreadNotifications.length > 0) {
        // Mark as read after a short delay
        const timer = setTimeout(() => {
          markAllAsRead();
        }, 2000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [autoMarkAsRead, notifications, markAllAsRead]);

  return {
    // State
    notifications,
    loading,
    error,
    
    // Actions
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
    clearError,
    
    // Getters
    getFilteredNotifications,
    getGroupedNotifications,
    getSummary,
    getUnreadCount,
    getRecentNotifications,
    hasNewNotifications,
    
    // Computed properties
    unreadCount: getUnreadCount(),
    summary: getSummary(),
    hasNew: hasNewNotifications(),
    isEmpty: notifications.length === 0,
    recentNotifications: getRecentNotifications()
  };
};

export default useNotifications;