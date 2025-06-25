// src/components/tournament/TournamentForm.jsx (FIXED - Consistent spacing system and proper members integration)
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Trash2, 
  ExternalLink, 
  MapPin, 
  Plus, 
  Edit3, 
  Users, 
  DollarSign, 
  Trophy,
  ChevronDown,
  ChevronRight,
  Calendar,
  Info,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';
import { Input, Select, Button, Alert, ConfirmDialog, Card, Modal } from '../ui';
import DivisionMemberSelector from './DivisionMemberSelector';
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

// FIXED: Simplified and consistent spacing system - exactly 24px throughout
const tournamentFormStyles = `
  /* Base form container */
  .tournament-form {
    -webkit-overflow-scrolling: touch;
    scroll-behavior: smooth;
  }
  
  /* SIMPLIFIED: Consistent section spacing system - exactly 24px everywhere */
  .form-section {
    background: white;
    border-radius: 16px;
    border: 1px solid #e5e7eb;
    margin-bottom: 24px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
  
  .form-section:last-child {
    margin-bottom: 0;
  }
  
  .form-section-header {
    padding: 20px;
    border-bottom: 1px solid #e5e7eb;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    cursor: pointer;
    transition: background-color 0.2s ease;
  }
  
  .form-section-header:active {
    background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
  }
  
  /* FIXED: Consistent content padding - exactly 24px always */
  .form-section-content {
    padding: 24px;
  }
  
  /* FIXED: Standardized input group spacing - exactly 24px always */
  .form-input-group {
    margin-bottom: 24px;
  }
  
  .form-input-group:last-child {
    margin-bottom: 0;
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
  
  /* Responsive grid system */
  .form-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 24px;
  }
  
  @media (min-width: 640px) {
    .form-grid-sm {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  
  @media (min-width: 1024px) {
    .form-grid-lg {
      grid-template-columns: repeat(3, 1fr);
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
  
  /* Division cards */
  .division-card {
    background: white;
    border: 2px solid #e5e7eb;
    border-radius: 16px;
    padding: 20px;
    margin-bottom: 24px;
    transition: all 0.2s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  
  .division-card:last-child {
    margin-bottom: 0;
  }
  
  .division-card:active {
    transform: scale(0.99);
    border-color: #3b82f6;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
  }
  
  /* Summary cards */
  .summary-card {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    color: white;
    border-radius: 16px;
    padding: 20px;
    margin-bottom: 24px;
  }
  
  .quick-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    text-align: center;
  }
  
  .stat-item {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 12px;
    padding: 12px 8px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
  
  .stat-number {
    font-size: 1.25rem;
    font-weight: bold;
    line-height: 1;
    margin-bottom: 4px;
  }
  
  .stat-label {
    font-size: 0.6875rem;
    opacity: 0.9;
    line-height: 1;
  }
  
  /* REMOVED: All conflicting responsive overrides that cause spacing inconsistencies */
  /* Now using consistent 24px spacing across all screen sizes */
`;

const StyleSheet = () => (
  <style dangerouslySetInnerHTML={{ __html: tournamentFormStyles }} />
);

/**
 * FIXED: Tournament Form Component with consistent spacing and proper members integration
 */
