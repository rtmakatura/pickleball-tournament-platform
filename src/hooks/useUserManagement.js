// src/hooks/useUserManagement.js
import { useState } from 'react';
import userManagement from '../services/userManagement';

/**
 * useUserManagement Hook - Provides user management operations
 * 
 * Returns:
 * - deleteUserAccount: function - Delete a user account
 * - updateUserRole: function - Update user role
 * - resetUserPassword: function - Send password reset email
 * - deactivateUser: function - Deactivate user account
 * - reactivateUser: function - Reactivate user account
 * - updateUserProfile: function - Update user profile
 * - getUserStats: function - Get user statistics
 * - loading: boolean - Whether an operation is in progress
 * - error: string - Any error that occurred
 */
export const useUserManagement = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const executeOperation = async (operation, ...args) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await operation(...args);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteUserAccount = async (authUid) => {
    return executeOperation(userManagement.deleteUserAccount, authUid);
  };

  const updateUserRole = async (authUid, newRole) => {
    return executeOperation(userManagement.updateMemberRole, authUid, newRole);
  };

  const resetUserPassword = async (email) => {
    return executeOperation(userManagement.sendPasswordReset, email);
  };

  const deactivateUser = async (authUid) => {
    return executeOperation(userManagement.deactivateUser, authUid);
  };

  const reactivateUser = async (authUid) => {
    return executeOperation(userManagement.reactivateUser, authUid);
  };

  const updateUserProfile = async (authUid, profileData) => {
    return executeOperation(userManagement.updateUserProfile, authUid, profileData);
  };

  const getUserStats = async (authUid) => {
    return executeOperation(userManagement.getUserStats, authUid);
  };

  const getMemberByAuthUid = async (authUid) => {
    return executeOperation(userManagement.getMemberByAuthUid, authUid);
  };

  const validateUserPermission = async (authUid, action, targetId = null) => {
    return executeOperation(userManagement.validateUserPermission, authUid, action, targetId);
  };

  return {
    deleteUserAccount,
    updateUserRole,
    resetUserPassword,
    deactivateUser,
    reactivateUser,
    updateUserProfile,
    getUserStats,
    getMemberByAuthUid,
    validateUserPermission,
    loading,
    error,
    clearError: () => setError(null)
  };
};

export default useUserManagement;