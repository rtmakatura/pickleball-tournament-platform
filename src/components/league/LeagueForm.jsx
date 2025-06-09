// src/components/league/LeagueForm.jsx
import React, { useState } from 'react';
import { Input, Select, Button } from '../ui';
import { SKILL_LEVELS, LEAGUE_STATUS, PAYMENT_MODES } from '../../services/models';

/**
 * LeagueForm Component - For creating/editing leagues
 * 
 * Props:
 * - league: object - Existing league data (for editing)
 * - onSubmit: function - Called when form is submitted
 * - onCancel: function - Called when form is cancelled
 * - loading: boolean - Whether form is submitting
 */
const LeagueForm = ({ 
  league = null, 
  onSubmit, 
  onCancel, 
  loading = false 
}) => {
  // Form state - initialize with existing league data or defaults
  const [formData, setFormData] = useState({
    name: league?.name || '',
    description: league?.description || '',
    skillLevel: league?.skillLevel || '',
    status: league?.status || LEAGUE_STATUS.ACTIVE,
    startDate: league?.startDate ? new Date(league.startDate).toISOString().split('T')[0] : '',
    endDate: league?.endDate ? new Date(league.endDate).toISOString().split('T')[0] : '',
    maxParticipants: league?.maxParticipants || 20,
    registrationFee: league?.registrationFee || 0,
    paymentMode: league?.paymentMode || PAYMENT_MODES.INDIVIDUAL,
    isActive: league?.isActive !== false
  });

  const [errors, setErrors] = useState({});

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

    if (!formData.name.trim()) {
      newErrors.name = 'League name is required';
    }

    if (!formData.skillLevel) {
      newErrors.skillLevel = 'Skill level is required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (formData.registrationFee < 0) {
      newErrors.registrationFee = 'Registration fee cannot be negative';
    }

    if (formData.maxParticipants < 1) {
      newErrors.maxParticipants = 'Max participants must be at least 1';
    }

    // Check if end date is after start date
    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      
      if (endDate <= startDate) {
        newErrors.endDate = 'End date must be after start date';
      }
    }

    // Check if start date is in the future (only for new leagues)
    if (!league && formData.startDate) {
      const startDate = new Date(formData.startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (startDate < today) {
        newErrors.startDate = 'Start date should be today or in the future';
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
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
      registrationFee: parseFloat(formData.registrationFee),
      maxParticipants: parseInt(formData.maxParticipants)
    };

    onSubmit(submissionData);
  };

  // Skill level options for dropdown
  const skillLevelOptions = Object.entries(SKILL_LEVELS).map(([key, value]) => ({
    value,
    label: key.charAt(0) + key.slice(1).toLowerCase()
  }));

  // League status options
  const statusOptions = Object.entries(LEAGUE_STATUS).map(([key, value]) => ({
    value,
    label: key.charAt(0) + key.slice(1).toLowerCase()
  }));

  // Calculate league duration
  const calculateDuration = () => {
    if (!formData.startDate || !formData.endDate) return '';
    
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(diffDays / 7);
    const days = diffDays % 7;
    
    if (weeks === 0) {
      return `${days} day${days !== 1 ? 's' : ''}`;
    } else if (days === 0) {
      return `${weeks} week${weeks !== 1 ? 's' : ''}`;
    } else {
      return `${weeks} week${weeks !== 1 ? 's' : ''}, ${days} day${days !== 1 ? 's' : ''}`;
    }
  };

  // Calculate estimated total cost for group payment display
  const estimatedTotal = formData.registrationFee * formData.maxParticipants;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* League Basic Info */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">
          League Information
        </h3>
        
        <Input
          label="League Name"
          type="text"
          value={formData.name}
          onChange={handleChange('name')}
          error={errors.name}
          required
          placeholder="Enter league name"
        />

        <Input
          label="Description"
          type="text"
          value={formData.description}
          onChange={handleChange('description')}
          error={errors.description}
          placeholder="Brief description of the league"
          helperText="What's special about this league? Format, rules, etc."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Skill Level"
            value={formData.skillLevel}
            onChange={handleChange('skillLevel')}
            options={skillLevelOptions}
            error={errors.skillLevel}
            required
            helperText="Target skill level for participants"
          />

          <Select
            label="Status"
            value={formData.status}
            onChange={handleChange('status')}
            options={statusOptions}
            helperText="Current league status"
          />
        </div>
      </div>

      {/* League Schedule */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">
          Schedule & Duration
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Start Date"
            type="date"
            value={formData.startDate}
            onChange={handleChange('startDate')}
            error={errors.startDate}
            required
          />

          <Input
            label="End Date"
            type="date"
            value={formData.endDate}
            onChange={handleChange('endDate')}
            error={errors.endDate}
            required
          />
        </div>

        {/* Duration calculation */}
        {formData.startDate && formData.endDate && !errors.endDate && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>League Duration:</strong> {calculateDuration()}
            </p>
          </div>
        )}
      </div>

      {/* League Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">
          League Settings
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Registration Fee ($)"
            type="number"
            value={formData.registrationFee}
            onChange={handleChange('registrationFee')}
            error={errors.registrationFee}
            min="0"
            step="0.01"
            placeholder="0.00"
            helperText="Cost to join the league"
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
          placeholder="20"
          helperText="Maximum number of league members"
        />

        {/* Payment mode explanation for leagues */}
        {formData.registrationFee > 0 && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">League Payment Mode</h4>
            {formData.paymentMode === PAYMENT_MODES.INDIVIDUAL ? (
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Individual Payments:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Each participant pays their own ${formData.registrationFee} registration fee</li>
                  <li>Payment tracking is done per person</li>
                  <li>Best for casual leagues or when members prefer to pay separately</li>
                </ul>
              </div>
            ) : (
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Group Payment:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>One person pays ${estimatedTotal} for the entire league</li>
                  <li>Other participants reimburse that person directly</li>
                  <li>Simplified payment collection and tracking</li>
                  <li>Best for organized teams or when one person handles league finances</li>
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Active status checkbox */}
        <div className="flex items-center">
          <input
            id="isActive"
            type="checkbox"
            checked={formData.isActive}
            onChange={handleChange('isActive')}
            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
          />
          <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
            Active league
          </label>
          <p className="ml-2 text-sm text-gray-500">
            (Inactive leagues won't appear in registration lists)
          </p>
        </div>
      </div>

      {/* League Features Info */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-2">League Features</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Track weekly matches and standings</li>
          <li>• Manage player schedules and court assignments</li>
          <li>• Calculate rankings and statistics</li>
          <li>• Handle make-up games and cancellations</li>
        </ul>
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
          {league ? 'Update League' : 'Create League'}
        </Button>
      </div>
    </form>
  );
};

export default LeagueForm;