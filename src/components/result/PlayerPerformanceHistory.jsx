import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Calendar, 
  Trophy, 
  Medal,
  Award,
  Target,
  Star,
  BarChart3,
  PieChart,
  Activity,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Download
} from 'lucide-react';

const PlayerPerformanceHistory = ({ 
  playerId, 
  playerName, 
  performances = [], 
  results = [],
  onClose,
  showExport = true 
}) => {
  const [viewMode, setViewMode] = useState('timeline'); // timeline, stats, trends
  const [filterPeriod, setFilterPeriod] = useState('all'); // all, 6months, 3months, 1month
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 5;

  // Filter performances by period
  const filteredPerformances = useMemo(() => {
    if (filterPeriod === 'all') return performances;
    
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (filterPeriod) {
      case '6months':
        cutoffDate.setMonth(now.getMonth() - 6);
        break;
      case '3months':
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case '1month':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      default:
        return performances;
    }
    
    return performances.filter(p => new Date(p.date || p.createdAt) >= cutoffDate);
  }, [performances, filterPeriod]);

  // Get player's results from standings
  const playerResults = useMemo(() => {
    return results
      .filter(result => 
        result.standings?.some(standing => 
          standing.playerId === playerId || standing.playerName === playerName
        )
      )
      .map(result => {
        const standing = result.standings.find(s => 
          s.playerId === playerId || s.playerName === playerName
        );
        const rank = result.standings.indexOf(standing) + 1;
        
        return {
          ...result,
          playerRank: rank,
          playerScore: standing?.score,
          playerRecord: standing?.record,
          totalParticipants: result.standings.length
        };
      })
      .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
  }, [results, playerId, playerName]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalEvents = playerResults.length;
    const wins = playerResults.filter(r => r.playerRank === 1).length;
    const podiums = playerResults.filter(r => r.playerRank <= 3).length;
    const avgRank = totalEvents > 0 
      ? playerResults.reduce((sum, r) => sum + r.playerRank, 0) / totalEvents 
      : 0;

    // Performance trends
    const recentResults = playerResults.slice(0, 5);
    const olderResults = playerResults.slice(5, 10);
    
    const recentAvgRank = recentResults.length > 0 
      ? recentResults.reduce((sum, r) => sum + r.playerRank, 0) / recentResults.length 
      : 0;
    const olderAvgRank = olderResults.length > 0 
      ? olderResults.reduce((sum, r) => sum + r.playerRank, 0) / olderResults.length 
      : 0;

    let trend = 'stable';
    if (recentAvgRank < olderAvgRank - 0.5) trend = 'improving';
    if (recentAvgRank > olderAvgRank + 0.5) trend = 'declining';

    // Most common strengths and improvements
    const allStrengths = filteredPerformances.flatMap(p => p.strengths || []);
    const allImprovements = filteredPerformances.flatMap(p => p.improvements || []);
    
    const strengthCounts = {};
    const improvementCounts = {};
    
    allStrengths.forEach(s => strengthCounts[s] = (strengthCounts[s] || 0) + 1);
    allImprovements.forEach(i => improvementCounts[i] = (improvementCounts[i] || 0) + 1);
    
    const topStrengths = Object.entries(strengthCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([strength, count]) => ({ strength, count }));
      
    const topImprovements = Object.entries(improvementCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([improvement, count]) => ({ improvement, count }));

    return {
      totalEvents,
      wins,
      podiums,
      avgRank: Math.round(avgRank * 10) / 10,
      winRate: totalEvents > 0 ? Math.round((wins / totalEvents) * 100) : 0,
      podiumRate: totalEvents > 0 ? Math.round((podiums / totalEvents) * 100) : 0,
      trend,
      topStrengths,
      topImprovements
    };
  }, [playerResults, filteredPerformances]);

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 2:
        return <Medal className="h-4 w-4 text-gray-400" />;
      case 3:
        return <Award className="h-4 w-4 text-orange-600" />;
      default:
        return <span className="text-sm font-medium text-gray-600">#{rank}</span>;
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'improving':
        return 'text-green-600 bg-green-50';
      case 'declining':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const handleExport = () => {
    const exportData = {
      player: playerName,
      stats,
      recentResults: playerResults.slice(0, 10).map(r => ({
        event: r.eventTitle,
        type: r.eventType,
        date: new Date(r.date || r.createdAt).toLocaleDateString(),
        rank: r.playerRank,
        participants: r.totalParticipants,
        score: r.playerScore || 'N/A'
      })),
      performances: filteredPerformances.map(p => ({
        event: p.eventTitle,
        date: new Date(p.date || p.createdAt).toLocaleDateString(),
        strengths: p.strengths?.join('; ') || '',
        improvements: p.improvements?.join('; ') || '',
        goals: p.goals?.join('; ') || '',
        notes: p.notes || ''
      }))
    };

    const csvContent = [
      `Player Performance Report: ${playerName}`,
      `Generated: ${new Date().toLocaleDateString()}`,
      '',
      'STATISTICS',
      `Total Events: ${stats.totalEvents}`,
      `Wins: ${stats.wins}`,
      `Podium Finishes: ${stats.podiums}`,
      `Average Rank: ${stats.avgRank}`,
      `Win Rate: ${stats.winRate}%`,
      `Performance Trend: ${stats.trend}`,
      '',
      'RECENT RESULTS',
      'Event,Type,Date,Rank,Participants,Score',
      ...exportData.recentResults.map(r => 
        `${r.event},${r.type},${r.date},${r.rank},${r.participants},${r.score}`
      ),
      '',
      'PERFORMANCE INSIGHTS',
      'Event,Date,Strengths,Areas to Improve,Goals,Notes',
      ...exportData.performances.map(p => 
        `"${p.event}","${p.date}","${p.strengths}","${p.improvements}","${p.goals}","${p.notes}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${playerName.replace(/\s+/g, '-').toLowerCase()}-performance-history.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Pagination for timeline
  const paginatedPerformances = filteredPerformances.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );
  const totalPages = Math.ceil(filteredPerformances.length / itemsPerPage);

  if (!playerId && !playerName) {
    return (
      <div className="text-center py-8">
        <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Player information required</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-lg font-semibold text-blue-600">
                {playerName?.[0]?.toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {playerName}
              </h2>
              <p className="text-sm text-gray-500">Performance History</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {showExport && (
              <button
                onClick={handleExport}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center space-x-1"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
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

        {/* Stats Overview */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.totalEvents}</div>
              <div className="text-xs text-gray-500">Events</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.wins}</div>
              <div className="text-xs text-gray-500">Wins</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.podiums}</div>
              <div className="text-xs text-gray-500">Podiums</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.avgRank}</div>
              <div className="text-xs text-gray-500">Avg Rank</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.winRate}%</div>
              <div className="text-xs text-gray-500">Win Rate</div>
            </div>
            <div className="text-center">
              <div className={`flex items-center justify-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getTrendColor(stats.trend)}`}>
                {getTrendIcon(stats.trend)}
                <span className="capitalize">{stats.trend}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">Trend</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setViewMode('timeline')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                viewMode === 'timeline'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Timeline
            </button>
            <button
              onClick={() => setViewMode('stats')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                viewMode === 'stats'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Insights
            </button>
            <button
              onClick={() => setViewMode('trends')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                viewMode === 'trends'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Results
            </button>
          </nav>

          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Time</option>
              <option value="6months">Last 6 Months</option>
              <option value="3months">Last 3 Months</option>
              <option value="1month">Last Month</option>
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[50vh]">
          {viewMode === 'timeline' && (
            <div className="p-6">
              {paginatedPerformances.length > 0 ? (
                <div className="space-y-6">
                  {paginatedPerformances.map((performance, index) => (
                    <div key={index} className="border-l-4 border-blue-200 pl-6 relative">
                      <div className="absolute -left-2 top-0 w-4 h-4 bg-blue-500 rounded-full"></div>
                      
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900">
                            {performance.eventTitle}
                          </h4>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <Calendar className="h-4 w-4" />
                            {new Date(performance.date || performance.createdAt).toLocaleDateString()}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {performance.strengths && performance.strengths.length > 0 && (
                            <div>
                              <h5 className="flex items-center text-sm font-medium text-gray-700 mb-2">
                                <Star className="h-4 w-4 text-yellow-500 mr-1" />
                                Strengths
                              </h5>
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

                          {performance.improvements && performance.improvements.length > 0 && (
                            <div>
                              <h5 className="flex items-center text-sm font-medium text-gray-700 mb-2">
                                <Target className="h-4 w-4 text-blue-500 mr-1" />
                                Areas to Improve
                              </h5>
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

                          {performance.goals && performance.goals.length > 0 && (
                            <div>
                              <h5 className="flex items-center text-sm font-medium text-gray-700 mb-2">
                                <TrendingUp className="h-4 w-4 text-purple-500 mr-1" />
                                Goals
                              </h5>
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

                        {performance.notes && (
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <p className="text-sm text-gray-600">{performance.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                        disabled={currentPage === 0}
                        className="flex items-center space-x-1 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span>Previous</span>
                      </button>
                      
                      <span className="text-sm text-gray-500">
                        Page {currentPage + 1} of {totalPages}
                      </span>
                      
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                        disabled={currentPage === totalPages - 1}
                        className="flex items-center space-x-1 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span>Next</span>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p>No performance data for this period</p>
                </div>
              )}
            </div>
          )}

          {viewMode === 'stats' && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Top Strengths */}
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="flex items-center text-lg font-medium text-gray-900 mb-4">
                    <Star className="h-5 w-5 text-yellow-500 mr-2" />
                    Most Common Strengths
                  </h4>
                  {stats.topStrengths.length > 0 ? (
                    <div className="space-y-3">
                      {stats.topStrengths.map(({ strength, count }, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">{strength}</span>
                          <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">
                            {count} times
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No strengths recorded yet</p>
                  )}
                </div>

                {/* Top Improvements */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="flex items-center text-lg font-medium text-gray-900 mb-4">
                    <Target className="h-5 w-5 text-blue-500 mr-2" />
                    Most Common Focus Areas
                  </h4>
                  {stats.topImprovements.length > 0 ? (
                    <div className="space-y-3">
                      {stats.topImprovements.map(({ improvement, count }, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">{improvement}</span>
                          <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
                            {count} times
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No improvement areas recorded yet</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {viewMode === 'trends' && (
            <div className="p-6">
              {playerResults.length > 0 ? (
                <div className="space-y-4">
                  {playerResults.slice(0, 10).map((result, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-10 h-10">
                          {getRankIcon(result.playerRank)}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {result.eventTitle}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {result.eventType} • {new Date(result.date || result.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {result.playerRank} of {result.totalParticipants}
                        </p>
                        {result.playerScore && (
                          <p className="text-sm text-gray-500">
                            {result.playerScore}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p>No competition results found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerPerformanceHistory;