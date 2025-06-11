// src/hooks/useResults.js (UPDATED - Division Support)
import { useState, useEffect } from 'react';
import firebaseOps from '../services/firebaseOperations';
import { createEventResults, createParticipantResult, RESULT_STATUS } from '../services/models';

/**
 * useResults Hook - Manages results data for tournaments and leagues with division support
 * UPDATED: Now supports division-specific results for tournaments
 * 
 * Props:
 * - eventId: string - ID of the event (tournament or league)
 * - eventType: string - 'tournament' or 'league'
 * - divisionId: string - ID of the division (for tournaments with divisions)
 * - options: object - Configuration options
 */
export const useResults = (eventId, eventType = 'tournament', divisionId = null, options = {}) => {
  const { realTime = true, autoLoad = true } = options;
  
  const [results, setResults] = useState(null);
  const [allResults, setAllResults] = useState([]); // For tournament with multiple divisions
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (autoLoad && eventId) {
      if (divisionId) {
        loadDivisionResults();
      } else {
        loadResults();
      }
    }
  }, [eventId, eventType, divisionId, autoLoad]);

  /**
   * Load results for an event (legacy or league)
   */
  const loadResults = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const existingResults = await firebaseOps.getAll('eventResults', { 
        eventId, 
        eventType 
      });
      
      if (existingResults.length > 0) {
        setResults(existingResults[0]);
        
        if (realTime) {
          const unsubscribe = firebaseOps.subscribeToDoc(
            'eventResults', 
            existingResults[0].id, 
            setResults
          );
          return () => unsubscribe();
        }
      } else {
        setResults(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * NEW: Load results for a specific division
   */
  const loadDivisionResults = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const existingResults = await firebaseOps.getAll('eventResults', { 
        eventId, 
        eventType,
        divisionId 
      });
      
      if (existingResults.length > 0) {
        setResults(existingResults[0]);
        
        if (realTime) {
          const unsubscribe = firebaseOps.subscribeToDoc(
            'eventResults', 
            existingResults[0].id, 
            setResults
          );
          return () => unsubscribe();
        }
      } else {
        setResults(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * NEW: Load all results for a tournament (all divisions)
   */
  const loadAllTournamentResults = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const allTournamentResults = await firebaseOps.getAll('eventResults', { 
        eventId, 
        eventType: 'tournament'
      });
      
      setAllResults(allTournamentResults);
      
      if (realTime) {
        // Set up listeners for all results
        const unsubscribes = allTournamentResults.map(result => 
          firebaseOps.subscribeToDoc('eventResults', result.id, (updatedResult) => {
            setAllResults(prev => prev.map(r => 
              r.id === updatedResult.id ? updatedResult : r
            ));
          })
        );
        
        return () => unsubscribes.forEach(unsub => unsub());
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Create initial results structure for an event or division
   */
  const createResultsForEvent = async (event, participantIds = [], division = null) => {
    setLoading(true);
    setError(null);
    
    try {
      // Create participant results
      const participantResults = participantIds.map(participantId => 
        createParticipantResult({
          participantId,
          placement: null,
          prizeAmount: 0,
          gamesWon: 0,
          gamesLost: 0,
          pointsFor: 0,
          pointsAgainst: 0,
          awards: [],
          notes: '',
          confirmed: false
        })
      );

      // Create event results
      const eventResults = createEventResults({
        eventId: event.id,
        eventType,
        divisionId: division?.id || null,
        divisionName: division?.name || '',
        status: RESULT_STATUS.DRAFT,
        participantResults,
        totalPrizeMoney: 0,
        totalGamesPlayed: 0,
        enteredBy: null
      });

      const resultsId = await firebaseOps.create('eventResults', eventResults);
      const newResults = { ...eventResults, id: resultsId };
      
      if (division) {
        setResults(newResults);
      } else {
        setResults(newResults);
      }
      
      return newResults;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * NEW: Create results for a specific division
   */
  const createDivisionResults = async (tournament, division) => {
    if (!division.participants || division.participants.length === 0) {
      throw new Error('Division has no participants');
    }
    
    return createResultsForEvent(tournament, division.participants, division);
  };

  /**
   * NEW: Create results for all divisions in a tournament
   */
  const createAllDivisionResults = async (tournament) => {
    if (!tournament.divisions || tournament.divisions.length === 0) {
      throw new Error('Tournament has no divisions');
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const createdResults = [];
      
      for (const division of tournament.divisions) {
        if (division.participants && division.participants.length > 0) {
          const divisionResults = await createDivisionResults(tournament, division);
          createdResults.push(divisionResults);
        }
      }
      
      setAllResults(createdResults);
      return createdResults;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update results
   */
  const updateResults = async (resultsId, updates) => {
    setError(null);
    
    try {
      await firebaseOps.update('eventResults', resultsId, updates);
      
      if (!realTime && results) {
        setResults(prev => ({ ...prev, ...updates }));
      }
      
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  /**
   * Update a specific participant's results
   */
  const updateParticipantResult = async (resultsId, participantId, updates) => {
    if (!results) throw new Error('No results loaded');
    
    const updatedParticipantResults = results.participantResults.map(result =>
      result.participantId === participantId
        ? { ...result, ...updates }
        : result
    );

    // Recalculate totals
    const totalPrizeMoney = updatedParticipantResults.reduce(
      (sum, r) => sum + (r.prizeAmount || 0), 0
    );
    
    const totalGamesPlayed = updatedParticipantResults.reduce(
      (sum, r) => sum + (r.gamesWon || 0) + (r.gamesLost || 0), 0
    );

    return updateResults(resultsId, {
      participantResults: updatedParticipantResults,
      totalPrizeMoney,
      totalGamesPlayed
    });
  };

  /**
   * Publish results (make them official)
   */
  const publishResults = async (resultsId) => {
    if (!results) throw new Error('No results loaded');
    
    const updates = {
      status: RESULT_STATUS.CONFIRMED,
      publishedAt: new Date(),
      sharedWithParticipants: true
    };
    
    await updateResults(resultsId, updates);
    
    // TODO: Send notifications to participants
    // TODO: Update member statistics
    
    return true;
  };

  /**
   * NEW: Publish all division results for a tournament
   */
  const publishAllDivisionResults = async () => {
    if (!allResults || allResults.length === 0) {
      throw new Error('No division results to publish');
    }
    
    setLoading(true);
    try {
      const publishPromises = allResults.map(result => 
        publishResults(result.id)
      );
      
      await Promise.all(publishPromises);
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Add award to participant
   */
  const addAward = async (resultsId, participantId, award) => {
    if (!results) throw new Error('No results loaded');
    
    const participant = results.participantResults.find(
      r => r.participantId === participantId
    );
    
    if (!participant) throw new Error('Participant not found');
    
    const updatedAwards = [...participant.awards, award];
    
    return updateParticipantResult(resultsId, participantId, {
      awards: updatedAwards
    });
  };

  /**
   * Remove award from participant
   */
  const removeAward = async (resultsId, participantId, awardIndex) => {
    if (!results) throw new Error('No results loaded');
    
    const participant = results.participantResults.find(
      r => r.participantId === participantId
    );
    
    if (!participant) throw new Error('Participant not found');
    
    const updatedAwards = participant.awards.filter((_, index) => index !== awardIndex);
    
    return updateParticipantResult(resultsId, participantId, {
      awards: updatedAwards
    });
  };

  /**
   * Confirm participant results (by the participant themselves)
   */
  const confirmParticipantResult = async (resultsId, participantId) => {
    return updateParticipantResult(resultsId, participantId, {
      confirmed: true,
      confirmedAt: new Date()
    });
  };

  /**
   * Get results statistics
   */
  const getResultsStats = () => {
    if (!results) return null;
    
    const { participantResults } = results;
    const totalParticipants = participantResults.length;
    const placedParticipants = participantResults.filter(r => r.placement !== null).length;
    const confirmedResults = participantResults.filter(r => r.confirmed).length;
    const totalPrizeMoney = participantResults.reduce((sum, r) => sum + (r.prizeAmount || 0), 0);
    const totalAwards = participantResults.reduce((sum, r) => sum + r.awards.length, 0);
    
    return {
      totalParticipants,
      placedParticipants,
      unplacedParticipants: totalParticipants - placedParticipants,
      confirmedResults,
      pendingConfirmations: totalParticipants - confirmedResults,
      totalPrizeMoney,
      totalAwards,
      completionPercentage: totalParticipants > 0 
        ? (placedParticipants / totalParticipants * 100).toFixed(1)
        : 0,
      confirmationPercentage: totalParticipants > 0
        ? (confirmedResults / totalParticipants * 100).toFixed(1)
        : 0
    };
  };

  /**
   * NEW: Get combined statistics for all division results
   */
  const getAllDivisionStats = () => {
    if (!allResults || allResults.length === 0) return null;
    
    const combinedStats = allResults.reduce((acc, result) => {
      const stats = getResultsStatsForResult(result);
      return {
        totalParticipants: acc.totalParticipants + stats.totalParticipants,
        placedParticipants: acc.placedParticipants + stats.placedParticipants,
        confirmedResults: acc.confirmedResults + stats.confirmedResults,
        totalPrizeMoney: acc.totalPrizeMoney + stats.totalPrizeMoney,
        totalAwards: acc.totalAwards + stats.totalAwards,
        totalDivisions: acc.totalDivisions + 1
      };
    }, {
      totalParticipants: 0,
      placedParticipants: 0,
      confirmedResults: 0,
      totalPrizeMoney: 0,
      totalAwards: 0,
      totalDivisions: 0
    });
    
    return {
      ...combinedStats,
      unplacedParticipants: combinedStats.totalParticipants - combinedStats.placedParticipants,
      pendingConfirmations: combinedStats.totalParticipants - combinedStats.confirmedResults,
      completionPercentage: combinedStats.totalParticipants > 0 
        ? (combinedStats.placedParticipants / combinedStats.totalParticipants * 100).toFixed(1)
        : 0,
      confirmationPercentage: combinedStats.totalParticipants > 0
        ? (combinedStats.confirmedResults / combinedStats.totalParticipants * 100).toFixed(1)
        : 0,
      divisionResults: allResults.map(result => ({
        divisionId: result.divisionId,
        divisionName: result.divisionName,
        stats: getResultsStatsForResult(result)
      }))
    };
  };

  /**
   * Helper: Get stats for a specific result object
   */
  const getResultsStatsForResult = (result) => {
    const { participantResults } = result;
    const totalParticipants = participantResults.length;
    const placedParticipants = participantResults.filter(r => r.placement !== null).length;
    const confirmedResults = participantResults.filter(r => r.confirmed).length;
    const totalPrizeMoney = participantResults.reduce((sum, r) => sum + (r.prizeAmount || 0), 0);
    const totalAwards = participantResults.reduce((sum, r) => sum + r.awards.length, 0);
    
    return {
      totalParticipants,
      placedParticipants,
      unplacedParticipants: totalParticipants - placedParticipants,
      confirmedResults,
      pendingConfirmations: totalParticipants - confirmedResults,
      totalPrizeMoney,
      totalAwards,
      completionPercentage: totalParticipants > 0 
        ? (placedParticipants / totalParticipants * 100).toFixed(1)
        : 0,
      confirmationPercentage: totalParticipants > 0
        ? (confirmedResults / totalParticipants * 100).toFixed(1)
        : 0
    };
  };

  /**
   * NEW: Get results for a specific division by ID
   */
  const getDivisionResults = (divisionId) => {
    return allResults?.find(result => result.divisionId === divisionId) || null;
  };

  /**
   * Export results data
   */
  const exportResults = (format = 'json') => {
    const targetResults = results || allResults;
    if (!targetResults) return null;
    
    // Handle single result
    if (results) {
      const exportData = {
        event: {
          id: results.eventId,
          type: results.eventType,
          division: results.divisionId ? {
            id: results.divisionId,
            name: results.divisionName
          } : null
        },
        results: results.participantResults,
        summary: getResultsStats(),
        exportedAt: new Date().toISOString()
      };
      
      return format === 'csv' ? convertToCSV(exportData) : JSON.stringify(exportData, null, 2);
    }
    
    // Handle multiple division results
    if (allResults && allResults.length > 0) {
      const exportData = {
        event: {
          id: allResults[0].eventId,
          type: allResults[0].eventType
        },
        divisions: allResults.map(result => ({
          divisionId: result.divisionId,
          divisionName: result.divisionName,
          results: result.participantResults,
          summary: getResultsStatsForResult(result)
        })),
        combinedSummary: getAllDivisionStats(),
        exportedAt: new Date().toISOString()
      };
      
      return format === 'csv' ? convertDivisionResultsToCSV(exportData) : JSON.stringify(exportData, null, 2);
    }
    
    return null;
  };

  /**
   * Convert results to CSV format
   */
  const convertToCSV = (data) => {
    const headers = [
      'Participant ID',
      'Placement',
      'Prize Amount',
      'Games Won',
      'Games Lost',
      'Win Percentage',
      'Points For',
      'Points Against',
      'Awards',
      'Notes',
      'Confirmed'
    ];
    
    const rows = data.results.map(result => [
      result.participantId,
      result.placement || 'Unplaced',
      result.prizeAmount || 0,
      result.gamesWon || 0,
      result.gamesLost || 0,
      result.gamesWon + result.gamesLost > 0 
        ? ((result.gamesWon / (result.gamesWon + result.gamesLost)) * 100).toFixed(1) + '%'
        : '0%',
      result.pointsFor || 0,
      result.pointsAgainst || 0,
      result.awards.map(a => a.title || a.type).join('; '),
      result.notes || '',
      result.confirmed ? 'Yes' : 'No'
    ]);
    
    return [headers, ...rows].map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
  };

  /**
   * NEW: Convert division results to CSV format
   */
  const convertDivisionResultsToCSV = (data) => {
    const headers = [
      'Division ID',
      'Division Name',
      'Participant ID',
      'Placement',
      'Prize Amount',
      'Games Won',
      'Games Lost',
      'Win Percentage',
      'Points For',
      'Points Against',
      'Awards',
      'Notes',
      'Confirmed'
    ];
    
    const rows = [];
    data.divisions.forEach(division => {
      division.results.forEach(result => {
        rows.push([
          division.divisionId,
          division.divisionName,
          result.participantId,
          result.placement || 'Unplaced',
          result.prizeAmount || 0,
          result.gamesWon || 0,
          result.gamesLost || 0,
          result.gamesWon + result.gamesLost > 0 
            ? ((result.gamesWon / (result.gamesWon + result.gamesLost)) * 100).toFixed(1) + '%'
            : '0%',
          result.pointsFor || 0,
          result.pointsAgainst || 0,
          result.awards.map(a => a.title || a.type).join('; '),
          result.notes || '',
          result.confirmed ? 'Yes' : 'No'
        ]);
      });
    });
    
    return [headers, ...rows].map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
  };

  /**
   * Delete results
   */
  const deleteResults = async (resultsId) => {
    setError(null);
    
    try {
      await firebaseOps.remove('eventResults', resultsId);
      
      if (results?.id === resultsId) {
        setResults(null);
      }
      
      if (allResults) {
        setAllResults(prev => prev.filter(r => r.id !== resultsId));
      }
      
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  /**
   * NEW: Delete all division results for a tournament
   */
  const deleteAllDivisionResults = async () => {
    if (!allResults || allResults.length === 0) return true;
    
    setLoading(true);
    try {
      const deletePromises = allResults.map(result => 
        firebaseOps.remove('eventResults', result.id)
      );
      
      await Promise.all(deletePromises);
      setAllResults([]);
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    results,
    allResults,
    loading,
    error,
    
    // CRUD operations
    loadResults,
    loadDivisionResults,
    loadAllTournamentResults,
    createResults: createResultsForEvent,
    createDivisionResults,
    createAllDivisionResults,
    updateResults,
    deleteResults,
    deleteAllDivisionResults,
    
    // Participant-specific operations
    updateParticipantResult,
    confirmParticipantResult,
    
    // Award management
    addAward,
    removeAward,
    
    // Publishing and sharing
    publishResults,
    publishAllDivisionResults,
    
    // Data and statistics
    getResultsStats,
    getAllDivisionStats,
    getDivisionResults,
    exportResults,
    
    // Utility functions
    refreshResults: divisionId ? loadDivisionResults : loadResults,
    clearError: () => setError(null),
    
    // Computed properties
    hasResults: !!results || (allResults && allResults.length > 0),
    isPublished: results?.status === RESULT_STATUS.CONFIRMED,
    isDraft: results?.status === RESULT_STATUS.DRAFT,
    stats: getResultsStats(),
    allStats: getAllDivisionStats()
  };
};

export default useResults;