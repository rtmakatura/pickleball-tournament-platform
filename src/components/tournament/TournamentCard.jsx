// src/components/tournament/TournamentCard.jsx
import React from 'react';
import { 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign, 
  Trophy,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Button } from '../ui';
import { TOURNAMENT_STATUS } from '../../services/models';

/**
 * TournamentCard Component - Display tournament information in card format
 * 
 * Props:
 * - tournament: object - Tournament data
 * - members: array - All members for participant lookup
 * - onEdit: function - Called when edit button clicked
 * - onView: function - Called when card is clicked
 * - onRegister: function - Called when register button clicked
 * - currentUserId: string - Current user ID for registration status
 * - compact: boolean - Whether to show compact version
 */
const TournamentCard = ({ 
  tournament, 
  members = [],
  onEdit,
  onView,
  onRegister,
  currentUserId,
  compact = false
}) => {
  // Get tournament participants with member details
  const participants = tournament.participants?.map(id => 
    members.find(m => m.id === id)
  ).filter(Boolean) || [];

  // Check if current user is registered
  const isRegistered = currentUserId && tournament.participants?.includes(currentUserId);

  // Calculate payment status
  const paymentData = tournament.paymentData || {};
  const totalParticipants = participants.length;
  const paidParticipants = participants.filter(p => 
    paymentData[p.id]?.status === 'paid'
  ).length;
  const paymentComplete = totalParticipants > 0 && paidParticipants === totalParticipants;

  // Get status styling
  const getStatusConfig = (status) => {
    switch (status) {
      case TOURNAMENT_STATUS.DRAFT:
        return {
          color: 'bg-gray-100 text-gray-800',
          icon: Clock,
          label: 'Draft'
        };
      case TOURNAMENT_STATUS.REGISTRATION_OPEN:
        return {
          color: 'bg-green-100 text-green-800',
          icon: CheckCircle,
          label: 'Registration Open'
        };
      case TOURNAMENT_STATUS.REGISTRATION_CLOSED:
        return {
          color: 'bg-yellow-100 text-yellow-800',
          icon: AlertCircle,
          label: 'Registration Closed'
        };
      case TOURNAMENT_STATUS.IN_PROGRESS:
        return {
          color: 'bg-blue-100 text-blue-800',
          icon: Trophy,
          label: 'In Progress'
        };
      case TOURNAMENT_STATUS.COMPLETED:
        return {
          color: 'bg-purple-100 text-purple-800',
          icon: Trophy,
          label: 'Completed'
        };
      case TOURNAMENT_STATUS.CANCELLED:
        return {
          color: 'bg-red-100 text-red-800',
          icon: AlertCircle,
          label: 'Cancelled'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800',
          icon: Clock,
          label: status
        };
    }
  };

  const statusConfig = getStatusConfig(tournament.status);
  const StatusIcon = statusConfig.icon;

  // Format date
  const formatDate = (date) => {
    if (!date) return 'TBD';
    const dateObj = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Check if tournament is upcoming
  const isUpcoming = () => {
    if (!tournament.eventDate) return false;
    const eventDate = tournament.eventDate.seconds 
      ? new Date(tournament.eventDate.seconds * 1000)
      : new Date(tournament.eventDate);
    return eventDate > new Date();
  };

  const upcoming = isUpcoming();

  return (
    <div 
      className={`
        bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow
        ${onView ? 'cursor-pointer' : ''} 
        ${compact ? 'p-4' : 'p-6'}
      `}
      onClick={() => onView && onView(tournament)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className={`font-semibold text-gray-900 ${compact ? 'text-base' : 'text-lg'}`}>
            {tournament.name}
          </h3>
          {tournament.description && !compact && (
            <p className="text-sm text-gray-600 mt-1">
              {tournament.description}
            </p>
          )}
        </div>
        
        {/* Status badge */}
        <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
          <StatusIcon className="h-3 w-3 mr-1" />
          {statusConfig.label}
        </div>
      </div>

      {/* Tournament Details */}
      <div className={`space-y-3 ${compact ? 'text-sm' : ''}`}>
        {/* Date and Location */}
        <div className="flex items-center text-gray-600">
          <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
          <span>{formatDate(tournament.eventDate)}</span>
          {upcoming && (
            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              Upcoming
            </span>
          )}
        </div>

        {tournament.location && (
          <div className="flex items-center text-gray-600">
            <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>{tournament.location}</span>
          </div>
        )}

        {/* Participants */}
        <div className="flex items-center text-gray-600">
          <Users className="h-4 w-4 mr-2 flex-shrink-0" />
          <span>
            {totalParticipants} participant{totalParticipants !== 1 ? 's' : ''}
            {tournament.maxParticipants && (
              <span className="text-gray-400"> / {tournament.maxParticipants} max</span>
            )}
          </span>
          {isRegistered && (
            <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
              You're registered
            </span>
          )}
        </div>

        {/* Entry Fee and Payment Status */}
        {tournament.entryFee > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center text-gray-600">
              <DollarSign className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>${tournament.entryFee} entry fee</span>
            </div>
            
            {totalParticipants > 0 && (
              <div className="flex items-center text-sm">
                <span className={`
                  px-2 py-1 rounded text-xs font-medium
                  ${paymentComplete 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                  }
                `}>
                  {paidParticipants}/{totalParticipants} paid
                </span>
              </div>
            )}
          </div>
        )}

        {/* Skill Level */}
        <div className="flex items-center text-gray-600">
          <Trophy className="h-4 w-4 mr-2 flex-shrink-0" />
          <span className="capitalize">{tournament.skillLevel}</span>
        </div>
      </div>

      {/* Participants Preview (non-compact) */}
      {!compact && participants.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Participants</h4>
          <div className="flex flex-wrap gap-2">
            {participants.slice(0, 6).map((participant, index) => (
              <span
                key={participant.id}
                className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded"
              >
                {participant.firstName} {participant.lastName}
              </span>
            ))}
            {participants.length > 6 && (
              <span className="text-xs text-gray-500 px-2 py-1">
                +{participants.length - 6} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 pt-4 border-t flex justify-between items-center">
        <div className="flex space-x-2">
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(tournament);
              }}
            >
              Edit
            </Button>
          )}
          
          {onRegister && tournament.status === TOURNAMENT_STATUS.REGISTRATION_OPEN && (
            <Button
              size="sm"
              variant={isRegistered ? "outline" : "primary"}
              onClick={(e) => {
                e.stopPropagation();
                onRegister(tournament);
              }}
            >
              {isRegistered ? 'Unregister' : 'Register'}
            </Button>
          )}
        </div>

        {/* Registration deadline countdown */}
        {tournament.registrationDeadline && upcoming && (
          <div className="text-xs text-gray-500">
            Deadline: {formatDate(tournament.registrationDeadline)}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * TournamentCardGrid Component - For displaying multiple tournament cards
 */
export const TournamentCardGrid = ({ 
  tournaments = [], 
  members = [],
  onEdit,
  onView,
  onRegister,
  currentUserId,
  loading = false,
  emptyMessage = "No tournaments found"
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border rounded-lg p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (tournaments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tournaments.map((tournament) => (
        <TournamentCard
          key={tournament.id}
          tournament={tournament}
          members={members}
          onEdit={onEdit}
          onView={onView}
          onRegister={onRegister}
          currentUserId={currentUserId}
        />
      ))}
    </div>
  );
};

export default TournamentCard;