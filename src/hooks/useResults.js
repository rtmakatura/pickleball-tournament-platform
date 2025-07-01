// src/hooks/useResults.js - FIXED: Consistent data structure and better retrieval
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
 * FIXED: Standardized data structure and proper member resolution
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

    // Get all results with simplified query
    const allResultsQuery = collection(db, 'results');

    const unsubscribeResults = onSnapshot(
      allResultsQuery,
      (snapshot) => {
        const allResults = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        console.log('📊 Raw results from Firebase:', allResults);
        
        // Filter by type and sort
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
        
        console.log('🏆 Tournament results:', tournamentResults);
        console.log('🏐 League results:', leagueResults);
        
        setResults(prev => ({
          ...prev,
          tournament: tournamentResults,
          league: leagueResults
        }));
      },
      (err) => {
        console.error('❌ Error fetching results:', err);
        setError(`Failed to load results: ${err.message}`);
      }
    );

    // Player Performance listener
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
        console.error('❌ Error fetching performance data:', err);
        setError(`Failed to load performance data: ${err.message}`);
        setLoading(false);
      }
    );

    unsubscribers.push(unsubscribeResults, unsubscribePerformance);

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, []);

  // FIXED: Standardized tournament results with proper structure
  const addTournamentResults = useCallback(async (tournamentId, resultsData) => {
    try {
      setError(null);
      
      console.log('💾 Saving tournament results:', { tournamentId, resultsData });
      
      // Validate and standardize tournament results structure
      if (!resultsData.divisionResults || !Array.isArray(resultsData.divisionResults)) {
        throw new Error('Tournament results must have division results');
      }

      // Validate and clean up division results
      const cleanedDivisionResults = resultsData.divisionResults.map((division, index) => {
        if (!division.participantPlacements || !Array.isArray(division.participantPlacements)) {
          throw new Error(`Division ${index + 1} must have participant placements`);
        }
        
        // Ensure all participants have placements
        const validParticipants = division.participantPlacements.filter(participant => 
          participant.placement !== null && participant.placement !== undefined
        );
        
        if (validParticipants.length === 0) {
          throw new Error(`Division ${index + 1} must have at least one participant with a placement`);
        }

        return {
          divisionId: division.divisionId,
          divisionName: division.divisionName,
          eventType: division.eventType,
          skillLevel: division.skillLevel,
          totalTeams: division.totalTeams || 0,
          participantPlacements: validParticipants.map(participant => ({
            participantId: participant.participantId,
            participantName: participant.participantName || 'Unknown Member',
            placement: parseInt(participant.placement),
            notes: participant.notes || ''
          }))
        };
      });

      // Create standardized result document
      const docData = {
        type: 'tournament',
        tournamentId: tournamentId,
        tournamentName: resultsData.tournamentName,
        eventDate: resultsData.completedDate || new Date(),
        completedDate: resultsData.completedDate || new Date(),
        divisionResults: cleanedDivisionResults,
        notes: resultsData.notes || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      console.log('💾 Final tournament result document:', docData);
      
      const docRef = await addDoc(collection(db, 'results'), docData);
      console.log('✅ Tournament results saved with ID:', docRef.id);
      
      return docRef.id;
    } catch (err) {
      console.error('❌ Error adding tournament results:', err);
      setError(`Failed to add tournament results: ${err.message}`);
      throw err;
    }
  }, []);

  // FIXED: Standardized league results with proper structure
  const addLeagueResults = useCallback(async (leagueId, resultsData) => {
    try {
      setError(null);
      
      console.log('💾 Saving league results:', { leagueId, resultsData });
      
      // Validate and standardize league results structure
      if (!resultsData.participantPlacements || !Array.isArray(resultsData.participantPlacements)) {
        throw new Error('League results must have participant placements');
      }

      // Validate and clean up participant placements
      const validParticipants = resultsData.participantPlacements.filter(participant => 
        participant.placement !== null && participant.placement !== undefined
      );
      
      if (validParticipants.length === 0) {
        throw new Error('League must have at least one participant with a placement');
      }

      // Create standardized result document
      const docData = {
        type: 'league',
        leagueId: leagueId,
        leagueName: resultsData.leagueName,
        eventDate: resultsData.completedDate || new Date(),
        completedDate: resultsData.completedDate || new Date(),
        season: resultsData.season,
        totalTeams: resultsData.totalTeams || 0,
        participantPlacements: validParticipants.map(participant => ({
          participantId: participant.participantId,
          participantName: participant.participantName || 'Unknown Member',
          placement: parseInt(participant.placement),
          notes: participant.notes || ''
        })),
        seasonInfo: resultsData.seasonInfo || {},
        notes: resultsData.notes || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      console.log('💾 Final league result document:', docData);

      const docRef = await addDoc(collection(db, 'results'), docData);
      console.log('✅ League results saved with ID:', docRef.id);
      
      return docRef.id;
    } catch (err) {
      console.error('❌ Error adding league results:', err);
      setError(`Failed to add league results: ${err.message}`);
      throw err;
    }
  }, []);

  // Update tournament results
  const updateTournamentResults = useCallback(async (tournamentId, resultsData) => {
    try {
      setError(null);
      
      const existingResult = results.tournament.find(result => result.tournamentId === tournamentId);
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
      console.error('❌ Error updating tournament results:', err);
      setError(`Failed to update tournament results: ${err.message}`);
      throw err;
    }
  }, [results.tournament]);

  // Update league results
  const updateLeagueResults = useCallback(async (leagueId, resultsData) => {
    try {
      setError(null);
      
      const existingResult = results.league.find(result => result.leagueId === leagueId);
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
      console.error('❌ Error updating league results:', err);
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
      console.error('❌ Error adding player performance:', err);
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
      console.error('❌ Error updating player performance:', err);
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
      console.error('❌ Error deleting result:', err);
      setError(`Failed to delete result: ${err.message}`);
      throw err;
    }
  }, []);

  // FIXED: Better event results lookup
  const getEventResults = useCallback((eventId, type) => {
    const resultsList = type === 'tournament' ? results.tournament : results.league;
    const eventIdField = type === 'tournament' ? 'tournamentId' : 'leagueId';
    
    return resultsList.filter(result => result[eventIdField] === eventId);
  }, [results]);

  // Get player performance for specific event and member
  const getPlayerPerformance = useCallback((eventId, memberId) => {
    return results.performance.filter(perf => 
      perf.eventId === eventId && perf.memberId === memberId
    );
  }, [results.performance]);

  // FIXED: Better player results lookup with standardized structure
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

  // FIXED: Simplified player stats calculation
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

    // Calculate wins and podiums from standardized structure
    playerResults.forEach(result => {
      let placement = null;

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
      } else if (result.type === 'league' && result.participantPlacements) {
        const participant = result.participantPlacements.find(p => 
          p.participantId === memberId
        );
        if (participant) {
          placement = participant.placement;
        }
      }

      if (placement === 1) stats.wins++;
      if (placement <= 3) stats.podiums++;
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

export default useResults;