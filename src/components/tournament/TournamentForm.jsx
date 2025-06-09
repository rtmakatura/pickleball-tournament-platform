// src/components/tournament/TournamentForm.jsx
import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Input, Select, Button, Alert, ConfirmDialog } from '../ui';
import { SKILL_LEVELS, TOURNAMENT_STATUS, PAYMENT_MODES } from '../../services/models';

/**
 * TournamentForm Component - For creating/editing tournaments
 * 
 * Props:
 * - tournament: object - Existing tournament data (for editing)
 * - onSubmit: function - Called when form is submitted
 * - onCancel: function - Called when form is cancelled
 * - onDelete: function - Called when tournament is deleted
 * - loading: boolean - Whether form is submitting
 * - deleteLoading: boolean - Whether delete is in progress
 */
const TournamentForm = ({ 
  tournament = null, 
  onSubmit, 
  onCancel, 
  onDelete,
  loading = false,
  deleteLoading = false
}) => {
  // Form state - initialize with existing tournament data or defaults
  const [formData, setFormData] = useState({
    name: tournament?.name || '',
    description: tournament?.description || '',
    skillLevel: tournament?.skillLevel || '',
    status: tournament?.status || TOURNAMENT_STATUS.DRAFT,
    eventDate: tournament?.eventDate ? new Date(tournament.eventDate).toISOString().split('T')[0] : '',
    registrationDeadline: tournament?.registrationDeadline ? new Date(tournament.registrationDeadline).toISOString().split('T')[0] : '',
    location: tournament?.location || '',
    entryFee: tournament?.entryFee || 0,
    maxParticipants: tournament?.maxParticipants || 32,
    paymentMode: tournament?.paymentMode || PAYMENT_MODES.INDIVIDUAL
  });

  const [errors, setErrors] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Handle input changes
  const handleChange = (field) => (e) => {
    const value = e.target.value;
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

    if (!formData.name.trim()) {
      newErrors.name = 'Tournament name is required';
    }

    if (!formData.skillLevel) {
      newErrors.skillLevel = 'Skill level is required';
    }

    if (!formData.eventDate) {
      newErrors.eventDate = 'Event date is required';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (formData.entryFee < 0) {
      newErrors.entryFee = 'Entry fee cannot be negative';
    }

    if (formData.maxParticipants < 1) {
      newErrors.maxParticipants = 'Max participants must be at least 1';
    }

    // Check if event date is in the future (only for new tournaments)
    if (!tournament && formData.eventDate) {
      const eventDate = new Date(formData.eventDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (eventDate < today) {
        newErrors.eventDate = 'Event date must be in the future';
      }
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

    // Convert date strings to Date objects
    const submissionData = {
      ...formData,
      eventDate: new Date(formData.eventDate),
      registrationDeadline: formData.registrationDeadline 
        ? new Date(formData.registrationDeadline) 
        : null,
      entryFee: parseFloat(formData.entryFee),
      maxParticipants: parseInt(formData.maxParticipants)
    };

    onSubmit(submissionData);
  };

  // Handle delete action
  const handleDelete = () => {
    if (onDelete) {
      onDelete(tournament.id);
    }
    setShowDeleteConfirm(false);
  };

  // Skill level options for dropdown
  const skillLevelOptions = Object.entries(SKILL_LEVELS).map(([key, value]) => ({
    value,
    label: key.charAt(0) + key.slice(1).toLowerCase()
  }));

  // Tournament status options
  const statusOptions = Object.entries(TOURNAMENT_STATUS).map(([key, value]) => ({
    value,
    label: key.split('_').map(word => 
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ')
  }));

  // Calculate estimated total cost for group payment display
  const estimatedTotal = formData.entryFee * formData.maxParticipants;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Tournament Basic Info */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">
          Tournament Information
        </h3>
        
        <Input
          label="Tournament Name"
          type="text"
          value={formData.name}
          onChange={handleChange('name')}
          error={errors.name}
          required
          placeholder="Enter tournament name"
        />

        <Input
          label="Description"
          type="text"
          value={formData.description}
          onChange={handleChange('description')}
          error={errors.description}
          placeholder="Brief description of the tournament"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Skill Level"
            value={formData.skillLevel}
            onChange={handleChange('skillLevel')}
            options={skillLevelOptions}
            error={errors.skillLevel}
            required
          />

          <Select
            label="Status"
            value={formData.status}
            onChange={handleChange('status')}
            options={statusOptions}
            helperText="Current tournament status"
          />
        </div>
      </div>

      {/* Tournament Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">
          Event Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Event Date"
            type="date"
            value={formData.eventDate}
            onChange={handleChange('eventDate')}
            error={errors.eventDate}
            required
          />

          <Input
            label="Registration Deadline"
            type="date"
            value={formData.registrationDeadline}
            onChange={handleChange('registrationDeadline')}
            error={errors.registrationDeadline}
            helperText="Optional - when registration closes"
          />
        </div>

        <Input
          label="Location"
          type="text"
          value={formData.location}
          onChange={handleChange('location')}
          error={errors.location}
          required
          placeholder="Tournament venue or location"
        />
      </div>

      {/* Payment Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">
          Payment Settings
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Entry Fee ($)"
            type="number"
            value={formData.entryFee}
            onChange={handleChange('entryFee')}
            error={errors.entryFee}
            min="0"
            step="0.01"
            placeholder="0.00"
            helperText="Cost per participant"
          />

          <Select
            label="Payment Mode"
            value={formData.paymentMode}
            onChange={handleChange('paymentMode')}
            options={[
              { value: PAYMENT_MODES.INDIVIDUAL, label: 'Individual Payments' },
              { value: PAYMENT_MODES.GROUP, label: 'Group Payment (One Payer)' }
            ]}
            helperText="How participants will handle payments"
          />
        </div>

        <Input
          label="Max Participants"
          type="number"
          value={formData.maxParticipants}
          onChange={handleChange('maxParticipants')}
          error={errors.maxParticipants}
          min="1"
          placeholder="32"
          helperText="Maximum number of tournament participants"
        />

        {/* Payment mode explanation */}
        {formData.entryFee > 0 && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Payment Mode Guide</h4>
            {formData.paymentMode === PAYMENT_MODES.INDIVIDUAL ? (
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Individual Payments:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Each participant pays their own ${formData.entryFee} entry fee</li>
                  <li>Payment tracking is done per person</li>
                  <li>Best for smaller groups or when participants prefer to pay separately</li>
                </ul>
              </div>
            ) : (
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Group Payment:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>One person pays the entire ${estimatedTotal} for all participants</li>
                  <li>Other participants reimburse the payer directly</li>
                  <li>Simplified payment collection and tracking</li>
                  <li>Best for organized groups or when one person wants to handle payments</li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex justify-between items-center pt-6 border-t">
        {/* Delete button - only show when editing */}
        {tournament && onDelete && (
          <Button
            type="button"
            variant="danger"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={loading || deleteLoading}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Tournament
          </Button>
        )}
        
        {/* Main action buttons */}
        <div className={`flex space-x-3 ${tournament && onDelete ? '' : 'ml-auto'}`}>
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
            {tournament ? 'Update Tournament' : 'Create Tournament'}
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Tournament"
        message={`Are you sure you want to delete "${formData.name}"? This action cannot be undone and will remove all associated data including participant registrations and payment information.`}
        confirmText="Delete Tournament"
        cancelText="Keep Tournament"
        type="danger"
        loading={deleteLoading}
      />
    </form>
  );
};

export default TournamentForm;