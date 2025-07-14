// src/utils/statusUtils.js - Tournament and League Status Management Utilities
import { TOURNAMENT_STATUS, LEAGUE_STATUS } from '../services/models';

/**
 * Checks if a tournament should automatically transition to REGISTERED status
 * @param {Object} tournament - Tournament object with divisions
 * @returns {boolean} - True if tournament should be marked as registered
 */
export const shouldTournamentBeRegistered = (tournament) => {
  // Must be in REGISTRATION_OPEN status to auto-transition
  if (tournament.status !== TOURNAMENT_STATUS.REGISTRATION_OPEN) {
    return false;
  }

  // Must have divisions with participants
  if (!tournament.divisions || tournament.divisions.length === 0) {
    return false;
  }

  // Check if at least one division has participants with payments
  return tournament.divisions.some(division => {
    if (!division.participants || division.participants.length === 0) {
      return false;
    }

    // Division must have an entry fee
    const entryFee = parseFloat(division.entryFee) || 0;
    if (entryFee <= 0) {
      return false;
    }

    // Check if at least one participant has paid
    const paymentData = division.paymentData || {};
    return division.participants.some(participantId => {
      const payment = paymentData[participantId];
      return payment && parseFloat(payment.amount || 0) > 0;
    });
  });
};

/**
 * ADDED: Determines the appropriate tournament status based on current state, payments, and dates
 * @param {Object} tournament - Tournament object
 * @returns {string} - Appropriate tournament status
 */
export const getAutomaticTournamentStatus = (tournament) => {
  if (!tournament) return TOURNAMENT_STATUS.DRAFT;
  
  const currentStatus = tournament.status;
  const now = new Date();
  
  // Get event date
  const eventDate = tournament.eventDate?.seconds 
    ? new Date(tournament.eventDate.seconds * 1000) 
    : tournament.eventDate ? new Date(tournament.eventDate) : null;
  
  // Get registration deadline or use event date
  const registrationDeadline = tournament.registrationDeadline?.seconds
    ? new Date(tournament.registrationDeadline.seconds * 1000)
    : tournament.registrationDeadline ? new Date(tournament.registrationDeadline) : eventDate;

  // Don't auto-change archived or manually set completed tournaments
  if (currentStatus === TOURNAMENT_STATUS.ARCHIVED || 
      currentStatus === TOURNAMENT_STATUS.COMPLETED) {
    return currentStatus;
  }

  // If no event date, don't auto-transition based on dates
  if (!eventDate) {
    // Only handle payment-based transitions
    if (currentStatus === TOURNAMENT_STATUS.REGISTRATION_OPEN) {
      if (shouldTournamentBeRegistered(tournament)) {
        return TOURNAMENT_STATUS.REGISTERED;
      }
    }
    return currentStatus;
  }

  // ADDED: Date-based transitions
  
  // If event date has passed, should be completed
  if (now >= eventDate) {
    return TOURNAMENT_STATUS.COMPLETED;
  }

  // If start date/registration deadline has passed, should be in progress
  const startThreshold = registrationDeadline || eventDate;
  if (now >= startThreshold) {
    return TOURNAMENT_STATUS.IN_PROGRESS;
  }

  // EXISTING: Payment-based transition from REGISTRATION_OPEN to REGISTERED
  // But only if we haven't hit the start date yet
  if (currentStatus === TOURNAMENT_STATUS.REGISTRATION_OPEN) {
    if (shouldTournamentBeRegistered(tournament) && now < startThreshold) {
      return TOURNAMENT_STATUS.REGISTERED;
    }
  }

  // Return current status if no automatic transition needed
  return currentStatus;
};

/**
 * ADDED: Determines the appropriate league status based on dates
 * @param {Object} league - League object
 * @returns {string} - Appropriate league status
 */