const TournamentForm = ({ 
  tournament = null, 
  onSubmit, 
  onCancel, 
  onUpdateTournament,
  loading = false,
  deleteLoading = false,
  members = [] // FIXED: Now properly receives members prop from Dashboard
}) => {
  const isInitialMount = useRef(true);
  const tournamentIdRef = useRef(null);

  // CORRECTED: Improved date formatting
  const formatDateForInput = useCallback((date) => {
    if (!date) return '';
    
    try {
      let dateObj;
      
      if (date && typeof date === 'object' && date.seconds) {
        dateObj = new Date(date.seconds * 1000);
      } 
      else if (date instanceof Date) {
        dateObj = date;
      } 
      else if (typeof date === 'string') {
        dateObj = new Date(date);
      } 
      else if (typeof date === 'number') {
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
  }, []);

  // CORRECTED: Better division initialization
  const initializeDivisions = useCallback((tournamentData = null) => {
    const sourceData = tournamentData || tournament;
    
    if (sourceData?.divisions && Array.isArray(sourceData.divisions)) {
      return sourceData.divisions.map(div => ({
        ...div,
        participants: [...(div.participants || [])],
        paymentData: { ...(div.paymentData || {}) }
      }));
    }
    
    if (sourceData && (sourceData.skillLevel || sourceData.eventType || sourceData.entryFee >= 0)) {
      return [createTournamentDivision({
        name: `${sourceData.eventType || 'Mixed Doubles'} - ${sourceData.skillLevel || 'Open'}`,
        eventType: sourceData.eventType || EVENT_TYPES.MIXED_DOUBLES,
        skillLevel: sourceData.skillLevel || SKILL_LEVELS.INTERMEDIATE,
        entryFee: sourceData.entryFee || 0,
        maxParticipants: sourceData.maxParticipants || null,
        paymentMode: sourceData.paymentMode || PAYMENT_MODES.INDIVIDUAL,
        participants: [...(sourceData.participants || [])],
        paymentData: { ...(sourceData.paymentData || {}) }
      })];
    }
    
    return [createTournamentDivision({
      name: 'Main Division',
      eventType: EVENT_TYPES.MIXED_DOUBLES,
      skillLevel: SKILL_LEVELS.INTERMEDIATE
    })];
  }, [tournament]);

  // Mobile detection with proper initial state
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });
  
  // Section expansion logic
  const getInitialSectionState = useCallback(() => {
    const isNewEntry = !tournament;
    
    if (!isMobile) {
      return {
        basic: true,
        details: true,
        divisions: true,
        participants: true
      };
    }
    
    return {
      basic: isNewEntry,
      details: isNewEntry,
      divisions: isNewEntry,
      participants: !isNewEntry
    };
  }, [isMobile, tournament]);

  const [expandedSections, setExpandedSections] = useState(() => getInitialSectionState());

  // Form state initialization
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
  const [showDivisionModal, setShowDivisionModal] = useState(false);
  const [editingDivisionIndex, setEditingDivisionIndex] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [divisionSaving, setDivisionSaving] = useState(false);

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

  // State synchronization
  useEffect(() => {
    if (tournament && tournament.id !== tournamentIdRef.current) {
      const newFormData = {
        name: tournament.name || '',
        description: tournament.description || '',
        status: tournament.status || TOURNAMENT_STATUS.DRAFT,
        eventDate: formatDateForInput(tournament.eventDate),
        registrationDeadline: formatDateForInput(tournament.registrationDeadline),
        location: tournament.location || '',
        website: tournament.website || ''
      };
      
      setFormData(newFormData);
      const newDivisions = initializeDivisions(tournament);
      setDivisions(newDivisions);
      tournamentIdRef.current = tournament.id;
    } else if (!tournament) {
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
      tournamentIdRef.current = null;
    }
    
    setErrors({});
    setIsSubmitting(false);
    isInitialMount.current = false;
  }, [tournament, formatDateForInput, initializeDivisions]);

  // Section toggle
  const toggleSection = useCallback((section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  // Input change handler
  const handleChange = useCallback((field) => (e) => {
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
  }, [errors]);

  // Division management
  const addDivision = useCallback(() => {
    setEditingDivisionIndex(null);
    setShowDivisionModal(true);
  }, []);

  const editDivision = useCallback((index) => {
    setEditingDivisionIndex(index);
    setShowDivisionModal(true);
  }, []);

  const deleteDivision = useCallback(async (index) => {
    if (divisions.length > 1) {
      setDivisionSaving(true);
      
      try {
        const updatedDivisions = divisions.filter((_, i) => i !== index);
        setDivisions(updatedDivisions);
        
        if (tournament && tournament.id && onUpdateTournament) {
          await onUpdateTournament(tournament.id, { divisions: updatedDivisions });
        }
        
      } catch (error) {
        console.error('Error deleting division:', error);
        setErrors({ divisionDelete: `Failed to delete division: ${error.message}` });
        setDivisions(divisions);
      } finally {
        setDivisionSaving(false);
      }
    }
  }, [divisions, tournament, onUpdateTournament]);

  const handleDivisionSave = useCallback(async (divisionData) => {
    setDivisionSaving(true);
    
    try {
      let updatedDivisions;
      
      if (editingDivisionIndex !== null) {
        updatedDivisions = divisions.map((div, index) => 
          index === editingDivisionIndex ? { ...div, ...divisionData } : div
        );
      } else {
        const newDivision = createTournamentDivision(divisionData);
        updatedDivisions = [...divisions, newDivision];
      }
      
      setDivisions(updatedDivisions);
      
      if (tournament && tournament.id && onUpdateTournament) {
        await onUpdateTournament(tournament.id, { divisions: updatedDivisions });
      }
      
      setShowDivisionModal(false);
      setEditingDivisionIndex(null);
      
    } catch (error) {
      console.error('Error saving division:', error);
      setErrors({ divisionSave: `Failed to save division: ${error.message}` });
    } finally {
      setDivisionSaving(false);
    }
  }, [editingDivisionIndex, divisions, tournament, onUpdateTournament]);

  // CORRECTED: Division participants change handler
  const handleDivisionParticipantsChange = useCallback((divisionId, participants) => {
    if (!tournament) return;
    
    const updatedDivisions = divisions.map(division => 
      division.id === divisionId 
        ? { ...division, participants }
        : division
    );
    
    setDivisions(updatedDivisions);
    
    // Update tournament immediately if we have an update function
    if (onUpdateTournament && tournament.id) {
      onUpdateTournament(tournament.id, { divisions: updatedDivisions });
    }
  }, [tournament, divisions, onUpdateTournament]);

  // Form validation
  const validateForm = useCallback(() => {
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
  }, [formData, divisions]);

  // Form submission
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isSubmitting) return;
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    try {
      const eventDate = formData.eventDate ? new Date(formData.eventDate + 'T00:00:00') : null;
      const registrationDeadline = formData.registrationDeadline ? 
        new Date(formData.registrationDeadline + 'T00:00:00') : null;

      const submissionData = {
        ...formData,
        eventDate,
        registrationDeadline,
        website: formData.website ? formatWebsiteUrl(formData.website) : '',
        divisions: divisions
      };

      await onSubmit(submissionData);
      
    } catch (error) {
      console.error('Tournament submission error:', error);
      setErrors({ submit: error.message });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, divisions, isSubmitting, validateForm, onSubmit]);

  // Link testing
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

  // Utility functions
  const formatEventType = (eventType) => {
    return eventType.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

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
    <div className="tournament-form">
      <StyleSheet />
      
      <div className="p-6">
        {/* Error alerts */}
        {errors.submit && (
          <div className="form-section">
            <div className="form-section-content">
              <Alert type="error" title="Submission Error" message={errors.submit} />
            </div>
          </div>
        )}
        
        {errors.divisionSave && (
          <div className="form-section">
            <div className="form-section-content">
              <Alert 
                type="error" 
                title="Division Save Error" 
                message={errors.divisionSave} 
                onClose={() => setErrors(prev => ({ ...prev, divisionSave: null }))}
              />
            </div>
          </div>
        )}

        <form id="tournament-form" onSubmit={handleSubmit}>
          {/* Basic Information Section */}
          <div className="form-section">
            <div 
              className="form-section-header"
              onClick={() => toggleSection('basic')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Info className="h-5 w-5 text-blue-600 mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                    <p className="text-sm text-gray-600 mt-1">Tournament name, description, and status</p>
                  </div>
                </div>
                <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${expandedSections.basic ? 'rotate-180' : ''}`} />
              </div>
            </div>
            
            <div className={`form-expandable ${expandedSections.basic ? 'expanded' : 'collapsed'}`}>
              <div className="form-section-content">
                <div className="form-input-group">
                  <Input
                    label="Tournament Name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange('name')}
                    error={errors.name}
                    required
                    placeholder="Enter tournament name"
                    disabled={isSubmitting}
                    className="text-lg"
                  />
                </div>

                <div className="form-input-group">
                  <Input
                    label="Description"
                    type="text"
                    value={formData.description}
                    onChange={handleChange('description')}
                    placeholder="Brief description of the tournament"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="form-input-group">
                  <Select
                    label="Tournament Status"
                    value={formData.status}
                    onChange={handleChange('status')}
                    options={statusOptions}
                    helperText="Current tournament status"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Event Details Section */}
          <div className="form-section">
            <div 
              className="form-section-header"
              onClick={() => toggleSection('details')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-green-600 mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Event Details</h3>
                    <p className="text-sm text-gray-600 mt-1">Dates, location, and website information</p>
                  </div>
                </div>
                <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${expandedSections.details ? 'rotate-180' : ''}`} />
              </div>
            </div>
            
            <div className={`form-expandable ${expandedSections.details ? 'expanded' : 'collapsed'}`}>
              <div className="form-section-content">
                <div className={`form-grid ${isMobile ? '' : 'form-grid-sm'}`}>
                  <div className="form-input-group">
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
                  </div>

                  <div className="form-input-group">
                    <Input
                      label="Registration Deadline"
                      type="date"
                      value={formData.registrationDeadline}
                      onChange={handleChange('registrationDeadline')}
                      helperText="Optional - when registration closes"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="form-input-group">
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
                      className="form-touch-button mt-3"
                      disabled={isSubmitting}
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      Preview on Map
                    </Button>
                  )}
                </div>

                <div className="form-input-group">
                  <Input
                    label="Tournament Website"
                    type="url"
                    value={formData.website}
                    onChange={handleChange('website')}
                    error={errors.website}
                    placeholder="https://example.com/tournament-info"
                    helperText="Optional - Link to tournament information"
                    disabled={isSubmitting}
                  />
                  {formData.website && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleTestWebsite}
                      className="form-touch-button mt-3"
                      disabled={isSubmitting}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Test Link
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Divisions Management Section */}
          <div className="form-section">
            <div 
              className="form-section-header"
              onClick={() => toggleSection('divisions')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Trophy className="h-5 w-5 text-yellow-600 mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Tournament Divisions</h3>
                    <p className="text-sm text-gray-600 mt-1">Manage different event categories</p>
                  </div>
                </div>
                <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${expandedSections.divisions ? 'rotate-180' : ''}`} />
              </div>
            </div>
            
            <div className={`form-expandable ${expandedSections.divisions ? 'expanded' : 'collapsed'}`}>
              <div className="form-section-content">
                {/* Division Summary Card */}
                <div className="summary-card">
                  <h4 className="text-lg font-semibold mb-4">Tournament Overview</h4>
                  <div className="quick-stats">
                    <div className="stat-item">
                      <div className="stat-number">{divisions.length}</div>
                      <div className="stat-label">Divisions</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-number">{getTotalParticipants()}</div>
                      <div className="stat-label">Players</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-number">${getTotalExpected()}</div>
                      <div className="stat-label">Entry Fees</div>
                    </div>
                  </div>
                </div>

                <div className="form-input-group">
                  <Button 
                    type="button"
                    onClick={addDivision}
                    variant="outline"
                    disabled={isSubmitting || divisionSaving}
                    className="form-touch-button w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Division
                  </Button>
                </div>

                {/* Division List */}
                <div>
                  {divisions.map((division, index) => (
                    <DivisionCard
                      key={division.id || index}
                      division={division}
                      index={index}
                      onEdit={() => editDivision(index)}
                      onDelete={() => deleteDivision(index)}
                      canDelete={divisions.length > 1}
                      disabled={isSubmitting || divisionSaving}
                      loading={divisionSaving}
                    />
                  ))}
                </div>

                {errors.divisions && (
                  <div className="form-input-group">
                    <Alert type="error" title="Division Error" message={errors.divisions} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Cancel/Create Button for New Tournaments */}
          {!tournament && (
            <div className="form-section">
              <div className="form-section-content">
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={loading || deleteLoading || isSubmitting}
                    className="form-touch-button"
                  >
                    Cancel
                  </Button>
                  
                  <Button
                    type="submit"
                    loading={loading || isSubmitting}
                    disabled={loading || deleteLoading || isSubmitting}
                    className="form-touch-button"
                  >
                    Create Tournament
                  </Button>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* FIXED: Division Participants Section with proper spacing and members integration */}
        {tournament && tournament.divisions && tournament.divisions.length > 0 && (
          <div className="form-section" style={{ marginTop: '24px' }}>
            <div 
              className="form-section-header"
              onClick={() => toggleSection('participants')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-indigo-600 mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Manage Division Participants</h3>
                    <p className="text-sm text-gray-600 mt-1">Assign members to tournament divisions</p>
                  </div>
                </div>
                <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${expandedSections.participants ? 'rotate-180' : ''}`} />
              </div>
            </div>
            
            <div className={`form-expandable ${expandedSections.participants ? 'expanded' : 'collapsed'}`}>
              <div className="form-section-content">
                <div className="form-input-group">
                  <DivisionMemberSelector
                    tournament={{ ...tournament, divisions: divisions }}
                    members={members}
                    onDivisionParticipantsChange={handleDivisionParticipantsChange}
                    loading={false}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
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
        isSaving={divisionSaving}
        isEditing={tournament && tournament.id}
      />
    </div>
  );
};

