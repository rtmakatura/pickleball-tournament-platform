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
          // Check if member record exists
          const member = await userManagement.getMemberByAuthUid(user.uid);
          
          if (member) {
            console.log('Member record found:', member.id);
            
            // Check if member is active
            if (!member.isActive) {
              console.log('Member account is deactivated');
              setMemberCheckComplete(false);
              setError('Your account has been deactivated. Please contact support.');
              // Don't sign out here - let user see the error message
            } else {
              setMemberCheckComplete(true);
              setError(null); // Clear any previous errors
            }
          } else {
            console.log('No member record found for user:', user.uid);
            setMemberCheckComplete(false);
            
            // ENHANCED: More helpful error message with recovery options
            setError(
              'Account setup incomplete. This can happen if registration was interrupted. ' +
              'Please try signing in again, or contact support if this problem persists.'
            );
          }
        } catch (err) {
          console.error('Error checking member record:', err);
          setMemberCheckComplete(false);
          
          // ENHANCED: Network vs. system errors
          if (err.code === 'permission-denied') {
            setError('Unable to access account information. Please check your internet connection and try again.');
          } else {
            setError('Failed to verify account status. Please refresh the page or contact support.');
          }
        }
      } else {
        setMemberCheckComplete(false);
        setError(null); // Clear errors when signed out
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
        console.error('User has Firebase auth but no member record:', result.user.uid);
        
        // ENHANCED: Attempt automatic recovery for limbo users
        try {
          console.log('Attempting to create missing member record...');
          await userManagement.createMemberFromAuth(result.user, {
            firstName: result.user.displayName?.split(' ')[0] || 'User',
            lastName: result.user.displayName?.split(' ').slice(1).join(' ') || 'Account',
            skillLevel: 'beginner' // Default skill level
          });
          
          console.log('Successfully recovered limbo user account');
          setMemberCheckComplete(true);
          return result;
          
        } catch (recoveryError) {
          console.error('Failed to recover limbo user:', recoveryError);
          await signOut(auth); // Sign out the user
          
          throw new Error(
            'Your account exists but is missing profile information. ' +
            'This can happen if registration was interrupted. ' +
            'Please contact support or try creating a new account with a different email.'
          );
        }
      }
      
      // Check if member account is active
      if (!member.isActive) {
        await signOut(auth);
        throw new Error('Your account has been deactivated. Please contact support for assistance.');
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
      
      // ENHANCED: Check both member records AND Firebase Auth
      const existingMembers = await userManagement.searchMembersByEmail(email);
      if (existingMembers.length > 0) {
        throw new Error('An account with this email already exists. Please sign in instead.');
      }
      
      let authUser = null;
      let memberCreated = false;
      
      try {
        // Create Firebase Auth account
        const result = await createUserWithEmailAndPassword(auth, email, password);
        authUser = result.user;
        
        // Update auth profile with display name
        const displayName = `${memberData.firstName} ${memberData.lastName}`;
        await updateProfile(authUser, { displayName });
        
        // Create corresponding member record
        await userManagement.createMemberFromAuth(authUser, {
          firstName: memberData.firstName,
          lastName: memberData.lastName,
          phoneNumber: memberData.phoneNumber || '',
          venmoHandle: memberData.venmoHandle || '',
          skillLevel: memberData.skillLevel
        });
        
        memberCreated = true;
        setMemberCheckComplete(true);
        return result;
        
      } catch (error) {
        console.error('Signup error:', error);
        
        // ENHANCED: Better cleanup and recovery logic
        if (authUser && !memberCreated) {
          console.log('Attempting to clean up orphaned auth account...');
          try {
            // Try to delete the auth account
            await authUser.delete();
            console.log('Successfully cleaned up auth account');
          } catch (deleteError) {
            console.error('Failed to delete auth account, user may be in limbo state:', deleteError);
            
            // CRITICAL: If cleanup fails, provide specific guidance
            if (deleteError.code === 'auth/requires-recent-login') {
              throw new Error(
                'Account creation failed and cleanup requires recent login. ' +
                'Please try refreshing the page and signing up again. ' +
                'If this problem persists, the email may already be in use.'
              );
            } else {
              throw new Error(
                'Account creation failed. If you see "email already in use" errors, ' +
                'please try signing in instead or contact support.'
              );
            }
          }
        }
        
        // Handle Firebase Auth errors specifically
        if (error.code === 'auth/email-already-in-use') {
          throw new Error(
            'This email is already registered. Please sign in instead, ' +
            'or use the "Forgot Password" option if you cannot remember your password.'
          );
        }
        
        throw error;
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