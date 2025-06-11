// src/utils/paymentUtils.js (UPDATED - Division Support)
// Enhanced payment calculation utilities supporting both tournaments with divisions and leagues

/**
 * Validates a payment amount
 */
export const validatePaymentAmount = (amount) => {
  const num = parseFloat(amount);
  return !isNaN(num) && num >= 0;
};

/**
 * Calculates payment status for a single participant in a division
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
 * NEW: Calculate payment summary for a single division
 */
export const calculateDivisionPaymentSummary = (division) => {
  const fee = parseFloat(division.entryFee) || 0;
  const participants = division.participants || [];
  const paymentData = division.paymentData || {};
  
  if (fee <= 0 || participants.length === 0) {
    return {
      divisionId: division.id,
      divisionName: division.name,
      totalParticipants: participants.length,
      totalExpected: 0,
      totalPaid: 0,
      totalOwed: 0,
      totalOverpaid: 0,
      paidCount: 0,
      partialCount: 0,
      unpaidCount: participants.length,
      overpaidCount: 0,
      isFullyPaid: true,
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
    divisionId: division.id,
    divisionName: division.name,
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
 * UPDATED: Calculate payment summary for a tournament with divisions
 */
export const calculateTournamentPaymentSummary = (tournament) => {
  if (!tournament.divisions || !Array.isArray(tournament.divisions)) {
    // Legacy tournament structure - use old method
    return calculateEventPaymentSummary(tournament, 'entryFee');
  }
  
  // New division-based structure
  const divisionSummaries = tournament.divisions.map(calculateDivisionPaymentSummary);
  const paidDivisions = divisionSummaries.filter(div => div.totalExpected > 0);
  
  if (paidDivisions.length === 0) {
    return {
      totalParticipants: tournament.divisions.reduce((sum, div) => sum + (div.participants?.length || 0), 0),
      totalDivisions: tournament.divisions.length,
      totalExpected: 0,
      totalPaid: 0,
      totalOwed: 0,
      totalOverpaid: 0,
      paidCount: 0,
      partialCount: 0,
      unpaidCount: 0,
      overpaidCount: 0,
      isFullyPaid: true,
      paymentRate: 100,
      hasPaymentIssues: false,
      divisionSummaries: divisionSummaries
    };
  }
  
  // Aggregate across all divisions
  const totals = paidDivisions.reduce((acc, div) => ({
    totalParticipants: acc.totalParticipants + div.totalParticipants,
    totalExpected: acc.totalExpected + div.totalExpected,
    totalPaid: acc.totalPaid + div.totalPaid,
    totalOwed: acc.totalOwed + div.totalOwed,
    totalOverpaid: acc.totalOverpaid + div.totalOverpaid,
    paidCount: acc.paidCount + div.paidCount,
    partialCount: acc.partialCount + div.partialCount,
    unpaidCount: acc.unpaidCount + div.unpaidCount,
    overpaidCount: acc.overpaidCount + div.overpaidCount
  }), {
    totalParticipants: 0,
    totalExpected: 0,
    totalPaid: 0,
    totalOwed: 0,
    totalOverpaid: 0,
    paidCount: 0,
    partialCount: 0,
    unpaidCount: 0,
    overpaidCount: 0
  });
  
  return {
    ...totals,
    totalDivisions: tournament.divisions.length,
    paidDivisions: paidDivisions.length,
    isFullyPaid: totals.totalOwed === 0,
    paymentRate: totals.totalParticipants > 0 ? 
      Math.round((totals.paidCount / totals.totalParticipants) * 100 * 10) / 10 : 100,
    hasPaymentIssues: totals.totalOverpaid > 0,
    divisionSummaries: divisionSummaries,
    // Round monetary values
    totalExpected: Math.round(totals.totalExpected * 100) / 100,
    totalPaid: Math.round(totals.totalPaid * 100) / 100,
    totalOwed: Math.round(totals.totalOwed * 100) / 100,
    totalOverpaid: Math.round(totals.totalOverpaid * 100) / 100
  };
};

/**
 * Generic payment summary calculation for any event (tournament or league)
 * Supports legacy structure for backwards compatibility
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
      isFullyPaid: true,
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
 * Calculates comprehensive payment summary for a league (unchanged)
 */
export const calculateLeaguePaymentSummary = (league) => {
  return calculateEventPaymentSummary(league, 'registrationFee');
};

/**
 * UPDATED: Calculate overall payment summary across tournaments and leagues
 * Now handles division-based tournaments
 */
export const calculateOverallPaymentSummary = (tournaments, leagues = []) => {
  // Separate legacy and division-based tournaments
  const legacyTournaments = tournaments.filter(t => 
    !t.divisions && parseFloat(t.entryFee || 0) > 0
  );
  const divisionTournaments = tournaments.filter(t => 
    t.divisions && Array.isArray(t.divisions)
  );
  const paidLeagues = leagues.filter(l => parseFloat(l.registrationFee) > 0);
  
  // Count paid divisions across all tournaments
  const paidDivisions = divisionTournaments.reduce((count, tournament) => {
    return count + tournament.divisions.filter(div => parseFloat(div.entryFee || 0) > 0).length;
  }, 0);
  
  const totalPaidEvents = legacyTournaments.length + paidDivisions + paidLeagues.length;
  
  if (totalPaidEvents === 0) {
    return {
      totalEvents: tournaments.length + leagues.length,
      totalTournaments: tournaments.length,
      totalLeagues: leagues.length,
      totalDivisions: divisionTournaments.reduce((sum, t) => sum + (t.divisions?.length || 0), 0),
      paidEvents: 0,
      paidTournaments: legacyTournaments.length,
      paidDivisions: 0,
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
  
  // Process legacy tournaments
  legacyTournaments.forEach(tournament => {
    const summary = calculateEventPaymentSummary(tournament, 'entryFee');
    
    totalExpected += summary.totalExpected;
    totalCollected += summary.totalPaid;
    totalOwed += summary.totalOwed;
    totalOverpaid += summary.totalOverpaid;
    participantsWithPayments += summary.totalParticipants;
    participantsPaid += summary.paidCount;
  });
  
  // Process division-based tournaments
  divisionTournaments.forEach(tournament => {
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
    totalDivisions: divisionTournaments.reduce((sum, t) => sum + (t.divisions?.length || 0), 0),
    paidEvents: totalPaidEvents,
    paidTournaments: legacyTournaments.length,
    paidDivisions: paidDivisions,
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
 * Creates a payment record for a specific division
 */
export const createDivisionPaymentRecord = (amount, participantId, divisionId, options = {}) => {
  if (!validatePaymentAmount(amount)) {
    throw new Error('Invalid payment amount');
  }
  
  return {
    amount: parseFloat(amount),
    date: options.date || new Date().toISOString(),
    method: options.method || 'manual',
    notes: options.notes || `Payment of $${amount} for division`,
    recordedBy: options.recordedBy || null,
    participantId,
    divisionId
  };
};

/**
 * Creates a payment record (backwards compatible)
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
 * NEW: Division payment data validation
 */
export const validateDivisionPaymentData = (division) => {
  const errors = [];
  
  if (!division.entryFee || parseFloat(division.entryFee) < 0) {
    errors.push('Invalid entry fee');
  }
  
  if (!division.participants || !Array.isArray(division.participants)) {
    errors.push('Invalid participants list');
  }
  
  if (division.paymentData && typeof division.paymentData !== 'object') {
    errors.push('Invalid payment data structure');
  }
  
  // Validate individual payment records
  if (division.paymentData) {
    Object.entries(division.paymentData).forEach(([participantId, payment]) => {
      if (!division.participants.includes(participantId)) {
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
 * UPDATED: Tournament payment validation with division support
 */
export const validateTournamentPaymentData = (tournament) => {
  if (tournament.divisions && Array.isArray(tournament.divisions)) {
    // New division-based structure
    const errors = [];
    
    tournament.divisions.forEach((division, index) => {
      const divisionValidation = validateDivisionPaymentData(division);
      if (!divisionValidation.isValid) {
        errors.push(`Division ${index + 1}: ${divisionValidation.errors.join(', ')}`);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  } else {
    // Legacy structure
    return validateEventPaymentData(tournament, 'entryFee');
  }
};

/**
 * Generic event payment data validation (unchanged)
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
 * Validates league payment data structure (unchanged)
 */
export const validateLeaguePaymentData = (league) => {
  return validateEventPaymentData(league, 'registrationFee');
};

/**
 * Payment status badge helper (unchanged)
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

/**
 * NEW: Get user's total fees across all divisions in a tournament
 */
export const getUserTotalFeesInTournament = (tournament, userId) => {
  if (!tournament.divisions) return 0;
  
  return tournament.divisions.reduce((total, division) => {
    if (division.participants?.includes(userId)) {
      return total + (parseFloat(division.entryFee) || 0);
    }
    return total;
  }, 0);
};

/**
 * NEW: Get user's payment status across all divisions in a tournament
 */
export const getUserPaymentStatusInTournament = (tournament, userId) => {
  if (!tournament.divisions) return { divisions: [], totalOwed: 0, totalPaid: 0 };
  
  const divisionStatuses = tournament.divisions
    .filter(division => division.participants?.includes(userId))
    .map(division => {
      const fee = parseFloat(division.entryFee) || 0;
      const paymentStatus = getParticipantPaymentStatus(userId, division.paymentData || {}, fee);
      
      return {
        divisionId: division.id,
        divisionName: division.name,
        fee,
        ...paymentStatus
      };
    });
  
  const totalOwed = divisionStatuses.reduce((sum, div) => sum + div.amountOwed, 0);
  const totalPaid = divisionStatuses.reduce((sum, div) => sum + div.amountPaid, 0);
  
  return {
    divisions: divisionStatuses,
    totalOwed: Math.round(totalOwed * 100) / 100,
    totalPaid: Math.round(totalPaid * 100) / 100,
    isFullyPaid: totalOwed === 0
  };
};

export default {
  validatePaymentAmount,
  getParticipantPaymentStatus,
  calculateDivisionPaymentSummary,
  calculateEventPaymentSummary,
  calculateTournamentPaymentSummary,
  calculateLeaguePaymentSummary,
  calculateOverallPaymentSummary,
  createPaymentRecord,
  createDivisionPaymentRecord,
  validateEventPaymentData,
  validateDivisionPaymentData,
  validateTournamentPaymentData,
  validateLeaguePaymentData,
  getPaymentStatusBadge,
  getUserTotalFeesInTournament,
  getUserPaymentStatusInTournament
};