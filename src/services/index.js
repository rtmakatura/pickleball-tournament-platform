// src/services/index.js (UPDATED)

// Firebase core
export { default as app, db, auth } from './firebase';
export { default as firebaseOps } from './firebaseOperations';

// User management
export { default as userManagement } from './userManagement';

// Data models
export {
  createMember,
  createLeague,
  createTournament,
  createUserSession,
  createPermission,
  createDefaultAdmin,
  getRolePermissions,
  validateMemberData,
  validateTournamentData,
  validateLeagueData,
  SKILL_LEVELS,
  MEMBER_ROLES,
  TOURNAMENT_STATUS,
  LEAGUE_STATUS,
  PAYMENT_MODES
} from './models';

// Role utilities
export * from '../utils/roleUtils';