// src/services/firebaseOperations.js (COMPLETE - With Results Support)
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from './firebase';

// Basic CRUD operations
export const create = async (collectionName, data) => {
  const docData = {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  const docRef = await addDoc(collection(db, collectionName), docData);
  return docRef.id;
};

export const read = async (collectionName, id) => {
  const docRef = doc(db, collectionName, id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
};

export const update = async (collectionName, id, data) => {
  const docRef = doc(db, collectionName, id);
  const updateData = {
    ...data,
    updatedAt: serverTimestamp()
  };
  await updateDoc(docRef, updateData);
};

export const remove = async (collectionName, id) => {
  const docRef = doc(db, collectionName, id);
  await deleteDoc(docRef);
};

// Enhanced query operations
export const getAll = async (collectionName, filters = {}, orderField = null, limitCount = null) => {
  try {
    let q = collection(db, collectionName);
    
    Object.entries(filters).forEach(([field, value]) => {
      if (value !== undefined && value !== null) {
        q = query(q, where(field, '==', value));
      }
    });
    
    if (orderField) {
      q = query(q, orderBy(orderField));
    }
    
    if (limitCount) {
      q = query(q, limit(limitCount));
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error(`❌ Error fetching ${collectionName}:`, error);
    
    if (error.code === 'permission-denied') {
      console.error('🔒 Permission denied - check Firestore security rules');
      return []; // Return empty array instead of throwing
    }
    
    throw error;
  }
};

// Real-time subscriptions with enhanced filtering
export const subscribe = (collectionName, callback, filters = {}, orderField = null) => {
  let q = collection(db, collectionName);
  
  Object.entries(filters).forEach(([field, value]) => {
    if (value !== undefined && value !== null) {
      q = query(q, where(field, '==', value));
    }
  });
  
  if (orderField) {
    q = query(q, orderBy(orderField));
  }
  
  return onSnapshot(q, (querySnapshot) => {
    const documents = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(documents);
  });
};

export const subscribeToDoc = (collectionName, id, callback) => {
  const docRef = doc(db, collectionName, id);
  return onSnapshot(docRef, (doc) => {
    const data = doc.exists() ? { id: doc.id, ...doc.data() } : null;
    callback(data);
  });
};

// User-specific operations
export const getUserMembers = async (authUid) => {
  const membersRef = collection(db, 'members');
  const q = query(membersRef, where('authUid', '==', authUid));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

export const getMemberByAuthUid = async (authUid) => {
  const members = await getUserMembers(authUid);
  return members.length > 0 ? members[0] : null;
};

// Get user's tournaments with division support
export const getUserTournaments = async (memberId) => {
  const tournamentsRef = collection(db, 'tournaments');
  const allTournaments = await getDocs(tournamentsRef);
  
  return allTournaments.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(tournament => {
      // Check if user is in any division of this tournament
      if (tournament.divisions && Array.isArray(tournament.divisions)) {
        return tournament.divisions.some(division => 
          division.participants?.includes(memberId)
        );
      }
      // Legacy support: check direct participants array
      return tournament.participants?.includes(memberId);
    });
};

// Get user's leagues
export const getUserLeagues = async (memberId) => {
  const leaguesRef = collection(db, 'leagues');
  const q = query(leaguesRef, where('participants', 'array-contains', memberId));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

// Admin operations with division support
export const getAllUsersWithStats = async () => {
  const members = await getAll('members');
  const tournaments = await getAll('tournaments');
  const leagues = await getAll('leagues');
  
  return members.map(member => {
    // Count tournaments by checking divisions
    const memberTournaments = tournaments.filter(tournament => {
      if (tournament.divisions && Array.isArray(tournament.divisions)) {
        return tournament.divisions.some(division => 
          division.participants?.includes(member.id)
        );
      }
      // Legacy support
      return tournament.participants?.includes(member.id);
    });
    
    const memberLeagues = leagues.filter(l => 
      l.participants?.includes(member.id)
    );
    
    // Count total divisions the member is in
    const memberDivisions = tournaments.reduce((count, tournament) => {
      if (tournament.divisions && Array.isArray(tournament.divisions)) {
        return count + tournament.divisions.filter(division => 
          division.participants?.includes(member.id)
        ).length;
      }
      return count;
    }, 0);
    
    return {
      ...member,
      stats: {
        tournamentsCount: memberTournaments.length,
        divisionsCount: memberDivisions,
        leaguesCount: memberLeagues.length,
        totalEvents: memberTournaments.length + memberLeagues.length
      }
    };
  });
};

// Batch operations for better performance
export const batchUpdate = async (updates) => {
  const batch = writeBatch(db);
  
  updates.forEach(({ collection: collectionName, id, data }) => {
    const docRef = doc(db, collectionName, id);
    batch.update(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  });
  
  await batch.commit();
};

export const batchDelete = async (deletions) => {
  const batch = writeBatch(db);
  
  deletions.forEach(({ collection: collectionName, id }) => {
    const docRef = doc(db, collectionName, id);
    batch.delete(docRef);
  });
  
  await batch.commit();
};

// Array operations for participants with division support
export const addParticipantToDivision = async (tournamentId, divisionId, memberId) => {
  const tournament = await read('tournaments', tournamentId);
  if (!tournament || !tournament.divisions) {
    throw new Error('Tournament or divisions not found');
  }
  
  const updatedDivisions = tournament.divisions.map(division => {
    if (division.id === divisionId) {
      const participants = division.participants || [];
      if (!participants.includes(memberId)) {
        return { ...division, participants: [...participants, memberId] };
      }
    }
    return division;
  });
  
  await update('tournaments', tournamentId, { divisions: updatedDivisions });
};

export const removeParticipantFromDivision = async (tournamentId, divisionId, memberId) => {
  const tournament = await read('tournaments', tournamentId);
  if (!tournament || !tournament.divisions) {
    throw new Error('Tournament or divisions not found');
  }
  
  const updatedDivisions = tournament.divisions.map(division => {
    if (division.id === divisionId) {
      const participants = (division.participants || []).filter(id => id !== memberId);
      const paymentData = { ...division.paymentData };
      delete paymentData[memberId]; // Remove payment data when removing participant
      
      return { ...division, participants, paymentData };
    }
    return division;
  });
  
  await update('tournaments', tournamentId, { divisions: updatedDivisions });
};

// Legacy participant operations (for backwards compatibility)
export const addParticipant = async (collectionName, id, memberId) => {
  const docRef = doc(db, collectionName, id);
  await updateDoc(docRef, {
    participants: arrayUnion(memberId),
    updatedAt: serverTimestamp()
  });
};

export const removeParticipant = async (collectionName, id, memberId) => {
  const docRef = doc(db, collectionName, id);
  await updateDoc(docRef, {
    participants: arrayRemove(memberId),
    updatedAt: serverTimestamp()
  });
};

// Complex queries with division support
export const getEventsWithParticipant = async (memberId) => {
  const tournaments = await getUserTournaments(memberId);
  const leagues = await getUserLeagues(memberId);
  
  // Get division details for tournaments
  const tournamentDetails = tournaments.map(tournament => {
    const memberDivisions = tournament.divisions?.filter(division => 
      division.participants?.includes(memberId)
    ) || [];
    
    return {
      ...tournament,
      memberDivisions: memberDivisions.map(div => ({
        id: div.id,
        name: div.name,
        eventType: div.eventType,
        skillLevel: div.skillLevel,
        entryFee: div.entryFee
      }))
    };
  });
  
  return {
    tournaments: tournamentDetails,
    leagues,
    totalEvents: tournaments.length + leagues.length,
    totalDivisions: tournamentDetails.reduce((sum, t) => sum + (t.memberDivisions?.length || 0), 0)
  };
};

// Search operations with division support
export const searchMembers = async (searchTerm, filters = {}) => {
  const members = await getAll('members', filters);
  
  if (!searchTerm) return members;
  
  const lowercaseSearch = searchTerm.toLowerCase();
  return members.filter(member => {
    const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
    const email = member.email.toLowerCase();
    
    return fullName.includes(lowercaseSearch) || 
           email.includes(lowercaseSearch);
  });
};

export const searchEvents = async (searchTerm, eventType = 'both') => {
  const results = { tournaments: [], leagues: [] };
  
  if (eventType === 'tournaments' || eventType === 'both') {
    const tournaments = await getAll('tournaments');
    results.tournaments = tournaments.filter(t => {
      const nameMatch = t.name.toLowerCase().includes(searchTerm.toLowerCase());
      const descMatch = t.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const locationMatch = t.location?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Also search in division names
      const divisionMatch = t.divisions?.some(div => 
        div.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      return nameMatch || descMatch || locationMatch || divisionMatch;
    });
  }
  
  if (eventType === 'leagues' || eventType === 'both') {
    const leagues = await getAll('leagues');
    results.leagues = leagues.filter(l => 
      l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
  
  return results;
};

// Analytics and reporting with division support
export const getSystemStats = async () => {
  const [members, tournaments, leagues] = await Promise.all([
    getAll('members'),
    getAll('tournaments'),
    getAll('leagues')
  ]);
  
  // Calculate division statistics
  const totalDivisions = tournaments.reduce((sum, t) => sum + (t.divisions?.length || 0), 0);
  const divisionsByEventType = {};
  const divisionsBySkillLevel = {};
  
  tournaments.forEach(tournament => {
    if (tournament.divisions) {
      tournament.divisions.forEach(division => {
        // Count by event type
        const eventType = division.eventType;
        divisionsByEventType[eventType] = (divisionsByEventType[eventType] || 0) + 1;
        
        // Count by skill level
        const skillLevel = division.skillLevel;
        divisionsBySkillLevel[skillLevel] = (divisionsBySkillLevel[skillLevel] || 0) + 1;
      });
    }
  });
  
  return {
    members: {
      total: members.length,
      active: members.filter(m => m.isActive).length,
      authenticated: members.filter(m => m.authUid).length,
      byRole: {
        admin: members.filter(m => m.role === 'admin').length,
        organizer: members.filter(m => m.role === 'organizer').length,
        player: members.filter(m => m.role === 'player').length
      },
      bySkillLevel: {
        beginner: members.filter(m => m.skillLevel === 'beginner').length,
        intermediate: members.filter(m => m.skillLevel === 'intermediate').length,
        advanced: members.filter(m => m.skillLevel === 'advanced').length,
        expert: members.filter(m => m.skillLevel === 'expert').length
      }
    },
    tournaments: {
      total: tournaments.length,
      totalDivisions: totalDivisions,
      byStatus: {
        draft: tournaments.filter(t => t.status === 'draft').length,
        registrationOpen: tournaments.filter(t => t.status === 'registration_open').length,
        inProgress: tournaments.filter(t => t.status === 'in_progress').length,
        completed: tournaments.filter(t => t.status === 'completed').length
      }
    },
    divisions: {
      total: totalDivisions,
      byEventType: divisionsByEventType,
      bySkillLevel: divisionsBySkillLevel,
      averagePerTournament: tournaments.length > 0 ? (totalDivisions / tournaments.length).toFixed(1) : 0
    },
    leagues: {
      total: leagues.length,
      active: leagues.filter(l => l.status === 'active').length,
      completed: leagues.filter(l => l.status === 'completed').length
    }
  };
};

// Payment operations with division support
export const updateDivisionPaymentData = async (tournamentId, divisionId, memberId, paymentInfo) => {
  const tournament = await read('tournaments', tournamentId);
  if (!tournament || !tournament.divisions) {
    throw new Error('Tournament or divisions not found');
  }
  
  const updatedDivisions = tournament.divisions.map(division => {
    if (division.id === divisionId) {
      return {
        ...division,
        paymentData: {
          ...division.paymentData,
          [memberId]: paymentInfo
        }
      };
    }
    return division;
  });
  
  await update('tournaments', tournamentId, { divisions: updatedDivisions });
};

export const removeDivisionPaymentData = async (tournamentId, divisionId, memberId) => {
  const tournament = await read('tournaments', tournamentId);
  if (!tournament || !tournament.divisions) {
    throw new Error('Tournament or divisions not found');
  }
  
  const updatedDivisions = tournament.divisions.map(division => {
    if (division.id === divisionId) {
      const updatedPaymentData = { ...division.paymentData };
      delete updatedPaymentData[memberId];
      
      return {
        ...division,
        paymentData: updatedPaymentData
      };
    }
    return division;
  });
  
  await update('tournaments', tournamentId, { divisions: updatedDivisions });
};

// Legacy payment operations
export const updatePaymentData = async (collectionName, eventId, memberId, paymentInfo) => {
  const docRef = doc(db, collectionName, eventId);
  const paymentPath = `paymentData.${memberId}`;
  
  await updateDoc(docRef, {
    [paymentPath]: paymentInfo,
    updatedAt: serverTimestamp()
  });
};

export const removePaymentData = async (collectionName, eventId, memberId) => {
  const docRef = doc(db, collectionName, eventId);
  const event = await read(collectionName, eventId);
  
  if (event && event.paymentData) {
    const updatedPaymentData = { ...event.paymentData };
    delete updatedPaymentData[memberId];
    
    await updateDoc(docRef, {
      paymentData: updatedPaymentData,
      updatedAt: serverTimestamp()
    });
  }
};

// Cleanup operations for user deletion with division support
export const cleanupUserReferences = async (memberId, authUid) => {
  const batch = writeBatch(db);
  
  // Remove from tournaments (check divisions)
  const tournaments = await getAll('tournaments');
  tournaments.forEach(tournament => {
    let needsUpdate = false;
    let updatedDivisions = tournament.divisions;
    
    if (tournament.divisions && Array.isArray(tournament.divisions)) {
      // New division-based structure
      updatedDivisions = tournament.divisions.map(division => {
        if (division.participants?.includes(memberId)) {
          needsUpdate = true;
          const updatedParticipants = division.participants.filter(id => id !== memberId);
          const updatedPaymentData = { ...division.paymentData };
          delete updatedPaymentData[memberId];
          
          return {
            ...division,
            participants: updatedParticipants,
            paymentData: updatedPaymentData
          };
        }
        return division;
      });
    } else if (tournament.participants?.includes(memberId)) {
      // Legacy structure
      needsUpdate = true;
      const updatedParticipants = tournament.participants.filter(id => id !== memberId);
      const updatedPaymentData = { ...tournament.paymentData };
      delete updatedPaymentData[memberId];
      
      const docRef = doc(db, 'tournaments', tournament.id);
      batch.update(docRef, {
        participants: updatedParticipants,
        paymentData: updatedPaymentData,
        updatedAt: serverTimestamp()
      });
    }
    
    if (needsUpdate && tournament.divisions) {
      const docRef = doc(db, 'tournaments', tournament.id);
      batch.update(docRef, {
        divisions: updatedDivisions,
        updatedAt: serverTimestamp()
      });
    }
  });
  
  // Remove from leagues
  const leagues = await getUserLeagues(memberId);
  leagues.forEach(league => {
    const docRef = doc(db, 'leagues', league.id);
    const updatedParticipants = league.participants.filter(id => id !== memberId);
    const updatedPaymentData = { ...league.paymentData };
    delete updatedPaymentData[memberId];
    
    batch.update(docRef, {
      participants: updatedParticipants,
      paymentData: updatedPaymentData,
      updatedAt: serverTimestamp()
    });
  });
  
  await batch.commit();
};

// Division-specific operations
export const getDivisionParticipants = async (tournamentId, divisionId) => {
  const tournament = await read('tournaments', tournamentId);
  if (!tournament || !tournament.divisions) {
    return [];
  }
  
  const division = tournament.divisions.find(div => div.id === divisionId);
  return division?.participants || [];
};

export const updateDivisionData = async (tournamentId, divisionId, updates) => {
  const tournament = await read('tournaments', tournamentId);
  if (!tournament || !tournament.divisions) {
    throw new Error('Tournament or divisions not found');
  }
  
  const updatedDivisions = tournament.divisions.map(division => 
    division.id === divisionId ? { ...division, ...updates } : division
  );
  
  await update('tournaments', tournamentId, { divisions: updatedDivisions });
};

export const deleteDivision = async (tournamentId, divisionId) => {
  const tournament = await read('tournaments', tournamentId);
  if (!tournament || !tournament.divisions) {
    throw new Error('Tournament or divisions not found');
  }
  
  const updatedDivisions = tournament.divisions.filter(division => division.id !== divisionId);
  await update('tournaments', tournamentId, { divisions: updatedDivisions });
};

// Get tournaments by division criteria
export const getTournamentsByDivisionCriteria = async (criteria = {}) => {
  const tournaments = await getAll('tournaments');
  
  return tournaments.filter(tournament => {
    if (!tournament.divisions || tournament.divisions.length === 0) {
      return false;
    }
    
    return tournament.divisions.some(division => {
      let matches = true;
      
      if (criteria.eventType && division.eventType !== criteria.eventType) {
        matches = false;
      }
      
      if (criteria.skillLevel && division.skillLevel !== criteria.skillLevel) {
        matches = false;
      }
      
      if (criteria.hasEntryFee && !division.entryFee) {
        matches = false;
      }
      
      if (criteria.minParticipants && (division.participants?.length || 0) < criteria.minParticipants) {
        matches = false;
      }
      
      return matches;
    });
  });
};

// Get member participation summary across all divisions
export const getMemberParticipationSummary = async (memberId) => {
  const tournaments = await getUserTournaments(memberId);
  const leagues = await getUserLeagues(memberId);
  
  const divisionParticipation = [];
  let totalFees = 0;
  
  tournaments.forEach(tournament => {
    if (tournament.divisions) {
      tournament.divisions.forEach(division => {
        if (division.participants?.includes(memberId)) {
          divisionParticipation.push({
            tournamentId: tournament.id,
            tournamentName: tournament.name,
            divisionId: division.id,
            divisionName: division.name,
            eventType: division.eventType,
            skillLevel: division.skillLevel,
            entryFee: division.entryFee || 0,
            eventDate: tournament.eventDate
          });
          
          totalFees += division.entryFee || 0;
        }
      });
    }
  });
  
  leagues.forEach(league => {
    totalFees += league.registrationFee || 0;
  });
  
  return {
    tournaments: tournaments.length,
    leagues: leagues.length,
    divisions: divisionParticipation.length,
    totalFees,
    divisionDetails: divisionParticipation,
    leagueDetails: leagues.map(league => ({
      leagueId: league.id,
      leagueName: league.name,
      registrationFee: league.registrationFee || 0,
      startDate: league.startDate,
      endDate: league.endDate
    }))
  };
};

// =============================================================================
// NEW RESULTS-SPECIFIC OPERATIONS
// =============================================================================

// Get completed tournaments/leagues that need results
export const getCompletedEventsNeedingResults = async () => {
  const [tournaments, leagues, existingTournamentResults, existingLeagueResults] = await Promise.all([
    getAll('tournaments', { status: 'completed' }),
    getAll('leagues', { status: 'completed' }),
    getAll('tournamentDivisionResults'),
    getAll('leagueResults')
  ]);

  // Check which tournament divisions need results
  const tournamentsNeedingResults = tournaments.filter(tournament => {
    if (!tournament.divisions || tournament.divisions.length === 0) return false;
    
    return tournament.divisions.some(division => {
      const hasParticipants = division.participants && division.participants.length > 0;
      const hasExistingResult = existingTournamentResults.some(result => 
        result.tournamentId === tournament.id && result.divisionId === division.id
      );
      return hasParticipants && !hasExistingResult;
    });
  });

  // Check which leagues need results  
  const leaguesNeedingResults = leagues.filter(league => {
    const hasParticipants = league.participants && league.participants.length > 0;
    const hasExistingResult = existingLeagueResults.some(result => 
      result.leagueId === league.id
    );
    return hasParticipants && !hasExistingResult;
  });

  return {
    tournaments: tournamentsNeedingResults,
    leagues: leaguesNeedingResults,
    totalPending: tournamentsNeedingResults.length + leaguesNeedingResults.length
  };
};

// Get all results for a specific tournament
export const getTournamentResults = async (tournamentId) => {
  const results = await getAll('tournamentDivisionResults', { tournamentId });
  const tournament = await read('tournaments', tournamentId);
  
  if (!tournament) return null;

  // Enrich results with division details
  const enrichedResults = results.map(result => {
    const division = tournament.divisions?.find(div => div.id === result.divisionId);
    return {
      ...result,
      divisionName: division?.name || 'Unknown Division',
      eventType: division?.eventType,
      skillLevel: division?.skillLevel
    };
  });

  return {
    tournament,
    results: enrichedResults,
    totalDivisions: tournament.divisions?.length || 0,
    completedDivisions: results.length
  };
};

// Get all results for a specific league
export const getLeagueResults = async (leagueId) => {
  const results = await getAll('leagueResults', { leagueId });
  const league = await read('leagues', leagueId);
  
  return {
    league,
    results: results[0] || null // Should only be one result per league
  };
};

// Get member's results history
export const getMemberResultsHistory = async (memberId) => {
  // Get all tournament division results where member participated
  const allTournamentResults = await getAll('tournamentDivisionResults');
  const tournamentResults = [];
  
  for (const result of allTournamentResults) {
    const memberPosition = result.standings?.find(standing => standing.memberId === memberId);
    if (memberPosition) {
      const tournament = await read('tournaments', result.tournamentId);
      const division = tournament?.divisions?.find(div => div.id === result.divisionId);
      
      tournamentResults.push({
        ...result,
        tournamentName: tournament?.name,
        divisionName: division?.name,
        eventType: division?.eventType,
        skillLevel: division?.skillLevel,
        memberPosition: memberPosition.position,
        memberScore: memberPosition.score
      });
    }
  }

  // Get all league results where member participated
  const allLeagueResults = await getAll('leagueResults');
  const leagueResults = [];
  
  for (const result of allLeagueResults) {
    const memberStats = result.standings?.find(standing => standing.memberId === memberId);
    if (memberStats) {
      const league = await read('leagues', result.leagueId);
      
      leagueResults.push({
        ...result,
        leagueName: league?.name,
        memberPosition: memberStats.position,
        memberStats: {
          wins: memberStats.wins,
          losses: memberStats.losses,
          points: memberStats.points
        }
      });
    }
  }

  return {
    tournaments: tournamentResults.sort((a, b) => new Date(b.completedAt?.toDate?.() || b.completedAt) - new Date(a.completedAt?.toDate?.() || a.completedAt)),
    leagues: leagueResults.sort((a, b) => new Date(b.completedAt?.toDate?.() || b.completedAt) - new Date(a.completedAt?.toDate?.() || a.completedAt)),
    totalEvents: tournamentResults.length + leagueResults.length
  };
};

// Create tournament division result
export const createTournamentDivisionResult = async (resultData) => {
  const { tournamentId, divisionId, standings, notes } = resultData;
  
  // Validate tournament and division exist
  const tournament = await read('tournaments', tournamentId);
  if (!tournament) throw new Error('Tournament not found');
  
  const division = tournament.divisions?.find(div => div.id === divisionId);
  if (!division) throw new Error('Division not found');

  // Check if result already exists
  const existingResults = await getAll('tournamentDivisionResults', { 
    tournamentId, 
    divisionId 
  });
  if (existingResults.length > 0) {
    throw new Error('Result already exists for this division');
  }

  const resultId = await create('tournamentDivisionResults', {
    tournamentId,
    divisionId,
    standings: standings.map((standing, index) => ({
      ...standing,
      position: standing.position || index + 1
    })),
    notes: notes || '',
    status: 'completed',
    completedAt: serverTimestamp()
  });

  return resultId;
};

// Create league result
export const createLeagueResult = async (resultData) => {
  const { leagueId, standings, notes } = resultData;
  
  // Validate league exists
  const league = await read('leagues', leagueId);
  if (!league) throw new Error('League not found');

  // Check if result already exists
  const existingResults = await getAll('leagueResults', { leagueId });
  if (existingResults.length > 0) {
    throw new Error('Result already exists for this league');
  }

  const resultId = await create('leagueResults', {
    leagueId,
    standings: standings.map((standing, index) => ({
      ...standing,
      position: standing.position || index + 1
    })),
    notes: notes || '',
    status: 'completed',
    completedAt: serverTimestamp()
  });

  return resultId;
};

// =============================================================================
// PLAYER PERFORMANCE OPERATIONS
// =============================================================================

// Get member's performance assessments
export const getMemberPerformanceHistory = async (memberId) => {
  const performances = await getAll('playerPerformances', { memberId });
  
  // Enrich with event details
  const enrichedPerformances = [];
  
  for (const performance of performances) {
    let eventDetails = {};
    
    if (performance.eventType === 'tournament') {
      const tournament = await read('tournaments', performance.eventId);
      const division = tournament?.divisions?.find(div => div.id === performance.divisionId);
      eventDetails = {
        eventName: tournament?.name,
        divisionName: division?.name,
        skillLevel: division?.skillLevel,
        eventDate: tournament?.eventDate
      };
    } else if (performance.eventType === 'league') {
      const league = await read('leagues', performance.eventId);
      eventDetails = {
        eventName: league?.name,
        eventDate: league?.startDate
      };
    }
    
    enrichedPerformances.push({
      ...performance,
      ...eventDetails
    });
  }

  return enrichedPerformances.sort((a, b) => 
    new Date(b.createdAt?.toDate?.() || b.createdAt) - new Date(a.createdAt?.toDate?.() || a.createdAt)
  );
};

// Create player performance assessment
export const createPlayerPerformance = async (performanceData) => {
  const { 
    memberId, 
    eventType, 
    eventId, 
    divisionId, 
    ratings, 
    strengths, 
    improvements, 
    goals 
  } = performanceData;

  // Validate event exists
  let eventExists = false;
  if (eventType === 'tournament') {
    const tournament = await read('tournaments', eventId);
    if (tournament && divisionId) {
      const division = tournament.divisions?.find(div => div.id === divisionId);
      eventExists = division?.participants?.includes(memberId);
    }
  } else if (eventType === 'league') {
    const league = await read('leagues', eventId);
    eventExists = league?.participants?.includes(memberId);
  }

  if (!eventExists) {
    throw new Error('Member did not participate in this event');
  }

  // Check if assessment already exists
  const existingPerformances = await getAll('playerPerformances', {
    memberId,
    eventType,
    eventId,
    ...(divisionId && { divisionId })
  });

  if (existingPerformances.length > 0) {
    throw new Error('Performance assessment already exists for this event');
  }

  const performanceId = await create('playerPerformances', {
    memberId,
    eventType,
    eventId,
    ...(divisionId && { divisionId }),
    ratings,
    strengths: strengths || [],
    improvements: improvements || [],
    goals: goals || []
  });

  return performanceId;
};

// Update player performance assessment
export const updatePlayerPerformance = async (performanceId, updates) => {
  const performance = await read('playerPerformances', performanceId);
  if (!performance) {
    throw new Error('Performance assessment not found');
  }

  await update('playerPerformances', performanceId, updates);
};

// Get performance analytics for a member
export const getMemberPerformanceAnalytics = async (memberId) => {
  const performances = await getMemberPerformanceHistory(memberId);
  
  if (performances.length === 0) {
    return {
      totalAssessments: 0,
      averageRatings: {},
      improvementTrends: {},
      commonStrengths: [],
      commonImprovements: []
    };
  }

  // Calculate average ratings across all categories
  const ratingCategories = [
    'serve', 'return', 'netPlay', 'groundstrokes', 
    'strategy', 'movement', 'communication', 'mentalGame'
  ];
  
  const averageRatings = {};
  ratingCategories.forEach(category => {
    const ratings = performances
      .map(p => p.ratings?.[category])
      .filter(rating => rating !== undefined);
    
    if (ratings.length > 0) {
      averageRatings[category] = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
    }
  });

  // Calculate improvement trends (comparing first vs last 3 assessments)
  const improvementTrends = {};
  if (performances.length >= 4) {
    const recent = performances.slice(0, 3);
    const older = performances.slice(-3);
    
    ratingCategories.forEach(category => {
      const recentAvg = recent
        .map(p => p.ratings?.[category])
        .filter(r => r !== undefined)
        .reduce((sum, r, _, arr) => sum + r / arr.length, 0);
      
      const olderAvg = older
        .map(p => p.ratings?.[category])
        .filter(r => r !== undefined)
        .reduce((sum, r, _, arr) => sum + r / arr.length, 0);
      
      if (recentAvg && olderAvg) {
        improvementTrends[category] = ((recentAvg - olderAvg) / olderAvg) * 100;
      }
    });
  }

  // Find most common strengths and improvement areas
  const allStrengths = performances.flatMap(p => p.strengths || []);
  const allImprovements = performances.flatMap(p => p.improvements || []);
  
  const strengthCounts = {};
  const improvementCounts = {};
  
  allStrengths.forEach(strength => {
    strengthCounts[strength] = (strengthCounts[strength] || 0) + 1;
  });
  
  allImprovements.forEach(improvement => {
    improvementCounts[improvement] = (improvementCounts[improvement] || 0) + 1;
  });

  return {
    totalAssessments: performances.length,
    averageRatings,
    improvementTrends,
    commonStrengths: Object.entries(strengthCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([strength, count]) => ({ strength, count })),
    commonImprovements: Object.entries(improvementCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([improvement, count]) => ({ improvement, count }))
  };
};

// =============================================================================
// RESULTS ANALYTICS & REPORTING
// =============================================================================

// Get system-wide results statistics
export const getResultsAnalytics = async () => {
  const [tournamentResults, leagueResults, playerPerformances] = await Promise.all([
    getAll('tournamentDivisionResults'),
    getAll('leagueResults'),
    getAll('playerPerformances')
  ]);

  // Results completion rates
  const completedTournaments = await getAll('tournaments', { status: 'completed' });
  const completedLeagues = await getAll('leagues', { status: 'completed' });
  
  const tournamentDivisionsTotal = completedTournaments.reduce((sum, t) => 
    sum + (t.divisions?.length || 0), 0
  );
  
  const resultsCompletionRate = {
    tournamentDivisions: tournamentDivisionsTotal > 0 
      ? (tournamentResults.length / tournamentDivisionsTotal) * 100 
      : 0,
    leagues: completedLeagues.length > 0 
      ? (leagueResults.length / completedLeagues.length) * 100 
      : 0
  };

  // Performance assessment statistics
  const performanceStats = {
    totalAssessments: playerPerformances.length,
    uniqueMembers: new Set(playerPerformances.map(p => p.memberId)).size,
    averageAssessmentsPerMember: playerPerformances.length > 0 
      ? playerPerformances.length / new Set(playerPerformances.map(p => p.memberId)).size 
      : 0
  };

  // Recent activity (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentResults = [...tournamentResults, ...leagueResults].filter(result => {
    const completedDate = result.completedAt?.toDate?.() || new Date(result.completedAt);
    return completedDate >= thirtyDaysAgo;
  });

  const recentPerformances = playerPerformances.filter(performance => {
    const createdDate = performance.createdAt?.toDate?.() || new Date(performance.createdAt);
    return createdDate >= thirtyDaysAgo;
  });

  return {
    results: {
      total: tournamentResults.length + leagueResults.length,
      tournamentDivisions: tournamentResults.length,
      leagues: leagueResults.length,
      completionRates: resultsCompletionRate
    },
    performances: performanceStats,
    recentActivity: {
      newResults: recentResults.length,
      newPerformances: recentPerformances.length,
      period: '30 days'
    }
  };
};

// Search results by various criteria
export const searchResults = async (searchTerm, filters = {}) => {
  const [tournamentResults, leagueResults] = await Promise.all([
    getAll('tournamentDivisionResults'),
    getAll('leagueResults')
  ]);

  let filteredTournamentResults = tournamentResults;
  let filteredLeagueResults = leagueResults;

  // Apply status filter
  if (filters.status) {
    filteredTournamentResults = filteredTournamentResults.filter(r => r.status === filters.status);
    filteredLeagueResults = filteredLeagueResults.filter(r => r.status === filters.status);
  }

  // Apply date range filter
  if (filters.startDate || filters.endDate) {
    const startDate = filters.startDate ? new Date(filters.startDate) : new Date(0);
    const endDate = filters.endDate ? new Date(filters.endDate) : new Date();
    
    filteredTournamentResults = filteredTournamentResults.filter(result => {
      const date = result.completedAt?.toDate?.() || new Date(result.completedAt);
      return date >= startDate && date <= endDate;
    });
    
    filteredLeagueResults = filteredLeagueResults.filter(result => {
      const date = result.completedAt?.toDate?.() || new Date(result.completedAt);
      return date >= startDate && date <= endDate;
    });
  }

  // Apply text search if provided
  if (searchTerm) {
    const searchLower = searchTerm.toLowerCase();
    
    // For tournament results, we need to get tournament details to search names
    const enrichedTournamentResults = [];
    for (const result of filteredTournamentResults) {
      const tournament = await read('tournaments', result.tournamentId);
      const division = tournament?.divisions?.find(div => div.id === result.divisionId);
      
      const matches = 
        tournament?.name?.toLowerCase().includes(searchLower) ||
        division?.name?.toLowerCase().includes(searchLower) ||
        result.notes?.toLowerCase().includes(searchLower);
      
      if (matches) {
        enrichedTournamentResults.push({
          ...result,
          tournamentName: tournament?.name,
          divisionName: division?.name
        });
      }
    }
    
    // For league results, search league names
    const enrichedLeagueResults = [];
    for (const result of filteredLeagueResults) {
      const league = await read('leagues', result.leagueId);
      
      const matches = 
        league?.name?.toLowerCase().includes(searchLower) ||
        result.notes?.toLowerCase().includes(searchLower);
      
      if (matches) {
        enrichedLeagueResults.push({
          ...result,
          leagueName: league?.name
        });
      }
    }
    
    return {
      tournaments: enrichedTournamentResults,
      leagues: enrichedLeagueResults,
      total: enrichedTournamentResults.length + enrichedLeagueResults.length
    };
  }

  return {
    tournaments: filteredTournamentResults,
    leagues: filteredLeagueResults,
    total: filteredTournamentResults.length + filteredLeagueResults.length
  };
};

// =============================================================================
// TOURNAMENT STATUS AUTOMATION FUNCTIONS
// =============================================================================

// Bulk update tournament statuses with automatic status calculation
export const bulkUpdateTournamentStatuses = async (tournamentIds = null) => {
  try {
    console.log('Starting bulk tournament status update');
    
    // Get tournaments to check
    const tournaments = tournamentIds ? 
      await Promise.all(tournamentIds.map(id => read('tournaments', id))) :
      await getAll('tournaments');
    
    const batch = writeBatch(db);
    let updatedCount = 0;
    
    tournaments.forEach(tournament => {
      if (!tournament) return;
      
      const { getAutomaticTournamentStatus } = require('../utils/statusUtils');
      const suggestedStatus = getAutomaticTournamentStatus(tournament);
      
      if (suggestedStatus !== tournament.status) {
        console.log(`Bulk updating tournament ${tournament.name}: ${tournament.status} → ${suggestedStatus}`);
        
        const docRef = doc(db, 'tournaments', tournament.id);
        batch.update(docRef, {
          status: suggestedStatus,
          lastStatusUpdate: serverTimestamp(),
          statusUpdateReason: 'bulk_automation',
          updatedAt: serverTimestamp()
        });
        
        updatedCount++;
      }
    });
    
    if (updatedCount > 0) {
      await batch.commit();
      console.log(`✅ Bulk updated ${updatedCount} tournament statuses`);
    } else {
      console.log('No tournament status updates needed');
    }
    
    return { updatedCount, totalChecked: tournaments.length };
    
  } catch (error) {
    console.error('Error in bulk tournament status update:', error);
    throw new Error(`Bulk status update failed: ${error.message}`);
  }
};

// Subscribe to tournaments with automatic status checking
export const subscribeWithStatusAutomation = (callback, filters = {}) => {
  const { getAutomaticTournamentStatus } = require('../utils/statusUtils');
  
  return subscribe('tournaments', async (tournaments) => {
    // Call original callback first
    callback(tournaments);
    
    // Then check for automatic status updates (debounced)
    setTimeout(async () => {
      try {
        await bulkUpdateTournamentStatuses(tournaments.map(t => t.id));
      } catch (error) {
        console.error('Error in automated status check after data change:', error);
      }
    }, 2000); // 2 second delay to avoid rapid updates
    
  }, filters);
};

// Get tournaments that need status updates
export const getTournamentsNeedingStatusUpdates = async () => {
  try {
    const tournaments = await getAll('tournaments');
    const { getAutomaticTournamentStatus } = require('../utils/statusUtils');
    
    const needingUpdates = tournaments.filter(tournament => {
      const suggestedStatus = getAutomaticTournamentStatus(tournament);
      return suggestedStatus !== tournament.status;
    });
    
    return needingUpdates.map(tournament => ({
      id: tournament.id,
      name: tournament.name,
      currentStatus: tournament.status,
      suggestedStatus: getAutomaticTournamentStatus(tournament),
      lastUpdated: tournament.lastStatusUpdate || tournament.updatedAt
    }));
    
  } catch (error) {
    console.error('Error getting tournaments needing status updates:', error);
    throw new Error(`Failed to check tournament statuses: ${error.message}`);
  }
};

// =============================================================================
// UPDATED DEFAULT EXPORT (includes all existing + new functions)
// =============================================================================

export default {
  // Original CRUD operations
  create,
  read,
  update,
  remove,
  getAll,
  subscribe,
  subscribeToDoc,
  
  // User operations
  getUserMembers,
  getMemberByAuthUid,
  getUserTournaments,
  getUserLeagues,
  getAllUsersWithStats,
  
  // Batch operations
  batchUpdate,
  batchDelete,
  
  // Participant operations
  addParticipant,
  removeParticipant,
  addParticipantToDivision,
  removeParticipantFromDivision,
  
  // Event operations
  getEventsWithParticipant,
  searchMembers,
  searchEvents,
  getSystemStats,
  
  // Payment operations
  updatePaymentData,
  removePaymentData,
  updateDivisionPaymentData,
  removeDivisionPaymentData,
  
  // Cleanup operations
  cleanupUserReferences,
  
  // Division operations
  getDivisionParticipants,
  updateDivisionData,
  deleteDivision,
  getTournamentsByDivisionCriteria,
  getMemberParticipationSummary,
  
  // NEW: Results operations
  getCompletedEventsNeedingResults,
  getTournamentResults,
  getLeagueResults,
  getMemberResultsHistory,
  createTournamentDivisionResult,
  createLeagueResult,
  
  // NEW: Player performance operations
  getMemberPerformanceHistory,
  createPlayerPerformance,
  updatePlayerPerformance,
  getMemberPerformanceAnalytics,
  
  // NEW: Results analytics
  getResultsAnalytics,
  searchResults,
  
  // NEW: Tournament status automation
  bulkUpdateTournamentStatuses,
  subscribeWithStatusAutomation,
  getTournamentsNeedingStatusUpdates
};