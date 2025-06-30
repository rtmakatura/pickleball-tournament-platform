// src/services/models.js (UPDATED - Division Support)
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

// Comment types
export const COMMENT_TYPES = {
  COMMENT: 'comment',
  REPLY: 'reply'
};

// Comment statuses
export const COMMENT_STATUS = {
  ACTIVE: 'active',
  EDITED: 'edited',
  DELETED: 'deleted',
  HIDDEN: 'hidden'
};

// NEW: Division status
export const DIVISION_STATUS = {
  OPEN: 'open',
  CLOSED: 'closed',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed'
};

// NEW: Create a tournament division
export const createTournamentDivision = (divisionData) => {
  return {
    id: divisionData.id || `div_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: divisionData.name || '',
    description: divisionData.description || '',
    eventType: divisionData.eventType || EVENT_TYPES.MIXED_DOUBLES,
    skillLevel: divisionData.skillLevel || '',
    status: divisionData.status || DIVISION_STATUS.OPEN,
    entryFee: divisionData.entryFee || 0,
    maxParticipants: divisionData.maxParticipants || null,
    paymentMode: divisionData.paymentMode || PAYMENT_MODES.INDIVIDUAL,
    participants: divisionData.participants || [],
    paymentData: divisionData.paymentData || {},
    commentsEnabled: divisionData.commentsEnabled !== false,
    commentCount: 0,
    order: divisionData.order || 0 // For sorting divisions
  };
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

// UPDATED: Create a new tournament with divisions support
export const createTournament = (tournamentData) => {
  const now = new Date();
  
  // Create initial division if legacy data provided
  let divisions = [];
  if (tournamentData.divisions && Array.isArray(tournamentData.divisions)) {
    divisions = tournamentData.divisions.map(div => createTournamentDivision(div));
  } else if (tournamentData.skillLevel || tournamentData.eventType || tournamentData.entryFee) {
    // Legacy support: create single division from tournament-level data
    divisions = [createTournamentDivision({
      name: `${tournamentData.eventType || 'Mixed Doubles'} - ${tournamentData.skillLevel || 'Open'}`,
      eventType: tournamentData.eventType || EVENT_TYPES.MIXED_DOUBLES,
      skillLevel: tournamentData.skillLevel || '',
      entryFee: tournamentData.entryFee || 0,
      maxParticipants: tournamentData.maxParticipants || null,
      paymentMode: tournamentData.paymentMode || PAYMENT_MODES.INDIVIDUAL,
      participants: tournamentData.participants || [],
      paymentData: tournamentData.paymentData || {}
    })];
  }
  
  return {
    name: tournamentData.name || '',
    description: tournamentData.description || '',
    status: tournamentData.status || TOURNAMENT_STATUS.DRAFT,
    eventDate: tournamentData.eventDate || null,
    registrationDeadline: tournamentData.registrationDeadline || null,
    location: tournamentData.location || '',
    website: tournamentData.website || '',
    divisions: divisions,
    commentsEnabled: tournamentData.commentsEnabled !== false,
    commentCount: 0,
    createdAt: now,
    updatedAt: now
  };
};

// Create a new league (unchanged)
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
    commentCount: 0,
    commentsEnabled: leagueData.commentsEnabled !== false,
    createdAt: now,
    updatedAt: now
  };
};

// Create a new comment
export const createComment = (commentData) => {
  const now = new Date();
  
  return {
    eventId: commentData.eventId || '',
    eventType: commentData.eventType || 'tournament',
    divisionId: commentData.divisionId || null, // NEW: Division-specific comments
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

// NEW: Tournament helper functions
export const getTournamentTotalParticipants = (tournament) => {
  if (!tournament.divisions) return 0;
  return tournament.divisions.reduce((total, division) => {
    return total + (division.participants?.length || 0);
  }, 0);
};

export const getTournamentTotalExpected = (tournament) => {
  if (!tournament.divisions) return 0;
  return tournament.divisions.reduce((total, division) => {
    const participants = division.participants?.length || 0;
    const fee = division.entryFee || 0;
    return total + (participants * fee);
  }, 0);
};

export const getTournamentDivisionById = (tournament, divisionId) => {
  return tournament.divisions?.find(div => div.id === divisionId) || null;
};

export const getUserDivisionsInTournament = (tournament, userId) => {
  if (!tournament.divisions) return [];
  return tournament.divisions.filter(division => 
    division.participants?.includes(userId)
  );
};

export const addParticipantToDivision = (tournament, divisionId, participantId) => {
  const division = getTournamentDivisionById(tournament, divisionId);
  if (!division) return tournament;
  
  if (!division.participants.includes(participantId)) {
    division.participants.push(participantId);
  }
  
  return { ...tournament };
};

export const removeParticipantFromDivision = (tournament, divisionId, participantId) => {
  const division = getTournamentDivisionById(tournament, divisionId);
  if (!division) return tournament;
  
  division.participants = division.participants.filter(id => id !== participantId);
  
  // Clean up payment data
  if (division.paymentData && division.paymentData[participantId]) {
    delete division.paymentData[participantId];
  }
  
  return { ...tournament };
};

// NEW: Division validation
export const validateDivision = (divisionData) => {
  const errors = [];
  
  if (!divisionData.name?.trim()) {
    errors.push('Division name is required');
  }
  
  if (!divisionData.eventType) {
    errors.push('Event type is required');
  } else if (!validateEventType(divisionData.eventType)) {
    errors.push('Invalid event type');
  }
  
  if (!divisionData.skillLevel) {
    errors.push('Skill level is required');
  } else if (!validateSkillLevel(divisionData.skillLevel)) {
    errors.push('Invalid skill level');
  }
  
  if (divisionData.entryFee < 0) {
    errors.push('Entry fee cannot be negative');
  }
  
  if (divisionData.maxParticipants && divisionData.maxParticipants < 1) {
    errors.push('Max participants must be at least 1');
  }
  
  if (divisionData.paymentMode && !validatePaymentMode(divisionData.paymentMode)) {
    errors.push('Invalid payment mode');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validation helpers (unchanged)
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateVenmoHandle = (handle) => {
  if (!handle) return true;
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

export const validatePaymentStatus = (status) => {
  return Object.values(PAYMENT_STATUS).includes(status);
};

export const validateParticipantStatus = (status) => {
  return Object.values(PARTICIPANT_STATUS).includes(status);
};

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

export const validateDivisionStatus = (status) => {
  return Object.values(DIVISION_STATUS).includes(status);
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

// UPDATED: Tournament validation with divisions
export const validateTournament = (tournamentData) => {
  const errors = [];
  
  if (!tournamentData.name?.trim()) {
    errors.push('Tournament name is required');
  }
  
  if (!tournamentData.location?.trim()) {
    errors.push('Location is required');
  }
  
  if (tournamentData.status && !validateTournamentStatus(tournamentData.status)) {
    errors.push('Invalid tournament status');
  }
  
  // Validate divisions
  if (!tournamentData.divisions || !Array.isArray(tournamentData.divisions)) {
    errors.push('Tournament must have at least one division');
  } else {
    if (tournamentData.divisions.length === 0) {
      errors.push('Tournament must have at least one division');
    } else {
      tournamentData.divisions.forEach((division, index) => {
        const divisionValidation = validateDivision(division);
        if (!divisionValidation.isValid) {
          errors.push(`Division ${index + 1}: ${divisionValidation.errors.join(', ')}`);
        }
      });
    }
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

// Default export object
export default {
  // Constants
  MEMBER_ROLES,
  SKILL_LEVELS,
  TOURNAMENT_STATUS,
  LEAGUE_STATUS,
  PAYMENT_MODES,
  EVENT_TYPES,
  PAYMENT_STATUS,
  PARTICIPANT_STATUS,
  COMMENT_TYPES,
  COMMENT_STATUS,
  DIVISION_STATUS,
  
  // Creators
  createMember,
  createTournament,
  createTournamentDivision,
  createLeague,
  createComment,

  // Tournament helpers
  getTournamentTotalParticipants,
  getTournamentTotalExpected,
  getTournamentDivisionById,
  getUserDivisionsInTournament,
  addParticipantToDivision,
  removeParticipantFromDivision,
  
  // Validators
  validateEmail,
  validateVenmoHandle,
  validateSkillLevel,
  validateRole,
  validateTournamentStatus,
  validateLeagueStatus,
  validatePaymentMode,
  validateEventType,
  validatePaymentStatus,
  validateParticipantStatus,
  validateCommentStatus,
  validateCommentType,
  validateCommentContent,
  validateDivisionStatus,
  validateMember,
  validateTournament,
  validateDivision,
  validateLeague,
  validateComment,
};