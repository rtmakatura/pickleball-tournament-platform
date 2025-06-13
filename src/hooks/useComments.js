// src/hooks/useComments.js (FIXED - Now creates notifications for mentions)
import { useState, useEffect } from 'react';
import firebaseOps from '../services/firebaseOperations';
import notificationService from '../services/notificationService'; // ADD THIS IMPORT
import { createComment, COMMENT_STATUS, COMMENT_TYPES } from '../services/models';
import { parseMentions } from '../utils/mentionUtils'; // ADD THIS IMPORT

/**
 * Helper function for formatting relative time - simplified implementation
 * If you want to use date-fns, make sure it's installed: npm install date-fns
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
 * useComments Hook - Manages team messages for tournaments and leagues
 * FIXED: Now properly creates notifications for mentions and replies
 * 
 * Params:
 * - eventId: string - ID of the event (tournament or league)
 * - eventType: string - 'tournament' or 'league'
 * - options: object - Options including divisionId, realTime, limit, sortBy
 */
export const useComments = (eventId, eventType = 'tournament', options = {}) => {
  // FIXED: Provide default empty object and safely destructure
  const { 
    divisionId = null,
    realTime = true, 
    limit = 50, 
    sortBy = 'createdAt' 
  } = options || {};
  
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (eventId) {
      loadComments();
    }
  }, [eventId, eventType, divisionId]);

  /**
   * Load comments for an event (optionally filtered by division)
   */
  const loadComments = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const filters = { 
        eventId, 
        eventType,
        status: COMMENT_STATUS.ACTIVE
      };
      
      // Add division filter if specified
      if (divisionId) {
        filters.divisionId = divisionId;
      }
      
      if (realTime) {
        const unsubscribe = firebaseOps.subscribe(
          'comments', 
          (commentsData) => {
            const organizedComments = organizeComments(commentsData);
            setComments(organizedComments);
          }, 
          filters,
          sortBy
        );
        return () => unsubscribe();
      } else {
        const commentsData = await firebaseOps.getAll('comments', filters, sortBy, limit);
        const organizedComments = organizeComments(commentsData);
        setComments(organizedComments);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Organize flat comments into threaded structure
   */
  const organizeComments = (flatComments) => {
    const commentMap = {};
    const topLevelComments = [];

    // First pass: create comment map
    flatComments.forEach(comment => {
      commentMap[comment.id] = { ...comment, replies: [] };
    });

    // Second pass: organize into tree structure
    flatComments.forEach(comment => {
      if (comment.parentId) {
        // This is a reply
        const parent = commentMap[comment.parentId];
        if (parent) {
          parent.replies.push(commentMap[comment.id]);
        }
      } else {
        // This is a top-level comment
        topLevelComments.push(commentMap[comment.id]);
      }
    });

    // Sort top-level comments by date (newest first by default)
    return topLevelComments.sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
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

    // Get the target division ID if provided, otherwise use the hook's divisionId
    const effectiveDivisionId = commentData.divisionId || divisionId;
    
    setError(null);
    
    try {
      const depth = commentData.parentId ? await getCommentDepth(commentData.parentId) + 1 : 0;
      
      // Parse mentions from the comment content
      const mentions = parseMentions(commentData.content, members);
      console.log('🏷️ Parsed mentions:', mentions);
      
      const comment = createComment({
        eventId,
        eventType,
        divisionId: effectiveDivisionId,
        authorId,
        authorName,
        content: commentData.content.trim(),
        parentId: commentData.parentId || null,
        type: commentData.parentId ? COMMENT_TYPES.REPLY : COMMENT_TYPES.COMMENT,
        depth,
        status: COMMENT_STATUS.ACTIVE,
        mentions: mentions.map(m => m.id) // Store mention IDs
      });

      console.log('💾 Creating comment document:', comment);
      const commentId = await firebaseOps.create('comments', comment);
      console.log('✅ Comment created with ID:', commentId);
      
      // 🚨 CRITICAL FIX: Create notifications for mentions and replies
      try {
        // Get the full comment object with ID for notifications
        const fullComment = { ...comment, id: commentId };
        
        // Get parent comment if this is a reply
        let parentComment = null;
        if (commentData.parentId) {
          parentComment = await firebaseOps.read('comments', commentData.parentId);
          console.log('📝 Retrieved parent comment for reply notification:', parentComment);
        }

        // Get event data if not provided
        let eventData = event;
        if (!eventData) {
          const collection = eventType === 'tournament' ? 'tournaments' : 'leagues';
          eventData = await firebaseOps.read(collection, eventId);
          console.log('📅 Retrieved event data:', eventData);
        }

        // 🔔 Create notifications
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
        // Don't throw here - comment was saved successfully
      }
      
      // Update event comment count
      await updateEventCommentCount(1);
      
      // Update parent comment reply count if this is a reply
      if (commentData.parentId) {
        await updateCommentReplyCount(commentData.parentId, 1);
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
        status: COMMENT_STATUS.ACTIVE // Keep active status after edit
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
    const flatComments = flattenComments(comments);
    
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
   * Flatten nested comments for statistics
   */
  const flattenComments = (nestedComments) => {
    const flat = [];
    
    const flatten = (commentList) => {
      commentList.forEach(comment => {
        flat.push(comment);
        if (comment.replies && comment.replies.length > 0) {
          flatten(comment.replies);
        }
      });
    };
    
    flatten(nestedComments);
    return flat;
  };

  /**
   * Search comments
   */
  const searchComments = (searchTerm) => {
    if (!searchTerm) return comments;
    
    const search = searchTerm.toLowerCase();
    const filtered = [];
    
    const searchInComments = (commentList) => {
      commentList.forEach(comment => {
        if (comment.content.toLowerCase().includes(search) ||
            comment.authorName.toLowerCase().includes(search)) {
          filtered.push(comment);
        }
        if (comment.replies && comment.replies.length > 0) {
          searchInComments(comment.replies);
        }
      });
    };
    
    searchInComments(comments);
    return filtered;
  };

  return {
    comments,
    loading,
    error,
    
    // CRUD operations
    loadComments,
    postComment,
    addComment, // FIXED: Now creates notifications for mentions
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
    hasComments: comments.length > 0,
    commentCount: flattenComments(comments).length,
    stats: getCommentStats()
  };
};

export default useComments;