export const getAutomaticLeagueStatus = (league) => {
  if (!league) return LEAGUE_STATUS.ACTIVE;
  
  const currentStatus = league.status;
  const now = new Date();
  
  const startDate = league.startDate?.seconds 
    ? new Date(league.startDate.seconds * 1000) 
    : league.startDate ? new Date(league.startDate) : null;
  
  const endDate = league.endDate?.seconds
    ? new Date(league.endDate.seconds * 1000)
    : league.endDate ? new Date(league.endDate) : null;

  // Don't auto-change archived or manually set completed leagues
  if (currentStatus === LEAGUE_STATUS.ARCHIVED || 
      currentStatus === LEAGUE_STATUS.COMPLETED) {
    return currentStatus;
  }

  // If no dates, stay in current status
  if (!startDate || !endDate) {
    return currentStatus || LEAGUE_STATUS.ACTIVE;
  }

  // If end date has passed, should be completed
  if (now >= endDate) {
    return LEAGUE_STATUS.COMPLETED;
  }

  // If we're between start and end dates, should be active
  if (now >= startDate && now < endDate) {
    return LEAGUE_STATUS.ACTIVE;
  }

  // If start date hasn't arrived yet and currently active, keep active
  // If start date hasn't arrived yet and currently registered, keep registered
  if (now < startDate) {
    return currentStatus || LEAGUE_STATUS.REGISTERED;
  }

  // Default fallback
  return currentStatus || LEAGUE_STATUS.ACTIVE;
};

/**
 * Checks if a tournament can be manually set to a specific status
 * @param {Object} tournament - Tournament object
 * @param {string} newStatus - Desired status
 * @returns {Object} - { canTransition: boolean, reason: string }
 */
export const canTournamentTransitionTo = (tournament, newStatus) => {
  const currentStatus = tournament.status;

  // Draft can go to any status
  if (currentStatus === TOURNAMENT_STATUS.DRAFT) {
    return { canTransition: true, reason: '' };
  }

  // Registration Open can go to Registered, In Progress, or back to Draft
  if (currentStatus === TOURNAMENT_STATUS.REGISTRATION_OPEN) {
    const allowedTransitions = [
      TOURNAMENT_STATUS.DRAFT,
      TOURNAMENT_STATUS.REGISTERED,
      TOURNAMENT_STATUS.IN_PROGRESS,
      TOURNAMENT_STATUS.COMPLETED
    ];
    
    if (allowedTransitions.includes(newStatus)) {
      return { canTransition: true, reason: '' };
    }
  }

  // Registered can go to In Progress or back to Registration Open
  if (currentStatus === TOURNAMENT_STATUS.REGISTERED) {
    const allowedTransitions = [
      TOURNAMENT_STATUS.REGISTRATION_OPEN,
      TOURNAMENT_STATUS.IN_PROGRESS,
      TOURNAMENT_STATUS.COMPLETED
    ];
    
    if (allowedTransitions.includes(newStatus)) {
      return { canTransition: true, reason: '' };
    }
  }

  // In Progress can go to Completed or back to Registered
  if (currentStatus === TOURNAMENT_STATUS.IN_PROGRESS) {
    const allowedTransitions = [
      TOURNAMENT_STATUS.REGISTERED,
      TOURNAMENT_STATUS.COMPLETED
    ];
    
    if (allowedTransitions.includes(newStatus)) {
      return { canTransition: true, reason: '' };
    }
  }

  // Completed can only be archived
  if (currentStatus === TOURNAMENT_STATUS.COMPLETED) {
    if (newStatus === TOURNAMENT_STATUS.ARCHIVED) {
      return { canTransition: true, reason: '' };
    }
    return { canTransition: false, reason: 'Completed tournaments can only be archived' };
  }

  // Archived tournaments cannot transition
  if (currentStatus === TOURNAMENT_STATUS.ARCHIVED) {
    return { canTransition: false, reason: 'Archived tournaments cannot be modified' };
  }

  return { canTransition: false, reason: `Cannot transition from ${currentStatus} to ${newStatus}` };
};

/**
 * ADDED: Checks if a tournament needs a status update
 */
export const shouldUpdateTournamentStatus = (tournament) => {
  const currentStatus = tournament.status;
  const suggestedStatus = getAutomaticTournamentStatus(tournament);
  return currentStatus !== suggestedStatus;
};

/**
 * ADDED: Checks if a league needs a status update
 */
export const shouldUpdateLeagueStatus = (league) => {
  const currentStatus = league.status;
  const suggestedStatus = getAutomaticLeagueStatus(league);
  return currentStatus !== suggestedStatus;
};

export default {
  shouldTournamentBeRegistered,
  getAutomaticTournamentStatus,
  getAutomaticLeagueStatus,
  canTournamentTransitionTo,
  shouldUpdateTournamentStatus,
  shouldUpdateLeagueStatus
};