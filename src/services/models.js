// src/services/models.js (UPDATED - Added Website Fields)
// Data models and validation functions for the application

// Enums and Constants
export const SKILL_LEVELS = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate', 
  ADVANCED: 'advanced',
  OPEN: 'open'
};

export const MEMBER_ROLES = {
  ADMIN: 'admin',
  ORGANIZER: 'organizer',
  PLAYER: 'player'
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
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

export const PAYMENT_MODES = {
  INDIVIDUAL: 'individual',
  GROUP: 'group'
};

export const EVENT_TYPES = {
  SINGLES: 'singles',
  DOUBLES: 'doubles',
  MIXED_DOUBLES: 'mixed_doubles'
};

export const COMMENT_STATUS = {
  ACTIVE: 'active',
  DELETED: 'deleted',
  HIDDEN: 'hidden'
};

export const COMMENT_TYPES = {
  COMMENT: 'comment',
  REPLY: 'reply'
};

export const RESULT_STATUS = {
  DRAFT: 'draft',
  CONFIRMED: 'confirmed',
  PUBLISHED: 'published'
};

export const RESULT_TYPES = {
  TOURNAMENT: 'tournament',
  LEAGUE: 'league'
};

export const PLACEMENT_TYPES = {
  WINNER: 'winner',
  RUNNER_UP: 'runner_up',
  SEMI_FINALIST: 'semi_finalist',
  QUARTER_FINALIST: 'quarter_finalist',
  PARTICIPANT: 'participant'
};

// Model Creation Functions

/**
 * Create a new member object
 */
export const createMember = (data) => {
  return {
    firstName: data.firstName || '',
    lastName: data.lastName || '',
    email: data.email || '',
    skillLevel: data.skillLevel || SKILL_LEVELS.BEGINNER,
    role: data.role || MEMBER_ROLES.PLAYER,
    venmoHandle: data.venmoHandle || '',
    isActive: data.isActive !== false,
    authUid: data.authUid || null,
    createdAt: new Date(),
    updatedAt: new Date()
  };
};

/**
 * Create a new tournament object
 */
export const createTournament = (data) => {
  return {
    name: data.name || '',
    description: data.description || '',
    skillLevel: data.skillLevel || SKILL_LEVELS.OPEN,
    eventType: data.eventType || EVENT_TYPES.MIXED_DOUBLES,
    status: data.status || TOURNAMENT_STATUS.DRAFT,
    eventDate: data.eventDate || null,
    registrationDeadline: data.registrationDeadline || null,
    location: data.location || '',
    website: data.website || '', // NEW: Website field
    entryFee: parseFloat(data.entryFee) || 0,
    maxParticipants: parseInt(data.maxParticipants) || null,
    participants: data.participants || [],
    paymentMode: data.paymentMode || PAYMENT_MODES.INDIVIDUAL,
    paymentData: data.paymentData || {},
    commentCount: data.commentCount || 0,
    commentsEnabled: data.commentsEnabled !== false,
    createdAt: new Date(),
    updatedAt: new Date()
  };
};

/**
 * Create a new league object
 */
export const createLeague = (data) => {
  return {
    name: data.name || '',
    description: data.description || '',
    skillLevel: data.skillLevel || SKILL_LEVELS.OPEN,
    eventType: data.eventType || EVENT_TYPES.MIXED_DOUBLES,
    status: data.status || LEAGUE_STATUS.ACTIVE,
    startDate: data.startDate || null,
    endDate: data.endDate || null,
    location: data.location || '', // NEW: Location field for leagues
    website: data.website || '', // NEW: Website field
    registrationFee: parseFloat(data.registrationFee) || 0,
    maxParticipants: parseInt(data.maxParticipants) || null,
    participants: data.participants || [],
    paymentMode: data.paymentMode || PAYMENT_MODES.INDIVIDUAL,
    paymentData: data.paymentData || {},
    isActive: data.isActive !== false,
    commentCount: data.commentCount || 0,
    commentsEnabled: data.commentsEnabled !== false,
    createdAt: new Date(),
    updatedAt: new Date()
  };
};

/**
 * Create a new comment object
 */
export const createComment = (data) => {
  return {
    eventId: data.eventId || '',
    eventType: data.eventType || 'tournament',
    authorId: data.authorId || '',
    authorName: data.authorName || '',
    content: data.content || '',
    parentId: data.parentId || null,
    type: data.type || COMMENT_TYPES.COMMENT,
    depth: data.depth || 0,
    status: data.status || COMMENT_STATUS.ACTIVE,
    replyCount: data.replyCount || 0,
    isEdited: data.isEdited || false,
    editedAt: data.editedAt || null,
    createdAt: new Date(),
    updatedAt: new Date()
  };
};

/**
 * Create a new event results object
 */
export const createEventResults = (data) => {
  return {
    eventId: data.eventId || '',
    eventType: data.eventType || RESULT_TYPES.TOURNAMENT,
    eventName: data.eventName || '',
    status: data.status || RESULT_STATUS.DRAFT,
    participantResults: data.participantResults || [],
    teamResults: data.teamResults || [],
    notes: data.notes || '',
    publishedAt: data.publishedAt || null,
    confirmedBy: data.confirmedBy || null,
    confirmedAt: data.confirmedAt || null,
    createdAt: new Date(),
    updatedAt: new Date()
  };
};

/**
 * Create a participant result object
 */
export const createParticipantResult = (data) => {
  return {
    participantId: data.participantId || '',
    participantName: data.participantName || '',
    placement: data.placement || PLACEMENT_TYPES.PARTICIPANT,
    score: data.score || 0,
    wins: data.wins || 0,
    losses: data.losses || 0,
    pointsFor: data.pointsFor || 0,
    pointsAgainst: data.pointsAgainst || 0,
    notes: data.notes || '',
    confirmed: data.confirmed || false,
    confirmedAt: data.confirmedAt || null
  };
};

/**
 * Create a team result object (for doubles/team events)
 */
export const createTeamResult = (data) => {
  return {
    teamId: data.teamId || '',
    teamName: data.teamName || '',
    participants: data.participants || [],
    placement: data.placement || PLACEMENT_TYPES.PARTICIPANT,
    score: data.score || 0,
    wins: data.wins || 0,
    losses: data.losses || 0,
    pointsFor: data.pointsFor || 0,
    pointsAgainst: data.pointsAgainst || 0,
    notes: data.notes || '',
    confirmed: data.confirmed || false,
    confirmedAt: data.confirmedAt || null
  };
};

// Validation Functions

/**
 * Validate member data
 */
export const validateMember = (data) => {
  const errors = [];
  
  if (!data.firstName || data.firstName.trim() === '') {
    errors.push('First name is required');
  }
  
  if (!data.lastName || data.lastName.trim() === '') {
    errors.push('Last name is required');
  }
  
  if (!data.email || data.email.trim() === '') {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Invalid email format');
  }
  
  if (!Object.values(SKILL_LEVELS).includes(data.skillLevel)) {
    errors.push('Invalid skill level');
  }
  
  if (!Object.values(MEMBER_ROLES).includes(data.role)) {
    errors.push('Invalid role');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate tournament data
 */
export const validateTournament = (data) => {
  const errors = [];
  
  if (!data.name || data.name.trim() === '') {
    errors.push('Tournament name is required');
  }
  
  if (!Object.values(SKILL_LEVELS).includes(data.skillLevel)) {
    errors.push('Invalid skill level');
  }
  
  if (!Object.values(EVENT_TYPES).includes(data.eventType)) {
    errors.push('Invalid event type');
  }
  
  if (!Object.values(TOURNAMENT_STATUS).includes(data.status)) {
    errors.push('Invalid tournament status');
  }
  
  if (!data.location || data.location.trim() === '') {
    errors.push('Location is required');
  }
  
  // Validate website URL if provided
  if (data.website && data.website.trim()) {
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    if (!urlPattern.test(data.website.trim())) {
      errors.push('Invalid website URL format');
    }
  }
  
  if (data.entryFee < 0) {
    errors.push('Entry fee cannot be negative');
  }
  
  if (data.maxParticipants && data.maxParticipants < 1) {
    errors.push('Max participants must be at least 1');
  }
  
  if (!Object.values(PAYMENT_MODES).includes(data.paymentMode)) {
    errors.push('Invalid payment mode');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate league data
 */
export const validateLeague = (data) => {
  const errors = [];
  
  if (!data.name || data.name.trim() === '') {
    errors.push('League name is required');
  }
  
  if (!Object.values(SKILL_LEVELS).includes(data.skillLevel)) {
    errors.push('Invalid skill level');
  }
  
  if (!Object.values(EVENT_TYPES).includes(data.eventType)) {
    errors.push('Invalid event type');
  }
  
  if (!Object.values(LEAGUE_STATUS).includes(data.status)) {
    errors.push('Invalid league status');
  }
  
  // Validate website URL if provided
  if (data.website && data.website.trim()) {
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    if (!urlPattern.test(data.website.trim())) {
      errors.push('Invalid website URL format');
    }
  }
  
  if (data.registrationFee < 0) {
    errors.push('Registration fee cannot be negative');
  }
  
  if (data.maxParticipants && data.maxParticipants < 1) {
    errors.push('Max participants must be at least 1');
  }
  
  if (!Object.values(PAYMENT_MODES).includes(data.paymentMode)) {
    errors.push('Invalid payment mode');
  }
  
  // Validate date range
  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    if (end <= start) {
      errors.push('End date must be after start date');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate comment data
 */
export const validateComment = (data) => {
  const errors = [];
  
  if (!data.eventId || data.eventId.trim() === '') {
    errors.push('Event ID is required');
  }
  
  if (!['tournament', 'league'].includes(data.eventType)) {
    errors.push('Invalid event type');
  }
  
  if (!data.authorId || data.authorId.trim() === '') {
    errors.push('Author ID is required');
  }
  
  if (!data.authorName || data.authorName.trim() === '') {
    errors.push('Author name is required');
  }
  
  if (!data.content || data.content.trim() === '') {
    errors.push('Comment content is required');
  }
  
  if (data.content && data.content.length > 2000) {
    errors.push('Comment content cannot exceed 2000 characters');
  }
  
  if (!Object.values(COMMENT_TYPES).includes(data.type)) {
    errors.push('Invalid comment type');
  }
  
  if (!Object.values(COMMENT_STATUS).includes(data.status)) {
    errors.push('Invalid comment status');
  }
  
  if (data.depth < 0 || data.depth > 10) {
    errors.push('Invalid comment depth');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate event results data
 */
export const validateEventResults = (data) => {
  const errors = [];
  
  if (!data.eventId || data.eventId.trim() === '') {
    errors.push('Event ID is required');
  }
  
  if (!Object.values(RESULT_TYPES).includes(data.eventType)) {
    errors.push('Invalid event type');
  }
  
  if (!data.eventName || data.eventName.trim() === '') {
    errors.push('Event name is required');
  }
  
  if (!Object.values(RESULT_STATUS).includes(data.status)) {
    errors.push('Invalid result status');
  }
  
  if (!Array.isArray(data.participantResults)) {
    errors.push('Participant results must be an array');
  }
  
  if (!Array.isArray(data.teamResults)) {
    errors.push('Team results must be an array');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate participant result data
 */
export const validateParticipantResult = (data) => {
  const errors = [];
  
  if (!data.participantId || data.participantId.trim() === '') {
    errors.push('Participant ID is required');
  }
  
  if (!data.participantName || data.participantName.trim() === '') {
    errors.push('Participant name is required');
  }
  
  if (!Object.values(PLACEMENT_TYPES).includes(data.placement)) {
    errors.push('Invalid placement type');
  }
  
  if (typeof data.score !== 'number' || data.score < 0) {
    errors.push('Score must be a non-negative number');
  }
  
  if (typeof data.wins !== 'number' || data.wins < 0) {
    errors.push('Wins must be a non-negative number');
  }
  
  if (typeof data.losses !== 'number' || data.losses < 0) {
    errors.push('Losses must be a non-negative number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Utility Functions

/**
 * Get display label for skill level
 */
export const getSkillLevelLabel = (skillLevel) => {
  const labels = {
    [SKILL_LEVELS.BEGINNER]: 'Beginner',
    [SKILL_LEVELS.INTERMEDIATE]: 'Intermediate',
    [SKILL_LEVELS.ADVANCED]: 'Advanced',
    [SKILL_LEVELS.OPEN]: 'Open'
  };
  return labels[skillLevel] || skillLevel;
};

/**
 * Get display label for member role
 */
export const getRoleLabel = (role) => {
  const labels = {
    [MEMBER_ROLES.ADMIN]: 'Administrator',
    [MEMBER_ROLES.ORGANIZER]: 'Organizer',
    [MEMBER_ROLES.PLAYER]: 'Player'
  };
  return labels[role] || role;
};

/**
 * Get display label for tournament status
 */
export const getTournamentStatusLabel = (status) => {
  const labels = {
    [TOURNAMENT_STATUS.DRAFT]: 'Draft',
    [TOURNAMENT_STATUS.REGISTRATION_OPEN]: 'Registration Open',
    [TOURNAMENT_STATUS.REGISTRATION_CLOSED]: 'Registration Closed',
    [TOURNAMENT_STATUS.IN_PROGRESS]: 'In Progress',
    [TOURNAMENT_STATUS.COMPLETED]: 'Completed',
    [TOURNAMENT_STATUS.CANCELLED]: 'Cancelled'
  };
  return labels[status] || status;
};

/**
 * Get display label for league status
 */
export const getLeagueStatusLabel = (status) => {
  const labels = {
    [LEAGUE_STATUS.ACTIVE]: 'Active',
    [LEAGUE_STATUS.COMPLETED]: 'Completed',
    [LEAGUE_STATUS.CANCELLED]: 'Cancelled'
  };
  return labels[status] || status;
};

/**
 * Get display label for event type
 */
export const getEventTypeLabel = (eventType) => {
  const labels = {
    [EVENT_TYPES.SINGLES]: 'Singles',
    [EVENT_TYPES.DOUBLES]: 'Doubles',
    [EVENT_TYPES.MIXED_DOUBLES]: 'Mixed Doubles'
  };
  return labels[eventType] || eventType;
};

/**
 * Check if tournament registration is open
 */
export const isRegistrationOpen = (tournament) => {
  if (tournament.status !== TOURNAMENT_STATUS.REGISTRATION_OPEN) {
    return false;
  }
  
  if (tournament.registrationDeadline) {
    const deadline = tournament.registrationDeadline.seconds 
      ? new Date(tournament.registrationDeadline.seconds * 1000)
      : new Date(tournament.registrationDeadline);
    return new Date() < deadline;
  }
  
  return true;
};

/**
 * Check if tournament is upcoming
 */
export const isUpcoming = (event) => {
  if (!event.eventDate && !event.startDate) return false;
  
  const eventDate = event.eventDate || event.startDate;
  const date = eventDate.seconds 
    ? new Date(eventDate.seconds * 1000)
    : new Date(eventDate);
    
  return date > new Date();
};

/**
 * Calculate age of comment in human readable format
 */
export const getCommentAge = (createdAt) => {
  const now = new Date();
  const commentDate = createdAt.seconds 
    ? new Date(createdAt.seconds * 1000)
    : new Date(createdAt);
  
  const diffMs = now - commentDate;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return commentDate.toLocaleDateString();
};

/**
 * Get display label for result status
 */
export const getResultStatusLabel = (status) => {
  const labels = {
    [RESULT_STATUS.DRAFT]: 'Draft',
    [RESULT_STATUS.CONFIRMED]: 'Confirmed',
    [RESULT_STATUS.PUBLISHED]: 'Published'
  };
  return labels[status] || status;
};

/**
 * Get display label for placement
 */
export const getPlacementLabel = (placement) => {
  const labels = {
    [PLACEMENT_TYPES.WINNER]: '1st Place',
    [PLACEMENT_TYPES.RUNNER_UP]: '2nd Place',
    [PLACEMENT_TYPES.SEMI_FINALIST]: 'Semi-Finalist',
    [PLACEMENT_TYPES.QUARTER_FINALIST]: 'Quarter-Finalist',
    [PLACEMENT_TYPES.PARTICIPANT]: 'Participant'
  };
  return labels[placement] || placement;
};

/**
 * Calculate win percentage
 */
export const calculateWinPercentage = (wins, losses) => {
  const totalGames = wins + losses;
  if (totalGames === 0) return 0;
  return Math.round((wins / totalGames) * 100);
};

/**
 * Calculate point differential
 */
export const calculatePointDifferential = (pointsFor, pointsAgainst) => {
  return pointsFor - pointsAgainst;
};

/**
 * Check if results are published
 */
export const areResultsPublished = (results) => {
  return results?.status === RESULT_STATUS.PUBLISHED;
};

/**
 * Check if results are confirmed
 */
export const areResultsConfirmed = (results) => {
  return results?.status === RESULT_STATUS.CONFIRMED || results?.status === RESULT_STATUS.PUBLISHED;
};

/**
 * Get results summary
 */
export const getResultsSummary = (results) => {
  if (!results || !results.participantResults) {
    return {
      totalParticipants: 0,
      totalTeams: 0,
      confirmedResults: 0,
      pendingResults: 0
    };
  }
  
  const participantResults = results.participantResults || [];
  const teamResults = results.teamResults || [];
  
  return {
    totalParticipants: participantResults.length,
    totalTeams: teamResults.length,
    confirmedResults: participantResults.filter(r => r.confirmed).length,
    pendingResults: participantResults.filter(r => !r.confirmed).length
  };
};

export default {
  // Constants
  SKILL_LEVELS,
  MEMBER_ROLES,
  TOURNAMENT_STATUS,
  LEAGUE_STATUS,
  PAYMENT_MODES,
  EVENT_TYPES,
  COMMENT_STATUS,
  COMMENT_TYPES,
  RESULT_STATUS,
  RESULT_TYPES,
  PLACEMENT_TYPES,
  
  // Creation functions
  createMember,
  createTournament,
  createLeague,
  createComment,
  createEventResults,
  createParticipantResult,
  createTeamResult,
  
  // Validation functions
  validateMember,
  validateTournament,
  validateLeague,
  validateComment,
  validateEventResults,
  validateParticipantResult,
  
  // Utility functions
  getSkillLevelLabel,
  getRoleLabel,
  getTournamentStatusLabel,
  getLeagueStatusLabel,
  getEventTypeLabel,
  isRegistrationOpen,
  isUpcoming,
  getCommentAge,
  getResultStatusLabel,
  getPlacementLabel,
  calculateWinPercentage,
  calculatePointDifferential,
  areResultsPublished,
  areResultsConfirmed,
  getResultsSummary
};