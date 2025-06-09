// src/components/member/MemberForm.jsx (ENHANCED - Added Venmo Handle)
import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Input, Select, Button, ConfirmDialog } from '../ui';
import { SKILL_LEVELS, MEMBER_ROLES } from '../../services/models';

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
  onDelete,
  loading = false,
  deleteLoading = false
}) => {
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  // Handle delete action
  const handleDelete = () => {
    if (onDelete) {
      onDelete(member.id);
    }
    setShowDeleteConfirm(false);
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">
          Personal Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="First Name"
            type="text"
            value={formData.firstName}
            onChange={handleChange('firstName')}
            error={errors.firstName}
            required
            placeholder="Enter first name"
          />

          <Input
            label="Last Name"
            type="text"
            value={formData.lastName}
            onChange={handleChange('lastName')}
            error={errors.lastName}
            required
            placeholder="Enter last name"
          />
        </div>

        <Input
          label="Email Address"
          type="email"
          value={formData.email}
          onChange={handleChange('email')}
          error={errors.email}
          required
          placeholder="Enter email address"
          helperText="Used for notifications and login"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Phone Number"
            type="tel"
            value={formData.phoneNumber}
            onChange={handleChange('phoneNumber')}
            error={errors.phoneNumber}
            placeholder="(555) 123-4567"
            helperText="Optional - for tournament communications"
          />

          <Input
            label="Venmo Handle"
            type="text"
            value={formData.venmoHandle}
            onChange={handleChange('venmoHandle')}
            error={errors.venmoHandle}
            placeholder="your-venmo"
            helperText="Optional - for payment collection"
          />
        </div>
      </div>

      {/* Pickleball Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">
          Pickleball Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Skill Level"
            value={formData.skillLevel}
            onChange={handleChange('skillLevel')}
            options={skillLevelOptions}
            error={errors.skillLevel}
            required
            helperText="Your current playing level"
          />

          <Select
            label="Role"
            value={formData.role}
            onChange={handleChange('role')}
            options={roleOptions}
            helperText="Role in tournaments and leagues"
          />
        </div>

        {/* Active status */}
        <div className="flex items-center">
          <input
            id="isActive"
            type="checkbox"
            checked={formData.isActive}
            onChange={handleChange('isActive')}
            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
          />
          <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
            Active member
          </label>
          <p className="ml-2 text-sm text-gray-500">
            (Inactive members won't appear in tournament registration)
          </p>
        </div>
      </div>

      {/* Payment Information */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Payment Information</h4>
        <p className="text-sm text-blue-800">
          Providing a Venmo handle makes it easier for organizers to collect payments and 
          for other participants to pay you back in group payment scenarios.
        </p>
      </div>

      {/* Form Actions */}
      <div className="flex justify-between items-center pt-6 border-t">
        {/* Delete button - only show when editing */}
        {member && onDelete && (
          <Button
            type="button"
            variant="danger"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={loading || deleteLoading}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Member
          </Button>
        )}
        
        {/* Main action buttons */}
        <div className={`flex space-x-3 ${member && onDelete ? '' : 'ml-auto'}`}>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading || deleteLoading}
          >
            Cancel
          </Button>
          
          <Button
            type="submit"
            loading={loading}
            disabled={loading || deleteLoading}
          >
            {member ? 'Update Member' : 'Add Member'}
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Member"
        message={`Are you sure you want to delete "${formData.firstName} ${formData.lastName}"? This action cannot be undone and will remove them from all tournaments and leagues.`}
        confirmText="Delete Member"
        cancelText="Keep Member"
        type="danger"
        loading={deleteLoading}
      />
    </form>
  );
};

export default MemberForm;