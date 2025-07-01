// src/components/Dashboard.jsx (UPDATED - Added Results Entry Integration)
import React, { useState, useMemo, useCallback } from 'react';
import { 
  Plus, 
  Calendar, 
  Users, 
  Trophy, 
  DollarSign, 
  Activity, 
  MessageSquare, 
  MapPin, 
  ExternalLink, 
  Navigation,
  Layers,
  Phone,
  Clock,
  CheckCircle,
  Trash2,
  BarChart3,
  Target,
  Award
} from 'lucide-react';
import { 
  useMembers, 
  useLeagues, 
  useTournaments, 
  useAuth,
  useResults,
  usePlayerPerformance
} from '../hooks';
import { useSmoothNavigation } from '../hooks/useSmoothNavigation';
import { 
  SKILL_LEVELS, 
  TOURNAMENT_STATUS, 
  LEAGUE_STATUS,
  getTournamentTotalParticipants,
  getTournamentTotalExpected
} from '../services/models';
import { calculateTournamentPaymentSummary, calculateOverallPaymentSummary } from '../utils/paymentUtils';
import { generateGoogleMapsLink, generateDirectionsLink, openLinkSafely, extractDomain } from '../utils/linkUtils';
import StickyNavigation from './StickyNavigation';

// Import our UI components
import { 
  Button, 
  Modal, 
  ModalHeaderButton,
  Card, 
  TableActions,
  Alert,
  ConfirmDialog
} from './ui';
import TournamentForm from './tournament/TournamentForm';
import DivisionMemberSelector from './tournament/DivisionMemberSelector';
import PaymentStatus from './tournament/PaymentStatus';
import { MemberForm } from './member';
import { LeagueForm, LeagueMemberSelector } from './league';
import { SignUpForm } from './auth';
import SignInForm from './auth/SignInForm';
import { CommentSection } from './comments';

// ADDED: Import results entry forms and display components
import { 
  TournamentResultsForm, 
  LeagueResultsForm, 
  PlayerPerformanceForm,
  ResultsCard,
  ResultsTable
} from './result';

// CSS for responsive optimizations (keeping existing styles + new results styles)
const dashboardStyles = `
  /* Mobile-first optimizations - ENHANCED */
  .mobile-card {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  
  .mobile-card:active {
    transform: scale(0.98);
  }
  
  /* ENHANCED: Responsive breakpoints for better mobile support */
  @media (max-width: 375px) {
    .mobile-card {
      padding: 12px !important;
    }
    
    .mobile-card .p-4 {
      padding: 12px !important;
    }
    
    .mobile-card .pb-4 {
      padding-bottom: 12px !important;
    }
    
    .mobile-card .px-4 {
      padding-left: 12px !important;
      padding-right: 12px !important;
    }
    
    .mobile-action-button {
      min-height: 44px !important;
      min-width: 100px !important;
      font-size: 0.75rem !important;
      padding: 8px 12px !important;
    }
    
    .mobile-action-button svg {
      height: 14px !important;
      width: 14px !important;
    }
    
    .touch-target {
      min-height: 44px !important;
      min-width: 44px !important;
    }
    
    /* Smaller text on very small screens */
    .mobile-card h3 {
      font-size: 1rem !important;
      line-height: 1.25 !important;
    }
    
    .mobile-card .text-xs {
      font-size: 0.6875rem !important;
    }
    
    /* Tighter spacing */
    .mobile-card .space-y-2 > * + * {
      margin-top: 0.375rem !important;
    }
    
    .mobile-card .space-y-3 > * + * {
      margin-top: 0.5rem !important;
    }
    
    .mobile-card .mb-3 {
      margin-bottom: 0.5rem !important;
    }
    
    .mobile-card .mt-3 {
      margin-top: 0.5rem !important;
    }
  }
  
  @media (max-width: 768px) {
    .touch-target {
      min-height: 48px;
      min-width: 48px;
    }
    
    .mobile-action-button {
      min-height: 52px;
      min-width: 120px;
    }
    
    /* Better spacing on larger mobile screens */
    .mobile-card {
      padding: 16px;
    }
  }
  
  /* Desktop table optimizations - FIXED ALIGNMENT */
  @media (min-width: 769px) {
    .tournament-row, .league-row {
      transition: background-color 0.15s ease;
    }
    
    .tournament-row:hover, .league-row:hover {
      background-color: rgb(249 250 251) !important;
    }
    
    .enhanced-table {
      table-layout: fixed;
    }
    
    /* FIXED: Proper action column alignment */
    .table-actions {
      opacity: 1 !important;
      transition: none !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: flex-end !important; /* Right-align to match header */
      gap: 4px !important;
    }
    
    .table-actions button {
      width: 80px !important; /* Consistent width */
      justify-content: center !important;
    }
  }
  
  /* Prevent text selection on touch for better mobile UX */
  @media (max-width: 768px) {
    .no-select {
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
    }
  }
  
  /* Smooth scrolling for mobile */
  .mobile-scroll {
    -webkit-overflow-scrolling: touch;
  }

  /* League member selector styling - consistent with forms */
  .league-modal-section {
    background: white;
    border-radius: 16px;
    border: 1px solid #e5e7eb;
    margin-bottom: 24px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
  
  .league-modal-header {
    padding: 20px;
    border-bottom: 1px solid #e5e7eb;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  }
  
  .league-modal-content {
    padding: 24px;
  }
  
  .league-modal-input-group {
    margin-bottom: 24px;
  }
  
  .league-modal-input-group:last-child {
    margin-bottom: 0;
  }

  /* ADDED: Results entry styling */
  .results-button {
    background: linear-gradient(135deg, #059669 0%, #047857 100%);
    color: white;
    border: none;
    transition: all 0.2s ease;
  }
  
  .results-button:hover {
    background: linear-gradient(135deg, #047857 0%, #065f46 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(5, 150, 105, 0.4);
  }
  
  .results-indicator {
    display: inline-flex;
    align-items: center;
    padding: 4px 8px;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    font-size: 0.75rem;
    font-weight: 500;
    border-radius: 12px;
    box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
  }
  
`;

const DashboardStyles = () => {
  React.useEffect(() => {
    const styleId = 'dashboard-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = dashboardStyles;
      document.head.appendChild(style);
    }
    
    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        document.head.removeChild(existingStyle);
      }
    };
  }, []);
  
  return null;
};

// UPDATED: Tournament Card Component with Results Entry
const TournamentCard = React.memo(({ tournament, onView, onEdit, onEnterResults, onViewResults, hasResults }) => {
  const totalParticipants = getTournamentTotalParticipants(tournament);
  const totalExpected = getTournamentTotalExpected(tournament);
  const divisionCount = tournament.divisions?.length || 0;
  
  const getStatusConfig = (status) => {
    switch (status) {
      case TOURNAMENT_STATUS.DRAFT:
        return { color: 'text-gray-600 bg-gray-100', icon: Clock, label: 'Draft' };
      case TOURNAMENT_STATUS.REGISTRATION_OPEN:
        return { color: 'text-green-700 bg-green-100', icon: CheckCircle, label: 'Open' };
      case TOURNAMENT_STATUS.IN_PROGRESS:
        return { color: 'text-blue-700 bg-blue-100', icon: Activity, label: 'In Progress' };
      case TOURNAMENT_STATUS.COMPLETED:
        return { color: 'text-purple-700 bg-purple-100', icon: Trophy, label: 'Completed' };
      default:
        return { color: 'text-gray-600 bg-gray-100', icon: Clock, label: 'Unknown' };
    }
  };

  const statusConfig = getStatusConfig(tournament.status);
  const StatusIcon = statusConfig.icon;

  const formatDate = (date) => {
    if (!date) return 'TBD';
    const dateObj = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Check if tournament is ready for results entry
  const canEnterResults = tournament.status === TOURNAMENT_STATUS.IN_PROGRESS || 
                         (tournament.status === TOURNAMENT_STATUS.COMPLETED && !hasResults);

  return (
    <div className="mobile-card bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* ENHANCED: Card Header with responsive padding */}
      <div className="p-3 sm:p-4 pb-2 sm:pb-3">
        <div className="flex items-start justify-between mb-2 sm:mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
              {tournament.name}
            </h3>
            <div className="flex items-center flex-wrap gap-1 sm:gap-2 mt-1 sm:mt-2">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig.label}
              </span>
              {divisionCount > 0 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                  <Layers className="h-3 w-3 mr-1" />
                  {divisionCount} division{divisionCount !== 1 ? 's' : ''}
                </span>
              )}
              {hasResults && (
                <span className="results-indicator">
                  <Award className="h-3 w-3 mr-1" />
                  Results
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ENHANCED: Quick Info Grid with responsive layout */}
        <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-3 text-sm">
          <div className="flex items-center text-gray-600 min-w-0">
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-gray-400 flex-shrink-0" />
            <span className="text-xs truncate">{formatDate(tournament.eventDate)}</span>
          </div>
          <div className="flex items-center text-gray-600 min-w-0">
            <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-gray-400 flex-shrink-0" />
            <span className="text-xs truncate">{totalParticipants} people</span>
          </div>
          {tournament.location && (
            <div className="col-span-1 xs:col-span-2 flex items-center text-gray-600 min-w-0">
              <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-gray-400 flex-shrink-0" />
              <span className="truncate text-xs">{tournament.location}</span>
            </div>
          )}
        </div>

        {/* Expected Revenue */}
        {totalExpected > 0 && (
          <div className="mt-2 sm:mt-3 flex items-center justify-between p-2 sm:p-3 bg-green-50 rounded-lg">
            <span className="text-xs sm:text-sm text-green-700 font-medium">Expected Revenue</span>
            <span className="text-base sm:text-lg font-bold text-green-800">${totalExpected}</span>
          </div>
        )}
      </div>

      {/* ENHANCED: Action Buttons with responsive sizing */}
      <div className="p-3 sm:px-4 sm:pb-4 pt-0 space-y-2">
        <div className="flex space-x-2">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onView(tournament);
            }}
            className="mobile-action-button flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm"
            size="sm"
          >
            <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Discuss</span>
            <span className="xs:hidden">Talk</span>
          </Button>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(tournament);
            }}
            variant="outline"
            className="mobile-action-button flex-1 text-xs sm:text-sm"
            size="sm"
          >
            <Trophy className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Manage</span>
            <span className="xs:hidden">Edit</span>
          </Button>
        </div>
        
        {canEnterResults && (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onEnterResults(tournament);
            }}
            className="mobile-action-button w-full results-button text-xs sm:text-sm"
            size="sm"
          >
            <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            Enter Results
          </Button>
        )}
        
        {hasResults && (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onViewResults(tournament);
            }}
            variant="outline"
            className="mobile-action-button w-full border-green-300 text-green-700 hover:bg-green-50 text-xs sm:text-sm"
            size="sm"
          >
            <Award className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            View Results
          </Button>
        )}
      </div>

      {/* Quick Actions Bar */}
      {tournament.location && (
        <div className="border-t border-gray-100 px-3 sm:px-4 py-2 sm:py-3 bg-gray-50">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600 font-medium">Quick Actions</span>
            <div className="flex space-x-1 sm:space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openLinkSafely(generateGoogleMapsLink(tournament.location));
                }}
                className="touch-target p-1.5 sm:p-2 rounded-md hover:bg-gray-200 transition-colors"
                title="View on Maps"
              >
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openLinkSafely(generateDirectionsLink(tournament.location));
                }}
                className="touch-target p-1.5 sm:p-2 rounded-md hover:bg-gray-200 transition-colors"
                title="Directions"
              >
                <Navigation className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
              </button>
              {tournament.website && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openLinkSafely(tournament.website);
                  }}
                  className="touch-target p-1.5 sm:p-2 rounded-md hover:bg-gray-200 transition-colors"
                  title="Website"
                >
                  <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

