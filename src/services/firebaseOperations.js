// src/services/firebaseOperations.js (UPDATED - Division Support)
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

// Basic CRUD operations (unchanged)
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

// Enhanced query operations (unchanged)
export const getAll = async (collectionName, filters = {}, orderField = null, limitCount = null) => {
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
};

// Real-time subscriptions with enhanced filtering (unchanged)
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

// User-specific operations (unchanged)
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

// UPDATED: Get user's tournaments with division support
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

// Get user's leagues (unchanged)
export const getUserLeagues = async (memberId) => {
  const leaguesRef = collection(db, 'leagues');
  const q = query(leaguesRef, where('participants', 'array-contains', memberId));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

// UPDATED: Admin operations with division support
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

// Batch operations for better performance (unchanged)
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

// UPDATED: Array operations for participants with division support
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

// UPDATED: Complex queries with division support
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

// UPDATED: Search operations with division support
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

// UPDATED: Analytics and reporting with division support
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

// UPDATED: Payment operations with division support
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

// Legacy payment operations (unchanged)
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

// UPDATED: Cleanup operations for user deletion with division support
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
  
  // Remove from leagues (unchanged)
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

// NEW: Division-specific operations
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

// NEW: Get tournaments by division criteria
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

// NEW: Get member participation summary across all divisions
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

export default {
  create,
  read,
  update,
  remove,
  getAll,
  subscribe,
  subscribeToDoc,
  getUserMembers,
  getMemberByAuthUid,
  getUserTournaments,
  getUserLeagues,
  getAllUsersWithStats,
  batchUpdate,
  batchDelete,
  addParticipant,
  removeParticipant,
  addParticipantToDivision,
  removeParticipantFromDivision,
  getEventsWithParticipant,
  searchMembers,
  searchEvents,
  getSystemStats,
  updatePaymentData,
  removePaymentData,
  updateDivisionPaymentData,
  removeDivisionPaymentData,
  cleanupUserReferences,
  getDivisionParticipants,
  updateDivisionData,
  deleteDivision,
  getTournamentsByDivisionCriteria,
  getMemberParticipationSummary
};