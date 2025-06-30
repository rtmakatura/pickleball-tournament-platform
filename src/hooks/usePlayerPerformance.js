// src/hooks/usePlayerPerformance.js
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
 * Custom hook for managing player performance assessments
 * Handles individual player performance tracking and analytics
 */
export const usePlayerPerformance = () => {
  const [performances, setPerformances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set up real-time listener for player performances
  useEffect(() => {
    setLoading(true);
    
    const performanceQuery = query(
      collection(db, 'playerPerformances'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      performanceQuery,
      (snapshot) => {
        const performanceData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setPerformances(performanceData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching player performances:', err);
        setError(`Failed to load player performances: ${err.message}`);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Add a new player performance assessment
  const addPerformance = useCallback(async (performanceData) => {
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

  // Update an existing player performance assessment
  const updatePerformance = useCallback(async (performanceId, performanceData) => {
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

  // Delete a player performance assessment
  const deletePerformance = useCallback(async (performanceId) => {
    try {
      setError(null);
      await deleteDoc(doc(db, 'playerPerformances', performanceId));
    } catch (err) {
      console.error('Error deleting player performance:', err);
      setError(`Failed to delete player performance: ${err.message}`);
      throw err;
    }
  }, []);

  // Get performances for a specific player
  const getPlayerPerformances = useCallback((memberId) => {
    return performances.filter(perf => perf.memberId === memberId);
  }, [performances]);

  // Get performances for a specific event
  const getEventPerformances = useCallback((eventId) => {
    return performances.filter(perf => perf.eventId === eventId);
  }, [performances]);

  // Get performance for specific player and event
  const getPerformance = useCallback((memberId, eventId) => {
    return performances.find(perf => 
      perf.memberId === memberId && perf.eventId === eventId
    );
  }, [performances]);

  // Get recent performances (last N entries)
  const getRecentPerformances = useCallback((limit = 10) => {
    return performances
      .sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt) || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt) || new Date(0);
        return dateB - dateA;
      })
      .slice(0, limit);
  }, [performances]);

  // Calculate player statistics
  const getPlayerStats = useCallback((memberId) => {
    const playerPerfs = getPlayerPerformances(memberId);
    
    if (playerPerfs.length === 0) {
      return {
        totalAssessments: 0,
        averageRating: 0,
        mostCommonStrengths: [],
        mostCommonImprovements: [],
        progressTrend: 'stable',
        skillAverages: {}
      };
    }

    // Calculate average overall rating
    const totalRating = playerPerfs.reduce((sum, perf) => sum + (perf.overallRating || 0), 0);
    const averageRating = totalRating / playerPerfs.length;

    // Calculate skill averages
    const skillAverages = {};
    const skillCategories = ['serves', 'returns', 'volleys', 'groundstrokes', 'positioning', 'strategy', 'communication', 'consistency'];
    
    skillCategories.forEach(skill => {
      const skillRatings = playerPerfs
        .map(perf => perf.skillRatings?.[skill])
        .filter(rating => rating !== undefined && rating !== null);
      
      if (skillRatings.length > 0) {
        skillAverages[skill] = skillRatings.reduce((sum, rating) => sum + rating, 0) / skillRatings.length;
      }
    });

    // Find most common strengths and improvements
    const allStrengths = playerPerfs.flatMap(perf => perf.strengths || []);
    const allImprovements = playerPerfs.flatMap(perf => perf.improvements || []);
    
    const strengthCounts = {};
    const improvementCounts = {};
    
    allStrengths.forEach(strength => {
      strengthCounts[strength] = (strengthCounts[strength] || 0) + 1;
    });
    
    allImprovements.forEach(improvement => {
      improvementCounts[improvement] = (improvementCounts[improvement] || 0) + 1;
    });
    
    const mostCommonStrengths = Object.entries(strengthCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([strength, count]) => ({ strength, count }));
      
    const mostCommonImprovements = Object.entries(improvementCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([improvement, count]) => ({ improvement, count }));

    // Calculate progress trend (comparing recent vs older assessments)
    let progressTrend = 'stable';
    if (playerPerfs.length >= 4) {
      const recent = playerPerfs.slice(0, Math.floor(playerPerfs.length / 2));
      const older = playerPerfs.slice(Math.floor(playerPerfs.length / 2));
      
      const recentAvg = recent.reduce((sum, perf) => sum + (perf.overallRating || 0), 0) / recent.length;
      const olderAvg = older.reduce((sum, perf) => sum + (perf.overallRating || 0), 0) / older.length;
      
      if (recentAvg > olderAvg + 0.3) progressTrend = 'improving';
      else if (recentAvg < olderAvg - 0.3) progressTrend = 'declining';
    }

    return {
      totalAssessments: playerPerfs.length,
      averageRating: Math.round(averageRating * 10) / 10,
      mostCommonStrengths,
      mostCommonImprovements,
      progressTrend,
      skillAverages
    };
  }, [getPlayerPerformances]);

  // Get team/group performance insights
  const getTeamInsights = useCallback(() => {
    if (performances.length === 0) {
      return {
        totalPlayers: 0,
        averageTeamRating: 0,
        topPerformers: [],
        commonStrengths: [],
        commonImprovements: []
      };
    }

    // Get unique players
    const uniquePlayers = [...new Set(performances.map(perf => perf.memberId))];
    
    // Calculate average team rating
    const totalRating = performances.reduce((sum, perf) => sum + (perf.overallRating || 0), 0);
    const averageTeamRating = totalRating / performances.length;

    // Find top performers (by average rating)
    const playerAverages = uniquePlayers.map(playerId => {
      const playerPerfs = performances.filter(perf => perf.memberId === playerId);
      const avgRating = playerPerfs.reduce((sum, perf) => sum + (perf.overallRating || 0), 0) / playerPerfs.length;
      const playerName = playerPerfs[0]?.memberName || 'Unknown';
      
      return {
        playerId,
        playerName,
        averageRating: Math.round(avgRating * 10) / 10,
        totalAssessments: playerPerfs.length
      };
    });

    const topPerformers = playerAverages
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, 5);

    // Find most common team strengths and improvements
    const allStrengths = performances.flatMap(perf => perf.strengths || []);
    const allImprovements = performances.flatMap(perf => perf.improvements || []);
    
    const strengthCounts = {};
    const improvementCounts = {};
    
    allStrengths.forEach(strength => {
      strengthCounts[strength] = (strengthCounts[strength] || 0) + 1;
    });
    
    allImprovements.forEach(improvement => {
      improvementCounts[improvement] = (improvementCounts[improvement] || 0) + 1;
    });
    
    const commonStrengths = Object.entries(strengthCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([strength, count]) => ({ strength, count }));
      
    const commonImprovements = Object.entries(improvementCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([improvement, count]) => ({ improvement, count }));

    return {
      totalPlayers: uniquePlayers.length,
      averageTeamRating: Math.round(averageTeamRating * 10) / 10,
      topPerformers,
      commonStrengths,
      commonImprovements
    };
  }, [performances]);

  return {
    // Data
    performances,
    loading,
    error,
    
    // CRUD operations
    addPerformance,
    updatePerformance,
    deletePerformance,
    
    // Query functions
    getPlayerPerformances,
    getEventPerformances,
    getPerformance,
    getRecentPerformances,
    
    // Analytics
    getPlayerStats,
    getTeamInsights,
    
    // Utility
    clearError: () => setError(null)
  };
};

// Also export as default for flexibility
export default usePlayerPerformance;