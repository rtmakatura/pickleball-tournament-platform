// src/hooks/useResults.js - UPDATED FOR TEAMS
import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../services/firebase';

/**
 * Custom hook for managing tournament and league results
 * Now handles team-based results for both tournaments and leagues
 */
export const useResults = () => {
  const [results, setResults] = useState({
    tournament: [],
    league: [],
    performance: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set up real-time listeners for all result types
  useEffect(() => {
    setLoading(true);
    const unsubscribers = [];

    // Simplified queries to avoid index requirements
    // Get all results and filter in memory for now
    const allResultsQuery = collection(db, 'results');

    const unsubscribeResults = onSnapshot(
      allResultsQuery,
      (snapshot) => {
        const allResults = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Filter by type in memory
        const tournamentResults = allResults
          .filter(result => result.type === 'tournament')
          .sort((a, b) => {
            const dateA = a.createdAt?.toDate?.() || new Date(0);
            const dateB = b.createdAt?.toDate?.() || new Date(0);
            return dateB - dateA;
          });
          
        const leagueResults = allResults
          .filter(result => result.type === 'league')
          .sort((a, b) => {
            const dateA = a.createdAt?.toDate?.() || new Date(0);
            const dateB = b.createdAt?.toDate?.() || new Date(0);
            return dateB - dateA;
          });
        
        setResults(prev => ({
          ...prev,
          tournament: tournamentResults,
          league: leagueResults
        }));
      },
      (err) => {
        console.error('Error fetching results:', err);
        setError(`Failed to load results: ${err.message}`);
      }
    );

    // Player Performance listener (simplified)
    const performanceQuery = collection(db, 'playerPerformances');

    const unsubscribePerformance = onSnapshot(
      performanceQuery,
      (snapshot) => {
        const performanceResults = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(0);
          const dateB = b.createdAt?.toDate?.() || new Date(0);
          return dateB - dateA;
        });
        
        setResults(prev => ({
          ...prev,
          performance: performanceResults
        }));
        
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching performance data:', err);
        setError(`Failed to load performance data: ${err.message}`);
        setLoading(false);
      }
    );

    unsubscribers.push(unsubscribeResults, unsubscribePerformance);

    // Cleanup function
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, []);

  // Add tournament results with placement data
  const addTournamentResults = useCallback(async (tournamentId, resultsData) => {
    try {
      setError(null);
      
      // Validate tournament results structure
      if (!resultsData.divisionResults || !Array.isArray(resultsData.divisionResults)) {
        throw new Error('Tournament results must have division results');
      }

      // Validate each division has participant placements
      resultsData.divisionResults.forEach((division, index) => {
        if (!division.participantPlacements || !Array.isArray(division.participantPlacements)) {
          throw new Error(`Division ${index + 1} must have participant placements`);
        }
        
        division.participantPlacements.forEach((participant, participantIndex) => {
          if (participant.placement === null || participant.placement === undefined) {
            throw new Error(`Division ${index + 1}, Participant ${participantIndex + 1} must have a placement`);
          }
        });
      });

      const docData = {
        ...resultsData,
        eventId: tournamentId,
        type: 'tournament',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'results'), docData);
      return docRef.id;
    } catch (err) {
      console.error('Error adding tournament results:', err);
      setError(`Failed to add tournament results: ${err.message}`);
      throw err;
    }
  }, []);

  // Update tournament results
  const updateTournamentResults = useCallback(async (tournamentId, resultsData) => {
    try {
      setError(null);
      
      // Find existing result for this tournament
      const existingResult = results.tournament.find(result => result.eventId === tournamentId);
      if (!existingResult) {
        throw new Error('Tournament result not found');
      }

      // Validate updated results structure
      if (!resultsData.divisionResults || !Array.isArray(resultsData.divisionResults)) {
        throw new Error('Tournament results must have division results');
      }

      const docData = {
        ...resultsData,
        updatedAt: serverTimestamp()
      };

      await updateDoc(doc(db, 'results', existingResult.id), docData);
      return existingResult.id;
    } catch (err) {
      console.error('Error updating tournament results:', err);
      setError(`Failed to update tournament results: ${err.message}`);
      throw err;
    }
  }, [results.tournament]);

  // Add league results with participant placements
  const addLeagueResults = useCallback(async (leagueId, resultsData) => {
    try {
      setError(null);
      
      // Validate league results structure
      if (!resultsData.participantPlacements || !Array.isArray(resultsData.participantPlacements)) {
        throw new Error('League results must have participant placements');
      }

      // Validate each participant has a placement
      resultsData.participantPlacements.forEach((participant, index) => {
        if (participant.placement === null || participant.placement === undefined) {
          throw new Error(`Participant ${index + 1} must have a placement`);
        }
      });

      const docData = {
        ...resultsData,
        eventId: leagueId,
        type: 'league',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'results'), docData);
      return docRef.id;
    } catch (err) {
      console.error('Error adding league results:', err);
      setError(`Failed to add league results: ${err.message}`);
      throw err;
    }
  }, []);

  // Update league results
  const updateLeagueResults = useCallback(async (leagueId, resultsData) => {
    try {
      setError(null);
      
      // Find existing result for this league
      const existingResult = results.league.find(result => result.eventId === leagueId);
      if (!existingResult) {
        throw new Error('League result not found');
      }

      // Validate updated results structure
      if (!resultsData.participantPlacements || !Array.isArray(resultsData.participantPlacements)) {
        throw new Error('League results must have participant placements');
      }

      const docData = {
        ...resultsData,
        updatedAt: serverTimestamp()
      };

      await updateDoc(doc(db, 'results', existingResult.id), docData);
      return existingResult.id;
    } catch (err) {
      console.error('Error updating league results:', err);
      setError(`Failed to update league results: ${err.message}`);
      throw err;
    }
  }, [results.league]);

  // Add player performance
  const addPlayerPerformance = useCallback(async (performanceData) => {
    try {
      setError(null);
      
      const docData = {
        ...performanceData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'playerPerformances'), docData);
      return docRef.id;
    } catch (err) {
      console.error('Error adding player performance:', err);
      setError(`Failed to add player performance: ${err.message}`);
      throw err;
    }
  }, []);

  // Update player performance
  const updatePlayerPerformance = useCallback(async (performanceId, performanceData) => {
    try {
      setError(null);
      
      const docData = {
        ...performanceData,
        updatedAt: serverTimestamp()
      };

      await updateDoc(doc(db, 'playerPerformances', performanceId), docData);
      return performanceId;
    } catch (err) {
      console.error('Error updating player performance:', err);
      setError(`Failed to update player performance: ${err.message}`);
      throw err;
    }
  }, []);

  // Delete result
  const deleteResult = useCallback(async (resultId, type = 'results') => {
    try {
      setError(null);
      const collectionName = type === 'performance' ? 'playerPerformances' : 'results';
      await deleteDoc(doc(db, collectionName, resultId));
    } catch (err) {
      console.error('Error deleting result:', err);
      setError(`Failed to delete result: ${err.message}`);
      throw err;
    }
  }, []);

  // Get results for specific event
  const getEventResults = useCallback((eventId, type) => {
    const resultsList = type === 'tournament' ? results.tournament : results.league;
    return resultsList.filter(result => result.eventId === eventId);
  }, [results]);

  // Get player performance for specific event and member
  const getPlayerPerformance = useCallback((eventId, memberId) => {
    return results.performance.filter(perf => 
      perf.eventId === eventId && perf.memberId === memberId
    );
  }, [results.performance]);

  // Get all results for a specific player (now searches participant placements)
  const getPlayerResults = useCallback((memberId) => {
    const allResults = [...results.tournament, ...results.league];
    return allResults.filter(result => {
      // Check tournament division results
      if (result.type === 'tournament' && result.divisionResults) {
        return result.divisionResults.some(division =>
          division.participantPlacements?.some(participant => 
            participant.participantId === memberId
          )
        );
      }
      
      // Check league participant placements
      if (result.type === 'league' && result.participantPlacements) {
        return result.participantPlacements.some(participant => 
          participant.participantId === memberId
        );
      }

      // Legacy support - check old team standings format
      if (result.divisionResults) {
        return result.divisionResults.some(division =>
          division.teamStandings?.some(team => 
            team.player1Id === memberId || team.player2Id === memberId
          )
        );
      }

      // Legacy support - check old league team standings format
      if (result.teamStandings) {
        return result.teamStandings.some(team => 
          team.player1Id === memberId || team.player2Id === memberId
        );
      }

      // Legacy support - check old standings format
      if (result.standings) {
        return result.standings.some(standing => 
          standing.memberId === memberId || standing.memberName === memberId
        );
      }

      return false;
    });
  }, [results]);

  // Get recent results across all types
  const getRecentResults = useCallback((limit = 10) => {
    const allResults = [...results.tournament, ...results.league];
    return allResults
      .sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt) || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt) || new Date(0);
        return dateB - dateA;
      })
      .slice(0, limit);
  }, [results]);

  // Get performance statistics for a player (updated for placement results)
  const getPlayerStats = useCallback((memberId) => {
    const playerResults = getPlayerResults(memberId);
    const playerPerformances = results.performance.filter(perf => perf.memberId === memberId);
    
    const stats = {
      totalEvents: playerResults.length,
      wins: 0,
      podiums: 0,
      averageRating: 0,
      recentPerformances: playerPerformances.slice(0, 5),
      totalPerformanceEntries: playerPerformances.length
    };

    // Calculate wins and podiums
    playerResults.forEach(result => {
      let placement = null;

      // Handle tournament results
      if (result.type === 'tournament' && result.divisionResults) {
        for (const division of result.divisionResults) {
          const participant = division.participantPlacements?.find(p => 
            p.participantId === memberId
          );
          if (participant) {
            placement = participant.placement;
            break;
          }
        }
      }
      
      // Handle league results
      else if (result.type === 'league' && result.participantPlacements) {
        const participant = result.participantPlacements.find(p => 
          p.participantId === memberId
        );
        if (participant) {
          placement = participant.placement;
        }
      }

      // Handle legacy team format
      else if (result.divisionResults) {
        for (const division of result.divisionResults) {
          const team = division.teamStandings?.find(team => 
            team.player1Id === memberId || team.player2Id === memberId
          );
          if (team) {
            placement = team.position;
            break;
          }
        }
      }

      // Handle legacy league team format
      else if (result.teamStandings) {
        const team = result.teamStandings.find(team => 
          team.player1Id === memberId || team.player2Id === memberId
        );
        if (team) {
          placement = team.position;
        }
      }

      // Handle legacy individual format
      else if (result.standings) {
        const playerStanding = result.standings.find(standing => 
          standing.memberId === memberId || standing.memberName === memberId
        );
        if (playerStanding) {
          placement = result.standings.indexOf(playerStanding) + 1;
        }
      }

      // Count wins and podiums
      if (placement === 1) {
        stats.wins++;
      }
      if (placement <= 3) {
        stats.podiums++;
      }
    });

    // Calculate average rating from performances
    if (playerPerformances.length > 0) {
      const totalRating = playerPerformances.reduce((sum, perf) => sum + (perf.overallRating || 0), 0);
      stats.averageRating = totalRating / playerPerformances.length;
    }

    return stats;
  }, [results, getPlayerResults]);

  return {
    // Data
    results,
    loading,
    error,
    
    // Tournament Results
    addTournamentResults,
    updateTournamentResults,
    
    // League Results  
    addLeagueResults,
    updateLeagueResults,
    
    // Player Performance
    addPlayerPerformance,
    updatePlayerPerformance,
    
    // General
    deleteResult,
    getEventResults,
    getPlayerPerformance,
    getPlayerResults,
    getRecentResults,
    getPlayerStats,
    
    // Clear error
    clearError: () => setError(null)
  };
};

// Also export as default for flexibility
export default useResults;