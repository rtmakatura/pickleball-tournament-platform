// src/utils/paymentUtils.js
// Enhanced payment calculation utilities supporting both tournaments and leagues

/**
 * Validates a payment amount
 */
export const validatePaymentAmount = (amount) => {
  const num = parseFloat(amount);
  return !isNaN(num) && num >= 0;
};

/**
 * Calculates payment status for a single participant
 */
export const getParticipantPaymentStatus = (participantId, paymentData, fee) => {
  const payment = paymentData[participantId] || {};
  const amountPaid = validatePaymentAmount(payment.amount) ? parseFloat(payment.amount) : 0;
  
  if (amountPaid === 0) {
    return {
      status: 'unpaid',
      amountPaid: 0,
      amountOwed: fee,
      overpaidAmount: 0
    };
  }
  
  if (amountPaid >= fee) {
    return {
      status: amountPaid > fee ? 'overpaid' : 'paid',
      amountPaid,
      amountOwed: 0,
      overpaidAmount: Math.max(0, amountPaid - fee)
    };
  }
  
  return {
    status: 'partial',
    amountPaid,
    amountOwed: fee - amountPaid,
    overpaidAmount: 0
  };
};

/**
 * Generic payment summary calculation for any event (tournament or league)
 */
export const calculateEventPaymentSummary = (event, feeFieldName = 'entryFee') => {
  const fee = parseFloat(event[feeFieldName]) || 0;
  const participants = event.participants || [];
  const paymentData = event.paymentData || {};
  
  if (fee <= 0 || participants.length === 0) {
    return {
      totalParticipants: participants.length,
      totalExpected: 0,
      totalPaid: 0,
      totalOwed: 0,
      totalOverpaid: 0,
      paidCount: 0,
      partialCount: 0,
      unpaidCount: participants.length,
      overpaidCount: 0,
      isFullyPaid: true, // Free event is considered "fully paid"
      paymentRate: 100,
      hasPaymentIssues: false
    };
  }
  
  const totalExpected = fee * participants.length;
  let totalPaid = 0;
  let totalOwed = 0;
  let totalOverpaid = 0;
  let paidCount = 0;
  let partialCount = 0;
  let unpaidCount = 0;
  let overpaidCount = 0;
  
  participants.forEach(participantId => {
    const status = getParticipantPaymentStatus(participantId, paymentData, fee);
    
    totalPaid += status.amountPaid;
    totalOwed += status.amountOwed;
    totalOverpaid += status.overpaidAmount;
    
    switch (status.status) {
      case 'paid':
        paidCount++;
        break;
      case 'partial':
        partialCount++;
        break;
      case 'unpaid':
        unpaidCount++;
        break;
      case 'overpaid':
        overpaidCount++;
        break;
    }
  });
  
  const isFullyPaid = totalOwed === 0;
  const paymentRate = participants.length > 0 ? ((paidCount / participants.length) * 100) : 0;
  const hasPaymentIssues = totalOverpaid > 0 || (totalPaid > totalExpected);
  
  return {
    totalParticipants: participants.length,
    totalExpected,
    totalPaid: Math.round(totalPaid * 100) / 100,
    totalOwed: Math.round(totalOwed * 100) / 100,
    totalOverpaid: Math.round(totalOverpaid * 100) / 100,
    paidCount,
    partialCount,
    unpaidCount,
    overpaidCount,
    isFullyPaid,
    paymentRate: Math.round(paymentRate * 10) / 10,
    hasPaymentIssues
  };
};

/**
 * Calculates comprehensive payment summary for a tournament
 */
export const calculateTournamentPaymentSummary = (tournament) => {
  return calculateEventPaymentSummary(tournament, 'entryFee');
};

/**
 * Calculates comprehensive payment summary for a league
 */
export const calculateLeaguePaymentSummary = (league) => {
  return calculateEventPaymentSummary(league, 'registrationFee');
};

/**
 * Calculates overall payment summary across tournaments and leagues
 */
