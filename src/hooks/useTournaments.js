// src/hooks/useTournaments.js (FIXED - Enhanced Error Handling & State Management)
import { useState, useEffect } from 'react';
import firebaseOps from '../services/firebaseOperations';
import { createTournament, getTournamentDivisionById } from '../services/models';
import { getAutomaticTournamentStatus } from '../utils/statusUtils';


export const useTournaments = (options = {}) => {
  const { realTime = true, filters = {} } = options;
  
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let unsubscribe;

    const fetchData = async () => {
      try {
        console.log('Fetching tournaments with options:', { realTime, filters });
        setLoading(true);
        setError(null);
        
        if (realTime) {
          console.log('Setting up real-time tournament subscription');
          unsubscribe = firebaseOps.subscribe('tournaments', (data) => {
            console.log('Real-time tournaments update:', data);
            setTournaments(data);
          }, filters);
        } else {
          console.log('Fetching tournaments one-time');
          const data = await firebaseOps.getAll('tournaments', filters);
          console.log('Fetched tournaments:', data);
          setTournaments(data);
        }
      } catch (err) {
        console.error('Error fetching tournaments:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      if (unsubscribe) {
        console.log('Cleaning up tournament subscription');
        unsubscribe();
      }
    };
  }, [realTime, JSON.stringify(filters)]);

  // FIXED: Enhanced tournament creation with better error handling
  const addTournament = async (tournamentData) => {
    try {
      console.log('Creating tournament with data:', tournamentData);
      
      // Validate tournament data
      if (!tournamentData.name || !tournamentData.name.trim()) {
        throw new Error('Tournament name is required');
      }
      
      if (!tournamentData.divisions || tournamentData.divisions.length === 0) {
        throw new Error('Tournament must have at least one division');
      }
      
      const tournament = createTournament(tournamentData);
      console.log('Created tournament object:', tournament);
      
      const tournamentId = await firebaseOps.create('tournaments', tournament);
      console.log('Tournament created with ID:', tournamentId);
      
      return tournamentId;
    } catch (error) {
      console.error('Error adding tournament:', error);
      throw new Error(`Failed to create tournament: ${error.message}`);
    }
  };

  // FIXED: Enhanced tournament update with validation and error handling
  const updateTournament = async (id, updates) => {
    try {
      console.log('Updating tournament:', id, 'with updates:', updates);
      
      if (!id) {
        throw new Error('Tournament ID is required for update');
      }
      
      // Validate critical fields if they're being updated
      if (updates.name !== undefined && (!updates.name || !updates.name.trim())) {
        throw new Error('Tournament name cannot be empty');
      }
      
      if (updates.divisions !== undefined) {
        if (!Array.isArray(updates.divisions)) {
          throw new Error('Divisions must be an array');
        }
        
        // Validate each division (if any exist)
        updates.divisions.forEach((division, index) => {
          if (!division.name || !division.name.trim()) {
            throw new Error(`Division ${index + 1} must have a name`);
          }
          if (!division.eventType) {
            throw new Error(`Division ${index + 1} must have an event type`);
          }
          if (!division.skillLevel) {
            throw new Error(`Division ${index + 1} must have a skill level`);
          }
        });
      }
      
      await firebaseOps.update('tournaments', id, updates);
      console.log('Tournament updated successfully');
      
    } catch (error) {
      console.error('Error updating tournament:', error);
      throw new Error(`Failed to update tournament: ${error.message}`);
    }
  };

  // FIXED: Enhanced tournament deletion with verification
  const deleteTournament = async (id) => {
    try {
      console.log('Deleting tournament:', id);
      
      if (!id) {
        throw new Error('Tournament ID is required for deletion');
      }
      
      // Verify tournament exists before deleting
      const tournament = await firebaseOps.read('tournaments', id);
      if (!tournament) {
        throw new Error('Tournament not found');
      }
      
      await firebaseOps.remove('tournaments', id);
      console.log('Tournament deleted successfully');
      
    } catch (error) {
      console.error('Error deleting tournament:', error);
      throw new Error(`Failed to delete tournament: ${error.message}`);
    }
  };

  // FIXED: Enhanced division operations with better error handling
  const addParticipantToDivision = async (tournamentId, divisionId, memberId) => {
    try {
      console.log('Adding participant to division:', { tournamentId, divisionId, memberId });
      
      if (!tournamentId || !divisionId || !memberId) {
        throw new Error('Tournament ID, division ID, and member ID are required');
      }
      
      await firebaseOps.addParticipantToDivision(tournamentId, divisionId, memberId);
      console.log('Participant added to division successfully');
      
    } catch (error) {
      console.error('Error adding participant to division:', error);
      throw new Error(`Failed to add participant to division: ${error.message}`);
    }
  };

  const removeParticipantFromDivision = async (tournamentId, divisionId, memberId) => {
    try {
      console.log('Removing participant from division:', { tournamentId, divisionId, memberId });
      
      if (!tournamentId || !divisionId || !memberId) {
        throw new Error('Tournament ID, division ID, and member ID are required');
      }
      
      await firebaseOps.removeParticipantFromDivision(tournamentId, divisionId, memberId);
      console.log('Participant removed from division successfully');
      
    } catch (error) {
      console.error('Error removing participant from division:', error);
      throw new Error(`Failed to remove participant from division: ${error.message}`);
    }
  };

  const updateDivisionPayment = async (tournamentId, divisionId, memberId, paymentInfo) => {
    try {
      console.log('Updating division payment:', { tournamentId, divisionId, memberId, paymentInfo });
      
      if (!tournamentId || !divisionId || !memberId) {
        throw new Error('Tournament ID, division ID, and member ID are required');
      }
      
      if (!paymentInfo || typeof paymentInfo.amount !== 'number' || paymentInfo.amount < 0) {
        throw new Error('Valid payment amount is required');
      }
      
      await firebaseOps.updateDivisionPaymentData(tournamentId, divisionId, memberId, paymentInfo);
      console.log('Division payment updated successfully');
      
    } catch (error) {
      console.error('Error updating division payment:', error);
      throw new Error(`Failed to update division payment: ${error.message}`);
    }
  };

  const removeDivisionPayment = async (tournamentId, divisionId, memberId) => {
    try {
      console.log('Removing division payment:', { tournamentId, divisionId, memberId });
      
      if (!tournamentId || !divisionId || !memberId) {
        throw new Error('Tournament ID, division ID, and member ID are required');
      }
      
      await firebaseOps.removeDivisionPaymentData(tournamentId, divisionId, memberId);
      console.log('Division payment removed successfully');
      
    } catch (error) {
      console.error('Error removing division payment:', error);
      throw new Error(`Failed to remove division payment: ${error.message}`);
    }
  };

  const updateDivision = async (tournamentId, divisionId, updates) => {
    try {
      console.log('Updating division:', { tournamentId, divisionId, updates });
      
      if (!tournamentId || !divisionId) {
        throw new Error('Tournament ID and division ID are required');
      }
      
      // Validate division updates
      if (updates.name !== undefined && (!updates.name || !updates.name.trim())) {
        throw new Error('Division name cannot be empty');
      }
      
      if (updates.entryFee !== undefined && (isNaN(updates.entryFee) || updates.entryFee < 0)) {
        throw new Error('Entry fee must be a valid non-negative number');
      }
      
      await firebaseOps.updateDivisionData(tournamentId, divisionId, updates);
      console.log('Division updated successfully');
      
    } catch (error) {
      console.error('Error updating division:', error);
      throw new Error(`Failed to update division: ${error.message}`);
    }
  };

  const deleteDivision = async (tournamentId, divisionId) => {
    try {
      console.log('Deleting division:', { tournamentId, divisionId });
      
      if (!tournamentId || !divisionId) {
        throw new Error('Tournament ID and division ID are required');
      }
      
      // Check if tournament has more than one division
      const tournament = await firebaseOps.read('tournaments', tournamentId);
      if (!tournament || !tournament.divisions || tournament.divisions.length <= 1) {
        throw new Error('Tournament must have at least one division');
      }
      
      await firebaseOps.deleteDivision(tournamentId, divisionId);
      console.log('Division deleted successfully');
      
    } catch (error) {
      console.error('Error deleting division:', error);
      throw new Error(`Failed to delete division: ${error.message}`);
    }
  };

  // ADDED: Archive/unarchive functions
  const archiveTournament = async (id) => {
    try {
      console.log('Archiving tournament:', id);
      
      if (!id) {
        throw new Error('Tournament ID is required for archiving');
      }
      
      await firebaseOps.update('tournaments', id, { 
        status: 'archived',
        archivedAt: new Date()
      });
      console.log('Tournament archived successfully');
      
    } catch (error) {
      console.error('Error archiving tournament:', error);
      throw new Error(`Failed to archive tournament: ${error.message}`);
    }
  };

  const unarchiveTournament = async (id) => {
    try {
      console.log('Unarchiving tournament:', id);
      
      if (!id) {
        throw new Error('Tournament ID is required for unarchiving');
      }
      
      await firebaseOps.update('tournaments', id, { 
        status: 'completed',
        archivedAt: null
      });
      console.log('Tournament unarchived successfully');
      
    } catch (error) {
      console.error('Error unarchiving tournament:', error);
      throw new Error(`Failed to unarchive tournament: ${error.message}`);
    }
  };

  // ADDED: Automatic status checking and updating
  const checkAndUpdateTournamentStatus = async (tournamentId) => {
    try {
      console.log('Checking tournament status:', tournamentId);
      
      if (!tournamentId) {
        throw new Error('Tournament ID is required for status check');
      }
      
      const tournament = tournaments.find(t => t.id === tournamentId);
      if (!tournament) {
        console.log('Tournament not found in current state, fetching...');
        const fetchedTournament = await firebaseOps.read('tournaments', tournamentId);
        if (!fetchedTournament) {
          throw new Error('Tournament not found');
        }
        
        const suggestedStatus = getAutomaticTournamentStatus(fetchedTournament);
        if (suggestedStatus !== fetchedTournament.status) {
          console.log('Updating tournament status from', fetchedTournament.status, 'to', suggestedStatus);
          await firebaseOps.update('tournaments', tournamentId, { status: suggestedStatus });
        }
        return;
      }

      const suggestedStatus = getAutomaticTournamentStatus(tournament);
      
      if (suggestedStatus !== tournament.status) {
        console.log('Updating tournament status from', tournament.status, 'to', suggestedStatus);
        await firebaseOps.update('tournaments', tournamentId, { status: suggestedStatus });
      } else {
        console.log('Tournament status is already correct:', tournament.status);
      }
    } catch (error) {
      console.error('Error checking/updating tournament status:', error);
      throw new Error(`Failed to check tournament status: ${error.message}`);
    }
  };

  // ADDED: Bulk status update for all tournaments
  const checkAndUpdateAllTournamentStatuses = async () => {
    try {
      console.log('Checking all tournament statuses for updates');
      
      for (const tournament of tournaments) {
        const suggestedStatus = getAutomaticTournamentStatus(tournament);
        
        if (suggestedStatus !== tournament.status) {
          console.log(`Auto-updating tournament ${tournament.name} from ${tournament.status} to ${suggestedStatus}`);
          await firebaseOps.update('tournaments', tournament.id, { status: suggestedStatus });
        }
      }
      
      console.log('Completed bulk tournament status check');
    } catch (error) {
      console.error('Error in bulk tournament status update:', error);
    }
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
    deleteDivision,
    archiveTournament,
    unarchiveTournament,
    checkAndUpdateTournamentStatus,
    checkAndUpdateAllTournamentStatuses
  };
};

