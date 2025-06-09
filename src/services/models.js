// src/services/models.js (ENHANCED - Added Results Support)
// Enhanced data models for PickleTrack entities with results management

export const SKILL_LEVELS = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
  PROFESSIONAL: 'professional'
};

export const MEMBER_ROLES = {
  PLAYER: 'player',
  ORGANIZER: 'organizer',
  ADMIN: 'admin'
};

export const TOURNAMENT_STATUS = {
  DRAFT: 'draft',
  REGISTRATION_OPEN: 'registration_open',
  REGISTRATION_CLOSED: 'registration_closed',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

export const LEAGUE_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  COMPLETED: 'completed'
};

export const PAYMENT_MODES = {
  INDIVIDUAL: 'individual',
  GROUP: 'group'
};

export const EVENT_TYPES = {
  SINGLES: 'singles',
  MENS_DOUBLES: 'mens_doubles',
  WOMENS_DOUBLES: 'womens_doubles',
  MIXED_DOUBLES: 'mixed_doubles',
  TEAM: 'team'
};

// NEW: Results-related constants
export const RESULT_STATUS = {
  DRAFT: 'draft',           // Results being entered
  PENDING: 'pending',       // Awaiting participant confirmation  
  CONFIRMED: 'confirmed',   // Results confirmed and published
  DISPUTED: 'disputed'      // Results are being disputed
};

export const AWARD_TYPES = {
  CHAMPION: 'champion',
  RUNNER_UP: 'runner_up',
  THIRD_PLACE: 'third_place',
  MOST_IMPROVED: 'most_improved',
  BEST_SPORTSMANSHIP: 'best_sportsmanship',
  MOST_GAMES_WON: 'most_games_won',
  HIGHEST_SCORING: 'highest_scoring',
  PERFECT_ATTENDANCE: 'perfect_attendance',
  COMEBACK_PLAYER: 'comeback_player',
  CUSTOM: 'custom'
};

export const MATCH_TYPES = {
  POOL_PLAY: 'pool_play',
  QUARTERFINAL: 'quarterfinal', 
  SEMIFINAL: 'semifinal',
  FINAL: 'final',
  THIRD_PLACE: 'third_place',
  REGULAR_SEASON: 'regular_season',
  PLAYOFF: 'playoff'
};

// Enhanced Member model
export const createMember = (data = {}) => ({
  authUid: data.authUid || null,
  email: data.email || '',
  firstName: data.firstName || '',
  lastName: data.lastName || '',
  displayName: data.displayName || `${data.firstName || ''} ${data.lastName || ''}`.trim(),
  phoneNumber: data.phoneNumber || '',
  venmoHandle: data.venmoHandle || '',
  skillLevel: data.skillLevel || SKILL_LEVELS.BEGINNER,
  role: data.role || MEMBER_ROLES.PLAYER,
  isActive: data.isActive !== false,
  profileComplete: data.profileComplete !== false,
  lastLoginAt: data.lastLoginAt || null,
  isLegacyMember: data.authUid ? false : true,
  
  // NEW: Performance statistics
  statistics: data.statistics || {
    totalTournaments: 0,
    totalLeagues: 0,
    tournamentsWon: 0,
    leaguesWon: 0,
    totalPrizeMoney: 0,
    gamesWon: 0,
    gamesLost: 0,
    pointsScored: 0,
    pointsAllowed: 0,
    winPercentage: 0,
    awards: [] // Array of awards earned
  }
});

// NEW: Participant Result Model
export const createParticipantResult = (data = {}) => ({
  participantId: data.participantId || '',
  placement: data.placement || null, // 1, 2, 3, etc. (null if didn't place in top positions)
  prizeAmount: data.prizeAmount || 0,
  
  // Performance metrics
  gamesWon: data.gamesWon || 0,
  gamesLost: data.gamesLost || 0,
  pointsFor: data.pointsFor || 0,
  pointsAgainst: data.pointsAgainst || 0,
  winPercentage: data.winPercentage || 0,
  
  // Awards and recognition
  awards: data.awards || [], // Array of award objects
  
  // Additional info
  notes: data.notes || '',
  photoUrl: data.photoUrl || '',
  
  // Verification
  confirmed: data.confirmed || false,
  confirmedAt: data.confirmedAt || null,
  
  // Timestamps
  enteredAt: data.enteredAt || null,
  enteredBy: data.enteredBy || null
});

