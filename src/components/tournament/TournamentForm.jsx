// src/components/tournament/TournamentForm.jsx (UPDATED - Added Results Integration)
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  X,
  Target,
  BarChart3,
  Clock,
  Award,
  Activity
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useMembers } from '../../hooks/useMembers';
import { updateDoc, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Input, Select, Button, Alert, ConfirmDialog, Card, Modal, ModalHeaderButton } from '../ui';
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

// ADDED: Import results components
import { TournamentResultsForm } from '../result';
import { useResults } from '../../hooks';

// Updated tournament form styles with mobile-optimized spacing
const tournamentFormStyles = `
  /* Base form container */
  .tournament-form {
    -webkit-overflow-scrolling: touch;
    scroll-behavior: smooth;
  }
  
  /* MOBILE-FIRST: Responsive section spacing system */
  .form-section {
    background: white;
    border-radius: 12px;
    border: 1px solid #e5e7eb;
    margin-bottom: 12px;
    overflow: visible;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    position: relative;
    z-index: 1;
  }
  
  .form-section:last-child {
    margin-bottom: 0;
  }
  
  /* MOBILE-OPTIMIZED: Section content padding */
  .form-section-content {
    padding: 20px 16px;
    position: relative;
    z-index: 15;
    overflow: visible;
  }
  
  /* MOBILE-OPTIMIZED: Section headers */
  .form-section-header {
    padding: 16px;
    border-bottom: 1px solid #e5e7eb;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    cursor: pointer;
    transition: background-color 0.2s ease;
  }
  
  .form-section-header:active {
    background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
  }
  
  /* MOBILE-OPTIMIZED: Consistent input group spacing with Input component override */
  .form-input-group {
    margin-bottom: 20px;
  }
  
  .form-input-group:last-child {
    margin-bottom: 0;
  }
  
  /* Override Input component internal spacing */
  .form-input-group > * {
    margin-bottom: 0 !important;
    margin-top: 0 !important;
  }
  
  /* Ensure helper text doesn't add extra spacing */
  .form-input-group .helper-text,
  .form-input-group [class*="helper"],
  .form-input-group [class*="Helper"] {
    margin-bottom: 0 !important;
    margin-top: 4px !important;
  }
  
  /* Override any Input component margin/padding */
  .form-input-group input,
  .form-input-group select,
  .form-input-group textarea {
    margin: 0 !important;
  }
  
  /* Override label spacing */
  .form-input-group label {
    margin-bottom: 6px !important;
    margin-top: 0 !important;
  }
  
  /* DESKTOP: Larger spacing for bigger screens */
  @media (min-width: 768px) {
    .form-section {
      border-radius: 16px;
      margin-bottom: 24px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }
    
    .form-section-content {
      padding: 24px;
    }
    
    .form-section-header {
      padding: 20px;
    }
    
    .form-input-group {
      margin-bottom: 24px;
    }
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
    gap: 20px;
    margin-bottom: 20px;
  }
  
  @media (min-width: 640px) {
    .form-grid-sm {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  
  @media (min-width: 768px) {
    .form-grid {
      gap: 24px;
      margin-bottom: 24px;
    }
  }
  
  /* Remove margin from form-input-groups inside grids */
  .form-grid .form-input-group {
    margin-bottom: 0;
  }
  
  @media (min-width: 1024px) {
    .form-grid-lg {
      grid-template-columns: repeat(3, 1fr);
    }
  }
  
  /* Progressive disclosure animations - FIXED: Allow dropdowns to escape */
  .form-expandable {
    transition: max-height 0.3s ease-out, opacity 0.2s ease-out;
    overflow: visible;
  }
  
  .form-expandable.collapsed {
    max-height: 0;
    opacity: 0;
    overflow: hidden;
  }
  
  .form-expandable.expanded {
    max-height: 2000px;
    opacity: 1;
    overflow: visible;
  }
  
  /* MOBILE-OPTIMIZED: Division cards */
  .division-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 20px;
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
  
  /* DESKTOP: Larger division cards */
  @media (min-width: 768px) {
    .division-card {
      border: 2px solid #e5e7eb;
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 24px;
    }
  }
  
  /* MOBILE-OPTIMIZED: Summary cards */
  .summary-card {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    color: white;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 20px;
  }
  
  .quick-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    text-align: center;
  }
  
  .stat-item {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 8px;
    padding: 8px 4px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    min-height: 60px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
  
  /* DESKTOP: Larger summary cards */
  @media (min-width: 768px) {
    .summary-card {
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 32px;
    }
    
    .quick-stats {
      gap: 12px;
    }
    
    .stat-item {
      border-radius: 12px;
      padding: 16px 12px;
      min-height: 80px;
    }
  }
  
  .stat-number {
    font-size: 1.125rem;
    font-weight: bold;
    line-height: 1.2;
    margin-bottom: 6px;
    word-break: break-word;
    text-align: center;
  }
  
  @media (min-width: 640px) {
    .stat-number {
      font-size: 1.25rem;
      margin-bottom: 4px;
      line-height: 1;
    }
  }
  
  .stat-label {
    font-size: 0.75rem;
    opacity: 0.9;
    line-height: 1.2;
    font-weight: 500;
  }
  
  @media (min-width: 640px) {
    .stat-label {
      font-size: 0.6875rem;
      line-height: 1;
    }
  }
  
  /* MOBILE-OPTIMIZED: Tournament features info card styling */
  .tournament-features-card {
    background: linear-gradient(135deg, #059669 0%, #047857 100%);
    color: white;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 20px;
  }
  
  .tournament-features-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  @media (min-width: 768px) {
    .tournament-features-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
  }
  
  .tournament-feature-item {
    display: flex;
    align-items: center;
    font-size: 0.75rem;
    line-height: 1rem;
    opacity: 0.95;
  }
  
  .tournament-feature-icon {
    height: 0.875rem;
    width: 0.875rem;
    margin-right: 0.375rem;
    color: rgba(255, 255, 255, 0.9);
    flex-shrink: 0;
  }
  
  /* MOBILE-OPTIMIZED: Division list spacing */
  .division-add-button {
    margin-bottom: 20px;
  }
  
  /* DESKTOP: Larger features card */
  @media (min-width: 768px) {
    .tournament-features-card {
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 24px;
    }
    
    .tournament-feature-item {
      font-size: 0.875rem;
      line-height: 1.25rem;
    }
    
    .tournament-feature-icon {
      height: 1rem;
      width: 1rem;
      margin-right: 0.5rem;
    }
    
    .division-add-button {
      margin-bottom: 32px;
    }
  }

  /* ADDED: Results section styling */
  .results-section {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 24px;
  }
  
  .results-section h4 {
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

  /* ADDED: Enhanced dropdown positioning to escape containers */
  .dropdown-container {
    position: relative;
    z-index: 100;
  }
  
  .dropdown-container .custom-select-dropdown {
    position: fixed !important;
    z-index: 9999 !important;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15) !important;
    border: 1px solid #d1d5db !important;
    background: white !important;
    max-height: 240px !important;
    overflow-y: auto !important;
  }
  
  /* Mobile dropdown optimizations */
  @media (max-width: 768px) {
    .dropdown-container .custom-select-dropdown {
      max-height: 200px !important;
      left: 16px !important;
      right: 16px !important;
      width: auto !important;
    }
  }
`;

