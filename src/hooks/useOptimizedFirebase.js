// src/hooks/useOptimizedFirebase.js
import { useEffect } from 'react';
import { useEntitiesStore } from '../stores';
import { 
  collection, 
  onSnapshot, 
  query,
  where,
  orderBy 
} from 'firebase/firestore';
import { db } from '../services/firebase';

// Shared listener manager
class ListenerManager {
  constructor() {
    this.listeners = new Map();
    this.subscriptionCounts = new Map();
  }

  subscribe(collectionName, options = {}) {
    const key = `${collectionName}:${JSON.stringify(options)}`;
    
    const currentCount = this.subscriptionCounts.get(key) || 0;
    this.subscriptionCounts.set(key, currentCount + 1);
    
    if (this.listeners.has(key)) {
      return this.createCleanupFunction(key);
    }
    
    const unsubscribe = this.createListener(collectionName, options, key);
    this.listeners.set(key, unsubscribe);
    
    return this.createCleanupFunction(key);
  }

  createListener(collectionName, options, key) {
    const { filters = [], orderByField } = options;
    
    let q = collection(db, collectionName);
    
    filters.forEach(filter => {
      q = query(q, where(filter.field, filter.operator, filter.value));
    });
    
    if (orderByField) {
      q = query(q, orderBy(orderByField));
    }
    
    useEntitiesStore.getState().setLoading(collectionName, true);
    
    return onSnapshot(q, 
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        this.updateStore(collectionName, data);
        useEntitiesStore.getState().setLoading(collectionName, false);
      },
      (error) => {
        console.error(`Firebase listener error for ${collectionName}:`, error);
        useEntitiesStore.getState().setLoading(collectionName, false);
      }
    );
  }

  updateStore(collectionName, data) {
    const entitiesStore = useEntitiesStore.getState();
    
    switch (collectionName) {
      case 'members':
        entitiesStore.setMembers(data);
        break;
      case 'tournaments':
        entitiesStore.setTournaments(data);
        break;
      case 'leagues':
        entitiesStore.setLeagues(data);
        break;
      case 'results':
        entitiesStore.setResults(data);
        break;
    }
  }

  createCleanupFunction(key) {
    return () => {
      const currentCount = this.subscriptionCounts.get(key) || 0;
      const newCount = Math.max(0, currentCount - 1);
      
      this.subscriptionCounts.set(key, newCount);
      
      if (newCount === 0) {
        this.cleanup(key);
      }
    };
  }

  cleanup(key) {
    if (this.listeners.has(key)) {
      this.listeners.get(key)();
      this.listeners.delete(key);
      this.subscriptionCounts.delete(key);
    }
  }
}

const listenerManager = new ListenerManager();

// Optimized hooks
export const useOptimizedMembers = (options = {}) => {
  const { realTime = false } = options;
  
  useEffect(() => {
    if (!realTime) return;
    
    const cleanup = listenerManager.subscribe('members', {
      orderByField: 'firstName'
    });
    
    return cleanup;
  }, [realTime]);
  
  return useEntitiesStore(state => ({
    members: Object.values(state.members),
    loading: state.loading.members
  }));
};

export const useOptimizedTournaments = (options = {}) => {
  const { realTime = false } = options;
  
  useEffect(() => {
    if (!realTime) return;
    
    const cleanup = listenerManager.subscribe('tournaments', {
      filters: [{ field: 'status', operator: '!=', value: 'archived' }],
      orderByField: 'eventDate'
    });
    
    return cleanup;
  }, [realTime]);
  
  return useEntitiesStore(state => ({
    tournaments: Object.values(state.tournaments).filter(
      tournament => tournament.status !== 'archived'
    ),
    loading: state.loading.tournaments
  }));
};

export const useOptimizedLeagues = (options = {}) => {
  const { realTime = false } = options;
  
  useEffect(() => {
    if (!realTime) return;
    
    const cleanup = listenerManager.subscribe('leagues', {
      filters: [{ field: 'status', operator: '!=', value: 'archived' }],
      orderByField: 'startDate'
    });
    
    return cleanup;
  }, [realTime]);
  
  return useEntitiesStore(state => ({
    leagues: Object.values(state.leagues).filter(
      league => league.status !== 'archived'
    ),
    loading: state.loading.leagues
  }));
};

export const useOptimizedResults = (options = {}) => {
  const { realTime = false } = options;
  
  useEffect(() => {
    if (!realTime) return;
    
    const cleanup = listenerManager.subscribe('results', {
      orderByField: 'completedDate'
    });
    
    return cleanup;
  }, [realTime]);
  
  return useEntitiesStore(state => {
    const allResults = Object.values(state.results);
    
    return {
      results: {
        tournament: allResults.filter(r => r.tournamentId),
        league: allResults.filter(r => r.leagueId)
      },
      loading: state.loading.results
    };
  });
};