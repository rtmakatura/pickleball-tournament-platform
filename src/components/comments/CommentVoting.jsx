// src/components/comments/CommentVoting.jsx
import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useComments } from '../../hooks/useComments';
import { useAuth } from '../../hooks/useAuth';
import { useMembers } from '../../hooks/useMembers';
import { VOTE_TYPES } from '../../services/models';

/**
 * CommentVoting Component - Handles upvoting and downvoting of comments
 * 
 * Props:
 * - commentId: string - ID of the comment
 * - upvotes: number - Number of upvotes
 * - downvotes: number - Number of downvotes  
 * - score: number - Net score (upvotes - downvotes)
 * - userVote: string - Current user's vote ('up', 'down', or null)
 * - disabled: boolean - Whether voting is disabled
 * - size: string - Size variant ('sm', 'md')
 */
const CommentVoting = ({
  commentId,
  upvotes = 0,
  downvotes = 0,
  score = 0,
  userVote = null,
  disabled = false,
  size = 'sm'
}) => {
  const { user } = useAuth();
  const { members } = useMembers();
  const { voteOnComment } = useComments();
  
  const [isVoting, setIsVoting] = useState(false);
  const [optimisticVote, setOptimisticVote] = useState(null);
  const [optimisticScore, setOptimisticScore] = useState(score);

  // Get current user's member record
  const currentMember = members.find(m => m.authUid === user?.uid);
  const canVote = currentMember && !disabled;

  // Handle vote action
  const handleVote = async (voteType) => {
    if (!canVote || isVoting) return;

    setIsVoting(true);
    
    // Optimistic update
    let scoreChange = 0;
    const currentVote = optimisticVote || userVote;
    
    if (currentVote === voteType) {
      // Remove vote
      setOptimisticVote(null);
      scoreChange = voteType === VOTE_TYPES.UP ? -1 : 1;
    } else {
      // Add or change vote
      setOptimisticVote(voteType);
      if (currentVote) {
        // Changing vote
        scoreChange = voteType === VOTE_TYPES.UP ? 2 : -2;
      } else {
        // New vote
        scoreChange = voteType === VOTE_TYPES.UP ? 1 : -1;
      }
    }
    
    setOptimisticScore(optimisticScore + scoreChange);

    try {
      await voteOnComment(commentId, currentMember.id, voteType);
    } catch (error) {
      // Revert optimistic update on error
      setOptimisticVote(userVote);
      setOptimisticScore(score);
      console.error('Error voting on comment:', error);
    } finally {
      setIsVoting(false);
    }
  };

  // Get display values (use optimistic if available, otherwise props)
  const displayVote = optimisticVote !== null ? optimisticVote : userVote;
  const displayScore = optimisticScore;

  // Size classes
  const sizeClasses = {
    sm: {
      button: 'p-1',
      icon: 'h-4 w-4',
      score: 'text-sm px-2 py-1',
      container: 'space-x-1'
    },
    md: {
      button: 'p-2',
      icon: 'h-5 w-5',
      score: 'text-base px-3 py-1',
      container: 'space-x-2'
    }
  };

  const classes = sizeClasses[size] || sizeClasses.sm;

  // Score color based on value
  const getScoreColor = (scoreValue) => {
    if (scoreValue > 0) return 'text-green-600 bg-green-50';
    if (scoreValue < 0) return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  return (
    <div className={`flex items-center ${classes.container}`}>
      {/* Upvote Button */}
      <button
        onClick={() => handleVote(VOTE_TYPES.UP)}
        disabled={!canVote || isVoting}
        className={`
          rounded transition-all duration-200 ${classes.button}
          ${displayVote === VOTE_TYPES.UP 
            ? 'text-green-600 bg-green-100 hover:bg-green-200' 
            : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
          }
          ${!canVote ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
          ${isVoting ? 'opacity-50' : ''}
        `}
        title={canVote ? 'Upvote' : 'Sign in to vote'}
      >
        <ChevronUp className={`${classes.icon} ${isVoting ? 'animate-pulse' : ''}`} />
      </button>

      {/* Score Display */}
      <div className={`
        font-medium rounded ${classes.score} ${getScoreColor(displayScore)}
        transition-colors duration-200
      `}>
        {displayScore > 0 ? '+' : ''}{displayScore}
      </div>

      {/* Downvote Button */}
      <button
        onClick={() => handleVote(VOTE_TYPES.DOWN)}
        disabled={!canVote || isVoting}
        className={`
          rounded transition-all duration-200 ${classes.button}
          ${displayVote === VOTE_TYPES.DOWN 
            ? 'text-red-600 bg-red-100 hover:bg-red-200' 
            : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
          }
          ${!canVote ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
          ${isVoting ? 'opacity-50' : ''}
        `}
        title={canVote ? 'Downvote' : 'Sign in to vote'}
      >
        <ChevronDown className={`${classes.icon} ${isVoting ? 'animate-pulse' : ''}`} />
      </button>

      {/* Vote counts tooltip (on hover) */}
      {(upvotes > 0 || downvotes > 0) && (
        <div className="hidden group-hover:block absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
          ↑ {upvotes} • ↓ {downvotes}
        </div>
      )}
    </div>
  );
};

export default CommentVoting;