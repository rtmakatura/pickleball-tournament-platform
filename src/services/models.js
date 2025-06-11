// src/services/models.js (SIMPLIFIED - Comments Without Voting)
// Data models and validation schemas for the pickleball app

// Member roles
export const MEMBER_ROLES = {
  PLAYER: 'player',
  ORGANIZER: 'organizer',
  ADMIN: 'admin'
};

// Skill levels
export const SKILL_LEVELS = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
  EXPERT: 'expert'
};

// Tournament statuses
export const TOURNAMENT_STATUS = {
  DRAFT: 'draft',
  REGISTRATION_OPEN: 'registration_open',
  REGISTRATION_CLOSED: 'registration_closed',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// League statuses
export const LEAGUE_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  PAUSED: 'paused'
};

// Payment modes
export const PAYMENT_MODES = {
  INDIVIDUAL: 'individual',
  GROUP: 'group'
};

// Event types
export const EVENT_TYPES = {
  SINGLES: 'singles',
  DOUBLES: 'doubles',
  MIXED_DOUBLES: 'mixed_doubles'
};

// Result statuses
export const RESULT_STATUS = {
  DRAFT: 'draft',
  CONFIRMED: 'confirmed'
};

// Result types (for different scoring systems)
export const RESULT_TYPES = {
  PLACEMENT: 'placement',
  WIN_LOSS: 'win_loss',
  POINTS: 'points'
};

// Payment statuses (for tracking payments)
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  OVERDUE: 'overdue',
  REFUNDED: 'refunded'
};

// Participant statuses (for event participation)
export const PARTICIPANT_STATUS = {
  REGISTERED: 'registered',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show'
};

// Award types
export const AWARD_TYPES = {
  PLACEMENT: 'placement',
  SPECIAL: 'special',
  PARTICIPATION: 'participation',
  ACHIEVEMENT: 'achievement'
};

// Award categories
export const AWARD_CATEGORIES = {
  FIRST_PLACE: 'first_place',
  SECOND_PLACE: 'second_place',
  THIRD_PLACE: 'third_place',
  MVP: 'mvp',
  MOST_IMPROVED: 'most_improved',
  SPORTSMANSHIP: 'sportsmanship',
  ROOKIE: 'rookie',
  VETERAN: 'veteran'
};

// SIMPLIFIED: Comment types (no voting)
export const COMMENT_TYPES = {
  COMMENT: 'comment',
  REPLY: 'reply'
};

// SIMPLIFIED: Comment statuses (no voting-related statuses)
export const COMMENT_STATUS = {
  ACTIVE: 'active',
  EDITED: 'edited',
  DELETED: 'deleted',
  HIDDEN: 'hidden'
};

// Create a new member
export const createMember = (memberData) => {
  const now = new Date();
  
  return {
    firstName: memberData.firstName || '',
    lastName: memberData.lastName || '',
    email: memberData.email || '',
    skillLevel: memberData.skillLevel || SKILL_LEVELS.BEGINNER,
    role: memberData.role || MEMBER_ROLES.PLAYER,
    venmoHandle: memberData.venmoHandle || '',
    isActive: memberData.isActive !== false,
    authUid: memberData.authUid || null,
    createdAt: now,
    updatedAt: now
  };
};

// Create a new tournament
export const createTournament = (tournamentData) => {
  const now = new Date();
  
  return {
    name: tournamentData.name || '',
    description: tournamentData.description || '',
    skillLevel: tournamentData.skillLevel || '',
    eventType: tournamentData.eventType || EVENT_TYPES.MIXED_DOUBLES,
    status: tournamentData.status || TOURNAMENT_STATUS.DRAFT,
    eventDate: tournamentData.eventDate || null,
    registrationDeadline: tournamentData.registrationDeadline || null,
    location: tournamentData.location || '',
    entryFee: tournamentData.entryFee || 0,
    maxParticipants: tournamentData.maxParticipants || null,
    paymentMode: tournamentData.paymentMode || PAYMENT_MODES.INDIVIDUAL,
    participants: [],
    paymentData: {},
    commentCount: 0, // Track number of comments
    commentsEnabled: tournamentData.commentsEnabled !== false,
    createdAt: now,
    updatedAt: now
  };
};