export const calculateOverallPaymentSummary = (tournaments, leagues = []) => {
  const paidTournaments = tournaments.filter(t => parseFloat(t.entryFee) > 0);
  const paidLeagues = leagues.filter(l => parseFloat(l.registrationFee) > 0);
  
  if (paidTournaments.length === 0 && paidLeagues.length === 0) {
    return {
      totalEvents: tournaments.length + leagues.length,
      totalTournaments: tournaments.length,
      totalLeagues: leagues.length,
      paidEvents: 0,
      paidTournaments: 0,
      paidLeagues: 0,
      totalExpected: 0,
      totalCollected: 0,
      totalOwed: 0,
      totalOverpaid: 0,
      participantsWithPayments: 0,
      participantsPaid: 0,
      paymentRate: 100,
      hasIssues: false
    };
  }
  
  let totalExpected = 0;
  let totalCollected = 0;
  let totalOwed = 0;
  let totalOverpaid = 0;
  let participantsWithPayments = 0;
  let participantsPaid = 0;
  
  // Process tournaments
  paidTournaments.forEach(tournament => {
    const summary = calculateTournamentPaymentSummary(tournament);
    
    totalExpected += summary.totalExpected;
    totalCollected += summary.totalPaid;
    totalOwed += summary.totalOwed;
    totalOverpaid += summary.totalOverpaid;
    participantsWithPayments += summary.totalParticipants;
    participantsPaid += summary.paidCount;
  });
  
  // Process leagues
  paidLeagues.forEach(league => {
    const summary = calculateLeaguePaymentSummary(league);
    
    totalExpected += summary.totalExpected;
    totalCollected += summary.totalPaid;
    totalOwed += summary.totalOwed;
    totalOverpaid += summary.totalOverpaid;
    participantsWithPayments += summary.totalParticipants;
    participantsPaid += summary.paidCount;
  });
  
  const paymentRate = participantsWithPayments > 0 
    ? ((participantsPaid / participantsWithPayments) * 100) 
    : 100;
  
  return {
    totalEvents: tournaments.length + leagues.length,
    totalTournaments: tournaments.length,
    totalLeagues: leagues.length,
    paidEvents: paidTournaments.length + paidLeagues.length,
    paidTournaments: paidTournaments.length,
    paidLeagues: paidLeagues.length,
    totalExpected: Math.round(totalExpected * 100) / 100,
    totalCollected: Math.round(totalCollected * 100) / 100,
    totalOwed: Math.round(totalOwed * 100) / 100,
    totalOverpaid: Math.round(totalOverpaid * 100) / 100,
    participantsWithPayments,
    participantsPaid,
    paymentRate: Math.round(paymentRate * 10) / 10,
    hasIssues: totalOverpaid > 0
  };
};

/**
 * Creates a payment record
 */
export const createPaymentRecord = (amount, participantId, options = {}) => {
  if (!validatePaymentAmount(amount)) {
    throw new Error('Invalid payment amount');
  }
  
  return {
    amount: parseFloat(amount),
    date: options.date || new Date().toISOString(),
    method: options.method || 'manual',
    notes: options.notes || `Payment of $${amount}`,
    recordedBy: options.recordedBy || null,
    participantId
  };
};

/**
 * Generic event payment data validation
 */
export const validateEventPaymentData = (event, feeFieldName = 'entryFee') => {
  const errors = [];
  
  if (!event[feeFieldName] || parseFloat(event[feeFieldName]) < 0) {
    errors.push(`Invalid ${feeFieldName}`);
  }
  
  if (!event.participants || !Array.isArray(event.participants)) {
    errors.push('Invalid participants list');
  }
  
  if (event.paymentData && typeof event.paymentData !== 'object') {
    errors.push('Invalid payment data structure');
  }
  
  // Validate individual payment records
  if (event.paymentData) {
    Object.entries(event.paymentData).forEach(([participantId, payment]) => {
      if (!event.participants.includes(participantId)) {
        errors.push(`Payment record for non-participant: ${participantId}`);
      }
      
      if (!validatePaymentAmount(payment.amount)) {
        errors.push(`Invalid payment amount for participant: ${participantId}`);
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validates tournament payment data structure
 */
export const validateTournamentPaymentData = (tournament) => {
  return validateEventPaymentData(tournament, 'entryFee');
};

/**
 * Validates league payment data structure
 */
export const validateLeaguePaymentData = (league) => {
  return validateEventPaymentData(league, 'registrationFee');
};

/**
 * Payment status badge helper
 */
export const getPaymentStatusBadge = (status) => {
  const badges = {
    unpaid: {
      color: 'bg-red-100 text-red-800',
      label: 'Unpaid'
    },
    partial: {
      color: 'bg-yellow-100 text-yellow-800',
      label: 'Partial'
    },
    paid: {
      color: 'bg-green-100 text-green-800',
      label: 'Paid'
    },
    overpaid: {
      color: 'bg-blue-100 text-blue-800',
      label: 'Overpaid'
    }
  };
  
  return badges[status] || badges.unpaid;
};

export default {
  validatePaymentAmount,
  getParticipantPaymentStatus,
  calculateEventPaymentSummary,
  calculateTournamentPaymentSummary,
  calculateLeaguePaymentSummary,
  calculateOverallPaymentSummary,
  createPaymentRecord,
  validateEventPaymentData,
  validateTournamentPaymentData,
  validateLeaguePaymentData,
  getPaymentStatusBadge
};