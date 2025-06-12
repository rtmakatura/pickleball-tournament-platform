// src/services/notificationService.js - Service for handling notification business logic

import firebaseOps from './firebaseOperations';
import { NOTIFICATION_TYPES, formatNotificationMessage, getNotificationPriority } from '../utils/notificationUtils';
import { parseMentions } from '../utils/mentionUtils';

/**
 * Create notification record
 */
const createNotification = (notificationData) => {
  const now = new Date();
  
  return {
    recipientId: notificationData.recipientId || '',
    type: notificationData.type || NOTIFICATION_TYPES.COMMENT_REPLY,
    title: notificationData.title || '',
    message: notificationData.message || '',
    preview: notificationData.preview || '',
    icon: notificationData.icon || '🔔',
    priority: notificationData.priority || getNotificationPriority(notificationData.type),
    isRead: false,
    data: notificationData.data || {},
    createdAt: now,
    updatedAt: now
  };
};

/**
 * Create notifications for comment replies
 * @param {Object} comment - The new comment/reply
 * @param {Object} parentComment - The parent comment being replied to
 * @param {Object} event - The event (tournament/league)
 * @param {Array} members - Array of all members
 */
export const createCommentReplyNotification = async (comment, parentComment, event, members) => {
  try {
    // Don't notify if replying to own comment
    if (comment.authorId === parentComment.authorId) {
      return;
    }
    
    const authorMember = members.find(m => m.id === comment.authorId);
    const authorName = authorMember ? `${authorMember.firstName} ${authorMember.lastName}` : 'Someone';
    
    const divisionName = comment.divisionId && event.divisions 
      ? event.divisions.find(div => div.id === comment.divisionId)?.name
      : null;
    
    const formatted = formatNotificationMessage(NOTIFICATION_TYPES.COMMENT_REPLY, {
      authorName,
      eventName: event.name,
      eventType: comment.eventType,
      divisionName,
      commentText: comment.content
    });
    
    const notification = createNotification({
      recipientId: parentComment.authorId,
      type: NOTIFICATION_TYPES.COMMENT_REPLY,
      title: formatted.title,
      message: formatted.message,
      preview: formatted.preview,
      icon: formatted.icon,
      data: {
        commentId: comment.id,
        parentCommentId: parentComment.id,
        eventId: event.id,
        eventType: comment.eventType,
        divisionId: comment.divisionId,
        authorId: comment.authorId,
        authorName
      }
    });
    
    await firebaseOps.create('notifications', notification);
    console.log('Reply notification created for user:', parentComment.authorId);
  } catch (error) {
    console.error('Error creating reply notification:', error);
  }
};

/**
 * Create notifications for @mentions in comments
 * @param {Object} comment - The comment containing mentions
 * @param {Object} event - The event (tournament/league)
 * @param {Array} members - Array of all members
 */
export const createMentionNotifications = async (comment, event, members) => {
  try {
    const mentions = parseMentions(comment.content, members);
    
    if (mentions.length === 0) return;
    
    const authorMember = members.find(m => m.id === comment.authorId);
    const authorName = authorMember ? `${authorMember.firstName} ${authorMember.lastName}` : 'Someone';
    
    const divisionName = comment.divisionId && event.divisions 
      ? event.divisions.find(div => div.id === comment.divisionId)?.name
      : null;
    
    const notifications = mentions
      .filter(mentionedMember => mentionedMember.id !== comment.authorId) // Don't notify self
      .map(mentionedMember => {
        const formatted = formatNotificationMessage(NOTIFICATION_TYPES.MENTION, {
          authorName,
          eventName: event.name,
          eventType: comment.eventType,
          divisionName,
          commentText: comment.content
        });
        
        return createNotification({
          recipientId: mentionedMember.id,
          type: NOTIFICATION_TYPES.MENTION,
          title: formatted.title,
          message: formatted.message,
          preview: formatted.preview,
          icon: formatted.icon,
          data: {
            commentId: comment.id,
            eventId: event.id,
            eventType: comment.eventType,
            divisionId: comment.divisionId,
            authorId: comment.authorId,
            authorName,
            mentionedMemberId: mentionedMember.id,
            mentionedMemberName: `${mentionedMember.firstName} ${mentionedMember.lastName}`
          }
        });
      });
    
    // Create all mention notifications
    await Promise.all(notifications.map(notification => 
      firebaseOps.create('notifications', notification)
    ));
    
    console.log(`Created ${notifications.length} mention notifications`);
  } catch (error) {
    console.error('Error creating mention notifications:', error);
  }
};

