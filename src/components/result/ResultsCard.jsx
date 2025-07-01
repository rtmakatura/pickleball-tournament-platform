// src/components/result/ResultsCard.jsx - COMPLETE FIXED VERSION
import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Medal, 
  Award, 
  Calendar, 
  Users, 
  MapPin,
  Clock,
  ChevronDown,
  ChevronUp,
  Star,
  Target,
  TrendingUp,
  X,
  Share2,
  Download,
  UserCheck,
  Activity
} from 'lucide-react';

const ResultsCard = ({ 
  result, 
  onClose, 
  showPlayerPerformance = true,
  allowEdit = false,
  onEdit
}) => {
  const [activeTab, setActiveTab] = useState('standings');
  const [expandedTeam, setExpandedTeam] = useState(null);

  // FIXED: Add escape key handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        console.log('🔴 Escape key pressed');
        onClose && onClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!result) {
    console.error('ResultsCard: No result provided');
    return null;
  }

  console.log('🎯 ResultsCard received result:', result);

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-orange-600" />;
      default:
        return (
          <div className="h-5 w-5 rounded-full bg-gray-100 flex items-center justify-center">
            <span className="text-xs font-medium text-gray-600">{rank}</span>
          </div>
        );
    }
  };

  const getEventTypeColor = (type) => {
    switch (type) {
      case 'tournament':
        return 'bg-yellow-100 text-yellow-800';
      case 'league':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // ENHANCED: Get all participants with better organization
  const getAllParticipants = () => {
    console.log('📊 Extracting participants from result type:', result.type);
    
    try {
      if (result.type === 'tournament' && result.divisionResults) {
        // Extract from tournament divisions
        const allParticipants = [];
        
        result.divisionResults.forEach((division, divIndex) => {
          console.log(`🏆 Processing division ${divIndex + 1}:`, division.divisionName);
          
          if (division.participantPlacements && Array.isArray(division.participantPlacements)) {
            division.participantPlacements.forEach(participant => {
              allParticipants.push({
                ...participant,
                divisionName: division.divisionName,
                eventType: division.eventType,
                skillLevel: division.skillLevel,
                displayName: participant.participantName || 'Unknown Member'
              });
            });
          }
        });
        
        console.log('🏆 Tournament participants extracted:', allParticipants.length);
        return allParticipants;
      } 
      
      else if (result.type === 'league' && result.participantPlacements) {
        // Extract from league placements
        const participants = result.participantPlacements.map(participant => ({
          ...participant,
          displayName: participant.participantName || 'Unknown Member'
        }));
        
        console.log('🏐 League participants extracted:', participants.length);
        return participants;
      }
      
      else {
        console.warn('⚠️ Unsupported result structure:', result);
        return [];
      }
    } catch (error) {
      console.error('❌ Error extracting participants:', error);
      return [];
    }
  };

  // ENHANCED: Get participants organized by division for better display
  const getParticipantsByDivision = () => {
    if (result.type === 'tournament' && result.divisionResults) {
      return result.divisionResults.map(division => ({
        ...division,
        participants: division.participantPlacements || []
      }));
    } else if (result.type === 'league') {
      return [{
        divisionName: result.leagueName || 'League Standings',
        participants: result.participantPlacements || []
      }];
    }
    return [];
  };

  // ENHANCED: Better winner extraction
  const getWinnerInfo = () => {
    const participants = getAllParticipants();
    const winner = participants.find(p => p.placement === 1);
    return winner ? winner.displayName : 'TBD';
  };

  // FIXED: Close handler with multiple approaches
  const handleClose = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log('🔴 Close handler called');
    if (onClose && typeof onClose === 'function') {
      onClose();
    }
  };

  const handleShare = async () => {
    const winner = getWinnerInfo();
    const eventName = result.tournamentName || result.leagueName || 'Event';
    const shareData = {
      title: `${eventName} Results`,
      text: `Check out the results! Winner: ${winner}`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
      alert('Results copied to clipboard!');
    }
  };

  const handleExport = () => {
    const participants = getAllParticipants();
    const eventName = result.tournamentName || result.leagueName || 'Event';
    
    const csvData = participants.map((participant, index) => ({
      'Rank': participant.placement || (index + 1),
      'Participant': participant.displayName,
      'Division': participant.divisionName || 'Main',
      'Notes': participant.notes || 'N/A'
    }));

    const csvContent = [
      `Event: ${eventName}`,
      `Type: ${result.type}`,
      `Date: ${new Date(result.completedDate || result.eventDate || Date.now()).toLocaleDateString()}`,
      '',
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${eventName.replace(/\s+/g, '-').toLowerCase()}-results.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const allParticipants = getAllParticipants();
  const participantsByDivision = getParticipantsByDivision();
  const eventName = result.tournamentName || result.leagueName || 'Event Results';

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        // FIXED: Allow backdrop click to close
        if (e.target === e.currentTarget) {
          console.log('🔴 Backdrop clicked');
          handleClose();
        }
      }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              {result.type === 'tournament' ? (
                <Trophy className="h-6 w-6 text-yellow-500" />
              ) : (
                <Activity className="h-6 w-6 text-blue-500" />
              )}
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {eventName}
                </h2>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEventTypeColor(result.type)}`}>
                    {result.type || 'Event'}
                  </span>
                  {result.season && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {result.season}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleShare}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Share results"
            >
              <Share2 className="h-5 w-5" />
            </button>
            <button
              onClick={handleExport}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Export results"
            >
              <Download className="h-5 w-5" />
            </button>
            {allowEdit && (
              <button
                onClick={() => onEdit?.(result)}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Edit
              </button>
            )}
            
            {/* FIXED: Multiple approaches for close button */}
            <div 
              className="p-3 text-gray-400 hover:text-red-600 transition-colors rounded-full hover:bg-gray-100 cursor-pointer relative z-[60]"
              style={{ minWidth: '44px', minHeight: '44px' }}
              onMouseDown={handleClose}
              onClick={handleClose}
              onTouchStart={handleClose}
              role="button"
              tabIndex={0}
              aria-label="Close"
              title="Close"
            >
              <X 
                className="h-6 w-6 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" 
                style={{ pointerEvents: 'none' }}
              />
            </div>
          </div>
        </div>

        {/* Event Details */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center text-gray-600">
              <Calendar className="h-4 w-4 mr-2" />
              {new Date(result.completedDate || result.eventDate || Date.now()).toLocaleDateString()}
            </div>
            <div className="flex items-center text-gray-600">
              <Users className="h-4 w-4 mr-2" />
              {allParticipants.length} participants
            </div>
            {result.type === 'tournament' && result.divisionResults && (
              <div className="flex items-center text-gray-600">
                <Trophy className="h-4 w-4 mr-2" />
                {result.divisionResults.length} divisions
              </div>
            )}
            {result.seasonInfo?.totalWeeks && (
              <div className="flex items-center text-gray-600">
                <Clock className="h-4 w-4 mr-2" />
                {result.seasonInfo.totalWeeks} weeks
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('standings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'standings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Standings
            </button>
            {showPlayerPerformance && result.playerPerformances?.length > 0 && (
              <button
                onClick={() => setActiveTab('performance')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'performance'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Player Insights
              </button>
            )}
          </nav>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[50vh]">
          {activeTab === 'standings' && (
            <div className="p-6">
              {participantsByDivision.length > 0 ? (
                <div className="space-y-6">
                  {participantsByDivision.map((division, divIndex) => (
                    <div key={divIndex} className="border border-gray-200 rounded-lg">
                      {/* ENHANCED: Division Header with Participant Count */}
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Trophy className="h-4 w-4 text-yellow-500 mr-2" />
                            <div>
                              <h3 className="font-medium text-gray-900">
                                {division.divisionName}
                              </h3>
                              {division.eventType && division.skillLevel && (
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {division.eventType} • Skill Level: {division.skillLevel}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span className="flex items-center">
                              <Users className="h-3 w-3 mr-1" />
                              {division.participants.length} participants
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* ENHANCED: Participants Display */}
                      <div className="p-4">
                        {division.participants && division.participants.length > 0 ? (
                          <div className="space-y-3">
                            {/* ENHANCED: Show all participants, sorted by placement */}
                            {division.participants
                              .sort((a, b) => {
                                // Sort by placement, with unplaced participants at the end
                                const aPlace = a.placement || 999;
                                const bPlace = b.placement || 999;
                                return aPlace - bPlace;
                              })
                              .map((participant, participantIndex) => (
                              <div
                                key={participantIndex}
                                className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                                  participant.placement && participant.placement <= 3 
                                    ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200' 
                                    : 'bg-gray-50 border-gray-200'
                                }`}
                              >
                                <div className="flex items-center space-x-4">
                                  <div className="flex items-center justify-center w-10 h-10">
                                    {participant.placement ? (
                                      getRankIcon(participant.placement)
                                    ) : (
                                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                        <UserCheck className="h-4 w-4 text-blue-600" />
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900">
                                      {participant.displayName || participant.participantName || 'Unknown Member'}
                                    </p>
                                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                                      {participant.placement ? (
                                        <span className="font-medium text-gray-700">
                                          {participant.placement}{getOrdinalSuffix(participant.placement)} place
                                        </span>
                                      ) : (
                                        <span className="text-gray-500">Participated</span>
                                      )}
                                      {participant.notes && (
                                        <>
                                          <span>•</span>
                                          <span>{participant.notes}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* ENHANCED: Participant Status Indicator */}
                                <div className="text-right">
                                  {participant.placement ? (
                                    <div className="flex items-center space-x-2">
                                      {participant.placement === 1 && (
                                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                                          Winner
                                        </span>
                                      )}
                                      {participant.placement <= 3 && participant.placement !== 1 && (
                                        <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                                          Podium
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                      Participant
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <p>No participants in this division</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p>No standings available</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="p-6">
              {result.playerPerformances && result.playerPerformances.length > 0 ? (
                <div className="space-y-4">
                  {result.playerPerformances.map((performance, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg">
                      <button
                        onClick={() => setExpandedTeam(expandedTeam === index ? null : index)}
                        className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {performance.playerName?.[0]?.toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900">
                            {performance.playerName}
                          </span>
                        </div>
                        {expandedTeam === index ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </button>

                      {expandedTeam === index && (
                        <div className="p-4 border-t border-gray-200 bg-gray-50">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Strengths */}
                            {performance.strengths && performance.strengths.length > 0 && (
                              <div>
                                <h4 className="flex items-center text-sm font-medium text-gray-700 mb-2">
                                  <Star className="h-4 w-4 text-yellow-500 mr-1" />
                                  Strengths
                                </h4>
                                <ul className="space-y-1">
                                  {performance.strengths.map((strength, i) => (
                                    <li key={i} className="text-sm text-gray-600 flex items-start">
                                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-2 mr-2 flex-shrink-0"></span>
                                      {strength}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Areas for Improvement */}
                            {performance.improvements && performance.improvements.length > 0 && (
                              <div>
                                <h4 className="flex items-center text-sm font-medium text-gray-700 mb-2">
                                  <Target className="h-4 w-4 text-blue-500 mr-1" />
                                  Areas to Improve
                                </h4>
                                <ul className="space-y-1">
                                  {performance.improvements.map((improvement, i) => (
                                    <li key={i} className="text-sm text-gray-600 flex items-start">
                                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 mr-2 flex-shrink-0"></span>
                                      {improvement}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Goals */}
                            {performance.goals && performance.goals.length > 0 && (
                              <div>
                                <h4 className="flex items-center text-sm font-medium text-gray-700 mb-2">
                                  <TrendingUp className="h-4 w-4 text-purple-500 mr-1" />
                                  Goals
                                </h4>
                                <ul className="space-y-1">
                                  {performance.goals.map((goal, i) => (
                                    <li key={i} className="text-sm text-gray-600 flex items-start">
                                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 mr-2 flex-shrink-0"></span>
                                      {goal}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>

                          {/* Notes */}
                          {performance.notes && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Notes</h4>
                              <p className="text-sm text-gray-600">{performance.notes}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p>No player performance data available</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {result.notes && (
          <div className="p-6 bg-gray-50 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Event Notes</h4>
            <p className="text-sm text-gray-600">{result.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function for ordinal suffixes
const getOrdinalSuffix = (num) => {
  if (num % 100 >= 11 && num % 100 <= 13) return 'th';
  switch (num % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
};

export default ResultsCard;