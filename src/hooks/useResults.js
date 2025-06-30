// src/hooks/useResults.js
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
 * Handles both types of results with unified interface
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

  // Add tournament results
  const addTournamentResults = useCallback(async (tournamentId, resultsData) => {
    try {
      setError(null);
      
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

  // Add league results
  const addLeagueResults = useCallback(async (leagueId, resultsData) => {
    try {
      setError(null);
      
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

  // Get all results for a specific player
  const getPlayerResults = useCallback((memberId) => {
    const allResults = [...results.tournament, ...results.league];
    return allResults.filter(result => 
      result.standings?.some(standing => 
        standing.memberId === memberId || standing.memberName === memberId
      )
    );
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

  // Get performance statistics for a player
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
      const playerStanding = result.standings?.find(standing => 
        standing.memberId === memberId || standing.memberName === memberId
      );
      
      if (playerStanding) {
        const position = result.standings.indexOf(playerStanding) + 1;
        if (position === 1) stats.wins++;
        if (position <= 3) stats.podiums++;
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