// src/components/league/LeagueForm.jsx (UPDATED - Removed League Features section)
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Trash2, 
  ExternalLink, 
  MapPin,
  ChevronDown,
  Calendar,
  Users,
  DollarSign,
  Info,
  Settings,
  Clock,
  CheckCircle,
  Activity
} from 'lucide-react';
import { Input, Select, Button, ConfirmDialog, Alert } from '../ui';
import { SKILL_LEVELS, LEAGUE_STATUS, PAYMENT_MODES, EVENT_TYPES } from '../../services/models';
import { formatWebsiteUrl, isValidUrl, generateGoogleMapsLink, openLinkSafely } from '../../utils/linkUtils';

// FIXED: Consistent Mobile-First League Form Styles with proper spacing
const mobileLeagueFormStyles = `
  /* STANDARDIZED: Mobile-first form optimizations */
  .mobile-league-form {
    -webkit-overflow-scrolling: touch;
    scroll-behavior: smooth;
    padding: 0;
  }
  
  /* FIXED: Consistent section spacing and styling - EXACTLY 24px everywhere */
  .mobile-league-section {
    background: white;
    border-radius: 16px;
    border: 1px solid #e5e7eb;
    margin-bottom: 24px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
  
  /* FIXED: Remove margin from first section to prevent extra spacing */
  .mobile-league-section:first-child {
    margin-top: 0;
  }
  
  /* FIXED: Ensure last section has no bottom margin */
  .mobile-league-section:last-child {
    margin-bottom: 0;
  }
  
  .mobile-league-header {
    padding: 20px;
    border-bottom: 1px solid #e5e7eb;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    cursor: pointer;
    transition: background-color 0.2s ease;
  }
  
  .mobile-league-header:active {
    background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
  }
  
  /* FIXED: Consistent content padding - EXACTLY 24px */
  .mobile-league-content {
    padding: 24px;
  }
  
  .mobile-league-touch-button {
    min-height: 52px;
    min-width: 52px;
    transition: all 0.2s ease;
    -webkit-tap-highlight-color: transparent;
    border-radius: 12px;
  }
  
  .mobile-league-touch-button:active {
    transform: scale(0.96);
  }
  
  /* FIXED: Standardized input group spacing - EXACTLY 24px */
  .mobile-league-input-group {
    margin-bottom: 24px;
  }
  
  /* FIXED: Remove margin from last input group to prevent extra spacing */
  .mobile-league-input-group:last-child {
    margin-bottom: 0;
  }
  
  .mobile-league-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 24px;
  }
  
  @media (min-width: 640px) {
    .mobile-league-grid-responsive {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  
  @media (min-width: 768px) {
    .mobile-league-grid-responsive {
      grid-template-columns: repeat(3, 1fr);
    }
  }
  
  /* FIXED: Progressive disclosure animations with proper state handling */
  .mobile-league-expandable {
    transition: max-height 0.3s ease-out, opacity 0.2s ease-out;
    overflow: hidden;
  }
  
  .mobile-league-expandable.collapsed {
    max-height: 0;
    opacity: 0;
  }
  
  .mobile-league-expandable.expanded {
    max-height: 2000px;
    opacity: 1;
  }
  
  /* Enhanced info cards with consistent styling */
  .league-info-card {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    color: white;
    border-radius: 16px;
    padding: 20px;
    margin-bottom: 24px;
  }
  
  .league-duration-display {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 16px;
    margin-top: 16px;
    backdrop-filter: blur(10px);
  }
  
  .league-payment-preview {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    border-radius: 12px;
    padding: 16px;
    margin-top: 16px;
  }
  
  /* FIXED: Mobile-optimized alerts with consistent spacing */
  .mobile-league-alert {
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 24px;
  }
  
  /* Status indicator styles */
  .status-indicator {
    display: inline-flex;
    align-items: center;
    padding: 8px 12px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 500;
  }
  
  .status-active {
    background: #dcfce7;
    color: #166534;
  }
  
  .status-completed {
    background: #f3e8ff;
    color: #6b21a8;
  }
  
  /* Link preview styling */
  .link-preview-section {
    background: #f8fafc;
    border-radius: 12px;
    padding: 16px;
    margin-top: 16px;
    border: 2px dashed #cbd5e1;
  }
  
  /* FIXED: Form container with consistent padding */
  .league-form-container {
    padding: 24px;
  }
  
  /* ADDED: League features info card styling */
  .league-features-card {
    background: linear-gradient(135deg, #059669 0%, #047857 100%);
    color: white;
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 24px;
  }
  
  .league-features-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  @media (min-width: 768px) {
    .league-features-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  
  .league-feature-item {
    display: flex;
    align-items: center;
    font-size: 0.875rem;
    line-height: 1.25rem;
    opacity: 0.95;
  }
  
  .league-feature-icon {
    height: 1rem;
    width: 1rem;
    margin-right: 0.5rem;
    color: rgba(255, 255, 255, 0.9);
    flex-shrink: 0;
  }
`;