/**
 * Create notifications for event updates
 * @param {Object} event - The updated event
 * @param {string} updateType - Type of update
 * @param {Array} participants - Array of participant member IDs
 * @param {Array} members - Array of all members
 */
export const createEventUpdateNotifications = async (event, updateType, participants, members) => {
  try {
    if (!participants || participants.length === 0) return;
    
    const formatted = formatNotificationMessage(NOTIFICATION_TYPES.EVENT_UPDATE, {
      eventName: event.name,
      eventType: event.eventType || 'event',
      updateDetails: `Event ${updateType} - check for details`
    });
    
    const notifications = participants.map(participantId => 
      createNotification({
        recipientId: participantId,
        type: NOTIFICATION_TYPES.EVENT_UPDATE,
        title: formatted.title,
        message: formatted.message,
        preview: formatted.preview,
        icon: formatted.icon,
        data: {
          eventId: event.id,
          eventType: event.eventType || 'tournament',
          updateType
        }
      })
    );
    
    await Promise.all(notifications.map(notification => 
      firebaseOps.create('notifications', notification)
    ));
    
    console.log(`Created ${notifications.length} event update notifications`);
  } catch (error) {
    console.error('Error creating event update notifications:', error);
  }
};

/**
 * Create payment reminder notifications
 * @param {Object} event - The event with payment due
 * @param {string} divisionId - Division ID (for tournaments)
 * @param {Array} unpaidParticipants - Array of participant IDs who haven't paid
 * @param {Array} members - Array of all members
 */
export const createPaymentReminderNotifications = async (event, divisionId, unpaidParticipants, members) => {
  try {
    if (!unpaidParticipants || unpaidParticipants.length === 0) return;
    
    const division = divisionId && event.divisions 
      ? event.divisions.find(div => div.id === divisionId)
      : null;
    
    const amount = division ? division.entryFee : event.registrationFee;
    const divisionName = division?.name;
    
    const formatted = formatNotificationMessage(NOTIFICATION_TYPES.PAYMENT_REMINDER, {
      eventName: event.name,
      divisionName,
      amount
    });
    
    const notifications = unpaidParticipants.map(participantId => 
      createNotification({
        recipientId: participantId,
        type: NOTIFICATION_TYPES.PAYMENT_REMINDER,
        title: formatted.title,
        message: formatted.message,
        preview: formatted.preview,
        icon: formatted.icon,
        priority: 'high',
        data: {
          eventId: event.id,
          eventType: event.eventType || 'tournament',
          divisionId,
          amount
        }
      })
    );
    
    await Promise.all(notifications.map(notification => 
      firebaseOps.create('notifications', notification)
    ));
    
    console.log(`Created ${notifications.length} payment reminder notifications`);
  } catch (error) {
    console.error('Error creating payment reminder notifications:', error);
  }
};

/**
 * Create result posted notifications
 * @param {Object} event - The event with results
 * @param {string} divisionId - Division ID (for tournaments)
 * @param {Array} participants - Array of participant member IDs
 * @param {Array} members - Array of all members
 */
export const createResultPostedNotifications = async (event, divisionId, participants, members) => {
  try {
    if (!participants || participants.length === 0) return;
    
    const division = divisionId && event.divisions 
      ? event.divisions.find(div => div.id === divisionId)
      : null;
    
    const divisionName = division?.name;
    
    const formatted = formatNotificationMessage(NOTIFICATION_TYPES.RESULT_POSTED, {
      eventName: event.name,
      divisionName
    });
    
    const notifications = participants.map(participantId => 
      createNotification({
        recipientId: participantId,
        type: NOTIFICATION_TYPES.RESULT_POSTED,
        title: formatted.title,
        message: formatted.message,
        preview: formatted.preview,
        icon: formatted.icon,
        data: {
          eventId: event.id,
          eventType: event.eventType || 'tournament',
          divisionId
        }
      })
    );
    
    await Promise.all(notifications.map(notification => 
      firebaseOps.create('notifications', notification)
    ));
    
    console.log(`Created ${notifications.length} result posted notifications`);
  } catch (error) {
    console.error('Error creating result posted notifications:', error);
  }
};