// UPDATED: Desktop Tournament Row Component with Results Entry
const TournamentRow = React.memo(({ tournament, onView, onEdit, onEnterResults, onViewResults, hasResults }) => {
  const totalParticipants = getTournamentTotalParticipants(tournament);
  const totalExpected = getTournamentTotalExpected(tournament);
  const divisionCount = tournament.divisions?.length || 0;
  
  const getRegistrationDeadlineText = (tournament) => {
    if (tournament.registrationDeadline) {
      const deadline = tournament.registrationDeadline.seconds 
        ? new Date(tournament.registrationDeadline.seconds * 1000)
        : new Date(tournament.registrationDeadline);
      
      return `Until ${deadline.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })}`;
    }
    return 'Until event date';
  };

  const handleViewClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    onView(tournament);
  }, [tournament, onView]);

  const handleEditClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit(tournament);
  }, [tournament, onEdit]);

  // ADDED: Results handlers
  const handleEnterResultsClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    onEnterResults(tournament);
  }, [tournament, onEnterResults]);

  const handleViewResultsClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    onViewResults(tournament);
  }, [tournament, onViewResults]);

  // ADDED: Check if tournament is ready for results entry
  const canEnterResults = tournament.status === TOURNAMENT_STATUS.IN_PROGRESS || 
                         (tournament.status === TOURNAMENT_STATUS.COMPLETED && !hasResults);

  return (
    <tr key={tournament.id} className="tournament-row">
      {/* Name Column */}
      <td className="py-4 px-4 align-top">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="font-medium text-gray-900 leading-5 break-words flex-1">
              {tournament.name}
            </div>
            {/* Results indicator positioned next to name */}
            {hasResults && (
              <div className="results-indicator flex-shrink-0">
                <Award className="h-3 w-3 mr-1" />
                Results
              </div>
            )}
          </div>
          
          {/* Quick indicators - now with more space */}
          <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs">
            <div className="flex items-center text-gray-500">
              <Users className="h-3 w-3 mr-1" />
              <span>{totalParticipants} total</span>
            </div>
            {divisionCount > 0 && (
              <div className="flex items-center text-blue-600">
                <Layers className="h-3 w-3 mr-1" />
                <span>{divisionCount} divisions</span>
              </div>
            )}
            {totalExpected > 0 && (
              <div className="flex items-center text-green-600 font-medium">
                <span>${totalExpected}</span>
              </div>
            )}
            {tournament.commentCount > 0 && (
              <div className="flex items-center text-gray-400">
                <MessageSquare className="h-3 w-3 mr-1" />
                <span>{tournament.commentCount}</span>
              </div>
            )}
          </div>
        </div>
      </td>

      {/* Date & Divisions Column */}
      <td className="py-4 px-4 align-top">
        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-900">
            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
            <span className="font-medium">
              {tournament.eventDate 
                ? new Date(tournament.eventDate.seconds * 1000).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })
                : 'TBD'
              }
            </span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Layers className="h-4 w-4 mr-2 text-gray-400" />
            <span>{divisionCount} division{divisionCount !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Users className="h-4 w-4 mr-2 text-gray-400" />
            <span>{totalParticipants} participants</span>
          </div>
        </div>
      </td>

      {/* Location Column */}
      <td className="py-4 px-4 align-top">
        <div className="space-y-2">
          {tournament.location ? (
            <>
              <div className="text-sm text-gray-900 leading-5 break-words">
                {tournament.location}
              </div>
              <div className="flex items-center space-x-1">
                <button 
                  className="inline-flex items-center px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
                  onClick={() => openLinkSafely(generateGoogleMapsLink(tournament.location))}
                  title="View on Maps"
                  type="button"
                >
                  <MapPin className="h-3 w-3 mr-1" />
                  Maps
                </button>
                {tournament.website && (
                  <button 
                    className="inline-flex items-center px-2 py-1 text-xs bg-gray-50 text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
                    onClick={() => openLinkSafely(tournament.website)}
                    title="Visit Website"
                    type="button"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Site
                  </button>
                )}
              </div>
            </>
          ) : (
            <span className="text-gray-400 text-sm">No location</span>
          )}
        </div>
      </td>

      {/* Status Column */}
      <td className="py-4 px-4 align-top">
        <div className="space-y-2">
          <span className={`
            inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
            ${tournament.status === TOURNAMENT_STATUS.DRAFT ? 'bg-gray-100 text-gray-800' :
              tournament.status === TOURNAMENT_STATUS.REGISTRATION_OPEN ? 'bg-green-100 text-green-800' :
              tournament.status === TOURNAMENT_STATUS.IN_PROGRESS ? 'bg-blue-100 text-blue-800' :
              tournament.status === TOURNAMENT_STATUS.COMPLETED ? 'bg-purple-100 text-purple-800' :
              'bg-gray-100 text-gray-800'
            }
          `}>
            <div className={`
              w-1.5 h-1.5 rounded-full mr-1.5
              ${tournament.status === TOURNAMENT_STATUS.REGISTRATION_OPEN ? 'bg-green-400' :
                tournament.status === TOURNAMENT_STATUS.IN_PROGRESS ? 'bg-blue-400' :
                tournament.status === TOURNAMENT_STATUS.COMPLETED ? 'bg-purple-400' :
                'bg-gray-400'
              }
            `}></div>
            {tournament.status.replace('_', ' ')}
          </span>
          <div className="text-xs text-gray-500">
            {tournament.status === TOURNAMENT_STATUS.REGISTRATION_OPEN 
              ? getRegistrationDeadlineText(tournament) 
              : ''
            }
          </div>
        </div>
      </td>

      {/* UPDATED: Actions Column with Results */}
      <td className="py-4 px-4 align-top">
        <div className="flex flex-col space-y-1 table-actions">
          <button 
            className="inline-flex items-center justify-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors w-20"
            onClick={handleViewClick}
            type="button"
          >
            Discuss
          </button>
          <button 
            className="inline-flex items-center justify-center px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors w-20"
            onClick={handleEditClick}
            type="button"
          >
            Edit
          </button>
          {/* ADDED: Results buttons */}
          {canEnterResults && (
            <button 
              className="inline-flex items-center justify-center px-3 py-1.5 text-sm results-button rounded-md hover:opacity-90 transition-colors w-20"
              onClick={handleEnterResultsClick}
              type="button"
            >
              Results
            </button>
          )}
          {hasResults && (
            <button 
              className="inline-flex items-center justify-center px-3 py-1.5 text-sm border border-green-300 text-green-700 rounded-md hover:bg-green-50 transition-colors w-20"
              onClick={handleViewResultsClick}
              type="button"
            >
              View
            </button>
          )}
        </div>
      </td>
    </tr>
  );
});

