// src/components/tournament/TournamentForm.jsx (COMPLETELY FIXED - Nested Form & State Issues)
import React, { useState, useEffect, useCallback } from 'react';
import { Trash2, ExternalLink, MapPin, Plus, Edit3, Users, DollarSign, Trophy } from 'lucide-react';
import { Input, Select, Button, Alert, ConfirmDialog, Card, Modal } from '../ui';
import { 
  SKILL_LEVELS, 
  TOURNAMENT_STATUS, 
  PAYMENT_MODES, 
  EVENT_TYPES,
  DIVISION_STATUS,
  createTournamentDivision,
  validateDivision
} from '../../services/models';
import { formatWebsiteUrl, isValidUrl, generateGoogleMapsLink, openLinkSafely } from '../../utils/linkUtils';

/**
 * TournamentForm Component - COMPLETELY FIXED
 * Fixed Issues:
 * 1. Nested form conflicts causing page reloads
 * 2. State synchronization problems
 * 3. Modal state management
 * 4. Form submission handling
 * 5. Division updates now save immediately to database
 */
const TournamentForm = ({ 
  tournament = null, 
  onSubmit, 
  onCancel, 
  onDelete,
  onUpdateTournament, // NEW: Direct database update function
  loading = false,
  deleteLoading = false
}) => {
  // Helper function to safely convert date to string
  const formatDateForInput = (date) => {
    if (!date) return '';
    
    try {
      let dateObj;
      
      if (date.seconds) {
        dateObj = new Date(date.seconds * 1000);
      } else if (date instanceof Date) {
        dateObj = date;
      } else if (typeof date === 'string') {
        dateObj = new Date(date);
      } else if (typeof date === 'number') {
        dateObj = new Date(date);
      } else {
        console.warn('Unknown date format:', date);
        return '';
      }
      
      if (isNaN(dateObj.getTime())) {
        console.warn('Invalid date:', date);
        return '';
      }
      
      return dateObj.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error formatting date:', error, date);
      return '';
    }
  };

  // Initialize divisions from tournament data
  const initializeDivisions = useCallback((tournamentData = null) => {
    const sourceData = tournamentData || tournament;
    
    if (sourceData?.divisions && Array.isArray(sourceData.divisions)) {
      return [...sourceData.divisions]; // Create a copy to avoid mutation
    }
    
    // Legacy support: if tournament has old structure, create single division
    if (sourceData && (sourceData.skillLevel || sourceData.eventType || sourceData.entryFee >= 0)) {
      return [createTournamentDivision({
        name: `${sourceData.eventType || 'Mixed Doubles'} - ${sourceData.skillLevel || 'Open'}`,
        eventType: sourceData.eventType || EVENT_TYPES.MIXED_DOUBLES,
        skillLevel: sourceData.skillLevel || SKILL_LEVELS.INTERMEDIATE,
        entryFee: sourceData.entryFee || 0,
        maxParticipants: sourceData.maxParticipants || null,
        paymentMode: sourceData.paymentMode || PAYMENT_MODES.INDIVIDUAL,
        participants: sourceData.participants || [],
        paymentData: sourceData.paymentData || {}
      })];
    }
    
    // Default: single empty division
    return [createTournamentDivision({
      name: 'Main Division',
      eventType: EVENT_TYPES.MIXED_DOUBLES,
      skillLevel: SKILL_LEVELS.INTERMEDIATE
    })];
  }, [tournament]);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: TOURNAMENT_STATUS.DRAFT,
    eventDate: '',
    registrationDeadline: '',
    location: '',
    website: ''
  });

  const [divisions, setDivisions] = useState([]);
  const [errors, setErrors] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDivisionModal, setShowDivisionModal] = useState(false);
  const [editingDivisionIndex, setEditingDivisionIndex] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [divisionSaving, setDivisionSaving] = useState(false); // NEW: Track division save state

  // CRITICAL FIX: Proper state synchronization
  useEffect(() => {
    console.log('Tournament prop changed:', tournament?.id);
    
    if (tournament) {
      // Update form data
      const newFormData = {
        name: tournament.name || '',
        description: tournament.description || '',
        status: tournament.status || TOURNAMENT_STATUS.DRAFT,
        eventDate: formatDateForInput(tournament.eventDate),
        registrationDeadline: formatDateForInput(tournament.registrationDeadline),
        location: tournament.location || '',
        website: tournament.website || ''
      };
      
      console.log('Setting form data:', newFormData);
      setFormData(newFormData);
      
      // Update divisions - CRITICAL: Use callback to ensure we get fresh data
      const newDivisions = initializeDivisions(tournament);
      console.log('Setting divisions:', newDivisions);
      setDivisions(newDivisions);
    } else {
      // Reset form for new tournament
      setFormData({
        name: '',
        description: '',
        status: TOURNAMENT_STATUS.DRAFT,
        eventDate: '',
        registrationDeadline: '',
        location: '',
        website: ''
      });
      setDivisions(initializeDivisions(null));
    }
    
    // Clear errors and submission state
    setErrors({});
    setIsSubmitting(false);
  }, [tournament, initializeDivisions]);

  // Handle input changes
  const handleChange = useCallback((field) => (e) => {
    const value = e.target.value;
    console.log(`Field ${field} changed to:`, value);
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  }, [errors]);

  // FIXED: Division management with better state handling
  const addDivision = useCallback(() => {
    console.log('Adding new division');
    setEditingDivisionIndex(null);
    setShowDivisionModal(true);
  }, []);

  const editDivision = useCallback((index) => {
    console.log('Editing division at index:', index);
    setEditingDivisionIndex(index);
    setShowDivisionModal(true);
  }, []);

  const deleteDivision = useCallback(async (index) => {
    if (divisions.length > 1) {
      console.log('Deleting division at index:', index);
      
      setDivisionSaving(true);
      
      try {
        const updatedDivisions = divisions.filter((_, i) => i !== index);
        
        // Update local state
        setDivisions(updatedDivisions);
        
        // NEW: If editing existing tournament, save immediately to database
        if (tournament && tournament.id && onUpdateTournament) {
          console.log('Saving division deletion to database immediately');
          await onUpdateTournament(tournament.id, { divisions: updatedDivisions });
          console.log('Division deletion saved to database successfully');
        }
        
      } catch (error) {
        console.error('Error deleting division:', error);
        setErrors({ divisionDelete: `Failed to delete division: ${error.message}` });
        // Revert local state on error
        setDivisions(divisions);
      } finally {
        setDivisionSaving(false);
      }
    }
  }, [divisions, tournament, onUpdateTournament]);

  // CRITICAL FIX: Division save with immediate database update
  const handleDivisionSave = useCallback(async (divisionData) => {
    console.log('Saving division data:', divisionData, 'at index:', editingDivisionIndex);
    
    setDivisionSaving(true);
    
    try {
      let updatedDivisions;
      
      if (editingDivisionIndex !== null) {
        // Edit existing division
        updatedDivisions = divisions.map((div, index) => 
          index === editingDivisionIndex ? { ...div, ...divisionData } : div
        );
      } else {
        // Add new division
        const newDivision = createTournamentDivision(divisionData);
        updatedDivisions = [...divisions, newDivision];
      }
      
      // Update local state
      setDivisions(updatedDivisions);
      
      // NEW: If editing existing tournament, save immediately to database
      if (tournament && tournament.id && onUpdateTournament) {
        console.log('Saving division changes to database immediately');
        await onUpdateTournament(tournament.id, { divisions: updatedDivisions });
        console.log('Division changes saved to database successfully');
      }
      
      // Close modal
      setShowDivisionModal(false);
      setEditingDivisionIndex(null);
      
    } catch (error) {
      console.error('Error saving division:', error);
      setErrors({ divisionSave: `Failed to save division: ${error.message}` });
      // Don't close modal on error
    } finally {
      setDivisionSaving(false);
    }
  }, [editingDivisionIndex, divisions, tournament, onUpdateTournament]);

  // Enhanced form validation
  const validateForm = useCallback(() => {
    console.log('Validating tournament form');
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Tournament name is required';
    }

    if (!formData.eventDate) {
      newErrors.eventDate = 'Event date is required';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (formData.website && !isValidUrl(formData.website)) {
      newErrors.website = 'Please enter a valid website URL';
    }

    // Validate divisions
    if (divisions.length === 0) {
      newErrors.divisions = 'Tournament must have at least one division';
    } else {
      divisions.forEach((division, index) => {
        const divisionValidation = validateDivision(division);
        if (!divisionValidation.isValid) {
          newErrors[`division_${index}`] = `Division ${index + 1}: ${divisionValidation.errors.join(', ')}`;
        }
      });
    }

    console.log('Validation errors:', newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, divisions]);

  // CRITICAL FIX: Proper form submission handling
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Tournament form submission started');
    
    if (isSubmitting) {
      console.log('Already submitting, ignoring duplicate submission');
      return;
    }
    
    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const submissionData = {
        ...formData,
        eventDate: new Date(formData.eventDate),
        registrationDeadline: formData.registrationDeadline 
          ? new Date(formData.registrationDeadline) 
          : null,
        website: formData.website ? formatWebsiteUrl(formData.website) : '',
        divisions: divisions
      };

      console.log('Submitting tournament data:', submissionData);
      await onSubmit(submissionData);
      console.log('Tournament submission completed successfully');
      
    } catch (error) {
      console.error('Tournament submission error:', error);
      setErrors({ submit: error.message });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, divisions, isSubmitting, validateForm, onSubmit]);

  // Handle delete action
  const handleDelete = useCallback(async () => {
    if (onDelete && tournament) {
      try {
        console.log('Deleting tournament:', tournament.id);
        await onDelete(tournament.id);
      } catch (error) {
        console.error('Delete error:', error);
        setErrors({ delete: error.message });
      }
    }
    setShowDeleteConfirm(false);
  }, [onDelete, tournament]);

  // Handle link testing
  const handleTestWebsite = useCallback(() => {
    if (formData.website) {
      const formattedUrl = formatWebsiteUrl(formData.website);
      openLinkSafely(formattedUrl, 'Please enter a valid website URL first');
    }
  }, [formData.website]);

  const handleTestLocation = useCallback(() => {
    if (formData.location) {
      const mapsUrl = generateGoogleMapsLink(formData.location);
      openLinkSafely(mapsUrl, 'Please enter a location first');
    }
  }, [formData.location]);

  // Format display values
  const formatEventType = (eventType) => {
    return eventType.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  // Calculate summary stats
  const getTotalParticipants = useCallback(() => {
    return divisions.reduce((total, div) => total + (div.participants?.length || 0), 0);
  }, [divisions]);

  const getTotalExpected = useCallback(() => {
    return divisions.reduce((total, div) => {
      const participants = div.participants?.length || 0;
      const fee = div.entryFee || 0;
      return total + (participants * fee);
    }, 0);
  }, [divisions]);

  // Dropdown options
  const statusOptions = Object.entries(TOURNAMENT_STATUS).map(([key, value]) => ({
    value,
    label: key.split('_').map(word => 
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ')
  }));

  return (
    <div className="space-y-8">
      {/* Show submission errors */}
      {errors.submit && (
        <Alert type="error" title="Submission Error" message={errors.submit} />
      )}
      
      {errors.delete && (
        <Alert type="error" title="Delete Error" message={errors.delete} />
      )}
      
      {/* NEW: Show division save errors */}
      {errors.divisionSave && (
        <Alert type="error" title="Division Save Error" message={errors.divisionSave} onClose={() => setErrors(prev => ({ ...prev, divisionSave: null }))} />
      )}
      
      {errors.divisionDelete && (
        <Alert type="error" title="Division Delete Error" message={errors.divisionDelete} onClose={() => setErrors(prev => ({ ...prev, divisionDelete: null }))} />
      )}

      {/* CRITICAL: Single form element with proper submit handling */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Tournament Basic Info */}
        <Card title="Tournament Information">
          <div className="space-y-4">
            <Input
              label="Tournament Name"
              type="text"
              value={formData.name}
              onChange={handleChange('name')}
              error={errors.name}
              required
              placeholder="Enter tournament name"
              disabled={isSubmitting}
            />

            <Input
              label="Description"
              type="text"
              value={formData.description}
              onChange={handleChange('description')}
              placeholder="Brief description of the tournament"
              disabled={isSubmitting}
            />

            <Select
              label="Status"
              value={formData.status}
              onChange={handleChange('status')}
              options={statusOptions}
              helperText="Current tournament status"
              disabled={isSubmitting}
            />
          </div>
        </Card>

        {/* Tournament Details */}
        <Card title="Event Details">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Event Date"
                type="date"
                value={formData.eventDate}
                onChange={handleChange('eventDate')}
                error={errors.eventDate}
                required
                helperText="Tournament can be backdated if needed"
                disabled={isSubmitting}
              />

              <Input
                label="Registration Deadline"
                type="date"
                value={formData.registrationDeadline}
                onChange={handleChange('registrationDeadline')}
                helperText="Optional - when registration closes"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Input
                label="Location"
                type="text"
                value={formData.location}
                onChange={handleChange('location')}
                error={errors.location}
                required
                placeholder="Tournament venue or location"
                helperText="Enter venue name or full address for best mapping results"
                disabled={isSubmitting}
              />
              {formData.location && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleTestLocation}
                  className="mt-2"
                  disabled={isSubmitting}
                >
                  <MapPin className="h-4 w-4 mr-1" />
                  Preview Location on Map
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <Input
                label="Tournament Website"
                type="url"
                value={formData.website}
                onChange={handleChange('website')}
                error={errors.website}
                placeholder="https://example.com/tournament-info"
                helperText="Optional - Link to tournament registration, rules, or information page"
                disabled={isSubmitting}
              />
              {formData.website && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleTestWebsite}
                  className="mt-2"
                  disabled={isSubmitting}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Test Website Link
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Form Actions - MOVED BEFORE DIVISIONS to prevent nested form issues */}
        <div className="flex justify-between items-center pt-6 border-t">
          {tournament && onDelete && (
            <Button
              type="button"
              variant="danger"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={loading || deleteLoading || isSubmitting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Tournament
            </Button>
          )}
          
          <div className={`flex space-x-3 ${tournament && onDelete ? '' : 'ml-auto'}`}>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading || deleteLoading || isSubmitting}
            >
              Cancel
            </Button>
            
            <Button
              type="submit"
              loading={loading || isSubmitting}
              disabled={loading || deleteLoading || isSubmitting}
            >
              {tournament ? 'Update Tournament' : 'Create Tournament'}
            </Button>
          </div>
        </div>
      </form>

      {/* CRITICAL FIX: Divisions Management OUTSIDE the form to prevent nesting */}
      <Card 
        title="Tournament Divisions"
        subtitle="Manage different event categories within this tournament"
        actions={[
          <Button 
            key="add-division"
            type="button"
            onClick={addDivision}
            variant="outline"
            disabled={isSubmitting || divisionSaving}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Division
          </Button>
        ]}
      >
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{divisions.length}</div>
              <div className="text-sm text-gray-600">Division{divisions.length !== 1 ? 's' : ''}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{getTotalParticipants()}</div>
              <div className="text-sm text-gray-600">Total Participants</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">${getTotalExpected()}</div>
              <div className="text-sm text-gray-600">Total Expected</div>
            </div>
          </div>

          {/* Division List */}
          <div className="space-y-3">
            {divisions.map((division, index) => (
              <div key={division.id || index} className="border rounded-lg p-4 bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <Trophy className="h-5 w-5 text-yellow-600" />
                      <div>
                        <h4 className="font-medium text-gray-900">{division.name}</h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>{formatEventType(division.eventType)}</span>
                          <span className="capitalize">{division.skillLevel}</span>
                          <span className="flex items-center">
                            <Users className="h-3 w-3 mr-1" />
                            {division.participants?.length || 0}
                            {division.maxParticipants && ` / ${division.maxParticipants}`}
                          </span>
                          {division.entryFee > 0 && (
                            <span className="flex items-center text-green-600">
                              <DollarSign className="h-3 w-3" />
                              {division.entryFee}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => editDivision(index)}
                      disabled={isSubmitting || divisionSaving}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    {divisions.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => deleteDivision(index)}
                        disabled={isSubmitting || divisionSaving}
                        loading={divisionSaving}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                
                {division.description && (
                  <p className="mt-2 text-sm text-gray-600">{division.description}</p>
                )}
              </div>
            ))}
          </div>

          {errors.divisions && (
            <Alert type="error" title="Division Error" message={errors.divisions} />
          )}
          
          {/* Show division-specific errors */}
          {Object.entries(errors).filter(([key]) => key.startsWith('division_')).map(([key, error]) => (
            <Alert key={key} type="error" title="Division Error" message={error} />
          ))}
        </div>
      </Card>

      {/* CRITICAL FIX: Division Modal - NO FORM ELEMENT, just content */}
      <DivisionFormModal
        isOpen={showDivisionModal}
        onClose={() => {
          setShowDivisionModal(false);
          setEditingDivisionIndex(null);
        }}
        onSave={handleDivisionSave}
        division={editingDivisionIndex !== null ? divisions[editingDivisionIndex] : null}
        title={editingDivisionIndex !== null ? 'Edit Division' : 'Add Division'}
        isSaving={divisionSaving}
        isEditing={tournament && tournament.id} // NEW: Tell modal if we're editing existing tournament
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Tournament"
        message={`Are you sure you want to delete "${formData.name}"? This action cannot be undone and will remove all associated data including all divisions, participant registrations, and payment information.`}
        confirmText="Delete Tournament"
        cancelText="Keep Tournament"
        type="danger"
        loading={deleteLoading}
      />
    </div>
  );
};

/**
 * CRITICAL FIX: DivisionFormModal - NO FORM ELEMENT to prevent nesting
 * NEW: Immediate save functionality for existing tournaments
 */
const DivisionFormModal = ({ isOpen, onClose, onSave, division, title, isSaving = false, isEditing = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    eventType: EVENT_TYPES.MIXED_DOUBLES,
    skillLevel: SKILL_LEVELS.INTERMEDIATE,
    entryFee: 0,
    maxParticipants: '',
    paymentMode: PAYMENT_MODES.INDIVIDUAL
  });
  const [errors, setErrors] = useState({});
  // Removed local isSubmitting state - now handled by parent

  // Initialize form data when modal opens/closes or division changes
  useEffect(() => {
    if (isOpen) {
      console.log('Division modal opened with division:', division);
      
      if (division) {
        const newFormData = {
          name: division.name || '',
          description: division.description || '',
          eventType: division.eventType || EVENT_TYPES.MIXED_DOUBLES,
          skillLevel: division.skillLevel || SKILL_LEVELS.INTERMEDIATE,
          entryFee: division.entryFee || 0,
          maxParticipants: division.maxParticipants || '',
          paymentMode: division.paymentMode || PAYMENT_MODES.INDIVIDUAL
        };
        console.log('Setting division form data:', newFormData);
        setFormData(newFormData);
      } else {
        // Reset form for new division
        const defaultFormData = {
          name: '',
          description: '',
          eventType: EVENT_TYPES.MIXED_DOUBLES,
          skillLevel: SKILL_LEVELS.INTERMEDIATE,
          entryFee: 0,
          maxParticipants: '',
          paymentMode: PAYMENT_MODES.INDIVIDUAL
        };
        console.log('Resetting division form data to defaults:', defaultFormData);
        setFormData(defaultFormData);
      }
      
      // Clear errors when modal opens
      setErrors({});
    }
  }, [isOpen, division]);

  const handleChange = useCallback((field) => (e) => {
    const value = e.target.value;
    console.log(`Division field ${field} changed to:`, value);
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  }, [errors]);

  const validateForm = useCallback(() => {
    console.log('Validating division form:', formData);
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Division name is required';
    }

    if (!formData.eventType) {
      newErrors.eventType = 'Event type is required';
    }

    if (!formData.skillLevel) {
      newErrors.skillLevel = 'Skill level is required';
    }

    if (formData.entryFee < 0) {
      newErrors.entryFee = 'Entry fee cannot be negative';
    }

    if (formData.maxParticipants && formData.maxParticipants < 1) {
      newErrors.maxParticipants = 'Max participants must be at least 1';
    }

    console.log('Division validation errors:', newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // CRITICAL FIX: Button click handler with parent-managed saving state
  const handleSave = useCallback(async () => {
    console.log('Division save button clicked');
    
    if (isSaving) {
      console.log('Already saving division, ignoring duplicate');
      return;
    }
    
    if (!validateForm()) {
      console.log('Division form validation failed');
      return;
    }

    try {
      const submissionData = {
        ...formData,
        entryFee: parseFloat(formData.entryFee),
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : null
      };

      console.log('Calling parent save with division data:', submissionData);
      await onSave(submissionData);
      console.log('Division save completed');
      
    } catch (error) {
      console.error('Division save error:', error);
      setErrors({ submit: error.message });
    }
  }, [formData, isSaving, validateForm, onSave]);

  // Close handler
  const handleClose = useCallback(() => {
    if (!isSaving) {
      console.log('Closing division modal');
      setErrors({});
      onClose();
    }
  }, [isSaving, onClose]);

  // Dropdown options
  const skillLevelOptions = Object.entries(SKILL_LEVELS).map(([key, value]) => ({
    value,
    label: key.charAt(0) + key.slice(1).toLowerCase()
  }));

  const eventTypeOptions = Object.entries(EVENT_TYPES).map(([key, value]) => ({
    value,
    label: key.split('_').map(word => 
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ')
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      size="lg"
    >
      {/* CRITICAL: NO FORM ELEMENT - just div container */}
      <div className="space-y-6">
        {/* Show submission errors */}
        {errors.submit && (
          <Alert type="error" title="Save Error" message={errors.submit} />
        )}
        
        <div className="space-y-4">
          <Input
            label="Division Name"
            type="text"
            value={formData.name}
            onChange={handleChange('name')}
            error={errors.name}
            required
            placeholder="e.g., Men's Singles, Mixed Doubles"
            disabled={isSaving}
          />

          <Input
            label="Description"
            type="text"
            value={formData.description}
            onChange={handleChange('description')}
            placeholder="Optional description of this division"
            disabled={isSaving}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Event Type"
              value={formData.eventType}
              onChange={handleChange('eventType')}
              options={eventTypeOptions}
              error={errors.eventType}
              required
              disabled={isSaving}
            />

            <Select
              label="Skill Level"
              value={formData.skillLevel}
              onChange={handleChange('skillLevel')}
              options={skillLevelOptions}
              error={errors.skillLevel}
              required
              disabled={isSaving}
            />
          </div>

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
              disabled={isSaving}
            />

            <Input
              label="Max Participants"
              type="number"
              value={formData.maxParticipants}
              onChange={handleChange('maxParticipants')}
              error={errors.maxParticipants}
              min="1"
              placeholder="Optional"
              disabled={isSaving}
            />
          </div>

          <Select
            label="Payment Mode"
            value={formData.paymentMode}
            onChange={handleChange('paymentMode')}
            options={[
              { value: PAYMENT_MODES.INDIVIDUAL, label: 'Individual Payments' },
              { value: PAYMENT_MODES.GROUP, label: 'Group Payment (One Payer)' }
            ]}
            helperText="How participants will handle payments for this division"
            disabled={isSaving}
          />
        </div>

        <div className="flex space-x-3 justify-end pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          
          {/* CRITICAL: Button click handler with immediate save messaging */}
          <Button 
            type="button"
            onClick={handleSave}
            loading={isSaving}
            disabled={isSaving}
          >
            {division ? (isEditing ? 'Update & Save Division' : 'Update Division') : (isEditing ? 'Add & Save Division' : 'Add Division')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default TournamentForm;