// NEW: Award Model
export const createAward = (data = {}) => ({
  type: data.type || AWARD_TYPES.CUSTOM,
  title: data.title || '',
  description: data.description || '',
  customTitle: data.customTitle || '', // For custom awards
  value: data.value || 0, // Monetary value if applicable
  recipientId: data.recipientId || '',
  awardedBy: data.awardedBy || '',
  awardedAt: data.awardedAt || new Date()
});

// NEW: Match Result Model  
export const createMatchResult = (data = {}) => ({
  eventId: data.eventId || '',
  eventType: data.eventType || 'tournament', // 'tournament' or 'league'
  
  // Participants
  participant1Id: data.participant1Id || '',
  participant2Id: data.participant2Id || null, // null for bye
  
  // Score tracking (flexible format)
  games: data.games || [], // Array of game objects: [{score1: 11, score2: 8}, ...]
  finalScore: data.finalScore || {player1Games: 0, player2Games: 0},
  
  // Match details
  winnerId: data.winnerId || null,
  matchType: data.matchType || MATCH_TYPES.REGULAR_SEASON,
  round: data.round || '',
  court: data.court || '',
  matchDate: data.matchDate || null,
  duration: data.duration || 0, // minutes
  
  // Additional info
  notes: data.notes || '',
  verifiedBy: data.verifiedBy || null,
  verifiedAt: data.verifiedAt || null,
  
  // Dispute handling
  disputed: data.disputed || false,
  disputeNotes: data.disputeNotes || ''
});

// NEW: Event Results Model (overall results for tournament/league)
export const createEventResults = (data = {}) => ({
  eventId: data.eventId || '',
  eventType: data.eventType || 'tournament',
  status: data.status || RESULT_STATUS.DRAFT,
  
  // Participant results
  participantResults: data.participantResults || [], // Array of ParticipantResult objects
  
  // Match results (for detailed tracking)
  matchResults: data.matchResults || [], // Array of MatchResult objects
  
  // Overall event statistics
  totalPrizeMoney: data.totalPrizeMoney || 0,
  totalGamesPlayed: data.totalGamesPlayed || 0,
  averageGameDuration: data.averageGameDuration || 0,
  
  // Event completion info
  completedAt: data.completedAt || null,
  publishedAt: data.publishedAt || null,
  enteredBy: data.enteredBy || null,
  
  // Notes and media
  eventNotes: data.eventNotes || '',
  highlightPhotos: data.highlightPhotos || [],
  videoLinks: data.videoLinks || [],
  
  // Export/sharing
  lastExportedAt: data.lastExportedAt || null,
  sharedWithParticipants: data.sharedWithParticipants || false
});

// Enhanced League model with results support
export const createLeague = (data = {}) => ({
  name: data.name || '',
  description: data.description || '',
  skillLevel: data.skillLevel || SKILL_LEVELS.INTERMEDIATE,
  status: data.status || LEAGUE_STATUS.ACTIVE,
  startDate: data.startDate || null,
  endDate: data.endDate || null,
  maxParticipants: data.maxParticipants || 2,
  eventType: data.eventType || EVENT_TYPES.MIXED_DOUBLES,
  participants: data.participants || [],
  registrationFee: data.registrationFee || 0,
  paymentMode: data.paymentMode || PAYMENT_MODES.INDIVIDUAL,
  paymentData: data.paymentData || {},
  isActive: data.isActive !== false,
  createdBy: data.createdBy || null,
  organizers: data.organizers || [],
  allowSelfRegistration: data.allowSelfRegistration !== false,
  requireApproval: data.requireApproval || false,
  playDays: data.playDays || [],
  playTimes: data.playTimes || [],
  venue: data.venue || '',
  format: data.format || 'round_robin',
  numberOfWeeks: data.numberOfWeeks || 8,
  
  // NEW: Results integration
  hasResults: data.hasResults || false,
  resultsId: data.resultsId || null, // Reference to EventResults document
  allowResultsEntry: data.allowResultsEntry !== false,
  requireResultsConfirmation: data.requireResultsConfirmation || false
});

