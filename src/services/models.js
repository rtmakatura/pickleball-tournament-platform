// src/services/models.js (COMPREHENSIVE - Includes All Missing Exports)
// Data models and constants for the pickleball tournament system

/**
 * Event Types - Supported tournament and league formats
 */
export const EVENT_TYPES = {
  SINGLES: 'singles',
  DOUBLES: 'doubles',
  MIXED_DOUBLES: 'mixed_doubles',
  ROUND_ROBIN: 'round_robin',
  BRACKET: 'bracket',
  LADDER: 'ladder'
};

/**
 * Skill Levels - Standard pickleball skill classifications
 */
export const SKILL_LEVELS = {
  BEGINNER: 'beginner',        // 1.0 - 2.5
  INTERMEDIATE: 'intermediate', // 3.0 - 3.5
  ADVANCED: 'advanced',        // 4.0 - 4.5
  EXPERT: 'expert',            // 5.0+
  MIXED: 'mixed'               // Multiple skill levels
};

/**
 * Tournament Status - Lifecycle states for tournaments
 */
export const TOURNAMENT_STATUS = {
  DRAFT: 'draft',
  REGISTRATION_OPEN: 'registration_open',
  REGISTRATION_CLOSED: 'registration_closed',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

/**
 * League Status - Lifecycle states for leagues
 */
export const LEAGUE_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  SUSPENDED: 'suspended'
};

/**
 * Member Roles - Access levels for system users
 */
export const MEMBER_ROLES = {
  PLAYER: 'player',
  ORGANIZER: 'organizer',
  ADMIN: 'admin'
};

/**
 * Payment Modes - How participants handle payments
 */
export const PAYMENT_MODES = {
  INDIVIDUAL: 'individual',  // Each person pays separately
  GROUP: 'group'            // One person pays for everyone
};

/**
 * Payment Status - Individual payment states
 */
export const PAYMENT_STATUS = {
  UNPAID: 'unpaid',
  PARTIAL: 'partial',
  PAID: 'paid',
  OVERPAID: 'overpaid',
  REFUNDED: 'refunded'
};

/**
 * Comment Status - For team message boards
 */
export const COMMENT_STATUS = {
  ACTIVE: 'active',
  DELETED: 'deleted',
  HIDDEN: 'hidden'
};

/**
 * Comment Types
 */
export const COMMENT_TYPES = {
  COMMENT: 'comment',
  REPLY: 'reply'
};

/**
 * Vote Types (if voting is enabled)
 */
export const VOTE_TYPES = {
  UP: 'up',
  DOWN: 'down'
};

/**
 * Award Types - For tournament/league recognition
 */
export const AWARD_TYPES = {
  FIRST_PLACE: 'first_place',
  SECOND_PLACE: 'second_place',
  THIRD_PLACE: 'third_place',
  CHAMPION: 'champion',
  RUNNER_UP: 'runner_up',
  MOST_IMPROVED: 'most_improved',
  SPORTSMANSHIP: 'sportsmanship',
  PARTICIPATION: 'participation',
  CUSTOM: 'custom'
};

/**
 * Result Status - For match/tournament results
 */
export const RESULT_STATUS = {
  DRAFT: 'draft',
  CONFIRMED: 'confirmed',
  DISPUTED: 'disputed',
  FINAL: 'final'
};

/**
 * Match Status - For individual matches
 */
export const MATCH_STATUS = {
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  FORFEIT: 'forfeit'
};

/**
 * Create a new tournament object with default values
 * UPDATED: Added website field
 */
export const createTournament = (data = {}) => {
  return {
    id: data.id || null,
    name: data.name || '',
    description: data.description || '',
    skillLevel: data.skillLevel || SKILL_LEVELS.MIXED,
    eventType: data.eventType || EVENT_TYPES.MIXED_DOUBLES,
    status: data.status || TOURNAMENT_STATUS.DRAFT,
    eventDate: data.eventDate || null,
    registrationDeadline: data.registrationDeadline || null,
    location: data.location || '',
    website: data.website || '', // NEW: Website field
    entryFee: parseFloat(data.entryFee) || 0,
    maxParticipants: parseInt(data.maxParticipants) || 2,
    paymentMode: data.paymentMode || PAYMENT_MODES.INDIVIDUAL,
    participants: data.participants || [],
    paymentData: data.paymentData || {},
    commentsEnabled: data.commentsEnabled !== false,
    commentCount: data.commentCount || 0,
    awards: data.awards || [],
    results: data.results || null,
    createdAt: data.createdAt || new Date(),
    updatedAt: data.updatedAt || new Date(),
    createdBy: data.createdBy || null
  };
};

