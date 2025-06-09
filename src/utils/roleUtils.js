// src/utils/roleUtils.js
// Utility functions for role validation and permission checking

import { MEMBER_ROLES } from '../services/models';

/**
 * Get user's role from members array using auth UID
 */
export const getUserRole = (authUid, members = []) => {
  if (!authUid || !Array.isArray(members)) return null;
  
  const member = members.find(m => m.authUid === authUid);
  return member?.role || null;
};

/**
 * Get member record by auth UID
 */
export const getMemberByAuthUid = (authUid, members = []) => {
  if (!authUid || !Array.isArray(members)) return null;
  return members.find(m => m.authUid === authUid) || null;
};

/**
 * Check if user is an admin
 */
export const isAdmin = (authUid, members = []) => {
  const role = getUserRole(authUid, members);
  return role === MEMBER_ROLES.ADMIN;
};

/**
 * Check if user is an organizer or higher
 */
export const isOrganizer = (authUid, members = []) => {
  const role = getUserRole(authUid, members);
  return role === MEMBER_ROLES.ORGANIZER || role === MEMBER_ROLES.ADMIN;
};

/**
 * Check if user is authenticated member (has any role)
 */
export const isAuthenticatedMember = (authUid, members = []) => {
  return getUserRole(authUid, members) !== null;
};

/**
 * User Management Permissions
 */
export const canManageUsers = (authUid, members = []) => {
  return isAdmin(authUid, members);
};

export const canDeleteUser = (authUid, targetMember, members = []) => {
  if (!isAdmin(authUid, members)) return false;
  
  // Cannot delete yourself
  if (targetMember?.authUid === authUid) return false;
  
  // Cannot delete other admins (prevents admin lockout)
  if (targetMember?.role === MEMBER_ROLES.ADMIN) return false;
  
  return true;
};

export const canEditUserRoles = (authUid, targetMember, members = []) => {
  if (!isAdmin(authUid, members)) return false;
  
  // Cannot change your own role
  if (targetMember?.authUid === authUid) return false;
  
  return true;
};

/**
 * Tournament Management Permissions
 */
export const canManageTournaments = (authUid, members = []) => {
  return isOrganizer(authUid, members);
};

export const canCreateTournaments = (authUid, members = []) => {
  return isOrganizer(authUid, members);
};

export const canEditTournament = (authUid, tournament, members = []) => {
  // Admins and organizers can edit any tournament
  return isOrganizer(authUid, members);
};

export const canDeleteTournament = (authUid, tournament, members = []) => {
  // Only admins can delete tournaments
  return isAdmin(authUid, members);
};

/**
 * League Management Permissions
 */
export const canManageLeagues = (authUid, members = []) => {
  return isOrganizer(authUid, members);
};

export const canCreateLeagues = (authUid, members = []) => {
  return isOrganizer(authUid, members);
};

export const canEditLeague = (authUid, league, members = []) => {
  // Admins and organizers can edit any league
  return isOrganizer(authUid, members);
};

export const canDeleteLeague = (authUid, league, members = []) => {
  // Only admins can delete leagues
  return isAdmin(authUid, members);
};

/**
 * Member Management Permissions
 */
export const canEditMember = (authUid, targetMemberId, members = []) => {
  if (!authUid || !targetMemberId) return false;
  
  // Find target member
  const targetMember = members.find(m => m.id === targetMemberId);
  if (!targetMember) return false;
  
  // Users can edit their own profile
  if (targetMember.authUid === authUid) return true;
  
  // Admins can edit any member
  return isAdmin(authUid, members);
};

export const canDeleteMember = (authUid, targetMemberId, members = []) => {
  if (!authUid || !targetMemberId) return false;
  
  // Only admins can delete members
  if (!isAdmin(authUid, members)) return false;
  
  // Find target member
  const targetMember = members.find(m => m.id === targetMemberId);
  if (!targetMember) return false;
  
  // Cannot delete yourself
  if (targetMember.authUid === authUid) return false;
  
  // Cannot delete other admins
  if (targetMember.role === MEMBER_ROLES.ADMIN) return false;
  
  return true;
};

/**
 * Payment Management Permissions
 */
