// src/components/results/index.js (FIXED - Updated export names)
// Export all results-related components

export { default as ResultsManagement } from './ResultsManagement';
export { ResultsButton, ResultsViewer } from './ResultsButton'; // FIXED: Changed ResultsDisplay to ResultsViewer
export { default as AwardModal, AwardDisplay } from './AwardModal';

// Future results components can be added here:
// export { default as ResultsChart } from './ResultsChart';
// export { default as ResultsHistory } from './ResultsHistory';
// export { default as PlayerStats } from './PlayerStats';

// Usage Examples:
// import { ResultsManagement, ResultsButton, AwardModal } from '../results';
// OR
// import ResultsManagement from '../results/ResultsManagement';