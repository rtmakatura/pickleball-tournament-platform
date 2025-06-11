// src/hooks/useTournaments.js (UPDATED - Division Support)
import { useState, useEffect } from 'react';
import firebaseOps from '../services/firebaseOperations';
import { createTournament, getTournamentDivisionById } from '../services/models';

export const useTournaments = (options = {}) => {
  const { realTime = true, filters = {} } = options;
  
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let unsubscribe;

    const fetchData = async () => {
      try {
        setLoading(true);
        if (realTime) {
          unsubscribe = firebaseOps.subscribe('tournaments', setTournaments, filters);
        } else {
          const data = await firebaseOps.getAll('tournaments', filters);
          setTournaments(data);
        }
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [realTime, JSON.stringify(filters)]);

  const addTournament = async (tournamentData) => {
    const tournament = createTournament(tournamentData);
    return await firebaseOps.create('tournaments', tournament);
  };

  const updateTournament = async (id, updates) => {
    await firebaseOps.update('tournaments', id, updates);
  };

  const deleteTournament = async (id) => {
    await firebaseOps.remove('tournaments', id);
  };

  // NEW: Division-specific operations
  const addParticipantToDivision = async (tournamentId, divisionId, memberId) => {
    await firebaseOps.addParticipantToDivision(tournamentId, divisionId, memberId);
  };

  const removeParticipantFromDivision = async (tournamentId, divisionId, memberId) => {
    await firebaseOps.removeParticipantFromDivision(tournamentId, divisionId, memberId);
  };

  const updateDivisionPayment = async (tournamentId, divisionId, memberId, paymentInfo) => {
    await firebaseOps.updateDivisionPaymentData(tournamentId, divisionId, memberId, paymentInfo);
  };

  const removeDivisionPayment = async (tournamentId, divisionId, memberId) => {
    await firebaseOps.removeDivisionPaymentData(tournamentId, divisionId, memberId);
  };

  const updateDivision = async (tournamentId, divisionId, updates) => {
    await firebaseOps.updateDivisionData(tournamentId, divisionId, updates);
  };

  const deleteDivision = async (tournamentId, divisionId) => {
    await firebaseOps.deleteDivision(tournamentId, divisionId);
  };

  return {
    tournaments,
    loading,
    error,
    addTournament,
    updateTournament,
    deleteTournament,
    addParticipantToDivision,
    removeParticipantFromDivision,
    updateDivisionPayment,
    removeDivisionPayment,
    updateDivision,
    deleteDivision
  };
};

// NEW: Hook specifically for managing a single tournament's divisions
export const useTournamentDivisions = (tournamentId, options = {}) => {
  const { realTime = true } = options;
  
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!tournamentId) return;

    let unsubscribe;

    const fetchTournament = async () => {
      try {
        setLoading(true);
        if (realTime) {
          unsubscribe = firebaseOps.subscribeToDoc('tournaments', tournamentId, setTournament);
        } else {
          const data = await firebaseOps.read('tournaments', tournamentId);
          setTournament(data);
        }
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTournament();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [tournamentId, realTime]);

  const getDivision = (divisionId) => {
    return getTournamentDivisionById(tournament, divisionId);
  };

  const updateDivisionParticipants = async (divisionId, participants) => {
    if (!tournament) return;
    
    const updatedDivisions = tournament.divisions.map(division => 
      division.id === divisionId 
        ? { ...division, participants }
        : division
    );
    
    await firebaseOps.update('tournaments', tournamentId, { divisions: updatedDivisions });
  };

  const updateDivisionPaymentData = async (divisionId, paymentData) => {
    if (!tournament) return;
    
    const updatedDivisions = tournament.divisions.map(division => 
      division.id === divisionId 
        ? { ...division, paymentData }
        : division
    );
    
    await firebaseOps.update('tournaments', tournamentId, { divisions: updatedDivisions });
  };

  const addDivision = async (divisionData) => {
    if (!tournament) return;
    
    const newDivision = {
      ...divisionData,
      id: `div_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      participants: [],
      paymentData: {},
      order: tournament.divisions.length
    };
    
    const updatedDivisions = [...tournament.divisions, newDivision];
    await firebaseOps.update('tournaments', tournamentId, { divisions: updatedDivisions });
    
    return newDivision.id;
  };

  const updateDivision = async (divisionId, updates) => {
    if (!tournament) return;
    
    const updatedDivisions = tournament.divisions.map(division => 
      division.id === divisionId 
        ? { ...division, ...updates }
        : division
    );
    
    await firebaseOps.update('tournaments', tournamentId, { divisions: updatedDivisions });
  };

  const deleteDivision = async (divisionId) => {
    if (!tournament || tournament.divisions.length <= 1) {
      throw new Error('Tournament must have at least one division');
    }
    
    const updatedDivisions = tournament.divisions.filter(division => division.id !== divisionId);
    await firebaseOps.update('tournaments', tournamentId, { divisions: updatedDivisions });
  };

  const reorderDivisions = async (newOrder) => {
    if (!tournament) return;
    
    const reorderedDivisions = newOrder.map((divisionId, index) => {
      const division = tournament.divisions.find(div => div.id === divisionId);
      return { ...division, order: index };
    });
    
    await firebaseOps.update('tournaments', tournamentId, { divisions: reorderedDivisions });
  };

  return {
    tournament,
    divisions: tournament?.divisions || [],
    loading,
    error,
    getDivision,
    updateDivisionParticipants,
    updateDivisionPaymentData,
    addDivision,
    updateDivision,
    deleteDivision,
    reorderDivisions
  };
};

// NEW: Hook for managing user's tournament participation across divisions
export const useUserTournaments = (userId, options = {}) => {
  const { includeCompleted = true, realTime = true } = options;
  
  const [userTournaments, setUserTournaments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;

    const fetchUserTournaments = async () => {
      try {
        setLoading(true);
        const tournaments = await firebaseOps.getUserTournaments(userId);
        
        // Filter by status if needed
        const filteredTournaments = includeCompleted 
          ? tournaments 
          : tournaments.filter(t => t.status !== 'completed');
        
        // Add division details for each tournament
        const enrichedTournaments = filteredTournaments.map(tournament => {
          const userDivisions = tournament.divisions?.filter(division => 
            division.participants?.includes(userId)
          ) || [];
          
          return {
            ...tournament,
            userDivisions,
            totalFees: userDivisions.reduce((sum, div) => sum + (div.entryFee || 0), 0)
          };
        });
        
        setUserTournaments(enrichedTournaments);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserTournaments();
    
    // Set up real-time updates if requested
    let unsubscribe;
    if (realTime) {
      unsubscribe = firebaseOps.subscribe('tournaments', (tournaments) => {
        const userTournamentsData = tournaments.filter(tournament => {
          if (tournament.divisions && Array.isArray(tournament.divisions)) {
            return tournament.divisions.some(division => 
              division.participants?.includes(userId)
            );
          }
          return tournament.participants?.includes(userId);
        });
        
        const enrichedTournaments = userTournamentsData.map(tournament => {
          const userDivisions = tournament.divisions?.filter(division => 
            division.participants?.includes(userId)
          ) || [];
          
          return {
            ...tournament,
            userDivisions,
            totalFees: userDivisions.reduce((sum, div) => sum + (div.entryFee || 0), 0)
          };
        });
        
        setUserTournaments(includeCompleted 
          ? enrichedTournaments 
          : enrichedTournaments.filter(t => t.status !== 'completed')
        );
      });
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [userId, includeCompleted, realTime]);

  const registerForDivision = async (tournamentId, divisionId) => {
    await firebaseOps.addParticipantToDivision(tournamentId, divisionId, userId);
  };

  const unregisterFromDivision = async (tournamentId, divisionId) => {
    await firebaseOps.removeParticipantFromDivision(tournamentId, divisionId, userId);
  };

  const makePayment = async (tournamentId, divisionId, amount, notes = '') => {
    const paymentInfo = {
      amount: parseFloat(amount),
      date: new Date().toISOString(),
      method: 'manual',
      notes: notes || `Payment of $${amount}`,
      recordedBy: userId
    };
    
    await firebaseOps.updateDivisionPaymentData(tournamentId, divisionId, userId, paymentInfo);
  };

  return {
    userTournaments,
    loading,
    error,
    registerForDivision,
    unregisterFromDivision,
    makePayment,
    refresh: () => {
      // Re-fetch data
      setUserTournaments([]);
      setLoading(true);
    }
  };
};

// NEW: Hook for tournament analytics with division data
export const useTournamentAnalytics = (tournamentId) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!tournamentId) return;

    const calculateAnalytics = async () => {
      try {
        setLoading(true);
        const tournament = await firebaseOps.read('tournaments', tournamentId);
        
        if (!tournament) {
          throw new Error('Tournament not found');
        }

        let analytics = {
          totalDivisions: 0,
          totalParticipants: 0,
          totalExpectedRevenue: 0,
          totalActualRevenue: 0,
          paymentRate: 0,
          divisionBreakdown: [],
          participantDistribution: {},
          revenueByDivision: {}
        };

        if (tournament.divisions && Array.isArray(tournament.divisions)) {
          analytics.totalDivisions = tournament.divisions.length;
          
          tournament.divisions.forEach(division => {
            const participants = division.participants || [];
            const entryFee = division.entryFee || 0;
            const paymentData = division.paymentData || {};
            
            analytics.totalParticipants += participants.length;
            analytics.totalExpectedRevenue += participants.length * entryFee;
            
            // Calculate actual revenue for this division
            let divisionActualRevenue = 0;
            let divisionPaidCount = 0;
            
            participants.forEach(participantId => {
              const payment = paymentData[participantId];
              if (payment && payment.amount) {
                divisionActualRevenue += parseFloat(payment.amount);
                divisionPaidCount++;
              }
            });
            
            analytics.totalActualRevenue += divisionActualRevenue;
            
            // Division breakdown
            analytics.divisionBreakdown.push({
              id: division.id,
              name: division.name,
              eventType: division.eventType,
              skillLevel: division.skillLevel,
              participants: participants.length,
              entryFee: entryFee,
              expectedRevenue: participants.length * entryFee,
              actualRevenue: divisionActualRevenue,
              paymentRate: participants.length > 0 ? (divisionPaidCount / participants.length * 100).toFixed(1) : 0
            });
            
            // Participant distribution by event type and skill level
            const key = `${division.eventType}_${division.skillLevel}`;
            analytics.participantDistribution[key] = (analytics.participantDistribution[key] || 0) + participants.length;
            
            // Revenue by division
            analytics.revenueByDivision[division.name] = divisionActualRevenue;
          });
          
          // Calculate overall payment rate
          const totalParticipantsWithFees = tournament.divisions.reduce((sum, div) => {
            return sum + (div.entryFee > 0 ? (div.participants?.length || 0) : 0);
          }, 0);
          
          const totalPaidParticipants = tournament.divisions.reduce((sum, div) => {
            if (!div.entryFee || div.entryFee <= 0) return sum;
            
            const paidCount = (div.participants || []).filter(participantId => {
              const payment = div.paymentData?.[participantId];
              return payment && parseFloat(payment.amount) >= div.entryFee;
            }).length;
            
            return sum + paidCount;
          }, 0);
          
          analytics.paymentRate = totalParticipantsWithFees > 0 
            ? (totalPaidParticipants / totalParticipantsWithFees * 100).toFixed(1)
            : 0;
        }
        
        setAnalytics(analytics);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    calculateAnalytics();
  }, [tournamentId]);

  return {
    analytics,
    loading,
    error
  };
};

export default useTournaments;