// Enhanced Tournament model with results support
export const createTournament = (data = {}) => ({
  name: data.name || '',
  description: data.description || '',
  skillLevel: data.skillLevel || SKILL_LEVELS.INTERMEDIATE,
  status: data.status || TOURNAMENT_STATUS.DRAFT,
  eventDate: data.eventDate || null,
  registrationDeadline: data.registrationDeadline || null,
  maxParticipants: data.maxParticipants || 2,
  eventType: data.eventType || EVENT_TYPES.MIXED_DOUBLES,
  participants: data.participants || [],
  entryFee: data.entryFee || 0,
  paymentMode: data.paymentMode || PAYMENT_MODES.INDIVIDUAL,
  paymentData: data.paymentData || {},
  location: data.location || '',
  venue: data.venue || '',
  address: data.address || '',
  isActive: data.isActive !== false,
  createdBy: data.createdBy || null,
  organizers: data.organizers || [],
  allowSelfRegistration: data.allowSelfRegistration !== false,
  requireApproval: data.requireApproval || false,
  format: data.format || 'single_elimination',
  numberOfCourts: data.numberOfCourts || 4,
  matchDuration: data.matchDuration || 60,
  prizes: data.prizes || [],
  hasPrizes: data.hasPrizes || false,
  ballType: data.ballType || '',
  specialRules: data.specialRules || '',
  equipmentProvided: data.equipmentProvided || false,
  
  // NEW: Results integration
  hasResults: data.hasResults || false,
  resultsId: data.resultsId || null, // Reference to EventResults document
  allowResultsEntry: data.allowResultsEntry !== false,
  requireResultsConfirmation: data.requireResultsConfirmation || false,
  bracketType: data.bracketType || 'single_elimination', // single_elimination, double_elimination, round_robin
  consolationBracket: data.consolationBracket || false
});

// User session model for tracking login activity
export const createUserSession = (data = {}) => ({
  authUid: data.authUid || '',
  memberId: data.memberId || '',
  loginAt: data.loginAt || new Date(),
  logoutAt: data.logoutAt || null,
  ipAddress: data.ipAddress || '',
  userAgent: data.userAgent || '',
  isActive: data.isActive !== false
});

// Permission model for fine-grained access control
export const createPermission = (data = {}) => ({
  name: data.name || '',
  description: data.description || '',
  category: data.category || 'general',
  isActive: data.isActive !== false
});

// Role permission mapping
export const getRolePermissions = (role) => {
  const permissions = {
    [MEMBER_ROLES.PLAYER]: [
      'view_tournaments',
      'view_leagues',
      'register_for_events',
      'view_own_payments',
      'edit_own_profile',
      'view_member_list',
      'view_results',
      'confirm_own_results'
    ],
    [MEMBER_ROLES.ORGANIZER]: [
      'view_tournaments',
      'view_leagues',
      'register_for_events',
      'view_own_payments',
      'edit_own_profile',
      'view_member_list',
      'create_tournaments',
      'edit_tournaments',
      'create_leagues',
      'edit_leagues',
      'manage_event_participants',
      'manage_payments',
      'view_payment_reports',
      'send_notifications',
      'view_results',
      'manage_results',
      'enter_results',
      'publish_results',
      'export_results'
    ],
    [MEMBER_ROLES.ADMIN]: [
      'all_permissions'
    ]
  };
  
  return permissions[role] || [];
};

