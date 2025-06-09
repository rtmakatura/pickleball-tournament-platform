// src/hooks/useResults.js
import { useState, useEffect } from 'react';
import firebaseOps from '../services/firebaseOperations';
import { createEventResults, createParticipantResult, RESULT_STATUS } from '../services/models';

/**
 * useResults Hook - Manages results data for tournaments and leagues
 * 
 * Props:
 * - eventId: string - ID of the event (tournament or league)
 * - eventType: string - 'tournament' or 'league'
 * - realTime: boolean - Whether to use real-time updates
 */
export const useResults = (eventId, eventType = 'tournament', options = {}) => {
  const { realTime = true, autoLoad = true } = options;
  
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (autoLoad && eventId) {
      loadResults();
    }
  }, [eventId, eventType, autoLoad]);

  /**
   * Load results for an event
   */
  const loadResults = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // First, check if results exist for this event
      const existingResults = await firebaseOps.getAll('eventResults', { 
        eventId, 
        eventType 
      });
      
      if (existingResults.length > 0) {
        setResults(existingResults[0]);
        
        // Set up real-time listener if requested
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
   * Create initial results structure for an event
   */
  const createResults = async (event, participantIds = []) => {
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
        status: RESULT_STATUS.DRAFT,
        participantResults,
        totalPrizeMoney: 0,
        totalGamesPlayed: 0,
        enteredBy: null // Will be set by the component
      });

      const resultsId = await firebaseOps.create('eventResults', eventResults);
      const newResults = { ...eventResults, id: resultsId };
      
      setResults(newResults);
      return newResults;
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
      
      // Update local state if not using real-time
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
   * Export results data
   */
  const exportResults = (format = 'json') => {
    if (!results) return null;
    
    const exportData = {
      event: {
        id: results.eventId,
        type: results.eventType
      },
      results: results.participantResults,
      summary: getResultsStats(),
      exportedAt: new Date().toISOString()
    };
    
    switch (format) {
      case 'csv':
        return convertToCSV(exportData);
      case 'json':
      default:
        return JSON.stringify(exportData, null, 2);
    }
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
   * Delete results
   */
  const deleteResults = async (resultsId) => {
    setError(null);
    
    try {
      await firebaseOps.remove('eventResults', resultsId);
      setResults(null);
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    results,
    loading,
    error,
    
    // CRUD operations
    loadResults,
    createResults,
    updateResults,
    deleteResults,
    
    // Participant-specific operations
    updateParticipantResult,
    confirmParticipantResult,
    
    // Award management
    addAward,
    removeAward,
    
    // Publishing and sharing
    publishResults,
    
    // Data and statistics
    getResultsStats,
    exportResults,
    
    // Utility functions
    refreshResults: loadResults,
    clearError: () => setError(null),
    
    // Computed properties
    hasResults: !!results,
    isPublished: results?.status === RESULT_STATUS.CONFIRMED,
    isDraft: results?.status === RESULT_STATUS.DRAFT,
    stats: getResultsStats()
  };
};

export default useResults;