// Create a new league
export const createLeague = (leagueData) => {
  const now = new Date();
  
  return {
    name: leagueData.name || '',
    description: leagueData.description || '',
    skillLevel: leagueData.skillLevel || '',
    eventType: leagueData.eventType || EVENT_TYPES.MIXED_DOUBLES,
    status: leagueData.status || LEAGUE_STATUS.ACTIVE,
    startDate: leagueData.startDate || null,
    endDate: leagueData.endDate || null,
    registrationFee: leagueData.registrationFee || 0,
    maxParticipants: leagueData.maxParticipants || null,
    paymentMode: leagueData.paymentMode || PAYMENT_MODES.INDIVIDUAL,
    participants: [],
    paymentData: {},
    isActive: leagueData.isActive !== false,
    commentCount: 0, // Track number of comments
    commentsEnabled: leagueData.commentsEnabled !== false,
    createdAt: now,
    updatedAt: now
  };
};

// SIMPLIFIED: Create a new comment (no voting fields)
export const createComment = (commentData) => {
  const now = new Date();
  
  return {
    eventId: commentData.eventId || '',
    eventType: commentData.eventType || 'tournament',
    authorId: commentData.authorId || '',
    authorName: commentData.authorName || '',
    content: commentData.content || '',
    parentId: commentData.parentId || null,
    type: commentData.type || COMMENT_TYPES.COMMENT,
    status: commentData.status || COMMENT_STATUS.ACTIVE,
    depth: commentData.depth || 0,
    replyCount: 0,
    isEdited: false,
    editedAt: null,
    createdAt: now,
    updatedAt: now
  };
};

// Create results entry
export const createResults = (resultsData) => {
  const now = new Date();
  
  return {
    eventId: resultsData.eventId || '',
    eventType: resultsData.eventType || 'tournament',
    status: resultsData.status || RESULT_STATUS.DRAFT,
    participantResults: resultsData.participantResults || [],
    notes: resultsData.notes || '',
    recordedBy: resultsData.recordedBy || null,
    confirmedBy: resultsData.confirmedBy || null,
    createdAt: now,
    updatedAt: now
  };
};

// Alias for createResults (for compatibility)
export const createEventResults = createResults;

// Create a new award
export const createAward = (awardData) => {
  const now = new Date();
  
  return {
    eventId: awardData.eventId || '',
    eventType: awardData.eventType || 'tournament',
    recipientId: awardData.recipientId || '',
    recipientName: awardData.recipientName || '',
    awardType: awardData.awardType || AWARD_TYPES.PLACEMENT,
    category: awardData.category || '',
    title: awardData.title || '',
    description: awardData.description || '',
    placement: awardData.placement || null,
    points: awardData.points || null,
    isVisible: awardData.isVisible !== false,
    awardedBy: awardData.awardedBy || null,
    awardedAt: awardData.awardedAt || now,
    createdAt: now,
    updatedAt: now
  };
};

// Create participant result
export const createParticipantResult = (resultData) => {
  return {
    participantId: resultData.participantId || '',
    participantName: resultData.participantName || '',
    placement: resultData.placement || null,
    wins: resultData.wins || 0,
    losses: resultData.losses || 0,
    pointsFor: resultData.pointsFor || 0,
    pointsAgainst: resultData.pointsAgainst || 0,
    confirmed: false,
    notes: resultData.notes || ''
  };
};

// Validation helpers
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateVenmoHandle = (handle) => {
  if (!handle) return true; // Optional field
  // Venmo handles: alphanumeric, hyphens, underscores, 5-30 chars
  const venmoRegex = /^[a-zA-Z0-9_-]{5,30}$/;
  return venmoRegex.test(handle);
};

export const validateSkillLevel = (level) => {
  return Object.values(SKILL_LEVELS).includes(level);
};

