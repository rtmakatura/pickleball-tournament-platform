// src/components/ui/RoleGuard.jsx
import React from 'react';
import { useRoles } from '../../hooks/useRoles';
import { Alert } from './Alert';

/**
 * RoleGuard Component - Conditionally renders content based on user roles and permissions
 * 
 * Props:
 * - children: React nodes - Content to render if permission check passes
 * - roles: array - Required roles (user must have at least one)
 * - permissions: array - Required permissions (user must have all)
 * - requireAll: boolean - If true, user must have ALL specified roles (default: false)
 * - fallback: React node - Content to show when access is denied
 * - showError: boolean - Whether to show error message when access denied
 * - errorTitle: string - Custom error title
 * - errorMessage: string - Custom error message
 */
const RoleGuard = ({
  children,
  roles = [],
  permissions = [],
  requireAll = false,
  fallback = null,
  showError = false,
  errorTitle = "Access Denied",
  errorMessage = "You don't have permission to view this content."
}) => {
  const { 
    currentRole, 
    permissions: userPermissions, 
    checkPermission,
    hasMinimumRole,
    loading 
  } = useRoles();

  // Show loading state while checking roles
  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
        <span className="ml-2 text-gray-600">Checking permissions...</span>
      </div>
    );
  }

  // Check role requirements
  let hasRequiredRole = true;
  if (roles.length > 0) {
    if (requireAll) {
      // User must have ALL specified roles (rare case)
      hasRequiredRole = roles.every(role => currentRole === role);
    } else {
      // User must have at least ONE of the specified roles
      hasRequiredRole = roles.includes(currentRole);
    }
  }

  // Check permission requirements
  let hasRequiredPermissions = true;
  if (permissions.length > 0) {
    hasRequiredPermissions = permissions.every(permission => 
      checkPermission(permission)
    );
  }

  // Check if user has access
  const hasAccess = hasRequiredRole && hasRequiredPermissions;

  if (!hasAccess) {
    // Show custom fallback if provided
    if (fallback) {
      return fallback;
    }

    // Show error message if requested
    if (showError) {
      return (
        <Alert
          type="error"
          title={errorTitle}
          message={errorMessage}
        />
      );
    }

    // Default: don't render anything
    return null;
  }

  // User has access, render children
  return <>{children}</>;
};

/**
 * AdminGuard - Shorthand for admin-only content
 */
export const AdminGuard = ({ children, fallback, showError = false }) => (
  <RoleGuard
    roles={['admin']}
    fallback={fallback}
    showError={showError}
    errorTitle="Admin Access Required"
    errorMessage="This section is only available to administrators."
  >
    {children}
  </RoleGuard>
);

/**
 * OrganizerGuard - Shorthand for organizer+ content
 */
export const OrganizerGuard = ({ children, fallback, showError = false }) => (
  <RoleGuard
    roles={['organizer', 'admin']}
    fallback={fallback}
    showError={showError}
    errorTitle="Organizer Access Required"
    errorMessage="This section is only available to organizers and administrators."
  >
    {children}
  </RoleGuard>
);

/**
 * PlayerGuard - Shorthand for any authenticated user content
 */
export const PlayerGuard = ({ children, fallback, showError = false }) => (
  <RoleGuard
    roles={['player', 'organizer', 'admin']}
    fallback={fallback}
    showError={showError}
    errorTitle="Login Required"
    errorMessage="Please log in to view this content."
  >
    {children}
  </RoleGuard>
);

/**
 * PermissionGuard - Check specific permissions
 */
export const PermissionGuard = ({ 
  children, 
  permissions = [], 
  fallback, 
  showError = false,
  errorMessage = "You don't have permission to perform this action."
}) => (
  <RoleGuard
    permissions={permissions}
    fallback={fallback}
    showError={showError}
    errorMessage={errorMessage}
  >
    {children}
  </RoleGuard>
);

/**
 * ConditionalRender - More flexible conditional rendering based on role checks
 */
export const ConditionalRender = ({ 
  when, 
  children, 
  fallback = null 
}) => {
  const roleHooks = useRoles();
  
  // Support function-based conditions
  const condition = typeof when === 'function' ? when(roleHooks) : when;
  
  return condition ? children : fallback;
};

export default RoleGuard;