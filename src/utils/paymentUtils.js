// src/utils/paymentUtils.js
// Improved payment calculation utilities with proper validation

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
export const getParticipantPaymentStatus = (participantId, paymentData, entryFee) => {
  const payment = paymentData[participantId] || {};
  const amountPaid = validatePaymentAmount(payment.amount) ? parseFloat(payment.amount) : 0;
  
  if (amountPaid === 0) {
    return {
      status: 'unpaid',
      amountPaid: 0,
      amountOwed: entryFee,
      overpaidAmount: 0
    };
  }
  
  if (amountPaid >= entryFee) {
    return {
      status: amountPaid > entryFee ? 'overpaid' : 'paid',
      amountPaid,
      amountOwed: 0,
      overpaidAmount: Math.max(0, amountPaid - entryFee)
    };
  }
  
  return {
    status: 'partial',
    amountPaid,
    amountOwed: entryFee - amountPaid,
    overpaidAmount: 0
  };
};

/**
 * Calculates comprehensive payment summary for a tournament
 */
export const calculateTournamentPaymentSummary = (tournament) => {
  const entryFee = parseFloat(tournament.entryFee) || 0;
  const participants = tournament.participants || [];
  const paymentData = tournament.paymentData || {};
  
  if (entryFee <= 0 || participants.length === 0) {
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
      isFullyPaid: true, // Free tournament is considered "fully paid"
      paymentRate: 100,
      hasPaymentIssues: false
    };
  }
  
  const totalExpected = entryFee * participants.length;
  let totalPaid = 0;
  let totalOwed = 0;
  let totalOverpaid = 0;
  let paidCount = 0;
  let partialCount = 0;
  let unpaidCount = 0;
  let overpaidCount = 0;
  
  participants.forEach(participantId => {
    const status = getParticipantPaymentStatus(participantId, paymentData, entryFee);
    
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
    totalPaid: Math.round(totalPaid * 100) / 100, // Round to 2 decimal places
    totalOwed: Math.round(totalOwed * 100) / 100,
    totalOverpaid: Math.round(totalOverpaid * 100) / 100,
    paidCount,
    partialCount,
    unpaidCount,
    overpaidCount,
    isFullyPaid,
    paymentRate: Math.round(paymentRate * 10) / 10, // Round to 1 decimal place
    hasPaymentIssues
  };
};

/**
 * Calculates overall payment summary across all tournaments
 */
export const calculateOverallPaymentSummary = (tournaments) => {
  const paidTournaments = tournaments.filter(t => parseFloat(t.entryFee) > 0);
  
  if (paidTournaments.length === 0) {
    return {
      totalTournaments: tournaments.length,
      paidTournaments: 0,
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
  
  paidTournaments.forEach(tournament => {
    const summary = calculateTournamentPaymentSummary(tournament);
    
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
    totalTournaments: tournaments.length,
    paidTournaments: paidTournaments.length,
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
 * Validates tournament payment data structure
 */
export const validateTournamentPaymentData = (tournament) => {
  const errors = [];
  
  if (!tournament.entryFee || parseFloat(tournament.entryFee) < 0) {
    errors.push('Invalid entry fee');
  }
  
  if (!tournament.participants || !Array.isArray(tournament.participants)) {
    errors.push('Invalid participants list');
  }
  
  if (tournament.paymentData && typeof tournament.paymentData !== 'object') {
    errors.push('Invalid payment data structure');
  }
  
  // Validate individual payment records
  if (tournament.paymentData) {
    Object.entries(tournament.paymentData).forEach(([participantId, payment]) => {
      if (!tournament.participants.includes(participantId)) {
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
  calculateTournamentPaymentSummary,
  calculateOverallPaymentSummary,
  createPaymentRecord,
  validateTournamentPaymentData,
  getPaymentStatusBadge
};