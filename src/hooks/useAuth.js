// src/hooks/useAuth.js (FIXED - Prevent automatic account creation on sign-in)
import { useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { auth } from '../services/firebase';
import userManagement from '../services/userManagement';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [memberCheckComplete, setMemberCheckComplete] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        try {
          // Only check if member record exists, don't create one automatically
          const member = await userManagement.getMemberByAuthUid(user.uid);
          
          if (member) {
            console.log('Member record found:', member.id);
            setMemberCheckComplete(true);
          } else {
            console.log('No member record found for user - this should only happen for incomplete signups');
            // Don't create a member record automatically - this could indicate:
            // 1. User signed in but their signup process was incomplete
            // 2. User account exists but member creation failed during signup
            // 3. Data inconsistency
            setMemberCheckComplete(false);
            setError('Account setup incomplete. Please contact support or try signing up again.');
          }
        } catch (err) {
          console.error('Error checking member record:', err);
          setError('Failed to verify account status');
          setMemberCheckComplete(false);
        }
      } else {
        setMemberCheckComplete(false);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Verify that the user has a corresponding member record
      const member = await userManagement.getMemberByAuthUid(result.user.uid);
      if (!member) {
        // This shouldn't happen in a properly set up system
        await signOut(auth); // Sign out the user
        throw new Error('Account not properly set up. Please contact support or try signing up again.');
      }
      
      return result;
    } catch (err) {
      setLoading(false);
      setError(err.message);
      throw err;
    }
  };

  const signUp = async (email, password, memberData = {}) => {
    try {
      setError(null);
      setLoading(true);
      
      // Validate required member data
      if (!memberData.firstName || !memberData.lastName || !memberData.skillLevel) {
        throw new Error('First name, last name, and skill level are required');
      }
      
      // Check if email is already in use by checking member records first
      // This helps prevent Firebase auth account creation if member already exists
      const existingMembers = await userManagement.searchMembersByEmail(email);
      if (existingMembers.length > 0) {
        throw new Error('An account with this email already exists. Please sign in instead.');
      }
      
      // Create Firebase Auth account
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      try {
        // Update auth profile with display name
        const displayName = `${memberData.firstName} ${memberData.lastName}`;
        await updateProfile(result.user, { displayName });
        
        // Create corresponding member record
        await userManagement.createMemberFromAuth(result.user, {
          firstName: memberData.firstName,
          lastName: memberData.lastName,
          phoneNumber: memberData.phoneNumber || '',
          venmoHandle: memberData.venmoHandle || '',
          skillLevel: memberData.skillLevel
        });
        
        setMemberCheckComplete(true);
       
        return result;
      } catch (memberError) {
        // If member creation fails, we need to clean up the auth account
        console.error('Failed to create member record, cleaning up auth account:', memberError);
        try {
          await result.user.delete();
        } catch (deleteError) {
          console.error('Failed to clean up auth account:', deleteError);
        }
        setLoading(false); // CRITICAL FIX: Reset loading state
        setError('Failed to complete account setup. Please try again.');
        throw new Error('Failed to complete account setup. Please try again.');
      }
    } catch (err) {
      setLoading(false);
      setError(err.message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      setMemberCheckComplete(false);
      await signOut(auth);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Enhanced signup with member data (for the comprehensive signup form)
  const signUpWithProfile = async (signupData) => {
    const { email, password, memberData } = signupData;
    return signUp(email, password, memberData);
  };

  // Update user profile (both auth and member record)
  const updateUserProfile = async (profileData) => {
    if (!user) throw new Error('No authenticated user');
    
    try {
      setError(null);
      await userManagement.updateUserProfile(user.uid, profileData);
      
      // Update auth profile display name
      const displayName = `${profileData.firstName} ${profileData.lastName}`;
      await updateProfile(user, { displayName });
      
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Get current user's member record
  const getCurrentMember = async () => {
    if (!user) return null;
    
    try {
      return await userManagement.getMemberByAuthUid(user.uid);
    } catch (err) {
      console.error('Error getting current member:', err);
      return null;
    }
  };

  // Check if current user has specific permission
  const hasPermission = async (permission) => {
    if (!user) return false;
    
    try {
      const result = await userManagement.validateUserPermission(user.uid, permission);
      return result.allowed;
    } catch (err) {
      console.error('Error checking permission:', err);
      return false;
    }
  };

  return {
    user,
    loading,
    error,
    memberCheckComplete, // Indicates if member record check is complete and successful
    signIn,
    signUp,
    signUpWithProfile,
    logout,
    updateUserProfile,
    getCurrentMember,
    hasPermission,
    isAuthenticated: !!user && memberCheckComplete, // Only authenticated if both auth user exists AND member record exists
    // Convenience properties
    uid: user?.uid || null,
    email: user?.email || null,
    displayName: user?.displayName || null
  };
};

export default useAuth;