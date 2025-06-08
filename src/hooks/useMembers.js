// src/hooks/useMembers.js
import { useState, useEffect } from 'react';
import firebaseOps from '../services/firebaseOperations';
import { createMember } from '../services/models';

export const useMembers = (options = {}) => {
  const { realTime = true, filters = {} } = options;
  
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let unsubscribe;

    const fetchData = async () => {
      try {
        setLoading(true);
        if (realTime) {
          unsubscribe = firebaseOps.subscribe('members', setMembers, filters);
        } else {
          const data = await firebaseOps.getAll('members', filters);
          setMembers(data);
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

  const addMember = async (memberData) => {
    const member = createMember(memberData);
    return await firebaseOps.create('members', member);
  };

  const updateMember = async (id, updates) => {
    await firebaseOps.update('members', id, updates);
  };

  const deleteMember = async (id) => {
    await firebaseOps.remove('members', id);
  };

  return {
    members,
    loading,
    error,
    addMember,
    updateMember,
    deleteMember
  };
};

export default useMembers;