export const canManagePayments = (authUid, members = []) => {
  return isOrganizer(authUid, members);
};

export const canViewPaymentReports = (authUid, members = []) => {
  return isOrganizer(authUid, members);
};

/**
 * General Access Permissions
 */
export const canAccessAdminPanel = (authUid, members = []) => {
  return isAdmin(authUid, members);
};

export const canViewReports = (authUid, members = []) => {
  return isOrganizer(authUid, members);
};

export const canManageSystemSettings = (authUid, members = []) => {
  return isAdmin(authUid, members);
};

/**
 * Role hierarchy validation
 */
export const getRoleLevel = (role) => {
  const levels = {
    [MEMBER_ROLES.PLAYER]: 1,
    [MEMBER_ROLES.ORGANIZER]: 2,
    [MEMBER_ROLES.ADMIN]: 3
  };
  return levels[role] || 0;
};

export const hasMinimumRole = (userRole, minimumRole) => {
  return getRoleLevel(userRole) >= getRoleLevel(minimumRole);
};

export const canPromoteToRole = (promoterAuthUid, targetRole, members = []) => {
  const promoterRole = getUserRole(promoterAuthUid, members);
  
  // Only admins can promote users
  if (promoterRole !== MEMBER_ROLES.ADMIN) return false;
  
  // Cannot promote to admin level or higher than your own level
  if (targetRole === MEMBER_ROLES.ADMIN) return false;
  
  return true;
};

/**
 * Feature access checks
 */
export const canAccessFeature = (authUid, feature, members = []) => {
  const featurePermissions = {
    'user_management': () => canManageUsers(authUid, members),
    'tournament_management': () => canManageTournaments(authUid, members),
    'league_management': () => canManageLeagues(authUid, members),
    'payment_management': () => canManagePayments(authUid, members),
    'reports': () => canViewReports(authUid, members),
    'admin_panel': () => canAccessAdminPanel(authUid, members),
    'member_profiles': () => isAuthenticatedMember(authUid, members)
  };
  
  const permissionCheck = featurePermissions[feature];
  return permissionCheck ? permissionCheck() : false;
};

/**
 * Validate role assignment
 */
export const validateRoleAssignment = (assignerAuthUid, targetMemberId, newRole, members = []) => {
  const errors = [];
  
  // Check if assigner has permission
  if (!canManageUsers(assignerAuthUid, members)) {
    errors.push('You do not have permission to assign roles');
  }
  
  // Check if target member exists
  const targetMember = members.find(m => m.id === targetMemberId);
  if (!targetMember) {
    errors.push('Target member not found');
  }
  
  // Check if trying to assign invalid role
  if (!Object.values(MEMBER_ROLES).includes(newRole)) {
    errors.push('Invalid role specified');
  }
  
  // Check if trying to create another admin
  if (newRole === MEMBER_ROLES.ADMIN) {
    errors.push('Cannot assign admin role through this interface');
  }
  
  // Check if trying to modify own role
  if (targetMember?.authUid === assignerAuthUid) {
    errors.push('Cannot modify your own role');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Get available roles for assignment
 */
export const getAvailableRoles = (assignerAuthUid, members = []) => {
  if (!isAdmin(assignerAuthUid, members)) {
    return [];
  }
  
  // Admins can assign player and organizer roles
  return [
    { value: MEMBER_ROLES.PLAYER, label: 'Player' },
    { value: MEMBER_ROLES.ORGANIZER, label: 'Organizer' }
  ];
};

export default {
  getUserRole,
  getMemberByAuthUid,
  isAdmin,
  isOrganizer,
  isAuthenticatedMember,
  canManageUsers,
  canDeleteUser,
  canEditUserRoles,
  canManageTournaments,
  canCreateTournaments,
  canEditTournament,
  canDeleteTournament,
  canManageLeagues,
  canCreateLeagues,
  canEditLeague,
  canDeleteLeague,
  canEditMember,
  canDeleteMember,
  canManagePayments,
  canViewPaymentReports,
  canAccessAdminPanel,
  canViewReports,
  canManageSystemSettings,
  getRoleLevel,
  hasMinimumRole,
  canPromoteToRole,
  canAccessFeature,
  validateRoleAssignment,
  getAvailableRoles
};