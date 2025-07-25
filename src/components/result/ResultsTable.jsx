// src/components/result/ResultsTable.jsx - UPDATED FOR TEAMS
import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Trophy, 
  Medal, 
  Award,
  Calendar,
  Users,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  UserCheck
} from 'lucide-react';

const ResultsTable = ({ 
  results = [], 
  onResultClick, 
  showExport = true,
  title = "Results History" 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, tournament, league
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);

  // Filter and sort results
  const filteredAndSortedResults = useMemo(() => {
    let filtered = results.filter(result => {
      const eventTitle = result.tournamentName || result.leagueName || result.eventTitle || '';
      const matchesSearch = eventTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           result.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           result.season?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = filterType === 'all' || result.type === filterType;
      
      return matchesSearch && matchesType;
    });

    // Sort results
    filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === 'date') {
        aVal = new Date(a.completedDate || a.date || a.createdAt);
        bVal = new Date(b.completedDate || b.date || b.createdAt);
      } else if (sortField === 'participants') {
        aVal = getParticipantCount(a);
        bVal = getParticipantCount(b);
      } else if (sortField === 'eventTitle') {
        aVal = a.tournamentName || a.leagueName || a.eventTitle || '';
        bVal = b.tournamentName || b.leagueName || b.eventTitle || '';
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [results, searchTerm, filterType, sortField, sortDirection]);

  // Helper function to get participant count from different result structures
  const getParticipantCount = (result) => {
    if (result.type === 'tournament' && result.divisionResults) {
      return result.divisionResults.reduce((total, division) => 
        total + (division.participantPlacements?.length || 0), 0
      );
    } else if (result.type === 'league' && result.participantPlacements) {
      return result.participantPlacements.length;
    } else if (result.teamStandings) {
      // Legacy team format
      return result.teamStandings.length;
    } else if (result.standings) {
      // Legacy individual format
      return result.standings.length;
    }
    return 0;
  };

  // Helper function to get winner information with deleted user handling
  const getWinnerInfo = (result) => {
    if (result.type === 'tournament' && result.divisionResults) {
      // Get winner from first division or overall winner
      const firstDivision = result.divisionResults[0];
      if (firstDivision?.participantPlacements?.length > 0) {
        const winner = firstDivision.participantPlacements.find(p => p.placement === 1);
        return winner ? (winner.participantName || 'Former Member') : 'TBD';
      }
    } else if (result.type === 'league' && result.participantPlacements) {
      const winner = result.participantPlacements.find(p => p.placement === 1);
      return winner ? (winner.participantName || 'Former Member') : 'TBD';
    } else if (result.teamStandings) {
      // Legacy team format
      const winner = result.teamStandings.find(team => team.position === 1) || result.teamStandings[0];
      if (winner) {
        return winner.teamName || `${winner.player1Name || 'Former Member'} / ${winner.player2Name || 'Former Member'}`;
      }
    } else if (result.standings) {
      // Legacy individual format
      const winner = result.standings[0];
      if (winner) {
        return winner.playerName || winner.memberName || 'Former Member';
      }
    }
    return 'TBD';
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleExport = () => {
    const csvData = filteredAndSortedResults.map(result => ({
      'Event': result.tournamentName || result.leagueName || result.eventTitle || 'Unknown',
      'Type': result.type || 'Unknown',
      'Season': result.season || 'N/A',
      'Date': new Date(result.completedDate || result.date || result.createdAt).toLocaleDateString(),
      'Participants': getParticipantCount(result),
      'Winner': getWinnerInfo(result)
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pickleball-results-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getEventIcon = (type) => {
    switch (type) {
      case 'tournament':
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 'league':
        return <Medal className="h-4 w-4 text-blue-500" />;
      default:
        return <Award className="h-4 w-4 text-gray-500" />;
    }
  };

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

  const SortButton = ({ field, children }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center space-x-1 hover:text-blue-600 transition-colors"
    >
      <span>{children}</span>
      {sortField === field && (
        sortDirection === 'asc' ? 
        <ChevronUp className="h-4 w-4" /> : 
        <ChevronDown className="h-4 w-4" />
      )}
    </button>
  );

  if (results.length === 0) {
    return (
      <div className="text-center py-8">
        <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No results to display yet</p>
        <p className="text-sm text-gray-400">Complete some tournaments or leagues to see results here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-1 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </button>
          
          {showExport && (
            <button
              onClick={handleExport}
              className="flex items-center space-x-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search events..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Events</option>
              <option value="tournament">Tournaments</option>
              <option value="league">Leagues</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterType('all');
                setSortField('date');
                setSortDirection('desc');
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Desktop Table */}
      <div className="hidden lg:block overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="eventTitle">Event</SortButton>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Season
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="date">Date</SortButton>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="participants">Participants</SortButton>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Winner
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSortedResults.map((result, index) => (
              <tr key={result.id || index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {getEventIcon(result.type)}
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">
                        {result.tournamentName || result.leagueName || result.eventTitle || 'Unknown Event'}
                      </div>
                      <div className="text-sm text-gray-500 capitalize">
                        {result.type || 'Event'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {result.season || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                    {new Date(result.completedDate || result.date || result.createdAt).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 text-gray-400 mr-1" />
                    {getParticipantCount(result)}
                    {result.type === 'tournament' && result.divisionResults && (
                      <span className="ml-1 text-xs text-gray-500">
                        ({result.divisionResults.length} div)
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Trophy className="h-4 w-4 text-yellow-500 mr-2" />
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        {getWinnerInfo(result)}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => onResultClick?.(result)}
                    className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                  >
                    <span>View</span>
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-4">
        {filteredAndSortedResults.map((result, index) => (
          <div 
            key={result.id || index}
            className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                {getEventIcon(result.type)}
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {result.tournamentName || result.leagueName || result.eventTitle || 'Unknown Event'}
                  </h4>
                  <p className="text-xs text-gray-500 capitalize">
                    {result.type || 'Event'} • {result.season || 'No Season'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onResultClick?.(result)}
                className="text-blue-600 hover:text-blue-900 flex-shrink-0"
              >
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm mb-3">
              <div className="flex items-center text-gray-600">
                <Calendar className="h-4 w-4 mr-1" />
                {new Date(result.completedDate || result.date || result.createdAt).toLocaleDateString()}
              </div>
              <div className="flex items-center text-gray-600">
                <Users className="h-4 w-4 mr-1" />
                {getParticipantCount(result)} participants
                {result.type === 'tournament' && result.divisionResults && (
                  <span className="ml-1 text-xs">({result.divisionResults.length} div)</span>
                )}
              </div>
            </div>
            
            <div className="pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Trophy className="h-4 w-4 text-yellow-500 mr-2" />
                  <span className="text-sm font-medium text-gray-900">
                    {getWinnerInfo(result)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Results Summary */}
      <div className="mt-6 text-sm text-gray-500 text-center">
        Showing {filteredAndSortedResults.length} of {results.length} results
      </div>
    </div>
  );
};

export default ResultsTable;