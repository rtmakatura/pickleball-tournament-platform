// src/services/models.js (UPDATED - Results & Performance Tracking Support)
// Data models and validation schemas for the pickleball app

// Member roles - Two-tier system: Players and Admins
export const MEMBER_ROLES = {
  PLAYER: 'player',
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
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  ARCHIVED: 'archived'
};

// League statuses
export const LEAGUE_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  ARCHIVED: 'archived'
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
  MIXED_DOUBLES: 'mixed_doubles',
  TEAM: 'team'
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

// Division status
export const DIVISION_STATUS = {
  OPEN: 'open',
  CLOSED: 'closed',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed'
};

// NEW: Result statuses
export const RESULT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  ARCHIVED: 'archived'
};

// NEW: Performance categories for player self-assessment
export const PERFORMANCE_CATEGORIES = {
  SERVE: 'serve',
  RETURN: 'return',
  NET_PLAY: 'net_play',
  GROUNDSTROKES: 'groundstrokes',
  STRATEGY: 'strategy',
  MOVEMENT: 'movement',
  COMMUNICATION: 'communication',
  MENTAL_GAME: 'mental_game'
};

// NEW: Performance rating scale
export const PERFORMANCE_RATINGS = {
  NEEDS_WORK: 1,
  DEVELOPING: 2,
  COMPETENT: 3,
  STRONG: 4,
  EXCELLENT: 5
};

// NEW: Event types for results (to distinguish tournament divisions from leagues)
export const RESULT_EVENT_TYPES = {
  TOURNAMENT_DIVISION: 'tournament_division',
  LEAGUE: 'league'
};

// Create a tournament division
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

// NEW: Create a tournament division result
export const createTournamentDivisionResult = (resultData) => {
  const now = new Date();
  
  return {
    id: resultData.id || `result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    tournamentId: resultData.tournamentId || '',
    tournamentName: resultData.tournamentName || '',
    divisionId: resultData.divisionId || '',
    divisionName: resultData.divisionName || '',
    eventType: resultData.eventType || EVENT_TYPES.MIXED_DOUBLES,
    skillLevel: resultData.skillLevel || '',
    eventDate: resultData.eventDate || null,
    completedDate: resultData.completedDate || now,
    status: resultData.status || RESULT_STATUS.PENDING,
    standings: resultData.standings || [], // Array of {playerId, playerName, position, notes}
    totalParticipants: resultData.totalParticipants || 0,
    notes: resultData.notes || '',
    createdBy: resultData.createdBy || '',
    createdAt: now,
    updatedAt: now
  };
};

// NEW: Create a league result
export const createLeagueResult = (resultData) => {
  const now = new Date();
  
  return {
    id: resultData.id || `result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    leagueId: resultData.leagueId || '',
    leagueName: resultData.leagueName || '',
    eventType: resultData.eventType || EVENT_TYPES.MIXED_DOUBLES,
    skillLevel: resultData.skillLevel || '',
    startDate: resultData.startDate || null,
    endDate: resultData.endDate || null,
    completedDate: resultData.completedDate || now,
    status: resultData.status || RESULT_STATUS.PENDING,
    standings: resultData.standings || [], // Array of {playerId, playerName, position, wins, losses, points, notes}
    totalParticipants: resultData.totalParticipants || 0,
    notes: resultData.notes || '',
    createdBy: resultData.createdBy || '',
    createdAt: now,
    updatedAt: now
  };
};

