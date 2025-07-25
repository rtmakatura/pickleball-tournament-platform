// src/components/member/MemberForm.jsx (ENHANCED - Added Venmo Handle)
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Trash2, 
  User, 
  Trophy, 
  Shield, 
  ChevronDown, 
  Users, 
  DollarSign, 
  CheckCircle, 
  Calendar 
} from 'lucide-react';
import { Input, Select, Button, ConfirmDialog, Alert } from '../ui';

import { SKILL_LEVELS, MEMBER_ROLES } from '../../services/models';
import { useAuth } from '../../hooks/useAuth';
import { useMembers } from '../../hooks/useMembers';
import { canEditUserRoles } from '../../utils/roleUtils';

// MOBILE-OPTIMIZED: Enhanced member form styles with responsive spacing
const memberFormStyles = `
  /* Base form container - mobile-first */
  .member-form {
    -webkit-overflow-scrolling: touch;
    scroll-behavior: smooth;
  }
  
  /* MOBILE-FIRST: Responsive section spacing */
  .form-section {
    background: white;
    border-radius: 12px;
    border: 1px solid #e5e7eb;
    margin-bottom: 20px;
    overflow: visible;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  }
  
  /* ADDED: Special handling for form sections with dropdowns */
  .form-section-with-dropdown {
    background: white;
    border-radius: 12px;
    border: 1px solid #e5e7eb;
    margin-bottom: 12px;
    overflow: visible;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    position: relative;
    z-index: 10;
  }
  
  .form-section-with-dropdown .form-section-content {
    overflow: visible;
    position: relative;
    z-index: 10;
  }
  
  .form-section:last-child {
    margin-bottom: 0;
  }
  
  /* MOBILE-OPTIMIZED: Section headers */
  .form-section-header {
    padding: 16px;
    border-bottom: 1px solid #e5e7eb;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    cursor: pointer;
    transition: background-color 0.2s ease;
  }
  
  .form-section-header:active {
    background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
  }
  
  /* MOBILE-OPTIMIZED: Content padding */
  .form-section-content {
    padding: 20px 16px;
    overflow: visible;
  }
  
  /* MOBILE-OPTIMIZED: Input group spacing */
  .form-input-group {
    margin-bottom: 20px;
  }
  
  .form-input-group:last-child {
    margin-bottom: 0;
  }
  
  /* FIXED: Remove margin from grid children to prevent double spacing */
  .form-grid .form-input-group {
    margin-bottom: 0;
  }
  
  /* DESKTOP: Larger spacing for bigger screens */
  @media (min-width: 768px) {
    .form-section {
      border-radius: 16px;
      margin-bottom: 24px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }
    
    .form-section-with-dropdown {
      border-radius: 16px;
      margin-bottom: 24px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }
    
    .form-section-header {
      padding: 20px;
    }
    
    .form-section-content {
      padding: 24px;
    }
    
    .form-input-group {
      margin-bottom: 24px;
    }
  }
  
  /* Touch-optimized buttons */
  .form-touch-button {
    min-height: 52px;
    min-width: 52px;
    transition: all 0.2s ease;
    -webkit-tap-highlight-color: transparent;
    border-radius: 12px;
  }
  
  .form-touch-button:active {
    transform: scale(0.96);
  }
  
  /* MOBILE-OPTIMIZED: Responsive grid system */
  .form-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 20px;
    margin-bottom: 20px;
  }
  
  /* Remove margin from grid children to prevent double spacing */
  .form-grid .form-input-group {
    margin-bottom: 0;
  }
  
  @media (min-width: 640px) {
    .form-grid-sm {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  
  /* Progressive disclosure animations */
  .form-expandable {
    transition: max-height 0.3s ease-out, opacity 0.2s ease-out;
    overflow: hidden;
  }
  
  .form-expandable.collapsed {
    max-height: 0;
    opacity: 0;
  }
  
  .form-expandable.expanded {
    max-height: 2000px;
    opacity: 1;
  }
  
  /* MOBILE-OPTIMIZED: Member info card */
  .member-info-card {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    color: white;
    border-radius: 12px;
    padding: 12px;
    margin-bottom: 16px;
  }
  
  /* DESKTOP: Larger cards */
  @media (min-width: 768px) {
    .form-grid {
      gap: 24px;
      margin-bottom: 24px;
    }
    
    .member-info-card {
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 24px;
    }
  }
  
  /* MOBILE-OPTIMIZED: Member features info card styling */
  .member-features-card {
    background: linear-gradient(135deg, #059669 0%, #047857 100%);
    color: white;
    border-radius: 12px;
    padding: 12px;
    margin-bottom: 16px;
  }
  
  .member-features-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  @media (min-width: 768px) {
    .member-features-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
  }
  
  .member-feature-item {
    display: flex;
    align-items: center;
    font-size: 0.75rem;
    line-height: 1rem;
    opacity: 0.95;
  }
  
  .member-feature-icon {
    height: 0.875rem;
    width: 0.875rem;
    margin-right: 0.375rem;
    color: rgba(255, 255, 255, 0.9);
    flex-shrink: 0;
  }
  
  /* DESKTOP: Larger features card */
  @media (min-width: 768px) {
    .member-features-card {
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 24px;
    }
    
    .member-feature-item {
      font-size: 0.875rem;
      line-height: 1.25rem;
    }
    
    .member-feature-icon {
      height: 1rem;
      width: 1rem;
      margin-right: 0.5rem;
    }
  }
  
  /* Form actions section */
  .form-actions-section {
    background: #f9fafb;
    border-top: 1px solid #e5e7eb;
    padding: 20px 24px;
    margin: 0 -24px -24px -24px;
  }
  
  .form-actions-container {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .form-actions-container .form-touch-button {
    width: 100%;
    justify-content: center;
  }
  
  /* Admin warning section */
  .admin-warning-section {
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 24px;
  }
  
  /* Better checkbox and radio spacing */
  .form-checkbox-group {
    display: flex;
    align-items: center;
    padding: 12px 0;
  }
  
  .form-checkbox-group input[type="checkbox"] {
    margin-right: 12px;
    min-width: 16px;
    min-height: 16px;
  }
  
  .form-checkbox-group label {
    font-size: 16px;
    line-height: 1.5;
    margin: 0;
  }
  
  /* Helper text styling */
  .form-helper-text {
    font-size: 14px;
    color: #6b7280;
    margin-top: 4px;
    line-height: 1.4;
  }
  
  

  /* Responsive adjustments */
  @media (min-width: 640px) {
    .form-actions-container {
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
    }
    
    .form-actions-container .form-touch-button {
      width: auto;
    }
  }
`;

