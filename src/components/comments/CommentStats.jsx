// src/components/comments/CommentStats.jsx (SIMPLIFIED - Message Board Style)
import React from 'react';
import { 
  MessageSquare, 
  Reply, 
  Users,
  Activity,
  Clock
} from 'lucide-react';

/**
 * CommentStats Component - Displays basic statistics about comments
 * Simplified for team message board use
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
    mostActiveAuthor = null,
    recentActivity = null
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
        
        <div className="flex items-center space-x-1">
          <Activity className="h-4 w-4" />
          <span>{totalDiscussions} total</span>
        </div>
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

      {/* Total Activity */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
        <div className="flex items-center justify-center mb-2">
          <Activity className="h-6 w-6 text-purple-600" />
        </div>
        <div className="text-2xl font-bold text-purple-900">{totalDiscussions}</div>
        <div className="text-sm text-purple-700">
          Total Messages
        </div>
      </div>

      {/* Most Active Author */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
        <div className="flex items-center justify-center mb-2">
          <Users className="h-6 w-6 text-orange-600" />
        </div>
        <div className="text-lg font-bold text-orange-900 truncate">
          {mostActiveAuthor?.name || 'None'}
        </div>
        <div className="text-sm text-orange-700">
          Most Active ({mostActiveAuthor?.count || 0})
        </div>
      </div>

      {/* Recent Activity Indicator */}
      {recentActivity && (
        <div className="md:col-span-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Clock className="h-5 w-5 text-gray-600" />
            <span className="font-medium text-gray-900">Recent Activity</span>
          </div>
          <div className="mt-2">
            <p className="text-sm text-gray-600">
              Last message posted {recentActivity} ago
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * CommentEngagementBar - Visual representation of comment activity
 */
export const CommentEngagementBar = ({ 
  totalComments, 
  totalReplies, 
  maxValue = 100,
  className = '' 
}) => {
  const totalActivity = totalComments + totalReplies;
  const percentage = Math.min((totalActivity / maxValue) * 100, 100);
  
  const commentsPercentage = totalActivity > 0 
    ? (totalComments / totalActivity) * percentage 
    : 0;
  const repliesPercentage = percentage - commentsPercentage;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between text-sm text-gray-600">
        <span>Message Activity</span>
        <span>{totalActivity} total</span>
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