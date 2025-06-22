// src/components/Dashboard.jsx (FIXED - Tournament Update & Modal State Issues)
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
  Layers
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

// CSS for preventing flickering and stabilizing animations
const dashboardStyles = `
  .tournament-row, .league-row {
    transition: background-color 0.15s ease;
  }
  
  .tournament-row:hover, .league-row:hover {
    background-color: rgb(249 250 251) !important;
  }
  
  .notification-badge {
    transition: none !important;
  }
  
  button {
    transition: background-color 0.15s ease, color 0.15s ease;
  }
  
  /* Prevent table flickering */
  .enhanced-table {
    table-layout: fixed;
  }
  
  /* Stabilize hover states */
  .table-actions {
    opacity: 1 !important;
    transition: none !important;
  }
`;

const DashboardStyles = () => (
  <style dangerouslySetInnerHTML={{ __html: dashboardStyles }} />
);

// Memoized Tournament Row Component
const TournamentRow = React.memo(({ tournament, onView, onEdit }) => {
  const totalParticipants = getTournamentTotalParticipants(tournament);
  const totalExpected = getTournamentTotalExpected(tournament);
  const divisionCount = tournament.divisions?.length || 0;
  
  // Helper function to get registration deadline text
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
          
          {/* Mobile-only: Key info */}
          <div className="sm:hidden space-y-1">
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
              <span>
                {tournament.eventDate ? new Date(tournament.eventDate.seconds * 1000).toLocaleDateString() : 'TBD'}
              </span>
            </div>
            {divisionCount > 0 && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center text-gray-600">
                  <Layers className="h-3.5 w-3.5 mr-1.5" />
                  <span>{divisionCount} division{divisionCount !== 1 ? 's' : ''}</span>
                </div>
                {totalExpected > 0 && (
                  <div className="flex items-center text-green-600 font-medium">
                    <span>${totalExpected}</span>
                  </div>
                )}
              </div>
            )}
            {tournament.location && (
              <div className="text-sm text-gray-500 truncate">
                📍 {tournament.location}
              </div>
            )}
          </div>
          
          {/* Quick indicators */}
          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center text-gray-500">
              <Users className="h-3 w-3 mr-1" />
              <span>{totalParticipants} total</span>
            </div>
            {divisionCount > 0 && (
              <div className="hidden sm:flex items-center text-blue-600">
                <Layers className="h-3 w-3 mr-1" />
                <span>{divisionCount} divisions</span>
              </div>
            )}
            {totalExpected > 0 && (
              <div className="hidden sm:flex items-center text-green-600 font-medium">
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
      <td className="py-4 px-4 align-top hidden sm:table-cell">
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
      <td className="py-4 px-4 align-top hidden md:table-cell">
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
      <td className="py-4 px-4 align-top hidden lg:table-cell">
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

// Memoized League Row Component (unchanged for brevity)
const LeagueRow = React.memo(({ league, onView, onEdit }) => {
  // Helper function to format event type for display
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
          
          <div className="sm:hidden space-y-1">
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
              <span>
                {league.startDate ? new Date(league.startDate.seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD'} to {league.endDate ? new Date(league.endDate.seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center text-gray-600">
                <Trophy className="h-3.5 w-3.5 mr-1.5" />
                <span className="capitalize">{league.skillLevel}</span>
              </div>
              {league.registrationFee > 0 && (
                <div className="flex items-center text-green-600 font-medium">
                  <span>${league.registrationFee}</span>
                </div>
              )}
            </div>
            {league.location && (
              <div className="text-sm text-gray-500 truncate">
                📍 {league.location}
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center text-gray-500">
              <span>Type: {formatEventType(league.eventType)}</span>
            </div>
            {league.registrationFee > 0 && (
              <div className="hidden sm:flex items-center text-green-600 font-medium">
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

      <td className="py-4 px-4 align-top hidden sm:table-cell">
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

      <td className="py-4 px-4 align-top hidden md:table-cell">
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

      <td className="py-4 px-4 align-top hidden lg:table-cell">
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
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">
          Welcome back, {currentUserMember?.firstName || user.email}!
        </p>
      </div>
      <div className="flex items-center space-x-4">
        <NotificationBadge
          count={count}
          hasHighPriority={hasHighPriority}
          onClick={onNotificationClick}
          animate={shouldAnimate}
          aria-label={ariaLabel}
        />
        
        <Button variant="outline" onClick={onLogout}>
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
  
  // FIXED: Enhanced tournament state management with better tracking
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
  
  // Pagination state
  const [visibleTournaments, setVisibleTournaments] = useState(4);
  const [visibleLeagues, setVisibleLeagues] = useState(4);
  
  // Form states
  const [selectedLeagueMembers, setSelectedLeagueMembers] = useState([]);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  // Memoized event handlers
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

  // FIXED: Enhanced tournament editing with better state management
  const handleEditTournament = useCallback((tournament) => {
    console.log('Editing tournament:', tournament);
    
    // Ensure we have the latest tournament data
    const latestTournament = tournaments.find(t => t.id === tournament.id) || tournament;
    console.log('Using latest tournament data:', latestTournament);
    
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

  // FIXED: Simple tournament sorting - earliest event dates first (chronological order)
  const getSortedTournaments = useCallback(() => {
    return [...tournaments].sort((a, b) => {
      // Primary sort: Event date (earliest first)
      const dateA = a.eventDate ? (a.eventDate.seconds ? new Date(a.eventDate.seconds * 1000) : new Date(a.eventDate)) : new Date('2099-12-31'); // Put events without dates at the end
      const dateB = b.eventDate ? (b.eventDate.seconds ? new Date(b.eventDate.seconds * 1000) : new Date(b.eventDate)) : new Date('2099-12-31');
      
      // Sort by event date ascending (earliest first)
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA - dateB; // FIXED: Ascending order (earliest first)
      }
      
      // Secondary sort: Creation date (most recently created first for same event dates)
      const createdA = a.createdAt ? (a.createdAt.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(a.createdAt)) : new Date(0);
      const createdB = b.createdAt ? (b.createdAt.seconds ? new Date(b.createdAt.seconds * 1000) : new Date(b.createdAt)) : new Date(0);
      
      return createdB - createdA; // Most recently created first
    });
  }, [tournaments]);

  // FIXED: Simple league sorting - earliest start dates first (chronological order)
  const getSortedLeagues = useCallback(() => {
    return [...leagues].sort((a, b) => {
      // Primary sort: Start date (earliest first)
      const dateA = a.startDate ? (a.startDate.seconds ? new Date(a.startDate.seconds * 1000) : new Date(a.startDate)) : new Date('2099-12-31'); // Put leagues without dates at the end
      const dateB = b.startDate ? (b.startDate.seconds ? new Date(b.startDate.seconds * 1000) : new Date(b.startDate)) : new Date('2099-12-31');
      
      // Sort by start date ascending (earliest first)
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA - dateB; // FIXED: Ascending order (earliest first)
      }
      
      // Secondary sort: Creation date (most recently created first for same start dates)
      const createdA = a.createdAt ? (a.createdAt.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(a.createdAt)) : new Date(0);
      const createdB = b.createdAt ? (b.createdAt.seconds ? new Date(b.createdAt.seconds * 1000) : new Date(b.createdAt)) : new Date(0);
      
      return createdB - createdA; // Most recently created first
    });
  }, [leagues]);

  // Memoized sorted data to prevent recalculation on every render
  const sortedTournaments = useMemo(() => getSortedTournaments(), [getSortedTournaments]);
  const sortedLeagues = useMemo(() => getSortedLeagues(), [getSortedLeagues]);

  // Show alert message
  const showAlert = useCallback((type, title, message) => {
    console.log(`Alert: ${type} - ${title}: ${message}`);
    setAlert({ type, title, message });
    setTimeout(() => setAlert(null), 5000);
  }, []);

  // Enhanced tournament table with pagination
  const EnhancedTournamentTable = ({ data, visibleCount, onLoadMore, hasMore }) => {
    const displayData = data.slice(0, visibleCount);
    
    if (!data || data.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500">
          <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No tournaments yet. Create your first tournament!</p>
        </div>
      );
    }

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
                  <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm uppercase tracking-wider w-[20%] hidden sm:table-cell">
                    Date & Divisions
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm uppercase tracking-wider w-[25%] hidden md:table-cell">
                    Location
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm uppercase tracking-wider w-[15%] hidden lg:table-cell">
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
        
        {/* Load More Button */}
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
        
        {/* Showing X of Y indicator */}
        {data.length > 4 && (
          <div className="text-center text-sm text-gray-500">
            Showing {Math.min(visibleCount, data.length)} of {data.length} tournaments
          </div>
        )}
      </div>
    );
  };

  // Enhanced League Table Component
  const EnhancedLeagueTable = ({ data, visibleCount, onLoadMore, hasMore }) => {
    const displayData = data.slice(0, visibleCount);
    
    if (!data || data.length === 0) {
        return (
        <div className="text-center py-12 text-gray-500">
            <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No leagues yet. Create your first league!</p>
        </div>
        );
    }

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
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm uppercase tracking-wider w-[20%] hidden sm:table-cell">
                    Duration & Details
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm uppercase tracking-wider w-[25%] hidden md:table-cell">
                    Location
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm uppercase tracking-wider w-[15%] hidden lg:table-cell">
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
        
        {/* Load More Button */}
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
        
        {/* Showing X of Y indicator */}
        {data.length > 4 && (
            <div className="text-center text-sm text-gray-500">
            Showing {Math.min(visibleCount, data.length)} of {data.length} leagues
            </div>
        )}
        </div>
    );
  };

  // Handle division participant changes
  const handleDivisionParticipantsChange = (divisionId, participants) => {
    if (!editingTournament) return;
    
    console.log('Updating division participants:', divisionId, participants);
    
    const updatedDivisions = editingTournament.divisions.map(division => 
      division.id === divisionId 
        ? { ...division, participants }
        : division
    );
    
    setEditingTournament(prev => ({
      ...prev,
      divisions: updatedDivisions
    }));
  };

  // Auth functions
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

  // FIXED: Tournament functions with enhanced error handling and state management
  const handleCreateTournament = async (tournamentData) => {
    setFormLoading(true);
    console.log('Creating tournament:', tournamentData);
    
    try {
      const tournamentId = await addTournament(tournamentData);
      console.log('Tournament created successfully:', tournamentId);
      
      // Close modal only on success
      setShowTournamentModal(false);
      setEditingTournament(null);
      
      showAlert('success', 'Tournament created!', `${tournamentData.name} has been created successfully with ${tournamentData.divisions.length} division${tournamentData.divisions.length !== 1 ? 's' : ''}`);
    } catch (err) {
      console.error('Tournament creation failed:', err);
      showAlert('error', 'Failed to create tournament', err.message);
      // Don't close modal on error - let user try again
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateTournament = async (tournamentData) => {
    if (!editingTournament) {
      console.error('No tournament being edited');
      return;
    }
    
    setFormLoading(true);
    console.log('Updating tournament:', editingTournament.id, tournamentData);
    
    try {
      await updateTournament(editingTournament.id, tournamentData);
      console.log('Tournament updated successfully');
      
      // Close modal only on success
      setShowTournamentModal(false);
      setEditingTournament(null);
      
      showAlert('success', 'Tournament updated!', `${tournamentData.name} has been updated successfully`);
    } catch (err) {
      console.error('Tournament update failed:', err);
      showAlert('error', 'Failed to update tournament', err.message);
      // Don't close modal on error - let user try again
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteTournament = async (tournamentId) => {
    setDeleteLoading(true);
    console.log('Deleting tournament:', tournamentId);
    
    try {
      await deleteTournament(tournamentId);
      console.log('Tournament deleted successfully');
      
      // Close modal only on success
      setShowTournamentModal(false);
      setEditingTournament(null);
      
      showAlert('success', 'Tournament deleted!', 'Tournament has been successfully deleted');
    } catch (err) {
      console.error('Tournament deletion failed:', err);
      showAlert('error', 'Failed to delete tournament', err.message);
      // Don't close modal on error
    } finally {
      setDeleteLoading(false);
    }
  };

  // League functions
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

  // Member functions
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

  // Stable member columns
  const memberColumns = useMemo(() => [
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
  ], [handleEditMember]);

  // FIXED: Enhanced modal close handlers that prevent accidental closure
  const handleTournamentModalClose = useCallback(() => {
    if (!formLoading && !deleteLoading) {
      console.log('Closing tournament modal');
      setShowTournamentModal(false);
      setEditingTournament(null);
    }
  }, [formLoading, deleteLoading]);

  const handleLeagueModalClose = useCallback(() => {
    if (!formLoading && !deleteLoading) {
      console.log('Closing league modal');
      setShowLeagueModal(false);
      setEditingLeague(null);
      setSelectedLeagueMembers([]);
    }
  }, [formLoading, deleteLoading]);

  const handleMemberModalClose = useCallback(() => {
    if (!formLoading && !deleteLoading) {
      console.log('Closing member modal');
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alert notification */}
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

        {/* Sticky Navigation */}
        <StickyNavigation 
          activeSection={activeSection}
          onNavigate={scrollToSection}
          navItems={navItems}
        />

        {/* Header with Real Notifications */}
        <DashboardHeader 
          currentUserMember={currentUserMember}
          user={user}
          onNotificationClick={() => setShowNotificationModal(true)}
          onLogout={logout}
        />

        {/* Stats Cards */}
        <div ref={refs.statsRef} className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border shadow-sm p-6 text-center">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Tournaments</h3>
            <div className="flex items-center justify-center">
              <Trophy className="h-8 w-8 text-green-600 mr-3" />
              <span className="text-3xl font-bold text-gray-900">
                {tournaments.length}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg border shadow-sm p-6 text-center">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Divisions</h3>
            <div className="flex items-center justify-center">
              <Layers className="h-8 w-8 text-blue-600 mr-3" />
              <span className="text-3xl font-bold text-gray-900">
                {tournaments.reduce((sum, t) => sum + (t.divisions?.length || 0), 0)}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg border shadow-sm p-6 text-center">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Active Leagues</h3>
            <div className="flex items-center justify-center">
              <Activity className="h-8 w-8 text-purple-600 mr-3" />
              <span className="text-3xl font-bold text-gray-900">
                {leagues.filter(l => l.status === LEAGUE_STATUS.ACTIVE).length}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg border shadow-sm p-6 text-center">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Active Members</h3>
            <div className="flex items-center justify-center">
              <Users className="h-8 w-8 text-indigo-600 mr-3" />
              <span className="text-3xl font-bold text-gray-900">
                {members.length}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <Card ref={refs.actionsRef} title="Quick Actions" className="mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              onClick={() => setShowMemberModal(true)}
              className="h-16"
            >
              <Users className="h-5 w-5 mr-2" />
              Add Member
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => setShowTournamentModal(true)}
              className="h-16"
            >
              <Trophy className="h-5 w-5 mr-2" />
              Create Tournament
            </Button>

            <Button 
              variant="outline" 
              onClick={() => setShowLeagueModal(true)}
              className="h-16"
            >
              <Activity className="h-5 w-5 mr-2" />
              Create League
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => setShowPaymentModal(true)}
              className="h-16"
            >
              <DollarSign className="h-5 w-5 mr-2" />
              Payment Tracker
            </Button>
          </div>
        </Card>

        {/* Tournaments Section */}
        <Card 
          ref={refs.tournamentsRef}
          title="Tournaments"
          subtitle={`Manage your pickleball tournaments with divisions (showing ${Math.min(visibleTournaments, sortedTournaments.length)} of ${sortedTournaments.length}, sorted by earliest event date first)`}
          actions={[
            <Button 
              key="add-tournament"
              onClick={() => setShowTournamentModal(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Tournament
            </Button>
          ]}
          className="mb-8"
        >
          <EnhancedTournamentTable 
            data={sortedTournaments}
            visibleCount={visibleTournaments}
            onLoadMore={() => setVisibleTournaments(prev => prev + 4)}
            hasMore={sortedTournaments.length > visibleTournaments}
          />
        </Card>

        {/* Leagues Section */}
        <Card 
          ref={refs.leaguesRef}
          title="Leagues"
          subtitle={`Manage ongoing pickleball leagues (showing ${Math.min(visibleLeagues, sortedLeagues.length)} of ${sortedLeagues.length}, sorted by earliest start date first)`}
          actions={[
            <Button 
              key="add-league"
              onClick={() => setShowLeagueModal(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              New League
            </Button>
          ]}
          className="mb-8 min-h-[400px]"
        >
          <EnhancedLeagueTable 
            data={sortedLeagues}
            visibleCount={visibleLeagues}
            onLoadMore={() => setVisibleLeagues(prev => prev + 4)}
            hasMore={sortedLeagues.length > visibleLeagues}
          />
        </Card>

        {/* Members Section */}
        <Card 
          ref={refs.membersRef}
          title="Members"
          subtitle="Manage pickleball community members"
          actions={[
            <Button 
              key="add-member"
              onClick={() => setShowMemberModal(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Member
            </Button>
          ]}
          className="mb-8 min-h-[400px]"
        >
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
                  {members.map((row, rowIndex) => (
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
        </Card>

        {/* Notification Modal */}
        {showNotificationModal && (
          <NotificationCenter
            isModal={true}
            onClose={() => setShowNotificationModal(false)}
            onNavigate={handleNotificationNavigation}
          />
        )}

        {/* FIXED: Tournament Modal with better error handling and state management */}
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
              onUpdateTournament={updateTournament} // NEW: Pass direct update function for divisions
              loading={formLoading}
              deleteLoading={deleteLoading}
            />
            
            {/* Division Participant Management - Only show when editing */}
            {editingTournament && editingTournament.divisions && editingTournament.divisions.length > 0 && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Manage Division Participants
                </h3>
                <DivisionMemberSelector
                  tournament={editingTournament}
                  members={members}
                  onDivisionParticipantsChange={handleDivisionParticipantsChange}
                  loading={membersLoading}
                />
              </div>
            )}
          </div>
        </Modal>

        {/* Tournament Detail Modal - Simplified for Discussion */}
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

        {/* League Detail Modal - Simplified for Discussion */}
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

        {/* Payment Modal with Division Support */}
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
                                // Update the specific division
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