// src/components/results/ResultsManagement.jsx (MOBILE-FIRST REDESIGN)
import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Award, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Calendar,
  Download,
  Share2,
  Eye,
  Edit,
  Save,
  Check,
  AlertCircle,
  Medal,
  Star,
  Camera,
  FileText,
  ChevronDown,
  ChevronRight,
  Plus,
  Minus,
  Target,
  Zap,
  BarChart3,
  Timer,
  CheckCircle2,
  XCircle,
  Info,
  Search,
  Filter
} from 'lucide-react';
import { Button, Input, Select, Card, Alert, Modal } from '../ui';
import { useAuth } from '../../hooks/useAuth';
import { useMembers } from '../../hooks/useMembers';
import { useResults } from '../../hooks/useResults';
import { RESULT_STATUS, AWARD_TYPES, createParticipantResult, createEventResults } from '../../services/models';
import { canManageResults } from '../../utils/roleUtils';
import AwardModal, { AwardDisplay } from './AwardModal';

// Mobile-optimized styles
const mobileStyles = `
  /* Mobile-first touch targets */
  .touch-target {
    min-height: 48px;
    min-width: 48px;
  }
  
  .mobile-action-button {
    min-height: 52px;
    min-width: 120px;
  }
  
  /* Card animations for better mobile feel */
  .result-card {
    transition: all 0.2s ease;
  }
  
  .result-card:active {
    transform: scale(0.98);
  }
  
  .result-card.expanded {
    transform: none;
  }
  
  /* Progressive disclosure animations */
  .expand-content {
    transition: max-height 0.3s ease, opacity 0.2s ease;
    overflow: hidden;
  }
  
  .expand-content.collapsed {
    max-height: 0;
    opacity: 0;
  }
  
  .expand-content.expanded {
    max-height: 1000px;
    opacity: 1;
  }
  
  /* Touch-friendly form elements */
  @media (max-width: 768px) {
    input, select, textarea {
      min-height: 48px !important;
      font-size: 16px !important; /* Prevents zoom on iOS */
    }
    
    .mobile-form-grid {
      grid-template-columns: 1fr !important;
      gap: 1rem !important;
    }
  }
  
  /* Smooth scrolling for mobile */
  .mobile-scroll {
    -webkit-overflow-scrolling: touch;
    scroll-behavior: smooth;
  }
  
  /* Loading states optimized for mobile */
  .mobile-loading {
    backdrop-filter: blur(4px);
  }
`;

// Add styles to head
const StyleSheet = () => (
  <style dangerouslySetInnerHTML={{ __html: mobileStyles }} />
);

/**
 * Mobile-First ResultsManagement Component
 * 
 * Completely redesigned for mobile-first experience:
 * - Card-based layouts instead of tables
 * - Progressive disclosure for complex data
 * - Touch-optimized interactions
 * - Thumb-friendly navigation
 */
