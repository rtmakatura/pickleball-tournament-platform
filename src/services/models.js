// src/services/models.js

// Simple data models for PickleTrack entities

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

// Member model
export const createMember = (data = {}) => ({
  email: data.email || '',
  firstName: data.firstName || '',
  lastName: data.lastName || '',
  displayName: data.displayName || '',
  phoneNumber: data.phoneNumber || '',
  skillLevel: data.skillLevel || SKILL_LEVELS.BEGINNER,
  role: data.role || MEMBER_ROLES.PLAYER,
  isActive: data.isActive !== false
});

// League model
export const createLeague = (data = {}) => ({
  name: data.name || '',
  description: data.description || '',
  skillLevel: data.skillLevel || SKILL_LEVELS.INTERMEDIATE,
  status: data.status || LEAGUE_STATUS.ACTIVE,
  startDate: data.startDate || null,
  endDate: data.endDate || null,
  maxParticipants: data.maxParticipants || 20,
  participants: data.participants || [],
  registrationFee: data.registrationFee || 0,
  isActive: data.isActive !== false
});

// Tournament model
export const createTournament = (data = {}) => ({
  name: data.name || '',
  description: data.description || '',
  skillLevel: data.skillLevel || SKILL_LEVELS.INTERMEDIATE,
  status: data.status || TOURNAMENT_STATUS.DRAFT,
  eventDate: data.eventDate || null,
  registrationDeadline: data.registrationDeadline || null,
  maxParticipants: data.maxParticipants || 32,
  participants: data.participants || [],
  entryFee: data.entryFee || 0,
  location: data.location || '',
  isActive: data.isActive !== false
});