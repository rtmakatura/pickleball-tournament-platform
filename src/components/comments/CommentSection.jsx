// src/components/comments/CommentSection.jsx (FIXED - Working replies with proper thread structure)
import React, { useState, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  Reply, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  User,
  Layers,
  Trophy,
  AtSign
} from 'lucide-react';
import { Button, Card, Alert } from '../ui';
import { useAuth } from '../../hooks/useAuth';
import { useMembers } from '../../hooks/useMembers';
import { useComments } from '../../hooks/useComments';
import { 
  canPostComments, 
  canEditComment, 
  canDeleteComment, 
  canModerateComments 
} from '../../utils/roleUtils';
import { parseMentions, formatMentionText } from '../../utils/mentionUtils';

/**
 * Convert Firebase timestamp to JavaScript Date
 */
const toJSDate = (timestamp) => {
  if (!timestamp) return new Date();
  
  if (timestamp && typeof timestamp === 'object' && timestamp.seconds) {
    return new Date(timestamp.seconds * 1000);
  }
  
  if (timestamp && typeof timestamp === 'object' && timestamp.nanoseconds) {
    const seconds = timestamp.seconds || Math.floor(timestamp.nanoseconds / 1000000000);
    return new Date(seconds * 1000);
  }
  
  if (typeof timestamp === 'string') {
    return new Date(timestamp);
  }
  
  if (typeof timestamp === 'number') {
    return timestamp > 1000000000000 ? new Date(timestamp) : new Date(timestamp * 1000);
  }
  
  return new Date(timestamp);
};

/**
 * Format date for display
 */
const formatDate = (timestamp) => {
  try {
    const date = toJSDate(timestamp);
    const now = new Date();
    const diffInMs = now - date;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    }
  } catch (error) {
    console.error('Error formatting date:', error, timestamp);
    return 'Unknown time';
  }
};

/**
 * CommentSection Component - FIXED: Working replies with proper thread structure
 */
