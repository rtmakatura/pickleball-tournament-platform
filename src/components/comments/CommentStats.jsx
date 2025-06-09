// src/components/comments/CommentStats.jsx
import React from 'react';
import { 
  MessageSquare, 
  Reply, 
  TrendingUp, 
  Award,
  Users,
  Activity
} from 'lucide-react';

/**
 * CommentStats Component - Displays statistics about comments
 * 
 * Props:
 * - stats: object - Comment statistics
 * - compact: boolean - Whether to show compact version
 * - className: string - Additional CSS classes
 */
const CommentStats = ({ 
  stats = {}, 
  compact = false,
  className = '' 
}) => {
  const {
    totalComments = 0,
    totalReplies = 0,
    totalVotes = 0,
    averageScore = 0,
    topComment = null
  } = stats;

  const totalDiscussions = totalComments + totalReplies;

  if (totalDiscussions === 0) {
    return null; // Don't show stats if no comments
  }

  if (compact) {
    return (
      <div className={`flex items-center space-x-4 text-sm text-gray-600 ${className}`}>
        <div className="flex items-center space-x-1">
          <MessageSquare className="h-4 w-4" />
          <span>{totalComments} comments</span>
        </div>
        
        {totalReplies > 0 && (
          <div className="flex items-center space-x-1">
            <Reply className="h-4 w-4" />
            <span>{totalReplies} replies</span>
          </div>
        )}
        
        {totalVotes > 0 && (
          <div className="flex items-center space-x-1">
            <TrendingUp className="h-4 w-4" />
            <span>{totalVotes} votes</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
      {/* Total Comments */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
        <div className="flex items-center justify-center mb-2">
          <MessageSquare className="h-6 w-6 text-blue-600" />
        </div>
        <div className="text-2xl font-bold text-blue-900">{totalComments}</div>
        <div className="text-sm text-blue-700">
          Comment{totalComments !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Total Replies */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
        <div className="flex items-center justify-center mb-2">
          <Reply className="h-6 w-6 text-green-600" />
        </div>
        <div className="text-2xl font-bold text-green-900">{totalReplies}</div>
        <div className="text-sm text-green-700">
          Repl{totalReplies === 1 ? 'y' : 'ies'}
        </div>
      </div>

      {/* Total Engagement */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
        <div className="flex items-center justify-center mb-2">
          <Activity className="h-6 w-6 text-purple-600" />
        </div>
        <div className="text-2xl font-bold text-purple-900">{totalVotes}</div>
        <div className="text-sm text-purple-700">
          Vote{totalVotes !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Average Score */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
        <div className="flex items-center justify-center mb-2">
          <TrendingUp className="h-6 w-6 text-orange-600" />
        </div>
        <div className="text-2xl font-bold text-orange-900">
          {averageScore > 0 ? '+' : ''}{averageScore.toFixed(1)}
        </div>
        <div className="text-sm text-orange-700">Avg Score</div>
      </div>

      {/* Top Comment (if exists) */}
      {topComment && topComment.score > 0 && (
        <div className="md:col-span-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-yellow-600" />
              <span className="font-medium text-yellow-900">Top Comment</span>
              <span className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
                +{topComment.score}
              </span>
            </div>
          </div>
          <div className="mt-2">
            <p className="text-sm text-yellow-800 line-clamp-2">
              "{topComment.content.length > 100 
                ? topComment.content.substring(0, 100) + '...' 
                : topComment.content}"
            </p>
            <p className="text-xs text-yellow-600 mt-1">
              by {topComment.authorName}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * CommentEngagementBar - Visual representation of comment engagement
 */
export const CommentEngagementBar = ({ 
  totalComments, 
  totalReplies, 
  maxValue = 100,
  className = '' 
}) => {
  const totalEngagement = totalComments + totalReplies;
  const percentage = Math.min((totalEngagement / maxValue) * 100, 100);
  
  const commentsPercentage = totalEngagement > 0 
    ? (totalComments / totalEngagement) * percentage 
    : 0;
  const repliesPercentage = percentage - commentsPercentage;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between text-sm text-gray-600">
        <span>Engagement</span>
        <span>{totalEngagement} total</span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div className="h-full flex">
          <div 
            className="bg-blue-500 transition-all duration-300"
            style={{ width: `${commentsPercentage}%` }}
            title={`${totalComments} comments`}
          />
          <div 
            className="bg-green-500 transition-all duration-300"
            style={{ width: `${repliesPercentage}%` }}
            title={`${totalReplies} replies`}
          />
        </div>
      </div>
      
      <div className="flex justify-between text-xs text-gray-500">
        <span className="flex items-center">
          <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
          Comments
        </span>
        <span className="flex items-center">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
          Replies
        </span>
      </div>
    </div>
  );
};

export default CommentStats;