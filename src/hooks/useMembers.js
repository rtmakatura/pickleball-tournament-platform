// src/hooks/useMembers.js (UPDATED)
import { useState, useEffect } from 'react';
import firebaseOps from '../services/firebaseOperations';
import userManagement from '../services/userManagement';
import { createMember, MEMBER_ROLES } from '../services/models';

export const useMembers = (options = {}) => {
  const { 
    realTime = true, 
    filters = {},
    roleFilter = null,
    activeOnly = false 
  } = options;
  
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let unsubscribe;

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Build query filters
        const queryFilters = { ...filters };
        
        // Add role filter if specified
        if (roleFilter) {
          queryFilters.role = roleFilter;
        }
        
        // Add active filter if specified
        if (activeOnly) {
          queryFilters.isActive = true;
        }

        if (realTime) {
          unsubscribe = firebaseOps.subscribe('members', setMembers, queryFilters);
        } else {
          const data = await firebaseOps.getAll('members', queryFilters);
          setMembers(data);
        }
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [realTime, JSON.stringify(filters), roleFilter, activeOnly]);

  // Create member (admin only - now requires auth integration)
  const addMember = async (memberData) => {
    // Note: In the new system, members should only be created through auth signup
    // This function is kept for admin use but should rarely be used
    const member = createMember({
      ...memberData,
      // If no authUid provided, this is a legacy member creation
      authUid: memberData.authUid || null
    });
    return await firebaseOps.create('members', member);
  };

  // Update member
  const updateMember = async (id, updates) => {
    // Don't allow changing authUid through this method
    const { authUid, ...safeUpdates } = updates;
    await firebaseOps.update('members', id, safeUpdates);
  };

  // Delete member (admin only)
  const deleteMember = async (id) => {
    const member = members.find(m => m.id === id);
    if (member && member.authUid) {
      // If member has auth account, use user management service
      await userManagement.deleteUserAccount(member.authUid);
    } else {
      // Legacy member without auth account
      await firebaseOps.remove('members', id);
    }
  };

  // Get member by auth UID
  const getMemberByAuthUid = (authUid) => {
    return members.find(m => m.authUid === authUid) || null;
  };

  // Get authenticated members only
  const getAuthenticatedMembers = () => {
    return members.filter(m => m.authUid);
  };

  // Get members by role
  const getMembersByRole = (role) => {
    return members.filter(m => m.role === role);
  };

  // Get active members only
  const getActiveMembers = () => {
    return members.filter(m => m.isActive);
  };

  // Check if member exists by email
  const memberExistsByEmail = (email) => {
    return members.some(m => m.email.toLowerCase() === email.toLowerCase());
  };

  // Get member stats
  const getMemberStats = () => {
    const total = members.length;
    const active = members.filter(m => m.isActive).length;
    const authenticated = members.filter(m => m.authUid).length;
    const admins = members.filter(m => m.role === MEMBER_ROLES.ADMIN).length;
    const organizers = members.filter(m => m.role === MEMBER_ROLES.ORGANIZER).length;
    const players = members.filter(m => m.role === MEMBER_ROLES.PLAYER).length;

    return {
      total,
      active,
      inactive: total - active,
      authenticated,
      legacy: total - authenticated,
      admins,
      organizers,
      players,
      bySkillLevel: {
        beginner: members.filter(m => m.skillLevel === 'beginner').length,
        intermediate: members.filter(m => m.skillLevel === 'intermediate').length,
        advanced: members.filter(m => m.skillLevel === 'advanced').length,
        professional: members.filter(m => m.skillLevel === 'professional').length
      }
    };
  };

  // Update member role (admin only)
  const updateMemberRole = async (memberId, newRole) => {
    const member = members.find(m => m.id === memberId);
    if (!member) throw new Error('Member not found');
    
    if (member.authUid) {
      // Use user management service for authenticated members
      await userManagement.updateMemberRole(member.authUid, newRole);
    } else {
      // Direct update for legacy members
      await updateMember(memberId, { role: newRole });
    }
  };

  // Deactivate member
  const deactivateMember = async (memberId) => {
    const member = members.find(m => m.id === memberId);
    if (!member) throw new Error('Member not found');
    
    if (member.authUid) {
      await userManagement.deactivateUser(member.authUid);
    } else {
      await updateMember(memberId, { isActive: false });
    }
  };

  // Reactivate member
  const reactivateMember = async (memberId) => {
    const member = members.find(m => m.id === memberId);
    if (!member) throw new Error('Member not found');
    
    if (member.authUid) {
      await userManagement.reactivateUser(member.authUid);
    } else {
      await updateMember(memberId, { isActive: true });
    }
  };

  return {
    members,
    loading,
    error,
    addMember,
    updateMember,
    deleteMember,
    updateMemberRole,
    deactivateMember,
    reactivateMember,
    
    // Helper functions
    getMemberByAuthUid,
    getAuthenticatedMembers,
    getMembersByRole,
    getActiveMembers,
    memberExistsByEmail,
    getMemberStats,
    
    // Convenience getters
    authenticatedMembers: getAuthenticatedMembers(),
    activeMembers: getActiveMembers(),
    memberStats: getMemberStats()
  };
};

export default useMembers;