// src/components/Dashboard.jsx (MOBILE-FIRST COMPLETE REDESIGN)
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
  Search,
  Filter,
  MoreHorizontal,
  TrendingUp,
  Target,
  Zap,
  ChevronDown,
  ChevronRight,
  Star,
  Award,
  BarChart3,
  RefreshCw,
  Settings,
  Bell,
  Menu,
  X,
  ArrowUp,
  ArrowDown,
  Info,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { 
  useMembers, 
  useLeagues, 
  useTournaments, 
  useAuth
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

// Import UI components
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
import { CommentSection } from './comments';

// Mobile-First Dashboard Styles
const mobileFirstStyles = `
  /* Mobile-first touch optimizations */
  .dashboard-container {
    -webkit-overflow-scrolling: touch;
    scroll-behavior: smooth;
  }
  
  .touch-card {
    transition: all 0.2s ease;
    -webkit-tap-highlight-color: transparent;
  }
  
  .touch-card:active {
    transform: scale(0.98);
  }
  
  .quick-action-fab {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 40;
    transition: all 0.3s ease;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  }
  
  .quick-action-fab:active {
    transform: scale(0.9);
  }
  
  /* Pull-to-refresh styling */
  .pull-to-refresh {
    transition: transform 0.3s ease;
  }
  
  .pull-to-refresh.pulling {
    transform: translateY(20px);
  }
  
  /* Progressive disclosure animations */
  .section-content {
    transition: max-height 0.3s ease, opacity 0.2s ease;
    overflow: hidden;
  }
  
  .section-content.collapsed {
    max-height: 0;
    opacity: 0;
  }
  
  .section-content.expanded {
    max-height: 2000px;
    opacity: 1;
  }
  
  /* Mobile stats grid */
  .stats-grid-mobile {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  
  @media (min-width: 640px) {
    .stats-grid-mobile {
      grid-template-columns: repeat(4, 1fr);
    }
  }
  
  /* Card hover states for mobile */
  @media (max-width: 768px) {
    .mobile-card-hover:active {
      background-color: rgb(249 250 251);
      transform: scale(0.98);
    }
  }
  
  /* Smooth section transitions */
  .dashboard-section {
    scroll-margin-top: 120px;
  }
  
  /* Better touch targets */
  .touch-target-large {
    min-height: 56px;
    min-width: 56px;
  }
  
  /* Loading states */
  .skeleton-card {
    background: linear-gradient(90deg, #f0f0f0 25%, transparent 37%, #f0f0f0 63%);
    background-size: 400% 100%;
    animation: skeleton 1.5s ease-in-out infinite;
  }
  
  @keyframes skeleton {
    0% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  
  /* Mobile navigation improvements */
  .mobile-nav-indicator {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #3b82f6, #8b5cf6);
    border-radius: 2px;
    transform: scaleX(0);
    transition: transform 0.3s ease;
  }
  
  .mobile-nav-indicator.active {
    transform: scaleX(1);
  }
`;

const StyleSheet = () => (
  <style dangerouslySetInnerHTML={{ __html: mobileFirstStyles }} />
);

// Mobile-First Tournament Card with Enhanced Touch UX
const MobileTournamentCard = React.memo(({ tournament, onView, onEdit, onManage }) => {
  const [expanded, setExpanded] = useState(false);
  const totalParticipants = getTournamentTotalParticipants(tournament);
  const totalExpected = getTournamentTotalExpected(tournament);
  const divisionCount = tournament.divisions?.length || 0;

  const getStatusConfig = (status) => {
    switch (status) {
      case TOURNAMENT_STATUS.DRAFT:
        return { color: 'bg-gray-100 text-gray-700 border-gray-200', icon: Clock, label: 'Draft', emoji: '📝' };
      case TOURNAMENT_STATUS.REGISTRATION_OPEN:
        return { color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle, label: 'Open', emoji: '🔓' };
      case TOURNAMENT_STATUS.IN_PROGRESS:
        return { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Activity, label: 'In Progress', emoji: '🏃' };
      case TOURNAMENT_STATUS.COMPLETED:
        return { color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Trophy, label: 'Completed', emoji: '🏆' };
      default:
        return { color: 'bg-gray-100 text-gray-700 border-gray-200', icon: Clock, label: 'Unknown', emoji: '❓' };
    }
  };

  const statusConfig = getStatusConfig(tournament.status);

  const formatDate = (date) => {
    if (!date) return 'TBD';
    const dateObj = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
    const now = new Date();
    const diffTime = dateObj.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays > 0 && diffDays <= 7) return `In ${diffDays} days`;
    if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;
    
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: dateObj.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  return (
    <div className="touch-card mobile-card-hover bg-white rounded-2xl border shadow-sm overflow-hidden">
      {/* Card Header */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0 pr-3">
            <h3 className="text-lg font-semibold text-gray-900 leading-tight mb-2">
              {tournament.name}
            </h3>
            <div className="flex items-center space-x-2 mb-3">
              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${statusConfig.color}`}>
                <span className="mr-1.5">{statusConfig.emoji}</span>
                {statusConfig.label}
              </span>
              {divisionCount > 0 && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  <Layers className="h-3 w-3 mr-1" />
                  {divisionCount}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Info Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <Calendar className="h-4 w-4 text-gray-400 mx-auto mb-1" />
            <div className="text-sm font-medium text-gray-900">{formatDate(tournament.eventDate)}</div>
            <div className="text-xs text-gray-500">Event Date</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <Users className="h-4 w-4 text-blue-400 mx-auto mb-1" />
            <div className="text-sm font-medium text-blue-900">{totalParticipants}</div>
            <div className="text-xs text-blue-600">Participants</div>
          </div>
        </div>

        {/* Location */}
        {tournament.location && (
          <div className="flex items-center text-sm text-gray-600 mb-4 p-2 bg-gray-50 rounded-lg">
            <MapPin className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
            <span className="truncate flex-1">{tournament.location}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                openLinkSafely(generateGoogleMapsLink(tournament.location));
              }}
              className="touch-target-large p-2 rounded-md hover:bg-gray-200 transition-colors ml-2"
              title="View on Maps"
            >
              <ExternalLink className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        )}

        {/* Revenue Display */}
        {totalExpected > 0 && (
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200 mb-4">
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 text-green-600 mr-2" />
              <span className="text-sm text-green-700 font-medium">Expected Revenue</span>
            </div>
            <span className="text-lg font-bold text-green-800">${totalExpected}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onView(tournament);
            }}
            className="touch-target-large bg-blue-600 hover:bg-blue-700 text-white font-medium"
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
            className="touch-target-large font-medium"
            size="md"
          >
            <Settings className="h-4 w-4 mr-2" />
            Manage
          </Button>
        </div>

        {/* Expandable Details */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
            {tournament.description && (
              <p className="text-sm text-gray-600">{tournament.description}</p>
            )}
            
            {/* Division Details */}
            {divisionCount > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Divisions</h4>
                <div className="space-y-2">
                  {tournament.divisions.slice(0, 3).map((division, index) => (
                    <div key={division.id || index} className="bg-gray-50 rounded-lg p-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-800">{division.name}</span>
                        <div className="flex items-center space-x-2 text-xs text-gray-600">
                          <span>{division.participants?.length || 0} players</span>
                          {division.entryFee > 0 && (
                            <span className="text-green-600 font-medium">${division.entryFee}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {divisionCount > 3 && (
                    <div className="text-xs text-gray-500 text-center py-2">
                      +{divisionCount - 3} more divisions
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quick Links */}
            {(tournament.website || tournament.location) && (
              <div className="flex space-x-2">
                {tournament.website && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      openLinkSafely(tournament.website);
                    }}
                    className="flex-1"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Website
                  </Button>
                )}
                {tournament.location && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      openLinkSafely(generateDirectionsLink(tournament.location));
                    }}
                    className="flex-1"
                  >
                    <Navigation className="h-3 w-3 mr-1" />
                    Directions
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Expand/Collapse Button */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full mt-3 p-2 text-center text-sm text-gray-500 hover:text-gray-700 transition-colors rounded-lg hover:bg-gray-50"
        >
          <ChevronDown className={`h-4 w-4 mx-auto transition-transform ${expanded ? 'rotate-180' : ''}`} />
          <span className="sr-only">{expanded ? 'Show less' : 'Show more'}</span>
        </button>
      </div>
    </div>
  );
});

// Mobile-First League Card
const MobileLeagueCard = React.memo(({ league, onView, onEdit }) => {
  const [expanded, setExpanded] = useState(false);
  const participantCount = league.participants?.length || 0;
  
  const formatEventType = (eventType) => {
    if (!eventType) return '';
    return eventType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDateRange = (startDate, endDate) => {
    if (!startDate || !endDate) return 'TBD';
    const start = startDate.seconds ? new Date(startDate.seconds * 1000) : new Date(startDate);
    const end = endDate.seconds ? new Date(endDate.seconds * 1000) : new Date(endDate);
    
    const now = new Date();
    const isActive = start <= now && end >= now;
    
    return {
      range: `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      isActive
    };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case LEAGUE_STATUS.ACTIVE:
        return 'bg-green-100 text-green-700 border-green-200';
      case LEAGUE_STATUS.COMPLETED:
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const dateInfo = formatDateRange(league.startDate, league.endDate);

  return (
    <div className="touch-card mobile-card-hover bg-white rounded-2xl border shadow-sm overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0 pr-3">
            <h3 className="text-lg font-semibold text-gray-900 leading-tight mb-2">
              {league.name}
            </h3>
            <div className="flex items-center space-x-2 mb-3">
              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${getStatusColor(league.status)}`}>
                {league.status === LEAGUE_STATUS.ACTIVE ? '🟢' : '🏁'} {league.status.replace('_', ' ')}
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 capitalize">
                {league.skillLevel}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Info Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className={`rounded-lg p-3 text-center ${dateInfo.isActive ? 'bg-green-50' : 'bg-gray-50'}`}>
            <Calendar className={`h-4 w-4 mx-auto mb-1 ${dateInfo.isActive ? 'text-green-400' : 'text-gray-400'}`} />
            <div className={`text-sm font-medium ${dateInfo.isActive ? 'text-green-900' : 'text-gray-900'}`}>
              {dateInfo.range}
            </div>
            <div className={`text-xs ${dateInfo.isActive ? 'text-green-600' : 'text-gray-500'}`}>
              {dateInfo.isActive ? 'Active Now' : 'Schedule'}
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <Users className="h-4 w-4 text-blue-400 mx-auto mb-1" />
            <div className="text-sm font-medium text-blue-900">{participantCount}</div>
            <div className="text-xs text-blue-600">Members</div>
          </div>
        </div>

        {/* League Type & Fee */}
        <div className="flex items-center justify-between mb-4 p-2 bg-gray-50 rounded-lg">
          <div className="flex items-center text-sm text-gray-600">
            <Trophy className="h-4 w-4 mr-2 text-gray-400" />
            <span>{formatEventType(league.eventType)}</span>
          </div>
          {league.registrationFee > 0 && (
            <div className="flex items-center text-sm text-green-600 font-medium">
              <DollarSign className="h-4 w-4 mr-1" />
              <span>${league.registrationFee}</span>
            </div>
          )}
        </div>

        {/* Location */}
        {league.location && (
          <div className="flex items-center text-sm text-gray-600 mb-4 p-2 bg-gray-50 rounded-lg">
            <MapPin className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
            <span className="truncate flex-1">{league.location}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                openLinkSafely(generateGoogleMapsLink(league.location));
              }}
              className="touch-target-large p-2 rounded-md hover:bg-gray-200 transition-colors ml-2"
              title="View on Maps"
            >
              <ExternalLink className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onView(league);
            }}
            className="touch-target-large bg-blue-600 hover:bg-blue-700 text-white font-medium"
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
            className="touch-target-large font-medium"
            size="md"
          >
            <Activity className="h-4 w-4 mr-2" />
            Manage
          </Button>
        </div>

        {/* Expandable Details */}
        {expanded && league.description && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-600">{league.description}</p>
          </div>
        )}

        {/* Expand/Collapse Button */}
        {league.description && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full mt-3 p-2 text-center text-sm text-gray-500 hover:text-gray-700 transition-colors rounded-lg hover:bg-gray-50"
          >
            <ChevronDown className={`h-4 w-4 mx-auto transition-transform ${expanded ? 'rotate-180' : ''}`} />
            <span className="sr-only">{expanded ? 'Show less' : 'Show more'}</span>
          </button>
        )}
      </div>
    </div>
  );
});

// Mobile-First Member Card
const MobileMemberCard = React.memo(({ member, onEdit }) => {
  const [showContact, setShowContact] = useState(false);

  return (
    <div className="touch-card mobile-card-hover bg-white rounded-2xl border shadow-sm overflow-hidden">
      <div className="p-4">
        <div className="flex items-center space-x-3 mb-3">
          <div className="h-12 w-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-semibold text-lg">
              {member.firstName.charAt(0)}{member.lastName.charAt(0)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-900 truncate">
              {member.firstName} {member.lastName}
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 capitalize">
                {member.skillLevel}
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                {member.role}
              </span>
            </div>
          </div>
          <span className={`w-3 h-3 rounded-full ${member.isActive ? 'bg-green-400' : 'bg-red-400'}`} />
        </div>

        {/* Contact Info Toggle */}
        <button
          onClick={() => setShowContact(!showContact)}
          className="w-full p-2 text-left text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors mb-3"
        >
          <div className="flex items-center justify-between">
            <span>Contact Information</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${showContact ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {showContact && (
          <div className="space-y-2 mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center text-sm text-gray-600">
              <Mail className="h-4 w-4 mr-2 text-gray-400" />
              <span className="truncate">{member.email}</span>
            </div>
            {member.phoneNumber && (
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="h-4 w-4 mr-2 text-gray-400" />
                <span>{member.phoneNumber}</span>
              </div>
            )}
            {member.venmoHandle && (
              <div className="flex items-center text-sm text-green-600">
                <DollarSign className="h-4 w-4 mr-2 text-green-400" />
                <span>@{member.venmoHandle}</span>
              </div>
            )}
          </div>
        )}

        {/* Status and Action */}
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
            member.isActive 
              ? 'bg-green-100 text-green-700 border border-green-200' 
              : 'bg-red-100 text-red-700 border border-red-200'
          }`}>
            {member.isActive ? '✅ Active' : '❌ Inactive'}
          </span>
          
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(member);
            }}
            variant="outline"
            size="sm"
            className="touch-target-large"
          >
            <Settings className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </div>
      </div>
    </div>
  );
});

