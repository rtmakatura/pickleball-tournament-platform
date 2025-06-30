// src/components/result/index.js (COMPLETE - All Results Components)

// Form Components for Results Entry
export { default as TournamentResultsForm } from './TournamentResultsForm';
export { default as LeagueResultsForm } from './LeagueResultsForm';
export { default as PlayerPerformanceForm } from './PlayerPerformanceForm';

// Display Components for Results
export { default as ResultsCard } from './ResultsCard';
export { default as ResultsTable } from './ResultsTable';
export { default as PlayerPerformanceHistory } from './PlayerPerformanceHistory';

/**
 * Results Components Export Summary
 * 
 * FORM COMPONENTS
 * ================
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
 * DISPLAY COMPONENTS
 * ==================
 * 
 * RESULTS CARD
 * - Component: ResultsCard
 * - Purpose: Modal display for individual result details with standings and performance
 * - Features: Tabbed interface, player performance insights, export/share functionality
 * - Props: result, onClose, showPlayerPerformance, allowEdit, onEdit
 * 
 * RESULTS TABLE
 * - Component: ResultsTable
 * - Purpose: Tabular display of results with filtering, sorting, and search
 * - Features: Responsive design, export functionality, mobile-friendly cards
 * - Props: results, onResultClick, showExport, title
 * 
 * PLAYER PERFORMANCE HISTORY
 * - Component: PlayerPerformanceHistory
 * - Purpose: Comprehensive player performance tracking and analysis over time
 * - Features: Timeline view, statistics, trends analysis, export functionality
 * - Props: playerId, playerName, performances, results, onClose, showExport
 * 
 * USAGE PATTERNS
 * ==============
 * 
 * // Import individual components
 * import { TournamentResultsForm, LeagueResultsForm, PlayerPerformanceForm } from '../result';
 * import { ResultsCard, ResultsTable, PlayerPerformanceHistory } from '../result';
 * 
 * // Or import all at once
 * import * as ResultsComponents from '../result';
 * 
 * INTEGRATION NOTES
 * =================
 * - All components work with the useResults hook for data management
 * - Forms handle validation, loading states, and error display
 * - Display components provide rich interaction and export capabilities
 * - Responsive design with mobile-first approach using Tailwind CSS
 * - Consistent styling patterns with existing application components
 * - Real-time data updates through Firebase integration
 * - Comprehensive error handling and loading states
 */