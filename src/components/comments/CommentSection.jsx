// src/components/comments/CommentSection.jsx (SIMPLIFIED - Message Board Style)
import React, { useState } from 'react';
import { 
  MessageSquare, 
  Plus, 
  Search,
  Clock,
  Filter,
  AlertCircle
} from 'lucide-react';
import { Button, Input, Select, Alert } from '../ui';
import { useAuth } from '../../hooks/useAuth';
import { useMembers } from '../../hooks/useMembers';
import { useComments } from '../../hooks/useComments';
import { canPostComments, canModerateComments } from '../../utils/roleUtils';
import CommentForm from './CommentForm';
import CommentThread from './CommentThread';
import CommentStats from './CommentStats';

/**
 * CommentSection Component - Team message board interface for events
 * Simplified without voting functionality
 * 
 * Props:
 * - eventId: string - ID of the event
 * - eventType: string - 'tournament' or 'league'
 * - event: object - Event data for permission checking
 * - className: string - Additional CSS classes
 */
const CommentSection = ({ 
  eventId, 
  eventType = 'tournament', 
  event,
  className = '' 
}) => {
  const { user } = useAuth();
  const { members } = useMembers();
  const { 
    comments, 
    loading, 
    error, 
    postComment, 
    stats,
    searchComments,
    clearError 
  } = useComments(eventId, eventType);

  const [showCommentForm, setShowCommentForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'replies'
  const [filterBy, setFilterBy] = useState('all'); // 'all', 'recent'
  const [expandedComments, setExpandedComments] = useState(new Set());

  // Get current user's member record
  const currentMember = members.find(m => m.authUid === user?.uid);
  
  // Check permissions
  const canPost = canPostComments(user?.uid, members) && event?.commentsEnabled !== false;
  const canModerate = canModerateComments(user?.uid, members);

  // Handle comment submission
  const handleCommentSubmit = async (content) => {
    if (!currentMember) return;
    
    try {
      await postComment(
        content, 
        currentMember.id, 
        `${currentMember.firstName} ${currentMember.lastName}`
      );
      setShowCommentForm(false);
    } catch (err) {
      // Error is handled by the hook
    }
  };

  // Get sorted and filtered comments
  const getDisplayComments = () => {
    let displayComments = searchTerm ? searchComments(searchTerm) : comments;
    
    // Apply filters
    if (filterBy === 'recent') {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      displayComments = displayComments.filter(comment => 
        new Date(comment.createdAt) > oneDayAgo
      );
    }
    
    // Apply sorting
    displayComments = [...displayComments].sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'replies':
          if (a.replyCount !== b.replyCount) {
            return b.replyCount - a.replyCount;
          }
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'newest':
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });
    
    return displayComments;
  };

  const displayComments = getDisplayComments();

  // Check if comments are disabled
  if (event?.commentsEnabled === false) {
    return (
      <div className={`bg-gray-50 rounded-lg p-6 text-center ${className}`}>
        <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-2" />
        <p className="text-gray-500">Team discussion is disabled for this {eventType}</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <MessageSquare className="h-6 w-6 text-blue-600" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Team Discussion</h2>
            <p className="text-sm text-gray-500">
              {stats.totalComments + stats.totalReplies} message{stats.totalComments + stats.totalReplies !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        {canPost && (
          <Button
            onClick={() => setShowCommentForm(!showCommentForm)}
            disabled={loading}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Message
          </Button>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert
          type="error"
          title="Message Error"
          message={error}
          onClose={clearError}
        />
      )}

      {/* Comment Stats */}
      <CommentStats stats={stats} />

      {/* Comment Form */}
      {showCommentForm && canPost && (
        <CommentForm
          onSubmit={handleCommentSubmit}
          onCancel={() => setShowCommentForm(false)}
          placeholder={`Share updates or questions about this ${eventType}...`}
          submitText="Post Message"
          loading={loading}
        />
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            options={[
              { value: 'newest', label: 'Newest First' },
              { value: 'oldest', label: 'Oldest First' },
              { value: 'replies', label: 'Most Replies' }
            ]}
            className="min-w-[140px]"
          />
          
          <Select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
            options={[
              { value: 'all', label: 'All Messages' },
              { value: 'recent', label: 'Last 24 Hours' }
            ]}
            className="min-w-[140px]"
          />
        </div>
      </div>

      {/* Messages List */}
      <div className="space-y-4">
        {loading && comments.length === 0 ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-500">Loading messages...</p>
          </div>
        ) : displayComments.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              {searchTerm ? 'No matching messages' : 'No messages yet'}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm 
                ? 'Try adjusting your search terms or filters'
                : `Start the team discussion for this ${eventType}!`
              }
            </p>
            {!searchTerm && canPost && !showCommentForm && (
              <Button
                onClick={() => setShowCommentForm(true)}
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Post First Message
              </Button>
            )}
          </div>
        ) : (
          displayComments.map((comment) => (
            <CommentThread
              key={comment.id}
              comment={comment}
              eventId={eventId}
              eventType={eventType}
              currentUserId={currentMember?.id}
              canModerate={canModerate}
              expandedComments={expandedComments}
              onToggleExpand={(commentId) => {
                const newExpanded = new Set(expandedComments);
                if (newExpanded.has(commentId)) {
                  newExpanded.delete(commentId);
                } else {
                  newExpanded.add(commentId);
                }
                setExpandedComments(newExpanded);
              }}
            />
          ))
        )}
      </div>

      {/* Message Count */}
      {comments.length > 0 && (
        <div className="text-center pt-4 border-t">
          <p className="text-sm text-gray-500 flex items-center justify-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>
              Showing {displayComments.length} of {stats.totalComments + stats.totalReplies} messages
            </span>
          </p>
        </div>
      )}
    </div>
  );
};

export default CommentSection;