const StyleSheet = () => (
  <style dangerouslySetInnerHTML={{ __html: mobileLeagueFormStyles }} />
);

/**
 * UPDATED: Mobile-Optimized League Form Component with League Features section removed
 */
const LeagueForm = ({ 
  league = null, 
  onSubmit, 
  onCancel, 
  loading = false,
  deleteLoading = false
}) => {
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
    const isNewEntry = !league;
    
    // Desktop: Always expanded for better UX
    if (!isMobile) {
      return {
        basic: true,
        schedule: true,
        details: true,
        settings: true
      };
    }
    
    // Mobile: NEW forms expanded, EDIT forms collapsed
    return {
      basic: isNewEntry,
      schedule: isNewEntry,
      details: isNewEntry,
      settings: isNewEntry
    };
  }, [isMobile, league]);

  const [expandedSections, setExpandedSections] = useState(() => getInitialSectionState());

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

  // Form state - initialize with existing league data or defaults
  const [formData, setFormData] = useState({
    name: league?.name || '',
    description: league?.description || '',
    skillLevel: league?.skillLevel || '',
    eventType: league?.eventType || EVENT_TYPES.MIXED_DOUBLES,
    status: league?.status || LEAGUE_STATUS.ACTIVE,
    startDate: formatDateForInput(league?.startDate),
    endDate: formatDateForInput(league?.endDate),
    location: league?.location || '',
    website: league?.website || '',
    maxParticipants: league?.maxParticipants || 2,
    registrationFee: league?.registrationFee || 0,
    paymentMode: league?.paymentMode || PAYMENT_MODES.INDIVIDUAL,
    isActive: league?.isActive !== false
  });

  const [errors, setErrors] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  // Section toggle for mobile progressive disclosure
  const toggleSection = useCallback((section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  // Handle input changes
  const handleChange = useCallback((field) => (e) => {
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
  }, [errors]);

  // Form validation
  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'League name is required';
    }

    if (!formData.skillLevel) {
      newErrors.skillLevel = 'Skill level is required';
    }

    if (!formData.eventType) {
      newErrors.eventType = 'Event type is required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (formData.website && !isValidUrl(formData.website)) {
      newErrors.website = 'Please enter a valid website URL';
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Handle form submission
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Convert date strings to Date objects and format website URL
    const submissionData = {
      ...formData,
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
      website: formData.website ? formatWebsiteUrl(formData.website) : '',
      registrationFee: parseFloat(formData.registrationFee),
      maxParticipants: parseInt(formData.maxParticipants)
    };

    onSubmit(submissionData);
  }, [formData, validateForm, onSubmit]);

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

  // Calculate league duration
  const calculateDuration = useCallback(() => {
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
  }, [formData.startDate, formData.endDate]);

  // Calculate estimated total cost
  const estimatedTotal = formData.registrationFee * formData.maxParticipants;

  // Get current league status info
  const getLeagueStatusInfo = useCallback(() => {
    if (!formData.startDate || !formData.endDate) return { isActive: false, timeInfo: '' };
    
    const now = new Date();
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    
    const isActive = start <= now && end >= now;
    
    if (isActive) {
      const daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
      return { isActive: true, timeInfo: `${daysLeft} days remaining` };
    } else if (start > now) {
      const daysUntil = Math.ceil((start - now) / (1000 * 60 * 60 * 24));
      return { isActive: false, timeInfo: `Starts in ${daysUntil} days` };
    } else {
      const daysAgo = Math.ceil((now - end) / (1000 * 60 * 60 * 24));
      return { isActive: false, timeInfo: `Ended ${daysAgo} days ago` };
    }
  }, [formData.startDate, formData.endDate]);

  const leagueStatus = getLeagueStatusInfo();

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

  const statusOptions = Object.entries(LEAGUE_STATUS).map(([key, value]) => ({
    value,
    label: key.charAt(0) + key.slice(1).toLowerCase()
  }));

  return (
    <div className="mobile-league-form">
      <StyleSheet />
      
      {/* FIXED: Consistent container with proper padding */}
      <div className="league-form-container">
        <form id="league-form" onSubmit={handleSubmit}>
          {/* League Basic Information */}
          <div className="mobile-league-section">
            <div 
              className="mobile-league-header"
              onClick={() => toggleSection('basic')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Info className="h-5 w-5 text-blue-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                </div>
                <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${expandedSections.basic ? 'rotate-180' : ''}`} />
              </div>
              <p className="text-sm text-gray-600 mt-1">League name, description, and type</p>
            </div>
            
            <div className={`mobile-league-expandable ${expandedSections.basic ? 'expanded' : 'collapsed'}`}>
              <div className="mobile-league-content">
                <div className="mobile-league-input-group">
                  <Input
                    label="League Name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange('name')}
                    error={errors.name}
                    required
                    placeholder="Enter league name"
                    className="text-lg"
                  />
                </div>

                <div className="mobile-league-input-group">
                  <Input
                    label="Description"
                    type="text"
                    value={formData.description}
                    onChange={handleChange('description')}
                    error={errors.description}
                    placeholder="Brief description of the league"
                    helperText="What's special about this league? Format, rules, etc."
                  />
                </div>

                <div className={`mobile-league-grid ${isMobile ? '' : 'mobile-league-grid-responsive'}`}>
                  <div className="mobile-league-input-group">
                    <Select
                      label="Skill Level"
                      value={formData.skillLevel}
                      onChange={handleChange('skillLevel')}
                      options={skillLevelOptions}
                      error={errors.skillLevel}
                      required
                      helperText="Target skill level for participants"
                    />
                  </div>

                  <div className="mobile-league-input-group">
                    <Select
                      label="Event Type"
                      value={formData.eventType}
                      onChange={handleChange('eventType')}
                      options={eventTypeOptions}
                      error={errors.eventType}
                      required
                      helperText="League format"
                    />
                  </div>

                  <div className="mobile-league-input-group">
                    <Select
                      label="Status"
                      value={formData.status}
                      onChange={handleChange('status')}
                      options={statusOptions}
                      helperText="Current league status"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* League Schedule & Duration */}
          <div className="mobile-league-section">
            <div 
              className="mobile-league-header"
              onClick={() => toggleSection('schedule')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-green-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900">Schedule & Duration</h3>
                </div>
                <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${expandedSections.schedule ? 'rotate-180' : ''}`} />
              </div>
              <p className="text-sm text-gray-600 mt-1">League dates and timing</p>
            </div>
            
            <div className={`mobile-league-expandable ${expandedSections.schedule ? 'expanded' : 'collapsed'}`}>
              <div className="mobile-league-content">
                <div className={`mobile-league-grid ${isMobile ? '' : 'mobile-league-grid-responsive'}`}>
                  <div className="mobile-league-input-group">
                    <Input
                      label="Start Date"
                      type="date"
                      value={formData.startDate}
                      onChange={handleChange('startDate')}
                      error={errors.startDate}
                      required
                      helperText="League can be backdated if needed"
                    />
                  </div>

                  <div className="mobile-league-input-group">
                    <Input
                      label="End Date"
                      type="date"
                      value={formData.endDate}
                      onChange={handleChange('endDate')}
                      error={errors.endDate}
                      required
                      helperText="When the league ends"
                    />
                  </div>
                </div>

                {/* League Duration & Status Display */}
                {formData.startDate && formData.endDate && !errors.endDate && (
                  <div className="league-info-card">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold">League Timeline</h4>
                      <div className={`status-indicator ${leagueStatus.isActive ? 'status-active' : 'status-completed'}`}>
                        {leagueStatus.isActive ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Active Now
                          </>
                        ) : (
                          <>
                            <Clock className="h-4 w-4 mr-2" />
                            {formData.startDate > new Date().toISOString().split('T')[0] ? 'Upcoming' : 'Completed'}
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="league-duration-display">
                      <div className="text-center">
                        <div className="text-xl font-bold mb-2">{calculateDuration()}</div>
                        <div className="text-sm opacity-90 mb-3">League Duration</div>
                        <div className="text-base font-medium">{leagueStatus.timeInfo}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* League Details (Location & Website) */}
          <div className="mobile-league-section">
            <div 
              className="mobile-league-header"
              onClick={() => toggleSection('details')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 text-purple-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900">League Details</h3>
                </div>
                <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${expandedSections.details ? 'rotate-180' : ''}`} />
              </div>
              <p className="text-sm text-gray-600 mt-1">Location and website information</p>
            </div>
            
            <div className={`mobile-league-expandable ${expandedSections.details ? 'expanded' : 'collapsed'}`}>
              <div className="mobile-league-content">
                <div className="mobile-league-input-group">
                  <Input
                    label="Primary Location"
                    type="text"
                    value={formData.location}
                    onChange={handleChange('location')}
                    error={errors.location}
                    placeholder="Main venue, facility, or area for league play"
                    helperText="Optional - Enter primary venue or area where league games are played"
                  />
                  {formData.location && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleTestLocation}
                      className="mobile-league-touch-button mt-3"
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      Preview Location on Map
                    </Button>
                  )}
                </div>

                <div className="mobile-league-input-group">
                  <Input
                    label="League Website"
                    type="url"
                    value={formData.website}
                    onChange={handleChange('website')}
                    error={errors.website}
                    placeholder="https://example.com/league-info"
                    helperText="Optional - Link to league rules, schedule, standings, or information page"
                  />
                  {formData.website && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleTestWebsite}
                      className="mobile-league-touch-button mt-3"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Test Website Link
                    </Button>
                  )}
                </div>

                {/* Link Preview Section */}
                {(formData.location || formData.website) && (
                  <div className="link-preview-section">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Links Preview</h4>
                    <div className="space-y-2">
                      {formData.location && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">📍 Location: {formData.location}</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleTestLocation}
                            className="mobile-league-touch-button"
                          >
                            <MapPin className="h-3 w-3 mr-1" />
                            Maps
                          </Button>
                        </div>
                      )}
                      {formData.website && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">🌐 Website: {formData.website}</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleTestWebsite}
                            className="mobile-league-touch-button"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Visit
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* League Settings */}
          <div className="mobile-league-section">
            <div 
              className="mobile-league-header"
              onClick={() => toggleSection('settings')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Settings className="h-5 w-5 text-orange-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900">League Settings</h3>
                </div>
                <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${expandedSections.settings ? 'rotate-180' : ''}`} />
              </div>
              <p className="text-sm text-gray-600 mt-1">Registration fees and participant limits</p>
            </div>
            
            <div className={`mobile-league-expandable ${expandedSections.settings ? 'expanded' : 'collapsed'}`}>
              <div className="mobile-league-content">
                <div className={`mobile-league-grid ${isMobile ? '' : 'mobile-league-grid-responsive'}`}>
                  <div className="mobile-league-input-group">
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
                  </div>

                  <div className="mobile-league-input-group">
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

                  <div className="mobile-league-input-group">
                    <Input
                      label="Max Participants"
                      type="number"
                      value={formData.maxParticipants}
                      onChange={handleChange('maxParticipants')}
                      error={errors.maxParticipants}
                      min="1"
                      placeholder="2"
                      helperText="Maximum number of league members"
                    />
                  </div>
                </div>

                {/* Payment Preview */}
                {formData.registrationFee > 0 && (
                  <div className="league-payment-preview">
                    <h4 className="text-lg font-semibold mb-3 flex items-center">
                      <DollarSign className="h-5 w-5 mr-2" />
                      Registration Fees
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-4 text-center mb-4">
                      <div>
                        <div className="text-2xl font-bold">${formData.registrationFee}</div>
                        <div className="text-sm opacity-90">Per Person</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">${estimatedTotal}</div>
                        <div className="text-sm opacity-90">Total Dues</div>
                      </div>
                    </div>

                    <div className="bg-white bg-opacity-20 rounded-lg p-3">
                      <h5 className="font-medium mb-2">Payment Mode:</h5>
                      {formData.paymentMode === PAYMENT_MODES.INDIVIDUAL ? (
                        <ul className="text-sm space-y-1">
                          <li>• Each participant pays their own ${formData.registrationFee} registration fee</li>
                          <li>• Payment tracking is done per person</li>
                          <li>• Best for casual leagues or when members prefer to pay separately</li>
                        </ul>
                      ) : (
                        <ul className="text-sm space-y-1">
                          <li>• One person pays ${estimatedTotal} total registration for the entire league</li>
                          <li>• Other participants reimburse that person directly</li>
                          <li>• Simplified payment collection and tracking</li>
                        </ul>
                      )}
                    </div>
                  </div>
                )}

                {/* Active status checkbox */}
                <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                  <input
                    id="isActive"
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={handleChange('isActive')}
                    className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-3 flex-1">
                    <span className="block text-sm font-medium text-gray-900">Active league</span>
                    <span className="block text-sm text-gray-500">Inactive leagues won't appear in registration lists</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* ADDED: League Features Section */}
          <div className="mobile-league-section">
            <div className="mobile-league-content">
              <div className="league-features-card">
                <h4 className="text-lg font-semibold mb-3 flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  League Features
                </h4>
                <div className="league-features-grid">
                  <div className="space-y-3">
                    <div className="league-feature-item">
                      <CheckCircle className="league-feature-icon" />
                      Track weekly matches and standings
                    </div>
                    <div className="league-feature-item">
                      <CheckCircle className="league-feature-icon" />
                      Manage player schedules and court assignments
                    </div>
                    <div className="league-feature-item">
                      <CheckCircle className="league-feature-icon" />
                      Calculate rankings and statistics
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="league-feature-item">
                      <CheckCircle className="league-feature-icon" />
                      Handle make-up games and cancellations
                    </div>
                    <div className="league-feature-item">
                      <CheckCircle className="league-feature-icon" />
                      Season-long competition format
                    </div>
                    <div className="league-feature-item">
                      <CheckCircle className="league-feature-icon" />
                      Registration fee management
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cancel/Create Button for New Leagues */}
          {!league && (
            <div className="mobile-league-section">
              <div className="mobile-league-content">
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={loading || deleteLoading}
                    className="mobile-league-touch-button"
                  >
                    Cancel
                  </Button>
                  
                  <Button
                    type="submit"
                    loading={loading}
                    disabled={loading || deleteLoading}
                    className="mobile-league-touch-button"
                  >
                    Create League
                  </Button>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {}} // This will be handled by parent component
        title="Delete League"
        message={`Are you sure you want to delete "${formData.name}"? This action cannot be undone and will remove all associated data including participant registrations and standings.`}
        confirmText="Delete League"
        cancelText="Keep League"
        type="danger"
        loading={deleteLoading}
      />
    </div>
  );
};

export default LeagueForm;