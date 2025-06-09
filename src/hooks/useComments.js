// src/hooks/useComments.js
import { useState, useEffect } from 'react';
import firebaseOps from '../services/firebaseOperations';
import { createComment, COMMENT_STATUS, COMMENT_TYPES, VOTE_TYPES } from '../services/models';

/**
 * useComments Hook - Manages comments for tournaments and leagues
 * 
 * Props:
 * - eventId: string - ID of the event (tournament or league)
 * - eventType: string - 'tournament' or 'league'
 * - realTime: boolean - Whether to use real-time updates
 */
export const useComments = (eventId, eventType = 'tournament', options = {}) => {
  const { realTime = true, limit = 50, sortBy = 'createdAt' } = options;
  
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (eventId) {
      loadComments();
    }
  }, [eventId, eventType]);

  /**
   * Load comments for an event
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

    // Sort top-level comments by score then date
    return topLevelComments.sort((a, b) => {
      if (a.score !== b.score) {
        return b.score - a.score; // Higher score first
      }
      return new Date(b.createdAt) - new Date(a.createdAt); // Newer first
    });
  };

  /**
   * Post a new comment
   */
  const postComment = async (content, authorId, authorName, parentId = null) => {
    setError(null);
    
    try {
      const depth = parentId ? await getCommentDepth(parentId) + 1 : 0;
      
      const comment = createComment({
        eventId,
        eventType,
        authorId,
        authorName,
        content: content.trim(),
        parentId,
        type: parentId ? COMMENT_TYPES.REPLY : COMMENT_TYPES.COMMENT,
        depth,
        status: COMMENT_STATUS.ACTIVE
      });

      const commentId = await firebaseOps.create('comments', comment);
      
      // Update event comment count
      await updateEventCommentCount(1);
      
      // Update parent comment reply count if this is a reply
      if (parentId) {
        await updateCommentReplyCount(parentId, 1);
      }
      
      return commentId;
    } catch (err) {
      setError(err.message);
      throw err;
    }
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
        status: COMMENT_STATUS.EDITED
      });
      
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
      if (!comment) throw new Error('Comment not found');
      
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
   * Vote on a comment
   */
  const voteOnComment = async (commentId, userId, voteType) => {
    setError(null);
    
    try {
      const comment = await firebaseOps.read('comments', commentId);
      if (!comment) throw new Error('Comment not found');
      
      const currentVote = comment.voters[userId];
      let upvoteChange = 0;
      let downvoteChange = 0;
      const newVoters = { ...comment.voters };
      
      if (currentVote === voteType) {
        // Remove vote
        delete newVoters[userId];
        if (voteType === VOTE_TYPES.UP) {
          upvoteChange = -1;
        } else {
          downvoteChange = -1;
        }
      } else {
        // Add or change vote
        if (currentVote) {
          // Changing vote
          if (currentVote === VOTE_TYPES.UP) {
            upvoteChange = -1;
            downvoteChange = 1;
          } else {
            upvoteChange = 1;
            downvoteChange = -1;
          }
        } else {
          // New vote
          if (voteType === VOTE_TYPES.UP) {
            upvoteChange = 1;
          } else {
            downvoteChange = 1;
          }
        }
        newVoters[userId] = voteType;
      }
      
      const newUpvotes = comment.upvotes + upvoteChange;
      const newDownvotes = comment.downvotes + downvoteChange;
      const newScore = newUpvotes - newDownvotes;
      
      await firebaseOps.update('comments', commentId, {
        upvotes: newUpvotes,
        downvotes: newDownvotes,
        score: newScore,
        voters: newVoters
      });
      
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
   * Get comment statistics
   */
  const getCommentStats = () => {
    const flatComments = flattenComments(comments);
    
    return {
      totalComments: flatComments.filter(c => c.type === COMMENT_TYPES.COMMENT).length,
      totalReplies: flatComments.filter(c => c.type === COMMENT_TYPES.REPLY).length,
      totalVotes: flatComments.reduce((sum, c) => sum + c.upvotes + c.downvotes, 0),
      averageScore: flatComments.length > 0 
        ? flatComments.reduce((sum, c) => sum + c.score, 0) / flatComments.length 
        : 0,
      topComment: flatComments.reduce((top, c) => 
        c.score > (top?.score || -Infinity) ? c : top, null
      )
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
    editComment,
    deleteComment,
    
    // Voting
    voteOnComment,
    
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