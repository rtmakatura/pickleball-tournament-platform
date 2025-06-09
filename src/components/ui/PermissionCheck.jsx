// src/components/ui/PermissionCheck.jsx
import React from 'react';
import { Shield, Lock, Eye, EyeOff } from 'lucide-react';
import { useRoles } from '../../hooks/useRoles';

/**
 * PermissionCheck Component - Utility component for checking and displaying permissions
 * 
 * Props:
 * - permission: string - Permission to check
 * - action: string - Action being performed (for display)
 * - target: string - Target of the action (for display)
 * - children: function - Render prop function that receives permission status
 * - fallback: React node - Content to show when permission is denied
 * - showReason: boolean - Whether to show why permission was denied
 */
const PermissionCheck = ({
  permission,
  action,
  target,
  children,
  fallback = null,
  showReason = false
}) => {
  const { 
    checkPermission, 
    currentRole, 
    isAdmin, 
    isOrganizer,
    loading 
  } = useRoles();

  if (loading) {
    return (
      <div className="inline-flex items-center text-gray-500">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-300 mr-2"></div>
        Checking...
      </div>
    );
  }

  const hasPermission = checkPermission(permission);
  
  // If children is a function, pass permission status to it
  if (typeof children === 'function') {
    return children({ 
      hasPermission, 
      currentRole, 
      isAdmin, 
      isOrganizer,
      reason: hasPermission ? null : getPermissionDeniedReason(permission, currentRole)
    });
  }

  // If permission granted, render children
  if (hasPermission) {
    return children || null;
  }

  // Permission denied - show fallback or reason
  if (showReason) {
    const reason = getPermissionDeniedReason(permission, currentRole);
    return (
      <div className="inline-flex items-center text-red-600">
        <Lock className="h-4 w-4 mr-1" />
        <span className="text-sm">{reason}</span>
      </div>
    );
  }

  return fallback;
};

/**
 * Get human-readable reason for permission denial
 */
const getPermissionDeniedReason = (permission, currentRole) => {
  const reasons = {
    canManageUsers: 'Admin access required',
    canManageTournaments: 'Organizer access required',
    canManageLeagues: 'Organizer access required',
    canManagePayments: 'Organizer access required',
    canAccessAdminPanel: 'Admin access required',
    canViewReports: 'Organizer access required',
    canDeleteMembers: 'Admin access required',
    canDeleteTournaments: 'Admin access required',
    canDeleteLeagues: 'Admin access required'
  };

  return reasons[permission] || `Insufficient permissions (current role: ${currentRole || 'none'})`;
};

/**
 * PermissionBadge - Shows a visual indicator of permission status
 */
export const PermissionBadge = ({ 
  permission, 
  label, 
  showLabel = true 
}) => {
  const { checkPermission, loading } = useRoles();

  if (loading) {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-500">
        <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-400 mr-1"></div>
        Checking...
      </span>
    );
  }

  const hasPermission = checkPermission(permission);
  
  return (
    <span className={`
      inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
      ${hasPermission 
        ? 'bg-green-100 text-green-800' 
        : 'bg-red-100 text-red-800'
      }
    `}>
      {hasPermission ? (
        <Eye className="h-3 w-3 mr-1" />
      ) : (
        <EyeOff className="h-3 w-3 mr-1" />
      )}
      {showLabel && (label || (hasPermission ? 'Allowed' : 'Denied'))}
    </span>
  );
};

/**
 * PermissionList - Shows a list of permissions and their status
 */
export const PermissionList = ({ 
  permissions = [],
  title = "Permissions",
  showAll = false 
}) => {
  const { checkPermission, loading } = useRoles();

  if (loading) {
    return (
      <div className="space-y-2">
        <h4 className="font-medium text-gray-900">{title}</h4>
        <div className="text-gray-500">Loading permissions...</div>
      </div>
    );
  }

  const permissionEntries = Object.entries(permissions);
  const visiblePermissions = showAll 
    ? permissionEntries 
    : permissionEntries.filter(([key]) => checkPermission(key));

  return (
    <div className="space-y-2">
      <h4 className="font-medium text-gray-900">{title}</h4>
      <div className="space-y-1">
        {visiblePermissions.map(([key, label]) => (
          <div key={key} className="flex items-center justify-between">
            <span className="text-sm text-gray-700">{label}</span>
            <PermissionBadge permission={key} showLabel={false} />
          </div>
        ))}
        {visiblePermissions.length === 0 && (
          <div className="text-sm text-gray-500">No permissions available</div>
        )}
      </div>
    </div>
  );
};

/**
 * RoleIndicator - Shows current user role with icon
 */
export const RoleIndicator = ({ 
  showRole = true,
  showIcon = true,
  className = "" 
}) => {
  const { currentRole, isAdmin, isOrganizer, loading } = useRoles();

  if (loading) {
    return (
      <span className={`inline-flex items-center text-gray-500 ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-300"></div>
        {showRole && <span className="ml-1">Loading...</span>}
      </span>
    );
  }

  const getRoleConfig = (role) => {
    if (isAdmin) {
      return {
        icon: Shield,
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
        label: 'Admin'
      };
    }
    if (isOrganizer) {
      return {
        icon: Shield,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        label: 'Organizer'
      };
    }
    return {
      icon: Shield,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      label: 'Player'
    };
  };

  const config = getRoleConfig(currentRole);
  const Icon = config.icon;

  return (
    <span className={`
      inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
      ${config.bgColor} ${config.color} ${className}
    `}>
      {showIcon && <Icon className="h-3 w-3 mr-1" />}
      {showRole && config.label}
    </span>
  );
};

export default PermissionCheck;