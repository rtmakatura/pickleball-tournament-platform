// src/components/tournament/TournamentForm.jsx (FIXED - Section expansion, spacing, and modal integration)
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

// FIXED: Mobile-First Tournament Form Styles with AGGRESSIVE spacing fixes
const mobileFormStyles = `
  /* CRITICAL: Override all spacing inconsistencies with !important */
  .tournament-form-container {
    padding: 0 !important;
    margin: 0 !important;
  }
  
  .tournament-form-container > * {
    margin: 0 !important;
  }
  
  /* FIXED: Consistent section spacing - force 24px everywhere */
  .mobile-form-section {
    background: white;
    border-radius: 16px;
    border: 1px solid #e5e7eb;
    margin: 0 0 24px 0 !important;
    padding: 0 !important;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
  
  /* FIXED: Remove margin from first section to prevent extra spacing */
  .mobile-form-section:first-child {
    margin-top: 0 !important;
  }
  
  /* FIXED: Ensure last section has no bottom margin */
  .mobile-form-section:last-child {
    margin-bottom: 0 !important;
  }
  
  .mobile-form-header {
    padding: 20px !important;
    margin: 0 !important;
    border-bottom: 1px solid #e5e7eb;
    background: #f9fafb;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }
  
  .mobile-form-header:active {
    background: #f3f4f6;
  }
  
  /* FIXED: Consistent content padding - EXACTLY 24px */
  .mobile-form-content {
    padding: 24px !important;
    margin: 0 !important;
  }
  
  .mobile-touch-button {
    min-height: 52px;
    min-width: 52px;
    transition: all 0.2s ease;
    -webkit-tap-highlight-color: transparent;
    border-radius: 12px;
  }
  
  .mobile-touch-button:active {
    transform: scale(0.96);
  }
  
  /* FIXED: Standardized input group spacing - EXACTLY 24px */
  .mobile-input-group {
    margin: 0 0 24px 0 !important;
    padding: 0 !important;
  }
  
  /* FIXED: Remove margin from last input group to prevent extra spacing */
  .mobile-input-group:last-child {
    margin-bottom: 0 !important;
  }
  
  .mobile-division-card {
    background: white;
    border: 2px solid #e5e7eb;
    border-radius: 16px;
    padding: 20px !important;
    margin: 0 0 24px 0 !important;
    transition: all 0.2s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  
  .mobile-division-card:last-child {
    margin-bottom: 0 !important;
  }
  
  .mobile-division-card:active {
    transform: scale(0.99);
    border-color: #3b82f6;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
  }
  
  .mobile-grid-single {
    display: grid;
    grid-template-columns: 1fr;
    gap: 24px !important;
    margin: 0 !important;
  }
  
  .mobile-grid-responsive {
    grid-template-columns: 1fr;
    gap: 24px !important;
    margin: 0 !important;
  }
  
  @media (min-width: 640px) {
    .mobile-grid-responsive {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  
  @media (min-width: 1024px) {
    .mobile-grid-responsive {
      grid-template-columns: repeat(3, 1fr);
    }
  }
  
  /* Prevent input truncation */
  .mobile-input-container {
    min-width: 0;
    width: 100%;
  }
  
  .mobile-input-container input,
  .mobile-input-container select,
  .mobile-input-container textarea {
    min-width: 0;
    width: 100%;
    box-sizing: border-box;
  }
  
  /* FIXED: Remove any default form spacing */
  form {
    margin: 0 !important;
    padding: 0 !important;
  }
  
  /* FIXED: Remove space-y utilities that might be conflicting */
  .space-y-0 > * {
    margin-top: 0 !important;
    margin-bottom: 0 !important;
  }
  
  /* FIXED: Touch-friendly alert styles */
  .mobile-alert {
    border-radius: 12px;
    padding: 16px !important;
    margin: 0 0 24px 0 !important;
  }
  
  .mobile-alert:last-child {
    margin-bottom: 0 !important;
  }
  
  /* FIXED: Progressive disclosure animations with proper state handling */
  .mobile-expandable {
    transition: max-height 0.3s ease-out, opacity 0.2s ease-out;
    overflow: hidden;
  }
  
  .mobile-expandable.collapsed {
    max-height: 0;
    opacity: 0;
  }
  
  .mobile-expandable.expanded {
    max-height: 2000px;
    opacity: 1;
  }
  
  /* Mobile modal optimizations */
  .mobile-modal-content {
    max-height: 85vh;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding: 0 !important;
  }
  
  /* Division summary cards */
  .division-summary-card {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    color: white;
    border-radius: 16px;
    padding: 20px !important;
    margin: 0 0 24px 0 !important;
    overflow: hidden;
    box-sizing: border-box;
  }
  
  .division-quick-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    text-align: center;
  }
  
  @media (max-width: 340px) {
    .division-quick-stats {
      gap: 4px;
    }
    
    .division-stat-item {
      padding: 8px 4px;
    }
    
    .division-stat-number {
      font-size: 1rem;
    }
    
    .division-stat-label {
      font-size: 0.625rem;
    }
  }
  
  .division-stat-item {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 12px;
    padding: 12px 8px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    overflow: hidden;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  
  .division-stat-number {
    font-size: 1.25rem;
    font-weight: bold;
    line-height: 1;
    margin-bottom: 4px;
    white-space: nowrap;
  }
  
  .division-stat-label {
    font-size: 0.6875rem;
    opacity: 0.9;
    line-height: 1;
    white-space: nowrap;
    text-align: center;
  }
  
  /* FIXED: Form container with consistent padding */
  .tournament-outer-container {
    padding: 24px !important;
    margin: 0 !important;
  }
  
  /* STANDARDIZED: Mobile-first form optimizations */
  .mobile-form-container {
    -webkit-overflow-scrolling: touch;
    scroll-behavior: smooth;
    padding: 0 !important;
    margin: 0 !important;
  }
`;

