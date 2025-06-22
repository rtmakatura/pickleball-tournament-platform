// src/components/Dashboard.jsx (RESPONSIVE DESIGN - Mobile + Desktop Optimized)
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
  ChevronRight,
  MoreVertical,
  Phone,
  Mail,
  Star,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { 
  useMembers, 
  useLeagues, 
  useTournaments, 
  useAuth, 
  useNotificationBadge 
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
import { NotificationBadge, NotificationCenter } from './notifications';
import StickyNavigation from './StickyNavigation';

// Import our UI components
import { 
  Button, 
  Modal, 
  Card, 
  TableActions, 
  Alert 
} from './ui';
import TournamentForm from './tournament/TournamentForm';
import DivisionMemberSelector from './tournament/DivisionMemberSelector';
import PaymentStatus from './tournament/PaymentStatus';
import { MemberForm } from './member';
import { LeagueForm, LeagueMemberSelector } from './league';
import { SignUpForm } from './auth';
import SignInForm from './auth/SignInForm';
import { ResultsButton } from './results';
import { CommentSection } from './comments';

// CSS for responsive optimizations
const dashboardStyles = `
  /* Mobile card optimizations */
  .mobile-card {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  
  .mobile-card:active {
    transform: scale(0.98);
  }
  
  @media (max-width: 768px) {
    .touch-target {
      min-height: 44px;
      min-width: 44px;
    }
    
    .mobile-action-button {
      min-height: 48px;
      min-width: 120px;
    }
  }
  
  /* Desktop table optimizations */
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
    
    .table-actions {
      opacity: 1 !important;
      transition: none !important;
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
`;

const DashboardStyles = () => (
  <style dangerouslySetInnerHTML={{ __html: dashboardStyles }} />
);

// Mobile-First Tournament Card Component (for mobile only)
const TournamentCard = React.memo(({ tournament, onView, onEdit }) => {
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

  return (
    <div className="mobile-card bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Card Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {tournament.name}
            </h3>
            <div className="flex items-center space-x-2 mt-1">
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

        {/* Quick Info Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center text-gray-600">
            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
            <span>{formatDate(tournament.eventDate)}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <Users className="h-4 w-4 mr-2 text-gray-400" />
            <span>{totalParticipants} people</span>
          </div>
          {tournament.location && (
            <div className="col-span-2 flex items-center text-gray-600">
              <MapPin className="h-4 w-4 mr-2 text-gray-400" />
              <span className="truncate">{tournament.location}</span>
            </div>
          )}
        </div>

        {/* Expected Revenue */}
        {totalExpected > 0 && (
          <div className="mt-3 flex items-center justify-between p-2 bg-green-50 rounded-lg">
            <span className="text-sm text-green-700">Expected Revenue</span>
            <span className="text-lg font-semibold text-green-800">${totalExpected}</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="px-4 pb-4 flex space-x-2">
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onView(tournament);
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
            onEdit(tournament);
          }}
          variant="outline"
          className="mobile-action-button flex-1"
          size="md"
        >
          <Trophy className="h-4 w-4 mr-2" />
          Manage
        </Button>
      </div>

      {/* Quick Actions Bar */}
      {tournament.location && (
        <div className="border-t border-gray-100 px-4 py-2 bg-gray-50">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">Quick Actions</span>
            <div className="flex space-x-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openLinkSafely(generateGoogleMapsLink(tournament.location));
                }}
                className="touch-target p-2 rounded-md hover:bg-gray-200 transition-colors"
                title="View on Maps"
              >
                <MapPin className="h-3 w-3 text-gray-500" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openLinkSafely(generateDirectionsLink(tournament.location));
                }}
                className="touch-target p-2 rounded-md hover:bg-gray-200 transition-colors"
                title="Directions"
              >
                <Navigation className="h-3 w-3 text-gray-500" />
              </button>
              {tournament.website && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openLinkSafely(tournament.website);
                  }}
                  className="touch-target p-2 rounded-md hover:bg-gray-200 transition-colors"
                  title="Website"
                >
                  <ExternalLink className="h-3 w-3 text-gray-500" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

// Desktop Tournament Row Component (for desktop tables)
const TournamentRow = React.memo(({ tournament, onView, onEdit }) => {
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

  return (
    <tr key={tournament.id} className="tournament-row">
      {/* Name Column */}
      <td className="py-4 px-4 align-top">
        <div className="space-y-2">
          <div className="font-medium text-gray-900 leading-5 break-words">
            {tournament.name}
          </div>
          
          {/* Quick indicators */}
          <div className="flex items-center space-x-4 text-xs">
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

      {/* Actions Column */}
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
        </div>
      </td>
    </tr>
  );
});

// League Card Component (mobile only)
const LeagueCard = React.memo(({ league, onView, onEdit }) => {
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

  return (
    <div className="mobile-card bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Card Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {league.name}
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(league.status)}`}>
                {league.status.replace('_', ' ')}
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 capitalize">
                {league.skillLevel}
              </span>
            </div>
          </div>
        </div>

        {/* League Info */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center text-gray-600">
            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
            <span>{formatDateRange(league.startDate, league.endDate)}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center text-gray-600">
              <Users className="h-4 w-4 mr-2 text-gray-400" />
              <span>{participantCount} member{participantCount !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <Trophy className="h-4 w-4 mr-2 text-gray-400" />
              <span>{formatEventType(league.eventType)}</span>
            </div>
          </div>
          {league.location && (
            <div className="flex items-center text-gray-600">
              <MapPin className="h-4 w-4 mr-2 text-gray-400" />
              <span className="truncate">{league.location}</span>
            </div>
          )}
        </div>

        {/* Registration Fee */}
        {league.registrationFee > 0 && (
          <div className="mt-3 flex items-center justify-between p-2 bg-green-50 rounded-lg">
            <span className="text-sm text-green-700">Registration Fee</span>
            <span className="text-lg font-semibold text-green-800">${league.registrationFee}</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="px-4 pb-4 flex space-x-2">
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
    </div>
  );
});

// Desktop League Row Component (for desktop tables)
const LeagueRow = React.memo(({ league, onView, onEdit }) => {
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
        </div>
      </td>
    </tr>
  );
});

// Member Card Component (for mobile)
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
              <div className="flex items-center space-x-2 mt-1">
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
              <span>{member.phoneNumber}</span>
            </div>
          )}
          {member.venmoHandle && (
            <div className="flex items-center text-gray-600">
              <DollarSign className="h-3 w-3 mr-2 text-gray-400" />
              <span>@{member.venmoHandle}</span>
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

// Dashboard Header Component
const DashboardHeader = React.memo(({ currentUserMember, user, onNotificationClick, onLogout }) => {
  const {
    count,
    hasHighPriority,
    shouldAnimate,
    ariaLabel
  } = useNotificationBadge({
    debounceMs: 500,
    enableSound: false
  });

  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 space-y-4 sm:space-y-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Welcome back, {currentUserMember?.firstName || user.email.split('@')[0]}!
        </p>
      </div>
      <div className="flex items-center space-x-3 sm:space-x-4">
        <NotificationBadge
          count={count}
          hasHighPriority={hasHighPriority}
          onClick={onNotificationClick}
          animate={shouldAnimate}
          aria-label={ariaLabel}
          className="touch-target"
        />
        
        <Button 
          variant="outline" 
          onClick={onLogout}
          className="touch-target"
          size="md"
        >
          Logout
        </Button>
      </div>
    </div>
  );
});

const Dashboard = () => {
  const { user, signIn, signUpWithProfile, logout, isAuthenticated, loading: authLoading } = useAuth();
  const { members, loading: membersLoading, addMember, updateMember, deleteMember } = useMembers({ realTime: false });
  const { leagues, loading: leaguesLoading, addLeague, updateLeague, deleteLeague } = useLeagues({ realTime: false });
  const { tournaments, loading: tournamentsLoading, addTournament, updateTournament, deleteTournament } = useTournaments({ realTime: false });

  // Smooth navigation hook
  const { activeSection, scrollToSection, navItems, refs } = useSmoothNavigation();

  // Modal states
  const [showTournamentModal, setShowTournamentModal] = useState(false);
  const [showLeagueModal, setShowLeagueModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showTournamentDetailModal, setShowTournamentDetailModal] = useState(false);
  const [showLeagueDetailModal, setShowLeagueDetailModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  
  // Enhanced tournament state management
  const [editingTournament, setEditingTournament] = useState(null);
  const [editingLeague, setEditingLeague] = useState(null);
  const [editingMember, setEditingMember] = useState(null);
  const [viewingTournament, setViewingTournament] = useState(null);
  const [viewingLeague, setViewingLeague] = useState(null);
  
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
  const [formLoading, setFormLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [alert, setAlert] = useState(null);

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

  // Event handlers (keeping all existing handlers)
  const handleViewTournament = useCallback((tournament) => {
    console.log('Viewing tournament:', tournament);
    setViewingTournament(tournament);
    setShowTournamentDetailModal(true);
  }, []);

  const handleViewLeague = useCallback((league) => {
    console.log('Viewing league:', league);
    setViewingLeague(league);
    setShowLeagueDetailModal(true);
  }, []);

  const handleEditTournament = useCallback((tournament) => {
    console.log('Editing tournament:', tournament);
    const latestTournament = tournaments.find(t => t.id === tournament.id) || tournament;
    setEditingTournament(latestTournament);
    setShowTournamentModal(true);
  }, [tournaments]);

  const handleEditLeague = useCallback((league) => {
    console.log('Editing league:', league);
    setEditingLeague(league);
    setSelectedLeagueMembers(league.participants || []);
    setShowLeagueModal(true);
  }, []);

  const handleEditMember = useCallback((member) => {
    console.log('Editing member:', member);
    setEditingMember(member);
    setShowMemberModal(true);
  }, []);

  // Handle notification navigation
  const handleNotificationNavigation = useCallback((notification) => {
    const { eventId, eventType, commentId } = notification.data || {};
    
    if (eventType === 'tournament') {
      const tournament = tournaments.find(t => t.id === eventId);
      if (tournament) {
        setViewingTournament(tournament);
        setShowTournamentDetailModal(true);
      }
    } else if (eventType === 'league') {
      const league = leagues.find(l => l.id === eventId);
      if (league) {
        setViewingLeague(league);
        setShowLeagueDetailModal(true);
      }
    }
    
    setShowNotificationModal(false);
  }, [tournaments, leagues]);

  // Sorting functions
  const getSortedTournaments = useCallback(() => {
    return [...tournaments].sort((a, b) => {
      const dateA = a.eventDate ? (a.eventDate.seconds ? new Date(a.eventDate.seconds * 1000) : new Date(a.eventDate)) : new Date('2099-12-31');
      const dateB = b.eventDate ? (b.eventDate.seconds ? new Date(b.eventDate.seconds * 1000) : new Date(b.eventDate)) : new Date('2099-12-31');
      
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA - dateB;
      }
      
      const createdA = a.createdAt ? (a.createdAt.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(a.createdAt)) : new Date(0);
      const createdB = b.createdAt ? (b.createdAt.seconds ? new Date(b.createdAt.seconds * 1000) : new Date(b.createdAt)) : new Date(0);
      
      return createdB - createdA;
    });
  }, [tournaments]);

  const getSortedLeagues = useCallback(() => {
    return [...leagues].sort((a, b) => {
      const dateA = a.startDate ? (a.startDate.seconds ? new Date(a.startDate.seconds * 1000) : new Date(a.startDate)) : new Date('2099-12-31');
      const dateB = b.startDate ? (b.startDate.seconds ? new Date(b.startDate.seconds * 1000) : new Date(b.startDate)) : new Date('2099-12-31');
      
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA - dateB;
      }
      
      const createdA = a.createdAt ? (a.createdAt.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(a.createdAt)) : new Date(0);
      const createdB = b.createdAt ? (b.createdAt.seconds ? new Date(b.createdAt.seconds * 1000) : new Date(b.createdAt)) : new Date(0);
      
      return createdB - createdA;
    });
  }, [leagues]);

  const sortedTournaments = useMemo(() => getSortedTournaments(), [getSortedTournaments]);
  const sortedLeagues = useMemo(() => getSortedLeagues(), [getSortedLeagues]);

  // Show alert message
  const showAlert = useCallback((type, title, message) => {
    console.log(`Alert: ${type} - ${title}: ${message}`);
    setAlert({ type, title, message });
    setTimeout(() => setAlert(null), 5000);
  }, []);

  // RESPONSIVE COMPONENTS: Show cards on mobile, tables on desktop
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
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm uppercase tracking-wider w-[30%]">
                      Tournament
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm uppercase tracking-wider w-[20%]">
                      Date & Divisions
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm uppercase tracking-wider w-[25%]">
                      Location
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm uppercase tracking-wider w-[15%]">
                      Status
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700 text-sm uppercase tracking-wider w-[10%]">
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
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm uppercase tracking-wider w-[30%]">
                      League
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm uppercase tracking-wider w-[20%]">
                      Duration & Details
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm uppercase tracking-wider w-[25%]">
                      Location
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm uppercase tracking-wider w-[15%]">
                      Status
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700 text-sm uppercase tracking-wider w-[10%]">
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

  // Modal close handlers
  const handleTournamentModalClose = useCallback(() => {
    if (!formLoading && !deleteLoading) {
      setShowTournamentModal(false);
      setEditingTournament(null);
    }
  }, [formLoading, deleteLoading]);

  const handleLeagueModalClose = useCallback(() => {
    if (!formLoading && !deleteLoading) {
      setShowLeagueModal(false);
      setEditingLeague(null);
      setSelectedLeagueMembers([]);
    }
  }, [formLoading, deleteLoading]);

  const handleMemberModalClose = useCallback(() => {
    if (!formLoading && !deleteLoading) {
      setShowMemberModal(false);
      setEditingMember(null);
    }
  }, [formLoading, deleteLoading]);

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
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
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

        {/* Sticky Navigation */}
        <StickyNavigation 
          activeSection={activeSection}
          onNavigate={scrollToSection}
          navItems={navItems}
        />

        {/* Header */}
        <DashboardHeader 
          currentUserMember={currentUserMember}
          user={user}
          onNotificationClick={() => setShowNotificationModal(true)}
          onLogout={logout}
        />

        {/* Stats Cards - Responsive Grid */}
        <div ref={refs.statsRef} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
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
        <Card ref={refs.actionsRef} title="Quick Actions" className="mb-6 sm:mb-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Button 
              variant="outline" 
              onClick={() => setShowMemberModal(true)}
              className={`${isMobile ? 'mobile-action-button h-16 flex-col' : 'h-16'}`}
              size="md"
            >
              <Users className="h-5 w-5 mb-2" />
              <span className="text-xs sm:text-sm">Add Member</span>
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => setShowTournamentModal(true)}
              className={`${isMobile ? 'mobile-action-button h-16 flex-col' : 'h-16'}`}
              size="md"
            >
              <Trophy className="h-5 w-5 mb-2" />
              <span className="text-xs sm:text-sm">New Tournament</span>
            </Button>

            <Button 
              variant="outline" 
              onClick={() => setShowLeagueModal(true)}
              className={`${isMobile ? 'mobile-action-button h-16 flex-col' : 'h-16'}`}
              size="md"
            >
              <Activity className="h-5 w-5 mb-2" />
              <span className="text-xs sm:text-sm">New League</span>
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => setShowPaymentModal(true)}
              className={`${isMobile ? 'mobile-action-button h-16 flex-col' : 'h-16'}`}
              size="md"
            >
              <DollarSign className="h-5 w-5 mb-2" />
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
              onClick={() => setShowTournamentModal(true)}
              className="touch-target"
              size="md"
            >
              <Plus className="h-4 w-4 mr-2" />
              New
            </Button>
          ]}
          className="mb-6 sm:mb-8"
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
              onClick={() => setShowLeagueModal(true)}
              className="touch-target"
              size="md"
            >
              <Plus className="h-4 w-4 mr-2" />
              New
            </Button>
          ]}
          className="mb-6 sm:mb-8"
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
              onClick={() => setShowMemberModal(true)}
              className="touch-target"
              size="md"
            >
              <Plus className="h-4 w-4 mr-2" />
              New
            </Button>
          ]}
          className="mb-6 sm:mb-8"
        >
          <ResponsiveMemberList 
            data={members}
            visibleCount={visibleMembers}
            onLoadMore={() => setVisibleMembers(prev => prev + 8)}
            hasMore={members.length > visibleMembers}
          />
        </Card>

        {/* All existing modals remain the same... */}
        {/* Notification Modal */}
        {showNotificationModal && (
          <NotificationCenter
            isModal={true}
            onClose={() => setShowNotificationModal(false)}
            onNavigate={handleNotificationNavigation}
          />
        )}

        {/* Tournament Modal */}
        <Modal
          isOpen={showTournamentModal}
          onClose={handleTournamentModalClose}
          title={editingTournament ? 'Edit Tournament' : 'Create New Tournament'}
          size="xl"
        >
          <div className="space-y-6">
            <TournamentForm
              tournament={editingTournament}
              onSubmit={editingTournament ? handleUpdateTournament : handleCreateTournament}
              onCancel={handleTournamentModalClose}
              onDelete={editingTournament ? handleDeleteTournament : null}
              onUpdateTournament={updateTournament}
              loading={formLoading}
              deleteLoading={deleteLoading}
            />
            
            {editingTournament && editingTournament.divisions && editingTournament.divisions.length > 0 && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Manage Division Participants
                </h3>
                <DivisionMemberSelector
                  tournament={editingTournament}
                  members={members}
                  onDivisionParticipantsChange={(divisionId, participants) => {
                    if (!editingTournament) return;
                    
                    const updatedDivisions = editingTournament.divisions.map(division => 
                      division.id === divisionId 
                        ? { ...division, participants }
                        : division
                    );
                    
                    setEditingTournament(prev => ({
                      ...prev,
                      divisions: updatedDivisions
                    }));
                  }}
                  loading={membersLoading}
                />
              </div>
            )}
          </div>
        </Modal>

        {/* Tournament Detail Modal */}
        <Modal
          isOpen={showTournamentDetailModal}
          onClose={() => {
            setShowTournamentDetailModal(false);
            setViewingTournament(null);
          }}
          title={viewingTournament?.name || 'Tournament Discussion'}
          size="xl"
        >
          {viewingTournament && (
            <CommentSection
              eventId={viewingTournament.id}
              eventType="tournament"
              event={viewingTournament}
            />
          )}
        </Modal>

        {/* League Modal */}
        <Modal
          isOpen={showLeagueModal}
          onClose={handleLeagueModalClose}
          title={editingLeague ? 'Edit League' : 'Create New League'}
          size="lg"
        >
          <div className="space-y-6">
            <LeagueForm
              league={editingLeague}
              onSubmit={editingLeague ? handleUpdateLeague : handleCreateLeague}
              onCancel={handleLeagueModalClose}
              onDelete={editingLeague ? handleDeleteLeague : null}
              loading={formLoading}
              deleteLoading={deleteLoading}
            />
            
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Select League Members
              </h3>
              <LeagueMemberSelector
                members={members}
                selectedMembers={selectedLeagueMembers}
                onSelectionChange={setSelectedLeagueMembers}
                loading={membersLoading}
              />
            </div>
          </div>
        </Modal>

        {/* League Detail Modal */}
        <Modal
          isOpen={showLeagueDetailModal}
          onClose={() => {
            setShowLeagueDetailModal(false);
            setViewingLeague(null);
          }}
          title={viewingLeague?.name || 'League Discussion'}
          size="xl"
        >
          {viewingLeague && (
            <CommentSection
              eventId={viewingLeague.id}
              eventType="league"
              event={viewingLeague}
            />
          )}
        </Modal>

        {/* Member Modal */}
        <Modal
          isOpen={showMemberModal}
          onClose={handleMemberModalClose}
          title={editingMember ? 'Edit Member' : 'Add New Member'}
          size="lg"
        >
          <MemberForm
            member={editingMember}
            onSubmit={editingMember ? handleUpdateMember : handleCreateMember}
            onCancel={handleMemberModalClose}
            onDelete={editingMember ? handleDeleteMember : null}
            loading={formLoading}
            deleteLoading={deleteLoading}
          />
        </Modal>

        {/* Payment Modal - keeping the existing implementation */}
        <Modal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
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

            {/* Rest of payment modal content - keeping existing implementation */}
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
      </div>
    </div>
  );
};

export default Dashboard;