// src/hooks/useAuth.js (FIXED - Prevent duplicate member creation)
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
          // Check if member record exists
          const member = await userManagement.getMemberByAuthUid(user.uid);
          
          if (!member) {
            console.log('No member record found for user, creating one...');
            // Only create if no member record exists
            await userManagement.createMemberFromAuth(user, {
              firstName: user.displayName?.split(' ')[0] || 'New',
              lastName: user.displayName?.split(' ')[1] || 'User'
            });
          } else {
            console.log('Member record found:', member.id);
          }
          
          setMemberCheckComplete(true);
        } catch (err) {
          console.error('Error checking/creating member record:', err);
          setError('Failed to setup user profile');
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
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Member check will happen in the auth state change listener
      // No need to check/create here to avoid duplicates
      
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const signUp = async (email, password, memberData = {}) => {
    try {
      setError(null);
      
      // Validate required member data
      if (!memberData.firstName || !memberData.lastName || !memberData.skillLevel) {
        throw new Error('First name, last name, and skill level are required');
      }
      
      // Create Firebase Auth account
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
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
    } catch (err) {
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

  // Enhanced signup with member data
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
    memberCheckComplete, // New: indicates if member record check is complete
    signIn,
    signUp,
    signUpWithProfile,
    logout,
    updateUserProfile,
    getCurrentMember,
    hasPermission,
    isAuthenticated: !!user,
    // Convenience properties
    uid: user?.uid || null,
    email: user?.email || null,
    displayName: user?.displayName || null
  };
};

export default useAuth;