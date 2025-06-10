// src/components/comments/index.js (SIMPLIFIED - No Voting Components)
// Export all comment-related components for team message board

export { default as CommentSection } from './CommentSection';
export { default as CommentForm } from './CommentForm';
export { default as CommentThread } from './CommentThread';
export { default as CommentStats, CommentEngagementBar } from './CommentStats';

// Usage Examples:
// import { CommentSection, CommentForm, CommentThread } from '../comments';
// OR
// import CommentSection from '../comments/CommentSection';

// Note: CommentVoting component removed - this is now a simple team message board
// without voting functionality for cleaner team communication.