export const validateRole = (role) => {
  return Object.values(MEMBER_ROLES).includes(role);
};

export const validateTournamentStatus = (status) => {
  return Object.values(TOURNAMENT_STATUS).includes(status);
};

export const validateLeagueStatus = (status) => {
  return Object.values(LEAGUE_STATUS).includes(status);
};

export const validatePaymentMode = (mode) => {
  return Object.values(PAYMENT_MODES).includes(mode);
};

export const validateEventType = (type) => {
  return Object.values(EVENT_TYPES).includes(type);
};

export const validateResultStatus = (status) => {
  return Object.values(RESULT_STATUS).includes(status);
};

export const validateResultType = (type) => {
  return Object.values(RESULT_TYPES).includes(type);
};

export const validatePaymentStatus = (status) => {
  return Object.values(PAYMENT_STATUS).includes(status);
};

export const validateParticipantStatus = (status) => {
  return Object.values(PARTICIPANT_STATUS).includes(status);
};

export const validateAwardType = (type) => {
  return Object.values(AWARD_TYPES).includes(type);
};

export const validateAwardCategory = (category) => {
  return Object.values(AWARD_CATEGORIES).includes(category);
};

// SIMPLIFIED: Comment validation (no voting fields)
export const validateCommentStatus = (status) => {
  return Object.values(COMMENT_STATUS).includes(status);
};

export const validateCommentType = (type) => {
  return Object.values(COMMENT_TYPES).includes(type);
};

export const validateCommentContent = (content, maxLength = 2000) => {
  if (!content || typeof content !== 'string') return false;
  const trimmed = content.trim();
  return trimmed.length > 0 && trimmed.length <= maxLength;
};

