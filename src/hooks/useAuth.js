// src/hooks/useAuth.js (UPDATED)
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email, password) => {
    try {
      setError(null);
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Verify that user has a corresponding member record
      const member = await userManagement.getMemberByAuthUid(result.user.uid);
      if (!member) {
        // If no member record exists, create one
        await userManagement.createMemberFromAuth(result.user, {
          firstName: 'Unknown',
          lastName: 'User'
        });
      }
      
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const signUp = async (email, password, memberData = {}) => {
    try {
      setError(null);
      
      // Create Firebase Auth account
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update auth profile with display name
      const displayName = `${memberData.firstName || 'New'} ${memberData.lastName || 'User'}`;
      await updateProfile(result.user, { displayName });
      
      // Create corresponding member record
      await userManagement.createMemberFromAuth(result.user, {
        firstName: memberData.firstName || 'New',
        lastName: memberData.lastName || 'User',
        phoneNumber: memberData.phoneNumber || '',
        skillLevel: memberData.skillLevel || 'beginner'
      });
      
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      setError(null);
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