// FIXED: Enhanced hook for managing a single tournament's divisions
export const useTournamentDivisions = (tournamentId, options = {}) => {
  const { realTime = true } = options;
  
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!tournamentId) {
      console.log('No tournament ID provided to useTournamentDivisions');
      return;
    }

    let unsubscribe;

    const fetchTournament = async () => {
      try {
        console.log('Fetching tournament for divisions:', tournamentId);
        setLoading(true);
        setError(null);
        
        if (realTime) {
          console.log('Setting up real-time tournament subscription for divisions');
          unsubscribe = firebaseOps.subscribeToDoc('tournaments', tournamentId, (data) => {
            console.log('Real-time tournament update for divisions:', data);
            setTournament(data);
          });
        } else {
          console.log('Fetching tournament one-time for divisions');
          const data = await firebaseOps.read('tournaments', tournamentId);
          console.log('Fetched tournament for divisions:', data);
          setTournament(data);
        }
      } catch (err) {
        console.error('Error fetching tournament for divisions:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTournament();

    return () => {
      if (unsubscribe) {
        console.log('Cleaning up tournament divisions subscription');
        unsubscribe();
      }
    };
  }, [tournamentId, realTime]);

  const getDivision = (divisionId) => {
    return getTournamentDivisionById(tournament, divisionId);
  };

  const updateDivisionParticipants = async (divisionId, participants) => {
    if (!tournament) {
      throw new Error('Tournament not loaded');
    }
    
    try {
      console.log('Updating division participants:', { divisionId, participants });
      
      const updatedDivisions = tournament.divisions.map(division => 
        division.id === divisionId 
          ? { ...division, participants }
          : division
      );
      
      await firebaseOps.update('tournaments', tournamentId, { divisions: updatedDivisions });
      console.log('Division participants updated successfully');
      
    } catch (error) {
      console.error('Error updating division participants:', error);
      throw new Error(`Failed to update division participants: ${error.message}`);
    }
  };

  const updateDivisionPaymentData = async (divisionId, paymentData) => {
    if (!tournament) {
      throw new Error('Tournament not loaded');
    }
    
    try {
      console.log('Updating division payment data:', { divisionId, paymentData });
      
      const updatedDivisions = tournament.divisions.map(division => 
        division.id === divisionId 
          ? { ...division, paymentData }
          : division
      );
      
      await firebaseOps.update('tournaments', tournamentId, { divisions: updatedDivisions });
      console.log('Division payment data updated successfully');
      
    } catch (error) {
      console.error('Error updating division payment data:', error);
      throw new Error(`Failed to update division payment data: ${error.message}`);
    }
  };

  const addDivision = async (divisionData) => {
    if (!tournament) {
      throw new Error('Tournament not loaded');
    }
    
    try {
      console.log('Adding division:', divisionData);
      
      // Validate division data
      if (!divisionData.name || !divisionData.name.trim()) {
        throw new Error('Division name is required');
      }
      
      if (!divisionData.eventType) {
        throw new Error('Event type is required');
      }
      
      if (!divisionData.skillLevel) {
        throw new Error('Skill level is required');
      }
      
      const newDivision = {
        ...divisionData,
        id: `div_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        participants: [],
        paymentData: {},
        order: tournament.divisions.length
      };
      
      const updatedDivisions = [...tournament.divisions, newDivision];
      await firebaseOps.update('tournaments', tournamentId, { divisions: updatedDivisions });
      console.log('Division added successfully');
      
      return newDivision.id;
    } catch (error) {
      console.error('Error adding division:', error);
      throw new Error(`Failed to add division: ${error.message}`);
    }
  };

  const updateDivision = async (divisionId, updates) => {
    if (!tournament) {
      throw new Error('Tournament not loaded');
    }
    
    try {
      console.log('Updating division:', { divisionId, updates });
      
      // Validate updates
      if (updates.name !== undefined && (!updates.name || !updates.name.trim())) {
        throw new Error('Division name cannot be empty');
      }
      
      const updatedDivisions = tournament.divisions.map(division => 
        division.id === divisionId 
          ? { ...division, ...updates }
          : division
      );
      
      await firebaseOps.update('tournaments', tournamentId, { divisions: updatedDivisions });
      console.log('Division updated successfully');
      
    } catch (error) {
      console.error('Error updating division:', error);
      throw new Error(`Failed to update division: ${error.message}`);
    }
  };

  const deleteDivision = async (divisionId) => {
    if (!tournament || tournament.divisions.length <= 1) {
      throw new Error('Tournament must have at least one division');
    }
    
    try {
      console.log('Deleting division:', divisionId);
      
      const updatedDivisions = tournament.divisions.filter(division => division.id !== divisionId);
      await firebaseOps.update('tournaments', tournamentId, { divisions: updatedDivisions });
      console.log('Division deleted successfully');
      
    } catch (error) {
      console.error('Error deleting division:', error);
      throw new Error(`Failed to delete division: ${error.message}`);
    }
  };

  const reorderDivisions = async (newOrder) => {
    if (!tournament) {
      throw new Error('Tournament not loaded');
    }
    
    try {
      console.log('Reordering divisions:', newOrder);
      
      const reorderedDivisions = newOrder.map((divisionId, index) => {
        const division = tournament.divisions.find(div => div.id === divisionId);
        if (!division) {
          throw new Error(`Division with ID ${divisionId} not found`);
        }
        return { ...division, order: index };
      });
      
      await firebaseOps.update('tournaments', tournamentId, { divisions: reorderedDivisions });
      console.log('Divisions reordered successfully');
      
    } catch (error) {
      console.error('Error reordering divisions:', error);
      throw new Error(`Failed to reorder divisions: ${error.message}`);
    }
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

// FIXED: Enhanced hook for managing user's tournament participation
export const useUserTournaments = (userId, options = {}) => {
  const { includeCompleted = true, realTime = true } = options;
  
  const [userTournaments, setUserTournaments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      console.log('No user ID provided to useUserTournaments');
      return;
    }

    const fetchUserTournaments = async () => {
      try {
        console.log('Fetching user tournaments:', userId);
        setLoading(true);
        setError(null);
        
        const tournaments = await firebaseOps.getUserTournaments(userId);
        console.log('Fetched user tournaments:', tournaments);
        
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
        
      } catch (err) {
        console.error('Error fetching user tournaments:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserTournaments();
    
    // Set up real-time updates if requested
    let unsubscribe;
    if (realTime) {
      console.log('Setting up real-time user tournaments subscription');
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
      if (unsubscribe) {
        console.log('Cleaning up user tournaments subscription');
        unsubscribe();
      }
    };
  }, [userId, includeCompleted, realTime]);

  const registerForDivision = async (tournamentId, divisionId) => {
    try {
      console.log('Registering for division:', { tournamentId, divisionId, userId });
      await firebaseOps.addParticipantToDivision(tournamentId, divisionId, userId);
      console.log('Registered for division successfully');
    } catch (error) {
      console.error('Error registering for division:', error);
      throw new Error(`Failed to register for division: ${error.message}`);
    }
  };

  const unregisterFromDivision = async (tournamentId, divisionId) => {
    try {
      console.log('Unregistering from division:', { tournamentId, divisionId, userId });
      await firebaseOps.removeParticipantFromDivision(tournamentId, divisionId, userId);
      console.log('Unregistered from division successfully');
    } catch (error) {
      console.error('Error unregistering from division:', error);
      throw new Error(`Failed to unregister from division: ${error.message}`);
    }
  };

  const makePayment = async (tournamentId, divisionId, amount, notes = '') => {
    try {
      console.log('Making payment:', { tournamentId, divisionId, amount, notes });
      
      if (!amount || isNaN(amount) || amount <= 0) {
        throw new Error('Valid payment amount is required');
      }
      
      const paymentInfo = {
        amount: parseFloat(amount),
        date: new Date().toISOString(),
        method: 'manual',
        notes: notes || `Payment of $${amount}`,
        recordedBy: userId
      };
      
      await firebaseOps.updateDivisionPaymentData(tournamentId, divisionId, userId, paymentInfo);
      console.log('Payment made successfully');
      
    } catch (error) {
      console.error('Error making payment:', error);
      throw new Error(`Failed to make payment: ${error.message}`);
    }
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

// FIXED: Enhanced hook for tournament analytics
export const useTournamentAnalytics = (tournamentId) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!tournamentId) {
      console.log('No tournament ID provided to useTournamentAnalytics');
      return;
    }

    const calculateAnalytics = async () => {
      try {
        console.log('Calculating analytics for tournament:', tournamentId);
        setLoading(true);
        setError(null);
        
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
        
        console.log('Calculated analytics:', analytics);
        setAnalytics(analytics);
        
      } catch (err) {
        console.error('Error calculating analytics:', err);
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