const StyleSheet = () => (
  <style dangerouslySetInnerHTML={{ __html: tournamentFormStyles }} />
);

/**
 * UPDATED: Tournament Form Component with Results Integration
 */
const TournamentForm = ({ 
  tournament = null, 
  onSubmit, 
  onCancel, 
  onUpdateTournament,
  onParticipantChange = null,
  loading = false,
  deleteLoading = false,
  members = [],
  isReadOnly = false
}) => {
  
  const isInitialMount = useRef(true);
  const tournamentIdRef = useRef(null);

  // ADDED: Results hook integration
  const { 
    results, 
    loading: resultsLoading, 
    addTournamentResults, 
    updateTournamentResults 
  } = useResults();

  // ADDED: Auth hook for user preferences
  const { user } = useAuth();
  const { members: allMembers, updateMember } = useMembers();

  // ADDED: Get current member using the established pattern
  const currentMember = useMemo(() => 
    allMembers.find(m => m.authUid === user?.uid), 
    [allMembers, user?.uid]
  );

  // ADDED: Help alert state management
  const [showHelpAlert, setShowHelpAlert] = useState(false);
  const [showDivisionHelpAlert, setShowDivisionHelpAlert] = useState(false);

  // ADDED: Show help alert when user loads (for new tournaments only) - now uses member collection
  useEffect(() => {
    const checkMemberPreferences = async () => {
      console.log('🚨 TournamentForm Alert Check:', {
        tournament: !!tournament,
        tournamentId: tournament?.id,
        currentMember: !!currentMember,
        memberId: currentMember?.id,
        memberData: currentMember
      });
      
      if (!tournament && currentMember) {
        try {
          // Check if member has dismissed the help alert
          const hideCreateTournamentHelp = currentMember.hideCreateTournamentHelp || false;
          const shouldShow = !hideCreateTournamentHelp;
          
          console.log('🚨 Debug showHelpAlert useEffect (member-based):', {
            tournament: !!tournament,
            currentMember: !!currentMember,
            memberId: currentMember.id,
            hideCreateTournamentHelp,
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
          reason: tournament ? 'Editing existing tournament' : 'No current member found',
          tournament: !!tournament,
          currentMember: !!currentMember
        });
        setShowHelpAlert(false);
      }
    };

    checkMemberPreferences();
  }, [tournament, currentMember]);

  // Helper function to check if tournament has results
  const hasResults = useCallback(() => {
    if (!tournament?.id) return false;
    return results.tournament?.some(result => result.eventId === tournament.id) || false;
  }, [tournament?.id, results.tournament]);

  // Get existing results for this tournament
  const existingResults = useCallback(() => {
    if (!tournament?.id) return null;
    return results.tournament?.find(result => result.eventId === tournament.id) || null;
  }, [tournament?.id, results.tournament]);

  // Improved date formatting
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

  // Better division initialization
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
    
    // For new tournaments, start with empty divisions array
    return [];
  }, [tournament]);

  // Mobile detection with proper initial state
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });
  
  // Section expansion logic
  // Mobile-conservative section expansion logic
  const getInitialSectionState = useCallback(() => {
    const isNewEntry = !tournament;
    
    if (!isMobile) {
      return {
        basic: true,
        details: true,
        divisions: true,
        participants: true,
        results: tournament && (tournament.status === TOURNAMENT_STATUS.COMPLETED || tournament.status === TOURNAMENT_STATUS.IN_PROGRESS)
      };
    }
    
    // MOBILE: Start with only basic section expanded to save space
    return {
      basic: true,
      details: false,
      divisions: false,
      participants: false,
      results: false
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
  
  // ADDED: Results modal state
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [resultsSubmitLoading, setResultsSubmitLoading] = useState(false);
  
  // ADDED: Protection against real-time subscription overwrites
  const [userIsEditing, setUserIsEditing] = useState(false);
  const userEditingTimeoutRef = useRef(null);

  // ADDED: Help alert handlers
  const handleCloseHelpAlert = useCallback(() => {
    setShowHelpAlert(false);
  }, []);

  const handleDontShowAgain = useCallback(async () => {
    setShowHelpAlert(false);
    
    if (currentMember?.id) {
      try {
        // Update member document with preference
        await updateMember(currentMember.id, {
          hideCreateTournamentHelp: true
        });
        console.log('Member preferences updated successfully');
      } catch (error) {
        console.error('Error updating member preferences:', error);
        // You could show an error message to the user here if desired
      }
    }
  }, [currentMember, updateMember]);

  // ADDED: Division help alert handlers
  const handleCloseDivisionHelpAlert = useCallback(() => {
    setShowDivisionHelpAlert(false);
  }, []);

  const handleDivisionDontShowAgain = useCallback(async () => {
    setShowDivisionHelpAlert(false);
    
    if (currentMember?.id) {
      try {
        // Update member document with division preference
        await updateMember(currentMember.id, {
          hideDivisionCreationHelp: true
        });
        console.log('Division help preferences updated successfully');
      } catch (error) {
        console.error('Error updating division help preferences:', error);
      }
    }
  }, [currentMember, updateMember]);

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

  // State synchronization with user editing protection
  useEffect(() => {
    // Don't sync if user is actively editing to prevent overwrites
    if (userIsEditing) {
      return;
    }
    
    // Only sync when tournament changes (new tournament loaded)
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
      
      // Clear any field-level errors when loading new tournament
      setErrors({});
      setIsSubmitting(false);
      
      // Reset editing flag for new tournament
      setUserIsEditing(false);
    } else if (!tournament && !userIsEditing) {
      // Only reset form if user isn't editing (creating new tournament)
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
      setErrors({});
      setIsSubmitting(false);
    }
    
    isInitialMount.current = false;
  }, [tournament, formatDateForInput, initializeDivisions, userIsEditing]);

  // Section toggle
  const toggleSection = useCallback((section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  // Input change handler with editing protection
  const handleChange = useCallback((field) => (e) => {
    const value = e.target.value;
    
    // Set user editing flag to prevent real-time overwrites
    setUserIsEditing(true);
    
    // Note: userIsEditing will only be reset when form is saved/cancelled/navigated awa
    
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
    
    // Immediately persist changes if we're editing an existing tournament
    if (tournament && tournament.id && onUpdateTournament) {
      const updateData = { [field]: value };
      
      // Handle date fields - convert to Date objects
      if (field === 'eventDate' || field === 'registrationDeadline') {
        updateData[field] = value ? new Date(value + 'T00:00:00') : null;
      }
      
      // Handle website formatting
      if (field === 'website') {
        updateData[field] = value ? formatWebsiteUrl(value) : '';
      }
      
      onUpdateTournament(tournament.id, updateData).catch(error => {
        setErrors(prev => ({
          ...prev,
          [field]: `Failed to update ${field}: ${error.message}`
        }));
      });
    }
  }, [errors, tournament, onUpdateTournament, formData.status]);

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
    setDivisionSaving(true);
    
    try {
      const updatedDivisions = divisions.filter((_, i) => i !== index);
      setDivisions(updatedDivisions);
      
      if (tournament && tournament.id && onUpdateTournament) {
        await onUpdateTournament(tournament.id, { divisions: updatedDivisions });
      }
      
      // ADDED: Notify parent of participant changes for change detection
      if (onParticipantChange && tournament) {
        onParticipantChange({ ...tournament, divisions: updatedDivisions });
      }
      
    } catch (error) {
      console.error('Error deleting division:', error);
      setErrors({ divisionDelete: `Failed to delete division: ${error.message}` });
      setDivisions(divisions);
    } finally {
      setDivisionSaving(false);
    }
  }, [divisions, tournament, onUpdateTournament, onParticipantChange]);

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
      
      // ADDED: Notify parent of participant changes for change detection
      if (onParticipantChange && tournament) {
        onParticipantChange({ ...tournament, divisions: updatedDivisions });
      }
      
      setShowDivisionModal(false);
      setEditingDivisionIndex(null);
      
    } catch (error) {
      console.error('Error saving division:', error);
      setErrors({ divisionSave: `Failed to save division: ${error.message}` });
    } finally {
      setDivisionSaving(false);
    }
  }, [editingDivisionIndex, divisions, tournament, onUpdateTournament, onParticipantChange]);

  // Division participants change handler
  const handleDivisionParticipantsChange = useCallback((divisionId, participants) => {
    const updatedDivisions = divisions.map(division => 
      division.id === divisionId 
        ? { ...division, participants }
        : division
    );
    
    setDivisions(updatedDivisions);
    
    // Update tournament immediately if we have an update function and tournament exists
    if (onUpdateTournament && tournament?.id) {
      onUpdateTournament(tournament.id, { divisions: updatedDivisions });
    }
    
    // ADDED: Notify parent of participant changes for change detection
    if (onParticipantChange && tournament) {
      onParticipantChange({ ...tournament, divisions: updatedDivisions });
    }
  }, [divisions, onUpdateTournament, tournament, onParticipantChange]);

  // ADDED: Results handling functions
  const handleMarkCompleteAndEnterResults = useCallback(async () => {
    if (!tournament) return;
    
    try {
      // First update tournament status to completed
      await onUpdateTournament(tournament.id, { 
        status: TOURNAMENT_STATUS.COMPLETED 
      });
      
      // Then open results modal
      setShowResultsModal(true);
    } catch (error) {
      setErrors({ statusUpdate: `Failed to update tournament status: ${error.message}` });
    }
  }, [tournament, onUpdateTournament]);

  const handleEnterResults = useCallback(() => {
    setShowResultsModal(true);
  }, []);

  const handleResultsSubmit = useCallback(async (resultsData) => {
    if (!tournament) return;
    
    setResultsSubmitLoading(true);
    try {
      if (hasResults()) {
        await updateTournamentResults(tournament.id, resultsData);
      } else {
        await addTournamentResults(tournament.id, resultsData);
      }
      
      setShowResultsModal(false);
      setErrors({});
    } catch (error) {
      setErrors({ resultsSubmit: `Failed to save results: ${error.message}` });
    } finally {
      setResultsSubmitLoading(false);
    }
  }, [tournament, hasResults, addTournamentResults, updateTournamentResults]);

  const handleResultsCancel = useCallback(() => {
    setShowResultsModal(false);
  }, []);

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

    // Validate existing divisions (allow empty divisions array for new tournaments)
    divisions.forEach((division, index) => {
      const divisionValidation = validateDivision(division);
      if (!divisionValidation.isValid) {
        newErrors[`division_${index}`] = `Division ${index + 1}: ${divisionValidation.errors.join(', ')}`;
      }
    });

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
      
      // Reset editing flag after successful submission
      setUserIsEditing(false);
      
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
    if (!eventType) return '';
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

  // ADDED: Results summary calculation
  const getResultsSummary = useCallback(() => {
    const results = existingResults();
    if (!results) return null;

    const divisionResults = results.divisionResults || [];
    const totalParticipants = divisionResults.reduce((sum, div) => sum + (div.standings?.length || 0), 0);
    const totalDivisions = divisionResults.length;

    return {
      totalDivisions,
      totalParticipants,
      eventDate: tournament?.eventDate,
      location: tournament?.location
    };
  }, [existingResults, tournament]);

  // Dropdown options
  const statusOptions = Object.entries(TOURNAMENT_STATUS).map(([key, value]) => ({
    value,
    label: key.split('_').map(word => 
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ')
  }));

  // ADDED: Check if tournament can have results entered
  const canEnterResults = tournament && (
    tournament.status === TOURNAMENT_STATUS.IN_PROGRESS || 
    tournament.status === TOURNAMENT_STATUS.COMPLETED
  );

  const canMarkComplete = tournament && 
    tournament.status === TOURNAMENT_STATUS.IN_PROGRESS && 
    !hasResults();

  // Reset editing flag when component unmounts or onCancel is called
  useEffect(() => {
    return () => {
      setUserIsEditing(false);
    };
  }, []);

  return (
    <div className="tournament-form">
      <StyleSheet />
      
      <div className="p-3 sm:p-6">
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

        {errors.statusUpdate && (
          <div className="form-section">
            <div className="form-section-content">
              <Alert 
                type="error" 
                title="Status Update Error" 
                message={errors.statusUpdate} 
                onClose={() => setErrors(prev => ({ ...prev, statusUpdate: null }))}
              />
            </div>
          </div>
        )}

        {errors.resultsSubmit && (
          <div className="form-section">
            <div className="form-section-content">
              <Alert 
                type="error" 
                title="Results Save Error" 
                message={errors.resultsSubmit} 
                onClose={() => setErrors(prev => ({ ...prev, resultsSubmit: null }))}
              />
            </div>
          </div>
        )}

        {errors.delete && (
          <div className="form-section">
            <div className="form-section-content">
              <Alert 
                type="error" 
                title="Division Delete Error" 
                message={errors.delete} 
                onClose={() => setErrors(prev => ({ ...prev, delete: null }))}
              />
            </div>
          </div>
        )}

        {/* Help Alert for New Tournaments */}
        {showHelpAlert && (
            <div className="mb-4">
              {/* Mobile: Compact alert */}
              <div className="block sm:hidden">
                <Alert 
                  type="info" 
                  title="Tournament Tips"
                  message={
                    <div className="text-sm">
                      <p className="mb-2">
                        Tournaments can have multiple divisions (e.g., Men's Doubles + Mixed Doubles).
                      </p>
                      <p className="text-xs text-blue-600">
                        💡 Flow: Basic info → Add divisions → Assign participants
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
                  title="Creating a Tournament"
                  message={
                    <div className="space-y-3">
                      <p>
                        While many tournaments might only have a single division, and that's okay, the division component is built to handle multiple divisions within a tournament.
                      </p>
                      <p>
                        <strong>Example:</strong> Chris is playing Men's Doubles with Ryan - that's a single division. He's also playing Mixed Doubles with Michelle - that's another division, same tournament.
                      </p>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                        <p className="font-medium mb-1 text-blue-900">💡 Typical Workflow:</p>
                        <p className="text-sm text-blue-800">Start with basic info → Add divisions → Assign participants → Track results</p>
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
                    disabled={isSubmitting || isReadOnly}
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
                    disabled={isSubmitting || isReadOnly}
                  />
                </div>

                <div className="form-input-group">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tournament Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={handleChange('status')}
                    disabled={isSubmitting || isReadOnly}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-sm text-gray-500 mt-1">Current tournament status</p>
                  
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
                      disabled={isSubmitting || isReadOnly}
                    />
                  </div>

                  <div className="form-input-group">
                    <Input
                      label="Registration Deadline"
                      type="date"
                      value={formData.registrationDeadline}
                      onChange={handleChange('registrationDeadline')}
                      helperText="Optional - when registration closes"
                      disabled={isSubmitting || isReadOnly}
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
                    disabled={isSubmitting || isReadOnly}
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
                    disabled={isSubmitting || isReadOnly}
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

                {/* Add Division Button */}
                {!isReadOnly && (
                  <div className="form-input-group division-add-button">
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
                )}

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
                      isReadOnly={isReadOnly}
                    />
                  ))}
                </div>

                {errors.divisions && (
                  <div className="form-input-group">
                    <Alert type="error" title="Division Error" message={errors.divisions} />
                  </div>
                )}
                
                {/* Info message when no divisions exist */}
                {divisions.length === 0 && (
                  <div className="form-input-group">
                    <Alert 
                      type="info" 
                      title="No Divisions Added" 
                      message="You can add divisions now or later. Divisions help organize participants by skill level and event type." 
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer buttons removed - Dashboard handles all modal actions via header buttons */}
        </form>

        {/* Division Participants Section */}
        {divisions && divisions.length > 0 && (
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
                    tournament={{ 
                      id: tournament?.id || 'new-tournament',
                      name: formData.name || 'New Tournament',
                      divisions: divisions 
                    }}
                    members={members}
                    onDivisionParticipantsChange={handleDivisionParticipantsChange}
                    loading={false}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ADDED: Results Management Section */}
        {canEnterResults && (
          <div className="form-section" style={{ marginTop: '24px' }}>
            <div 
              className="form-section-header"
              onClick={() => toggleSection('results')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <BarChart3 className="h-5 w-5 text-green-600 mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Tournament Results</h3>
                    <p className="text-sm text-gray-600 mt-1">Enter final standings and results</p>
                  </div>
                </div>
                <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${expandedSections.results ? 'rotate-180' : ''}`} />
              </div>
            </div>
            
            <div className={`form-expandable ${expandedSections.results ? 'expanded' : 'collapsed'}`}>
              <div className="form-section-content">
                <div className="results-section">
                  {hasResults() ? (
                    <>
                      <h4>
                        <Award className="results-icon" />
                        Results Entered
                      </h4>
                      
                      <div className="results-status">
                        <p className="text-sm opacity-90 mb-4">
                          Tournament results have been recorded and saved.
                        </p>
                        
                        {(() => {
                          const summary = getResultsSummary();
                          return summary && (
                            <div className="results-summary">
                              <div className="results-summary-grid">
                                <div className="results-summary-item">
                                  <div className="results-summary-number">{summary.totalDivisions}</div>
                                  <div className="results-summary-label">Divisions</div>
                                </div>
                                <div className="results-summary-item">
                                  <div className="results-summary-number">{summary.totalParticipants}</div>
                                  <div className="results-summary-label">Participants</div>
                                </div>
                                <div className="results-summary-item">
                                  <div className="results-summary-number">
                                    {summary.eventDate ? 
                                      new Date(summary.eventDate.seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) 
                                      : 'TBD'
                                    }
                                  </div>
                                  <div className="results-summary-label">Event Date</div>
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
                          disabled={resultsLoading}
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
                        Enter Tournament Results
                      </h4>
                      
                      <div className="results-status">
                        <p className="text-sm opacity-90 mb-4">
                          Record final standings, winners, and participant performance for each division.
                        </p>
                        
                        <div className="text-xs opacity-75">
                          <p>• Division standings and final positions</p>
                          <p>• Tournament winners and awards</p>
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

        {/* Tournament Features Section */}
        <div className="form-section">
          <div className="form-section-content">
            <div className="tournament-features-card">
              <h4 className="text-lg font-semibold mb-3 flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Tournament Features
              </h4>
              <div className="tournament-features-grid">
                <div className="space-y-3">
                  <div className="tournament-feature-item">
                    <Users className="tournament-feature-icon" />
                    Multi-division support with separate brackets
                  </div>
                  <div className="tournament-feature-item">
                    <BarChart3 className="tournament-feature-icon" />
                    Manual result tracking and recording
                  </div>
                  <div className="tournament-feature-item">
                    <DollarSign className="tournament-feature-icon" />
                    Entry fee management and participant billing
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="tournament-feature-item">
                    <CheckCircle className="tournament-feature-icon" />
                    Participant registration and management
                  </div>
                  <div className="tournament-feature-item">
                    <Trophy className="tournament-feature-icon" />
                    Division-based event organization
                  </div>
                  <div className="tournament-feature-item">
                    <Calendar className="tournament-feature-icon" />
                    Tournament scheduling and planning
                  </div>
                </div>
              </div>
            </div>
          </div>
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
        onDelete={() => deleteDivision(editingDivisionIndex)}
        division={editingDivisionIndex !== null ? divisions[editingDivisionIndex] : null}
        title={editingDivisionIndex !== null ? 'Edit Division' : 'Add Division'}
        isSaving={divisionSaving}
        isEditing={tournament && tournament.id}
        currentMember={currentMember}
        updateMember={updateMember}
        canDelete={editingDivisionIndex !== null}
      />

      {/* ADDED: Results Entry Modal */}
      {tournament && (
        <Modal
          isOpen={showResultsModal}
          onClose={handleResultsCancel}
          title={`Enter Results: ${tournament.name}`}
          size="xl"
        >
          <TournamentResultsForm
            tournament={tournament}
            members={members}
            onSubmit={handleResultsSubmit}
            onCancel={handleResultsCancel}
            loading={resultsSubmitLoading}
            existingResults={existingResults()}
          />
        </Modal>
      )}
    </div>
  );
};

/**
 * Division Card Component (unchanged)
 */
const DivisionCard = ({ division, index, onEdit, onDelete, canDelete, disabled, loading, isReadOnly = false }) => {
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
      
      {!isReadOnly && (
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
      )}
    </div>
  );
};

/**
 * ENHANCED: Division Form Modal Component with consistent styling and collapsible sections
 */
const DivisionFormModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  onDelete,
  division, 
  title, 
  isSaving = false, 
  isEditing = false,
  currentMember: divisionCurrentMember,
  updateMember,
  canDelete = false
}) => {
  // ADDED: Division help alert state
  const [showDivisionHelpAlert, setShowDivisionHelpAlert] = useState(false);
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
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  // Section expansion logic based on mobile/desktop and new/edit mode
  const getInitialSectionState = useCallback(() => {
    const isNewDivision = !division;
    
    if (!isMobile) {
      // Desktop: Always expanded by default, but collapsible
      return {
        details: true,
        configuration: true,
        pricing: true
      };
    }
    
    // Mobile: New divisions expanded, editing divisions collapsed
    if (isNewDivision) {
      return {
        details: true,
        configuration: true, 
        pricing: true
      };
    } else {
      return {
        details: true, // Always show details section
        configuration: false,
        pricing: false
      };
    }
  }, [isMobile, division]);

  const [expandedSections, setExpandedSections] = useState(() => getInitialSectionState());

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

  // Reset section state when modal opens/closes or division changes
  useEffect(() => {
    if (isOpen) {
      const newSectionState = getInitialSectionState();
      setExpandedSections(newSectionState);
    }
  }, [isOpen, getInitialSectionState]);

  // ADDED: Check division help preferences when modal opens for new divisions
  useEffect(() => {
    const checkDivisionHelpPreferences = async () => {
      console.log('🚨 DivisionModal Alert Check:', {
        isOpen,
        division: !!division,
        divisionId: division?.id,
        currentMember: !!divisionCurrentMember,
        memberId: divisionCurrentMember?.id
      });
      
      if (isOpen && !division && divisionCurrentMember) {
        try {
          // Check if member has dismissed the division help alert
          const hideDivisionCreationHelp = divisionCurrentMember.hideDivisionCreationHelp || false;
          const shouldShow = !hideDivisionCreationHelp;
          
          console.log('🚨 Debug division help alert:', {
            division: !!division,
            currentMember: !!divisionCurrentMember,
            memberId: divisionCurrentMember.id,
            hideDivisionCreationHelp,
            shouldShow
          });
          
          setShowDivisionHelpAlert(shouldShow);
        } catch (error) {
          console.error('Error checking division help preferences:', error);
          setShowDivisionHelpAlert(true);
        }
      } else {
        console.log('🚨 Division alert NOT showing because:', {
          reason: !isOpen ? 'Modal closed' : division ? 'Editing existing division' : 'No current member found',
          isOpen,
          division: !!division,
          currentMember: !!divisionCurrentMember
        });
        setShowDivisionHelpAlert(false);
      }
    };

    checkDivisionHelpPreferences();
  }, [isOpen, division, divisionCurrentMember]);

  // ADDED: Division help alert handlers
  const handleCloseDivisionHelpAlert = useCallback(() => {
    setShowDivisionHelpAlert(false);
  }, []);

  const handleDivisionDontShowAgain = useCallback(async () => {
    setShowDivisionHelpAlert(false);
    
    if (divisionCurrentMember?.id) {
      try {
        await updateMember(divisionCurrentMember.id, {
          hideDivisionCreationHelp: true
        });
        console.log('Division help preferences updated successfully');
      } catch (error) {
        console.error('Error updating division help preferences:', error);
      }
    }
  }, [divisionCurrentMember]);

  // Section toggle handler
  const toggleSection = useCallback((section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

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

  const handleDelete = useCallback(async () => {
    if (!division || !onDelete) return;
    
    try {
      await onDelete();
      onClose();
    } catch (error) {
      setErrors({ delete: error.message });
    }
  }, [division, onDelete, onClose]);

  const skillLevelOptions = Object.entries(SKILL_LEVELS).map(([key, value]) => ({
    value,
    label: key.charAt(0) + key.slice(1).toLowerCase()
  }));

  const eventTypeOptions = Object.entries(EVENT_TYPES).map(([key, value]) => ({
    value,
    label: key.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')
  }));

  // Helper function for formatting event types
  const formatEventType = (eventType) => {
    if (!eventType) return '';
    return eventType.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={title} 
      size="lg"
      headerAction={
        <>
          <ModalHeaderButton
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
            icon={<X className="h-4 w-4" />}
          >
            Cancel
          </ModalHeaderButton>
          {division && canDelete && (
            <ModalHeaderButton
              variant="danger"
              onClick={handleDelete}
              disabled={isSaving}
              icon={<Trash2 className="h-4 w-4" />}
            >
              Delete
            </ModalHeaderButton>
          )}
          <ModalHeaderButton
            variant="primary"
            onClick={handleSave}
            loading={isSaving}
            disabled={isSaving}
            icon={<CheckCircle className="h-4 w-4" />}
          >
            {division ? 'Update' : 'Add'} Division
          </ModalHeaderButton>
        </>
      }
    >
      <div className="p-3 sm:p-6">
        {/* Error alerts */}
        {errors.submit && (
          <div className="form-section">
            <div className="form-section-content">
              <Alert type="error" title="Save Error" message={errors.submit} />
            </div>
          </div>
        )}

        {/* ADDED: Division Creation Help Alert */}
        {showDivisionHelpAlert && (
          <div className="mb-4">
            {/* Mobile: Compact alert */}
            <div className="block sm:hidden">
              <Alert 
                type="info" 
                title="Division Tips"
                message={
                  <div className="text-sm">
                    <p className="mb-2">
                      Divisions separate different skill levels and event types within a tournament.
                    </p>
                    <p className="text-xs text-blue-600">
                      💡 Example: Men's Doubles 4.0 + Mixed Doubles 3.5
                    </p>
                  </div>
                }
                actions={
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={handleCloseDivisionHelpAlert}
                      className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Close
                    </button>
                    <button
                      onClick={handleDivisionDontShowAgain}
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
                title="Creating a Division"
                message={
                  <div className="space-y-3">
                    <p>
                      Divisions organize participants by skill level and event type within your tournament. Most tournaments have multiple divisions to accommodate different player abilities.
                    </p>
                    <p>
                      <strong>Example:</strong> A tournament might have "Men's Doubles 4.0", "Women's Doubles 3.5", and "Mixed Doubles Open" as separate divisions.
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                      <p className="font-medium mb-1 text-blue-900">💡 Division Setup:</p>
                      <p className="text-sm text-blue-800">Choose event type → Set skill level → Configure entry fee → Add participants</p>
                    </div>
                  </div>
                }
                actions={
                  <div className="flex flex-col sm:flex-row gap-2 mt-4">
                    <button
                      onClick={handleCloseDivisionHelpAlert}
                      className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Close
                    </button>
                    <button
                      onClick={handleDivisionDontShowAgain}
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

        {/* Basic Information Section */}
        <div className="form-section">
          <div 
            className="form-section-header"
            onClick={() => toggleSection('details')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Trophy className="h-5 w-5 text-blue-600 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Division Details</h3>
                  <p className="text-sm text-gray-600 mt-1">Configure the division name and description</p>
                </div>
              </div>
              <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${expandedSections.details ? 'rotate-180' : ''}`} />
            </div>
          </div>
          
          <div className={`form-expandable ${expandedSections.details ? 'expanded' : 'collapsed'}`}>
            <div className="form-section-content">
              <div className="form-input-group">
                <Input
                  label="Division Name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange('name')}
                  error={errors.name}
                  required
                  placeholder="e.g., Men's Singles, Mixed Doubles"
                  disabled={isSaving}
                  className="text-lg"
                />
              </div>

              <div className="form-input-group">
                <Input
                  label="Description"
                  type="text"
                  value={formData.description}
                  onChange={handleChange('description')}
                  placeholder="Optional description for this division"
                  disabled={isSaving}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Event Configuration Section */}
        <div className="form-section form-section-with-dropdown">
          <div 
            className="form-section-header"
            onClick={() => toggleSection('configuration')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Target className="h-5 w-5 text-green-600 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Event Configuration</h3>
                  <p className="text-sm text-gray-600 mt-1">Set the event type and skill level</p>
                </div>
              </div>
              <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${expandedSections.configuration ? 'rotate-180' : ''}`} />
            </div>
          </div>
          
          <div className={`form-expandable ${expandedSections.configuration ? 'expanded' : 'collapsed'}`}>
            <div className="form-section-content">
              <div className="form-grid form-grid-sm">
                <div className="form-input-group">
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

                <div className="form-input-group">
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
            </div>
          </div>
        </div>

        {/* Entry & Participation Section */}
        <div className="form-section">
          <div 
            className="form-section-header"
            onClick={() => toggleSection('pricing')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 text-purple-600 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Entry Fee & Limits</h3>
                  <p className="text-sm text-gray-600 mt-1">Configure entry fee and participant limits</p>
                </div>
              </div>
              <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${expandedSections.pricing ? 'rotate-180' : ''}`} />
            </div>
          </div>
          
          <div className={`form-expandable ${expandedSections.pricing ? 'expanded' : 'collapsed'}`}>
            <div className="form-section-content">
              <div className="form-grid form-grid-sm">
                <div className="form-input-group">
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
                    helperText="Amount each participant pays to enter"
                  />
                </div>

                <div className="form-input-group">
                  <Input
                    label="Max Participants"
                    type="number"
                    value={formData.maxParticipants}
                    onChange={handleChange('maxParticipants')}
                    error={errors.maxParticipants}
                    min="1"
                    placeholder="Optional"
                    disabled={isSaving}
                    helperText="Leave blank for unlimited participants"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Division Summary */}
        <div className="summary-card">
          <h4 className="text-lg font-semibold mb-4">Division Summary</h4>
          <div className="quick-stats">
            <div className="stat-item">
              <div className="stat-number">{formatEventType(formData.eventType)}</div>
              <div className="stat-label">Event Type</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{formData.skillLevel.charAt(0).toUpperCase() + formData.skillLevel.slice(1)}</div>
              <div className="stat-label">Skill Level</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">${formData.entryFee || 0}</div>
              <div className="stat-label">Entry Fee</div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default React.memo(TournamentForm);