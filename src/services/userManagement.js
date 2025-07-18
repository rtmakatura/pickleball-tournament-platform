// src/services/userManagement.js (ENHANCED - Added email search function)
// Service for managing the integration between Firebase Auth and member records

import { 
  deleteUser, 
  sendPasswordResetEmail,
  updateProfile 
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  deleteDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { auth, db } from './firebase';
import firebaseOps from './firebaseOperations';
import { createMember, MEMBER_ROLES } from './models';

/**
 * Create a member record when user signs up
 */
export const createMemberFromAuth = async (user, additionalData = {}) => {
  try {
    // ENHANCED: Check for existing member record first
    const existingMember = await getMemberByAuthUid(user.uid);
    if (existingMember) {
      console.log('Member record already exists for user:', user.uid);
      return existingMember.id;
    }
    
    // ENHANCED: Check for email conflicts
    const emailConflicts = await searchMembersByEmail(user.email);
    if (emailConflicts.length > 0) {
      throw new Error(
        'A member record already exists with this email address. ' +
        'This may indicate a data inconsistency. Please contact support.'
      );
    }
    
    const memberData = createMember({
      authUid: user.uid,
      email: user.email,
      firstName: additionalData.firstName || 'New',
      lastName: additionalData.lastName || 'User',
      displayName: additionalData.displayName || `${additionalData.firstName || 'New'} ${additionalData.lastName || 'User'}`,
      phoneNumber: additionalData.phoneNumber || '',
      venmoHandle: additionalData.venmoHandle || '',
      skillLevel: additionalData.skillLevel || 'beginner',
      role: MEMBER_ROLES.PLAYER,
      isActive: true
    });

    const memberId = await firebaseOps.create('members', memberData);
    console.log('Successfully created member record:', memberId);
    return memberId;
  } catch (error) {
    console.error('Error creating member from auth:', error);
    throw new Error('Failed to create member profile: ' + error.message);
  }
};

/**
 * Get member record by auth UID
 */
export const getMemberByAuthUid = async (authUid) => {
  try {
    const membersRef = collection(db, 'members');
    const q = query(membersRef, where('authUid', '==', authUid));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    };
  } catch (error) {
    console.error('Error getting member by auth UID:', error);
    
    // Enhanced error handling for permission issues
    if (error.code === 'permission-denied') {
      console.error('🔒 Permission denied - check Firestore security rules');
      throw new Error('Database access denied. Please check your permissions.');
    }
    
    throw new Error('Failed to get member profile: ' + error.message);
  }
};

/**
 * NEW: Search for members by email address
 */
export const searchMembersByEmail = async (email) => {
  try {
    if (!email) return [];
    
    const membersRef = collection(db, 'members');
    const q = query(membersRef, where('email', '==', email.toLowerCase().trim()));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error searching members by email:', error);
    throw new Error('Failed to search members: ' + error.message);
  }
};

/**
 * NEW: Check if email is already in use
 */
export const isEmailInUse = async (email) => {
  try {
    const members = await searchMembersByEmail(email);
    return members.length > 0;
  } catch (error) {
    console.error('Error checking if email is in use:', error);
    return false; // Default to false to allow signup attempt
  }
};

/**
 * Update member role
 */
export const updateMemberRole = async (authUid, newRole) => {
  try {
    const member = await getMemberByAuthUid(authUid);
    if (!member) {
      throw new Error('Member not found');
    }
    
    await firebaseOps.update('members', member.id, {
      role: newRole
    });
    
    return true;
  } catch (error) {
    console.error('Error updating member role:', error);
    throw new Error('Failed to update member role: ' + error.message);
  }
};

/**
 * Delete user account and associated member record
 * Note: This requires admin privileges
 */
export const deleteUserAccount = async (authUid) => {
  try {
    // First, get the member record
    const member = await getMemberByAuthUid(authUid);
    if (!member) {
      throw new Error('Member not found');
    }
    
    // Create a batch for atomic operations
    const batch = writeBatch(db);
    
    // Remove member from all tournaments and leagues
    await removeUserFromEvents(authUid, batch);
    
    // Delete member record
    const memberRef = doc(db, 'members', member.id);
    batch.delete(memberRef);
    
    // Commit all deletions
    await batch.commit();
    
    // Note: Deleting the Firebase Auth user requires admin SDK on backend
    // For now, we'll just deactivate the member record
    // In production, this should trigger a cloud function to delete the auth user
    
    return true;
  } catch (error) {
    console.error('Error deleting user account:', error);
    throw new Error('Failed to delete user account: ' + error.message);
  }
};

