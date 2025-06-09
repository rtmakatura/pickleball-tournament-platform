// src/components/admin/UserManagement.jsx
import React, { useState } from 'react';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Shield, 
  Mail, 
  Calendar,
  Search,
  Filter,
  MoreVertical,
  Trash2,
  Edit,
  Key
} from 'lucide-react';
import { Button, Input, Select, Card, Table, TableActions, Modal, Alert, ConfirmDialog } from '../ui';
import { useMembers, useAuth } from '../../hooks';
import { useUserManagement } from '../../hooks/useUserManagement';
import { MEMBER_ROLES, SKILL_LEVELS } from '../../services/models';
import { canManageUsers, canDeleteUser, canEditUserRoles } from '../../utils/roleUtils';

/**
 * UserManagement Component - Admin interface for managing users and members
 * Only accessible by admins
 */
const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const { members, loading: membersLoading } = useMembers();
  const { 
    deleteUserAccount, 
    updateUserRole, 
    resetUserPassword,
    loading: userManagementLoading 
  } = useUserManagement();

  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [newRole, setNewRole] = useState('');
  const [alert, setAlert] = useState(null);

  // Check admin permissions
  const canManage = canManageUsers(currentUser?.uid, members);
  
  if (!canManage) {
    return (
      <Card title="Access Denied">
        <Alert 
          type="error" 
          title="Insufficient Permissions" 
          message="You don't have permission to access user management." 
        />
      </Card>
    );
  }

  // Filter users based on search and filters
  const filteredMembers = members.filter(member => {
    const matchesSearch = !searchTerm || (
      `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const matchesRole = !roleFilter || member.role === roleFilter;
    const matchesStatus = !statusFilter || (
      statusFilter === 'active' ? member.isActive : !member.isActive
    );
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Show alert
  const showAlert = (type, title, message) => {
    setAlert({ type, title, message });
    setTimeout(() => setAlert(null), 5000);
  };

  // Handle role change
  const handleRoleChange = async () => {
    if (!selectedUser || !newRole) return;
    
    try {
      await updateUserRole(selectedUser.authUid, newRole);
      setShowRoleModal(false);
      setSelectedUser(null);
      setNewRole('');
      showAlert('success', 'Role Updated', `User role has been updated to ${newRole}`);
    } catch (error) {
      showAlert('error', 'Role Update Failed', error.message);
    }
  };

  // Handle user deletion
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      await deleteUserAccount(selectedUser.authUid);
      setShowDeleteConfirm(false);
      setSelectedUser(null);
      showAlert('success', 'User Deleted', 'User account and member record have been deleted');
    } catch (error) {
      showAlert('error', 'Deletion Failed', error.message);
    }
  };

  // Handle password reset
  const handlePasswordReset = async (member) => {
    try {
      await resetUserPassword(member.email);
      showAlert('success', 'Password Reset Sent', `Password reset email sent to ${member.email}`);
    } catch (error) {
      showAlert('error', 'Password Reset Failed', error.message);
    }
  };

  // Get user status badge
  const getStatusBadge = (member) => {
    if (!member.isActive) {
      return { color: 'bg-red-100 text-red-800', label: 'Inactive' };
    }
    if (member.role === MEMBER_ROLES.ADMIN) {
      return { color: 'bg-purple-100 text-purple-800', label: 'Admin' };
    }
    if (member.role === MEMBER_ROLES.ORGANIZER) {
      return { color: 'bg-blue-100 text-blue-800', label: 'Organizer' };
    }
    return { color: 'bg-green-100 text-green-800', label: 'Active Member' };
  };

  // Table columns
  const columns = [
    {
      key: 'user',
      label: 'User',
      render: (_, member) => (
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
            <Users className="h-5 w-5 text-gray-400" />
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {member.firstName} {member.lastName}
            </p>
            <p className="text-sm text-gray-500">{member.email}</p>
          </div>
        </div>
      )
    },
    {
      key: 'role',
      label: 'Role',
      render: (role) => (
        <div className="flex items-center space-x-2">
          {role === MEMBER_ROLES.ADMIN && <Shield className="h-4 w-4 text-purple-600" />}
          {role === MEMBER_ROLES.ORGANIZER && <UserCheck className="h-4 w-4 text-blue-600" />}
          {role === MEMBER_ROLES.PLAYER && <Users className="h-4 w-4 text-green-600" />}
          <span className="capitalize">{role}</span>
        </div>
      )
    },
    {
      key: 'skillLevel',
      label: 'Skill Level',
      render: (level) => <span className="capitalize">{level}</span>
    },
    {
      key: 'status',
      label: 'Status',
      render: (_, member) => {
        const status = getStatusBadge(member);
        return (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
            {status.label}
          </span>
        );
      }
    },
    {
      key: 'joinedDate',
      label: 'Joined',
      render: (_, member) => {
        if (!member.createdAt) return 'Unknown';
        const date = member.createdAt.seconds 
          ? new Date(member.createdAt.seconds * 1000)
          : new Date(member.createdAt);
        return date.toLocaleDateString();
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, member) => {
        const canDelete = canDeleteUser(currentUser?.uid, member, members);
        const canEditRole = canEditUserRoles(currentUser?.uid, member, members);
        
        const actions = [];
        
        if (canEditRole) {
          actions.push({
            label: 'Change Role',
            onClick: () => {
              setSelectedUser(member);
              setNewRole(member.role);
              setShowRoleModal(true);
            }
          });
        }
        
        actions.push({
          label: 'Reset Password',
          onClick: () => handlePasswordReset(member)
        });
        
        if (canDelete) {
          actions.push({
            label: 'Delete User',
            variant: 'danger',
            onClick: () => {
              setSelectedUser(member);
              setShowDeleteConfirm(true);
            }
          });
        }
        
        return <TableActions actions={actions} />;
      }
    }
  ];

  // Filter options
  const roleOptions = [
    { value: '', label: 'All Roles' },
    ...Object.entries(MEMBER_ROLES).map(([key, value]) => ({
      value,
      label: key.charAt(0) + key.slice(1).toLowerCase()
    }))
  ];

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
  ];

  return (
    <div className="space-y-6">
      {/* Alert */}
      {alert && (
        <Alert
          type={alert.type}
          title={alert.title}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Header */}
      <Card title="User Management" subtitle="Manage user accounts, roles, and permissions">
        {/* Filters and Search */}
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              options={roleOptions}
              placeholder="Filter by role"
            />
            
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={statusOptions}
              placeholder="Filter by status"
            />
            
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setRoleFilter('');
                setStatusFilter('');
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Users className="h-5 w-5 text-blue-600 mr-2" />
              <div>
                <p className="text-sm text-blue-600">Total Users</p>
                <p className="text-lg font-semibold text-blue-900">{members.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <UserCheck className="h-5 w-5 text-green-600 mr-2" />
              <div>
                <p className="text-sm text-green-600">Active Users</p>
                <p className="text-lg font-semibold text-green-900">
                  {members.filter(m => m.isActive).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Shield className="h-5 w-5 text-purple-600 mr-2" />
              <div>
                <p className="text-sm text-purple-600">Admins</p>
                <p className="text-lg font-semibold text-purple-900">
                  {members.filter(m => m.role === MEMBER_ROLES.ADMIN).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center">
              <UserX className="h-5 w-5 text-gray-600 mr-2" />
              <div>
                <p className="text-sm text-gray-600">Inactive</p>
                <p className="text-lg font-semibold text-gray-900">
                  {members.filter(m => !m.isActive).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <Table
          columns={columns}
          data={filteredMembers}
          loading={membersLoading}
          emptyMessage="No users found"
        />
      </Card>

      {/* Role Change Modal */}
      <Modal
        isOpen={showRoleModal}
        onClose={() => {
          setShowRoleModal(false);
          setSelectedUser(null);
          setNewRole('');
        }}
        title="Change User Role"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Change role for <strong>{selectedUser?.firstName} {selectedUser?.lastName}</strong>
            </p>
            
            <Select
              label="New Role"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              options={Object.entries(MEMBER_ROLES).map(([key, value]) => ({
                value,
                label: key.charAt(0) + key.slice(1).toLowerCase()
              }))}
              required
            />
          </div>
          
          <div className="flex space-x-3 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setShowRoleModal(false);
                setSelectedUser(null);
                setNewRole('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRoleChange}
              loading={userManagementLoading}
              disabled={!newRole || newRole === selectedUser?.role}
            >
              Update Role
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setSelectedUser(null);
        }}
        onConfirm={handleDeleteUser}
        title="Delete User Account"
        message={`Are you sure you want to delete ${selectedUser?.firstName} ${selectedUser?.lastName}? This will permanently delete their account and remove them from all tournaments and leagues. This action cannot be undone.`}
        confirmText="Delete User"
        cancelText="Keep User"
        type="danger"
        loading={userManagementLoading}
      />
    </div>
  );
};

export default UserManagement;