/**
 * Division Card Component
 */
const DivisionCard = ({ division, index, onEdit, onDelete, canDelete, disabled, loading }) => {
  const formatEventType = (eventType) => {
    return eventType.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  return (
    <div className="division-card">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center mb-3">
            <Trophy className="h-5 w-5 text-yellow-600 mr-3 flex-shrink-0" />
            <h4 className="font-semibold text-gray-900 text-lg">{division.name}</h4>
          </div>
          
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {formatEventType(division.eventType)}
              </span>
              <span className="inline-flex items-center px-3 py-1.5 bg-purple-100 text-purple-800 rounded-full text-sm font-medium capitalize">
                {division.skillLevel}
              </span>
              {division.entryFee > 0 && (
                <span className="inline-flex items-center px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  <DollarSign className="h-3 w-3 mr-1" />
                  ${division.entryFee}
                </span>
              )}
            </div>
            
            <div className="flex items-center text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
              <Users className="h-4 w-4 mr-2 text-gray-400" />
              <span>
                {division.participants?.length || 0} participants
                {division.maxParticipants && ` (max ${division.maxParticipants})`}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {division.description && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 leading-relaxed">{division.description}</p>
        </div>
      )}
      
      <div className="flex space-x-3 pt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onEdit}
          disabled={disabled}
          className="form-touch-button flex-1"
        >
          <Edit3 className="h-4 w-4 mr-2" />
          Edit Division
        </Button>
        {canDelete && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onDelete}
            disabled={disabled}
            loading={loading}
            className="form-touch-button"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

/**
 * Division Form Modal Component
 */
const DivisionFormModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  division, 
  title, 
  isSaving = false, 
  isEditing = false 
}) => {
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

  useEffect(() => {
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

  const handleChange = useCallback((field) => (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  }, [errors]);

  const handleSave = useCallback(async () => {
    if (isSaving) return;
    
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Division name is required';
    if (!formData.eventType) newErrors.eventType = 'Event type is required';
    if (!formData.skillLevel) newErrors.skillLevel = 'Skill level is required';
    if (formData.entryFee < 0) newErrors.entryFee = 'Entry fee cannot be negative';
    if (formData.maxParticipants && formData.maxParticipants < 1) {
      newErrors.maxParticipants = 'Max participants must be at least 1';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const submissionData = {
        ...formData,
        entryFee: parseFloat(formData.entryFee),
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : null
      };
      await onSave(submissionData);
    } catch (error) {
      setErrors({ submit: error.message });
    }
  }, [formData, isSaving, onSave]);

  const skillLevelOptions = Object.entries(SKILL_LEVELS).map(([key, value]) => ({
    value,
    label: key.charAt(0) + key.slice(1).toLowerCase()
  }));

  const eventTypeOptions = Object.entries(EVENT_TYPES).map(([key, value]) => ({
    value,
    label: key.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')
  }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <div className="space-y-6">
        {errors.submit && <Alert type="error" title="Save Error" message={errors.submit} />}
        
        <div className="space-y-6">
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

          <div className="grid gap-6 md:grid-cols-2">
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

          <div className="grid gap-6 md:grid-cols-2">
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
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
            className="flex-1"
          >
            Cancel
          </Button>
          
          <Button 
            type="button"
            onClick={handleSave}
            loading={isSaving}
            disabled={isSaving}
            className="flex-1"
          >
            {division ? 'Update' : 'Add'} Division
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default TournamentForm;