// Enhanced validation helpers with results support
export const validateMemberData = (memberData) => {
  const errors = [];
  
  if (!memberData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(memberData.email)) {
    errors.push('Valid email is required');
  }
  
  if (!memberData.firstName || memberData.firstName.trim().length < 1) {
    errors.push('First name is required');
  }
  
  if (!memberData.lastName || memberData.lastName.trim().length < 1) {
    errors.push('Last name is required');
  }
  
  if (!Object.values(SKILL_LEVELS).includes(memberData.skillLevel)) {
    errors.push('Valid skill level is required');
  }
  
  if (!Object.values(MEMBER_ROLES).includes(memberData.role)) {
    errors.push('Valid role is required');
  }
  
  if (memberData.venmoHandle && !/^[a-zA-Z0-9_-]+$/.test(memberData.venmoHandle)) {
    errors.push('Venmo handle can only contain letters, numbers, hyphens, and underscores');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateTournamentData = (tournamentData) => {
  const errors = [];
  
  if (!tournamentData.name || tournamentData.name.trim().length < 3) {
    errors.push('Tournament name must be at least 3 characters');
  }
  
  if (!tournamentData.eventDate) {
    errors.push('Event date is required');
  }
  
  if (!tournamentData.location || tournamentData.location.trim().length < 1) {
    errors.push('Location is required');
  }
  
  if (!Object.values(SKILL_LEVELS).includes(tournamentData.skillLevel)) {
    errors.push('Valid skill level is required');
  }
  
  if (!Object.values(EVENT_TYPES).includes(tournamentData.eventType)) {
    errors.push('Valid event type is required');
  }
  
  if (tournamentData.entryFee < 0) {
    errors.push('Entry fee cannot be negative');
  }
  
  if (tournamentData.maxParticipants < 1) {
    errors.push('Maximum participants must be at least 1');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateLeagueData = (leagueData) => {
  const errors = [];
  
  if (!leagueData.name || leagueData.name.trim().length < 3) {
    errors.push('League name must be at least 3 characters');
  }
  
  if (!leagueData.startDate) {
    errors.push('Start date is required');
  }
  
  if (!leagueData.endDate) {
    errors.push('End date is required');
  }
  
  if (leagueData.startDate && leagueData.endDate && 
      new Date(leagueData.endDate) <= new Date(leagueData.startDate)) {
    errors.push('End date must be after start date');
  }
  
  if (!Object.values(SKILL_LEVELS).includes(leagueData.skillLevel)) {
    errors.push('Valid skill level is required');
  }
  
  if (!Object.values(EVENT_TYPES).includes(leagueData.eventType)) {
    errors.push('Valid event type is required');
  }
  
  if (leagueData.registrationFee < 0) {
    errors.push('Registration fee cannot be negative');
  }
  
  if (leagueData.maxParticipants < 1) {
    errors.push('Maximum participants must be at least 1');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// NEW: Results validation
export const validateParticipantResult = (resultData, totalParticipants) => {
  const errors = [];
  
  if (!resultData.participantId) {
    errors.push('Participant ID is required');
  }
  
  if (resultData.placement !== null) {
    if (resultData.placement < 1 || resultData.placement > totalParticipants) {
      errors.push(`Placement must be between 1 and ${totalParticipants}`);
    }
  }
  
  if (resultData.prizeAmount < 0) {
    errors.push('Prize amount cannot be negative');
  }
  
  if (resultData.gamesWon < 0 || resultData.gamesLost < 0) {
    errors.push('Games won/lost cannot be negative');
  }
  
  if (resultData.pointsFor < 0 || resultData.pointsAgainst < 0) {
    errors.push('Points for/against cannot be negative');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateEventResults = (resultsData) => {
  const errors = [];
  
  if (!resultsData.eventId) {
    errors.push('Event ID is required');
  }
  
  if (!Object.values(RESULT_STATUS).includes(resultsData.status)) {
    errors.push('Valid result status is required');
  }
  
  // Check for duplicate placements
  const placements = resultsData.participantResults
    .map(r => r.placement)
    .filter(p => p !== null);
  
  const uniquePlacements = [...new Set(placements)];
  if (placements.length !== uniquePlacements.length) {
    errors.push('Duplicate placements are not allowed');
  }
  
  // Validate total prize money
  const totalPrizes = resultsData.participantResults
    .reduce((sum, r) => sum + (r.prizeAmount || 0), 0);
  
  if (resultsData.totalPrizeMoney !== totalPrizes) {
    errors.push('Total prize money does not match sum of individual prizes');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Default admin user (for initial setup)
export const createDefaultAdmin = (authUid, email) => ({
  authUid,
  email,
  firstName: 'System',
  lastName: 'Administrator',
  displayName: 'System Administrator',
  phoneNumber: '',
  venmoHandle: '',
  skillLevel: SKILL_LEVELS.ADVANCED,
  role: MEMBER_ROLES.ADMIN,
  isActive: true,
  profileComplete: true,
  isLegacyMember: false,
  statistics: {
    totalTournaments: 0,
    totalLeagues: 0,
    tournamentsWon: 0,
    leaguesWon: 0,
    totalPrizeMoney: 0,
    gamesWon: 0,
    gamesLost: 0,
    pointsScored: 0,
    pointsAllowed: 0,
    winPercentage: 0,
    awards: []
  }
});

export default {
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
  // NEW: Results exports
  createParticipantResult,
  createAward,
  createMatchResult,
  createEventResults,
  validateParticipantResult,
  validateEventResults,
  SKILL_LEVELS,
  MEMBER_ROLES,
  TOURNAMENT_STATUS,
  LEAGUE_STATUS,
  PAYMENT_MODES,
  EVENT_TYPES,
  // NEW: Results constants
  RESULT_STATUS,
  AWARD_TYPES,
  MATCH_TYPES
};