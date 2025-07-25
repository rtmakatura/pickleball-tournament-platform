// src/components/league/LeagueForm.jsx (UPDATED - Added Results Integration)
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
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
  Activity,
  BarChart3,
  Award,
  Edit3,
  Target
} from 'lucide-react';
import { Input, Select, Button, Alert, Modal } from '../ui';
import { SKILL_LEVELS, LEAGUE_STATUS, PAYMENT_MODES, EVENT_TYPES } from '../../services/models';
import { formatWebsiteUrl, isValidUrl, generateGoogleMapsLink, openLinkSafely } from '../../utils/linkUtils';

// ADDED: Import results components
import { LeagueResultsForm } from '../result';
import { useResults } from '../../hooks';

// ADDED: Import hooks for help alert pattern
import { useAuth } from '../../hooks/useAuth';
import { useMembers } from '../../hooks/useMembers';

// MOBILE-OPTIMIZED: League form styles with responsive spacing
const mobileLeagueFormStyles = `
  /* Mobile-first form optimizations */
  .mobile-league-form {
    -webkit-overflow-scrolling: touch;
    scroll-behavior: smooth;
    padding: 0;
  }
  
  /* MOBILE-OPTIMIZED: Section headers */
  .mobile-league-header {
    padding: 16px;
    border-bottom: 1px solid #e5e7eb;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    cursor: pointer;
    transition: background-color 0.2s ease;
  }
  
  .mobile-league-section:first-child {
    margin-top: 0;
  }
  
  .mobile-league-section:last-child {
    margin-bottom: 0;
  }
  
  /* MOBILE-OPTIMIZED: Section headers */
  .mobile-league-header {
    padding: 12px 16px;
    border-bottom: 1px solid #e5e7eb;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    cursor: pointer;
    transition: background-color 0.2s ease;
  }
  
  .mobile-league-header:active {
    background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
  }
  
  /* MOBILE-OPTIMIZED: Content padding */
  .mobile-league-content {
    padding: 20px 16px;
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
  
  /* MOBILE-OPTIMIZED: Input group spacing */
  .mobile-league-input-group {
    margin-bottom: 20px;
  }
  
  .mobile-league-input-group:last-child {
    margin-bottom: 0;
  }
  
  .mobile-league-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 20px;
    margin-bottom: 20px;
  }
  
  /* Remove margin from grid children to prevent double spacing */
  .mobile-league-grid .mobile-league-input-group {
    margin-bottom: 0;
  }
  
  /* DESKTOP: Larger spacing for bigger screens */
  @media (min-width: 768px) {
    .mobile-league-section {
      border-radius: 16px;
      margin-bottom: 24px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }
    
    .mobile-league-header {
      padding: 20px;
    }
    
    .mobile-league-content {
      padding: 24px;
    }
    
    .mobile-league-input-group {
      margin-bottom: 24px;
    }
    
    .mobile-league-grid {
      gap: 24px;
      margin-bottom: 24px;
    }
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
  
  /* Progressive disclosure animations with proper state handling */
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
  
  /* MOBILE-OPTIMIZED: Enhanced info cards */
  .league-info-card {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    color: white;
    border-radius: 12px;
    padding: 12px;
    margin-bottom: 16px;
  }
  
  .league-duration-display {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 12px;
    margin-top: 12px;
    backdrop-filter: blur(10px);
  }
  
  .league-payment-preview {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    border-radius: 8px;
    padding: 12px;
    margin-top: 12px;
  }
  
  /* MOBILE-OPTIMIZED: Alerts */
  .mobile-league-alert {
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 16px;
  }
  
  /* DESKTOP: Larger cards */
  @media (min-width: 768px) {
    .league-info-card {
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 24px;
    }
    
    .league-duration-display {
      border-radius: 12px;
      padding: 16px;
      margin-top: 16px;
    }
    
    .league-payment-preview {
      border-radius: 12px;
      padding: 16px;
      margin-top: 16px;
    }
    
    .mobile-league-alert {
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 24px;
    }
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
  
  /* Form container with consistent padding - removed, using p-6 class instead */
  
  /* MOBILE-OPTIMIZED: League features info card styling */
  .league-features-card {
    background: linear-gradient(135deg, #059669 0%, #047857 100%);
    color: white;
    border-radius: 12px;
    padding: 12px;
    margin-bottom: 16px;
  }
  
  .league-features-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  @media (min-width: 768px) {
    .league-features-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
  }
  
  .league-feature-item {
    display: flex;
    align-items: center;
    font-size: 0.75rem;
    line-height: 1rem;
    opacity: 0.95;
  }
  
  .league-feature-icon {
    height: 0.875rem;
    width: 0.875rem;
    margin-right: 0.375rem;
    color: rgba(255, 255, 255, 0.9);
    flex-shrink: 0;
  }
  
  /* DESKTOP: Larger features card */
  @media (min-width: 768px) {
    .league-features-card {
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 24px;
    }
    
    .league-feature-item {
      font-size: 0.875rem;
      line-height: 1.25rem;
    }
    
    .league-feature-icon {
      height: 1rem;
      width: 1rem;
      margin-right: 0.5rem;
    }
  }

  /* ADDED: Results section styling */
  .league-results-section {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 24px;
  }
  
  .league-results-section h4 {
    display: flex;
    align-items: center;
    font-size: 1.125rem;
    font-weight: 600;
    margin-bottom: 16px;
  }
  
  .results-icon {
    height: 1.25rem;
    width: 1.25rem;
    margin-right: 0.5rem;
  }
  
  .results-actions {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
    margin-top: 16px;
  }
  
  .results-button {
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
    padding: 12px 16px;
    border-radius: 12px;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.2s ease;
    backdrop-filter: blur(10px);
  }
  
  .results-button:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-1px);
  }
  
  .results-button:active {
    transform: translateY(0);
  }
  
  .results-status {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 16px;
    margin-top: 16px;
    backdrop-filter: blur(10px);
  }
  
  .results-summary {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 16px;
    margin-top: 16px;
  }
  
  .results-summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 12px;
    text-align: center;
  }
  
  .results-summary-item {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 12px 8px;
  }
  
  .results-summary-number {
    font-size: 1.5rem;
    font-weight: bold;
    line-height: 1;
    margin-bottom: 4px;
  }
  
  .results-summary-label {
    font-size: 0.75rem;
    opacity: 0.9;
    line-height: 1;
  }
`;

