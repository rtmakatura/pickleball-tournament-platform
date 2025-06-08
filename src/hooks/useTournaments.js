// src/hooks/useTournaments.js
import { useState, useEffect } from 'react';
import firebaseOps from '../services/firebaseOperations';
import { createTournament } from '../services/models';

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

  return {
    tournaments,
    loading,
    error,
    addTournament,
    updateTournament,
    deleteTournament
  };
};

export default useTournaments;