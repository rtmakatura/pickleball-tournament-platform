// src/utils/statusUtils.js - Tournament and League Status Management Utilities
import { TOURNAMENT_STATUS, LEAGUE_STATUS } from '../services/models';

/**
 * Checks if all participants in a tournament have paid (regardless of current status)
 * @param {Object} tournament - Tournament object with divisions
 * @returns {boolean} - True if all participants have paid
 */
export const areAllParticipantsPaid = (tournament) => {
  console.log(`   💰 PAYMENT CHECK: ${tournament.name}`);
  
  // Must have divisions with participants
  if (!tournament.divisions || tournament.divisions.length === 0) {
    console.log(`   💰 No divisions found`);
    return false;
  }

  // Must have at least one division with participants and entry fee
  const divisionsWithFees = tournament.divisions.filter(division => {
    const hasParticipants = division.participants && division.participants.length > 0;
    const hasEntryFee = parseFloat(division.entryFee) || 0 > 0;
    return hasParticipants && hasEntryFee;
  });

  console.log(`   💰 Divisions with fees: ${divisionsWithFees.length} of ${tournament.divisions.length}`);

  if (divisionsWithFees.length === 0) {
    console.log(`   💰 No divisions with fees and participants`);
    return false;
  }

  // Check if ALL participants in ALL divisions with fees have paid
  const allPaid = divisionsWithFees.every(division => {
    const entryFee = parseFloat(division.entryFee);
    const paymentData = division.paymentData || {};
    
    console.log(`   💰 Division "${division.name}": $${entryFee} fee, ${division.participants.length} participants`);
    
    // ALL participants in this division must have paid the full amount
    const divisionPaid = division.participants.every(participantId => {
      const payment = paymentData[participantId];
      const amountPaid = parseFloat(payment?.amount || 0);
      const isPaid = amountPaid >= entryFee;
      console.log(`   💰   Participant ${participantId}: paid $${amountPaid} of $${entryFee} = ${isPaid ? 'PAID' : 'UNPAID'}`);
      return isPaid;
    });
    
    console.log(`   💰 Division "${division.name}" all paid: ${divisionPaid}`);
    return divisionPaid;
  });

  console.log(`   💰 ALL DIVISIONS PAID: ${allPaid}`);
  return allPaid;
};

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

  return areAllParticipantsPaid(tournament);
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
  
  console.log(`🔍 STATUS CHECK: ${tournament.name}`);
  console.log(`   Current Status: ${currentStatus}`);
  console.log(`   Current Time: ${now.toISOString()}`);
  
  // Get event date
  const eventDate = tournament.eventDate?.seconds 
    ? new Date(tournament.eventDate.seconds * 1000) 
    : tournament.eventDate ? new Date(tournament.eventDate) : null;
  
  // Get registration deadline or use event date
  const registrationDeadline = tournament.registrationDeadline?.seconds
    ? new Date(tournament.registrationDeadline.seconds * 1000)
    : tournament.registrationDeadline ? new Date(tournament.registrationDeadline) : null;

  console.log(`   Event Date: ${eventDate ? eventDate.toISOString() : 'None'}`);
  console.log(`   Registration Deadline: ${registrationDeadline ? registrationDeadline.toISOString() : 'None'}`);

  // Don't auto-change archived or manually set completed tournaments
  if (currentStatus === TOURNAMENT_STATUS.ARCHIVED || 
      currentStatus === TOURNAMENT_STATUS.COMPLETED) {
    console.log(`   ✅ Keeping status (archived/completed): ${currentStatus}`);
    return currentStatus;
  }

  // Check if tournament has divisions with participants (required for most statuses)
  const hasValidDivisions = tournament.divisions && 
    tournament.divisions.length > 0 && 
    tournament.divisions.some(div => div.participants && div.participants.length > 0);

  console.log(`   Has Valid Divisions: ${hasValidDivisions}`);
  console.log(`   Division Count: ${tournament.divisions?.length || 0}`);
  
  if (tournament.divisions) {
    tournament.divisions.forEach((div, index) => {
      console.log(`   Division ${index + 1}: ${div.name} - ${div.participants?.length || 0} participants - $${div.entryFee || 0} fee`);
    });
  }

  // Check payment status
  const allPaid = areAllParticipantsPaid(tournament);
  console.log(`   All Participants Paid: ${allPaid}`);

  // If no event date, only handle payment-based transitions
  if (!eventDate) {
    console.log(`   No event date - checking payment transitions only`);
    if (currentStatus === TOURNAMENT_STATUS.REGISTRATION_OPEN && hasValidDivisions) {
      if (shouldTournamentBeRegistered(tournament)) {
        console.log(`   ✅ Transition to REGISTERED (payment complete)`);
        return TOURNAMENT_STATUS.REGISTERED;
      }
    }
    console.log(`   ✅ Keeping current status (no event date): ${currentStatus}`);
    return currentStatus;
  }

  // Date-based transitions - but only if tournament has participants
  
  // If event date has passed and tournament has participants, should be completed
  if (now >= eventDate && hasValidDivisions) {
    console.log(`   ✅ Event date passed + has participants = COMPLETED`);
    return TOURNAMENT_STATUS.COMPLETED;
  }

  // If event date has passed but no participants, stay in current status
  if (now >= eventDate && !hasValidDivisions) {
    console.log(`   ✅ Event date passed but no participants = keeping ${currentStatus}`);
    return currentStatus;
  }

  // Payment-based transition takes priority - if all participants paid, should be REGISTERED (regardless of current status)
  if (hasValidDivisions && allPaid) {
    console.log(`   ✅ Has participants + all paid = REGISTERED`);
    return TOURNAMENT_STATUS.REGISTERED;
  }

  // If registration deadline has passed and tournament has participants but not fully paid, should be in progress
  if (registrationDeadline && now >= registrationDeadline && hasValidDivisions) {
    console.log(`   ✅ Registration deadline passed + has participants but not fully paid = IN_PROGRESS`);
    return TOURNAMENT_STATUS.IN_PROGRESS;
  }

  // If no divisions/participants, tournament should stay in REGISTRATION_OPEN or DRAFT
  if (!hasValidDivisions) {
    if (currentStatus === TOURNAMENT_STATUS.IN_PROGRESS || 
        currentStatus === TOURNAMENT_STATUS.REGISTERED) {
      console.log(`   ✅ No valid divisions, resetting to REGISTRATION_OPEN`);
      return TOURNAMENT_STATUS.REGISTRATION_OPEN;
    }
  }

  // Return current status if no automatic transition needed
  console.log(`   ✅ No transition needed, keeping: ${currentStatus}`);
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