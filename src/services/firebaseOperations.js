// src/services/firebaseOperations.js (UPDATED)
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
  let q = collection(db, collectionName);
  
  // Apply filters
  Object.entries(filters).forEach(([field, value]) => {
    if (value !== undefined && value !== null) {
      q = query(q, where(field, '==', value));
    }
  });
  
  // Apply ordering
  if (orderField) {
    q = query(q, orderBy(orderField));
  }
  
  // Apply limit
  if (limitCount) {
    q = query(q, limit(limitCount));
  }
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

// Real-time subscriptions with enhanced filtering
export const subscribe = (collectionName, callback, filters = {}, orderField = null) => {
  let q = collection(db, collectionName);
  
  // Apply filters
  Object.entries(filters).forEach(([field, value]) => {
    if (value !== undefined && value !== null) {
      q = query(q, where(field, '==', value));
    }
  });
  
  // Apply ordering
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

// Get user's tournaments
export const getUserTournaments = async (memberId) => {
  const tournamentsRef = collection(db, 'tournaments');
  const q = query(tournamentsRef, where('participants', 'array-contains', memberId));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
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

// Admin operations
export const getAllUsersWithStats = async () => {
  const members = await getAll('members');
  const tournaments = await getAll('tournaments');
  const leagues = await getAll('leagues');
  
  return members.map(member => {
    const memberTournaments = tournaments.filter(t => 
      t.participants?.includes(member.id)
    );
    const memberLeagues = leagues.filter(l => 
      l.participants?.includes(member.id)
    );
    
    return {
      ...member,
      stats: {
        tournamentsCount: memberTournaments.length,
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

// Array operations for participants
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

// Complex queries
export const getEventsWithParticipant = async (memberId) => {
  const tournaments = await getUserTournaments(memberId);
  const leagues = await getUserLeagues(memberId);
  
  return {
    tournaments,
    leagues,
    totalEvents: tournaments.length + leagues.length
  };
};

// Search operations
export const searchMembers = async (searchTerm, filters = {}) => {
  // Note: Firestore doesn't support full-text search natively
  // This is a basic implementation - consider using Algolia for production
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
    results.tournaments = tournaments.filter(t => 
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.location?.toLowerCase().includes(searchTerm.toLowerCase())
    );
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

// Analytics and reporting
export const getSystemStats = async () => {
  const [members, tournaments, leagues] = await Promise.all([
    getAll('members'),
    getAll('tournaments'),
    getAll('leagues')
  ]);
  
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
        professional: members.filter(m => m.skillLevel === 'professional').length
      }
    },
    tournaments: {
      total: tournaments.length,
      byStatus: {
        draft: tournaments.filter(t => t.status === 'draft').length,
        registrationOpen: tournaments.filter(t => t.status === 'registration_open').length,
        inProgress: tournaments.filter(t => t.status === 'in_progress').length,
        completed: tournaments.filter(t => t.status === 'completed').length
      }
    },
    leagues: {
      total: leagues.length,
      active: leagues.filter(l => l.status === 'active').length,
      completed: leagues.filter(l => l.status === 'completed').length
    }
  };
};

// Payment operations
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

// Cleanup operations for user deletion
export const cleanupUserReferences = async (memberId, authUid) => {
  const batch = writeBatch(db);
  
  // Remove from tournaments
  const tournaments = await getUserTournaments(memberId);
  tournaments.forEach(tournament => {
    const docRef = doc(db, 'tournaments', tournament.id);
    const updatedParticipants = tournament.participants.filter(id => id !== memberId);
    const updatedPaymentData = { ...tournament.paymentData };
    delete updatedPaymentData[memberId];
    
    batch.update(docRef, {
      participants: updatedParticipants,
      paymentData: updatedPaymentData,
      updatedAt: serverTimestamp()
    });
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
  getEventsWithParticipant,
  searchMembers,
  searchEvents,
  getSystemStats,
  updatePaymentData,
  removePaymentData,
  cleanupUserReferences
};