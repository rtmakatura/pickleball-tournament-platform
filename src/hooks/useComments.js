// src/hooks/useComments.js (FIXED - Now properly fetches and displays replies)
import { useState, useEffect } from 'react';
import firebaseOps from '../services/firebaseOperations';
import notificationService from '../services/notificationService';
import { createComment, COMMENT_STATUS, COMMENT_TYPES } from '../services/models';
import { parseMentions } from '../utils/mentionUtils';

/**
 * Helper function for formatting relative time - simplified implementation
 */
const formatDistanceToNow = (date) => {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
};

/**
 * useComments Hook - FIXED: Now properly fetches all comments including replies
 * 
 * Params:
 * - eventId: string - ID of the event (tournament or league)
 * - eventType: string - 'tournament' or 'league'
 * - options: object - Options including divisionId, realTime, limit, sortBy
 */
export const useComments = (eventId, eventType = 'tournament', options = {}) => {
  // FIXED: Don't filter by divisionId in the hook - let the UI handle filtering
  const { 
    realTime = true, 
    limit = 100, // Increased limit to catch all comments and replies
    sortBy = 'createdAt' 
  } = options || {};
  
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (eventId) {
      loadComments();
    }
  }, [eventId, eventType]);

  /**
   * FIXED: Load ALL comments for an event (no division filtering in hook)
   */
  const loadComments = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // FIXED: Only filter by eventId, eventType, and status - NO division filtering
      const filters = { 
        eventId, 
        eventType,
        status: COMMENT_STATUS.ACTIVE
      };
      
      console.log('🔄 Loading comments with filters:', filters);
      
      if (realTime) {
        const unsubscribe = firebaseOps.subscribe(
          'comments', 
          (commentsData) => {
            console.log('📡 Real-time comments received:', commentsData.length);
            commentsData.forEach(comment => {
              console.log(`🔍 Comment ${comment.id}: parentId=${comment.parentId}, content="${comment.content.substring(0, 30)}..."`);
            });
            
            // FIXED: Set comments as flat array - let UI organize them
            setComments(commentsData || []);
          }, 
          filters,
          sortBy,
          limit
        );
        return () => unsubscribe();
      } else {
        const commentsData = await firebaseOps.getAll('comments', filters, sortBy, limit);
        console.log('📚 One-time comments loaded:', commentsData.length);
        setComments(commentsData || []);
      }
    } catch (err) {
      console.error('❌ Error loading comments:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Add a comment with flexible parameters (FIXED - Now creates notifications)
   */
  const addComment = async (commentData, authorId, authorName, members = [], event = null) => {
    if (!commentData.content?.trim()) {
      throw new Error('Comment content is required');
    }

    console.log('🚀 Adding comment with notification support');
    console.log('Comment data:', commentData);
    console.log('Author:', { authorId, authorName });
    console.log('Members available:', members.length);

    setError(null);
    
    try {
      const depth = commentData.parentId ? await getCommentDepth(commentData.parentId) + 1 : 0;
      
      // Parse mentions from the comment content
      const mentions = parseMentions(commentData.content, members);
      console.log('🏷️ Parsed mentions:', mentions);
      
      const comment = createComment({
        eventId,
        eventType,
        divisionId: commentData.divisionId || null,
        authorId,
        authorName,
        content: commentData.content.trim(),
        parentId: commentData.parentId || null,
        type: commentData.parentId ? COMMENT_TYPES.REPLY : COMMENT_TYPES.COMMENT,
        depth,
        status: COMMENT_STATUS.ACTIVE,
        mentions: mentions.map(m => m.id)
      });

      console.log('💾 Creating comment document:', comment);
      const commentId = await firebaseOps.create('comments', comment);
      console.log('✅ Comment created with ID:', commentId);
      
      // 🚨 CRITICAL FIX: Create notifications for mentions and replies
      try {
        const fullComment = { ...comment, id: commentId };
        
        let parentComment = null;
        if (commentData.parentId) {
          parentComment = await firebaseOps.read('comments', commentData.parentId);
          console.log('📝 Retrieved parent comment for reply notification:', parentComment);
        }

        let eventData = event;
        if (!eventData) {
          const collection = eventType === 'tournament' ? 'tournaments' : 'leagues';
          eventData = await firebaseOps.read(collection, eventId);
          console.log('📅 Retrieved event data:', eventData);
        }

        console.log('🔔 Creating notifications...');
        await notificationService.processCommentNotifications(
          fullComment, 
          parentComment, 
          eventData, 
          members
        );
        console.log('✅ Notifications created successfully');

      } catch (notificationError) {
        console.error('❌ Error creating notifications (comment still saved):', notificationError);
      }
      
      // Update event comment count
      await updateEventCommentCount(1);
      
      // Update parent comment reply count if this is a reply
      if (commentData.parentId) {
        await updateCommentReplyCount(commentData.parentId, 1);
      }
      
      // FIXED: Force reload comments to ensure UI updates
      if (!realTime) {
        await loadComments();
      }
      
      return commentId;
    } catch (err) {
      console.error('❌ Error adding comment:', err);
      setError(err.message);
      throw err;
    }
  };

  /**
   * Post a new comment (legacy method - kept for compatibility)
   */
  const postComment = async (content, authorId, authorName, parentId = null) => {
    return addComment(
      { content, parentId },
      authorId,
      authorName
    );
  };

  /**
   * Edit a comment
   */
  const editComment = async (commentId, newContent) => {
    setError(null);
    
    try {
      await firebaseOps.update('comments', commentId, {
        content: newContent.trim(),
        isEdited: true,
        editedAt: new Date(),
        status: COMMENT_STATUS.ACTIVE
      });
      
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  /**
   * Update a comment (alias for editComment with more flexible parameters)
   */
  const updateComment = async (commentId, updates) => {
    setError(null);
    
    try {
      const updateData = {
        ...updates,
        isEdited: true,
        editedAt: new Date()
      };
      
      await firebaseOps.update('comments', commentId, updateData);
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  /**
   * Delete a comment (soft delete)
   */
  const deleteComment = async (commentId) => {
    setError(null);
    
    try {
      const comment = await firebaseOps.read('comments', commentId);
      if (!comment) throw new Error('Message not found');
      
      await firebaseOps.update('comments', commentId, {
        content: '[deleted]',
        status: COMMENT_STATUS.DELETED
      });
      
      // Update event comment count
      await updateEventCommentCount(-1);
      
      // Update parent comment reply count if this was a reply
      if (comment.parentId) {
        await updateCommentReplyCount(comment.parentId, -1);
      }
      
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  /**
   * Hide a comment (moderator action)
   */
  const hideComment = async (commentId) => {
    setError(null);
    
    try {
      await firebaseOps.update('comments', commentId, {
        status: COMMENT_STATUS.HIDDEN
      });
      
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  /**
   * Get comment depth for reply limiting
   */
  const getCommentDepth = async (commentId) => {
    try {
      const comment = await firebaseOps.read('comments', commentId);
      return comment ? comment.depth : 0;
    } catch (err) {
      return 0;
    }
  };

  /**
   * Update event comment count
   */
  const updateEventCommentCount = async (change) => {
    try {
      const collection = eventType === 'tournament' ? 'tournaments' : 'leagues';
      const event = await firebaseOps.read(collection, eventId);
      
      if (event) {
        const newCount = Math.max(0, (event.commentCount || 0) + change);
        await firebaseOps.update(collection, eventId, {
          commentCount: newCount
        });
      }
    } catch (err) {
      console.error('Error updating event comment count:', err);
    }
  };

  /**
   * Update comment reply count
   */
  const updateCommentReplyCount = async (commentId, change) => {
    try {
      const comment = await firebaseOps.read('comments', commentId);
      
      if (comment) {
        const newCount = Math.max(0, (comment.replyCount || 0) + change);
        await firebaseOps.update('comments', commentId, {
          replyCount: newCount
        });
      }
    } catch (err) {
      console.error('Error updating comment reply count:', err);
    }
  };

  /**
   * Get simplified comment statistics (no voting data)
   */
  const getCommentStats = () => {
    const flatComments = comments || [];
    
    // Count authors and their message counts
    const authorCounts = {};
    flatComments.forEach(comment => {
      authorCounts[comment.authorName] = (authorCounts[comment.authorName] || 0) + 1;
    });
    
    // Find most active author
    const mostActiveAuthor = Object.entries(authorCounts).reduce(
      (max, [name, count]) => count > (max.count || 0) ? { name, count } : max,
      { name: null, count: 0 }
    );
    
    // Get most recent activity
    const mostRecentComment = flatComments.reduce(
      (latest, comment) => {
        const commentDate = new Date(comment.createdAt);
        const latestDate = latest ? new Date(latest.createdAt) : new Date(0);
        return commentDate > latestDate ? comment : latest;
      },
      null
    );
    
    const recentActivity = mostRecentComment 
      ? formatDistanceToNow(new Date(mostRecentComment.createdAt))
      : null;
    
    return {
      totalComments: flatComments.filter(c => c.type === COMMENT_TYPES.COMMENT).length,
      totalReplies: flatComments.filter(c => c.type === COMMENT_TYPES.REPLY).length,
      mostActiveAuthor: mostActiveAuthor.name ? mostActiveAuthor : null,
      recentActivity
    };
  };

  /**
   * Search comments
   */
  const searchComments = (searchTerm) => {
    if (!searchTerm || !comments) return comments;
    
    const search = searchTerm.toLowerCase();
    return comments.filter(comment => 
      comment.content.toLowerCase().includes(search) ||
      comment.authorName.toLowerCase().includes(search)
    );
  };

  return {
    comments: comments || [], // FIXED: Always return array
    loading,
    error,
    
    // CRUD operations
    loadComments,
    postComment,
    addComment,
    editComment,
    updateComment,
    deleteComment,
    
    // Moderation
    hideComment,
    
    // Utility functions
    getCommentStats,
    searchComments,
    clearError: () => setError(null),
    
    // Computed properties
    hasComments: (comments || []).length > 0,
    commentCount: (comments || []).length,
    stats: getCommentStats()
  };
};

export default useComments;