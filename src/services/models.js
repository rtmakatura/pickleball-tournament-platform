// src/services/models.js (UPDATED - Enhanced Member Model)
// Enhanced data models for PickleTrack entities with auth integration

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
  INDIVIDUAL: 'individual', // Each person pays separately
  GROUP: 'group'            // One person pays, others reimburse
};

// NEW: Event type options
export const EVENT_TYPES = {
  SINGLES: 'singles',
  MENS_DOUBLES: 'mens_doubles',
  WOMENS_DOUBLES: 'womens_doubles',
  MIXED_DOUBLES: 'mixed_doubles',
  TEAM: 'team'
};

// Enhanced Member model with venmo handle
export const createMember = (data = {}) => ({
  // Authentication integration
  authUid: data.authUid || null, // Firebase Auth UID
  
  // Personal information
  email: data.email || '',
  firstName: data.firstName || '',
  lastName: data.lastName || '',
  displayName: data.displayName || `${data.firstName || ''} ${data.lastName || ''}`.trim(),
  phoneNumber: data.phoneNumber || '',
  
  // Payment information
  venmoHandle: data.venmoHandle || '', // NEW: Venmo handle for payments
  
  // Pickleball information
  skillLevel: data.skillLevel || SKILL_LEVELS.BEGINNER,
  
  // Role and permissions
  role: data.role || MEMBER_ROLES.PLAYER,
  
  // Status
  isActive: data.isActive !== false,
  
  // Metadata
  profileComplete: data.profileComplete !== false,
  lastLoginAt: data.lastLoginAt || null,
  
  // Legacy support - for members created before auth integration
  isLegacyMember: data.authUid ? false : true
});

// Enhanced League model with event type
export const createLeague = (data = {}) => ({
  name: data.name || '',
  description: data.description || '',
  skillLevel: data.skillLevel || SKILL_LEVELS.INTERMEDIATE,
  status: data.status || LEAGUE_STATUS.ACTIVE,
  startDate: data.startDate || null,
  endDate: data.endDate || null,
  maxParticipants: data.maxParticipants || 2, // UPDATED: Default to 2
  
  // NEW: Event type
  eventType: data.eventType || EVENT_TYPES.MIXED_DOUBLES,
  
  // Participants are now member IDs that correspond to authenticated users
  participants: data.participants || [],
  
  // Payment information
  registrationFee: data.registrationFee || 0,
  paymentMode: data.paymentMode || PAYMENT_MODES.INDIVIDUAL,
  paymentData: data.paymentData || {}, // Maps member ID to payment info
  
  // Settings
  isActive: data.isActive !== false,
  
  // Organizer information
  createdBy: data.createdBy || null, // Auth UID of creator
  organizers: data.organizers || [], // Array of auth UIDs
  
  // League-specific settings
  allowSelfRegistration: data.allowSelfRegistration !== false,
  requireApproval: data.requireApproval || false,
  
  // Schedule information
  playDays: data.playDays || [], // ['monday', 'wednesday', 'friday']
  playTimes: data.playTimes || [], // ['18:00', '19:00']
  venue: data.venue || '',
  
  // League format
  format: data.format || 'round_robin', // 'round_robin', 'ladder', 'tournament'
  numberOfWeeks: data.numberOfWeeks || 8
});

// Enhanced Tournament model with event type
export const createTournament = (data = {}) => ({
  name: data.name || '',
  description: data.description || '',
  skillLevel: data.skillLevel || SKILL_LEVELS.INTERMEDIATE,
  status: data.status || TOURNAMENT_STATUS.DRAFT,
  eventDate: data.eventDate || null,
  registrationDeadline: data.registrationDeadline || null,
  maxParticipants: data.maxParticipants || 2, // UPDATED: Default to 2
  
  // NEW: Event type
  eventType: data.eventType || EVENT_TYPES.MIXED_DOUBLES,
  
  // Participants are now member IDs that correspond to authenticated users
  participants: data.participants || [],
  
  // Payment information
  entryFee: data.entryFee || 0,
  paymentMode: data.paymentMode || PAYMENT_MODES.INDIVIDUAL,
  paymentData: data.paymentData || {}, // Maps member ID to payment info
  
  // Location and logistics
  location: data.location || '',
  venue: data.venue || '',
  address: data.address || '',
  
  // Tournament settings
  isActive: data.isActive !== false,
  
  // Organizer information
  createdBy: data.createdBy || null, // Auth UID of creator
  organizers: data.organizers || [], // Array of auth UIDs
  
  // Registration settings
  allowSelfRegistration: data.allowSelfRegistration !== false,
  requireApproval: data.requireApproval || false,
  
  // Tournament format
  format: data.format || 'single_elimination', // 'single_elimination', 'double_elimination', 'round_robin'
  numberOfCourts: data.numberOfCourts || 4,
  matchDuration: data.matchDuration || 60, // minutes
  
  // Prize information
  prizes: data.prizes || [], // Array of prize objects
  hasPrizes: data.hasPrizes || false,
  
  // Equipment and rules
  ballType: data.ballType || '', // 'indoor', 'outdoor'
  specialRules: data.specialRules || '',
  equipmentProvided: data.equipmentProvided || false
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
  category: data.category || 'general', // 'user', 'tournament', 'league', 'payment', 'admin'
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
      'view_member_list'
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
      'send_notifications'
    ],
    [MEMBER_ROLES.ADMIN]: [
      'all_permissions' // Admins have all permissions
    ]
  };
  
  return permissions[role] || [];
};

// Enhanced validation helpers
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
  
  // Validate venmo handle format if provided (optional)
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

// Default admin user (for initial setup)
export const createDefaultAdmin = (authUid, email) => ({
  authUid,
  email,
  firstName: 'System',
  lastName: 'Administrator',
  displayName: 'System Administrator',
  phoneNumber: '',
  venmoHandle: '', // NEW: Include venmo handle
  skillLevel: SKILL_LEVELS.ADVANCED,
  role: MEMBER_ROLES.ADMIN,
  isActive: true,
  profileComplete: true,
  isLegacyMember: false
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
  SKILL_LEVELS,
  MEMBER_ROLES,
  TOURNAMENT_STATUS,
  LEAGUE_STATUS,
  PAYMENT_MODES,
  EVENT_TYPES // NEW: Export event types
};