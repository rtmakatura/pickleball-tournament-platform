// src/components/Dashboard.jsx (UPDATED - Added Results Entry Integration)
import React, { useState, useMemo, useCallback, useEffect } from 'react';
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
  Award,
  X,
  Bell,
  Edit3
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
import PaymentTracker from './payment/PaymentTracker';
import { MemberForm } from './member';
import { LeagueForm, LeagueMemberSelector } from './league';
import { SignUpForm } from './auth';
import SignInForm from './auth/SignInForm';
import { CommentSection } from './comments';
import { NotificationCenter } from './notifications';

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
      font-size: 0.75rem !important;
      padding: 8px 12px !important;
    }
    
    .mobile-action-button.flex-1 {
      min-width: 60px !important;
      flex-basis: 0 !important;
    }
    
    .mobile-action-button.w-full {
      min-width: 0 !important;
      width: 100% !important;
    }
    
    .mobile-action-button.w-full {
      width: 100% !important;
      min-width: unset !important;
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
    }
    
    .mobile-action-button.flex-1 {
      min-width: 80px;
      flex-basis: 0;
    }
    
    .mobile-action-button.w-full {
      min-width: 0 !important;
      width: 100% !important;
    }
    
    .mobile-action-button.w-full {
      width: 100% !important;
      min-width: unset !important;
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
  
  .results-button:hover {
    background: linear-gradient(135deg, #047857 0%, #065f46 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(5, 150, 105, 0.4);
  }

  /* ADDED: Results entry styling */
  .results-button {
    background: linear-gradient(135deg, #059669 0%, #047857 100%);
    color: white;
    border: none;
    transition: all 0.2s ease;
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
const TournamentCard = React.memo(({ tournament, onView, onEdit, onEnterResults, onViewResults, onViewPayments, hasResults }) => {
  const totalParticipants = getTournamentTotalParticipants(tournament);
  const totalExpected = getTournamentTotalExpected(tournament);
  const divisionCount = tournament.divisions?.length || 0;
  
  const getStatusConfig = (status) => {
    switch (status) {
      case TOURNAMENT_STATUS.DRAFT:
        return { color: 'text-gray-600 bg-gray-100', icon: Clock, label: 'Draft' };
      case TOURNAMENT_STATUS.REGISTRATION_OPEN:
        return { color: 'text-green-700 bg-green-100', icon: CheckCircle, label: 'Open' };
      case TOURNAMENT_STATUS.REGISTERED:
        return { color: 'text-blue-600 bg-blue-100', icon: Users, label: 'Registered' };
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
  const canEnterResults = tournament.status === TOURNAMENT_STATUS.COMPLETED && !hasResults;

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

        {/* Expected Payment */}
        {totalExpected > 0 && (
          <div className="mt-2 sm:mt-3 flex items-center justify-between p-2 sm:p-3 bg-green-50 rounded-lg">
            <span className="text-xs sm:text-sm text-green-700 font-medium">Expected Payment</span>
            <span className="text-base sm:text-lg font-bold text-green-800">${totalExpected}</span>
          </div>
        )}
      </div>

      {/* ENHANCED: Action Buttons with responsive sizing */}
      <div className="p-3 sm:px-4 sm:pb-4 pt-0">
        <div className="flex flex-col space-y-2">
          <div className="flex gap-2 w-full">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onView(tournament);
              }}
              className="mobile-action-button flex-1 min-w-0 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm"
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
              className="mobile-action-button flex-1 min-w-0 text-xs sm:text-sm"
              size="sm"
            >
              <Trophy className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">View Details</span>
              <span className="xs:hidden">View</span>
            </Button>
          </div>
          
          {/* ADDED: Payment tracking button */}
          {tournament.divisions?.some(div => 
            div.participants?.length > 0 && parseFloat(div.entryFee || 0) > 0
          ) && (
            <div className="flex">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewPayments(tournament);
                }}
                className="mobile-action-button flex-1 bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm"
                size="sm"
              >
                <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">View Payments</span>
                <span className="xs:hidden">Payments</span>
              </Button>
            </div>
          )}
          
          {canEnterResults && (
            <div className="flex">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onEnterResults(tournament);
                }}
                className="mobile-action-button flex-1 results-button text-xs sm:text-sm"
                size="sm"
              >
                <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Enter Results
              </Button>
            </div>
          )}
          
          {hasResults && (
            <div className="flex">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewResults(tournament);
                }}
                className="mobile-action-button flex-1 bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm"
                size="sm"
              >
                <Award className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                View Results
              </Button>
            </div>
          )}
        </div>
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
                className="touch-target p-1.5 sm:p-2 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center"
                title="View on Maps"
              >
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openLinkSafely(generateDirectionsLink(tournament.location));
                }}
                className="touch-target p-1.5 sm:p-2 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center"
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
                  className="touch-target p-1.5 sm:p-2 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center"
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
const TournamentRow = React.memo(({ tournament, onView, onEdit, onEnterResults, onViewResults, onViewPayments, hasResults }) => {
  const totalParticipants = getTournamentTotalParticipants(tournament);
  const totalExpected = getTournamentTotalExpected(tournament);
  const divisionCount = tournament.divisions?.length || 0;
  
  const getRegistrationDeadlineText = (tournament) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to start of day for accurate comparison
    
    let targetDate;
    let isRegistrationDeadline = false;
    
    // Check if there's a registration deadline first
    if (tournament.registrationDeadline) {
      targetDate = tournament.registrationDeadline.seconds 
        ? new Date(tournament.registrationDeadline.seconds * 1000)
        : new Date(tournament.registrationDeadline);
      isRegistrationDeadline = true;
    } else if (tournament.eventDate) {
      // Fall back to event date if no registration deadline
      targetDate = tournament.eventDate.seconds 
        ? new Date(tournament.eventDate.seconds * 1000)
        : new Date(tournament.eventDate);
      isRegistrationDeadline = false;
    } else {
      return 'TBD';
    }
    
    // Reset target date to start of day for comparison
    const compareDate = new Date(targetDate);
    compareDate.setHours(0, 0, 0, 0);
    
    const diffTime = compareDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      // Date has passed
      return isRegistrationDeadline ? 'Registration closed' : 'Event completed';
    } else if (diffDays === 0) {
      // Date is today
      return isRegistrationDeadline ? 'Registration closes today' : 'Event is today';
    } else if (diffDays === 1) {
      // Date is tomorrow
      return isRegistrationDeadline ? 'Registration closes tomorrow' : 'Event is tomorrow';
    } else {
      // Date is in the future
      const dateStr = targetDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      return isRegistrationDeadline ? `Until ${dateStr}` : `Event ${dateStr}`;
    }
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
  const canEnterResults = tournament.status === TOURNAMENT_STATUS.COMPLETED && !hasResults;

  return (
    <tr key={tournament.id} className="tournament-row">
      {/* Name Column */}
      <td className="py-4 px-4 align-top">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="font-medium text-gray-900 leading-5 break-words flex-1">
              {tournament.name}
            </div>
            
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
              tournament.status === TOURNAMENT_STATUS.REGISTERED ? 'bg-blue-100 text-blue-800' :
              tournament.status === TOURNAMENT_STATUS.IN_PROGRESS ? 'bg-blue-100 text-blue-800' :
              tournament.status === TOURNAMENT_STATUS.COMPLETED ? 'bg-purple-100 text-purple-800' :
              'bg-gray-100 text-gray-800'
            }
          `}>
            <div className={`
              w-1.5 h-1.5 rounded-full mr-1.5
              ${tournament.status === TOURNAMENT_STATUS.REGISTRATION_OPEN ? 'bg-green-400' :
                tournament.status === TOURNAMENT_STATUS.REGISTERED ? 'bg-blue-400' :
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
            View
          </button>
          {/* ADDED: Payment tracking button for desktop */}
          {tournament.divisions?.some(div => 
            div.participants?.length > 0 && parseFloat(div.entryFee || 0) > 0
          ) && (
            <button 
              className="inline-flex items-center justify-center px-3 py-1.5 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors w-20"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onViewPayments(tournament);
              }}
              type="button"
            >
              Payments
            </button>
          )}
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
              className="inline-flex items-center justify-center px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors w-20"
              onClick={handleViewResultsClick}
              type="button"
            >
              Results
            </button>
          )}
        </div>
      </td>
    </tr>
  );
});