/**
 * Create a new league object with default values
 * UPDATED: Added website and location fields
 */
export const createLeague = (data = {}) => {
  return {
    id: data.id || null,
    name: data.name || '',
    description: data.description || '',
    skillLevel: data.skillLevel || SKILL_LEVELS.MIXED,
    eventType: data.eventType || EVENT_TYPES.MIXED_DOUBLES,
    status: data.status || LEAGUE_STATUS.DRAFT,
    startDate: data.startDate || null,
    endDate: data.endDate || null,
    location: data.location || '', // NEW: Location field for leagues
    website: data.website || '', // NEW: Website field
    registrationFee: parseFloat(data.registrationFee) || 0,
    maxParticipants: parseInt(data.maxParticipants) || 2,
    paymentMode: data.paymentMode || PAYMENT_MODES.INDIVIDUAL,
    participants: data.participants || [],
    paymentData: data.paymentData || {},
    isActive: data.isActive !== false,
    commentsEnabled: data.commentsEnabled !== false,
    commentCount: data.commentCount || 0,
    awards: data.awards || [],
    standings: data.standings || [],
    schedule: data.schedule || [],
    createdAt: data.createdAt || new Date(),
    updatedAt: data.updatedAt || new Date(),
    createdBy: data.createdBy || null
  };
};

/**
 * Create a new member object with default values
 * UPDATED: Added venmoHandle field for payment integration
 */
export const createMember = (data = {}) => {
  return {
    id: data.id || null,
    authUid: data.authUid || null,
    firstName: data.firstName || '',
    lastName: data.lastName || '',
    email: data.email || '',
    phone: data.phone || '',
    skillLevel: data.skillLevel || SKILL_LEVELS.BEGINNER,
    role: data.role || MEMBER_ROLES.PLAYER,
    venmoHandle: data.venmoHandle || '', // For payment integration
    isActive: data.isActive !== false,
    emergencyContact: data.emergencyContact || {
      name: '',
      phone: '',
      relationship: ''
    },
    medicalInfo: data.medicalInfo || {
      allergies: '',
      medications: '',
      conditions: ''
    },
    preferences: data.preferences || {
      notifications: true,
      publicProfile: true
    },
    awards: data.awards || [],
    statistics: data.statistics || {},
    createdAt: data.createdAt || new Date(),
    updatedAt: data.updatedAt || new Date()
  };
};

/**
 * Create a new comment object with default values
 * Simplified for team message board use
 */
export const createComment = (data = {}) => {
  return {
    id: data.id || null,
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
    createdAt: data.createdAt || new Date(),
    updatedAt: data.updatedAt || new Date()
  };
};

/**
 * Create a payment record
 */
export const createPayment = (data = {}) => {
  return {
    participantId: data.participantId || '',
    amount: parseFloat(data.amount) || 0,
    status: data.status || PAYMENT_STATUS.UNPAID,
    method: data.method || 'cash',
    date: data.date || null,
    notes: data.notes || '',
    recordedBy: data.recordedBy || null,
    createdAt: data.createdAt || new Date(),
    updatedAt: data.updatedAt || new Date()
  };
};

/**
 * Create a results object for tournaments/leagues
 */
export const createResults = (data = {}) => {
  return {
    id: data.id || null,
    eventId: data.eventId || '',
    eventType: data.eventType || 'tournament',
    status: data.status || RESULT_STATUS.DRAFT,
    participantResults: data.participantResults || [],
    standings: data.standings || [],
    matches: data.matches || [],
    statistics: data.statistics || {},
    notes: data.notes || '',
    confirmedBy: data.confirmedBy || null,
    confirmedAt: data.confirmedAt || null,
    createdAt: data.createdAt || new Date(),
    updatedAt: data.updatedAt || new Date()
  };
};

/**
 * Create an award object - THIS WAS MISSING
 */
