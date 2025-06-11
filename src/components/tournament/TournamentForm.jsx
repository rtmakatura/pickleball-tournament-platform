// src/components/tournament/TournamentForm.jsx (UPDATED - Division Support)
import React, { useState } from 'react';
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
 * TournamentForm Component - For creating/editing tournaments with division support
 * UPDATED: Now supports multiple divisions within a single tournament
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
  const initializeDivisions = () => {
    if (tournament?.divisions && Array.isArray(tournament.divisions)) {
      return tournament.divisions;
    }
    
    // Legacy support: if tournament has old structure, create single division
    if (tournament && (tournament.skillLevel || tournament.eventType || tournament.entryFee >= 0)) {
      return [createTournamentDivision({
        name: `${tournament.eventType || 'Mixed Doubles'} - ${tournament.skillLevel || 'Open'}`,
        eventType: tournament.eventType || EVENT_TYPES.MIXED_DOUBLES,
        skillLevel: tournament.skillLevel || SKILL_LEVELS.INTERMEDIATE,
        entryFee: tournament.entryFee || 0,
        maxParticipants: tournament.maxParticipants || null,
        paymentMode: tournament.paymentMode || PAYMENT_MODES.INDIVIDUAL,
        participants: tournament.participants || [],
        paymentData: tournament.paymentData || {}
      })];
    }
    
    // Default: single empty division
    return [createTournamentDivision({
      name: 'Main Division',
      eventType: EVENT_TYPES.MIXED_DOUBLES,
      skillLevel: SKILL_LEVELS.INTERMEDIATE
    })];
  };

  // Form state
  const [formData, setFormData] = useState({
    name: tournament?.name || '',
    description: tournament?.description || '',
    status: tournament?.status || TOURNAMENT_STATUS.DRAFT,
    eventDate: formatDateForInput(tournament?.eventDate),
    registrationDeadline: formatDateForInput(tournament?.registrationDeadline),
    location: tournament?.location || '',
    website: tournament?.website || ''
  });

  const [divisions, setDivisions] = useState(initializeDivisions());
  const [errors, setErrors] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDivisionModal, setShowDivisionModal] = useState(false);
  const [editingDivisionIndex, setEditingDivisionIndex] = useState(null);

  // Handle input changes
  const handleChange = (field) => (e) => {
    const value = e.target.value;
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
  };

  // Division management
  const addDivision = () => {
    setEditingDivisionIndex(null);
    setShowDivisionModal(true);
  };

  const editDivision = (index) => {
    setEditingDivisionIndex(index);
    setShowDivisionModal(true);
  };

  const deleteDivision = (index) => {
    if (divisions.length > 1) {
      setDivisions(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleDivisionSave = (divisionData) => {
    if (editingDivisionIndex !== null) {
      // Edit existing division
      setDivisions(prev => prev.map((div, index) => 
        index === editingDivisionIndex ? { ...div, ...divisionData } : div
      ));
    } else {
      // Add new division
      const newDivision = createTournamentDivision(divisionData);
      setDivisions(prev => [...prev, newDivision]);
    }
    
    setShowDivisionModal(false);
    setEditingDivisionIndex(null);
  };

  // Form validation
  const validateForm = () => {
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const submissionData = {
      ...formData,
      eventDate: new Date(formData.eventDate),
      registrationDeadline: formData.registrationDeadline 
        ? new Date(formData.registrationDeadline) 
        : null,
      website: formData.website ? formatWebsiteUrl(formData.website) : '',
      divisions: divisions
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

  // Handle link testing
  const handleTestWebsite = () => {
    if (formData.website) {
      const formattedUrl = formatWebsiteUrl(formData.website);
      openLinkSafely(formattedUrl, 'Please enter a valid website URL first');
    }
  };

  const handleTestLocation = () => {
    if (formData.location) {
      const mapsUrl = generateGoogleMapsLink(formData.location);
      openLinkSafely(mapsUrl, 'Please enter a location first');
    }
  };

  // Format display values
  const formatEventType = (eventType) => {
    return eventType.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  // Calculate summary stats
  const getTotalParticipants = () => {
    return divisions.reduce((total, div) => total + (div.participants?.length || 0), 0);
  };

  const getTotalExpected = () => {
    return divisions.reduce((total, div) => {
      const participants = div.participants?.length || 0;
      const fee = div.entryFee || 0;
      return total + (participants * fee);
    }, 0);
  };

  // Dropdown options
  const statusOptions = Object.entries(TOURNAMENT_STATUS).map(([key, value]) => ({
    value,
    label: key.split('_').map(word => 
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ')
  }));

  return (
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
          />

          <Input
            label="Description"
            type="text"
            value={formData.description}
            onChange={handleChange('description')}
            placeholder="Brief description of the tournament"
          />

          <Select
            label="Status"
            value={formData.status}
            onChange={handleChange('status')}
            options={statusOptions}
            helperText="Current tournament status"
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
            />

            <Input
              label="Registration Deadline"
              type="date"
              value={formData.registrationDeadline}
              onChange={handleChange('registrationDeadline')}
              helperText="Optional - when registration closes"
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
            />
            {formData.location && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTestLocation}
                className="mt-2"
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
            />
            {formData.website && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTestWebsite}
                className="mt-2"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Test Website Link
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Divisions Management */}
      <Card 
        title="Tournament Divisions"
        subtitle="Manage different event categories within this tournament"
        actions={[
          <Button 
            key="add-division"
            type="button"
            onClick={addDivision}
            variant="outline"
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
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    {divisions.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => deleteDivision(index)}
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
        </div>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-between items-center pt-6 border-t">
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

      {/* Division Modal */}
      <DivisionFormModal
        isOpen={showDivisionModal}
        onClose={() => {
          setShowDivisionModal(false);
          setEditingDivisionIndex(null);
        }}
        onSave={handleDivisionSave}
        division={editingDivisionIndex !== null ? divisions[editingDivisionIndex] : null}
        title={editingDivisionIndex !== null ? 'Edit Division' : 'Add Division'}
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
    </form>
  );
};

/**
 * DivisionFormModal - Modal for adding/editing divisions
 */
const DivisionFormModal = ({ isOpen, onClose, onSave, division, title }) => {
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

  // Initialize form when division or modal state changes
  React.useEffect(() => {
    if (isOpen) {
      if (division) {
        setFormData({
          name: division.name || '',
          description: division.description || '',
          eventType: division.eventType || EVENT_TYPES.MIXED_DOUBLES,
          skillLevel: division.skillLevel || SKILL_LEVELS.INTERMEDIATE,
          entryFee: division.entryFee || 0,
          maxParticipants: division.maxParticipants || '',
          paymentMode: division.paymentMode || PAYMENT_MODES.INDIVIDUAL
        });
      } else {
        setFormData({
          name: '',
          description: '',
          eventType: EVENT_TYPES.MIXED_DOUBLES,
          skillLevel: SKILL_LEVELS.INTERMEDIATE,
          entryFee: 0,
          maxParticipants: '',
          paymentMode: PAYMENT_MODES.INDIVIDUAL
        });
      }
      setErrors({});
    }
  }, [isOpen, division]);

  const handleChange = (field) => (e) => {
    const value = e.target.value;
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
  };

  const validateForm = () => {
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const submissionData = {
      ...formData,
      entryFee: parseFloat(formData.entryFee),
      maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : null
    };

    onSave(submissionData);
  };

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
      onClose={onClose}
      title={title}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <Input
            label="Division Name"
            type="text"
            value={formData.name}
            onChange={handleChange('name')}
            error={errors.name}
            required
            placeholder="e.g., Men's Singles, Mixed Doubles"
          />

          <Input
            label="Description"
            type="text"
            value={formData.description}
            onChange={handleChange('description')}
            placeholder="Optional description of this division"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Event Type"
              value={formData.eventType}
              onChange={handleChange('eventType')}
              options={eventTypeOptions}
              error={errors.eventType}
              required
            />

            <Select
              label="Skill Level"
              value={formData.skillLevel}
              onChange={handleChange('skillLevel')}
              options={skillLevelOptions}
              error={errors.skillLevel}
              required
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
            />

            <Input
              label="Max Participants"
              type="number"
              value={formData.maxParticipants}
              onChange={handleChange('maxParticipants')}
              error={errors.maxParticipants}
              min="1"
              placeholder="Optional"
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
          />
        </div>

        <div className="flex space-x-3 justify-end pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          
          <Button type="submit">
            {division ? 'Update Division' : 'Add Division'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default TournamentForm;