const StyleSheet = () => (
  <style dangerouslySetInnerHTML={{ __html: mobileFormStyles }} />
);

/**
 * FIXED: Mobile-Optimized Tournament Form Component with corrected expansion and spacing
 */
const TournamentForm = ({ 
  tournament = null, 
  onSubmit, 
  onCancel, 
  onUpdateTournament,
  loading = false,
  deleteLoading = false
}) => {
  const isInitialMount = useRef(true);
  const tournamentIdRef = useRef(null);

  // FIXED: Improved date formatting with better error handling
  const formatDateForInput = useCallback((date) => {
    if (!date) return '';
    
    try {
      let dateObj;
      
      // Handle Firestore Timestamp
      if (date && typeof date === 'object' && date.seconds) {
        dateObj = new Date(date.seconds * 1000);
      } 
      // Handle regular Date object
      else if (date instanceof Date) {
        dateObj = date;
      } 
      // Handle string dates
      else if (typeof date === 'string') {
        dateObj = new Date(date);
      } 
      // Handle number timestamps
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
      
      // Format as YYYY-MM-DD for HTML date input
      return dateObj.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error formatting date:', error, date);
      return '';
    }
  }, []);

  // FIXED: Better division initialization with proper deep copy
  const initializeDivisions = useCallback((tournamentData = null) => {
    const sourceData = tournamentData || tournament;
    
    if (sourceData?.divisions && Array.isArray(sourceData.divisions)) {
      // Deep copy to prevent mutation issues
      return sourceData.divisions.map(div => ({
        ...div,
        participants: [...(div.participants || [])],
        paymentData: { ...(div.paymentData || {}) }
      }));
    }
    
    // Legacy support
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
    
    // Default: single empty division
    return [createTournamentDivision({
      name: 'Main Division',
      eventType: EVENT_TYPES.MIXED_DOUBLES,
      skillLevel: SKILL_LEVELS.INTERMEDIATE
    })];
  }, [tournament]);

  // FIXED: Proper mobile detection with initial state
  const [isMobile, setIsMobile] = useState(() => {
    // Initialize correctly on first render
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });
  
  // FIXED: Section expansion logic - clear and deterministic
  const getInitialSectionState = useCallback(() => {
    const isNewEntry = !tournament;
    
    // Desktop: Always expanded for better UX
    if (!isMobile) {
      return {
        basic: true,
        details: true,
        divisions: true
      };
    }
    
    // Mobile: NEW forms expanded, EDIT forms collapsed
    return {
      basic: isNewEntry,
      details: isNewEntry,
      divisions: isNewEntry
    };
  }, [isMobile, tournament]);

  const [expandedSections, setExpandedSections] = useState(() => getInitialSectionState());

  // FIXED: Form state with better initial values
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

  // FIXED: Mobile detection with proper cleanup
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // FIXED: Update section states when context changes
  useEffect(() => {
    const newSectionState = getInitialSectionState();
    setExpandedSections(newSectionState);
  }, [getInitialSectionState]);

  // FIXED: Improved state synchronization with debugging
  useEffect(() => {
    console.log('TournamentForm: Tournament prop changed', {
      tournamentId: tournament?.id,
      previousId: tournamentIdRef.current,
      isInitialMount: isInitialMount.current
    });
    
    // Always update when tournament changes or on initial mount
    if (tournament && tournament.id !== tournamentIdRef.current) {
      console.log('TournamentForm: Updating form data for tournament', tournament.id);
      
      const newFormData = {
        name: tournament.name || '',
        description: tournament.description || '',
        status: tournament.status || TOURNAMENT_STATUS.DRAFT,
        eventDate: formatDateForInput(tournament.eventDate),
        registrationDeadline: formatDateForInput(tournament.registrationDeadline),
        location: tournament.location || '',
        website: tournament.website || ''
      };
      
      console.log('TournamentForm: New form data', newFormData);
      
      setFormData(newFormData);
      
      const newDivisions = initializeDivisions(tournament);
      console.log('TournamentForm: New divisions', newDivisions);
      setDivisions(newDivisions);
      
      // Update ref to track current tournament
      tournamentIdRef.current = tournament.id;
    } else if (!tournament) {
      // Reset form when tournament is null
      console.log('TournamentForm: Resetting form (no tournament)');
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

  // Section toggle for mobile
  const toggleSection = useCallback((section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  // FIXED: Handle input changes with better state management
  const handleChange = useCallback((field) => (e) => {
    const value = e.target.value;
    
    console.log(`TournamentForm: Field ${field} changed to:`, value);
    
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };
      console.log('TournamentForm: Updated form data:', newData);
      return newData;
    });
    
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
          console.log('TournamentForm: Deleting division and updating tournament');
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
      
      console.log('TournamentForm: Saving division', { divisionData, updatedDivisions });
      setDivisions(updatedDivisions);
      
      if (tournament && tournament.id && onUpdateTournament) {
        console.log('TournamentForm: Updating tournament with new divisions');
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

  // FIXED: Form submission with better date handling
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isSubmitting) return;
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    try {
      // FIXED: Better date parsing for submission
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

      console.log('TournamentForm: Submitting data', submissionData);
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
    <div className="mobile-form-container">
      <StyleSheet />
      
      {/* FIXED: Consistent container with proper padding */}
      <div className="tournament-outer-container">
        {/* FIXED: Mobile-optimized alert section with no extra wrappers */}
        {errors.submit && (
          <Alert type="error" title="Submission Error" message={errors.submit} className="mobile-alert" />
        )}
        
        {errors.delete && (
          <Alert type="error" title="Delete Error" message={errors.delete} className="mobile-alert" />
        )}
        
        {errors.divisionSave && (
          <Alert 
            type="error" 
            title="Division Save Error" 
            message={errors.divisionSave} 
            onClose={() => setErrors(prev => ({ ...prev, divisionSave: null }))}
            className="mobile-alert"
          />
        )}
        
        {errors.divisionDelete && (
          <Alert 
            type="error" 
            title="Division Delete Error" 
            message={errors.divisionDelete} 
            onClose={() => setErrors(prev => ({ ...prev, divisionDelete: null }))}
            className="mobile-alert"
          />
        )}

        <form id="tournament-form" onSubmit={handleSubmit}>
          {/* Basic Information Section */}
          <div className="mobile-form-section">
            <div 
              className="mobile-form-header"
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
            
            <div className={`mobile-expandable ${expandedSections.basic ? 'expanded' : 'collapsed'}`}>
              <div className="mobile-form-content">
                <div className="mobile-input-group mobile-input-container">
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

                <div className="mobile-input-group mobile-input-container">
                  <Input
                    label="Description"
                    type="text"
                    value={formData.description}
                    onChange={handleChange('description')}
                    placeholder="Brief description of the tournament"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="mobile-input-group mobile-input-container">
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
          <div className="mobile-form-section">
            <div 
              className="mobile-form-header"
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
            
            <div className={`mobile-expandable ${expandedSections.details ? 'expanded' : 'collapsed'}`}>
              <div className="mobile-form-content">
                <div className="mobile-grid-single mobile-grid-responsive">
                  <div className="mobile-input-group mobile-input-container">
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

                  <div className="mobile-input-group mobile-input-container">
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

                <div className="mobile-input-group mobile-input-container">
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
                      className="mobile-touch-button mt-3"
                      disabled={isSubmitting}
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      Preview on Map
                    </Button>
                  )}
                </div>

                <div className="mobile-input-group mobile-input-container">
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
                      className="mobile-touch-button mt-3"
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

          {/* Cancel/Create Button for New Tournaments */}
          {!tournament && (
            <div className="mobile-form-section">
              <div className="mobile-form-content">
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={loading || deleteLoading || isSubmitting}
                    className="mobile-touch-button"
                  >
                    Cancel
                  </Button>
                  
                  <Button
                    type="submit"
                    loading={loading || isSubmitting}
                    disabled={loading || deleteLoading || isSubmitting}
                    className="mobile-touch-button"
                  >
                    Create Tournament
                  </Button>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Divisions Management Section */}
        <div className="mobile-form-section">
          <div 
            className="mobile-form-header"
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
          
          <div className={`mobile-expandable ${expandedSections.divisions ? 'expanded' : 'collapsed'}`}>
            <div className="mobile-form-content">
              {/* Division Summary Card */}
              <div className="division-summary-card">
                <h4 className="text-lg font-semibold mb-4">Tournament Overview</h4>
                <div className="division-quick-stats">
                  <div className="division-stat-item">
                    <div className="division-stat-number">{divisions.length}</div>
                    <div className="division-stat-label">Divisions</div>
                  </div>
                  <div className="division-stat-item">
                    <div className="division-stat-number">{getTotalParticipants()}</div>
                    <div className="division-stat-label">Players</div>
                  </div>
                  <div className="division-stat-item">
                    <div className="division-stat-number">${getTotalExpected()}</div>
                    <div className="division-stat-label">Entry Fees</div>
                  </div>
                </div>
                
                {/* Clean Division List */}
                {divisions.length > 0 && (
                  <div className="mt-6">
                    <h5 className="text-sm font-medium mb-3 opacity-90">Divisions:</h5>
                    <div className="space-y-2">
                      {divisions.map((division, index) => (
                        <div key={division.id || index} className="bg-white bg-opacity-20 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{division.name}</p>
                              <p className="text-xs opacity-75 mt-1">
                                {division.eventType.split('_').map(word => 
                                  word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                                ).join(' ')} • {division.skillLevel.charAt(0).toUpperCase() + division.skillLevel.slice(1)}
                                {division.entryFee > 0 && ` • $${division.entryFee}`}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0 ml-3">
                              <p className="text-sm font-medium">{division.participants?.length || 0}</p>
                              <p className="text-xs opacity-75">players</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Add Division Button */}
              <div className="mobile-input-group">
                <Button 
                  type="button"
                  onClick={addDivision}
                  variant="outline"
                  disabled={isSubmitting || divisionSaving}
                  className="mobile-touch-button w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Division
                </Button>
              </div>

              {/* Division List */}
              <div>
                {divisions.map((division, index) => (
                  <MobileDivisionCard
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
                <Alert type="error" title="Division Error" message={errors.divisions} className="mobile-alert" />
              )}
              
              {Object.entries(errors).filter(([key]) => key.startsWith('division_')).map(([key, error]) => (
                <Alert key={key} type="error" title="Division Error" message={error} className="mobile-alert" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile-Optimized Division Modal */}
      <MobileDivisionFormModal
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
 * Mobile-Optimized Division Card Component
 */
const MobileDivisionCard = ({ division, index, onEdit, onDelete, canDelete, disabled, loading }) => {
  const formatEventType = (eventType) => {
    return eventType.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  return (
    <div className="mobile-division-card">
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
          className="mobile-touch-button flex-1"
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
            className="mobile-touch-button"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

/**
 * Mobile-Optimized Division Form Modal
 */
const MobileDivisionFormModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  division, 
  title, 
  isSaving = false, 
  isEditing = false 
}) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
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

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen) {
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
        setFormData(newFormData);
      } else {
        const defaultFormData = {
          name: '',
          description: '',
          eventType: EVENT_TYPES.MIXED_DOUBLES,
          skillLevel: SKILL_LEVELS.INTERMEDIATE,
          entryFee: 0,
          maxParticipants: '',
          paymentMode: PAYMENT_MODES.INDIVIDUAL
        };
        setFormData(defaultFormData);
      }
      
      setErrors({});
    }
  }, [isOpen, division]);

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

  const validateForm = useCallback(() => {
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
  }, [formData]);

  const handleSave = useCallback(async () => {
    if (isSaving) return;
    
    if (!validateForm()) return;

    try {
      const submissionData = {
        ...formData,
        entryFee: parseFloat(formData.entryFee),
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : null
      };

      await onSave(submissionData);
      
    } catch (error) {
      console.error('Division save error:', error);
      setErrors({ submit: error.message });
    }
  }, [formData, isSaving, validateForm, onSave]);

  const handleClose = useCallback(() => {
    if (!isSaving) {
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
      <div className="mobile-modal-content space-y-6">
        {errors.submit && (
          <Alert type="error" title="Save Error" message={errors.submit} className="mobile-alert" />
        )}
        
        <div className="space-y-6">
          <div className="mobile-input-group mobile-input-container">
            <Input
              label="Division Name"
              type="text"
              value={formData.name}
              onChange={handleChange('name')}
              error={errors.name}
              required
              placeholder="e.g., Men's Singles, Mixed Doubles"
              disabled={isSaving}
              className="text-base"
            />
          </div>

          <div className="mobile-input-group mobile-input-container">
            <Input
              label="Description"
              type="text"
              value={formData.description}
              onChange={handleChange('description')}
              placeholder="Optional description of this division"
              disabled={isSaving}
            />
          </div>

          <div className="mobile-grid-single mobile-grid-responsive">
            <div className="mobile-input-group mobile-input-container">
              <Select
                label="Event Type"
                value={formData.eventType}
                onChange={handleChange('eventType')}
                options={eventTypeOptions}
                error={errors.eventType}
                required
                disabled={isSaving}
              />
            </div>

            <div className="mobile-input-group mobile-input-container">
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
          </div>

          <div className="mobile-grid-single mobile-grid-responsive">
            <div className="mobile-input-group mobile-input-container">
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
            </div>

            <div className="mobile-input-group mobile-input-container">
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

          <div className="mobile-input-group mobile-input-container">
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
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSaving}
            className="mobile-touch-button flex-1"
          >
            Cancel
          </Button>
          
          <Button 
            type="button"
            onClick={handleSave}
            loading={isSaving}
            disabled={isSaving}
            className="mobile-touch-button flex-1"
          >
            {division ? (isEditing ? 'Update & Save' : 'Update') : (isEditing ? 'Add & Save' : 'Add')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default TournamentForm;