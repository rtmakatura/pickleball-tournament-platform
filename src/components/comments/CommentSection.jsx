// src/components/comments/CommentSection.jsx (UPDATED - Simplified Communication Channel)
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
 * CommentSection Component - Simplified communication channel
 * UPDATED: Removed unnecessary header info, focus on communication
 * Added @mention support for notifications
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
  } = useComments(eventId, eventType, divisionId);

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
    
    // Check for @mentions
    const cursorPosition = textareaElement.selectionStart;
    const textBeforeCursor = text.substring(0, cursorPosition);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtSymbol !== -1) {
      const searchTerm = textBeforeCursor.substring(lastAtSymbol + 1);
      
      // Only show suggestions if we have a partial search and no spaces after @
      if (searchTerm.length > 0 && !searchTerm.includes(' ')) {
        const suggestions = members
          .filter(member => {
            const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
            return fullName.includes(searchTerm.toLowerCase());
          })
          .slice(0, 5); // Limit to 5 suggestions
        
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
    
    // Focus back to textarea
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

  // Filter comments based on view mode and selected division
  const getFilteredComments = () => {
    if (!comments) return [];
    
    if (viewMode === 'general') {
      return comments.filter(comment => !comment.divisionId);
    } else if (viewMode === 'division' && selectedDivision) {
      return comments.filter(comment => comment.divisionId === selectedDivision);
    }
    
    return comments; // 'all' mode
  };

  const filteredComments = getFilteredComments();

  // Handle comment submission
  const handleSubmitComment = async (content, parentId = null, targetDivisionId = null) => {
    if (!content.trim() || !currentMember) return;

    setSubmitting(true);
    try {
      // Parse mentions from the comment
      const mentions = parseMentions(content, members);
      
      await addComment({
        content: content.trim(),
        parentId,
        divisionId: targetDivisionId || (viewMode === 'division' ? selectedDivision : null),
        mentions: mentions.map(m => m.id) // Store mentioned member IDs
      }, currentMember.id, `${currentMember.firstName} ${currentMember.lastName}`);
      
      setNewComment('');
      setReplyingTo(null);
      showAlert('success', 'Comment posted successfully');
    } catch (error) {
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
    setReplyingTo(comment.id);
  };

  // Cancel reply
  const cancelReply = () => {
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
        <div className="space-y-4">
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
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .map(comment => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
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
 * CommentItem Component - Individual comment display with @mention highlighting
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
  isDivisionBased
}) => {
  const [replyText, setReplyText] = useState('');
  const [showActions, setShowActions] = useState(false);

  const getMemberName = (memberId) => {
    const member = members.find(m => m.id === memberId);
    return member ? `${member.firstName} ${member.lastName}` : 'Unknown User';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const handleReplySubmit = () => {
    if (replyText.trim()) {
      onReply(replyText, comment.id, comment.divisionId);
      setReplyText('');
      cancelReply();
    }
  };

  // Format comment content with @mention highlighting
  const formatCommentContent = (content) => {
    return formatMentionText(content, members);
  };

  return (
    <div className={`${comment.depth > 0 ? 'ml-6 border-l-2 border-gray-200 pl-4' : ''}`}>
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
          <div className="mt-4 pl-6 border-l-2 border-gray-200">
            <div className="space-y-2">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Reply to ${getMemberName(comment.authorId)}...`}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  onClick={handleReplySubmit}
                  disabled={!replyText.trim()}
                >
                  Reply
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

      {/* Replies */}
      {replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {replies
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
            .map(reply => (
              <CommentItem
                key={reply.id}
                comment={{ ...reply, depth: (comment.depth || 0) + 1 }}
                replies={[]}
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
            ))}
        </div>
      )}
    </div>
  );
};

export default CommentSection;