const ResultsManagement = ({ 
  event, 
  eventType = 'tournament',
  onResultsUpdate,
  onClose 
}) => {
  const { user } = useAuth();
  const { members } = useMembers();
  const { 
    results, 
    loading, 
    createResults, 
    updateParticipantResult, 
    publishResults,
    addAward,
    removeAward,
    hasResults 
  } = useResults(event.id, eventType);

  // State management
  const [participantResults, setParticipantResults] = useState([]);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  
  // Mobile-specific state
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [expandedCards, setExpandedCards] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('placement');

  // Permission checks
  const canManage = canManageResults(user?.uid, members);
  const isCompleted = event.status === 'completed';

  // Responsive detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize results data
  useEffect(() => {
    if (results) {
      setParticipantResults(results.participantResults || []);
    } else if (event && event.participants && isCompleted) {
      initializeNewResults();
    }
  }, [results, event, isCompleted]);

  const initializeNewResults = async () => {
    if (!event.participants || event.participants.length === 0) return;
    
    try {
      const newResults = await createResults(event, event.participants);
      setParticipantResults(newResults.participantResults || []);
    } catch (error) {
      showAlert('error', 'Failed to initialize results', error.message);
    }
  };

  // Helper functions
  const showAlert = (type, title, message) => {
    setAlert({ type, title, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const getParticipantName = (participantId) => {
    const member = members.find(m => m.id === participantId);
    return member ? `${member.firstName} ${member.lastName}` : 'Unknown Player';
  };

  const getParticipantInitials = (participantId) => {
    const member = members.find(m => m.id === participantId);
    if (!member) return 'U';
    return `${member.firstName.charAt(0)}${member.lastName.charAt(0)}`;
  };

  const getPlacementLabel = (placement) => {
    if (!placement) return 'Unplaced';
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const lastDigit = placement % 10;
    const suffix = (placement >= 11 && placement <= 13) ? 'th' : (suffixes[lastDigit] || 'th');
    return `${placement}${suffix}`;
  };

  const calculateWinPercentage = (gamesWon, gamesLost) => {
    const totalGames = (gamesWon || 0) + (gamesLost || 0);
    if (totalGames === 0) return 0;
    return ((gamesWon || 0) / totalGames * 100).toFixed(1);
  };

  // Card expansion management
  const toggleCard = (participantId) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(participantId)) {
      newExpanded.delete(participantId);
    } else {
      newExpanded.add(participantId);
    }
    setExpandedCards(newExpanded);
  };

  const expandAll = () => {
    setExpandedCards(new Set(participantResults.map(r => r.participantId)));
  };

  const collapseAll = () => {
    setExpandedCards(new Set());
  };

  // Filter and sort participants
  const getFilteredAndSortedResults = () => {
    let filtered = participantResults;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(result => {
        const name = getParticipantName(result.participantId).toLowerCase();
        return name.includes(searchTerm.toLowerCase());
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(result => {
        if (statusFilter === 'placed') return result.placement !== null;
        if (statusFilter === 'unplaced') return result.placement === null;
        if (statusFilter === 'prize') return result.prizeAmount > 0;
        if (statusFilter === 'awards') return result.awards?.length > 0;
        return true;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'placement':
          if (a.placement === null && b.placement === null) return 0;
          if (a.placement === null) return 1;
          if (b.placement === null) return -1;
          return a.placement - b.placement;
        case 'name':
          return getParticipantName(a.participantId).localeCompare(getParticipantName(b.participantId));
        case 'winRate':
          const aWinRate = calculateWinPercentage(a.gamesWon, a.gamesLost);
          const bWinRate = calculateWinPercentage(b.gamesWon, b.gamesLost);
          return bWinRate - aWinRate;
        case 'prize':
          return (b.prizeAmount || 0) - (a.prizeAmount || 0);
        default:
          return 0;
      }
    });

    return filtered;
  };

  // Update participant result
  const updateParticipantResultLocal = async (participantId, updates) => {
    if (!results) return;
    
    try {
      await updateParticipantResult(results.id, participantId, updates);
      
      setParticipantResults(prev => 
        prev.map(result => 
          result.participantId === participantId 
            ? { ...result, ...updates }
            : result
        )
      );
    } catch (error) {
      showAlert('error', 'Failed to update result', error.message);
    }
  };

  // Award management
  const addAwardToParticipant = async (participantId, award) => {
    if (!results) return;
    
    try {
      await addAward(results.id, participantId, award);
      
      const participant = participantResults.find(r => r.participantId === participantId);
      if (participant) {
        const updatedAwards = [...(participant.awards || []), award];
        setParticipantResults(prev => 
          prev.map(result => 
            result.participantId === participantId 
              ? { ...result, awards: updatedAwards }
              : result
          )
        );
      }
    } catch (error) {
      showAlert('error', 'Failed to add award', error.message);
    }
  };

  // Calculate summary stats
  const calculateTotals = () => {
    const totalPrizeMoney = participantResults.reduce((sum, r) => sum + (r.prizeAmount || 0), 0);
    const totalGames = participantResults.reduce((sum, r) => sum + (r.gamesWon || 0) + (r.gamesLost || 0), 0);
    const placedParticipants = participantResults.filter(r => r.placement !== null).length;
    const totalAwards = participantResults.reduce((sum, r) => sum + (r.awards?.length || 0), 0);
    
    return {
      totalPrizeMoney,
      totalGames,
      placedParticipants,
      totalParticipants: event.participants.length,
      totalAwards,
      averageWinRate: participantResults.length > 0 
        ? participantResults.reduce((sum, r) => sum + parseFloat(calculateWinPercentage(r.gamesWon, r.gamesLost)), 0) / participantResults.length 
        : 0
    };
  };

  const totals = calculateTotals();
  const filteredResults = getFilteredAndSortedResults();

  // Publish results
  const handlePublishResults = async () => {
    if (!results) return;
    
    setSaving(true);
    try {
      await publishResults(results.id);
      setShowPublishModal(false);
      showAlert('success', 'Results published!', 'Results have been published and participants have been notified');
      
      if (onResultsUpdate) {
        onResultsUpdate(results);
      }
    } catch (error) {
      showAlert('error', 'Publish failed', error.message);
    } finally {
      setSaving(false);
    }
  };

  // Permission/state checks
  if (!canManage) {
    return (
      <div className="p-4">
        <StyleSheet />
        <Card title="Access Denied">
          <Alert 
            type="error" 
            title="Insufficient Permissions" 
            message="You don't have permission to manage results." 
          />
        </Card>
      </div>
    );
  }

  if (!isCompleted) {
    return (
      <div className="p-4">
        <StyleSheet />
        <Card title="Results Not Available">
          <Alert 
            type="info" 
            title="Event Not Completed" 
            message={`Results can only be managed for completed ${eventType}s. Please mark this ${eventType} as completed first.`} 
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 mobile-scroll">
      <StyleSheet />
      
      {/* Alert */}
      {alert && (
        <div className="sticky top-0 z-40 p-4">
          <Alert
            type={alert.type}
            title={alert.title}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        </div>
      )}

      {/* Mobile Header */}
      <div className="sticky top-0 z-30 bg-white border-b shadow-sm">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1 min-w-0">
              <h1 className={`font-bold text-gray-900 flex items-center ${isMobile ? 'text-lg' : 'text-2xl'}`}>
                <Trophy className={`text-yellow-600 mr-2 ${isMobile ? 'h-5 w-5' : 'h-8 w-8'}`} />
                Results
              </h1>
              <p className="text-gray-600 text-sm truncate">
                {event.name} • {eventType.charAt(0).toUpperCase() + eventType.slice(1)}
              </p>
            </div>

            {isMobile && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="touch-target ml-2"
              >
                Done
              </Button>
            )}
          </div>

          {/* Mobile Action Bar */}
          <div className="flex space-x-2 overflow-x-auto">
            <Button
              size="sm"
              variant="outline"
              onClick={() => showAlert('info', 'Auto-save enabled', 'Results are automatically saved as you make changes')}
              disabled={!results}
              className="touch-target whitespace-nowrap"
            >
              <Save className="h-4 w-4 mr-1" />
              Auto-saved
            </Button>

            {results?.status === RESULT_STATUS.DRAFT && (
              <Button
                size="sm"
                onClick={() => setShowPublishModal(true)}
                disabled={totals.placedParticipants === 0}
                className="touch-target whitespace-nowrap"
              >
                <Share2 className="h-4 w-4 mr-1" />
                Publish
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={() => {/* Export function */}}
              disabled={participantResults.length === 0}
              className="touch-target whitespace-nowrap"
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Summary Cards */}
      <div className="p-4">
        <div className={`grid gap-4 mb-6 ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
          <div className="bg-white rounded-lg p-4 border shadow-sm text-center">
            <Medal className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
            <p className="text-xl font-bold text-gray-900">{totals.placedParticipants}</p>
            <p className="text-xs text-gray-600">Placed</p>
            <p className="text-xs text-gray-500">of {totals.totalParticipants}</p>
          </div>

          <div className="bg-white rounded-lg p-4 border shadow-sm text-center">
            <DollarSign className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <p className="text-xl font-bold text-gray-900">${totals.totalPrizeMoney}</p>
            <p className="text-xs text-gray-600">Prize Money</p>
            <p className="text-xs text-gray-500">awarded</p>
          </div>

          {!isMobile && (
            <>
              <div className="bg-white rounded-lg p-4 border shadow-sm text-center">
                <TrendingUp className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <p className="text-xl font-bold text-gray-900">{totals.totalGames}</p>
                <p className="text-xs text-gray-600">Total Games</p>
                <p className="text-xs text-gray-500">played</p>
              </div>

              <div className="bg-white rounded-lg p-4 border shadow-sm text-center">
                <Award className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                <p className="text-xl font-bold text-gray-900">{totals.totalAwards}</p>
                <p className="text-xs text-gray-600">Awards</p>
                <p className="text-xs text-gray-500">given</p>
              </div>
            </>
          )}
        </div>

        {/* Mobile Filters & Search */}
        <Card className="mb-6">
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search participants..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filters & Controls */}
            <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Participants' },
                  { value: 'placed', label: 'Placed Only' },
                  { value: 'unplaced', label: 'Unplaced Only' },
                  { value: 'prize', label: 'Prize Winners' },
                  { value: 'awards', label: 'Award Winners' }
                ]}
                className="touch-target"
              />

              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                options={[
                  { value: 'placement', label: 'Sort by Placement' },
                  { value: 'name', label: 'Sort by Name' },
                  { value: 'winRate', label: 'Sort by Win Rate' },
                  { value: 'prize', label: 'Sort by Prize' }
                ]}
                className="touch-target"
              />

              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={expandAll}
                  className="flex-1 touch-target"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Expand All
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={collapseAll}
                  className="flex-1 touch-target"
                >
                  <Minus className="h-4 w-4 mr-1" />
                  Collapse
                </Button>
              </div>
            </div>

            {/* Results count */}
            <div className="text-sm text-gray-600 text-center">
              Showing {filteredResults.length} of {participantResults.length} participants
            </div>
          </div>
        </Card>

        {/* Mobile Participant Cards */}
        <div className="space-y-4">
          {filteredResults.map((result) => (
            <MobileParticipantCard
              key={result.participantId}
              result={result}
              participantName={getParticipantName(result.participantId)}
              participantInitials={getParticipantInitials(result.participantId)}
              isExpanded={expandedCards.has(result.participantId)}
              onToggle={() => toggleCard(result.participantId)}
              onUpdate={(updates) => updateParticipantResultLocal(result.participantId, updates)}
              onAddAward={(award) => addAwardToParticipant(result.participantId, award)}
              isMobile={isMobile}
            />
          ))}
        </div>

        {filteredResults.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No participants found</p>
            <p className="text-sm mt-1">Try adjusting your search or filters</p>
          </div>
        )}

        {/* Bottom padding for mobile */}
        <div className="h-20"></div>
      </div>

      {/* Publish Confirmation Modal */}
      <Modal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        title="Publish Results"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Publishing Results Will:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Make results visible to all participants</li>
              <li>• Send notification emails to participants</li>
              <li>• Update member statistics and win/loss records</li>
              <li>• Award prize money and recognition</li>
              <li>• Make results searchable in the system</li>
            </ul>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <strong>Note:</strong> Once published, results cannot be easily changed. 
                Make sure all placements and prize amounts are correct.
              </div>
            </div>
          </div>

          <div className="flex space-x-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowPublishModal(false)}
              className="touch-target"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePublishResults}
              loading={saving}
              className="touch-target"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Publish Results
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

/**
 * Mobile-First Participant Card Component
 * 
 * Features:
 * - Touch-optimized interactions
 * - Progressive disclosure design
 * - Thumb-friendly action zones
 * - Visual hierarchy optimized for small screens
 */
const MobileParticipantCard = ({ 
  result, 
  participantName, 
  participantInitials,
  isExpanded,
  onToggle,
  onUpdate,
  onAddAward,
  isMobile = true
}) => {
  const [showAwardModal, setShowAwardModal] = useState(false);
  const [quickEditMode, setQuickEditMode] = useState(null);

  const calculateWinPercentage = () => {
    const totalGames = (result.gamesWon || 0) + (result.gamesLost || 0);
    if (totalGames === 0) return 0;
    return ((result.gamesWon || 0) / totalGames * 100).toFixed(1);
  };

  const getPlacementColor = (placement) => {
    if (!placement) return 'bg-gray-100 text-gray-600';
    if (placement === 1) return 'bg-yellow-100 text-yellow-800';
    if (placement === 2) return 'bg-gray-100 text-gray-700';
    if (placement === 3) return 'bg-orange-100 text-orange-700';
    return 'bg-blue-100 text-blue-700';
  };

  const getPlacementIcon = (placement) => {
    if (placement === 1) return '🥇';
    if (placement === 2) return '🥈';
    if (placement === 3) return '🥉';
    return '🏆';
  };

  const handleQuickEdit = (field, value) => {
    onUpdate({ [field]: value });
    setQuickEditMode(null);
  };

  return (
    <>
      <div className={`result-card bg-white rounded-xl border shadow-sm ${isExpanded ? 'expanded' : ''}`}>
        {/* Card Header - Always Visible */}
        <div 
          className="p-4 cursor-pointer touch-target"
          onClick={onToggle}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {/* Avatar */}
              <div className={`
                ${result.placement ? getPlacementColor(result.placement) : 'bg-gray-100'} 
                rounded-full flex items-center justify-center flex-shrink-0 relative
                ${isMobile ? 'h-12 w-12' : 'h-14 w-14'}
              `}>
                {result.placement ? (
                  <div className="text-center">
                    <div className="text-lg">{getPlacementIcon(result.placement)}</div>
                    <div className="text-xs font-bold mt-1">{result.placement}</div>
                  </div>
                ) : (
                  <span className="text-lg font-semibold">
                    {participantInitials}
                  </span>
                )}
                
                {result.awards?.length > 0 && (
                  <div className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {result.awards.length}
                  </div>
                )}
              </div>

              {/* Name and Summary */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">
                  {participantName}
                </h3>
                <div className="flex items-center space-x-3 text-sm text-gray-600 mt-1">
                  {result.placement && (
                    <span className="font-medium">
                      {result.placement === 1 ? '1st Place' : 
                       result.placement === 2 ? '2nd Place' :
                       result.placement === 3 ? '3rd Place' :
                       `${result.placement}th Place`}
                    </span>
                  )}
                  
                  {result.prizeAmount > 0 && (
                    <span className="text-green-600 font-medium">
                      ${result.prizeAmount}
                    </span>
                  )}
                  
                  {((result.gamesWon || 0) + (result.gamesLost || 0)) > 0 && (
                    <span>
                      {calculateWinPercentage()}% wins
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Expand/Collapse Button */}
            <div className="flex items-center space-x-2">
              {result.confirmed && (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              )}
              <ChevronDown 
                className={`h-5 w-5 text-gray-400 transition-transform touch-target ${
                  isExpanded ? 'transform rotate-180' : ''
                }`} 
              />
            </div>
          </div>

          {/* Quick Stats Bar */}
          <div className="mt-3 grid grid-cols-3 gap-4 text-center">
            <div className="bg-gray-50 rounded-lg p-2">
              <div className="text-sm font-semibold text-gray-900">
                {result.gamesWon || 0}W
              </div>
              <div className="text-xs text-gray-600">Wins</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-2">
              <div className="text-sm font-semibold text-gray-900">
                {result.gamesLost || 0}L
              </div>
              <div className="text-xs text-gray-600">Losses</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-2">
              <div className="text-sm font-semibold text-gray-900">
                {result.pointsFor || 0}
              </div>
              <div className="text-xs text-gray-600">Points</div>
            </div>
          </div>
        </div>

        {/* Expanded Details */}
        <div className={`expand-content ${isExpanded ? 'expanded' : 'collapsed'}`}>
          <div className="px-4 pb-4 border-t border-gray-100">
            <div className="pt-4 space-y-6">
              
              {/* Placement & Prize */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 flex items-center">
                  <Trophy className="h-4 w-4 mr-2 text-yellow-600" />
                  Placement & Prize
                </h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Placement
                    </label>
                    {quickEditMode === 'placement' ? (
                      <select
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={result.placement || ''}
                        onChange={(e) => handleQuickEdit('placement', e.target.value ? parseInt(e.target.value) : null)}
                        onBlur={() => setQuickEditMode(null)}
                        autoFocus
                      >
                        <option value="">No placement</option>
                        {Array.from({ length: 20 }, (_, i) => (
                          <option key={i + 1} value={i + 1}>{i + 1}</option>
                        ))}
                      </select>
                    ) : (
                      <div 
                        className="w-full p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => setQuickEditMode('placement')}
                      >
                        <span className="text-gray-900">
                          {result.placement ? `${result.placement}${
                            result.placement === 1 ? 'st' :
                            result.placement === 2 ? 'nd' :
                            result.placement === 3 ? 'rd' : 'th'
                          } Place` : 'Tap to set placement'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prize Amount ($)
                    </label>
                    {quickEditMode === 'prize' ? (
                      <input
                        type="number"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={result.prizeAmount || ''}
                        onChange={(e) => handleQuickEdit('prizeAmount', parseFloat(e.target.value) || 0)}
                        onBlur={() => setQuickEditMode(null)}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        autoFocus
                      />
                    ) : (
                      <div 
                        className="w-full p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => setQuickEditMode('prize')}
                      >
                        <span className="text-gray-900">
                          {result.prizeAmount > 0 ? `$${result.prizeAmount}` : 'Tap to set prize'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Game Statistics */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 flex items-center">
                  <BarChart3 className="h-4 w-4 mr-2 text-blue-600" />
                  Game Statistics
                </h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Games Won
                    </label>
                    {quickEditMode === 'gamesWon' ? (
                      <input
                        type="number"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={result.gamesWon || ''}
                        onChange={(e) => handleQuickEdit('gamesWon', parseInt(e.target.value) || 0)}
                        onBlur={() => setQuickEditMode(null)}
                        min="0"
                        autoFocus
                      />
                    ) : (
                      <div 
                        className="w-full p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => setQuickEditMode('gamesWon')}
                      >
                        <span className="text-gray-900">{result.gamesWon || 0}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Games Lost
                    </label>
                    {quickEditMode === 'gamesLost' ? (
                      <input
                        type="number"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={result.gamesLost || ''}
                        onChange={(e) => handleQuickEdit('gamesLost', parseInt(e.target.value) || 0)}
                        onBlur={() => setQuickEditMode(null)}
                        min="0"
                        autoFocus
                      />
                    ) : (
                      <div 
                        className="w-full p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => setQuickEditMode('gamesLost')}
                      >
                        <span className="text-gray-900">{result.gamesLost || 0}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Points For
                    </label>
                    {quickEditMode === 'pointsFor' ? (
                      <input
                        type="number"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={result.pointsFor || ''}
                        onChange={(e) => handleQuickEdit('pointsFor', parseInt(e.target.value) || 0)}
                        onBlur={() => setQuickEditMode(null)}
                        min="0"
                        autoFocus
                      />
                    ) : (
                      <div 
                        className="w-full p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => setQuickEditMode('pointsFor')}
                      >
                        <span className="text-gray-900">{result.pointsFor || 0}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Points Against
                    </label>
                    {quickEditMode === 'pointsAgainst' ? (
                      <input
                        type="number"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={result.pointsAgainst || ''}
                        onChange={(e) => handleQuickEdit('pointsAgainst', parseInt(e.target.value) || 0)}
                        onBlur={() => setQuickEditMode(null)}
                        min="0"
                        autoFocus
                      />
                    ) : (
                      <div 
                        className="w-full p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => setQuickEditMode('pointsAgainst')}
                      >
                        <span className="text-gray-900">{result.pointsAgainst || 0}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Win Rate Display */}
                {((result.gamesWon || 0) + (result.gamesLost || 0)) > 0 && (
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-900">
                      {calculateWinPercentage()}%
                    </div>
                    <div className="text-sm text-blue-700">Win Rate</div>
                    <div className="text-xs text-blue-600 mt-1">
                      {result.gamesWon || 0} wins out of {(result.gamesWon || 0) + (result.gamesLost || 0)} games
                    </div>
                  </div>
                )}
              </div>

              {/* Awards */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900 flex items-center">
                    <Award className="h-4 w-4 mr-2 text-purple-600" />
                    Awards & Recognition
                  </h4>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAwardModal(true)}
                    className="touch-target"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Award
                  </Button>
                </div>
                
                {result.awards && result.awards.length > 0 ? (
                  <div className="space-y-2">
                    {result.awards.map((award, index) => (
                      <div key={index} className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium text-purple-900">
                              {award.title || award.customTitle}
                            </span>
                            {award.description && (
                              <p className="text-sm text-purple-700 mt-1">{award.description}</p>
                            )}
                            {award.value > 0 && (
                              <p className="text-sm text-green-600 font-medium mt-1">${award.value}</p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {/* Remove award */}}
                            className="touch-target"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <Award className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No awards yet</p>
                    <p className="text-xs">Tap "Add Award" to recognize achievements</p>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-gray-600" />
                  Notes
                </h4>
                {quickEditMode === 'notes' ? (
                  <textarea
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    value={result.notes || ''}
                    onChange={(e) => onUpdate({ notes: e.target.value })}
                    onBlur={() => setQuickEditMode(null)}
                    placeholder="Add any notes about this participant's performance..."
                    autoFocus
                  />
                ) : (
                  <div 
                    className="w-full p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors min-h-[80px]"
                    onClick={() => setQuickEditMode('notes')}
                  >
                    <span className={result.notes ? "text-gray-900" : "text-gray-500"}>
                      {result.notes || 'Tap to add notes about performance, highlights, or observations...'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Award Modal */}
      <AwardModal
        isOpen={showAwardModal}
        onClose={() => setShowAwardModal(false)}
        onAddAward={(award) => {
          onAddAward(award);
          setShowAwardModal(false);
        }}
        participantName={participantName}
      />
    </>
  );
};

export default ResultsManagement;