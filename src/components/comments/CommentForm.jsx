// src/components/comments/CommentForm.jsx (SIMPLIFIED - Message Board Style)
import React, { useState } from 'react';
import { Send, X, AlertCircle, MessageSquare } from 'lucide-react';
import { Button } from '../ui';

/**
 * CommentForm Component - Form for posting team messages and replies
 * Simplified for team message board use
 * 
 * Props:
 * - onSubmit: function - Called when form is submitted with content
 * - onCancel: function - Called when form is cancelled
 * - placeholder: string - Placeholder text for textarea
 * - submitText: string - Text for submit button
 * - initialValue: string - Initial content (for editing)
 * - loading: boolean - Whether submission is in progress
 * - maxLength: number - Maximum character count
 * - minLength: number - Minimum character count
 * - isReply: boolean - Whether this is a reply form
 * - parentAuthor: string - Name of parent comment author (for replies)
 */
const CommentForm = ({
  onSubmit,
  onCancel,
  placeholder = "Share a message with the team...",
  submitText = "Post Message",
  initialValue = "",
  loading = false,
  maxLength = 2000,
  minLength = 1,
  isReply = false,
  parentAuthor = ""
}) => {
  const [content, setContent] = useState(initialValue);
  const [error, setError] = useState('');

  // Character count and validation
  const characterCount = content.length;
  const isOverLimit = characterCount > maxLength;
  const isUnderLimit = characterCount < minLength;
  const canSubmit = !isOverLimit && !isUnderLimit && content.trim().length > 0 && !loading;

  // Handle content changes
  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);
    
    // Clear error when user starts typing
    if (error) setError('');
    
    // Validate content
    if (newContent.length > maxLength) {
      setError(`Message must be ${maxLength} characters or less`);
    } else if (newContent.trim().length === 0 && newContent.length > 0) {
      setError('Message cannot be empty or only whitespace');
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const trimmedContent = content.trim();
    
    // Validate content
    if (!trimmedContent) {
      setError('Please enter a message');
      return;
    }
    
    if (trimmedContent.length < minLength) {
      setError(`Message must be at least ${minLength} character${minLength !== 1 ? 's' : ''}`);
      return;
    }
    
    if (trimmedContent.length > maxLength) {
      setError(`Message must be ${maxLength} characters or less`);
      return;
    }
    
    try {
      await onSubmit(trimmedContent);
      setContent('');
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to post message');
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setContent(initialValue);
    setError('');
    onCancel();
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e) => {
    // Ctrl/Cmd + Enter to submit
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && canSubmit) {
      e.preventDefault();
      handleSubmit(e);
    }
    
    // Escape to cancel
    if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  return (
    <div className={`border rounded-lg p-4 bg-white ${isReply ? 'ml-8 mt-3 border-blue-200 bg-blue-50' : 'border-gray-200'}`}>
      {/* Reply indicator */}
      {isReply && parentAuthor && (
        <div className="mb-3 text-sm text-blue-700 flex items-center">
          <MessageSquare className="h-4 w-4 mr-1" />
          Replying to <span className="font-medium">{parentAuthor}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Textarea */}
        <div className="relative">
          <textarea
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={isReply ? 3 : 4}
            disabled={loading}
            className={`
              w-full px-3 py-2 border rounded-md resize-none
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
              ${error ? 'border-red-300' : 'border-gray-300'}
              ${isOverLimit ? 'border-red-300 bg-red-50' : ''}
            `}
          />
          
          {/* Character counter */}
          <div className="absolute bottom-2 right-2 text-xs text-gray-400">
            <span className={characterCount > maxLength * 0.9 ? 'text-orange-500' : ''}>
              {characterCount}
            </span>
            <span className="text-gray-300">/{maxLength}</span>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-center space-x-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Character count warning */}
        {characterCount > maxLength * 0.8 && !isOverLimit && (
          <div className="text-sm text-orange-600">
            {maxLength - characterCount} characters remaining
          </div>
        )}

        {/* Form actions */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            <span className="hidden sm:inline">
              Press Ctrl+Enter to send • Press Escape to cancel
            </span>
          </div>
          
          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
              size="sm"
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            
            <Button
              type="submit"
              disabled={!canSubmit}
              loading={loading}
              size="sm"
              className={isReply ? 'bg-blue-600 hover:bg-blue-700' : ''}
            >
              <Send className="h-4 w-4 mr-1" />
              {loading ? 'Sending...' : submitText}
            </Button>
          </div>
        </div>
      </form>

      {/* Team message board tips */}
      {!isReply && content.length === 0 && (
        <div className="mt-3 text-xs text-gray-500 bg-gray-50 p-2 rounded">
          <p><strong>💡 Team Message Board Tips:</strong></p>
          <ul className="mt-1 space-y-1">
            <li>• Share updates, questions, or coordination info</li>
            <li>• Reply to messages to keep discussions organized</li>
            <li>• Be respectful and keep messages relevant to the event</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default CommentForm;