/**
 * Create event reminder notifications
 * @param {Object} event - The upcoming event
 * @param {Array} participants - Array of participant member IDs
 * @param {string} timeUntil - Human readable time until event
 * @param {Array} members - Array of all members
 */
export const createEventReminderNotifications = async (event, participants, timeUntil, members) => {
  try {
    if (!participants || participants.length === 0) return;
    
    const formatted = formatNotificationMessage(NOTIFICATION_TYPES.EVENT_REMINDER, {
      eventName: event.name,
      timeUntil
    });
    
    const notifications = participants.map(participantId => 
      createNotification({
        recipientId: participantId,
        type: NOTIFICATION_TYPES.EVENT_REMINDER,
        title: formatted.title,
        message: formatted.message,
        preview: formatted.preview,
        icon: formatted.icon,
        priority: 'high',
        data: {
          eventId: event.id,
          eventType: event.eventType || 'tournament',
          timeUntil
        }
      })
    );
    
    await Promise.all(notifications.map(notification => 
      firebaseOps.create('notifications', notification)
    ));
    
    console.log(`Created ${notifications.length} event reminder notifications`);
  } catch (error) {
    console.error('Error creating event reminder notifications:', error);
  }
};

/**
 * Get all participants for an event (including divisions)
 * @param {Object} event - The event object
 * @returns {Array} Array of unique participant IDs
 */
export const getEventParticipants = (event) => {
  const participants = new Set();
  
  // Add direct participants (leagues, legacy tournaments)
  if (event.participants && Array.isArray(event.participants)) {
    event.participants.forEach(id => participants.add(id));
  }
  
  // Add division participants (tournaments)
  if (event.divisions && Array.isArray(event.divisions)) {
    event.divisions.forEach(division => {
      if (division.participants && Array.isArray(division.participants)) {
        division.participants.forEach(id => participants.add(id));
      }
    });
  }
  
  return Array.from(participants);
};

/**
 * Process comment notifications (replies and mentions)
 * @param {Object} comment - The new comment
 * @param {Object} parentComment - Parent comment (if reply)
 * @param {Object} event - The event
 * @param {Array} members - Array of all members
 */
export const processCommentNotifications = async (comment, parentComment, event, members) => {
  try {
    const promises = [];
    
    // Create reply notification if this is a reply
    if (parentComment) {
      promises.push(createCommentReplyNotification(comment, parentComment, event, members));
    }
    
    // Create mention notifications
    promises.push(createMentionNotifications(comment, event, members));
    
    await Promise.all(promises);
  } catch (error) {
    console.error('Error processing comment notifications:', error);
  }
};

/**
 * Mark notification as read
 * @param {string} notificationId - Notification ID
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    await firebaseOps.update('notifications', notificationId, {
      isRead: true,
      readAt: new Date()
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read for a user
 * @param {string} userId - User/member ID
 */
export const markAllNotificationsAsRead = async (userId) => {
  try {
    const notifications = await firebaseOps.getAll('notifications', {
      recipientId: userId,
      isRead: false
    });
    
    const updates = notifications.map(notification => ({
      collection: 'notifications',
      id: notification.id,
      data: {
        isRead: true,
        readAt: new Date()
      }
    }));
    
    if (updates.length > 0) {
      await firebaseOps.batchUpdate(updates);
    }
    
    return updates.length;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

/**
 * Delete old notifications (cleanup)
 * @param {number} daysOld - Delete notifications older than this many days
 */
export const cleanupOldNotifications = async (daysOld = 30) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const allNotifications = await firebaseOps.getAll('notifications');
    const oldNotifications = allNotifications.filter(notification => 
      new Date(notification.createdAt) < cutoffDate
    );
    
    const deletions = oldNotifications.map(notification => ({
      collection: 'notifications',
      id: notification.id
    }));
    
    if (deletions.length > 0) {
      await firebaseOps.batchDelete(deletions);
    }
    
    console.log(`Cleaned up ${deletions.length} old notifications`);
    return deletions.length;
  } catch (error) {
    console.error('Error cleaning up old notifications:', error);
    throw error;
  }
};

export default {
  createCommentReplyNotification,
  createMentionNotifications,
  createEventUpdateNotifications,
  createPaymentReminderNotifications,
  createResultPostedNotifications,
  createEventReminderNotifications,
  processCommentNotifications,
  getEventParticipants,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  cleanupOldNotifications
};