// UPDATED: League Card Component with Results Entry
const LeagueCard = React.memo(({ league, onView, onEdit, onEnterResults, onViewResults, onViewPayments, hasResults }) => {
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
      case LEAGUE_STATUS.REGISTERED:
        return 'text-blue-700 bg-blue-100';
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
      <div className="px-4 pb-4">
        <div className="flex flex-col space-y-2">
          <div className="flex gap-2 w-full">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onView(league);
              }}
              className="mobile-action-button flex-1 min-w-0 bg-blue-600 hover:bg-blue-700 text-white"
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
              className="mobile-action-button flex-1 min-w-0"
              size="md"
            >
              <Activity className="h-4 w-4 mr-2" />
              View Details
            </Button>
          </div>
          
          {/* ADDED: Payment tracking button for leagues */}
          {league.participants?.length > 0 && parseFloat(league.registrationFee || 0) > 0 && (
            <div className="flex">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewPayments(league);
                }}
                className="mobile-action-button flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                size="md"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                View Payments
              </Button>
            </div>
          )}
          
          {/* ADDED: Results action button */}
          {canEnterResults && (
            <div className="flex">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onEnterResults(league);
                }}
                className="mobile-action-button flex-1 results-button"
                size="md"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Enter Results
              </Button>
            </div>
          )}
          
          {hasResults && (
            <div className="flex">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewResults(league);
                }}
                className="mobile-action-button flex-1 bg-green-600 hover:bg-green-700 text-white"
                size="md"
              >
                <Award className="h-4 w-4 mr-2" />
                View Results
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

