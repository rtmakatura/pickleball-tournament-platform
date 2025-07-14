// src/hooks/useLeagues.js
import { useState, useEffect } from 'react';
import firebaseOps from '../services/firebaseOperations';
import { createLeague } from '../services/models';
import { getAutomaticLeagueStatus } from '../utils/statusUtils';

export const useLeagues = (options = {}) => {
  const { realTime = true, filters = {} } = options;
  
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let unsubscribe;

    const fetchData = async () => {
      try {
        setLoading(true);
        if (realTime) {
          unsubscribe = firebaseOps.subscribe('leagues', setLeagues, filters);
        } else {
          const data = await firebaseOps.getAll('leagues', filters);
          setLeagues(data);
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

  const addLeague = async (leagueData) => {
    const league = createLeague(leagueData);
    return await firebaseOps.create('leagues', league);
  };

  const updateLeague = async (id, updates) => {
    await firebaseOps.update('leagues', id, updates);
  };

  const deleteLeague = async (id) => {
    await firebaseOps.remove('leagues', id);
  };

  // ADDED: Archive/unarchive functions
  const archiveLeague = async (id) => {
    try {
      console.log('Archiving league:', id);
      
      if (!id) {
        throw new Error('League ID is required for archiving');
      }
      
      await firebaseOps.update('leagues', id, { 
        status: 'archived',
        archivedAt: new Date()
      });
      console.log('League archived successfully');
      
    } catch (error) {
      console.error('Error archiving league:', error);
      throw new Error(`Failed to archive league: ${error.message}`);
    }
  };

  const unarchiveLeague = async (id) => {
    try {
      console.log('Unarchiving league:', id);
      
      if (!id) {
        throw new Error('League ID is required for unarchiving');
      }
      
      await firebaseOps.update('leagues', id, { 
        status: 'completed',
        archivedAt: null
      });
      console.log('League unarchived successfully');
      
    } catch (error) {
      console.error('Error unarchiving league:', error);
      throw new Error(`Failed to unarchive league: ${error.message}`);
    }
  };

  // ADDED: Automatic status checking and updating for leagues
  const checkAndUpdateLeagueStatus = async (leagueId) => {
    try {
      console.log('Checking league status:', leagueId);
      
      if (!leagueId) {
        throw new Error('League ID is required for status check');
      }
      
      const league = leagues.find(l => l.id === leagueId);
      if (!league) {
        console.log('League not found in current state, fetching...');
        const fetchedLeague = await firebaseOps.read('leagues', leagueId);
        if (!fetchedLeague) {
          throw new Error('League not found');
        }
        
        const suggestedStatus = getAutomaticLeagueStatus(fetchedLeague);
        if (suggestedStatus !== fetchedLeague.status) {
          console.log('Updating league status from', fetchedLeague.status, 'to', suggestedStatus);
          await firebaseOps.update('leagues', leagueId, { status: suggestedStatus });
        }
        return;
      }

      const suggestedStatus = getAutomaticLeagueStatus(league);
      
      if (suggestedStatus !== league.status) {
        console.log('Updating league status from', league.status, 'to', suggestedStatus);
        await firebaseOps.update('leagues', leagueId, { status: suggestedStatus });
      } else {
        console.log('League status is already correct:', league.status);
      }
    } catch (error) {
      console.error('Error checking/updating league status:', error);
      throw new Error(`Failed to check league status: ${error.message}`);
    }
  };

  // ADDED: Bulk status update for all leagues
  const checkAndUpdateAllLeagueStatuses = async () => {
    try {
      console.log('Checking all league statuses for updates');
      
      for (const league of leagues) {
        const suggestedStatus = getAutomaticLeagueStatus(league);
        
        if (suggestedStatus !== league.status) {
          console.log(`Auto-updating league ${league.name} from ${league.status} to ${suggestedStatus}`);
          await firebaseOps.update('leagues', league.id, { status: suggestedStatus });
        }
      }
      
      console.log('Completed bulk league status check');
    } catch (error) {
      console.error('Error in bulk league status update:', error);
    }
  };

  return {
    leagues,
    loading,
    error,
    addLeague,
    updateLeague,
    deleteLeague,
    archiveLeague,
    unarchiveLeague,
    checkAndUpdateLeagueStatus,
    checkAndUpdateAllLeagueStatuses
  };
};

export default useLeagues;