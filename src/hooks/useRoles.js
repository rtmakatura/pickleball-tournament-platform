// src/hooks/useRoles.js
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useMembers } from './useMembers';
import { MEMBER_ROLES } from '../services/models';
import { 
  getUserRole, 
  isAdmin, 
  isOrganizer, 
  canManageUsers,
  canManageTournaments,
  canManageLeagues,
  canEditMember,
  canDeleteMember
} from '../utils/roleUtils';

/**
 * useRoles Hook - Provides role checking and permission utilities
 * 
 * Returns:
 * - currentRole: string - Current user's role
 * - permissions: object - Permission flags for various actions
 * - checkPermission: function - Function to check specific permissions
 * - loading: boolean - Whether role data is loading
 */
export const useRoles = () => {
  const { user, isAuthenticated } = useAuth();
  const { members, loading: membersLoading } = useMembers();
  
  const [currentRole, setCurrentRole] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);

  // Update role and permissions when user or members change
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setCurrentRole(null);
      setPermissions({});
      setLoading(false);
      return;
    }

    if (membersLoading) {
      setLoading(true);
      return;
    }

    // Get current user's role
    const role = getUserRole(user.uid, members);
    setCurrentRole(role);

    // Calculate permissions
    const newPermissions = {
      // User management
      canManageUsers: canManageUsers(user.uid, members),
      
      // Tournament management
      canCreateTournaments: canManageTournaments(user.uid, members),
      canEditTournaments: canManageTournaments(user.uid, members),
      canDeleteTournaments: isAdmin(user.uid, members),
      
      // League management
      canCreateLeagues: canManageLeagues(user.uid, members),
      canEditLeagues: canManageLeagues(user.uid, members),
      canDeleteLeagues: isAdmin(user.uid, members),
      
      // Member management
      canViewAllMembers: true, // All authenticated users can view members
      canEditOwnProfile: isAuthenticated,
      canEditAnyMember: isAdmin(user.uid, members),
      canDeleteMembers: isAdmin(user.uid, members),
      
      // General permissions
      isAdmin: isAdmin(user.uid, members),
      isOrganizer: isOrganizer(user.uid, members),
      isPlayer: role === MEMBER_ROLES.PLAYER,
      
      // Payment management
      canManagePayments: canManageTournaments(user.uid, members) || canManageLeagues(user.uid, members),
      
      // System access
      canAccessAdminPanel: isAdmin(user.uid, members),
      canViewReports: isAdmin(user.uid, members) || isOrganizer(user.uid, members)
    };

    setPermissions(newPermissions);
    setLoading(false);
  }, [user, isAuthenticated, members, membersLoading]);

  // Function to check specific permissions
  const checkPermission = (permission) => {
    return permissions[permission] || false;
  };

  // Function to check if user can edit a specific member
  const canEditSpecificMember = (targetMemberId) => {
    if (!user || !targetMemberId) return false;
    
    // Users can always edit their own profile
    const targetMember = members.find(m => m.id === targetMemberId);
    if (targetMember?.authUid === user.uid) return true;
    
    // Admins can edit any member
    return canEditMember(user.uid, targetMemberId, members);
  };

  // Function to check if user can delete a specific member
  const canDeleteSpecificMember = (targetMemberId) => {
    if (!user || !targetMemberId) return false;
    return canDeleteMember(user.uid, targetMemberId, members);
  };

  // Function to get permission level for an action
  const getPermissionLevel = (action) => {
    const permissionLevels = {
      'manage_users': permissions.canManageUsers ? 'admin' : 'none',
      'manage_tournaments': permissions.canEditTournaments ? (permissions.isAdmin ? 'admin' : 'organizer') : 'none',
      'manage_leagues': permissions.canEditLeagues ? (permissions.isAdmin ? 'admin' : 'organizer') : 'none',
      'view_reports': permissions.canViewReports ? (permissions.isAdmin ? 'admin' : 'organizer') : 'none'
    };
    
    return permissionLevels[action] || 'none';
  };

  // Helper function to check if user has minimum role
  const hasMinimumRole = (minimumRole) => {
    const roleHierarchy = {
      [MEMBER_ROLES.PLAYER]: 1,
      [MEMBER_ROLES.ORGANIZER]: 2,
      [MEMBER_ROLES.ADMIN]: 3
    };
    
    const userRoleLevel = roleHierarchy[currentRole] || 0;
    const requiredLevel = roleHierarchy[minimumRole] || 0;
    
    return userRoleLevel >= requiredLevel;
  };

  return {
    currentRole,
    permissions,
    checkPermission,
    canEditSpecificMember,
    canDeleteSpecificMember,
    getPermissionLevel,
    hasMinimumRole,
    loading,
    
    // Convenience flags
    isAdmin: permissions.isAdmin || false,
    isOrganizer: permissions.isOrganizer || false,
    isPlayer: permissions.isPlayer || false,
    
    // Quick access to common permissions
    canManageUsers: permissions.canManageUsers || false,
    canManageTournaments: permissions.canEditTournaments || false,
    canManageLeagues: permissions.canEditLeagues || false,
    canAccessAdmin: permissions.canAccessAdminPanel || false
  };
};

export default useRoles;