// UPDATED: Desktop League Row Component with Results Entry
const LeagueRow = React.memo(({ league, onView, onEdit, onEnterResults, onViewResults, onViewPayments, hasResults }) => {
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
              league.status === LEAGUE_STATUS.REGISTERED ? 'bg-blue-100 text-blue-800' :
              league.status === LEAGUE_STATUS.COMPLETED ? 'bg-purple-100 text-purple-800' :
              'bg-gray-100 text-gray-800'
            }
          `}>
            <div className={`
              w-1.5 h-1.5 rounded-full mr-1.5
              ${league.status === LEAGUE_STATUS.ACTIVE ? 'bg-green-400' :
                league.status === LEAGUE_STATUS.REGISTERED ? 'bg-blue-400' :
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
            View
          </button>
          {/* ADDED: Payment tracking button for leagues desktop */}
          {league.participants?.length > 0 && parseFloat(league.registrationFee || 0) > 0 && (
            <button 
              className="inline-flex items-center justify-center px-3 py-1.5 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onViewPayments(league);
              }}
              type="button"
            >
              Payments
            </button>
          )}
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
              className="inline-flex items-center justify-center px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              onClick={handleViewResultsClick}
              type="button"
            >
              Results
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
  // Simplified and standardized results processing
  const allResults = useMemo(() => {
    // Process tournament results with proper error handling
    const tournamentResults = (results.tournament || []).map(result => {
      // Find associated tournament
      const tournament = tournaments.find(t => t.id === result.tournamentId);
      
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
      // Find associated league
      const league = leagues.find(l => l.id === result.leagueId);
      
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

    return sorted;
  }, [results, tournaments, leagues]);

  // Simplified empty state handling
  if (allResults.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p className="text-lg font-medium">No results yet</p>
        <p className="text-sm mt-1">Tournament and league results will appear here when entered</p>
        
        
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
      if (result.type === 'tournament') {
        const tournament = tournaments.find(t => t.id === result.tournamentId);
        if (tournament) {
          onViewTournamentResults(tournament);
        }
      } else if (result.type === 'league') {
        const league = leagues.find(l => l.id === result.leagueId);
        if (league) {
          onViewLeagueResults(league);
        }
      }
    } catch (error) {
      // Silently handle errors
    }
  };

  return (
    <div className="space-y-4">
      {allResults.map((result) => (
        <div
          key={`${result.type}-${result.id}`}
          className="mobile-card bg-white rounded-xl border border-gray-200 shadow-sm hover:border-gray-300 transition-all duration-200 overflow-hidden cursor-pointer"
          onClick={() => handleResultClick(result)}
        >
          {/* ENHANCED: Card Header with responsive padding */}
          <div className="p-3 sm:p-4 pb-2 sm:pb-3">
            <div className="flex items-start justify-between mb-2 sm:mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
                  <div className={`p-1.5 sm:p-2 rounded-lg ${
                    result.type === 'tournament' 
                      ? 'bg-yellow-100 text-yellow-700' 
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {result.type === 'tournament' ? (
                      <Trophy className="h-3 w-3 sm:h-4 sm:w-4" />
                    ) : (
                      <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                      {result.eventName}
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-600 capitalize mt-1">
                      {result.type} • {formatDate(result.eventDate)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ENHANCED: Quick Info Grid with responsive layout */}
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-3 text-sm">
              <div className="flex items-center text-gray-600 min-w-0">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-gray-400 flex-shrink-0" />
                <span className="text-xs truncate">{formatDate(result.eventDate)}</span>
              </div>
              <div className="flex items-center text-gray-600 min-w-0">
                <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-gray-400 flex-shrink-0" />
                <span className="text-xs truncate">{getResultSummary(result)}</span>
              </div>
              {result.location && result.location !== 'Location TBD' && (
                <div className="col-span-1 xs:col-span-2 flex items-center text-gray-600 min-w-0">
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-gray-400 flex-shrink-0" />
                  <span className="truncate text-xs">{result.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="border-t border-gray-100 px-3 sm:px-4 py-2 sm:py-3 bg-gray-50">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 font-medium">Result Details</span>
              <div className="flex space-x-1 sm:space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleResultClick(result);
                  }}
                  className="touch-target p-1.5 sm:p-2 rounded-md hover:bg-gray-200 transition-colors"
                  title="View Details"
                >
                  <Trophy className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Floating Action Menu Component
const FloatingActionMenu = ({ onCreateMember, onCreateTournament, onCreateLeague, onViewPayments, onViewArchive }) => {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    { icon: Users, label: 'Add Member', onClick: onCreateMember, color: 'from-blue-500 to-blue-600' },
    { icon: Trophy, label: 'New Tournament', onClick: onCreateTournament, color: 'from-emerald-500 to-emerald-600' },
    { icon: Activity, label: 'New League', onClick: onCreateLeague, color: 'from-purple-500 to-purple-600' },
    { icon: DollarSign, label: 'Payments', onClick: onViewPayments, color: 'from-orange-500 to-orange-600' },
    { icon: Clock, label: 'Archive', onClick: onViewArchive, color: 'from-gray-500 to-gray-600' }
  ];

  const handleActionClick = (action) => {
    action.onClick();
    setIsOpen(false);
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {/* Action Items - appear when open */}
        {isOpen && (
          <div className="absolute bottom-16 right-0 space-y-3">
            {actions.map((action, index) => {
              const Icon = action.icon;
              return (
                <div
                  key={action.label}
                  className="flex items-center space-x-3 animate-in slide-in-from-right-10 fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Label */}
                  <span className="bg-black/80 text-white px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap">
                    {action.label}
                  </span>
                  
                  {/* Action Button */}
                  <button
                    onClick={() => handleActionClick(action)}
                    className={`w-12 h-12 rounded-full bg-gradient-to-r ${action.color} shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200 flex items-center justify-center`}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Main FAB */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-14 h-14 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg hover:shadow-xl transform transition-all duration-300 flex items-center justify-center ${
            isOpen ? 'rotate-45 scale-110' : 'hover:scale-110'
          }`}
        >
          <Plus className="h-7 w-7 text-white" />
        </button>
      </div>
    </>
  );
};

const Dashboard = React.forwardRef((props, ref) => {
  const { user, signIn, signUpWithProfile, logout, isAuthenticated, loading: authLoading } = useAuth();
  const { members, loading: membersLoading, addMember, updateMember, deleteMember } = useMembers({ realTime: true });
  const { leagues, loading: leaguesLoading, addLeague, updateLeague, deleteLeague, archiveLeague, unarchiveLeague, checkAndUpdateAllLeagueStatuses } = useLeagues({ realTime: true });
  const { tournaments, loading: tournamentsLoading, addTournament, updateTournament, deleteTournament, archiveTournament, unarchiveTournament, checkAndUpdateAllTournamentStatuses } = useTournaments({ realTime: true });
  // ADDED: Results and performance hooks
  const { 
  results, 
  loading: resultsLoading, 
  addTournamentResults, 
  addLeagueResults, 
  updateTournamentResults,
  updateLeagueResults,
  deleteResult
} = useResults();


  
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
  
  // Archived items
  const archivedTournaments = useMemo(() => {
    return tournaments.filter(tournament => tournament.status === 'archived');
  }, [tournaments]);

  const archivedLeagues = useMemo(() => {
    return leagues.filter(league => league.status === 'archived');
  }, [leagues]);

  // Smooth navigation hook - remove Quick Actions section
  const { activeSection, scrollToSection, navItems, refs } = useSmoothNavigation();
  
  // Filter out Quick Actions from navigation since we removed the section
  const filteredNavItems = navItems.filter(item => item.id !== 'actions');

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
    LEAGUE_DELETE_CONFIRM: 'league_delete_confirm',
    MEMBER_DELETE_CONFIRM: 'member_delete_confirm',
    RESULT_DELETE_CONFIRM: 'result_delete_confirm',
    ARCHIVE_TOURNAMENT_CONFIRM: 'archive_tournament_confirm',
    UNARCHIVE_TOURNAMENT_CONFIRM: 'unarchive_tournament_confirm',
    ARCHIVE_LEAGUE_CONFIRM: 'archive_league_confirm',
    UNARCHIVE_LEAGUE_CONFIRM: 'unarchive_league_confirm',
    ARCHIVED_ITEMS: 'archived_items'
  };
  
  // Enhanced tournament state management
  const [formLoading, setFormLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  // Enhanced tournament state management
  const [editingTournament, setEditingTournament] = useState(null);
  const [editingLeague, setEditingLeague] = useState(null);
  const [editingMember, setEditingMember] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [viewingTournament, setViewingTournament] = useState(null);
  const [viewingLeague, setViewingLeague] = useState(null);
  
  // ADDED: Change detection for unsaved participant/member changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [initialTournamentState, setInitialTournamentState] = useState(null);
  const [initialLeagueMembers, setInitialLeagueMembers] = useState([]);
  
  // FIXED: Single modal close handler with overflow cleanup failsafe
const closeModal = useCallback(() => {
  if (!formLoading && !deleteLoading) {
    setActiveModal(null);
    setModalData(null);
    
    // Clean up editing states
    setEditingTournament(null);
    setEditingLeague(null);
    setEditingMember(null);
    setIsEditMode(false);
    setSelectedLeagueMembers([]);
    
    // ADDED: Reset change detection
    setHasUnsavedChanges(false);
    setInitialTournamentState(null);
    setInitialLeagueMembers([]);
    
    // Reset tournament form editing state to allow real-time sync
    // This ensures form data doesn't get lost when modal closes
    if (editingTournament) {
      // The TournamentForm component will handle resetting its own userIsEditing state
      // when the onCancel callback is triggered
    }
    
    // Simple failsafe: Ensure body scroll is restored
    setTimeout(() => {
      document.body.style.overflow = 'auto';
    }, 100);
  }
}, [formLoading, deleteLoading, editingTournament]);

  // ADDED: Tournament change detection callback with stable dependencies
  const handleTournamentParticipantChange = useCallback((tournament) => {
    if (!initialTournamentState) return;
    
    // Compare current tournament divisions with initial state
    const currentState = {
      divisions: tournament.divisions?.map(div => ({
        id: div.id,
        participants: [...(div.participants || [])]
      })) || []
    };
    
    // Check if participants have changed in any division
    const hasChanges = currentState.divisions.some(currentDiv => {
      const initialDiv = initialTournamentState.divisions.find(d => d.id === currentDiv.id);
      if (!initialDiv) return true; // New division
      
      // Compare participant arrays
      if (currentDiv.participants.length !== initialDiv.participants.length) return true;
      return !currentDiv.participants.every(p => initialDiv.participants.includes(p));
    });
    
    setHasUnsavedChanges(prev => {
      if (prev !== hasChanges) {
        // Auto-enter edit mode when changes are detected
        if (hasChanges) {
          setIsEditMode(true);
        }
        return hasChanges;
      }
      return prev;
    });
  }, [initialTournamentState]); // REMOVED hasUnsavedChanges and isEditMode from dependencies

  // ADDED: League member change detection with stable dependencies
  const handleLeagueMemberChange = useCallback((newMembers) => {
    setSelectedLeagueMembers(newMembers);
    
    // Compare with initial state
    const hasChanges = newMembers.length !== initialLeagueMembers.length ||
      !newMembers.every(member => initialLeagueMembers.includes(member)) ||
      !initialLeagueMembers.every(member => newMembers.includes(member));
    
    setHasUnsavedChanges(prev => {
      if (prev !== hasChanges) {
        // Auto-enter edit mode when changes are detected
        if (hasChanges) {
          setIsEditMode(true);
        }
        return hasChanges;
      }
      return prev;
    });
  }, [initialLeagueMembers]); // REMOVED hasUnsavedChanges, isEditMode, editingLeague from dependencies

  const handleEnterEditMode = useCallback(() => {
    setIsEditMode(true);
  }, []);
  
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
  
  // Archive management state
  const [showArchived, setShowArchived] = useState(false);
  
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
    console.log('Viewing tournament:', tournament);
    const latestTournament = tournaments.find(t => t.id === tournament.id) || tournament;
    setEditingTournament(latestTournament);
    setIsEditMode(false); // Start in view mode
    setHasUnsavedChanges(false); // Reset change detection
    
    // Store initial state for change detection
    setInitialTournamentState({
      divisions: latestTournament.divisions?.map(div => ({
        id: div.id,
        participants: [...(div.participants || [])]
      })) || []
    });
    
    setModalData({ tournament: latestTournament });
    setActiveModal(MODAL_TYPES.TOURNAMENT_FORM);
  }, [tournaments]);

  const handleEditLeague = useCallback((league) => {
    console.log('Viewing league:', league);
    setEditingLeague(league);
    setIsEditMode(false); // Start in view mode
    setHasUnsavedChanges(false); // Reset change detection
    
    // Store initial state for change detection
    const initialMembers = [...(league.participants || [])];
    setInitialLeagueMembers(initialMembers);
    setSelectedLeagueMembers(initialMembers);
    
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
  if (!tournament) {
    return;
  }
  
  const tournamentResults = results.tournament?.find(result => {
    return result.tournamentId === tournament.id;
  });
    
    // FIXED: Ensure only one modal opens
    setModalData({ 
      type: 'tournament', 
      event: tournament, 
      results: tournamentResults 
    });
    setActiveModal(MODAL_TYPES.RESULTS_VIEW);
  }, [results.tournament]);

  const handleViewLeagueResults = useCallback((league) => {
  if (!league) {
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

  // ADDED: Payment tracking handlers
  const handleViewTournamentPayments = useCallback((tournament) => {
    setModalData({ 
      targetEvent: {
        type: 'tournament',
        id: tournament.id,
        name: tournament.name
      }
    });
    setActiveModal(MODAL_TYPES.PAYMENT_TRACKER);
  }, []);

  const handleViewLeaguePayments = useCallback((league) => {
    setModalData({ 
      targetEvent: {
        type: 'league',
        id: league.id,
        name: league.name
      }
    });
    setActiveModal(MODAL_TYPES.PAYMENT_TRACKER);
  }, []);

  

  

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

  // Handle notification navigation from App
  const handleNotificationNavigation = useCallback((notification) => {
    try {
      const type = notification.type;
      const { eventId, eventType, commentId, divisionId } = notification.data || {};
      
      // Navigate based on notification type
      switch (type) {
        case 'mention':
        case 'comment_reply':
          if (eventType === 'tournament') {
            const tournament = tournaments.find(t => t.id === eventId);
            if (tournament) {
              handleViewTournament(tournament);
              
              // Scroll to comment after modal opens
              if (commentId) {
                setTimeout(() => {
                  const commentElement = document.getElementById(`comment-${commentId}`);
                  if (commentElement) {
                    commentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    // Add highlight styling
                    commentElement.style.backgroundColor = '#fef3c7';
                    commentElement.style.border = '2px solid #f59e0b';
                    commentElement.style.borderRadius = '8px';
                    setTimeout(() => {
                      commentElement.style.backgroundColor = '';
                      commentElement.style.border = '';
                      commentElement.style.borderRadius = '';
                    }, 3000);
                  }
                }, 1000);
              }
            }
          } else if (eventType === 'league') {
            const league = leagues.find(l => l.id === eventId);
            if (league) {
              handleViewLeague(league);
              
              // Scroll to comment after modal opens
              if (commentId) {
                setTimeout(() => {
                  const commentElement = document.getElementById(`comment-${commentId}`);
                  if (commentElement) {
                    commentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    // Add highlight styling
                    commentElement.style.backgroundColor = '#fef3c7';
                    commentElement.style.border = '2px solid #f59e0b';
                    commentElement.style.borderRadius = '8px';
                    setTimeout(() => {
                      commentElement.style.backgroundColor = '';
                      commentElement.style.border = '';
                      commentElement.style.borderRadius = '';
                    }, 3000);
                  }
                }, 1000);
              }
            }
          }
          break;
          
        case 'event_update':
        case 'payment_reminder':
        case 'result_posted':
        case 'event_reminder':
          if (eventType === 'tournament') {
            const tournament = tournaments.find(t => t.id === eventId);
            if (tournament) {
              handleEditTournament(tournament);
            }
          } else if (eventType === 'league') {
            const league = leagues.find(l => l.id === eventId);
            if (league) {
              handleEditLeague(league);
            }
          }
          break;
      }
    } catch (error) {
      console.error('Error in Dashboard navigation:', error);
    }
  }, [tournaments, leagues, handleViewTournament, handleViewLeague, handleEditTournament, handleEditLeague]);

  // Expose handler to parent via ref
  React.useImperativeHandle(ref, () => ({
    handleNotificationNavigation
  }), [handleNotificationNavigation]);

  // ADDED: Result deletion handlers (placed after showAlert is defined)
  const handleDeleteResult = useCallback(async (result) => {
    setDeleteLoading(true);
    try {
      await deleteResult(result.id);
      closeModal();
      showAlert('success', 'Result deleted!', 'The result has been successfully deleted');
    } catch (err) {
      showAlert('error', 'Failed to delete result', err.message);
    } finally {
      setDeleteLoading(false);
    }
  }, [deleteResult, closeModal, showAlert]);

  const handleDeleteTournamentResult = useCallback((tournament) => {
    const tournamentResult = results.tournament?.find(result => result.tournamentId === tournament.id);
    if (tournamentResult) {
      setModalData({ result: tournamentResult, tournament });
      setActiveModal(MODAL_TYPES.RESULT_DELETE_CONFIRM);
    }
  }, [results.tournament]);

  const handleDeleteLeagueResult = useCallback((league) => {
    const leagueResult = results.league?.find(result => result.leagueId === league.id);
    if (leagueResult) {
      setModalData({ result: leagueResult, league });
      setActiveModal(MODAL_TYPES.RESULT_DELETE_CONFIRM);
    }
  }, [results.league]);

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
                onViewPayments={handleViewTournamentPayments}
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
                      onViewPayments={handleViewTournamentPayments}
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
                onViewPayments={handleViewLeaguePayments}
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
                      onViewPayments={handleViewLeaguePayments}
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
      closeModal(); // Use unified modal close function
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
      closeModal(); // Use unified modal close function
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
      closeModal();
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
      
      closeModal();
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
      closeModal();
      showAlert('success', 'League deleted!', 'League has been successfully deleted');
    } catch (err) {
      showAlert('error', 'Failed to delete league', err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Member functions (fixed to use unified modal system)
  const handleCreateMember = async (memberData) => {
    setFormLoading(true);
    try {
      await addMember(memberData);
      closeModal();
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
      closeModal();
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
      closeModal();
      showAlert('success', 'Member deleted!', 'Member has been successfully deleted');
    } catch (err) {
      showAlert('error', 'Failed to delete member', err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Archive handlers
  const handleArchiveTournament = async (tournamentId) => {
    setDeleteLoading(true);
    try {
      await archiveTournament(tournamentId);
      closeModal();
      showAlert('success', 'Tournament archived!', 'Tournament has been moved to archive');
    } catch (err) {
      showAlert('error', 'Failed to archive tournament', err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleUnarchiveTournament = async (tournamentId) => {
    setDeleteLoading(true);
    try {
      await unarchiveTournament(tournamentId);
      closeModal();
      showAlert('success', 'Tournament restored!', 'Tournament has been restored from archive');
    } catch (err) {
      showAlert('error', 'Failed to restore tournament', err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleArchiveLeague = async (leagueId) => {
    setDeleteLoading(true);
    try {
      await archiveLeague(leagueId);
      closeModal();
      showAlert('success', 'League archived!', 'League has been moved to archive');
    } catch (err) {
      showAlert('error', 'Failed to archive league', err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleUnarchiveLeague = async (leagueId) => {
    setDeleteLoading(true);
    try {
      await unarchiveLeague(leagueId);
      closeModal();
      showAlert('success', 'League restored!', 'League has been restored from archive');
    } catch (err) {
      showAlert('error', 'Failed to restore league', err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  // ADDED: Results submission handlers
  const handleTournamentResultsSubmit = async (resultsData) => {
    setFormLoading(true);
    try {
      if (modalData.existingResults) {
        // Update existing results
        await updateTournamentResults(modalData.tournament.id, resultsData);
        showAlert('success', 'Results updated!', `Tournament results for ${modalData.tournament.name} have been updated`);
      } else {
        // Create new results
        await addTournamentResults(modalData.tournament.id, resultsData);
        
        // Update tournament status to completed
        await updateTournament(modalData.tournament.id, { 
          status: TOURNAMENT_STATUS.COMPLETED 
        });
        showAlert('success', 'Results saved!', `Tournament results for ${modalData.tournament.name} have been saved`);
      }
      
      closeModal();
    } catch (err) {
      showAlert('error', `Failed to ${modalData.existingResults ? 'update' : 'save'} results`, err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleLeagueResultsSubmit = async (resultsData) => {
    setFormLoading(true);
    try {
      if (modalData.existingResults) {
        // Update existing results
        await updateLeagueResults(modalData.league.id, resultsData);
        showAlert('success', 'Results updated!', `League results for ${modalData.league.name} have been updated`);
      } else {
        // Create new results
        await addLeagueResults(modalData.league.id, resultsData);
        
        // Update league status to completed
        await updateLeague(modalData.league.id, { 
          status: LEAGUE_STATUS.COMPLETED 
        });
        showAlert('success', 'Results saved!', `League results for ${modalData.league.name} have been saved`);
      }
      
      closeModal();
    } catch (err) {
      showAlert('error', `Failed to ${modalData.existingResults ? 'update' : 'save'} results`, err.message);
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

  // ADDED: Automatic status checking on dashboard load and data changes
  useEffect(() => {
    if (isAuthenticated && tournaments.length > 0) {
      console.log('Running automatic tournament status checks');
      checkAndUpdateAllTournamentStatuses();
    }
  }, [isAuthenticated, tournaments, checkAndUpdateAllTournamentStatuses]);

  useEffect(() => {
    if (isAuthenticated && leagues.length > 0) {
      console.log('Running automatic league status checks');
      checkAndUpdateAllLeagueStatuses();
    }
  }, [isAuthenticated, leagues, checkAndUpdateAllLeagueStatuses]);

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
    <>
      {/* Sticky Navigation - Outside container */}
      <StickyNavigation
        activeSection={activeSection}
        onNavigate={scrollToSection}
        navItems={filteredNavItems}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.1),rgba(255,255,255,0))] pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl transform translate-x-16 -translate-y-32 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-emerald-400/20 to-cyan-600/20 rounded-full blur-3xl transform -translate-x-16 translate-y-32 pointer-events-none"></div>
        <div className="relative">
        <DashboardStyles />
      
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
        <div className="mb-3">
          <h2 className="text-xl sm:text-3xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-600 text-sm sm:text-base mt-0.5">
            Welcome back, {currentUserMember?.firstName || user.email.split('@')[0]}!
          </p>
        </div>

        {/* Stats Cards - Extra Compact Mobile */}
        <div ref={refs.statsRef} className="grid grid-cols-2 lg:grid-cols-4 gap-1 lg:gap-6 mb-2 lg:mb-8">
          <div className="group relative bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 rounded-md lg:rounded-2xl shadow-md lg:shadow-lg hover:shadow-emerald-500/25 p-1.5 lg:p-5 text-center transform hover:-translate-y-1 transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="w-4 h-4 lg:w-12 lg:h-12 bg-white/20 backdrop-blur-sm rounded-sm lg:rounded-xl flex items-center justify-center mx-auto mb-0.5 lg:mb-3 group-hover:scale-110 transition-transform duration-300">
                <Trophy className="h-2.5 w-2.5 lg:h-6 lg:w-6 text-white" />
              </div>
              <div className="text-base lg:text-3xl font-black text-white mb-0 lg:mb-1">
                {tournaments.length}
              </div>
              <div className="text-xs lg:text-sm text-emerald-100 font-semibold">Tournaments</div>
            </div>
          </div>

          <div className="group relative bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-md lg:rounded-2xl shadow-md lg:shadow-lg hover:shadow-blue-500/25 p-1.5 lg:p-5 text-center transform hover:-translate-y-1 transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="w-4 h-4 lg:w-12 lg:h-12 bg-white/20 backdrop-blur-sm rounded-sm lg:rounded-xl flex items-center justify-center mx-auto mb-0.5 lg:mb-3 group-hover:scale-110 transition-transform duration-300">
                <Layers className="h-2.5 w-2.5 lg:h-6 lg:w-6 text-white" />
              </div>
              <div className="text-base lg:text-3xl font-black text-white mb-0 lg:mb-1">
                {tournaments.reduce((sum, t) => sum + (t.divisions?.length || 0), 0)}
              </div>
              <div className="text-xs lg:text-sm text-blue-100 font-semibold">Divisions</div>
            </div>
          </div>

          <div className="group relative bg-gradient-to-br from-purple-500 via-pink-500 to-rose-600 rounded-md lg:rounded-2xl shadow-md lg:shadow-lg hover:shadow-purple-500/25 p-1.5 lg:p-5 text-center transform hover:-translate-y-1 transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="w-4 h-4 lg:w-12 lg:h-12 bg-white/20 backdrop-blur-sm rounded-sm lg:rounded-xl flex items-center justify-center mx-auto mb-0.5 lg:mb-3 group-hover:scale-110 transition-transform duration-300">
                <Activity className="h-2.5 w-2.5 lg:h-6 lg:w-6 text-white" />
              </div>
              <div className="text-base lg:text-3xl font-black text-white mb-0 lg:mb-1">
                {leagues.filter(l => l.status === LEAGUE_STATUS.ACTIVE).length}
              </div>
              <div className="text-xs lg:text-sm text-purple-100 font-semibold">Active Leagues</div>
            </div>
          </div>

          <div className="group relative bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-600 rounded-md lg:rounded-2xl shadow-md lg:shadow-lg hover:shadow-orange-500/25 p-1.5 lg:p-5 text-center transform hover:-translate-y-1 transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="w-4 h-4 lg:w-12 lg:h-12 bg-white/20 backdrop-blur-sm rounded-sm lg:rounded-xl flex items-center justify-center mx-auto mb-0.5 lg:mb-3 group-hover:scale-110 transition-transform duration-300">
                <Users className="h-2.5 w-2.5 lg:h-6 lg:w-6 text-white" />
              </div>
              <div className="text-base lg:text-3xl font-black text-white mb-0 lg:mb-1">
                {members.length}
              </div>
              <div className="text-xs lg:text-sm text-orange-100 font-semibold">Members</div>
            </div>
          </div>
        </div>

        

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
          className="mb-4 sm:mb-8"
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
          className="mb-8 sm:mb-8 min-h-[400px]"
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
          className="mb-4 sm:mb-8"
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
          className="mb-4 sm:mb-8"
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
            title={editingTournament ? (isEditMode ? 'Edit Tournament' : 'Tournament Details') : 'Create New Tournament'}
            size="xl"
            headerAction={editingTournament ? (
              isEditMode ? (
                <>
                  {editingTournament.status === TOURNAMENT_STATUS.COMPLETED && (
                    <ModalHeaderButton
                      variant="outline"
                      onClick={() => {
                        setModalData({ tournament: editingTournament });
                        setActiveModal(MODAL_TYPES.ARCHIVE_TOURNAMENT_CONFIRM);
                      }}
                      disabled={formLoading || deleteLoading}
                      icon={<Activity className="h-4 w-4" />}
                    >
                      Archive
                    </ModalHeaderButton>
                  )}
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
              ) : (
                <>
                  <ModalHeaderButton
                    variant="outline"
                    onClick={closeModal}
                    disabled={formLoading || deleteLoading}
                    icon={<X className="h-4 w-4" />}
                  >
                    Close
                  </ModalHeaderButton>
                  <ModalHeaderButton
                    variant="primary"
                    onClick={handleEnterEditMode}
                    disabled={formLoading || deleteLoading}
                    icon={hasUnsavedChanges ? <CheckCircle className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
                  >
                    {hasUnsavedChanges ? 'Update Tournament' : 'Edit Tournament'}
                  </ModalHeaderButton>
                </>
              )
            ) : (
              <>
                <ModalHeaderButton
                  variant="outline"
                  onClick={closeModal}
                  disabled={formLoading || deleteLoading}
                  icon={<X className="h-4 w-4" />}
                >
                  Cancel
                </ModalHeaderButton>
                <ModalHeaderButton
                  variant="primary"
                  type="submit"
                  form="tournament-form"
                  loading={formLoading}
                  disabled={formLoading || deleteLoading}
                  icon={<CheckCircle className="h-4 w-4" />}
                >
                  Create Tournament
                </ModalHeaderButton>
              </>
            )}
          >
            <div className="space-y-6">
              <TournamentForm
              tournament={editingTournament}
              onSubmit={editingTournament ? handleUpdateTournament : handleCreateTournament}
              onCancel={closeModal}
              onUpdateTournament={updateTournament}
              onParticipantChange={handleTournamentParticipantChange}
              loading={formLoading}
              deleteLoading={deleteLoading}
              members={members}
              isReadOnly={editingTournament && !isEditMode}
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
            title={editingLeague ? (isEditMode ? 'Edit League' : 'League Details') : 'Create New League'}
            size="xl"
            headerAction={editingLeague ? (
              isEditMode ? (
                <>
                  {editingLeague.status === LEAGUE_STATUS.COMPLETED && (
                    <ModalHeaderButton
                      variant="outline"
                      onClick={() => {
                        setModalData({ league: editingLeague });
                        setActiveModal(MODAL_TYPES.ARCHIVE_LEAGUE_CONFIRM);
                      }}
                      disabled={formLoading || deleteLoading}
                      icon={<Activity className="h-4 w-4" />}
                    >
                      Archive
                    </ModalHeaderButton>
                  )}
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
              ) : (
                <>
                  <ModalHeaderButton
                    variant="outline"
                    onClick={closeModal}
                    disabled={formLoading || deleteLoading}
                    icon={<X className="h-4 w-4" />}
                  >
                    Close
                  </ModalHeaderButton>
                  <ModalHeaderButton
                    variant="primary"
                    onClick={handleEnterEditMode}
                    disabled={formLoading || deleteLoading}
                    icon={hasUnsavedChanges ? <CheckCircle className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
                  >
                    {hasUnsavedChanges ? 'Update League' : 'Edit League'}
                  </ModalHeaderButton>
                </>
              )
            ) : (
              <>
                <ModalHeaderButton
                  variant="outline"
                  onClick={closeModal}
                  disabled={formLoading || deleteLoading}
                  icon={<X className="h-4 w-4" />}
                >
                  Cancel
                </ModalHeaderButton>
                <ModalHeaderButton
                  variant="primary"
                  type="submit"
                  form="league-form"
                  loading={formLoading}
                  disabled={formLoading || deleteLoading}
                  icon={<CheckCircle className="h-4 w-4" />}
                >
                  Create League
                </ModalHeaderButton>
              </>
            )}
          >
            <div className="space-y-0">
              <LeagueForm
                league={editingLeague}
                onSubmit={editingLeague ? handleUpdateLeague : handleCreateLeague}
                onCancel={closeModal}
                loading={formLoading}
                deleteLoading={deleteLoading}
                isReadOnly={editingLeague && !isEditMode}
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
                      onSelectionChange={handleLeagueMemberChange}
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
            size="xl"
            headerAction={editingMember ? (
              <>
                <ModalHeaderButton
                  variant="danger"
                  onClick={() => {
                    setModalData({ member: editingMember });
                    setActiveModal(MODAL_TYPES.MEMBER_DELETE_CONFIRM);
                  }}
                  disabled={formLoading || deleteLoading}
                  icon={<Trash2 className="h-4 w-4" />}
                >
                  Delete
                </ModalHeaderButton>
                <ModalHeaderButton
                  variant="primary"
                  type="submit"
                  form="member-form"
                  loading={formLoading}
                  disabled={formLoading || deleteLoading}
                  icon={<CheckCircle className="h-4 w-4" />}
                >
                  Update Member
                </ModalHeaderButton>
              </>
            ) : (
              <>
                <ModalHeaderButton
                  variant="outline"
                  onClick={closeModal}
                  disabled={formLoading || deleteLoading}
                  icon={<X className="h-4 w-4" />}
                >
                  Cancel
                </ModalHeaderButton>
                <ModalHeaderButton
                  variant="primary"
                  type="submit"
                  form="member-form"
                  loading={formLoading}
                  disabled={formLoading || deleteLoading}
                  icon={<CheckCircle className="h-4 w-4" />}
                >
                  Add Member
                </ModalHeaderButton>
              </>
            )}
          >
            <MemberForm
              member={editingMember}
              onSubmit={editingMember ? handleUpdateMember : handleCreateMember}
              onCancel={closeModal}
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
            title={`${modalData.existingResults ? 'Edit' : 'Enter'} Results: ${modalData.tournament.name || 'Tournament'}`}
            size="xl"
          >
            <TournamentResultsForm
              tournament={modalData.tournament}
              members={members}
              onSubmit={handleTournamentResultsSubmit}
              onCancel={closeModal}
              isLoading={formLoading}
              existingResults={modalData.existingResults}
            />
          </Modal>
        )}

        {/* League Results Entry Modal */}
        {activeModal === MODAL_TYPES.LEAGUE_RESULTS_FORM && modalData?.league && (
          <Modal
            isOpen={true}
            onClose={closeModal}
            title={`${modalData.existingResults ? 'Edit' : 'Enter'} Results: ${modalData.league.name || 'League'}`}
            size="xl"
          >
            <LeagueResultsForm
              league={modalData.league}
              members={members}
              onSubmit={handleLeagueResultsSubmit}
              onCancel={closeModal}
              loading={formLoading}
              existingResults={modalData.existingResults}
            />
          </Modal>
        )}

        {/* Results View Modal - FIXED: Remove double modal wrapper */}
        {activeModal === MODAL_TYPES.RESULTS_VIEW && modalData && modalData.results && (
          <ResultsCard 
            result={modalData.results}
            onClose={closeModal}
            showPlayerPerformance={true}
            allowEdit={true}
            onEdit={(result) => {
              // Handle edit functionality based on result type
              if (result.type === 'tournament') {
                const tournament = tournaments.find(t => t.id === result.tournamentId);
                if (tournament) {
                  setModalData({ tournament, existingResults: result });
                  setActiveModal(MODAL_TYPES.TOURNAMENT_RESULTS_FORM);
                }
              } else if (result.type === 'league') {
                const league = leagues.find(l => l.id === result.leagueId);
                if (league) {
                  setModalData({ league, existingResults: result });
                  setActiveModal(MODAL_TYPES.LEAGUE_RESULTS_FORM);
                }
              }
            }}
            onDelete={modalData.type === 'tournament' ? 
              () => handleDeleteTournamentResult(modalData.event) : 
              () => handleDeleteLeagueResult(modalData.event)
            }
          />
        )}

        {/* No Results Found - Show in regular modal */}
        {activeModal === MODAL_TYPES.RESULTS_VIEW && modalData && !modalData.results && (
          <Modal
            isOpen={true}
            onClose={closeModal}
            title={`Results: ${modalData.event?.name || 'Event'}`}
            size="xl"
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

        {activeModal === MODAL_TYPES.MEMBER_DELETE_CONFIRM && modalData?.member && (
          <ConfirmDialog
            isOpen={true}
            onClose={() => setActiveModal(MODAL_TYPES.MEMBER_FORM)}
            onConfirm={() => {
              handleDeleteMember(modalData.member.id);
            }}
            title="Delete Member"
            message={`Are you sure you want to delete "${modalData.member.firstName} ${modalData.member.lastName}"? This action cannot be undone and will remove all their data including tournament registrations and payment information.`}
            confirmText="Delete Member"
            cancelText="Keep Member"
            type="danger"
            loading={deleteLoading}
          />
        )}

        {/* Result Delete Confirmation */}
        {activeModal === MODAL_TYPES.RESULT_DELETE_CONFIRM && modalData?.result && (
          <ConfirmDialog
            isOpen={true}
            onClose={() => setActiveModal(MODAL_TYPES.RESULTS_VIEW)}
            onConfirm={() => {
              handleDeleteResult(modalData.result);
            }}
            title="Delete Result"
            message={`Are you sure you want to delete the results for "${modalData.tournament?.name || modalData.league?.name}"? This action cannot be undone and will permanently remove all standings and performance data.`}
            confirmText="Delete Result"
            cancelText="Keep Result"
            type="danger"
            loading={deleteLoading}
          />
        )}

        {/* Archive Tournament Confirmation */}
        {activeModal === MODAL_TYPES.ARCHIVE_TOURNAMENT_CONFIRM && modalData?.tournament && (
          <ConfirmDialog
            isOpen={true}
            onClose={closeModal}
            onConfirm={() => {
              handleArchiveTournament(modalData.tournament.id);
            }}
            title="Archive Tournament"
            message={`Are you sure you want to archive "${modalData.tournament.name}"? The tournament will be hidden from the main list but can be restored later. All results and data will be preserved.`}
            confirmText="Archive Tournament"
            cancelText="Keep Active"
            type="warning"
            loading={deleteLoading}
          />
        )}

        {/* Unarchive Tournament Confirmation */}
        {activeModal === MODAL_TYPES.UNARCHIVE_TOURNAMENT_CONFIRM && modalData?.tournament && (
          <ConfirmDialog
            isOpen={true}
            onClose={closeModal}
            onConfirm={() => {
              handleUnarchiveTournament(modalData.tournament.id);
            }}
            title="Restore Tournament"
            message={`Are you sure you want to restore "${modalData.tournament.name}" from the archive? It will appear back in the main tournaments list.`}
            confirmText="Restore Tournament"
            cancelText="Keep Archived"
            type="warning"
            loading={deleteLoading}
          />
        )}

        {/* Archive League Confirmation */}
        {activeModal === MODAL_TYPES.ARCHIVE_LEAGUE_CONFIRM && modalData?.league && (
          <ConfirmDialog
            isOpen={true}
            onClose={closeModal}
            onConfirm={() => {
              handleArchiveLeague(modalData.league.id);
            }}
            title="Archive League"
            message={`Are you sure you want to archive "${modalData.league.name}"? The league will be hidden from the main list but can be restored later. All results and data will be preserved.`}
            confirmText="Archive League"
            cancelText="Keep Active"
            type="warning"
            loading={deleteLoading}
          />
        )}

        {/* Unarchive League Confirmation */}
        {activeModal === MODAL_TYPES.UNARCHIVE_LEAGUE_CONFIRM && modalData?.league && (
          <ConfirmDialog
            isOpen={true}
            onClose={closeModal}
            onConfirm={() => {
              handleUnarchiveLeague(modalData.league.id);
            }}
            title="Restore League"
            message={`Are you sure you want to restore "${modalData.league.name}" from the archive? It will appear back in the main leagues list.`}
            confirmText="Restore League"
            cancelText="Keep Archived"
            type="warning"
            loading={deleteLoading}
          />
        )}

        {/* Archived Items Modal */}
        {activeModal === MODAL_TYPES.ARCHIVED_ITEMS && (
          <Modal
            isOpen={true}
            onClose={closeModal}
            title="Archived Events"
            size="xl"
          >
            <div className="space-y-6 p-6">
              {/* Archive Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <Clock className="h-5 w-5 text-blue-600 mr-2" />
                  <h3 className="text-lg font-semibold text-blue-900">Archive Overview</h3>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{archivedTournaments.length}</div>
                    <div className="text-sm text-blue-700">Archived Tournaments</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{archivedLeagues.length}</div>
                    <div className="text-sm text-blue-700">Archived Leagues</div>
                  </div>
                </div>
              </div>

              {/* Archived Tournaments */}
              {archivedTournaments.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Trophy className="h-5 w-5 text-yellow-600 mr-2" />
                    Archived Tournaments
                  </h3>
                  <div className="space-y-3">
                    {archivedTournaments.map((tournament) => (
                      <div key={tournament.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{tournament.name}</h4>
                            <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                              <span className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {tournament.eventDate 
                                  ? new Date(tournament.eventDate.seconds * 1000).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric'
                                    })
                                  : 'TBD'
                                }
                              </span>
                              <span className="flex items-center">
                                <MapPin className="h-3 w-3 mr-1" />
                                {tournament.location || 'No location'}
                              </span>
                              <span className="flex items-center">
                                <Users className="h-3 w-3 mr-1" />
                                {getTournamentTotalParticipants(tournament)} participants
                              </span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setModalData({ tournament });
                                setActiveModal(MODAL_TYPES.UNARCHIVE_TOURNAMENT_CONFIRM);
                              }}
                              disabled={deleteLoading}
                            >
                              <Activity className="h-4 w-4 mr-1" />
                              Restore
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingTournament(tournament);
                                setModalData({ tournament });
                                setActiveModal(MODAL_TYPES.TOURNAMENT_FORM);
                              }}
                            >
                              <Trophy className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Archived Leagues */}
              {archivedLeagues.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Activity className="h-5 w-5 text-blue-600 mr-2" />
                    Archived Leagues
                  </h3>
                  <div className="space-y-3">
                    {archivedLeagues.map((league) => (
                      <div key={league.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{league.name}</h4>
                            <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                              <span className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {league.startDate && league.endDate
                                  ? `${new Date(league.startDate.seconds * 1000).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric'
                                    })} - ${new Date(league.endDate.seconds * 1000).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric'
                                    })}`
                                  : 'TBD'
                                }
                              </span>
                              <span className="flex items-center">
                                <MapPin className="h-3 w-3 mr-1" />
                                {league.location || 'No location'}
                              </span>
                              <span className="flex items-center">
                                <Users className="h-3 w-3 mr-1" />
                                {league.participants?.length || 0} members
                              </span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setModalData({ league });
                                setActiveModal(MODAL_TYPES.UNARCHIVE_LEAGUE_CONFIRM);
                              }}
                              disabled={deleteLoading}
                            >
                              <Activity className="h-4 w-4 mr-1" />
                              Restore
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingLeague(league);
                                setSelectedLeagueMembers(league.participants || []);
                                setModalData({ league });
                                setActiveModal(MODAL_TYPES.LEAGUE_FORM);
                              }}
                            >
                              <Activity className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {archivedTournaments.length === 0 && archivedLeagues.length === 0 && (
                <div className="text-center py-12">
                  <Clock className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-700 mb-2">No Archived Events</h3>
                  <p className="text-gray-500">
                    When you archive completed tournaments or leagues, they will appear here.
                  </p>
                </div>
              )}
            </div>
          </Modal>
        )}

        {/* Payment Modal */}
        {activeModal === MODAL_TYPES.PAYMENT_TRACKER && (
          <PaymentTracker
            isOpen={true}
            onClose={closeModal}
            tournaments={activeTournaments}
            leagues={activeLeagues}
            members={members}
            onUpdateTournament={updateTournament}
            onUpdateLeague={updateLeague}
            currentUserId={user?.uid}
            initialTargetEvent={modalData?.targetEvent}
          />
        )}

        
      </div>
      </div>
      
      {/* Floating Action Menu - Desktop Only */}
      <div className="hidden sm:block">
        <FloatingActionMenu 
          onCreateMember={() => setActiveModal(MODAL_TYPES.MEMBER_FORM)}
          onCreateTournament={() => setActiveModal(MODAL_TYPES.TOURNAMENT_FORM)}
          onCreateLeague={() => setActiveModal(MODAL_TYPES.LEAGUE_FORM)}
          onViewPayments={() => setActiveModal(MODAL_TYPES.PAYMENT_TRACKER)}
          onViewArchive={() => setActiveModal(MODAL_TYPES.ARCHIVED_ITEMS)}
        />
      </div>
      </div>
    </>
  );
});

Dashboard.displayName = 'Dashboard';

export default Dashboard;