export const createAward = (data = {}) => {
  return {
    id: data.id || null,
    eventId: data.eventId || '',
    eventType: data.eventType || 'tournament',
    recipientId: data.recipientId || '',
    recipientName: data.recipientName || '',
    awardType: data.awardType || AWARD_TYPES.PARTICIPATION,
    title: data.title || '',
    description: data.description || '',
    placement: data.placement || null, // 1st, 2nd, 3rd, etc.
    category: data.category || '', // e.g., "Men's Doubles", "Mixed Doubles"
    customText: data.customText || '',
    dateAwarded: data.dateAwarded || new Date(),
    presentedBy: data.presentedBy || null,
    createdAt: data.createdAt || new Date(),
    updatedAt: data.updatedAt || new Date()
  };
};

/**
 * Create a match object
 */
export const createMatch = (data = {}) => {
  return {
    id: data.id || null,
    eventId: data.eventId || '',
    eventType: data.eventType || 'tournament',
    round: data.round || 1,
    matchNumber: data.matchNumber || 1,
    court: data.court || null,
    scheduledTime: data.scheduledTime || null,
    status: data.status || MATCH_STATUS.SCHEDULED,
    participants: data.participants || [], // Array of participant IDs
    scores: data.scores || [],
    winner: data.winner || null,
    duration: data.duration || null, // in minutes
    notes: data.notes || '',
    officialId: data.officialId || null,
    createdAt: data.createdAt || new Date(),
    updatedAt: data.updatedAt || new Date()
  };
};

/**
 * Create a participant result object
 */
export const createParticipantResult = (data = {}) => {
  return {
    participantId: data.participantId || '',
    participantName: data.participantName || '',
    placement: data.placement || null,
    points: data.points || 0,
    wins: data.wins || 0,
    losses: data.losses || 0,
    matchesPlayed: data.matchesPlayed || 0,
    setsWon: data.setsWon || 0,
    setsLost: data.setsLost || 0,
    gamesWon: data.gamesWon || 0,
    gamesLost: data.gamesLost || 0,
    confirmed: data.confirmed || false,
    confirmedAt: data.confirmedAt || null,
    awards: data.awards || []
  };
};

/**
 * Create a standing entry for leagues
 */
export const createStanding = (data = {}) => {
  return {
    participantId: data.participantId || '',
    participantName: data.participantName || '',
    rank: data.rank || 1,
    points: data.points || 0,
    wins: data.wins || 0,
    losses: data.losses || 0,
    ties: data.ties || 0,
    matchesPlayed: data.matchesPlayed || 0,
    winPercentage: data.winPercentage || 0,
    lastUpdated: data.lastUpdated || new Date()
  };
};

/**
 * Validation helpers
 */
