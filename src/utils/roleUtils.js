// src/utils/roleUtils.js (ENHANCED - Added Results Management Permissions)
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
 * NEW: Results Management Permissions
 */
export const canManageResults = (authUid, members = []) => {
  // Organizers and admins can manage results
  return isOrganizer(authUid, members);
};

export const canViewResults = (authUid, members = []) => {
  // All authenticated members can view published results
  return isAuthenticatedMember(authUid, members);
};

export const canEnterResults = (authUid, event, members = []) => {
  // Only organizers+ can enter results
  if (!isOrganizer(authUid, members)) return false;
  
  // Event must be completed to enter results
  return event?.status === 'completed';
};

export const canEditResults = (authUid, event, results, members = []) => {
  // Must be organizer+
  if (!isOrganizer(authUid, members)) return false;
  
  // Event must be completed
  if (event?.status !== 'completed') return false;
  
  // Can edit draft results
  if (results?.status === 'draft') return true;
  
  // Only admins can edit confirmed results
  return isAdmin(authUid, members);
};

export const canPublishResults = (authUid, event, results, members = []) => {
  // Must be organizer+
  if (!isOrganizer(authUid, members)) return false;
  
  // Event must be completed
  if (event?.status !== 'completed') return false;
  
  // Results must be in draft status
  return results?.status === 'draft';
};

export const canDeleteResults = (authUid, event, results, members = []) => {
  // Only admins can delete results
  if (!isAdmin(authUid, members)) return false;
  
  // Cannot delete published results without special confirmation
  if (results?.status === 'confirmed') {
    // This would require additional confirmation in the UI
    return true;
  }
  
  return true;
};

export const canConfirmOwnResults = (authUid, participantId, members = []) => {
  // Users can confirm their own results
  const member = getMemberByAuthUid(authUid, members);
  return member?.id === participantId;
};

export const canExportResults = (authUid, results, members = []) => {
  // Organizers+ can export any results
  if (isOrganizer(authUid, members)) return true;
  
  // Regular members can export published results they participated in
  if (results?.status === 'confirmed') {
    const member = getMemberByAuthUid(authUid, members);
    return results?.participantResults?.some(r => r.participantId === member?.id);
  }
  
  return false;
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
 * Feature access checks (enhanced with results features)
 */
export const canAccessFeature = (authUid, feature, members = []) => {
  const featurePermissions = {
    'user_management': () => canManageUsers(authUid, members),
    'tournament_management': () => canManageTournaments(authUid, members),
    'league_management': () => canManageLeagues(authUid, members),
    'payment_management': () => canManagePayments(authUid, members),
    'results_management': () => canManageResults(authUid, members),
    'results_viewing': () => canViewResults(authUid, members),
    'reports': () => canViewReports(authUid, members),
    'admin_panel': () => canAccessAdminPanel(authUid, members),
    'member_profiles': () => isAuthenticatedMember(authUid, members)
  };
  
  const permissionCheck = featurePermissions[feature];
  return permissionCheck ? permissionCheck() : false;
};

/**
 * NEW: Results-specific feature access
 */
export const canAccessResultsFeature = (authUid, feature, event, results, members = []) => {
  const resultFeaturePermissions = {
    'enter_results': () => canEnterResults(authUid, event, members),
    'edit_results': () => canEditResults(authUid, event, results, members),
    'publish_results': () => canPublishResults(authUid, event, results, members),
    'delete_results': () => canDeleteResults(authUid, event, results, members),
    'export_results': () => canExportResults(authUid, results, members),
    'view_results': () => canViewResults(authUid, members),
    'confirm_results': () => {
      // Can confirm if you're a participant
      const member = getMemberByAuthUid(authUid, members);
      return results?.participantResults?.some(r => r.participantId === member?.id);
    }
  };
  
  const permissionCheck = resultFeaturePermissions[feature];
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

/**
 * NEW: Get results permissions summary for a user
 */
export const getResultsPermissions = (authUid, event, results, members = []) => {
  return {
    canManage: canManageResults(authUid, members),
    canView: canViewResults(authUid, members),
    canEnter: canEnterResults(authUid, event, members),
    canEdit: canEditResults(authUid, event, results, members),
    canPublish: canPublishResults(authUid, event, results, members),
    canDelete: canDeleteResults(authUid, event, results, members),
    canExport: canExportResults(authUid, results, members),
    canConfirmOwn: (() => {
      const member = getMemberByAuthUid(authUid, members);
      return results?.participantResults?.some(r => r.participantId === member?.id);
    })()
  };
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
  getAvailableRoles,
  // NEW: Results permissions
  canManageResults,
  canViewResults,
  canEnterResults,
  canEditResults,
  canPublishResults,
  canDeleteResults,
  canConfirmOwnResults,
  canExportResults,
  canAccessResultsFeature,
  getResultsPermissions
};