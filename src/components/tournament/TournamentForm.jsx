// src/components/tournament/TournamentForm.jsx
import React, { useState } from 'react';
import { Input, Select, Button, Alert } from '../ui';
import { SKILL_LEVELS, TOURNAMENT_STATUS } from '../../services/models';

/**
 * TournamentForm Component - For creating/editing tournaments
 * 
 * Props:
 * - tournament: object - Existing tournament data (for editing)
 * - onSubmit: function - Called when form is submitted
 * - onCancel: function - Called when form is cancelled
 * - loading: boolean - Whether form is submitting
 */
const TournamentForm = ({ 
  tournament = null, 
  onSubmit, 
  onCancel, 
  loading = false 
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
    maxParticipants: tournament?.maxParticipants || 32
  });

  const [errors, setErrors] = useState({});

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
          />

          <Input
            label="Max Participants"
            type="number"
            value={formData.maxParticipants}
            onChange={handleChange('maxParticipants')}
            error={errors.maxParticipants}
            min="1"
            placeholder="32"
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        
        <Button
          type="submit"
          loading={loading}
          disabled={loading}
        >
          {tournament ? 'Update Tournament' : 'Create Tournament'}
        </Button>
      </div>
    </form>
  );
};

export default TournamentForm;