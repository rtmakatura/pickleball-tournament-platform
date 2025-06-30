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
  Download
} from 'lucide-react';

const ResultsCard = ({ 
  result, 
  onClose, 
  showPlayerPerformance = true,
  allowEdit = false,
  onEdit
}) => {
  const [activeTab, setActiveTab] = useState('standings');
  const [expandedPlayer, setExpandedPlayer] = useState(null);

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
    const shareData = {
      title: `${result.eventTitle} Results`,
      text: `Check out the results from ${result.eventTitle}! Winner: ${result.standings?.[0]?.playerName || 'TBD'}`,
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
    const csvData = result.standings?.map((standing, index) => ({
      'Rank': index + 1,
      'Player': standing.playerName,
      'Score': standing.score || 'N/A',
      'Record': standing.record || 'N/A'
    })) || [];

    const csvContent = [
      `Event: ${result.eventTitle}`,
      `Division: ${result.division || 'N/A'}`,
      `Date: ${new Date(result.date || result.createdAt).toLocaleDateString()}`,
      '',
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.eventTitle.replace(/\s+/g, '-').toLowerCase()}-results.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              {result.eventType === 'tournament' ? (
                <Trophy className="h-6 w-6 text-yellow-500" />
              ) : (
                <Medal className="h-6 w-6 text-blue-500" />
              )}
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {result.eventTitle}
                </h2>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEventTypeColor(result.eventType)}`}>
                    {result.eventType}
                  </span>
                  {result.division && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {result.division}
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
              {new Date(result.date || result.createdAt).toLocaleDateString()}
            </div>
            <div className="flex items-center text-gray-600">
              <Users className="h-4 w-4 mr-2" />
              {result.standings?.length || 0} participants
            </div>
            {result.location && (
              <div className="flex items-center text-gray-600">
                <MapPin className="h-4 w-4 mr-2" />
                {result.location}
              </div>
            )}
            {result.duration && (
              <div className="flex items-center text-gray-600">
                <Clock className="h-4 w-4 mr-2" />
                {result.duration}
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
              {result.standings && result.standings.length > 0 ? (
                <div className="space-y-3">
                  {result.standings.map((standing, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                        index < 3 
                          ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200' 
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-10 h-10">
                          {getRankIcon(index + 1)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {standing.playerName}
                          </p>
                          {standing.record && (
                            <p className="text-sm text-gray-500">
                              Record: {standing.record}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        {standing.score && (
                          <p className="font-semibold text-gray-900">
                            {standing.score}
                          </p>
                        )}
                        {standing.points && (
                          <p className="text-sm text-gray-500">
                            {standing.points} pts
                          </p>
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
                        onClick={() => setExpandedPlayer(expandedPlayer === index ? null : index)}
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
                        {expandedPlayer === index ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </button>

                      {expandedPlayer === index && (
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