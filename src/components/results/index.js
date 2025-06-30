// src/components/results/index.js

// Form Components for Results Entry
export { default as TournamentResultsForm } from './TournamentResultsForm';
export { default as LeagueResultsForm } from './LeagueResultsForm';
export { default as PlayerPerformanceForm } from './PlayerPerformanceForm';

/**
 * Results Components Export Summary
 * 
 * TOURNAMENT RESULTS FORM
 * - Component: TournamentResultsForm
 * - Purpose: Enter/edit tournament division results with player standings
 * - Features: Position management, win/loss tracking, points system, drag-to-reorder
 * - Props: tournament, division, members, onSubmit, onCancel, isLoading, existingResults
 * 
 * LEAGUE RESULTS FORM  
 * - Component: LeagueResultsForm
 * - Purpose: Enter/edit league results with player standings and season tracking
 * - Features: Season management, games played tracking, win percentage calculation
 * - Props: league, members, onSubmit, onCancel, isLoading, existingResults
 * 
 * PLAYER PERFORMANCE FORM
 * - Component: PlayerPerformanceForm  
 * - Purpose: Player self-assessment with skill ratings and goal tracking
 * - Features: 8-category skill rating, strengths/improvements/goals, star ratings
 * - Props: event, member, onSubmit, onCancel, isLoading, existingPerformance
 * 
 * USAGE PATTERNS
 * import { TournamentResultsForm, LeagueResultsForm, PlayerPerformanceForm } from '../results';
 * 
 * INTEGRATION NOTES
 * - All forms work with the useResults and usePlayerPerformance hooks from Phase 2
 * - Forms handle validation, loading states, and error display
 * - Responsive design with mobile-first approach using Tailwind CSS
 * - Consistent styling patterns with existing application components
 * - Real-time form validation with user-friendly error messages
 */