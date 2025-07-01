// src/components/result/ResultsCard.jsx - UPDATED FOR TEAMS
import React, { useState } from 'react';
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
  UserCheck
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

  if (!result) return null;

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

  const handleShare = async () => {
    const winner = getWinnerInfo();
    const shareData = {
      title: `${result.eventTitle || 'Event'} Results`,
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
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
      alert('Results copied to clipboard!');
    }
  };

  const handleExport = () => {
    const csvData = getAllTeams().map((team, index) => ({
      'Rank': index + 1,
      'Team': team.teamName || `${team.player1Name} / ${team.player2Name}`,
      'Player 1': team.player1Name || 'N/A',
      'Player 2': team.player2Name || 'N/A',
      'Points': team.points || 'N/A',
      'Wins': team.wins || 'N/A',
      'Losses': team.losses || 'N/A',
      'Games': team.gamesPlayed || 'N/A'
    }));

    const eventTitle = result.tournamentName || result.leagueName || result.eventTitle || 'Event';
    const eventType = result.type || 'Results';
    
    const csvContent = [
      `Event: ${eventTitle}`,
      `Type: ${eventType}`,
      `Date: ${new Date(result.completedDate || result.date || result.createdAt).toLocaleDateString()}`,
      '',
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${eventTitle.replace(/\s+/g, '-').toLowerCase()}-results.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Helper function to get all teams from different result structures
  const getAllTeams = () => {
    if (result.type === 'tournament' && result.divisionResults) {
      // Tournament results with divisions
      return result.divisionResults.flatMap(division => 
        (division.teamStandings || []).map(team => ({
          ...team,
          divisionName: division.divisionName
        }))
      );
    } else if (result.type === 'league' && result.teamStandings) {
      // League results
      return result.teamStandings;
    } else if (result.standings) {
      // Legacy format - treat as individual players forming teams
      return result.standings.map((standing, index) => ({
        teamName: standing.playerName || standing.memberName,
        player1Name: standing.playerName || standing.memberName,
        player2Name: '',
        position: index + 1,
        points: standing.points || 0,
        wins: standing.wins || 0,
        losses: standing.losses || 0,
        gamesPlayed: standing.gamesPlayed || 0
      }));
    }
    return [];
  };

  // Helper function to get winner information
  const getWinnerInfo = () => {
    const teams = getAllTeams();
    if (teams.length === 0) return 'TBD';
    
    const winner = teams.find(team => team.position === 1) || teams[0];
    return winner.teamName || `${winner.player1Name}${winner.player2Name ? ` / ${winner.player2Name}` : ''}`;
  };

  // Helper function to calculate win percentage
  const calculateWinPercentage = (wins, gamesPlayed) => {
    if (gamesPlayed === 0) return '0.0';
    return ((wins / gamesPlayed) * 100).toFixed(1);
  };

  const allTeams = getAllTeams();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              {result.type === 'tournament' ? (
                <Trophy className="h-6 w-6 text-yellow-500" />
              ) : (
                <Medal className="h-6 w-6 text-blue-500" />
              )}
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {result.tournamentName || result.leagueName || result.eventTitle || 'Event Results'}
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
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Event Details */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center text-gray-600">
              <Calendar className="h-4 w-4 mr-2" />
              {new Date(result.completedDate || result.date || result.createdAt).toLocaleDateString()}
            </div>
            <div className="flex items-center text-gray-600">
              <Users className="h-4 w-4 mr-2" />
              {allTeams.length} teams
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
              Team Standings
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
              {result.type === 'tournament' && result.divisionResults ? (
                // Tournament with divisions
                <div className="space-y-6">
                  {result.divisionResults.map((division, divIndex) => (
                    <div key={divIndex} className="border border-gray-200 rounded-lg">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                        <h3 className="font-medium text-gray-900 flex items-center">
                          <Trophy className="h-4 w-4 text-yellow-500 mr-2" />
                          {division.divisionName}
                          <span className="ml-2 text-sm text-gray-500">
                            ({division.teamStandings?.length || 0} teams)
                          </span>
                        </h3>
                      </div>
                      <div className="p-4">
                        {division.teamStandings && division.teamStandings.length > 0 ? (
                          <div className="space-y-3">
                            {division.teamStandings.map((team, teamIndex) => (
                              <div
                                key={teamIndex}
                                className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                                  team.position <= 3 
                                    ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200' 
                                    : 'bg-gray-50 border-gray-200'
                                }`}
                              >
                                <div className="flex items-center space-x-4">
                                  <div className="flex items-center justify-center w-10 h-10">
                                    {getRankIcon(team.position)}
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900">
                                      {team.teamName || `${team.player1Name} / ${team.player2Name}`}
                                    </p>
                                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                                      <span className="flex items-center">
                                        <UserCheck className="h-3 w-3 mr-1" />
                                        {team.player1Name}
                                      </span>
                                      {team.player2Name && (
                                        <span className="flex items-center">
                                          <UserCheck className="h-3 w-3 mr-1" />
                                          {team.player2Name}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="text-right">
                                  <div className="flex items-center space-x-4 text-sm">
                                    {team.points > 0 && (
                                      <div className="text-center">
                                        <div className="font-semibold text-gray-900">{team.points}</div>
                                        <div className="text-xs text-gray-500">pts</div>
                                      </div>
                                    )}
                                    <div className="text-center">
                                      <div className="font-semibold text-gray-900">{team.wins}-{team.losses}</div>
                                      <div className="text-xs text-gray-500">W-L</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="font-semibold text-gray-900">
                                        {calculateWinPercentage(team.wins, team.gamesPlayed)}%
                                      </div>
                                      <div className="text-xs text-gray-500">Win Rate</div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-gray-500">
                            No teams in this division
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : allTeams.length > 0 ? (
                // League or legacy format
                <div className="space-y-3">
                  {allTeams.map((team, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                        team.position <= 3 
                          ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200' 
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-10 h-10">
                          {getRankIcon(team.position)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {team.teamName || `${team.player1Name}${team.player2Name ? ` / ${team.player2Name}` : ''}`}
                          </p>
                          {team.player2Name && (
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span className="flex items-center">
                                <UserCheck className="h-3 w-3 mr-1" />
                                {team.player1Name}
                              </span>
                              <span className="flex items-center">
                                <UserCheck className="h-3 w-3 mr-1" />
                                {team.player2Name}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center space-x-4 text-sm">
                          {team.points > 0 && (
                            <div className="text-center">
                              <div className="font-semibold text-gray-900">{team.points}</div>
                              <div className="text-xs text-gray-500">pts</div>
                            </div>
                          )}
                          <div className="text-center">
                            <div className="font-semibold text-gray-900">{team.wins}-{team.losses}</div>
                            <div className="text-xs text-gray-500">W-L</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-gray-900">
                              {calculateWinPercentage(team.wins, team.gamesPlayed)}%
                            </div>
                            <div className="text-xs text-gray-500">Win Rate</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p>No team standings available</p>
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

export default ResultsCard;