export const validateTournament = (tournament) => {
  const errors = [];
  
  if (!tournament.name?.trim()) {
    errors.push('Tournament name is required');
  }
  
  if (!tournament.location?.trim()) {
    errors.push('Location is required');
  }
  
  if (!tournament.eventDate) {
    errors.push('Event date is required');
  }
  
  if (!Object.values(SKILL_LEVELS).includes(tournament.skillLevel)) {
    errors.push('Valid skill level is required');
  }
  
  if (!Object.values(EVENT_TYPES).includes(tournament.eventType)) {
    errors.push('Valid event type is required');
  }
  
  if (tournament.entryFee < 0) {
    errors.push('Entry fee cannot be negative');
  }
  
  if (tournament.maxParticipants < 1) {
    errors.push('Must allow at least 1 participant');
  }
  
  // Validate website URL if provided
  if (tournament.website) {
    try {
      const url = tournament.website.startsWith('http') 
        ? tournament.website 
        : `https://${tournament.website}`;
      new URL(url);
    } catch {
      errors.push('Invalid website URL format');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateLeague = (league) => {
  const errors = [];
  
  if (!league.name?.trim()) {
    errors.push('League name is required');
  }
  
  if (!league.startDate) {
    errors.push('Start date is required');
  }
  
  if (!league.endDate) {
    errors.push('End date is required');
  }
  
  if (league.startDate && league.endDate && new Date(league.endDate) <= new Date(league.startDate)) {
    errors.push('End date must be after start date');
  }
  
  if (!Object.values(SKILL_LEVELS).includes(league.skillLevel)) {
    errors.push('Valid skill level is required');
  }
  
  if (!Object.values(EVENT_TYPES).includes(league.eventType)) {
    errors.push('Valid event type is required');
  }
  
  if (league.registrationFee < 0) {
    errors.push('Registration fee cannot be negative');
  }
  
  if (league.maxParticipants < 1) {
    errors.push('Must allow at least 1 participant');
  }
  
  // Validate website URL if provided
  if (league.website) {
    try {
      const url = league.website.startsWith('http') 
        ? league.website 
        : `https://${league.website}`;
      new URL(url);
    } catch {
      errors.push('Invalid website URL format');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateMember = (member) => {
  const errors = [];
  
  if (!member.firstName?.trim()) {
    errors.push('First name is required');
  }
  
  if (!member.lastName?.trim()) {
    errors.push('Last name is required');
  }
  
  if (!member.email?.trim()) {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(member.email)) {
    errors.push('Valid email address is required');
  }
  
  if (!Object.values(SKILL_LEVELS).includes(member.skillLevel)) {
    errors.push('Valid skill level is required');
  }
  
  if (!Object.values(MEMBER_ROLES).includes(member.role)) {
    errors.push('Valid role is required');
  }
  
  // Validate Venmo handle if provided
  if (member.venmoHandle && !/^[a-zA-Z0-9_-]{1,30}$/.test(member.venmoHandle)) {
    errors.push('Venmo handle must contain only letters, numbers, underscores, and dashes');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateAward = (award) => {
  const errors = [];
  
  if (!award.recipientId?.trim()) {
    errors.push('Recipient is required');
  }
  
  if (!award.recipientName?.trim()) {
    errors.push('Recipient name is required');
  }
  
  if (!Object.values(AWARD_TYPES).includes(award.awardType)) {
    errors.push('Valid award type is required');
  }
  
  if (!award.title?.trim()) {
    errors.push('Award title is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Helper functions for data transformation
 */
export const formatEventDate = (date) => {
  if (!date) return 'TBD';
  
  const dateObj = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
  return dateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount || 0);
};

export const formatSkillLevel = (level) => {
  if (!level) return '';
  return level.charAt(0).toUpperCase() + level.slice(1).replace('_', ' ');
};

export const formatEventType = (type) => {
  if (!type) return '';
  return type.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

export const formatAwardType = (type) => {
  if (!type) return '';
  return type.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

export const formatPlacement = (placement) => {
  if (!placement) return '';
  
  const num = parseInt(placement);
  if (isNaN(num)) return placement;
  
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = num % 100;
  return num + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
};

/**
 * Utility functions for awards
 */
export const getPlacementAwardType = (placement) => {
  switch (parseInt(placement)) {
    case 1:
      return AWARD_TYPES.FIRST_PLACE;
    case 2:
      return AWARD_TYPES.SECOND_PLACE;
    case 3:
      return AWARD_TYPES.THIRD_PLACE;
    default:
      return AWARD_TYPES.PARTICIPATION;
  }
};

export const generateAwardTitle = (awardType, category = '', customText = '') => {
  if (awardType === AWARD_TYPES.CUSTOM && customText) {
    return customText;
  }
  
  const base = formatAwardType(awardType);
  return category ? `${base} - ${category}` : base;
};

/**
 * Default exports for easy importing
 */
export default {
  EVENT_TYPES,
  SKILL_LEVELS,
  TOURNAMENT_STATUS,
  LEAGUE_STATUS,
  MEMBER_ROLES,
  PAYMENT_MODES,
  PAYMENT_STATUS,
  COMMENT_STATUS,
  COMMENT_TYPES,
  VOTE_TYPES,
  AWARD_TYPES,
  RESULT_STATUS,
  MATCH_STATUS,
  createTournament,
  createLeague,
  createMember,
  createComment,
  createPayment,
  createResults,
  createAward,
  createMatch,
  createParticipantResult,
  createStanding,
  validateTournament,
  validateLeague,
  validateMember,
  validateAward,
  formatEventDate,
  formatCurrency,
  formatSkillLevel,
  formatEventType,
  formatAwardType,
  formatPlacement,
  getPlacementAwardType,
  generateAwardTitle
};