// UPDATED: League Card Component with Results Entry
const LeagueCard = React.memo(({ league, onView, onEdit, onEnterResults, onViewResults, hasResults }) => {
  const participantCount = league.participants?.length || 0;
  
  const formatEventType = (eventType) => {
    if (!eventType) return '';
    return eventType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDateRange = (startDate, endDate) => {
    if (!startDate || !endDate) return 'TBD';
    const start = startDate.seconds ? new Date(startDate.seconds * 1000) : new Date(startDate);
    const end = endDate.seconds ? new Date(endDate.seconds * 1000) : new Date(endDate);
    
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case LEAGUE_STATUS.ACTIVE:
        return 'text-green-700 bg-green-100';
      case LEAGUE_STATUS.COMPLETED:
        return 'text-purple-700 bg-purple-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // ADDED: Check if league can have results entered
  const canEnterResults = league.status === LEAGUE_STATUS.COMPLETED && !hasResults;

  return (
    <div className="mobile-card bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Card Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {league.name}
            </h3>
            <div className="flex items-center space-x-2 mt-2">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(league.status)}`}>
                {league.status.replace('_', ' ')}
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 capitalize">
                {league.skillLevel}
              </span>
              {/* ADDED: Results indicator */}
              {hasResults && (
                <span className="results-indicator">
                  <Award className="h-3 w-3 mr-1" />
                  Results
                </span>
              )}
            </div>
          </div>
        </div>

        {/* League Info */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center text-gray-600">
            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
            <span className="text-xs">{formatDateRange(league.startDate, league.endDate)}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center text-gray-600">
              <Users className="h-4 w-4 mr-2 text-gray-400" />
              <span className="text-xs">{participantCount} member{participantCount !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <Trophy className="h-4 w-4 mr-2 text-gray-400" />
              <span className="text-xs">{formatEventType(league.eventType)}</span>
            </div>
          </div>
          {league.location && (
            <div className="flex items-center text-gray-600">
              <MapPin className="h-4 w-4 mr-2 text-gray-400" />
              <span className="truncate text-xs">{league.location}</span>
            </div>
          )}
        </div>

        {/* Registration Fee */}
        {league.registrationFee > 0 && (
          <div className="mt-3 flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <span className="text-sm text-green-700 font-medium">Registration Fee</span>
            <span className="text-lg font-bold text-green-800">${league.registrationFee}</span>
          </div>
        )}
      </div>

      {/* UPDATED: Action Buttons with Results Entry */}
      <div className="px-4 pb-4 space-y-2">
        <div className="flex space-x-2">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onView(league);
            }}
            className="mobile-action-button flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            size="md"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Discuss
          </Button>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(league);
            }}
            variant="outline"
            className="mobile-action-button flex-1"
            size="md"
          >
            <Activity className="h-4 w-4 mr-2" />
            Manage
          </Button>
        </div>
        
        {/* ADDED: Results action button */}
        {canEnterResults && (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onEnterResults(league);
            }}
            className="mobile-action-button w-full results-button"
            size="md"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Enter Results
          </Button>
        )}
        
        {hasResults && (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onViewResults(league);
            }}
            variant="outline"
            className="mobile-action-button w-full border-green-300 text-green-700 hover:bg-green-50"
            size="md"
          >
            <Award className="h-4 w-4 mr-2" />
            View Results
          </Button>
        )}
      </div>
    </div>
  );
});

// UPDATED: Desktop League Row Component with Results Entry
const LeagueRow = React.memo(({ league, onView, onEdit, onEnterResults, onViewResults, hasResults }) => {
  const formatEventType = (eventType) => {
    if (!eventType) return '';
    return eventType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const handleViewClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    onView(league);
  }, [league, onView]);

  const handleEditClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit(league);
  }, [league, onEdit]);

  // ADDED: Results handlers
  const handleEnterResultsClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    onEnterResults(league);
  }, [league, onEnterResults]);

  const handleViewResultsClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    onViewResults(league);
  }, [league, onViewResults]);

  // ADDED: Check if league can have results entered
  const canEnterResults = league.status === LEAGUE_STATUS.COMPLETED && !hasResults;

  return (
    <tr key={league.id} className="league-row">
      {/* Name Column */}
      <td className="py-4 px-4 align-top">
        <div className="space-y-2">
          <div className="font-medium text-gray-900 leading-5 break-words">
            {league.name}
          </div>
          
          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center text-gray-500">
              <span>Type: {formatEventType(league.eventType)}</span>
            </div>
            {league.registrationFee > 0 && (
              <div className="flex items-center text-green-600 font-medium">
                <span>${league.registrationFee}</span>
              </div>
            )}
            {league.commentCount > 0 && (
              <div className="flex items-center text-gray-400">
                <MessageSquare className="h-3 w-3 mr-1" />
                <span>{league.commentCount}</span>
              </div>
            )}
            {/* ADDED: Results indicator */}
            {hasResults && (
              <div className="results-indicator">
                <Award className="h-3 w-3 mr-1" />
                Results
              </div>
            )}
          </div>
        </div>
      </td>

      <td className="py-4 px-4 align-top">
        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-900">
            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
            <span className="font-medium">
              {league.startDate && league.endDate
                ? `${new Date(league.startDate.seconds * 1000).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  })} to ${new Date(league.endDate.seconds * 1000).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  })}`
                : 'TBD'
              }
            </span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Trophy className="h-4 w-4 mr-2 text-gray-400" />
            <span className="capitalize">{league.skillLevel}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Users className="h-4 w-4 mr-2 text-gray-400" />
            <span>{league.participants?.length || 0} members</span>
          </div>
        </div>
      </td>

      <td className="py-4 px-4 align-top">
        <div className="space-y-2">
          {league.location ? (
            <>
              <div className="text-sm text-gray-900 leading-5 break-words">
                {league.location}
              </div>
              <div className="flex items-center space-x-1">
                <button 
                  className="inline-flex items-center px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
                  onClick={() => openLinkSafely(generateGoogleMapsLink(league.location))}
                  title="View on Maps"
                  type="button"
                >
                  <MapPin className="h-3 w-3 mr-1" />
                  Maps
                </button>
                {league.website && (
                  <button 
                    className="inline-flex items-center px-2 py-1 text-xs bg-gray-50 text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
                    onClick={() => openLinkSafely(league.website)}
                    title="Visit Website"
                    type="button"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Site
                  </button>
                )}
              </div>
            </>
          ) : (
            <span className="text-gray-400 text-sm">No location</span>
          )}
        </div>
      </td>

      <td className="py-4 px-4 align-top">
        <div className="space-y-2">
          <span className={`
            inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
            ${league.status === LEAGUE_STATUS.ACTIVE ? 'bg-green-100 text-green-800' :
              league.status === LEAGUE_STATUS.COMPLETED ? 'bg-purple-100 text-purple-800' :
              'bg-gray-100 text-gray-800'
            }
          `}>
            <div className={`
              w-1.5 h-1.5 rounded-full mr-1.5
              ${league.status === LEAGUE_STATUS.ACTIVE ? 'bg-green-400' :
                league.status === LEAGUE_STATUS.COMPLETED ? 'bg-purple-400' :
                'bg-gray-400'
              }
            `}></div>
            {league.status.replace('_', ' ')}
          </span>
          <div className="text-xs text-gray-500">
            {league.status === LEAGUE_STATUS.ACTIVE ? 'Ongoing' : ''}
          </div>
        </div>
      </td>

      {/* FIXED: Actions Column with proper alignment */}
      <td className="py-4 px-4 align-top">
        <div className="table-actions">
          <button 
            className="inline-flex items-center justify-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            onClick={handleViewClick}
            type="button"
          >
            Discuss
          </button>
          <button 
            className="inline-flex items-center justify-center px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            onClick={handleEditClick}
            type="button"
          >
            Edit
          </button>
          {canEnterResults && (
            <button 
              className="inline-flex items-center justify-center px-3 py-1.5 text-sm results-button rounded-md hover:opacity-90 transition-colors"
              onClick={handleEnterResultsClick}
              type="button"
            >
              Results
            </button>
          )}
          {hasResults && (
            <button 
              className="inline-flex items-center justify-center px-3 py-1.5 text-sm border border-green-300 text-green-700 rounded-md hover:bg-green-50 transition-colors"
              onClick={handleViewResultsClick}
              type="button"
            >
              View
            </button>
          )}
        </div>
      </td>
    </tr>
  );
});

// Member Card Component (unchanged - no results needed for members)
const MemberCard = React.memo(({ member, onEdit }) => {
  return (
    <div className="mobile-card bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="h-12 w-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-semibold text-lg">
                {member.firstName.charAt(0)}{member.lastName.charAt(0)}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold text-gray-900 truncate">
                {member.firstName} {member.lastName}
              </h3>
              <p className="text-sm text-gray-600 truncate">{member.email}</p>
              <div className="flex items-center space-x-2 mt-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 capitalize">
                  {member.skillLevel}
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                  {member.role}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-2 text-sm">
          {member.phoneNumber && (
            <div className="flex items-center text-gray-600">
              <Phone className="h-3 w-3 mr-2 text-gray-400" />
              <span className="text-xs">{member.phoneNumber}</span>
            </div>
          )}
          {member.venmoHandle && (
            <div className="flex items-center text-gray-600">
              <DollarSign className="h-3 w-3 mr-2 text-gray-400" />
              <span className="text-xs">@{member.venmoHandle}</span>
            </div>
          )}
        </div>

        {/* Status and Actions */}
        <div className="flex items-center justify-between mt-4">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            member.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {member.isActive ? 'Active' : 'Inactive'}
          </span>
          
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(member);
            }}
            variant="outline"
            size="sm"
            className="touch-target"
          >
            Edit
          </Button>
        </div>
      </div>
    </div>
  );
});

// FIXED: ResultsDashboard Component - Updated section from Dashboard.jsx
// This replaces the ResultsDashboard component in the existing Dashboard.jsx file

// FIXED: Results Dashboard Component with proper data handling
const ResultsDashboard = ({ results, tournaments, leagues, members, onViewTournamentResults, onViewLeagueResults }) => {
  // FIXED: Simplified and standardized results processing
  const allResults = useMemo(() => {
    console.log('🔍 Processing results for dashboard');
    console.log('📊 Available results:', {
      tournament: results.tournament?.length || 0,
      league: results.league?.length || 0
    });

    // Process tournament results with proper error handling
    const tournamentResults = (results.tournament || []).map(result => {
      console.log('🏆 Processing tournament result:', result.id);
      
      // Find associated tournament
      const tournament = tournaments.find(t => t.id === result.tournamentId);
      if (!tournament) {
        console.warn('⚠️ Tournament not found for result:', result.tournamentId);
      }
      
      return {
        ...result,
        type: 'tournament',
        eventName: result.tournamentName || tournament?.name || 'Unknown Tournament',
        eventDate: result.eventDate || result.completedDate || tournament?.eventDate,
        location: tournament?.location || 'Location TBD',
        participantCount: result.divisionResults?.reduce((total, div) => 
          total + (div.participantPlacements?.length || 0), 0
        ) || 0,
        divisionCount: result.divisionResults?.length || 0
      };
    });

    // Process league results with proper error handling
    const leagueResults = (results.league || []).map(result => {
      console.log('🏐 Processing league result:', result.id);
      
      // Find associated league
      const league = leagues.find(l => l.id === result.leagueId);
      if (!league) {
        console.warn('⚠️ League not found for result:', result.leagueId);
      }
      
      return {
        ...result,
        type: 'league',
        eventName: result.leagueName || league?.name || 'Unknown League',
        eventDate: result.eventDate || result.completedDate || league?.endDate,
        location: league?.location || 'Location TBD',
        participantCount: result.participantPlacements?.length || 0,
        season: result.season || 'Unknown Season'
      };
    });

    // Combine and sort by date
    const combined = [...tournamentResults, ...leagueResults];
    
    const sorted = combined.sort((a, b) => {
      const getDate = (item) => {
        if (item.eventDate?.seconds) return new Date(item.eventDate.seconds * 1000);
        if (item.eventDate) return new Date(item.eventDate);
        return new Date(0);
      };
      
      return getDate(b) - getDate(a); // Most recent first
    });

    console.log('✅ Final processed results:', sorted.length);
    return sorted;
  }, [results, tournaments, leagues]);

  // FIXED: Simplified empty state handling
  if (allResults.length === 0) {
    console.log('📭 No results to display');
    return (
      <div className="text-center py-12 text-gray-500">
        <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p className="text-lg font-medium">No results yet</p>
        <p className="text-sm mt-1">Tournament and league results will appear here when entered</p>
        
        {/* Debug info for development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-left max-w-md mx-auto">
            <h4 className="text-sm font-medium text-yellow-800 mb-2">Debug Info:</h4>
            <p className="text-xs text-yellow-700">Raw tournament results: {results.tournament?.length || 0}</p>
            <p className="text-xs text-yellow-700">Raw league results: {results.league?.length || 0}</p>
            <p className="text-xs text-yellow-700">Available tournaments: {tournaments?.length || 0}</p>
            <p className="text-xs text-yellow-700">Available leagues: {leagues?.length || 0}</p>
            <p className="text-xs text-yellow-700">Check browser console for detailed logs</p>
          </div>
        )}
      </div>
    );
  }

  // FIXED: Helper functions with better error handling
  const formatDate = (date) => {
    try {
      if (!date) return 'N/A';
      const dateObj = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
      return dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      console.warn('Date formatting error:', error);
      return 'Invalid Date';
    }
  };

  const getResultSummary = (result) => {
    try {
      if (result.type === 'tournament') {
        const divisionCount = result.divisionCount || 0;
        const participantCount = result.participantCount || 0;
        return `${divisionCount} division${divisionCount !== 1 ? 's' : ''}, ${participantCount} participants`;
      } else {
        const participantCount = result.participantCount || 0;
        const season = result.season ? ` • ${result.season}` : '';
        return `${participantCount} participants${season}`;
      }
    } catch (error) {
      console.warn('Summary generation error:', error);
      return 'Details unavailable';
    }
  };

  const handleResultClick = (result) => {
    try {
      console.log('🖱️ Clicked on result:', result.type, result.id);
      
      if (result.type === 'tournament') {
        const tournament = tournaments.find(t => t.id === result.tournamentId);
        if (tournament) {
          onViewTournamentResults(tournament);
        } else {
          console.error('Tournament not found for result:', result.tournamentId);
        }
      } else if (result.type === 'league') {
        const league = leagues.find(l => l.id === result.leagueId);
        if (league) {
          onViewLeagueResults(league);
        } else {
          console.error('League not found for result:', result.leagueId);
        }
      }
    } catch (error) {
      console.error('Error handling result click:', error);
    }
  };

  return (
    <div className="space-y-4">
      {allResults.map((result) => (
        <div 
          key={`${result.type}-${result.id}`}
          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer hover:border-gray-300"
          onClick={() => handleResultClick(result)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 mb-2">
                <div className={`p-2 rounded-lg ${
                  result.type === 'tournament' 
                    ? 'bg-yellow-100 text-yellow-700' 
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {result.type === 'tournament' ? (
                    <Trophy className="h-4 w-4" />
                  ) : (
                    <Activity className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 truncate">
                    {result.eventName}
                  </h4>
                  <p className="text-sm text-gray-600 capitalize">
                    {result.type} • {formatDate(result.eventDate)}
                  </p>
                </div>
                <span className="results-indicator flex-shrink-0">
                  <Award className="h-3 w-3 mr-1" />
                  Complete
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>{getResultSummary(result)}</span>
                {result.location && result.location !== 'Location TBD' && (
                  <span className="flex items-center">
                    <MapPin className="h-3 w-3 mr-1" />
                    <span className="truncate max-w-xs">{result.location}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const Dashboard = () => {
  const { user, signIn, signUpWithProfile, logout, isAuthenticated, loading: authLoading } = useAuth();
  const { members, loading: membersLoading, addMember, updateMember, deleteMember } = useMembers({ realTime: false });
  const { leagues, loading: leaguesLoading, addLeague, updateLeague, deleteLeague, archiveLeague, unarchiveLeague } = useLeagues({ realTime: false });
  const { tournaments, loading: tournamentsLoading, addTournament, updateTournament, deleteTournament, archiveTournament, unarchiveTournament } = useTournaments({ realTime: false });
  
  // ADDED: Results and performance hooks
  const { 
  results, 
  loading: resultsLoading, 
  addTournamentResults, 
  addLeagueResults, 
  updateTournamentResults,
  updateLeagueResults 
} = useResults();

// DEBUG: Enhanced logging for results troubleshooting
console.log('=== RESULTS DEBUG ===');
console.log('results object:', results);
console.log('results.tournament:', results.tournament);
console.log('results.league:', results.league);
console.log('resultsLoading:', resultsLoading);
console.log('tournaments count:', tournaments.length);
console.log('leagues count:', leagues.length);
console.log('results.tournament length:', results.tournament?.length || 0);
console.log('results.league length:', results.league?.length || 0);

// Check if we have any completed events that should have results
const completedTournaments = tournaments.filter(t => t.status === 'completed');
const completedLeagues = leagues.filter(l => l.status === 'completed');
console.log('completed tournaments:', completedTournaments.length);
console.log('completed leagues:', completedLeagues.length);
  
  const { 
    playerPerformance, 
    loading: performanceLoading,
    addPlayerPerformance,
    updatePlayerPerformance 
  } = usePlayerPerformance();

  // MOVED: Filter out archived items (moved early to avoid temporal dead zone)
  const activeTournaments = useMemo(() => {
    return tournaments.filter(tournament => tournament.status !== 'archived');
  }, [tournaments]);

  const activeLeagues = useMemo(() => {
    return leagues.filter(league => league.status !== 'archived');
  }, [leagues]);

  // Smooth navigation hook
  const { activeSection, scrollToSection, navItems, refs } = useSmoothNavigation();

  // FIXED: Consolidated modal state management
  const [activeModal, setActiveModal] = useState(null);
  const [modalData, setModalData] = useState(null);

  // Modal types
  const MODAL_TYPES = {
    TOURNAMENT_FORM: 'tournament_form',
    LEAGUE_FORM: 'league_form',
    MEMBER_FORM: 'member_form',
    PAYMENT_TRACKER: 'payment_tracker',
    TOURNAMENT_DETAIL: 'tournament_detail',
    LEAGUE_DETAIL: 'league_detail',
    TOURNAMENT_RESULTS_FORM: 'tournament_results_form',
    LEAGUE_RESULTS_FORM: 'league_results_form',
    PLAYER_PERFORMANCE_FORM: 'player_performance_form',
    RESULTS_VIEW: 'results_view',
    DELETE_CONFIRM: 'delete_confirm',
    LEAGUE_DELETE_CONFIRM: 'league_delete_confirm'
  };
  
  // Enhanced tournament state management
  const [formLoading, setFormLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  // Enhanced tournament state management
  const [editingTournament, setEditingTournament] = useState(null);
  const [editingLeague, setEditingLeague] = useState(null);
  const [editingMember, setEditingMember] = useState(null);
  const [viewingTournament, setViewingTournament] = useState(null);
  const [viewingLeague, setViewingLeague] = useState(null);
  
  // FIXED: Single modal close handler
  const closeModal = useCallback(() => {
    if (!formLoading && !deleteLoading) {
      setActiveModal(null);
      setModalData(null);
      
      // Clean up editing states
      setEditingTournament(null);
      setEditingLeague(null);
      setEditingMember(null);
      setSelectedLeagueMembers([]);
    }
  }, [formLoading, deleteLoading]);
  
  const currentUserMember = useMemo(() => 
    members.find(m => m.authUid === user?.uid), 
    [members, user?.uid]
  );

  // Auth UI state
  const [authMode, setAuthMode] = useState('signin');
  
  // RESPONSIVE PAGINATION: Different limits for mobile vs desktop
  const [visibleTournaments, setVisibleTournaments] = useState(4);
  const [visibleLeagues, setVisibleLeagues] = useState(4);
  const [visibleMembers, setVisibleMembers] = useState(8);
  
  // Form states
  const [selectedLeagueMembers, setSelectedLeagueMembers] = useState([]);
  // formLoading, deleteLoading, and alert moved up to avoid hoisting issues

  // Detect screen size for responsive behavior
  const [isMobile, setIsMobile] = useState(false);
  
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ADDED: Helper functions to check if events have results
  const hasResultsForTournament = useCallback((tournamentId) => {
  return results.tournament?.some(result => result.tournamentId === tournamentId) || false;
}, [results.tournament]);

  const hasResultsForLeague = useCallback((leagueId) => {
  return results.league?.some(result => result.leagueId === leagueId) || false;
}, [results.league]);

  // Event handlers
  const handleViewTournament = useCallback((tournament) => {
    console.log('Viewing tournament:', tournament);
    setModalData({ tournament });
    setActiveModal(MODAL_TYPES.TOURNAMENT_DETAIL);
  }, []);

  const handleViewLeague = useCallback((league) => {
    console.log('Viewing league:', league);
    setModalData({ league });
    setActiveModal(MODAL_TYPES.LEAGUE_DETAIL);
  }, []);

  const handleEditTournament = useCallback((tournament) => {
    console.log('Editing tournament:', tournament);
    const latestTournament = tournaments.find(t => t.id === tournament.id) || tournament;
    setEditingTournament(latestTournament);
    setModalData({ tournament: latestTournament });
    setActiveModal(MODAL_TYPES.TOURNAMENT_FORM);
  }, [tournaments]);

  const handleEditLeague = useCallback((league) => {
    console.log('Editing league:', league);
    setEditingLeague(league);
    setSelectedLeagueMembers(league.participants || []);
    setModalData({ league });
    setActiveModal(MODAL_TYPES.LEAGUE_FORM);
  }, []);

  const handleEditMember = useCallback((member) => {
    console.log('Editing member:', member);
    setEditingMember(member);
    setModalData({ member });
    setActiveModal(MODAL_TYPES.MEMBER_FORM);
  }, []);

  // ADDED: Results entry handlers
  const handleEnterTournamentResults = useCallback((tournament) => {
    console.log('Entering results for tournament:', tournament);
    setModalData({ tournament });
    setActiveModal(MODAL_TYPES.TOURNAMENT_RESULTS_FORM);
  }, []);

  const handleEnterLeagueResults = useCallback((league) => {
    console.log('Entering results for league:', league);
    setModalData({ league });
    setActiveModal(MODAL_TYPES.LEAGUE_RESULTS_FORM);
  }, []);

  const handleViewTournamentResults = useCallback((tournament) => {
  console.log('=== VIEWING TOURNAMENT RESULTS ===');
  console.log('Tournament:', tournament);
  
  if (!tournament) {
    console.error('No tournament provided to view results');
    return;
  }
  
  const tournamentResults = results.tournament?.find(result => {
    console.log('Checking result tournamentId:', result.tournamentId, 'against tournament.id:', tournament.id);
    return result.tournamentId === tournament.id;
  });
    
    console.log('Found tournament results:', tournamentResults);
    
    // FIXED: Ensure only one modal opens
    setModalData({ 
      type: 'tournament', 
      event: tournament, 
      results: tournamentResults 
    });
    setActiveModal(MODAL_TYPES.RESULTS_VIEW);
  }, [results.tournament]);

  const handleViewLeagueResults = useCallback((league) => {
  console.log('Viewing results for league:', league);
  
  if (!league) {
    console.error('No league provided to view results');
    return;
  }
  
  const leagueResults = results.league?.find(result => result.leagueId === league.id);
    
    setModalData({ 
      type: 'league', 
      event: league, 
      results: leagueResults 
    });
    setActiveModal(MODAL_TYPES.RESULTS_VIEW);
  }, [results.league]);

  // Sorting functions
  const getSortedTournaments = useCallback(() => {
    return [...activeTournaments].sort((a, b) => {
      const dateA = a.eventDate ? (a.eventDate.seconds ? new Date(a.eventDate.seconds * 1000) : new Date(a.eventDate)) : new Date('2099-12-31');
      const dateB = b.eventDate ? (b.eventDate.seconds ? new Date(b.eventDate.seconds * 1000) : new Date(b.eventDate)) : new Date('2099-12-31');
      
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA - dateB;
      }
      
      const createdA = a.createdAt ? (a.createdAt.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(a.createdAt)) : new Date(0);
      const createdB = b.createdAt ? (b.createdAt.seconds ? new Date(b.createdAt.seconds * 1000) : new Date(b.createdAt)) : new Date(0);
      
      return createdB - createdA;
    });
  }, [activeTournaments]);

  const getSortedLeagues = useCallback(() => {
    return [...activeLeagues].sort((a, b) => {
      const dateA = a.startDate ? (a.startDate.seconds ? new Date(a.startDate.seconds * 1000) : new Date(a.startDate)) : new Date('2099-12-31');
      const dateB = b.startDate ? (b.startDate.seconds ? new Date(b.startDate.seconds * 1000) : new Date(b.startDate)) : new Date('2099-12-31');
      
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA - dateB;
      }
      
      const createdA = a.createdAt ? (a.createdAt.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(a.createdAt)) : new Date(0);
      const createdB = b.createdAt ? (b.createdAt.seconds ? new Date(b.createdAt.seconds * 1000) : new Date(b.createdAt)) : new Date(0);
      
      return createdB - createdA;
    });
  }, [activeLeagues]);

  // REMOVED: Duplicate declarations moved earlier

  const sortedTournaments = useMemo(() => getSortedTournaments(), [getSortedTournaments]);
  const sortedLeagues = useMemo(() => getSortedLeagues(), [getSortedLeagues]);

  // Show alert message
  const showAlert = useCallback((type, title, message) => {
    console.log(`Alert: ${type} - ${title}: ${message}`);
    setAlert({ type, title, message });
    setTimeout(() => setAlert(null), 5000);
  }, []);

  // UPDATED: RESPONSIVE COMPONENTS - Show cards on mobile, tables on desktop with results support
  const ResponsiveTournamentList = ({ data, visibleCount, onLoadMore, hasMore }) => {
    const displayData = data.slice(0, visibleCount);
    
    if (!data || data.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500">
          <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">No tournaments yet</p>
          <p className="text-sm mt-1">Create your first tournament to get started!</p>
        </div>
      );
    }

    if (isMobile) {
      // Mobile: Show cards
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {displayData.map((tournament) => (
              <TournamentCard 
                key={tournament.id}
                tournament={tournament}
                onView={handleViewTournament}
                onEdit={handleEditTournament}
                onEnterResults={handleEnterTournamentResults}
                onViewResults={handleViewTournamentResults}
                hasResults={hasResultsForTournament(tournament.id)}
              />
            ))}
          </div>
          
          {hasMore && (
            <div className="text-center pt-4">
              <Button
                variant="outline"
                onClick={onLoadMore}
                className="mobile-action-button"
                size="md"
              >
                Load More ({Math.min(4, data.length - visibleCount)} more)
              </Button>
            </div>
          )}
          
          {data.length > 4 && (
            <div className="text-center text-sm text-gray-500">
              Showing {Math.min(visibleCount, data.length)} of {data.length} tournaments
            </div>
          )}
        </div>
      );
    } else {
      // Desktop: Show table
      return (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full enhanced-table">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm uppercase tracking-wider w-[25%]">
                      Tournament
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm uppercase tracking-wider w-[20%]">
                      Date & Divisions
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm uppercase tracking-wider w-[20%]">
                      Location
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm uppercase tracking-wider w-[15%]">
                      Status
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700 text-sm uppercase tracking-wider w-[20%]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {displayData.map((tournament) => (
                    <TournamentRow 
                      key={tournament.id}
                      tournament={tournament}
                      onView={handleViewTournament}
                      onEdit={handleEditTournament}
                      onEnterResults={handleEnterTournamentResults}
                      onViewResults={handleViewTournamentResults}
                      hasResults={hasResultsForTournament(tournament.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {hasMore && (
            <div className="text-center">
              <Button
                variant="outline"
                onClick={onLoadMore}
                className="px-6 py-2"
              >
                Load More Tournaments ({Math.min(4, data.length - visibleCount)} more)
              </Button>
            </div>
          )}
          
          {data.length > 4 && (
            <div className="text-center text-sm text-gray-500">
              Showing {Math.min(visibleCount, data.length)} of {data.length} tournaments
            </div>
          )}
        </div>
      );
    }
  };

  const ResponsiveLeagueList = ({ data, visibleCount, onLoadMore, hasMore }) => {
    const displayData = data.slice(0, visibleCount);
    
    if (!data || data.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500">
          <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">No leagues yet</p>
          <p className="text-sm mt-1">Create your first league to get started!</p>
        </div>
      );
    }

    if (isMobile) {
      // Mobile: Show cards
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {displayData.map((league) => (
              <LeagueCard 
                key={league.id}
                league={league}
                onView={handleViewLeague}
                onEdit={handleEditLeague}
                onEnterResults={handleEnterLeagueResults}
                onViewResults={handleViewLeagueResults}
                hasResults={hasResultsForLeague(league.id)}
              />
            ))}
          </div>
          
          {hasMore && (
            <div className="text-center pt-4">
              <Button
                variant="outline"
                onClick={onLoadMore}
                className="mobile-action-button"
                size="md"
              >
                Load More ({Math.min(4, data.length - visibleCount)} more)
              </Button>
            </div>
          )}
          
          {data.length > 4 && (
            <div className="text-center text-sm text-gray-500">
              Showing {Math.min(visibleCount, data.length)} of {data.length} leagues
            </div>
          )}
        </div>
      );
    } else {
      // Desktop: Show table
      return (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full enhanced-table">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm uppercase tracking-wider w-[25%]">
                      League
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm uppercase tracking-wider w-[20%]">
                      Duration & Details
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm uppercase tracking-wider w-[20%]">
                      Location
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm uppercase tracking-wider w-[15%]">
                      Status
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700 text-sm uppercase tracking-wider w-[20%]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {displayData.map((league) => (
                    <LeagueRow 
                      key={league.id}
                      league={league}
                      onView={handleViewLeague}
                      onEdit={handleEditLeague}
                      onEnterResults={handleEnterLeagueResults}
                      onViewResults={handleViewLeagueResults}
                      hasResults={hasResultsForLeague(league.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {hasMore && (
            <div className="text-center">
              <Button
                variant="outline"
                onClick={onLoadMore}
                className="px-6 py-2"
              >
                Load More Leagues ({Math.min(4, data.length - visibleCount)} more)
              </Button>
            </div>
          )}
          
          {data.length > 4 && (
            <div className="text-center text-sm text-gray-500">
              Showing {Math.min(visibleCount, data.length)} of {data.length} leagues
            </div>
          )}
        </div>
      );
    }
  };

  const ResponsiveMemberList = ({ data, visibleCount, onLoadMore, hasMore }) => {
    const displayData = data.slice(0, visibleCount);
    
    if (!data || data.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500">
          <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">No members yet</p>
          <p className="text-sm mt-1">Add your first member to get started!</p>
        </div>
      );
    }

    if (isMobile) {
      // Mobile: Show cards
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {displayData.map((member) => (
              <MemberCard 
                key={member.id}
                member={member}
                onEdit={handleEditMember}
              />
            ))}
          </div>
          
          {hasMore && (
            <div className="text-center pt-4">
              <Button
                variant="outline"
                onClick={onLoadMore}
                className="mobile-action-button"
                size="md"
              >
                Load More ({Math.min(8, data.length - visibleCount)} more)
              </Button>
            </div>
          )}
          
          {data.length > 8 && (
            <div className="text-center text-sm text-gray-500">
              Showing {Math.min(visibleCount, data.length)} of {data.length} members
            </div>
          )}
        </div>
      );
    } else {
      // Desktop: Show table
      const memberColumns = [
        {
          key: 'displayName',
          label: 'Name',
          render: (_, member) => `${member.firstName} ${member.lastName}`
        },
        {
          key: 'email',
          label: 'Email'
        },
        {
          key: 'skillLevel',
          label: 'Skill Level',
          render: (level) => <span className="capitalize">{level}</span>
        },
        {
          key: 'role',
          label: 'Role',
          render: (role) => <span className="capitalize">{role}</span>
        },
        {
          key: 'venmoHandle',
          label: 'Venmo',
          render: (handle) => handle ? `@${handle}` : '—'
        },
        {
          key: 'isActive',
          label: 'Status',
          render: (isActive) => (
            <span className={`
              px-2 py-1 text-xs rounded-full
              ${isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
            `}>
              {isActive ? 'Active' : 'Inactive'}
            </span>
          )
        },
        {
          key: 'actions',
          label: 'Actions',
          render: (_, member) => (
            <TableActions
              actions={[
                {
                  label: 'Edit',
                  onClick: () => handleEditMember(member)
                }
              ]}
            />
          )
        }
      ];

      return (
        <div className="space-y-4">
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {memberColumns.map((column) => (
                      <th
                        key={column.key}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displayData.map((row, rowIndex) => (
                    <tr
                      key={row.id || rowIndex}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      {memberColumns.map((column) => (
                        <td
                          key={column.key}
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                        >
                          {column.render 
                            ? column.render(row[column.key], row)
                            : row[column.key]
                          }
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {hasMore && (
            <div className="text-center">
              <Button
                variant="outline"
                onClick={onLoadMore}
                className="px-6 py-2"
              >
                Load More Members ({Math.min(8, data.length - visibleCount)} more)
              </Button>
            </div>
          )}
          
          {data.length > 8 && (
            <div className="text-center text-sm text-gray-500">
              Showing {Math.min(visibleCount, data.length)} of {data.length} members
            </div>
          )}
        </div>
      );
    }
  };

  // All the form handling functions (keeping existing implementations)
  const handleCreateTournament = async (tournamentData) => {
    setFormLoading(true);
    try {
      const tournamentId = await addTournament(tournamentData);
      setShowTournamentModal(false);
      setEditingTournament(null);
      showAlert('success', 'Tournament created!', `${tournamentData.name} has been created successfully`);
    } catch (err) {
      showAlert('error', 'Failed to create tournament', err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateTournament = async (tournamentData) => {
    if (!editingTournament) return;
    setFormLoading(true);
    try {
      await updateTournament(editingTournament.id, tournamentData);
      setShowTournamentModal(false);
      setEditingTournament(null);
      showAlert('success', 'Tournament updated!', `${tournamentData.name} has been updated successfully`);
    } catch (err) {
      showAlert('error', 'Failed to update tournament', err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteTournament = async (tournamentId) => {
    setDeleteLoading(true);
    try {
      await deleteTournament(tournamentId);
      setShowTournamentModal(false);
      setEditingTournament(null);
      showAlert('success', 'Tournament deleted!', 'Tournament has been successfully deleted');
    } catch (err) {
      showAlert('error', 'Failed to delete tournament', err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  // League functions (keeping existing implementations)
  const handleCreateLeague = async (leagueData) => {
    setFormLoading(true);
    try {
      const leagueId = await addLeague(leagueData);
      
      if (selectedLeagueMembers.length > 0) {
        await updateLeague(leagueId, {
          participants: selectedLeagueMembers
        });
      }
      
      setShowLeagueModal(false);
      setSelectedLeagueMembers([]);
      showAlert('success', 'League created!', `${leagueData.name} has been created successfully`);
    } catch (err) {
      showAlert('error', 'Failed to create league', err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateLeague = async (leagueData) => {
    setFormLoading(true);
    try {
      await updateLeague(editingLeague.id, {
        ...leagueData,
        participants: selectedLeagueMembers
      });
      
      setShowLeagueModal(false);
      setEditingLeague(null);
      setSelectedLeagueMembers([]);
      showAlert('success', 'League updated!', `${leagueData.name} has been updated successfully`);
    } catch (err) {
      showAlert('error', 'Failed to update league', err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteLeague = async (leagueId) => {
    setDeleteLoading(true);
    try {
      await deleteLeague(leagueId);
      setShowLeagueModal(false);
      setEditingLeague(null);
      setSelectedLeagueMembers([]);
      showAlert('success', 'League deleted!', 'League has been successfully deleted');
    } catch (err) {
      showAlert('error', 'Failed to delete league', err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Member functions (keeping existing implementations)
  const handleCreateMember = async (memberData) => {
    setFormLoading(true);
    try {
      await addMember(memberData);
      setShowMemberModal(false);
      showAlert('success', 'Member added!', `${memberData.firstName} ${memberData.lastName} has been added successfully`);
    } catch (err) {
      showAlert('error', 'Failed to add member', err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateMember = async (memberData) => {
    setFormLoading(true);
    try {
      await updateMember(editingMember.id, memberData);
      setShowMemberModal(false);
      setEditingMember(null);
      showAlert('success', 'Member updated!', `${memberData.firstName} ${memberData.lastName} has been updated successfully`);
    } catch (err) {
      showAlert('error', 'Failed to update member', err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteMember = async (memberId) => {
    setDeleteLoading(true);
    try {
      await deleteMember(memberId);
      setShowMemberModal(false);
      setEditingMember(null);
      showAlert('success', 'Member deleted!', 'Member has been successfully deleted');
    } catch (err) {
      showAlert('error', 'Failed to delete member', err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  // ADDED: Results submission handlers
  const handleTournamentResultsSubmit = async (resultsData) => {
    setFormLoading(true);
    try {
      await addTournamentResults(modalData.tournament.id, resultsData);
      
      // Update tournament status to completed
      await updateTournament(modalData.tournament.id, { 
        status: TOURNAMENT_STATUS.COMPLETED 
      });
      
      closeModal();
      showAlert('success', 'Results saved!', `Tournament results for ${modalData.tournament.name} have been saved`);
    } catch (err) {
      showAlert('error', 'Failed to save results', err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleLeagueResultsSubmit = async (resultsData) => {
    setFormLoading(true);
    try {
      await addLeagueResults(modalData.league.id, resultsData);
      
      // Update league status to completed
      await updateLeague(modalData.league.id, { 
        status: LEAGUE_STATUS.COMPLETED 
      });
      
      closeModal();
      showAlert('success', 'Results saved!', `League results for ${modalData.league.name} have been saved`);
    } catch (err) {
      showAlert('error', 'Failed to save results', err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handlePlayerPerformanceSubmit = async (performanceData) => {
    setFormLoading(true);
    try {
      await addPlayerPerformance(performanceForEvent.eventId, performanceData);
      setShowPlayerPerformanceModal(false);
      setPerformanceForEvent(null);
      showAlert('success', 'Performance saved!', 'Your performance assessment has been saved');
    } catch (err) {
      showAlert('error', 'Failed to save performance', err.message);
    } finally {
      setFormLoading(false);
    }
  };

  // Payment tracking calculations - memoized
  const getPaymentSummary = useCallback(() => {
    return calculateOverallPaymentSummary(tournaments, leagues);
  }, [tournaments, leagues]);

  const paymentSummary = useMemo(() => getPaymentSummary(), [getPaymentSummary]);

  // Handle auth functions
  const handleSignIn = async (credentials) => {
    try {
      await signIn(credentials.email, credentials.password);
      showAlert('success', 'Welcome back!', 'Signed in successfully');
    } catch (err) {
      showAlert('error', 'Sign in failed', err.message);
      throw err;
    }
  };

  const handleSignUp = async (signupData) => {
    try {
      await signUpWithProfile(signupData);
      showAlert('success', 'Welcome!', 'Account created successfully');
    } catch (err) {
      showAlert('error', 'Sign up failed', err.message);
      throw err;
    }
  };

  // Modal close handlers already defined above with closeModal function

  // Show loading state while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Authentication UI
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {alert && (
            <div className="mb-6">
              <Alert
                type={alert.type}
                title={alert.title}
                message={alert.message}
                onClose={() => setAlert(null)}
              />
            </div>
          )}

          {authMode === 'signin' ? (
            <SignInForm
              onSubmit={handleSignIn}
              onSwitchToSignUp={() => setAuthMode('signup')}
            />
          ) : (
            <SignUpForm
              onSubmit={handleSignUp}
              onSwitchToSignIn={() => setAuthMode('signin')}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardStyles />
      
      {/* Sticky Navigation */}
      <StickyNavigation 
        activeSection={activeSection}
        onNavigate={scrollToSection}
        navItems={navItems}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-4">
        {/* Alert notification */}
        {alert && (
          <div className="mb-4 sm:mb-6">
            <Alert
              type={alert.type}
              title={alert.title}
              message={alert.message}
              onClose={() => setAlert(null)}
            />
          </div>
        )}

        {/* Dashboard Title */}
        <div className="mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-600 text-sm sm:text-base mt-1">
            Welcome back, {currentUserMember?.firstName || user.email.split('@')[0]}!
          </p>
        </div>

        {/* Stats Cards - Responsive Grid */}
        <div ref={refs.statsRef} className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-8">
          <div className="bg-white rounded-lg border shadow-sm p-4 sm:p-6 text-center">
            <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 mx-auto mb-2" />
            <div className="text-xl sm:text-3xl font-bold text-gray-900">
              {tournaments.length}
            </div>
            <div className="text-xs sm:text-sm text-gray-500">Tournaments</div>
          </div>

          <div className="bg-white rounded-lg border shadow-sm p-4 sm:p-6 text-center">
            <Layers className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-xl sm:text-3xl font-bold text-gray-900">
              {tournaments.reduce((sum, t) => sum + (t.divisions?.length || 0), 0)}
            </div>
            <div className="text-xs sm:text-sm text-gray-500">Divisions</div>
          </div>

          <div className="bg-white rounded-lg border shadow-sm p-4 sm:p-6 text-center">
            <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 mx-auto mb-2" />
            <div className="text-xl sm:text-3xl font-bold text-gray-900">
              {leagues.filter(l => l.status === LEAGUE_STATUS.ACTIVE).length}
            </div>
            <div className="text-xs sm:text-sm text-gray-500">Active Leagues</div>
          </div>

          <div className="bg-white rounded-lg border shadow-sm p-4 sm:p-6 text-center">
            <Users className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-600 mx-auto mb-2" />
            <div className="text-xl sm:text-3xl font-bold text-gray-900">
              {members.length}
            </div>
            <div className="text-xs sm:text-sm text-gray-500">Members</div>
          </div>
        </div>

        {/* Quick Actions - Responsive */}
        <Card ref={refs.actionsRef} title="Quick Actions" className="mb-8 sm:mb-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-4">
            <Button 
              variant="outline" 
              onClick={() => setActiveModal(MODAL_TYPES.MEMBER_FORM)}
              className={`h-16 flex-col gap-2 ${isMobile ? 'mobile-action-button' : ''}`}
              size="md"
            >
              <Users className="h-5 w-5" />
              <span className="text-xs sm:text-sm">Add Member</span>
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => setActiveModal(MODAL_TYPES.TOURNAMENT_FORM)}
              className={`h-16 flex-col gap-2 ${isMobile ? 'mobile-action-button' : ''}`}
              size="md"
            >
              <Trophy className="h-5 w-5" />
              <span className="text-xs sm:text-sm">New Tournament</span>
            </Button>

            <Button 
              variant="outline" 
              onClick={() => setActiveModal(MODAL_TYPES.LEAGUE_FORM)}
              className={`h-16 flex-col gap-2 ${isMobile ? 'mobile-action-button' : ''}`}
              size="md"
            >
              <Activity className="h-5 w-5" />
              <span className="text-xs sm:text-sm">New League</span>
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => setActiveModal(MODAL_TYPES.PAYMENT_TRACKER)}
              className={`h-16 flex-col gap-2 ${isMobile ? 'mobile-action-button' : ''}`}
              size="md"
            >
              <DollarSign className="h-5 w-5" />
              <span className="text-xs sm:text-sm">Payment Tracker</span>
            </Button>
          </div>
        </Card>

        {/* Tournaments Section - RESPONSIVE */}
        <Card 
          ref={refs.tournamentsRef}
          title="Tournaments"
          subtitle={`${sortedTournaments.length} total tournament${sortedTournaments.length !== 1 ? 's' : ''}`}
          actions={[
            <Button 
              key="add-tournament"
              onClick={() => setActiveModal(MODAL_TYPES.TOURNAMENT_FORM)}
              className="touch-target"
              size="md"
            >
              <Plus className="h-4 w-4 mr-2" />
              New
            </Button>
          ]}
          className="mb-8 sm:mb-8"
        >
          <ResponsiveTournamentList 
            data={sortedTournaments}
            visibleCount={visibleTournaments}
            onLoadMore={() => setVisibleTournaments(prev => prev + 4)}
            hasMore={sortedTournaments.length > visibleTournaments}
          />
        </Card>

        {/* Leagues Section - RESPONSIVE */}
        <Card 
          ref={refs.leaguesRef}
          title="Leagues"
          subtitle={`${sortedLeagues.length} total league${sortedLeagues.length !== 1 ? 's' : ''}`}
          actions={[
            <Button 
              key="add-league"
              onClick={() => setActiveModal(MODAL_TYPES.LEAGUE_FORM)}
              className="touch-target"
              size="md"
            >
              <Plus className="h-4 w-4 mr-2" />
              New
            </Button>
          ]}
          className="mb-8 sm:mb-8"
        >
          <ResponsiveLeagueList 
            data={sortedLeagues}
            visibleCount={visibleLeagues}
            onLoadMore={() => setVisibleLeagues(prev => prev + 4)}
            hasMore={sortedLeagues.length > visibleLeagues}
          />
        </Card>

        {/* Members Section - RESPONSIVE */}
        <Card 
          ref={refs.membersRef}
          title="Members"
          subtitle={`${members.length} total member${members.length !== 1 ? 's' : ''}`}
          actions={[
            <Button 
              key="add-member"
              onClick={() => setActiveModal(MODAL_TYPES.MEMBER_FORM)}
              className="touch-target"
              size="md"
            >
              <Plus className="h-4 w-4 mr-2" />
              New
            </Button>
          ]}
          className="mb-8 sm:mb-8"
        >
          <ResponsiveMemberList 
            data={members}
            visibleCount={visibleMembers}
            onLoadMore={() => setVisibleMembers(prev => prev + 8)}
            hasMore={members.length > visibleMembers}
          />
        </Card>

        {/* Results Section - RESPONSIVE */}
        <Card 
          ref={refs.resultsRef}
          title="Event Results History"
          subtitle={`${(results.tournament?.length || 0) + (results.league?.length || 0)} completed event${((results.tournament?.length || 0) + (results.league?.length || 0)) !== 1 ? 's' : ''} with results`}
          className="mb-8 sm:mb-8"
        >
          <ResultsDashboard 
            results={results}
            tournaments={tournaments}
            leagues={leagues}
            members={members}
            onViewTournamentResults={handleViewTournamentResults}
            onViewLeagueResults={handleViewLeagueResults}
          />
        </Card>
        
        {/* FIXED: Single modal rendering based on activeModal */}
        
        {/* Tournament Form Modal */}
        {activeModal === MODAL_TYPES.TOURNAMENT_FORM && (
          <Modal
            isOpen={true}
            onClose={closeModal}
            title={editingTournament ? 'Edit Tournament' : 'Create New Tournament'}
            size="xl"
            headerAction={editingTournament ? (
              <>
                <ModalHeaderButton
                  variant="danger"
                  onClick={() => {
                    setModalData({ tournament: editingTournament });
                    setActiveModal(MODAL_TYPES.DELETE_CONFIRM);
                  }}
                  disabled={formLoading || deleteLoading}
                  icon={<Trash2 className="h-4 w-4" />}
                >
                  Delete
                </ModalHeaderButton>
                <ModalHeaderButton
                  variant="primary"
                  type="submit"
                  form="tournament-form"
                  loading={formLoading}
                  disabled={formLoading || deleteLoading}
                  icon={<CheckCircle className="h-4 w-4" />}
                >
                  Update Tournament
                </ModalHeaderButton>
              </>
            ) : null}
          >
            <div className="space-y-6">
              <TournamentForm
                tournament={editingTournament}
                onSubmit={editingTournament ? handleUpdateTournament : handleCreateTournament}
                onCancel={closeModal}
                onUpdateTournament={updateTournament}
                loading={formLoading}
                deleteLoading={deleteLoading}
                members={members}
              />
            </div>
          </Modal>
        )}

        {/* Tournament Detail Modal */}
        {activeModal === MODAL_TYPES.TOURNAMENT_DETAIL && modalData?.tournament && (
          <Modal
            isOpen={true}
            onClose={closeModal}
            title={modalData.tournament.name || 'Tournament Discussion'}
            size="xl"
          >
            <CommentSection
              eventId={modalData.tournament.id}
              eventType="tournament"
              event={modalData.tournament}
            />
          </Modal>
        )}

        {/* League Form Modal */}
        {activeModal === MODAL_TYPES.LEAGUE_FORM && (
          <Modal
            isOpen={true}
            onClose={closeModal}
            title={editingLeague ? 'Edit League' : 'Create New League'}
            size="lg"
            headerAction={editingLeague ? (
              <>
                <ModalHeaderButton
                  variant="danger"
                  onClick={() => {
                    setModalData({ league: editingLeague });
                    setActiveModal(MODAL_TYPES.LEAGUE_DELETE_CONFIRM);
                  }}
                  disabled={formLoading || deleteLoading}
                  icon={<Trash2 className="h-4 w-4" />}
                >
                  Delete
                </ModalHeaderButton>
                <ModalHeaderButton
                  variant="primary"
                  type="submit"
                  form="league-form"
                  loading={formLoading}
                  disabled={formLoading || deleteLoading}
                  icon={<CheckCircle className="h-4 w-4" />}
                >
                  Update League
                </ModalHeaderButton>
              </>
            ) : null}
          >
            <div className="space-y-0">
              <LeagueForm
                league={editingLeague}
                onSubmit={editingLeague ? handleUpdateLeague : handleCreateLeague}
                onCancel={closeModal}
                loading={formLoading}
                deleteLoading={deleteLoading}
              />
              
              <div className="league-modal-section">
                <div className="league-modal-header">
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-indigo-600 mr-3" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Select League Members</h3>
                      <p className="text-sm text-gray-600 mt-1">Choose participants for this league</p>
                    </div>
                  </div>
                </div>
                
                <div className="league-modal-content">
                  <div className="league-modal-input-group">
                    <LeagueMemberSelector
                      members={members}
                      selectedMembers={selectedLeagueMembers}
                      onSelectionChange={setSelectedLeagueMembers}
                      loading={membersLoading}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Modal>
        )}

        {/* League Detail Modal */}
        {activeModal === MODAL_TYPES.LEAGUE_DETAIL && modalData?.league && (
          <Modal
            isOpen={true}
            onClose={closeModal}
            title={modalData.league.name || 'League Discussion'}
            size="xl"
          >
            <CommentSection
              eventId={modalData.league.id}
              eventType="league"
              event={modalData.league}
            />
          </Modal>
        )}

        {/* Member Modal */}
        {activeModal === MODAL_TYPES.MEMBER_FORM && (
          <Modal
            isOpen={true}
            onClose={closeModal}
            title={editingMember ? 'Edit Member' : 'Add New Member'}
            size="lg"
          >
            <MemberForm
              member={editingMember}
              onSubmit={editingMember ? handleUpdateMember : handleCreateMember}
              onCancel={closeModal}
              onDelete={editingMember ? handleDeleteMember : null}
              loading={formLoading}
              deleteLoading={deleteLoading}
            />
          </Modal>
        )}

        {/* Tournament Results Entry Modal */}
        {activeModal === MODAL_TYPES.TOURNAMENT_RESULTS_FORM && modalData?.tournament && (
          <Modal
            isOpen={true}
            onClose={closeModal}
            title={`Enter Results: ${modalData.tournament.name || 'Tournament'}`}
            size="xl"
          >
            <TournamentResultsForm
              tournament={modalData.tournament}
              members={members}
              onSubmit={handleTournamentResultsSubmit}
              onCancel={closeModal}
              loading={formLoading}
            />
          </Modal>
        )}

        {/* League Results Entry Modal */}
        {activeModal === MODAL_TYPES.LEAGUE_RESULTS_FORM && modalData?.league && (
          <Modal
            isOpen={true}
            onClose={closeModal}
            title={`Enter Results: ${modalData.league.name || 'League'}`}
            size="xl"
          >
            <LeagueResultsForm
              league={modalData.league}
              members={members}
              onSubmit={handleLeagueResultsSubmit}
              onCancel={closeModal}
              loading={formLoading}
            />
          </Modal>
        )}

        {/* Results View Modal - FIXED: Remove double modal wrapper */}
        {activeModal === MODAL_TYPES.RESULTS_VIEW && modalData && modalData.results && (
          <ResultsCard 
            result={modalData.results}
            onClose={closeModal}
            showPlayerPerformance={true}
            allowEdit={false}
          />
        )}

        {/* No Results Found - Show in regular modal */}
        {activeModal === MODAL_TYPES.RESULTS_VIEW && modalData && !modalData.results && (
          <Modal
            isOpen={true}
            onClose={closeModal}
            title={`Results: ${modalData.event?.name || 'Event'}`}
            size="lg"
          >
            <div className="text-center py-8">
              {modalData.type === 'tournament' ? (
                <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
                  <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                  <p className="text-lg font-medium text-yellow-800 mb-2">No Results Found</p>
                  <p className="text-yellow-700">
                    No detailed results found for this tournament.
                  </p>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
                  <Activity className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                  <p className="text-lg font-medium text-yellow-800 mb-2">No Results Found</p>
                  <p className="text-yellow-700">
                    No detailed results found for this league.
                  </p>
                </div>
              )}
            </div>
          </Modal>
        )}

        {/* Delete Confirmation Modals */}
        {activeModal === MODAL_TYPES.DELETE_CONFIRM && modalData?.tournament && (
          <ConfirmDialog
            isOpen={true}
            onClose={() => setActiveModal(MODAL_TYPES.TOURNAMENT_FORM)}
            onConfirm={() => {
              handleDeleteTournament(modalData.tournament.id);
            }}
            title="Delete Tournament"
            message={`Are you sure you want to delete "${modalData.tournament.name}"? This action cannot be undone and will remove all associated data including all divisions, participant registrations, and payment information.`}
            confirmText="Delete Tournament"
            cancelText="Keep Tournament"
            type="danger"
            loading={deleteLoading}
          />
        )}

        {activeModal === MODAL_TYPES.LEAGUE_DELETE_CONFIRM && modalData?.league && (
          <ConfirmDialog
            isOpen={true}
            onClose={() => setActiveModal(MODAL_TYPES.LEAGUE_FORM)}
            onConfirm={() => {
              handleDeleteLeague(modalData.league.id);
            }}
            title="Delete League"
            message={`Are you sure you want to delete "${modalData.league.name}"? This action cannot be undone and will remove all associated data including participant registrations and standings.`}
            confirmText="Delete League"
            cancelText="Keep League"
            type="danger"
            loading={deleteLoading}
          />
        )}

        {/* Payment Modal */}
        {activeModal === MODAL_TYPES.PAYMENT_TRACKER && (
          <Modal
            isOpen={true}
            onClose={closeModal}
            title="Payment Tracking Overview"
            size="xl"
          >
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                  <h4 className="font-medium text-blue-900">Total Expected</h4>
                  <p className="text-2xl font-bold text-blue-600">${paymentSummary.totalExpected}</p>
                  <p className="text-xs text-blue-700 mt-1">
                    {paymentSummary.paidTournaments} tournaments • {paymentSummary.paidDivisions} divisions • {paymentSummary.paidLeagues} leagues
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                  <h4 className="font-medium text-green-900">Total Collected</h4>
                  <p className="text-2xl font-bold text-green-600">${paymentSummary.totalCollected}</p>
                  <p className="text-xs text-green-700 mt-1">
                    {paymentSummary.participantsPaid} of {paymentSummary.participantsWithPayments} paid
                  </p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg border-2 border-red-200">
                  <h4 className="font-medium text-red-900">Outstanding</h4>
                  <p className="text-2xl font-bold text-red-600">${paymentSummary.totalOwed}</p>
                  <p className="text-xs text-red-700 mt-1">
                    {paymentSummary.paymentRate}% payment rate
                  </p>
                </div>
              </div>

              {/* Tournament Payment Section */}
              <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
                <div className="border-b border-gray-200 pb-4 mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Trophy className="h-6 w-6 text-green-600 mr-2" />
                    Tournament Division Payments
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">Track entry fee payments by division</p>
                </div>
                
                <div className="space-y-6">
                  {tournaments.filter(t => 
                    t.divisions && t.divisions.some(div => div.entryFee > 0)
                  ).map(tournament => {
                    const paidDivisions = tournament.divisions.filter(div => div.entryFee > 0);
                    
                    return (
                      <div key={tournament.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="mb-4">
                          <h4 className="font-medium text-gray-900">{tournament.name}</h4>
                          <p className="text-sm text-gray-600">
                            {paidDivisions.length} paid division{paidDivisions.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        
                        <div className="space-y-4">
                          {paidDivisions.map(division => (
                            <div key={division.id} className="bg-white border border-gray-200 rounded p-3">
                              <div className="flex justify-between items-center mb-3">
                                <h5 className="font-medium text-gray-800">{division.name}</h5>
                                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                  ${division.entryFee} per person
                                </span>
                              </div>
                              <PaymentStatus
                                event={{ ...tournament, ...division, participants: division.participants, paymentData: division.paymentData }}
                                eventType="tournament"
                                members={members}
                                onPaymentUpdate={(eventId, updates) => {
                                  const updatedDivisions = tournament.divisions.map(div => 
                                    div.id === division.id ? { ...div, ...updates } : div
                                  );
                                  updateTournament(tournament.id, { divisions: updatedDivisions });
                                }}
                                currentUserId={user?.uid}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  
                  {tournaments.filter(t => 
                    t.divisions && t.divisions.some(div => div.entryFee > 0)
                  ).length === 0 && (
                    <p className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">
                      No tournament divisions with entry fees found.
                    </p>
                  )}
                </div>
              </div>

              {/* League Payment Section */}
              <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
                <div className="border-b border-gray-200 pb-4 mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Activity className="h-6 w-6 text-blue-600 mr-2" />
                    League Payments
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">Track registration fee payments for leagues</p>
                </div>
                
                <div className="space-y-6">
                  {leagues.filter(l => l.registrationFee > 0).map(league => (
                    <div key={league.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium text-gray-900">{league.name}</h4>
                        <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded">
                          ${league.registrationFee} per person
                        </span>
                      </div>
                      <PaymentStatus
                        event={league}
                        eventType="league"
                        members={members}
                        onPaymentUpdate={updateLeague}
                        currentUserId={user?.uid}
                      />
                    </div>
                  ))}
                  
                  {leagues.filter(l => l.registrationFee > 0).length === 0 && (
                    <p className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">
                      No leagues with registration fees found.
                    </p>
                  )}
                </div>
              </div>

              {paymentSummary.paidEvents === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-gray-200">
                  <DollarSign className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-700 mb-2">No Payment Tracking Needed</h3>
                  <p className="text-gray-500 mb-4">No tournaments, divisions, or leagues with fees found.</p>
                  <p className="text-sm text-gray-400">Create a tournament division or league with fees to start tracking payments.</p>
                </div>
              )}
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default Dashboard;