// Model validation functions
export const validateMember = (memberData) => {
  const errors = [];
  
  if (!memberData.firstName?.trim()) {
    errors.push('First name is required');
  }
  
  if (!memberData.lastName?.trim()) {
    errors.push('Last name is required');
  }
  
  if (!memberData.email?.trim()) {
    errors.push('Email is required');
  } else if (!validateEmail(memberData.email)) {
    errors.push('Invalid email format');
  }
  
  if (memberData.skillLevel && !validateSkillLevel(memberData.skillLevel)) {
    errors.push('Invalid skill level');
  }
  
  if (memberData.role && !validateRole(memberData.role)) {
    errors.push('Invalid role');
  }
  
  if (memberData.venmoHandle && !validateVenmoHandle(memberData.venmoHandle)) {
    errors.push('Invalid Venmo handle format');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateTournament = (tournamentData) => {
  const errors = [];
  
  if (!tournamentData.name?.trim()) {
    errors.push('Tournament name is required');
  }
  
  if (!tournamentData.skillLevel) {
    errors.push('Skill level is required');
  } else if (!validateSkillLevel(tournamentData.skillLevel)) {
    errors.push('Invalid skill level');
  }
  
  if (!tournamentData.eventType) {
    errors.push('Event type is required');
  } else if (!validateEventType(tournamentData.eventType)) {
    errors.push('Invalid event type');
  }
  
  if (!tournamentData.location?.trim()) {
    errors.push('Location is required');
  }
  
  if (tournamentData.entryFee < 0) {
    errors.push('Entry fee cannot be negative');
  }
  
  if (tournamentData.maxParticipants && tournamentData.maxParticipants < 1) {
    errors.push('Max participants must be at least 1');
  }
  
  if (tournamentData.status && !validateTournamentStatus(tournamentData.status)) {
    errors.push('Invalid tournament status');
  }
  
  if (tournamentData.paymentMode && !validatePaymentMode(tournamentData.paymentMode)) {
    errors.push('Invalid payment mode');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateLeague = (leagueData) => {
  const errors = [];
  
  if (!leagueData.name?.trim()) {
    errors.push('League name is required');
  }
  
  if (!leagueData.skillLevel) {
    errors.push('Skill level is required');
  } else if (!validateSkillLevel(leagueData.skillLevel)) {
    errors.push('Invalid skill level');
  }
  
  if (!leagueData.eventType) {
    errors.push('Event type is required');
  } else if (!validateEventType(leagueData.eventType)) {
    errors.push('Invalid event type');
  }
  
  if (leagueData.registrationFee < 0) {
    errors.push('Registration fee cannot be negative');
  }
  
  if (leagueData.maxParticipants && leagueData.maxParticipants < 1) {
    errors.push('Max participants must be at least 1');
  }
  
  if (leagueData.status && !validateLeagueStatus(leagueData.status)) {
    errors.push('Invalid league status');
  }
  
  if (leagueData.paymentMode && !validatePaymentMode(leagueData.paymentMode)) {
    errors.push('Invalid payment mode');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// SIMPLIFIED: Comment validation (no voting)
export const validateComment = (commentData) => {
  const errors = [];
  
  if (!commentData.eventId?.trim()) {
    errors.push('Event ID is required');
  }
  
  if (!commentData.authorId?.trim()) {
    errors.push('Author ID is required');
  }
  
  if (!commentData.authorName?.trim()) {
    errors.push('Author name is required');
  }
  
  if (!validateCommentContent(commentData.content)) {
    errors.push('Comment content is required and must be 2000 characters or less');
  }
  
  if (commentData.type && !validateCommentType(commentData.type)) {
    errors.push('Invalid comment type');
  }
  
  if (commentData.status && !validateCommentStatus(commentData.status)) {
    errors.push('Invalid comment status');
  }
  
  if (commentData.depth && (commentData.depth < 0 || commentData.depth > 10)) {
    errors.push('Comment depth must be between 0 and 10');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Results validation
export const validateResults = (resultsData) => {
  const errors = [];
  
  if (!resultsData.eventId?.trim()) {
    errors.push('Event ID is required');
  }
  
  if (!resultsData.eventType?.trim()) {
    errors.push('Event type is required');
  }
  
  if (resultsData.status && !validateResultStatus(resultsData.status)) {
    errors.push('Invalid result status');
  }
  
  if (!Array.isArray(resultsData.participantResults)) {
    errors.push('Participant results must be an array');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Award validation
export const validateAward = (awardData) => {
  const errors = [];
  
  if (!awardData.eventId?.trim()) {
    errors.push('Event ID is required');
  }
  
  if (!awardData.recipientId?.trim()) {
    errors.push('Recipient ID is required');
  }
  
  if (!awardData.recipientName?.trim()) {
    errors.push('Recipient name is required');
  }
  
  if (!awardData.title?.trim()) {
    errors.push('Award title is required');
  }
  
  if (awardData.awardType && !validateAwardType(awardData.awardType)) {
    errors.push('Invalid award type');
  }
  
  if (awardData.category && !validateAwardCategory(awardData.category)) {
    errors.push('Invalid award category');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Default export object
export default {
  // Constants
  MEMBER_ROLES,
  SKILL_LEVELS,
  TOURNAMENT_STATUS,
  LEAGUE_STATUS,
  PAYMENT_MODES,
  EVENT_TYPES,
  RESULT_STATUS,
  RESULT_TYPES,
  PAYMENT_STATUS,
  PARTICIPANT_STATUS,
  AWARD_TYPES,
  AWARD_CATEGORIES,
  COMMENT_TYPES,
  COMMENT_STATUS,
  
  // Creators
  createMember,
  createTournament,
  createLeague,
  createComment,
  createResults,
  createEventResults,
  createParticipantResult,
  createAward,
  
  // Validators
  validateEmail,
  validateVenmoHandle,
  validateSkillLevel,
  validateRole,
  validateTournamentStatus,
  validateLeagueStatus,
  validatePaymentMode,
  validateEventType,
  validateResultStatus,
  validateResultType,
  validatePaymentStatus,
  validateParticipantStatus,
  validateAwardType,
  validateAwardCategory,
  validateCommentStatus,
  validateCommentType,
  validateCommentContent,
  validateMember,
  validateTournament,
  validateLeague,
  validateComment,
  validateResults,
  validateAward
};