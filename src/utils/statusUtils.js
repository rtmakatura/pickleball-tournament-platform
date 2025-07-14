// src/utils/statusUtils.js - Tournament Status Management Utilities
import { TOURNAMENT_STATUS } from '../services/models';

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
 * Determines the appropriate tournament status based on current state and payments
 * @param {Object} tournament - Tournament object
 * @returns {string} - Appropriate tournament status
 */
export const getAutomaticTournamentStatus = (tournament) => {
  const currentStatus = tournament.status;

  // Only auto-transition from REGISTRATION_OPEN to REGISTERED
  if (currentStatus === TOURNAMENT_STATUS.REGISTRATION_OPEN) {
    if (shouldTournamentBeRegistered(tournament)) {
      return TOURNAMENT_STATUS.REGISTERED;
    }
  }

  // Don't change status for other cases
  return currentStatus;
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

export default {
  shouldTournamentBeRegistered,
  getAutomaticTournamentStatus,
  canTournamentTransitionTo
};