// NEW: Create a player performance entry
export const createPlayerPerformance = (performanceData) => {
  const now = new Date();
  
  return {
    id: performanceData.id || `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    playerId: performanceData.playerId || '',
    playerName: performanceData.playerName || '',
    eventType: performanceData.eventType || RESULT_EVENT_TYPES.TOURNAMENT_DIVISION,
    eventId: performanceData.eventId || '', // tournamentId or leagueId
    eventName: performanceData.eventName || '',
    divisionId: performanceData.divisionId || null, // Only for tournament divisions
    divisionName: performanceData.divisionName || null,
    eventDate: performanceData.eventDate || null,
    skillLevel: performanceData.skillLevel || '',
    
    // Self-assessment ratings (1-5 scale)
    ratings: performanceData.ratings || {
      [PERFORMANCE_CATEGORIES.SERVE]: null,
      [PERFORMANCE_CATEGORIES.RETURN]: null,
      [PERFORMANCE_CATEGORIES.NET_PLAY]: null,
      [PERFORMANCE_CATEGORIES.GROUNDSTROKES]: null,
      [PERFORMANCE_CATEGORIES.STRATEGY]: null,
      [PERFORMANCE_CATEGORIES.MOVEMENT]: null,
      [PERFORMANCE_CATEGORIES.COMMUNICATION]: null,
      [PERFORMANCE_CATEGORIES.MENTAL_GAME]: null
    },
    
    // Text fields for detailed feedback
    strengths: performanceData.strengths || '', // What went well
    improvementAreas: performanceData.improvementAreas || '', // What needs work
    goalsForNext: performanceData.goalsForNext || '', // Goals for next event
    overallNotes: performanceData.overallNotes || '', // General thoughts
    
    // Metadata
    isComplete: performanceData.isComplete || false,
    createdAt: now,
    updatedAt: now
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

// Create a new tournament with divisions support
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
  // Note: For new tournaments, divisions array will be empty and populated via UI
  
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
    divisionId: commentData.divisionId || null,
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

// Tournament helper functions
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

// NEW: Results helper functions
export const getEventParticipantsForResult = (eventData, eventType) => {
  if (eventType === RESULT_EVENT_TYPES.LEAGUE) {
    return eventData.participants || [];
  } else if (eventType === RESULT_EVENT_TYPES.TOURNAMENT_DIVISION) {
    // For tournament divisions, participants are in the division
    return eventData.participants || [];
  }
  return [];
};

export const createStandingEntry = (playerId, playerName, position, additionalData = {}) => {
  return {
    playerId,
    playerName,
    position,
    ...additionalData
  };
};

export const createTournamentStandingEntry = (playerId, playerName, position, notes = '') => {
  return createStandingEntry(playerId, playerName, position, { notes });
};

export const createLeagueStandingEntry = (playerId, playerName, position, wins = 0, losses = 0, points = 0, notes = '') => {
  return createStandingEntry(playerId, playerName, position, { wins, losses, points, notes });
};

export const sortStandingsByPosition = (standings) => {
  return [...standings].sort((a, b) => a.position - b.position);
};

export const getPlayerPerformanceRatingAverage = (performance) => {
  const ratings = Object.values(performance.ratings || {}).filter(rating => rating !== null);
  if (ratings.length === 0) return null;
  
  const sum = ratings.reduce((total, rating) => total + rating, 0);
  return (sum / ratings.length).toFixed(1);
};

export const getPerformanceCategoryName = (category) => {
  const categoryNames = {
    [PERFORMANCE_CATEGORIES.SERVE]: 'Serve',
    [PERFORMANCE_CATEGORIES.RETURN]: 'Return',
    [PERFORMANCE_CATEGORIES.NET_PLAY]: 'Net Play',
    [PERFORMANCE_CATEGORIES.GROUNDSTROKES]: 'Groundstrokes',
    [PERFORMANCE_CATEGORIES.STRATEGY]: 'Strategy',
    [PERFORMANCE_CATEGORIES.MOVEMENT]: 'Movement',
    [PERFORMANCE_CATEGORIES.COMMUNICATION]: 'Communication',
    [PERFORMANCE_CATEGORIES.MENTAL_GAME]: 'Mental Game'
  };
  
  return categoryNames[category] || category;
};

export const getPerformanceRatingLabel = (rating) => {
  const ratingLabels = {
    [PERFORMANCE_RATINGS.NEEDS_WORK]: 'Needs Work',
    [PERFORMANCE_RATINGS.DEVELOPING]: 'Developing',
    [PERFORMANCE_RATINGS.COMPETENT]: 'Competent',
    [PERFORMANCE_RATINGS.STRONG]: 'Strong',
    [PERFORMANCE_RATINGS.EXCELLENT]: 'Excellent'
  };
  
  return ratingLabels[rating] || 'Not Rated';
};

// Validation helpers
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

// NEW: Results validation helpers
export const validateResultStatus = (status) => {
  return Object.values(RESULT_STATUS).includes(status);
};

export const validatePerformanceCategory = (category) => {
  return Object.values(PERFORMANCE_CATEGORIES).includes(category);
};

export const validatePerformanceRating = (rating) => {
  return Object.values(PERFORMANCE_RATINGS).includes(rating);
};

export const validateResultEventType = (eventType) => {
  return Object.values(RESULT_EVENT_TYPES).includes(eventType);
};

export const validateStandingEntry = (entry) => {
  return entry && 
         typeof entry.playerId === 'string' && 
         typeof entry.playerName === 'string' && 
         typeof entry.position === 'number' && 
         entry.position > 0;
};

// Division validation
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

// NEW: Tournament division result validation
export const validateTournamentDivisionResult = (resultData) => {
  const errors = [];
  
  if (!resultData.tournamentId?.trim()) {
    errors.push('Tournament ID is required');
  }
  
  if (!resultData.tournamentName?.trim()) {
    errors.push('Tournament name is required');
  }
  
  if (!resultData.divisionId?.trim()) {
    errors.push('Division ID is required');
  }
  
  if (!resultData.divisionName?.trim()) {
    errors.push('Division name is required');
  }
  
  if (!resultData.eventType || !validateEventType(resultData.eventType)) {
    errors.push('Valid event type is required');
  }
  
  if (resultData.status && !validateResultStatus(resultData.status)) {
    errors.push('Invalid result status');
  }
  
  if (!Array.isArray(resultData.standings)) {
    errors.push('Standings must be an array');
  } else {
    resultData.standings.forEach((entry, index) => {
      if (!validateStandingEntry(entry)) {
        errors.push(`Invalid standing entry at position ${index + 1}`);
      }
    });
  }
  
  if (resultData.totalParticipants < 0) {
    errors.push('Total participants cannot be negative');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// NEW: League result validation
export const validateLeagueResult = (resultData) => {
  const errors = [];
  
  if (!resultData.leagueId?.trim()) {
    errors.push('League ID is required');
  }
  
  if (!resultData.leagueName?.trim()) {
    errors.push('League name is required');
  }
  
  if (!resultData.eventType || !validateEventType(resultData.eventType)) {
    errors.push('Valid event type is required');
  }
  
  if (resultData.status && !validateResultStatus(resultData.status)) {
    errors.push('Invalid result status');
  }
  
  if (!Array.isArray(resultData.standings)) {
    errors.push('Standings must be an array');
  } else {
    resultData.standings.forEach((entry, index) => {
      if (!validateStandingEntry(entry)) {
        errors.push(`Invalid standing entry at position ${index + 1}`);
      }
      
      // League-specific validation
      if (typeof entry.wins !== 'number' || entry.wins < 0) {
        errors.push(`Invalid wins value at position ${index + 1}`);
      }
      
      if (typeof entry.losses !== 'number' || entry.losses < 0) {
        errors.push(`Invalid losses value at position ${index + 1}`);
      }
      
      if (typeof entry.points !== 'number' || entry.points < 0) {
        errors.push(`Invalid points value at position ${index + 1}`);
      }
    });
  }
  
  if (resultData.totalParticipants < 0) {
    errors.push('Total participants cannot be negative');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// NEW: Player performance validation
export const validatePlayerPerformance = (performanceData) => {
  const errors = [];
  
  if (!performanceData.playerId?.trim()) {
    errors.push('Player ID is required');
  }
  
  if (!performanceData.playerName?.trim()) {
    errors.push('Player name is required');
  }
  
  if (!performanceData.eventType || !validateResultEventType(performanceData.eventType)) {
    errors.push('Valid event type is required');
  }
  
  if (!performanceData.eventId?.trim()) {
    errors.push('Event ID is required');
  }
  
  if (!performanceData.eventName?.trim()) {
    errors.push('Event name is required');
  }
  
  // Validate ratings if provided
  if (performanceData.ratings) {
    Object.entries(performanceData.ratings).forEach(([category, rating]) => {
      if (rating !== null) {
        if (!validatePerformanceCategory(category)) {
          errors.push(`Invalid performance category: ${category}`);
        }
        
        if (!validatePerformanceRating(rating)) {
          errors.push(`Invalid rating value for ${category}: ${rating}`);
        }
      }
    });
  }
  
  // Text fields validation (optional but with length limits)
  const textFields = ['strengths', 'improvementAreas', 'goalsForNext', 'overallNotes'];
  textFields.forEach(field => {
    if (performanceData[field] && typeof performanceData[field] === 'string') {
      if (performanceData[field].length > 1000) {
        errors.push(`${field} must be 1000 characters or less`);
      }
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
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

// Tournament validation with divisions
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
  
  // Validate divisions - allow empty for initial creation, validate existing divisions
  if (tournamentData.divisions && !Array.isArray(tournamentData.divisions)) {
    errors.push('Divisions must be an array');
  } else if (tournamentData.divisions && tournamentData.divisions.length > 0) {
    tournamentData.divisions.forEach((division, index) => {
      const divisionValidation = validateDivision(division);
      if (!divisionValidation.isValid) {
        errors.push(`Division ${index + 1}: ${divisionValidation.errors.join(', ')}`);
      }
    });
  }
  // Note: Empty divisions array is allowed for new tournaments in draft status
  
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
  RESULT_STATUS,
  PERFORMANCE_CATEGORIES,
  PERFORMANCE_RATINGS,
  RESULT_EVENT_TYPES,
  
  // Creators
  createMember,
  createTournament,
  createTournamentDivision,
  createTournamentDivisionResult,
  createLeague,
  createLeagueResult,
  createComment,
  createPlayerPerformance,

  // Tournament helpers
  getTournamentTotalParticipants,
  getTournamentTotalExpected,
  getTournamentDivisionById,
  getUserDivisionsInTournament,
  addParticipantToDivision,
  removeParticipantFromDivision,
  
  // Results helpers
  getEventParticipantsForResult,
  createStandingEntry,
  createTournamentStandingEntry,
  createLeagueStandingEntry,
  sortStandingsByPosition,
  getPlayerPerformanceRatingAverage,
  getPerformanceCategoryName,
  getPerformanceRatingLabel,
  
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
  validateResultStatus,
  validatePerformanceCategory,
  validatePerformanceRating,
  validateResultEventType,
  validateStandingEntry,
  validateMember,
  validateTournament,
  validateDivision,
  validateLeague,
  validateComment,
  validateTournamentDivisionResult,
  validateLeagueResult,
  validatePlayerPerformance
};