const CommentSection = ({ 
  eventId, 
  eventType = 'tournament',
  divisionId = null,
  event = null
}) => {
  const { user } = useAuth();
  const { members } = useMembers();
  const { 
    comments, 
    loading, 
    addComment, 
    updateComment, 
    deleteComment 
  } = useComments(eventId, eventType, null); // Don't pass divisionId to hook - let it fetch all comments

  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState('');
  const [selectedDivision, setSelectedDivision] = useState(divisionId || '');
  const [viewMode, setViewMode] = useState('all');
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState([]);
  const [mentionPosition, setMentionPosition] = useState(0);
  
  const textareaRef = useRef(null);

  // Check if this is a division-based tournament
  const isDivisionBased = eventType === 'tournament' && event?.divisions && Array.isArray(event.divisions);
  
  // Get current user member
  const currentMember = members.find(m => m.authUid === user?.uid);
  
  // Permission checks
  const canPost = canPostComments(user?.uid, members);
  const canModerate = canModerateComments(user?.uid, members);

  // Show alert
  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  // Handle @mention detection and suggestions
  const handleTextChange = (text, textareaElement) => {
    setNewComment(text);
    
    const cursorPosition = textareaElement.selectionStart;
    const textBeforeCursor = text.substring(0, cursorPosition);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtSymbol !== -1) {
      const searchTerm = textBeforeCursor.substring(lastAtSymbol + 1);
      
      if (searchTerm.length > 0 && !searchTerm.includes(' ')) {
        const suggestions = members
          .filter(member => {
            const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
            return fullName.includes(searchTerm.toLowerCase());
          })
          .slice(0, 5);
        
        if (suggestions.length > 0) {
          setMentionSuggestions(suggestions);
          setMentionPosition(lastAtSymbol);
          setShowMentionSuggestions(true);
        } else {
          setShowMentionSuggestions(false);
        }
      } else {
        setShowMentionSuggestions(false);
      }
    } else {
      setShowMentionSuggestions(false);
    }
  };

  // Handle mention selection
  const selectMention = (member) => {
    const beforeMention = newComment.substring(0, mentionPosition);
    const afterCursor = newComment.substring(textareaRef.current.selectionStart);
    const mentionText = `@${member.firstName} ${member.lastName}`;
    
    const newText = beforeMention + mentionText + ' ' + afterCursor;
    setNewComment(newText);
    setShowMentionSuggestions(false);
    
    setTimeout(() => {
      textareaRef.current.focus();
      const newCursorPosition = beforeMention.length + mentionText.length + 1;
      textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
    }, 100);
  };

  // Get member name by ID
  const getMemberName = (memberId) => {
    const member = members.find(m => m.id === memberId);
    return member ? `${member.firstName} ${member.lastName}` : 'Unknown User';
  };

  // FIXED: Better comment filtering logic that preserves thread structure
  const getFilteredComments = () => {
    if (!comments || !Array.isArray(comments)) {
      console.log('📝 No comments or comments not an array:', comments);
      return [];
    }
    
    console.log('📝 All comments before filtering:', comments.length);
    console.log('📝 View mode:', viewMode, 'Selected division:', selectedDivision);
    
    let filtered = [];
    
    if (viewMode === 'general') {
      // Show general comments and their replies (regardless of reply division)
      filtered = comments.filter(comment => {
        // Include if it's a general comment OR if it's a reply to a general comment
        if (!comment.divisionId) return true;
        if (comment.parentId) {
          const parent = comments.find(c => c.id === comment.parentId);
          return parent && !parent.divisionId;
        }
        return false;
      });
      console.log('📝 General comments (with replies):', filtered.length);
    } else if (viewMode === 'division' && selectedDivision) {
      // Show division comments and their replies (regardless of reply division)
      filtered = comments.filter(comment => {
        // Include if it's a division comment OR if it's a reply to a division comment
        if (comment.divisionId === selectedDivision) return true;
        if (comment.parentId) {
          const parent = comments.find(c => c.id === comment.parentId);
          return parent && parent.divisionId === selectedDivision;
        }
        return false;
      });
      console.log('📝 Division comments (with replies) for', selectedDivision, ':', filtered.length);
    } else {
      filtered = comments; // 'all' mode
      console.log('📝 All comments:', filtered.length);
    }
    
    // Log some details about filtered comments
    filtered.forEach(comment => {
      console.log(`📝 Comment ${comment.id}: parentId=${comment.parentId}, divisionId=${comment.divisionId}, content="${comment.content.substring(0, 50)}..."`);
    });
    
    return filtered;
  };

  const filteredComments = getFilteredComments();

  // FIXED: Enhanced comment submission with better debugging
  const handleSubmitComment = async (content, parentId = null, targetDivisionId = null) => {
    if (!content.trim() || !currentMember) {
      console.log('❌ Cannot submit: missing content or member', { content: !!content.trim(), currentMember: !!currentMember });
      return;
    }

    console.log('📝 Submitting comment:', {
      content: content.substring(0, 50) + '...',
      parentId,
      targetDivisionId,
      viewMode,
      selectedDivision
    });

    setSubmitting(true);
    try {
      // Parse mentions from the comment
      const mentions = parseMentions(content, members);
      
      // FIXED: Better division ID logic for replies
      let finalDivisionId = null;
      
      if (parentId) {
        // For replies, inherit the parent's division
        const parentComment = comments.find(c => c.id === parentId);
        if (parentComment) {
          finalDivisionId = parentComment.divisionId || null;
          console.log('📝 Reply inheriting parent division:', finalDivisionId);
        }
      } else {
        // For new comments, use the specified division or current mode
        finalDivisionId = targetDivisionId || (viewMode === 'division' ? selectedDivision : null);
        console.log('📝 New comment using division:', finalDivisionId);
      }
      
      const commentData = {
        content: content.trim(),
        parentId,
        divisionId: finalDivisionId,
        mentions: mentions.map(m => m.id)
      };
      
      console.log('📝 Comment data being submitted:', commentData);
      
      // Submit the comment
      const commentId = await addComment(
        commentData,
        currentMember.id, 
        `${currentMember.firstName} ${currentMember.lastName}`,
        members, 
        event     
      );
      
      console.log('✅ Comment submitted successfully with ID:', commentId);
      
      setNewComment('');
      setReplyingTo(null);
      showAlert('success', parentId ? 'Reply posted successfully' : 'Comment posted successfully');
    } catch (error) {
      console.error('❌ Comment submission error:', error);
      showAlert('error', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle comment edit
  const handleEditComment = async (commentId, newContent) => {
    if (!newContent.trim()) return;

    try {
      const mentions = parseMentions(newContent, members);
      
      await updateComment(commentId, { 
        content: newContent.trim(),
        mentions: mentions.map(m => m.id)
      });
      
      setEditingComment(null);
      setEditText('');
      showAlert('success', 'Comment updated successfully');
    } catch (error) {
      showAlert('error', error.message);
    }
  };

  // Handle comment deletion
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      await deleteComment(commentId);
      showAlert('success', 'Comment deleted successfully');
    } catch (error) {
      showAlert('error', error.message);
    }
  };

  // Start editing a comment
  const startEditing = (comment) => {
    setEditingComment(comment.id);
    setEditText(comment.content);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingComment(null);
    setEditText('');
  };

  // Start replying to a comment
  const startReply = (comment) => {
    console.log('📝 Starting reply to comment:', comment.id);
    setReplyingTo(comment.id);
  };

  // Cancel reply
  const cancelReply = () => {
    console.log('📝 Cancelling reply');
    setReplyingTo(null);
  };

  // Get division name by ID
  const getDivisionName = (divisionId) => {
    if (!isDivisionBased || !divisionId) return null;
    const division = event.divisions.find(div => div.id === divisionId);
    return division?.name || 'Unknown Division';
  };

  // Get comment statistics
  const getCommentStats = () => {
    if (!comments) return { total: 0, general: 0, byDivision: {} };
    
    const stats = {
      total: comments.length,
      general: comments.filter(c => !c.divisionId).length,
      byDivision: {}
    };
    
    if (isDivisionBased) {
      event.divisions.forEach(division => {
        stats.byDivision[division.id] = comments.filter(c => c.divisionId === division.id).length;
      });
    }
    
    return stats;
  };

  const commentStats = getCommentStats();

  if (!canPost) {
    return (
      <Card title="Discussion">
        <Alert 
          type="info" 
          message="You need to be a member to view and post messages." 
        />
      </Card>
    );
  }

  return (
    <Card 
      title={
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5" />
          <span>Discussion ({commentStats.total})</span>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Alert */}
        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        {/* Division Selector for Division-Based Tournaments */}
        {isDivisionBased && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900">Choose Discussion Channel</h4>
              <div className="text-sm text-gray-600">
                {commentStats.general} general • {Object.values(commentStats.byDivision).reduce((sum, count) => sum + count, 0)} division-specific
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={() => setViewMode('all')}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  viewMode === 'all' 
                    ? 'bg-blue-50 border-blue-200 text-blue-900' 
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4" />
                  <span className="font-medium">All Messages</span>
                </div>
                <p className="text-xs mt-1 opacity-75">{commentStats.total} total messages</p>
              </button>
              
              <button
                onClick={() => setViewMode('general')}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  viewMode === 'general' 
                    ? 'bg-green-50 border-green-200 text-green-900' 
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Trophy className="h-4 w-4" />
                  <span className="font-medium">General</span>
                </div>
                <p className="text-xs mt-1 opacity-75">{commentStats.general} tournament messages</p>
              </button>
              
              <button
                onClick={() => setViewMode('division')}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  viewMode === 'division' 
                    ? 'bg-purple-50 border-purple-200 text-purple-900' 
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Layers className="h-4 w-4" />
                  <span className="font-medium">Division Chat</span>
                </div>
                <p className="text-xs mt-1 opacity-75">
                  {Object.values(commentStats.byDivision).reduce((sum, count) => sum + count, 0)} division messages
                </p>
              </button>
            </div>
            
            {/* Division Selector for Division Mode */}
            {viewMode === 'division' && (
              <div className="mt-4">
                <select
                  value={selectedDivision}
                  onChange={(e) => setSelectedDivision(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a division...</option>
                  {event.divisions.map(div => (
                    <option key={div.id} value={div.id}>
                      {div.name} ({commentStats.byDivision[div.id] || 0} messages)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Comment Form */}
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-gray-400" />
            </div>
            
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={newComment}
                onChange={(e) => handleTextChange(e.target.value, e.target)}
                placeholder={
                  viewMode === 'general' 
                    ? 'Share a message with everyone...'
                    : viewMode === 'division' && selectedDivision
                      ? `Message your ${getDivisionName(selectedDivision)} division...`
                      : 'Share a message... (Use @name to mention someone)'
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={3}
                disabled={!canPost || (viewMode === 'division' && !selectedDivision)}
              />
              
              {/* Mention Suggestions */}
              {showMentionSuggestions && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {mentionSuggestions.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => selectMention(member)}
                      className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <AtSign className="h-3 w-3 text-gray-400" />
                      <span>{member.firstName} {member.lastName}</span>
                    </button>
                  ))}
                </div>
              )}
              
              <div className="flex items-center justify-between mt-2">
                <div className="text-xs text-gray-500">
                  {viewMode === 'general' && 'This message will be visible to all participants'}
                  {viewMode === 'division' && selectedDivision && `This message will be visible to ${getDivisionName(selectedDivision)} participants`}
                  {viewMode === 'all' && 'This message will be general (not division-specific)'}
                  {newComment.includes('@') && (
                    <span className="ml-2 text-blue-600">• Use @name to notify someone</span>
                  )}
                </div>
                
                <Button
                  onClick={() => handleSubmitComment(
                    newComment, 
                    null, 
                    viewMode === 'division' ? selectedDivision : null
                  )}
                  disabled={
                    !newComment.trim() || 
                    submitting || 
                    (viewMode === 'division' && !selectedDivision)
                  }
                  loading={submitting}
                  size="sm"
                >
                  <Send className="h-4 w-4 mr-1" />
                  Send
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Comments List */}
        <div className="space-y-4" id="comments-list">
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-300"></div>
              <p className="mt-2">Loading messages...</p>
            </div>
          ) : filteredComments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>
                {viewMode === 'general' 
                  ? 'No general messages yet. Start the conversation!'
                  : viewMode === 'division' && selectedDivision
                    ? `No messages for ${getDivisionName(selectedDivision)} yet.`
                    : 'No messages yet. Start the conversation!'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredComments
                .filter(comment => comment.parentId === null)
                .sort((a, b) => {
                  try {
                    const dateA = toJSDate(a.createdAt);
                    const dateB = toJSDate(b.createdAt);
                    return dateB - dateA; // Newest first
                  } catch (error) {
                    return 0;
                  }
                })
                .map(comment => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    id={`comment-${comment.id}`}
                    replies={filteredComments.filter(c => c.parentId === comment.id)}
                    currentMember={currentMember}
                    members={members}
                    canEdit={canEditComment(user?.uid, comment, members)}
                    canDelete={canDeleteComment(user?.uid, comment, members)}
                    canModerate={canModerate}
                    onEdit={handleEditComment}
                    onDelete={handleDeleteComment}
                    onReply={handleSubmitComment}
                    isEditing={editingComment === comment.id}
                    editText={editText}
                    setEditText={setEditText}
                    startEditing={startEditing}
                    cancelEditing={cancelEditing}
                    replyingTo={replyingTo}
                    startReply={startReply}
                    cancelReply={cancelReply}
                    getDivisionName={getDivisionName}
                    isDivisionBased={isDivisionBased}
                  />
                ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

/**
 * CommentItem Component - FIXED: Better reply handling with preserved thread structure
 */
const CommentItem = ({
  comment,
  replies = [],
  currentMember,
  members,
  canEdit,
  canDelete,
  canModerate,
  onEdit,
  onDelete,
  onReply,
  isEditing,
  editText,
  setEditText,
  startEditing,
  cancelEditing,
  replyingTo,
  startReply,
  cancelReply,
  getDivisionName,
  isDivisionBased,
  id
}) => {
  const [replyText, setReplyText] = useState('');
  const [showActions, setShowActions] = useState(false);

  const getMemberName = (memberId) => {
    const member = members.find(m => m.id === memberId);
    return member ? `${member.firstName} ${member.lastName}` : 'Unknown User';
  };

  // FIXED: Better reply submission
  const handleReplySubmit = () => {
    if (replyText.trim()) {
      console.log('📝 Submitting reply to comment:', comment.id, 'with division:', comment.divisionId);
      // Pass the parent comment's division ID to maintain context
      onReply(replyText, comment.id, comment.divisionId);
      setReplyText('');
      cancelReply();
    }
  };

  // Format comment content with @mention highlighting
  const formatCommentContent = (content) => {
    return formatMentionText(content, members);
  };

  console.log('📝 Rendering comment:', comment.id, 'with', replies.length, 'replies');

  return (
    <div className={`${comment.depth > 0 ? 'ml-6 border-l-2 border-gray-200 pl-4' : ''}`} id={id}>
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        {/* Comment Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="h-6 w-6 bg-gray-100 rounded-full flex items-center justify-center">
              <User className="h-3 w-3 text-gray-400" />
            </div>
            <span className="font-medium text-gray-900">{getMemberName(comment.authorId)}</span>
            <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
            {comment.isEdited && (
              <span className="text-xs text-gray-400">(edited)</span>
            )}
            {isDivisionBased && comment.divisionId && (
              <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                <Trophy className="h-3 w-3 mr-1" />
                {getDivisionName(comment.divisionId)}
              </span>
            )}
          </div>
          
          {(canEdit || canDelete || canModerate) && (
            <div className="relative">
              <button
                onClick={() => setShowActions(!showActions)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
              
              {showActions && (
                <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  {canEdit && (
                    <button
                      onClick={() => {
                        startEditing(comment);
                        setShowActions(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                    >
                      <Edit3 className="h-3 w-3 mr-2" />
                      Edit
                    </button>
                  )}
                  {(canDelete || canModerate) && (
                    <button
                      onClick={() => {
                        onDelete(comment.id);
                        setShowActions(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
                    >
                      <Trash2 className="h-3 w-3 mr-2" />
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Comment Content */}
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
            <div className="flex space-x-2">
              <Button
                size="sm"
                onClick={() => onEdit(comment.id, editText)}
                disabled={!editText.trim()}
              >
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={cancelEditing}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <div className="text-gray-700 mb-3" dangerouslySetInnerHTML={{ __html: formatCommentContent(comment.content) }} />
            
            {/* Comment Actions */}
            <div className="flex items-center space-x-4 text-sm">
              <button
                onClick={() => startReply(comment)}
                className="text-gray-500 hover:text-gray-700 flex items-center"
              >
                <Reply className="h-3 w-3 mr-1" />
                Reply
              </button>
              
              {replies.length > 0 && (
                <span className="text-gray-400">
                  {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Reply Form */}
        {replyingTo === comment.id && (
          <div className="mt-4 pl-6 border-l-2 border-blue-200 bg-blue-50 rounded p-3">
            <div className="space-y-2">
              <div className="text-sm text-blue-700 mb-2">
                Replying to {getMemberName(comment.authorId)}
              </div>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Reply to ${getMemberName(comment.authorId)}...`}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                autoFocus
              />
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  onClick={handleReplySubmit}
                  disabled={!replyText.trim()}
                >
                  Post Reply
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={cancelReply}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Replies - FIXED: Ensure replies are properly displayed */}
      {replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {replies
            .sort((a, b) => {
              try {
                const dateA = toJSDate(a.createdAt);
                const dateB = toJSDate(b.createdAt);
                return dateA - dateB; // Replies oldest first (conversation flow)
              } catch (error) {
                return 0;
              }
            })
            .map(reply => {
              console.log('📝 Rendering reply:', reply.id, 'to parent:', comment.id);
              return (
                <CommentItem
                  key={reply.id}
                  comment={{ ...reply, depth: (comment.depth || 0) + 1 }}
                  id={`comment-${reply.id}`}
                  replies={[]} // Keep replies simple - no deep nesting for now
                  currentMember={currentMember}
                  members={members}
                  canEdit={canEdit}
                  canDelete={canDelete}
                  canModerate={canModerate}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onReply={onReply}
                  isEditing={false}
                  editText=""
                  setEditText={() => {}}
                  startEditing={startEditing}
                  cancelEditing={cancelEditing}
                  replyingTo={replyingTo}
                  startReply={startReply}
                  cancelReply={cancelReply}
                  getDivisionName={getDivisionName}
                  isDivisionBased={isDivisionBased}
                />
              );
            })}
        </div>
      )}
    </div>
  );
};

export default CommentSection;