const StyleSheet = () => (
  <style dangerouslySetInnerHTML={{ __html: mobileLeagueFormStyles }} />
);

/**
 * UPDATED: Mobile-Optimized League Form Component with Results Integration
 */
const LeagueForm = ({ 
  league = null, 
  onSubmit, 
  onCancel, 
  loading = false,
  deleteLoading = false,
  isReadOnly = false
}) => {
  // ADDED: Results hook integration
  const { 
    results, 
    loading: resultsLoading, 
    addLeagueResults, 
    updateLeagueResults 
  } = useResults();

  // ADDED: Auth hook for help alert pattern
  const { user } = useAuth();
  const { members: allMembers, updateMember } = useMembers();

  // ADDED: Get current member using the established pattern
  const currentMember = useMemo(() => 
    allMembers.find(m => m.authUid === user?.uid), 
    [allMembers, user?.uid]
  );

  // ADDED: Help alert state management
  const [showHelpAlert, setShowHelpAlert] = useState(false);

  // Helper function to check if league has results
  const hasResults = useCallback(() => {
    if (!league?.id) return false;
    return results.league?.some(result => result.eventId === league.id) || false;
  }, [league?.id, results.league]);

  // Get existing results for this league
  const existingResults = useCallback(() => {
    if (!league?.id) return null;
    return results.league?.find(result => result.eventId === league.id) || null;
  }, [league?.id, results.league]);

  // Mobile detection with initial state
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });
  
  // Mobile-conservative section expansion logic
  const getInitialSectionState = useCallback(() => {
    const isNewEntry = !league;
    
    // Desktop: Always expanded for better UX
    if (!isMobile) {
      return {
        basic: true,
        schedule: true,
        details: true,
        settings: true,
        results: league && league.status === LEAGUE_STATUS.COMPLETED
      };
    }
    
    // MOBILE: Start with only basic section expanded to save space
    return {
      basic: true,
      schedule: false,
      details: false,
      settings: false,
      results: false
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
  
  // Add internal loading state to prevent race conditions
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ADDED: Results modal state
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [resultsSubmitLoading, setResultsSubmitLoading] = useState(false);

  // ADDED: Show help alert when user loads (for new leagues only)
  useEffect(() => {
    const checkMemberPreferences = async () => {
      console.log('🚨 LeagueForm Alert Check:', {
        league: !!league,
        leagueId: league?.id,
        currentMember: !!currentMember,
        currentMemberId: currentMember?.id,
        memberData: currentMember
      });
      
      if (!league && currentMember) {
        try {
          // Check if member has dismissed the help alert
          const hideCreateLeagueHelp = currentMember.hideCreateLeagueHelp || false;
          const shouldShow = !hideCreateLeagueHelp;
          
          console.log('🚨 Debug showHelpAlert useEffect (member-based):', {
            league: !!league,
            currentMember: !!currentMember,
            memberId: currentMember.id,
            hideCreateLeagueHelp,
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
          reason: league ? 'Editing existing league' : 'No current member found',
          league: !!league,
          currentMember: !!currentMember
        });
        setShowHelpAlert(false);
      }
    };

    checkMemberPreferences();
  }, [league, currentMember]);

  // Mobile detection with proper cleanup
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Update section states when context changes
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

  // Handle form submission - ASYNC with proper error handling
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isSubmitting) return;
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Convert date strings to Date objects and format website URL
      const submissionData = {
        ...formData,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        website: formData.website ? formatWebsiteUrl(formData.website) : '',
        registrationFee: parseFloat(formData.registrationFee),
        maxParticipants: parseInt(formData.maxParticipants)
      };

      await onSubmit(submissionData);
      
    } catch (error) {
      console.error('League submission error:', error);
      setErrors({ submit: error.message });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, isSubmitting, validateForm, onSubmit]);

  // ADDED: Help alert handlers for league creation
  const handleCloseHelpAlert = useCallback(() => {
    setShowHelpAlert(false);
  }, []);

  const handleDontShowAgain = useCallback(async () => {
    setShowHelpAlert(false);
    
    if (currentMember?.id) {
      try {
        // Update member document with preference
        await updateMember(currentMember.id, {
          hideCreateLeagueHelp: true
        });
        console.log('Member preferences updated successfully');
      } catch (error) {
        console.error('Error updating member preferences:', error);
        // You could show an error message to the user here if desired
      }
    }
  }, [currentMember, updateMember]);

  // ADDED: Results handling functions
  const handleMarkCompleteAndEnterResults = useCallback(async () => {
    if (!league) return;
    
    try {
      // First update league status to completed
      const submissionData = {
        ...formData,
        status: LEAGUE_STATUS.COMPLETED,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        website: formData.website ? formatWebsiteUrl(formData.website) : '',
        registrationFee: parseFloat(formData.registrationFee),
        maxParticipants: parseInt(formData.maxParticipants)
      };
      
      await onSubmit(submissionData);
      
      // Then open results modal
      setShowResultsModal(true);
    } catch (error) {
      setErrors({ statusUpdate: `Failed to update league status: ${error.message}` });
    }
  }, [league, formData, onSubmit]);

  const handleEnterResults = useCallback(() => {
    setShowResultsModal(true);
  }, []);

  const handleResultsSubmit = useCallback(async (resultsData) => {
    if (!league) return;
    
    setResultsSubmitLoading(true);
    try {
      if (hasResults()) {
        await updateLeagueResults(league.id, resultsData);
      } else {
        await addLeagueResults(league.id, resultsData);
      }
      
      setShowResultsModal(false);
      setErrors({});
    } catch (error) {
      setErrors({ resultsSubmit: `Failed to save results: ${error.message}` });
    } finally {
      setResultsSubmitLoading(false);
    }
  }, [league, hasResults, addLeagueResults, updateLeagueResults]);

  const handleResultsCancel = useCallback(() => {
    setShowResultsModal(false);
  }, []);

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

  // ADDED: Results summary calculation
  const getResultsSummary = useCallback(() => {
    const results = existingResults();
    if (!results) return null;

    const standings = results.standings || [];
    const totalParticipants = standings.length;

    return {
      totalParticipants,
      seasonInfo: results.seasonInfo,
      endDate: league?.endDate,
      location: league?.location
    };
  }, [existingResults, league]);

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

  // ADDED: Check if league can have results entered
  const canEnterResults = league && league.status === LEAGUE_STATUS.COMPLETED;
  const canMarkComplete = league && 
    league.status === LEAGUE_STATUS.ACTIVE && 
    !hasResults();

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
    <>
      <StyleSheet />
      
      {/* Plain form component without Modal wrapper */}
      <div className="mobile-league-form">
        {/* Consistent container with proper padding */}
        <div style={{ padding: '24px' }}>
          {/* Error alerts for submission issues */}
          {errors.submit && (
            <div className="mobile-league-alert">
              <Alert 
                type="error" 
                title="Submission Error" 
                message={errors.submit}
                onClose={() => setErrors(prev => ({ ...prev, submit: null }))}
              />
            </div>
          )}

          {errors.statusUpdate && (
            <div className="mobile-league-alert">
              <Alert 
                type="error" 
                title="Status Update Error" 
                message={errors.statusUpdate}
                onClose={() => setErrors(prev => ({ ...prev, statusUpdate: null }))}
              />
            </div>
          )}

          {errors.resultsSubmit && (
            <div className="mobile-league-alert">
              <Alert 
                type="error" 
                title="Results Save Error" 
                message={errors.resultsSubmit}
                onClose={() => setErrors(prev => ({ ...prev, resultsSubmit: null }))}
              />
            </div>
          )}

              {/* Help Alert for New Leagues */}
          {showHelpAlert && (
            <div className="mobile-league-alert">
              {/* Mobile: Compact alert */}
              <div className="block sm:hidden">
                <Alert 
                  type="info" 
                  title="League Creation Tips"
                  message={
                    <div className="text-sm">
                      <p className="mb-2">
                        Leagues track final standings and placements of competing teams over a season.
                      </p>
                      <p className="text-xs text-blue-600">
                        💡 Flow: Basic info → Schedule → Settings → Add teams → Record final standings
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
                  title="Creating a League"
                  message={
                    <div className="space-y-3">
                      <p>
                        Leagues are season-long competitions where teams compete for final standings and placements. At the end of the season, you'll record the final team rankings and positions.
                      </p>
                      <p>
                        <strong>Example:</strong> A 10-week Mixed Doubles league with 8 teams competing. At season end, you'll record which team placed 1st, 2nd, 3rd, etc.
                      </p>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                        <p className="font-medium mb-1 text-blue-900">💡 Typical Workflow:</p>
                        <p className="text-sm text-blue-800">League details → Season dates → Registration fee → Add teams → Record final standings</p>
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
                      disabled={isSubmitting || isReadOnly}
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
                      disabled={isSubmitting || isReadOnly}
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
                        disabled={isSubmitting || isReadOnly}
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
                        disabled={isSubmitting || isReadOnly}
                      />
                    </div>

                    <div className="mobile-league-input-group">
                      <Select
                        label="Status"
                        value={formData.status}
                        onChange={handleChange('status')}
                        options={statusOptions}
                        helperText="Current league status"
                        disabled={isSubmitting || isReadOnly}
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
                        disabled={isSubmitting || isReadOnly}
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
                        disabled={isSubmitting || isReadOnly}
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
                      disabled={isSubmitting || isReadOnly}
                    />
                    {formData.location && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleTestLocation}
                        className="mobile-league-touch-button mt-3"
                        disabled={isSubmitting}
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
                      disabled={isSubmitting || isReadOnly}
                    />
                    {formData.website && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleTestWebsite}
                        className="mobile-league-touch-button mt-3"
                        disabled={isSubmitting}
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
                              disabled={isSubmitting}
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
                              disabled={isSubmitting}
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
                        disabled={isSubmitting || isReadOnly}
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
                        disabled={isSubmitting || isReadOnly}
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
                        disabled={isSubmitting || isReadOnly}
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
                      disabled={isSubmitting || isReadOnly}
                    />
                    <label htmlFor="isActive" className="ml-3 flex-1">
                      <span className="block text-sm font-medium text-gray-900">Active league</span>
                      <span className="block text-sm text-gray-500">Inactive leagues won't appear in registration lists</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* ADDED: Results Management Section */}
            {canEnterResults && (
              <div className="mobile-league-section">
                <div 
                  className="mobile-league-header"
                  onClick={() => toggleSection('results')}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <BarChart3 className="h-5 w-5 text-green-600 mr-3" />
                      <h3 className="text-lg font-semibold text-gray-900">League Results</h3>
                    </div>
                    <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${expandedSections.results ? 'rotate-180' : ''}`} />
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Enter final standings and season results</p>
                </div>
                
                <div className={`mobile-league-expandable ${expandedSections.results ? 'expanded' : 'collapsed'}`}>
                  <div className="mobile-league-content">
                    <div className="league-results-section">
                      {hasResults() ? (
                        <>
                          <h4>
                            <Award className="results-icon" />
                            Results Entered
                          </h4>
                          
                          <div className="results-status">
                            <p className="text-sm opacity-90 mb-4">
                              League results have been recorded and saved.
                            </p>
                            
                            {(() => {
                              const summary = getResultsSummary();
                              return summary && (
                                <div className="results-summary">
                                  <div className="results-summary-grid">
                                    <div className="results-summary-item">
                                      <div className="results-summary-number">{summary.totalParticipants}</div>
                                      <div className="results-summary-label">Participants</div>
                                    </div>
                                    <div className="results-summary-item">
                                      <div className="results-summary-number">
                                        {summary.seasonInfo?.totalWeeks || 'N/A'}
                                      </div>
                                      <div className="results-summary-label">Weeks</div>
                                    </div>
                                    <div className="results-summary-item">
                                      <div className="results-summary-number">
                                        {summary.endDate ? 
                                          new Date(summary.endDate.seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) 
                                          : 'TBD'
                                        }
                                      </div>
                                      <div className="results-summary-label">End Date</div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                          
                          <div className="results-actions">
                            <button
                              type="button"
                              onClick={handleEnterResults}
                              className="results-button"
                              disabled={resultsSubmitLoading}
                            >
                              <Edit3 className="h-4 w-4 mr-2" />
                              Edit Results
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <h4>
                            <BarChart3 className="results-icon" />
                            Enter League Results
                          </h4>
                          
                          <div className="results-status">
                            <p className="text-sm opacity-90 mb-4">
                              Record final standings, season statistics, and participant performance.
                            </p>
                            
                            <div className="text-xs opacity-75">
                              <p>• League standings and final positions</p>
                              <p>• Season wins, losses, and statistics</p>
                              <p>• Individual player performance tracking</p>
                            </div>
                          </div>
                          
                          <div className="results-actions">
                            {canMarkComplete && (
                              <button
                                type="button"
                                onClick={handleMarkCompleteAndEnterResults}
                                className="results-button"
                                disabled={resultsSubmitLoading}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Mark Complete & Enter Results
                              </button>
                            )}
                            
                            <button
                              type="button"
                              onClick={handleEnterResults}
                              className="results-button"
                              disabled={resultsSubmitLoading}
                            >
                              <BarChart3 className="h-4 w-4 mr-2" />
                              Enter Results
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* League Features Section */}
            <div className="mobile-league-section">
              <div className="mobile-league-content">
                <div className="league-features-card">
                  <h4 className="text-lg font-semibold mb-3 flex items-center">
                    <Target className="h-5 w-5 mr-2" />
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

            {/* Footer buttons removed - Dashboard handles all modal actions via header buttons */}
          </form>
        </div>
      </div>

      {/* ADDED: Results Entry Modal */}
      {league && (
        <Modal
          isOpen={showResultsModal}
          onClose={handleResultsCancel}
          title={`Enter Results: ${league.name}`}
          size="xl"
        >
          <LeagueResultsForm
            league={league}
            members={[]} // Will be passed from parent component
            onSubmit={handleResultsSubmit}
            onCancel={handleResultsCancel}
            loading={resultsSubmitLoading}
            existingResults={existingResults()}
          />
        </Modal>
      )}
    </>
  );
};

export default LeagueForm;