/**
 * Remove user from all tournaments and leagues
 */
const removeUserFromEvents = async (authUid, batch = null) => {
  try {
    const shouldCommit = !batch;
    if (!batch) {
      batch = writeBatch(db);
    }
    
    // Get member record to find member ID
    const member = await getMemberByAuthUid(authUid);
    if (!member) return;
    
    // Remove from tournaments
    const tournamentsRef = collection(db, 'tournaments');
    const tournamentQuery = query(tournamentsRef, where('participants', 'array-contains', member.id));
    const tournamentSnapshot = await getDocs(tournamentQuery);
    
    tournamentSnapshot.docs.forEach(doc => {
      const tournament = doc.data();
      const updatedParticipants = tournament.participants.filter(id => id !== member.id);
      
      // Also clean up payment data
      const updatedPaymentData = { ...tournament.paymentData };
      delete updatedPaymentData[member.id];
      
      batch.update(doc.ref, {
        participants: updatedParticipants,
        paymentData: updatedPaymentData
      });
    });
    
    // Remove from leagues
    const leaguesRef = collection(db, 'leagues');
    const leagueQuery = query(leaguesRef, where('participants', 'array-contains', member.id));
    const leagueSnapshot = await getDocs(leagueQuery);
    
    leagueSnapshot.docs.forEach(doc => {
      const league = doc.data();
      const updatedParticipants = league.participants.filter(id => id !== member.id);
      
      // Also clean up payment data
      const updatedPaymentData = { ...league.paymentData };
      delete updatedPaymentData[member.id];
      
      batch.update(doc.ref, {
        participants: updatedParticipants,
        paymentData: updatedPaymentData
      });
    });
    
    if (shouldCommit) {
      await batch.commit();
    }
    
    return true;
  } catch (error) {
    console.error('Error removing user from events:', error);
    throw new Error('Failed to remove user from events: ' + error.message);
  }
};

/**
 * Send password reset email
 */
export const sendPasswordReset = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return true;
  } catch (error) {
    console.error('Error sending password reset:', error);
    throw new Error('Failed to send password reset email: ' + error.message);
  }
};

/**
 * Update user profile in both Auth and Member records
 */
