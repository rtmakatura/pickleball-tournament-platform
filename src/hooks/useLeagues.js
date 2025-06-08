// src/hooks/useLeagues.js
import { useState, useEffect } from 'react';
import firebaseOps from '../services/firebaseOperations';
import { createLeague } from '../services/models';

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

  return {
    leagues,
    loading,
    error,
    addLeague,
    updateLeague,
    deleteLeague
  };
};

export default useLeagues;