const StyleSheet = () => (
  <style dangerouslySetInnerHTML={{ __html: memberFormStyles }} />
);

/**
 * MemberForm Component - For creating/editing members
 * 
 * Props:
 * - member: object - Existing member data (for editing)
 * - onSubmit: function - Called when form is submitted
 * - onCancel: function - Called when form is cancelled
 * - onDelete: function - Called when member is deleted
 * - loading: boolean - Whether form is submitting
 * - deleteLoading: boolean - Whether delete is in progress
 */
const MemberForm = ({ 
  member = null, 
  onSubmit, 
  onCancel,
  loading = false,
  deleteLoading = false
}) => {
  // Mobile detection with proper initial state
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });
  
  // Mobile-conservative section expansion logic
  const getInitialSectionState = useCallback(() => {
    const isNewEntry = !member;
    
    if (!isMobile) {
      return {
        personal: true,
        pickleball: true,
        account: true
      };
    }
    
    // MOBILE: Start with only personal section expanded to save space
    return {
      personal: true,
      pickleball: false,
      account: false
    };
  }, [isMobile, member]);

  const [expandedSections, setExpandedSections] = useState(() => getInitialSectionState());

  // Form state - initialize with existing member data or defaults
  const [formData, setFormData] = useState({
    firstName: member?.firstName || '',
    lastName: member?.lastName || '',
    email: member?.email || '',
    phoneNumber: member?.phoneNumber || '',
    venmoHandle: member?.venmoHandle || '', // NEW: Venmo handle
    skillLevel: member?.skillLevel || '',
    role: member?.role || MEMBER_ROLES.PLAYER,
    isActive: member?.isActive !== false
  });

  const [errors, setErrors] = useState({});
  
  // ADDED: Help alert state management
  const [showHelpAlert, setShowHelpAlert] = useState(false);
  
  // Permission checking
  const { user } = useAuth();
  const { members, updateMember } = useMembers();
  
  // Get current member using the established pattern (moved up before useEffect)
  const currentMember = useMemo(() => 
    members.find(m => m.authUid === user?.uid), 
    [members, user?.uid]
  );
  
  const canEditRoles = canEditUserRoles(user?.uid, member, members);

  // ADDED: Show help alert when user loads (for new members only)
  useEffect(() => {
    const checkMemberPreferences = async () => {
      console.log('🚨 MemberForm Alert Check:', {
        member: !!member,
        memberId: member?.id,
        currentMember: !!currentMember,
        currentMemberId: currentMember?.id,
        memberData: currentMember
      });
      
      if (!member && currentMember) {
        try {
          // Check if member has dismissed the help alert
          const hideCreateMemberHelp = currentMember.hideCreateMemberHelp || false;
          const shouldShow = !hideCreateMemberHelp;
          
          console.log('🚨 Debug showHelpAlert useEffect (member-based):', {
            member: !!member,
            currentMember: !!currentMember,
            memberId: currentMember.id,
            hideCreateMemberHelp,
            shouldShow
          });
          
          setShowHelpAlert(shouldShow);
        } catch (error) {
          console.error('Error checking member preferences:', error);
          // Default to showing the alert if there's an error
          setShowHelpAlert(true);
        }
      } else {
        console.log('🚨 Alert NOT showing because:', {
          reason: member ? 'Editing existing member' : 'No current member found',
          member: !!member,
          currentMember: !!currentMember
        });
        setShowHelpAlert(false);
      }
    };

    checkMemberPreferences();
  }, [member, currentMember]);

  // Mobile detection effect
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Section state updates
  useEffect(() => {
    const newSectionState = getInitialSectionState();
    setExpandedSections(newSectionState);
  }, [getInitialSectionState]);

  // Section toggle
  const toggleSection = useCallback((section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  // ADDED: Help alert handlers for member creation
  const handleCloseHelpAlert = useCallback(() => {
    setShowHelpAlert(false);
  }, []);

  const handleDontShowAgain = useCallback(async () => {
    setShowHelpAlert(false);
    
    if (currentMember?.id) {
      try {
        // Update member document with preference
        await updateMember(currentMember.id, {
          hideCreateMemberHelp: true
        });
        console.log('Member preferences updated successfully');
      } catch (error) {
        console.error('Error updating member preferences:', error);
        // You could show an error message to the user here if desired
      }
    }
  }, [currentMember, updateMember]);

  // Handle input changes
  const handleChange = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.skillLevel) {
      newErrors.skillLevel = 'Skill level is required';
    }

    // Phone number validation (optional but must be valid if provided)
    if (formData.phoneNumber && !/^\+?[\d\s\-\(\)]{10,}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }

    // Venmo handle validation (optional but must be valid if provided)
    if (formData.venmoHandle && !/^[a-zA-Z0-9_-]+$/.test(formData.venmoHandle)) {
      newErrors.venmoHandle = 'Venmo handle can only contain letters, numbers, hyphens, and underscores';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Clean up phone number (remove spaces and special characters)
    const submissionData = {
      ...formData,
      phoneNumber: formData.phoneNumber.replace(/[\s\-\(\)]/g, ''),
      venmoHandle: formData.venmoHandle.trim(),
      displayName: `${formData.firstName} ${formData.lastName}`.trim()
    };

    onSubmit(submissionData);
  };

  // Header action handlers - matching TournamentForm pattern
  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSubmit(e);
  };

  // Skill level options for dropdown
  const skillLevelOptions = Object.entries(SKILL_LEVELS).map(([key, value]) => ({
    value,
    label: key.charAt(0) + key.slice(1).toLowerCase()
  }));

  // Role options
  const roleOptions = Object.entries(MEMBER_ROLES).map(([key, value]) => ({
    value,
    label: key.charAt(0) + key.slice(1).toLowerCase()
  }));

  // Cleanup effect to ensure scroll restoration
  useEffect(() => {
    return () => {
      // Failsafe: Ensure body scroll is restored if component unmounts
      setTimeout(() => {
        if (document.body.style.overflow === 'hidden') {
          const originalOverflow = document.body.dataset.originalOverflow || 'auto';
          document.body.style.overflow = originalOverflow;
          delete document.body.dataset.originalOverflow;
        }
      }, 50);
    };
  }, []);

  return (
    <div className="member-form">
      <StyleSheet />
      
      <div className="p-3 sm:p-6">
        {/* Help Alert for New Members */}
        {showHelpAlert && (
          <div className="mb-4">
            {/* Mobile: Compact alert */}
            <div className="block sm:hidden">
              <Alert 
                type="info" 
                title="Member Creation Tips"
                message={
                  <div className="text-sm">
                    <p className="mb-2">
                      Add contact details, skill level, and role assignments for new members.
                    </p>
                    <p className="text-xs text-blue-600">
                      💡 Flow: Personal info → Skill level → Save member
                    </p>
                  </div>
                }
                actions={
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={handleCloseHelpAlert}
                      className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Close
                    </button>
                    <button
                      onClick={handleDontShowAgain}
                      className="flex-1 px-3 py-2 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Don't show again
                    </button>
                  </div>
                }
              />
            </div>

            {/* Desktop: Full alert */}
            <div className="hidden sm:block">
              <Alert 
                type="info" 
                title="Creating a New Member"
                message={
                  <div className="space-y-3">
                    <p>
                      Adding a new member creates their profile with contact information, skill level, and role assignments. This profile will be used for tournament and league participation.
                    </p>
                    <p>
                      <strong>Example:</strong> Sarah joins as an Intermediate player. Once added, she can be assigned to tournament divisions, league teams, and receive notifications.
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                      <p className="font-medium mb-1 text-blue-900">💡 Typical Workflow:</p>
                      <p className="text-sm text-blue-800">Personal details → Skill level → Role assignment → Save member</p>
                    </div>
                  </div>
                }
                actions={
                  <div className="flex flex-col sm:flex-row gap-2 mt-4">
                    <button
                      onClick={handleCloseHelpAlert}
                      className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Close
                    </button>
                    <button
                      onClick={handleDontShowAgain}
                      className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Don't show this again
                    </button>
                  </div>
                }
              />
            </div>
          </div>
        )}

        <form id="member-form" onSubmit={handleFormSubmit}>
          {/* Personal Information Section */}
          <div className="form-section">
            <div 
              className="form-section-header"
              onClick={() => toggleSection('personal')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <User className="h-5 w-5 text-blue-600 mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                    <p className="text-sm text-gray-600 mt-1">Basic contact and identification details</p>
                  </div>
                </div>
                <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${expandedSections.personal ? 'rotate-180' : ''}`} />
              </div>
            </div>
            
            <div className={`form-expandable ${expandedSections.personal ? 'expanded' : 'collapsed'}`}>
              <div className="form-section-content">
                <div className={`form-input-group form-grid ${isMobile ? '' : 'form-grid-sm'}`}>
                  <div>
                    <Input
                      label="First Name"
                      type="text"
                      value={formData.firstName}
                      onChange={handleChange('firstName')}
                      error={errors.firstName}
                      required
                      placeholder="Enter first name"
                      disabled={loading}
                      className="text-lg"
                    />
                  </div>

                  <div>
                    <Input
                      label="Last Name"
                      type="text"
                      value={formData.lastName}
                      onChange={handleChange('lastName')}
                      error={errors.lastName}
                      required
                      placeholder="Enter last name"
                      disabled={loading}
                      className="text-lg"
                    />
                  </div>
                </div>

                <div className="form-input-group">
                  <Input
                    label="Email Address"
                    type="email"
                    value={formData.email}
                    onChange={handleChange('email')}
                    error={errors.email}
                    required
                    placeholder="Enter email address"
                    helperText="Used for notifications and login"
                    disabled={loading}
                  />
                </div>

                <div className={`form-input-group form-grid ${isMobile ? '' : 'form-grid-sm'}`}>
                  <div>
                    <Input
                      label="Phone Number"
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={handleChange('phoneNumber')}
                      error={errors.phoneNumber}
                      placeholder="(555) 123-4567"
                      helperText="Optional - for tournament communications"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <Input
                      label="Venmo Handle"
                      type="text"
                      value={formData.venmoHandle}
                      onChange={handleChange('venmoHandle')}
                      error={errors.venmoHandle}
                      placeholder="your-venmo"
                      helperText="Optional - for payment collection"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pickleball Information Section */}
          <div className="form-section">
            <div 
              className="form-section-header"
              onClick={() => toggleSection('pickleball')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Trophy className="h-5 w-5 text-yellow-600 mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Pickleball Information</h3>
                    <p className="text-sm text-gray-600 mt-1">Skill level and playing preferences</p>
                  </div>
                </div>
                <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${expandedSections.pickleball ? 'rotate-180' : ''}`} />
              </div>
            </div>
            
            <div className={`form-expandable ${expandedSections.pickleball ? 'expanded' : 'collapsed'}`}>
              <div className="form-section-content">
                <div className={`form-input-group form-grid ${isMobile ? '' : 'form-grid-sm'}`}>
                    <div className="dropdown-container">
                      <Select
                        label="Skill Level"
                        value={formData.skillLevel}
                        onChange={handleChange('skillLevel')}
                        options={skillLevelOptions}
                        error={errors.skillLevel}
                        required
                        helperText="Your current playing level"
                        disabled={loading}
                      />
                    </div>

                  {/* Role selection - Only visible to admins */}
                  {canEditRoles && (
                    <div className="dropdown-container">
                      <Select
                        label="Role"
                        value={formData.role}
                        onChange={handleChange('role')}
                        options={roleOptions}
                        helperText="Role in tournaments and leagues"
                        disabled={loading}
                      />
                    </div>
                  )}
                  
                  {/* Role display for non-admins */}
                  {!canEditRoles && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Role
                      </label>
                      <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-md">
                        <Shield className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900 capitalize">{formData.role}</span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          Contact admin to change
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Active status */}
                <div className="form-input-group">
                  <div className="form-checkbox-group">
                    <input
                      id="isActive"
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={handleChange('isActive')}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      disabled={loading}
                    />
                    <div>
                      <label htmlFor="isActive" className="block text-gray-900 font-medium">
                        Active member
                      </label>
                      <p className="form-helper-text">
                        Inactive members won't appear in tournament registration
                      </p>
                    </div>
                  </div>
                </div>

                
              </div>
            </div>
          </div>

          {/* Admin Account Management Section - Only show for admins when editing existing members */}
          {member && canEditRoles && (
            <div className="form-section">
              <div 
                className="form-section-header"
                onClick={() => toggleSection('account')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Shield className="h-5 w-5 text-red-600 mr-3" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Account Management</h3>
                      <p className="text-sm text-gray-600 mt-1">Administrative controls and member summary</p>
                    </div>
                  </div>
                  <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${expandedSections.account ? 'rotate-180' : ''}`} />
                </div>
              </div>
              
              <div className={`form-expandable ${expandedSections.account ? 'expanded' : 'collapsed'}`}>
                <div className="form-section-content">
                  {/* Member Summary */}
                  <div className="member-info-card">
                    <h4 className="text-lg font-semibold mb-4 flex items-center">
                      <Shield className="h-5 w-5 mr-2" />
                      Member Summary
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium opacity-90">Member Since:</span>
                        <p className="text-white">{member.createdAt ? new Date(member.createdAt.seconds * 1000).toLocaleDateString() : 'Unknown'}</p>
                      </div>
                      <div>
                        <span className="font-medium opacity-90">Status:</span>
                        <p className="text-white">{member.isActive ? 'Active' : 'Inactive'}</p>
                      </div>
                      <div>
                        <span className="font-medium opacity-90">Current Role:</span>
                        <p className="text-white capitalize">{member.role}</p>
                      </div>
                      <div>
                        <span className="font-medium opacity-90">Skill Level:</span>
                        <p className="text-white capitalize">{member.skillLevel}</p>
                      </div>
                    </div>
                  </div>

                  {/* Admin Actions */}
                  <div className="form-input-group">
                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                      <h4 className="text-sm font-medium text-red-900 mb-3 flex items-center">
                        <Shield className="h-4 w-4 mr-2" />
                        Administrative Actions
                      </h4>
                      <div className="space-y-3 text-sm">
                        <p className="text-red-800">
                          <strong>Role Management:</strong> You can modify this member's role using the Role dropdown in the Pickleball Information section above.
                        </p>
                        <p className="text-red-800">
                          <strong>Account Status:</strong> Use the "Active member" checkbox above to activate or deactivate this account.
                        </p>
                        <p className="text-red-800">
                          <strong>Full Account Deletion:</strong> Use the Delete Member button below to permanently remove this member and all their data.
                        </p>
                        <p className="text-red-700 bg-red-100 p-2 rounded text-xs">
                          ⚠️ Advanced user management (password resets, role changes, etc.) can be performed in the Admin → User Management section.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Member Benefits Section - Always show for new members */}
          {!member && (
            <div className="form-section">
              <div className="form-section-content">
                <div className="member-features-card">
                  <h4 className="text-lg font-semibold mb-3 flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Member Benefits & Features
                  </h4>
                  <div className="member-features-grid">
                    <div className="space-y-3">
                      <div className="member-feature-item">
                        <User className="member-feature-icon" />
                        Complete profile management with contact details
                      </div>
                      <div className="member-feature-item">
                        <Trophy className="member-feature-icon" />
                        Tournament and league participation tracking
                      </div>
                      <div className="member-feature-item">
                        <DollarSign className="member-feature-icon" />
                        Venmo integration for seamless payments
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="member-feature-item">
                        <Shield className="member-feature-icon" />
                        Secure account with role-based permissions
                      </div>
                      <div className="member-feature-item">
                        <CheckCircle className="member-feature-icon" />
                        Real-time updates on tournament status
                      </div>
                      <div className="member-feature-item">
                        <Calendar className="member-feature-icon" />
                        Event history and performance tracking
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>

        </div>
    </div>
  );
};
export default React.memo(MemberForm);