export const updateUserProfile = async (authUid, profileData) => {
  try {
    const member = await getMemberByAuthUid(authUid);
    if (!member) {
      throw new Error('Member not found');
    }
    
    // Validate venmo handle if provided
    if (profileData.venmoHandle && !/^[a-zA-Z0-9_-]+$/.test(profileData.venmoHandle)) {
      throw new Error('Venmo handle can only contain letters, numbers, hyphens, and underscores');
    }
    
    // Update member record
    const memberUpdates = {
      firstName: profileData.firstName,
      lastName: profileData.lastName,
      displayName: `${profileData.firstName} ${profileData.lastName}`,
      phoneNumber: profileData.phoneNumber || '',
      venmoHandle: profileData.venmoHandle || '', // NEW: Include venmo handle
      skillLevel: profileData.skillLevel
    };
    
    await firebaseOps.update('members', member.id, memberUpdates);
    
    // Update auth profile if display name changed
    if (auth.currentUser && auth.currentUser.uid === authUid) {
      await updateProfile(auth.currentUser, {
        displayName: memberUpdates.displayName
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw new Error('Failed to update profile: ' + error.message);
  }
};

/**
 * Deactivate user account (soft delete)
 */
export const deactivateUser = async (authUid) => {
  try {
    const member = await getMemberByAuthUid(authUid);
    if (!member) {
      throw new Error('Member not found');
    }
    
    await firebaseOps.update('members', member.id, {
      isActive: false
    });
    
    return true;
  } catch (error) {
    console.error('Error deactivating user:', error);
    throw new Error('Failed to deactivate user: ' + error.message);
  }
};

/**
 * Reactivate user account
 */
export const reactivateUser = async (authUid) => {
  try {
    const member = await getMemberByAuthUid(authUid);
    if (!member) {
      throw new Error('Member not found');
    }
    
    await firebaseOps.update('members', member.id, {
      isActive: true
    });
    
    return true;
  } catch (error) {
    console.error('Error reactivating user:', error);
    throw new Error('Failed to reactivate user: ' + error.message);
  }
};

/**
 * Get user statistics
 */
export const getUserStats = async (authUid) => {
  try {
    const member = await getMemberByAuthUid(authUid);
    if (!member) {
      throw new Error('Member not found');
    }
    
    // Get tournaments user is participating in
    const tournamentsRef = collection(db, 'tournaments');
    const tournamentQuery = query(tournamentsRef, where('participants', 'array-contains', member.id));
    const tournamentSnapshot = await getDocs(tournamentQuery);
    
    // Get leagues user is participating in
    const leaguesRef = collection(db, 'leagues');
    const leagueQuery = query(leaguesRef, where('participants', 'array-contains', member.id));
    const leagueSnapshot = await getDocs(leagueQuery);
    
    return {
      tournamentsCount: tournamentSnapshot.size,
      leaguesCount: leagueSnapshot.size,
      memberSince: member.createdAt,
      role: member.role,
      skillLevel: member.skillLevel,
      venmoHandle: member.venmoHandle, // NEW: Include venmo handle in stats
      isActive: member.isActive
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    throw new Error('Failed to get user statistics: ' + error.message);
  }
};

/**
 * Validate user permissions for an action
 */
export const validateUserPermission = async (authUid, action, targetId = null) => {
  try {
    const member = await getMemberByAuthUid(authUid);
    if (!member) {
      return { allowed: false, reason: 'User not found' };
    }
    
    if (!member.isActive) {
      return { allowed: false, reason: 'User account is inactive' };
    }
    
    // Check role-based permissions
    const rolePermissions = {
      [MEMBER_ROLES.ADMIN]: ['all'],
      [MEMBER_ROLES.ORGANIZER]: ['manage_tournaments', 'manage_leagues', 'view_reports'],
      [MEMBER_ROLES.PLAYER]: ['view_tournaments', 'view_leagues', 'edit_own_profile']
    };
    
    const userPermissions = rolePermissions[member.role] || [];
    
    if (userPermissions.includes('all') || userPermissions.includes(action)) {
      return { allowed: true };
    }
    
    // Special case for editing own profile
    if (action === 'edit_profile' && targetId === member.id) {
      return { allowed: true };
    }
    
    return { allowed: false, reason: 'Insufficient permissions' };
  } catch (error) {
    console.error('Error validating user permission:', error);
    return { allowed: false, reason: 'Permission validation failed' };
  }
};

/**
 * Get member by Venmo handle (for payment assistance)
 */
export const getMemberByVenmoHandle = async (venmoHandle) => {
  try {
    if (!venmoHandle) return null;
    
    const membersRef = collection(db, 'members');
    const q = query(membersRef, where('venmoHandle', '==', venmoHandle.replace('@', '')));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    };
  } catch (error) {
    console.error('Error getting member by venmo handle:', error);
    return null;
  }
};

/**
 * Search members by venmo handle (partial matching)
 */
export const searchMembersByVenmo = async (searchTerm) => {
  try {
    if (!searchTerm) return [];
    
    // Get all members with venmo handles
    const membersRef = collection(db, 'members');
    const querySnapshot = await getDocs(membersRef);
    
    const members = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Filter by venmo handle containing search term
    const cleanSearch = searchTerm.replace('@', '').toLowerCase();
    return members.filter(member => 
      member.venmoHandle && 
      member.venmoHandle.toLowerCase().includes(cleanSearch)
    );
  } catch (error) {
    console.error('Error searching members by venmo:', error);
    return [];
  }
};

export default {
  createMemberFromAuth,
  getMemberByAuthUid,
  searchMembersByEmail, // NEW
  isEmailInUse, // NEW
  updateMemberRole,
  deleteUserAccount,
  sendPasswordReset,
  updateUserProfile,
  deactivateUser,
  reactivateUser,
  getUserStats,
  validateUserPermission,
  getMemberByVenmoHandle,
  searchMembersByVenmo
};