// Mobile-First Dashboard Section Component
const DashboardSection = ({ 
  title, 
  subtitle, 
  children, 
  actions, 
  loading = false,
  error = null,
  emptyMessage = "No items found",
  emptyIcon: EmptyIcon = Activity,
  collapsible = false,
  defaultExpanded = true,
  sectionRef
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (loading) {
    return (
      <div ref={sectionRef} className="dashboard-section mb-8">
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div>
                <div className="skeleton-card h-6 w-48 rounded mb-2"></div>
                <div className="skeleton-card h-4 w-32 rounded"></div>
              </div>
              <div className="skeleton-card h-10 w-20 rounded"></div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton-card h-24 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={sectionRef} className="dashboard-section mb-8">
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        {/* Section Header */}
        <div 
          className={`p-6 border-b ${collapsible ? 'cursor-pointer' : ''}`}
          onClick={collapsible ? () => setExpanded(!expanded) : undefined}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center">
                <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                {collapsible && (
                  <ChevronDown className={`h-5 w-5 ml-2 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                )}
              </div>
              {subtitle && (
                <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
              )}
            </div>
            {actions && !collapsible && (
              <div className="flex space-x-2 ml-4">
                {actions}
              </div>
            )}
          </div>
        </div>

        {/* Section Content */}
        <div className={`section-content ${expanded ? 'expanded' : 'collapsed'}`}>
          <div className="p-6">
            {error ? (
              <Alert 
                type="error" 
                title="Error" 
                message={error} 
              />
            ) : (
              children || (
                <div className="text-center py-12 text-gray-500">
                  <EmptyIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No Data Available</p>
                  <p className="text-sm mt-1">{emptyMessage}</p>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Mobile-First Dashboard Component
const Dashboard = () => {
  const { user, signIn, signUpWithProfile, logout, isAuthenticated, loading: authLoading } = useAuth();
  const { members, loading: membersLoading, addMember, updateMember, deleteMember } = useMembers({ realTime: false });
  const { leagues, loading: leaguesLoading, addLeague, updateLeague, deleteLeague } = useLeagues({ realTime: false });
  const { tournaments, loading: tournamentsLoading, addTournament, updateTournament, deleteTournament } = useTournaments({ realTime: false });

  // Navigation and UI state
  const { activeSection, scrollToSection, navItems, refs } = useSmoothNavigation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [searchTerm, setSearchTerm] = useState('');
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Modal states
  const [showTournamentModal, setShowTournamentModal] = useState(false);
  const [showLeagueModal, setShowLeagueModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showTournamentDetailModal, setShowTournamentDetailModal] = useState(false);
  const [showLeagueDetailModal, setShowLeagueDetailModal] = useState(false);
  
  // Form states
  const [editingTournament, setEditingTournament] = useState(null);
  const [editingLeague, setEditingLeague] = useState(null);
  const [editingMember, setEditingMember] = useState(null);
  const [viewingTournament, setViewingTournament] = useState(null);
  const [viewingLeague, setViewingLeague] = useState(null);
  const [selectedLeagueMembers, setSelectedLeagueMembers] = useState([]);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  // Auth UI state
  const [authMode, setAuthMode] = useState('signin');
  
  // Pagination state
  const [visibleTournaments, setVisibleTournaments] = useState(isMobile ? 3 : 6);
  const [visibleLeagues, setVisibleLeagues] = useState(isMobile ? 3 : 6);
  const [visibleMembers, setVisibleMembers] = useState(isMobile ? 6 : 12);

  const currentUserMember = useMemo(() => 
    members.find(m => m.authUid === user?.uid), 
    [members, user?.uid]
  );

  // Responsive detection
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Adjust pagination for mobile
      if (mobile) {
        setVisibleTournaments(prev => Math.min(prev, 3));
        setVisibleLeagues(prev => Math.min(prev, 3));
        setVisibleMembers(prev => Math.min(prev, 6));
      }
    };
    
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Event handlers
  const handleViewTournament = useCallback((tournament) => {
    setViewingTournament(tournament);
    setShowTournamentDetailModal(true);
  }, []);

  const handleViewLeague = useCallback((league) => {
    setViewingLeague(league);
    setShowLeagueDetailModal(true);
  }, []);

  const handleEditTournament = useCallback((tournament) => {
    const latestTournament = tournaments.find(t => t.id === tournament.id) || tournament;
    setEditingTournament(latestTournament);
    setShowTournamentModal(true);
  }, [tournaments]);

  const handleEditLeague = useCallback((league) => {
    setEditingLeague(league);
    setSelectedLeagueMembers(league.participants || []);
    setShowLeagueModal(true);
  }, []);

  const handleEditMember = useCallback((member) => {
    setEditingMember(member);
    setShowMemberModal(true);
  }, []);

  // Pull to refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Trigger data refresh here
      setLastUpdated(new Date());
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate refresh
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Sorting functions
  const getSortedTournaments = useCallback(() => {
    let sorted = [...tournaments].sort((a, b) => {
      const dateA = a.eventDate ? (a.eventDate.seconds ? new Date(a.eventDate.seconds * 1000) : new Date(a.eventDate)) : new Date('2099-12-31');
      const dateB = b.eventDate ? (b.eventDate.seconds ? new Date(b.eventDate.seconds * 1000) : new Date(b.eventDate)) : new Date('2099-12-31');
      
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA - dateB;
      }
      
      const createdA = a.createdAt ? (a.createdAt.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(a.createdAt)) : new Date(0);
      const createdB = b.createdAt ? (b.createdAt.seconds ? new Date(b.createdAt.seconds * 1000) : new Date(b.createdAt)) : new Date(0);
      
      return createdB - createdA;
    });

    // Filter by search term
    if (searchTerm) {
      sorted = sorted.filter(t => 
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return sorted;
  }, [tournaments, searchTerm]);

  const getSortedLeagues = useCallback(() => {
    let sorted = [...leagues].sort((a, b) => {
      const dateA = a.startDate ? (a.startDate.seconds ? new Date(a.startDate.seconds * 1000) : new Date(a.startDate)) : new Date('2099-12-31');
      const dateB = b.startDate ? (b.startDate.seconds ? new Date(b.startDate.seconds * 1000) : new Date(b.startDate)) : new Date('2099-12-31');
      
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA - dateB;
      }
      
      const createdA = a.createdAt ? (a.createdAt.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(a.createdAt)) : new Date(0);
      const createdB = b.createdAt ? (b.createdAt.seconds ? new Date(b.createdAt.seconds * 1000) : new Date(b.createdAt)) : new Date(0);
      
      return createdB - createdA;
    });

    // Filter by search term
    if (searchTerm) {
      sorted = sorted.filter(l => 
        l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return sorted;
  }, [leagues, searchTerm]);

  const getSortedMembers = useCallback(() => {
    let sorted = [...members].sort((a, b) => 
      `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
    );

    // Filter by search term
    if (searchTerm) {
      sorted = sorted.filter(m => 
        `${m.firstName} ${m.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return sorted;
  }, [members, searchTerm]);

  const sortedTournaments = useMemo(() => getSortedTournaments(), [getSortedTournaments]);
  const sortedLeagues = useMemo(() => getSortedLeagues(), [getSortedLeagues]);
  const sortedMembers = useMemo(() => getSortedMembers(), [getSortedMembers]);

  // Alert helper
  const showAlert = useCallback((type, title, message) => {
    setAlert({ type, title, message });
    setTimeout(() => setAlert(null), 5000);
  }, []);

  // Calculate payment summary
  const getPaymentSummary = useCallback(() => {
    return calculateOverallPaymentSummary(tournaments, leagues);
  }, [tournaments, leagues]);

  const paymentSummary = useMemo(() => getPaymentSummary(), [getPaymentSummary]);

  // Calculate enhanced stats
  const getEnhancedStats = () => {
    const activeTournaments = tournaments.filter(t => 
      t.status === TOURNAMENT_STATUS.REGISTRATION_OPEN || t.status === TOURNAMENT_STATUS.IN_PROGRESS
    ).length;
    
    const activeLeagues = leagues.filter(l => l.status === LEAGUE_STATUS.ACTIVE).length;
    
    const totalDivisions = tournaments.reduce((sum, t) => sum + (t.divisions?.length || 0), 0);
    
    const upcomingEvents = tournaments.filter(t => {
      if (!t.eventDate) return false;
      const eventDate = t.eventDate.seconds ? new Date(t.eventDate.seconds * 1000) : new Date(t.eventDate);
      const now = new Date();
      const diffDays = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 30; // Next 30 days
    }).length;

    return {
      tournaments: tournaments.length,
      activeTournaments,
      leagues: leagues.length,
      activeLeagues,
      totalDivisions,
      members: members.length,
      upcomingEvents,
      totalRevenue: paymentSummary.totalExpected,
      collectedRevenue: paymentSummary.totalCollected,
      paymentRate: paymentSummary.paymentRate
    };
  };

  const stats = getEnhancedStats();

  // Form handlers [keeping existing implementations but with enhanced mobile UX]
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

  // League handlers [keeping existing implementations]
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

  // Member handlers [keeping existing implementations]
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

  // Auth handlers
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

  // Modal close handlers [keeping existing implementations but enhanced for mobile]
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

  // Loading state
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
    <div className="min-h-screen bg-gray-50 dashboard-container">
      <StyleSheet />
      
      {/* Sticky Navigation */}
      <StickyNavigation 
        activeSection={activeSection}
        onNavigate={scrollToSection}
        navItems={navItems}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 pb-24">
        {/* Alert notification */}
        {alert && (
          <div className="mb-4 sm:mb-6 sticky top-20 z-30">
            <Alert
              type={alert.type}
              title={alert.title}
              message={alert.message}
              onClose={() => setAlert(null)}
            />
          </div>
        )}

        {/* Mobile Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 text-sm sm:text-base mt-1">
                Welcome back, {currentUserMember?.firstName || user.email.split('@')[0]}!
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                loading={refreshing}
                className="touch-target-large"
                title="Refresh Data"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              
              {isMobile && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowQuickActions(!showQuickActions)}
                  className="touch-target-large"
                >
                  {showQuickActions ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                </Button>
              )}
            </div>
          </div>

          {/* Mobile Search */}
          {isMobile && (
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tournaments, leagues, or members..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          )}

          {/* Mobile Quick Actions */}
          {isMobile && showQuickActions && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              <Button 
                onClick={() => {
                  setShowMemberModal(true);
                  setShowQuickActions(false);
                }}
                className="touch-target-large h-16 flex-col"
                variant="outline"
              >
                <Users className="h-5 w-5 mb-1" />
                <span className="text-xs">Add Member</span>
              </Button>
              
              <Button 
                onClick={() => {
                  setShowTournamentModal(true);
                  setShowQuickActions(false);
                }}
                className="touch-target-large h-16 flex-col"
                variant="outline"
              >
                <Trophy className="h-5 w-5 mb-1" />
                <span className="text-xs">New Tournament</span>
              </Button>

              <Button 
                onClick={() => {
                  setShowLeagueModal(true);
                  setShowQuickActions(false);
                }}
                className="touch-target-large h-16 flex-col"
                variant="outline"
              >
                <Activity className="h-5 w-5 mb-1" />
                <span className="text-xs">New League</span>
              </Button>
              
              <Button 
                onClick={() => {
                  setShowPaymentModal(true);
                  setShowQuickActions(false);
                }}
                className="touch-target-large h-16 flex-col"
                variant="outline"
              >
                <DollarSign className="h-5 w-5 mb-1" />
                <span className="text-xs">Payment Tracker</span>
              </Button>
            </div>
          )}
        </div>

        {/* Enhanced Stats Cards */}
        <div ref={refs.statsRef} className="stats-grid-mobile mb-8">
          <div className="bg-white rounded-2xl border shadow-sm p-4 text-center">
            <Trophy className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats.tournaments}</div>
            <div className="text-xs text-gray-500">Tournaments</div>
            {stats.activeTournaments > 0 && (
              <div className="text-xs text-green-600 font-medium mt-1">
                {stats.activeTournaments} active
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border shadow-sm p-4 text-center">
            <Layers className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats.totalDivisions}</div>
            <div className="text-xs text-gray-500">Divisions</div>
            {stats.upcomingEvents > 0 && (
              <div className="text-xs text-blue-600 font-medium mt-1">
                {stats.upcomingEvents} upcoming
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border shadow-sm p-4 text-center">
            <Activity className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats.leagues}</div>
            <div className="text-xs text-gray-500">Leagues</div>
            {stats.activeLeagues > 0 && (
              <div className="text-xs text-purple-600 font-medium mt-1">
                {stats.activeLeagues} active
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border shadow-sm p-4 text-center">
            <Users className="h-6 w-6 text-indigo-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats.members}</div>
            <div className="text-xs text-gray-500">Members</div>
            {stats.paymentRate > 0 && (
              <div className="text-xs text-indigo-600 font-medium mt-1">
                {stats.paymentRate}% paid
              </div>
            )}
          </div>
        </div>

        {/* Revenue Summary Card (Mobile-First) */}
        {stats.totalRevenue > 0 && (
          <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-2xl text-white p-6 mb-8 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Revenue Overview</h3>
              <DollarSign className="h-6 w-6 opacity-80" />
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">${stats.totalRevenue}</div>
                <div className="text-sm opacity-80">Expected</div>
              </div>
              <div>
                <div className="text-2xl font-bold">${stats.collectedRevenue}</div>
                <div className="text-sm opacity-80">Collected</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
                <div 
                  className="bg-white h-2 rounded-full transition-all duration-500"
                  style={{ width: `${stats.paymentRate}%` }}
                ></div>
              </div>
              <div className="text-center text-sm opacity-90 mt-2">
                {stats.paymentRate}% collection rate
              </div>
            </div>
          </div>
        )}

        {/* Desktop Quick Actions */}
        {!isMobile && (
          <Card ref={refs.actionsRef} title="Quick Actions" className="mb-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                onClick={() => setShowMemberModal(true)}
                className="h-16"
                size="md"
              >
                <Users className="h-5 w-5 mb-2" />
                <span className="text-sm">Add Member</span>
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => setShowTournamentModal(true)}
                className="h-16"
                size="md"
              >
                <Trophy className="h-5 w-5 mb-2" />
                <span className="text-sm">New Tournament</span>
              </Button>

              <Button 
                variant="outline" 
                onClick={() => setShowLeagueModal(true)}
                className="h-16"
                size="md"
              >
                <Activity className="h-5 w-5 mb-2" />
                <span className="text-sm">New League</span>
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => setShowPaymentModal(true)}
                className="h-16"
                size="md"
              >
                <DollarSign className="h-5 w-5 mb-2" />
                <span className="text-sm">Payment Tracker</span>
              </Button>
            </div>
          </Card>
        )}

        {/* Tournaments Section */}
        <DashboardSection
          ref={refs.tournamentsRef}
          title="Tournaments"
          subtitle={`${sortedTournaments.length} total tournament${sortedTournaments.length !== 1 ? 's' : ''}`}
          loading={tournamentsLoading}
          emptyMessage="Create your first tournament to get started!"
          emptyIcon={Trophy}
          actions={[
            <Button 
              key="add-tournament"
              onClick={() => setShowTournamentModal(true)}
              className="touch-target-large"
              size="md"
            >
              <Plus className="h-4 w-4 mr-2" />
              New
            </Button>
          ]}
        >
          <div className="space-y-4">
            <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
              {sortedTournaments.slice(0, visibleTournaments).map((tournament) => (
                <MobileTournamentCard
                  key={tournament.id}
                  tournament={tournament}
                  onView={handleViewTournament}
                  onEdit={handleEditTournament}
                />
              ))}
            </div>
            
            {sortedTournaments.length > visibleTournaments && (
              <div className="text-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => setVisibleTournaments(prev => prev + (isMobile ? 3 : 6))}
                  className="touch-target-large"
                >
                  Load More ({Math.min(isMobile ? 3 : 6, sortedTournaments.length - visibleTournaments)} more)
                </Button>
              </div>
            )}
            
            {sortedTournaments.length > (isMobile ? 3 : 6) && (
              <div className="text-center text-sm text-gray-500">
                Showing {Math.min(visibleTournaments, sortedTournaments.length)} of {sortedTournaments.length} tournaments
              </div>
            )}
          </div>
        </DashboardSection>

        {/* Leagues Section */}
        <DashboardSection
          ref={refs.leaguesRef}
          title="Leagues"
          subtitle={`${sortedLeagues.length} total league${sortedLeagues.length !== 1 ? 's' : ''}`}
          loading={leaguesLoading}
          emptyMessage="Create your first league to get started!"
          emptyIcon={Activity}
          actions={[
            <Button 
              key="add-league"
              onClick={() => setShowLeagueModal(true)}
              className="touch-target-large"
              size="md"
            >
              <Plus className="h-4 w-4 mr-2" />
              New
            </Button>
          ]}
        >
          <div className="space-y-4">
            <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
              {sortedLeagues.slice(0, visibleLeagues).map((league) => (
                <MobileLeagueCard
                  key={league.id}
                  league={league}
                  onView={handleViewLeague}
                  onEdit={handleEditLeague}
                />
              ))}
            </div>
            
            {sortedLeagues.length > visibleLeagues && (
              <div className="text-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => setVisibleLeagues(prev => prev + (isMobile ? 3 : 6))}
                  className="touch-target-large"
                >
                  Load More ({Math.min(isMobile ? 3 : 6, sortedLeagues.length - visibleLeagues)} more)
                </Button>
              </div>
            )}
            
            {sortedLeagues.length > (isMobile ? 3 : 6) && (
              <div className="text-center text-sm text-gray-500">
                Showing {Math.min(visibleLeagues, sortedLeagues.length)} of {sortedLeagues.length} leagues
              </div>
            )}
          </div>
        </DashboardSection>

        {/* Members Section */}
        <DashboardSection
          ref={refs.membersRef}
          title="Members"
          subtitle={`${sortedMembers.length} total member${sortedMembers.length !== 1 ? 's' : ''}`}
          loading={membersLoading}
          emptyMessage="Add your first member to get started!"
          emptyIcon={Users}
          actions={[
            <Button 
              key="add-member"
              onClick={() => setShowMemberModal(true)}
              className="touch-target-large"
              size="md"
            >
              <Plus className="h-4 w-4 mr-2" />
              New
            </Button>
          ]}
        >
          <div className="space-y-4">
            <div className={`grid gap-4 ${isMobile ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
              {sortedMembers.slice(0, visibleMembers).map((member) => (
                <MobileMemberCard
                  key={member.id}
                  member={member}
                  onEdit={handleEditMember}
                />
              ))}
            </div>
            
            {sortedMembers.length > visibleMembers && (
              <div className="text-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => setVisibleMembers(prev => prev + (isMobile ? 6 : 12))}
                  className="touch-target-large"
                >
                  Load More ({Math.min(isMobile ? 6 : 12, sortedMembers.length - visibleMembers)} more)
                </Button>
              </div>
            )}
            
            {sortedMembers.length > (isMobile ? 6 : 12) && (
              <div className="text-center text-sm text-gray-500">
                Showing {Math.min(visibleMembers, sortedMembers.length)} of {sortedMembers.length} members
              </div>
            )}
          </div>
        </DashboardSection>

        {/* Floating Action Button (Mobile Only) */}
        {isMobile && !showQuickActions && (
          <button
            onClick={() => setShowQuickActions(true)}
            className="quick-action-fab bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4"
            title="Quick Actions"
          >
            <Plus className="h-6 w-6" />
          </button>
        )}

        {/* All existing modals with enhanced mobile optimization */}
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

        {/* Payment Modal */}
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

            {/* Enhanced Payment Detail Sections */}
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