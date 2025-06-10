// src/components/comments/CommentThread.jsx (SIMPLIFIED - Message Board Style)
import React, { useState } from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  Reply, 
  Edit, 
  Trash2, 
  Flag,
  MoreHorizontal,
  EyeOff,
  MessageSquare,
  Clock
} from 'lucide-react';
import { Button } from '../ui';
import { useAuth } from '../../hooks/useAuth';
import { useMembers } from '../../hooks/useMembers';
import { useComments } from '../../hooks/useComments';
import { formatDistanceToNow } from 'date-fns';
import CommentForm from './CommentForm';

/**
 * CommentThread Component - Displays a comment and its nested replies
 * Simplified for team message board use (no voting)
 * 
 * Props:
 * - comment: object - Comment data
 * - eventId: string - Event ID
 * - eventType: string - Event type
 * - currentUserId: string - Current user's member ID
 * - canModerate: boolean - Whether user can moderate comments
 * - depth: number - Nesting depth (for styling)
 * - maxDepth: number - Maximum reply depth
 * - expandedComments: Set - Set of expanded comment IDs
 * - onToggleExpand: function - Toggle comment expansion
 */
const CommentThread = ({
  comment,
  eventId,
  eventType,
  currentUserId,
  canModerate = false,
  depth = 0,
  maxDepth = 5,
  expandedComments,
  onToggleExpand
}) => {
  const { user } = useAuth();
  const { members } = useMembers();
  const { 
    postComment, 
    editComment, 
    deleteComment, 
    hideComment 
  } = useComments(eventId, eventType);

  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [loading, setLoading] = useState(false);

  // Get current user's member record
  const currentMember = members.find(m => m.authUid === user?.uid);
  
  // Check if current user owns this comment
  const isOwner = currentUserId === comment.authorId;
  const canEdit = isOwner && comment.status === 'active';
  const canDelete = isOwner || canModerate;
  const canReply = depth < maxDepth && currentMember;
  const canHide = canModerate && comment.status !== 'hidden';

  // Check if comment is expanded
  const isExpanded = expandedComments?.has(comment.id) || depth === 0;

  // Format timestamps
  const formatTimeAgo = (timestamp) => {
    try {
      const date = timestamp?.seconds 
        ? new Date(timestamp.seconds * 1000)
        : new Date(timestamp);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return 'some time ago';
    }
  };

  // Handle reply submission
  const handleReplySubmit = async (content) => {
    if (!currentMember) return;
    
    setLoading(true);
    try {
      await postComment(
        content,
        currentMember.id,
        `${currentMember.firstName} ${currentMember.lastName}`,
        comment.id
      );
      setShowReplyForm(false);
    } catch (err) {
      // Error handled by hook
    } finally {
      setLoading(false);
    }
  };

  // Handle edit submission
  const handleEditSubmit = async (content) => {
    setLoading(true);
    try {
      await editComment(comment.id, content);
      setIsEditing(false);
    } catch (err) {
      // Error handled by hook
    } finally {
      setLoading(false);
    }
  };

  // Handle comment deletion
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    
    setLoading(true);
    try {
      await deleteComment(comment.id);
    } catch (err) {
      // Error handled by hook
    } finally {
      setLoading(false);
    }
  };

  // Handle comment hiding (moderation)
  const handleHide = async () => {
    if (!confirm('Are you sure you want to hide this message?')) return;
    
    setLoading(true);
    try {
      await hideComment(comment.id);
    } catch (err) {
      // Error handled by hook
    } finally {
      setLoading(false);
    }
  };

  // Don't render deleted or hidden comments (unless moderator)
  if (comment.status === 'deleted') {
    return (
      <div className="py-2 text-gray-400 text-sm italic">
        [Message deleted]
      </div>
    );
  }

  if (comment.status === 'hidden' && !canModerate) {
    return (
      <div className="py-2 text-gray-400 text-sm italic">
        [Message hidden by moderator]
      </div>
    );
  }

  return (
    <div className={`${depth > 0 ? 'ml-8 border-l-2 border-gray-100 pl-4' : ''}`}>
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors group">
        {/* Comment Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            {/* Author Avatar */}
            <div className="h-8 w-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {comment.authorName.charAt(0).toUpperCase()}
            </div>
            
            {/* Author Info */}
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900">{comment.authorName}</span>
                {comment.authorId === currentUserId && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                    You
                  </span>
                )}
                {comment.status === 'hidden' && canModerate && (
                  <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">
                    Hidden
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <Clock className="h-3 w-3" />
                <span>{formatTimeAgo(comment.createdAt)}</span>
                {comment.isEdited && (
                  <>
                    <span>•</span>
                    <span>edited</span>
                  </>
                )}
                {comment.depth > 0 && (
                  <>
                    <span>•</span>
                    <span>reply</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Actions Menu */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowActions(!showActions)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
            
            {showActions && (
              <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                <div className="py-1">
                  {canEdit && (
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setShowActions(false);
                      }}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </button>
                  )}
                  
                  {canDelete && (
                    <button
                      onClick={() => {
                        handleDelete();
                        setShowActions(false);
                      }}
                      className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </button>
                  )}
                  
                  {canHide && (
                    <button
                      onClick={() => {
                        handleHide();
                        setShowActions(false);
                      }}
                      className="flex items-center px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 w-full text-left"
                    >
                      <EyeOff className="h-4 w-4 mr-2" />
                      Hide
                    </button>
                  )}
                  
                  <button
                    onClick={() => setShowActions(false)}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    <Flag className="h-4 w-4 mr-2" />
                    Report
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Comment Content */}
        {isEditing ? (
          <CommentForm
            onSubmit={handleEditSubmit}
            onCancel={() => setIsEditing(false)}
            initialValue={comment.content}
            submitText="Save Changes"
            loading={loading}
          />
        ) : (
          <div className="mb-3">
            <p className="text-gray-800 whitespace-pre-wrap break-words">
              {comment.content}
            </p>
          </div>
        )}

        {/* Comment Actions */}
        {!isEditing && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Reply Button */}
              {canReply && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  disabled={loading}
                >
                  <Reply className="h-4 w-4 mr-1" />
                  Reply
                </Button>
              )}

              {/* Reply Count */}
              {comment.replyCount > 0 && (
                <button
                  onClick={() => onToggleExpand?.(comment.id)}
                  className="flex items-center text-sm text-gray-500 hover:text-gray-700"
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  {comment.replyCount} repl{comment.replyCount === 1 ? 'y' : 'ies'}
                  {onToggleExpand && (
                    <>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 ml-1" />
                      ) : (
                        <ChevronDown className="h-4 w-4 ml-1" />
                      )}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Reply Form */}
      {showReplyForm && canReply && (
        <CommentForm
          onSubmit={handleReplySubmit}
          onCancel={() => setShowReplyForm(false)}
          placeholder={`Reply to ${comment.authorName}...`}
          submitText="Post Reply"
          loading={loading}
          isReply={true}
          parentAuthor={comment.authorName}
        />
      )}

      {/* Nested Replies */}
      {isExpanded && comment.replies && comment.replies.length > 0 && (
        <div className="mt-4 space-y-3">
          {comment.replies.map((reply) => (
            <CommentThread
              key={reply.id}
              comment={reply}
              eventId={eventId}
              eventType={eventType}
              currentUserId={currentUserId}
              canModerate={canModerate}
              depth={depth + 1}
              maxDepth={maxDepth}
              expandedComments={expandedComments}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </div>
      )}

      {/* Click outside to close actions menu */}
      {showActions && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowActions(false)}
        />
      )}
    </div>
  );
};

export default CommentThread;