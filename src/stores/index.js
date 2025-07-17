// src/stores/index.js
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// ===== ENTITIES STORE =====
export const useEntitiesStore = create(
  subscribeWithSelector((set, get) => ({
    // Normalized entity data
    members: {},
    tournaments: {},
    leagues: {},
    results: {},
    
    // Loading states
    loading: {
      members: false,
      tournaments: false,
      leagues: false,
      results: false,
    },
    
    // Actions
    setMembers: (members) => set((state) => ({
      members: Array.isArray(members) 
        ? members.reduce((acc, member) => ({ ...acc, [member.id]: member }), {})
        : members,
    })),
    
    setTournaments: (tournaments) => set((state) => ({
      tournaments: Array.isArray(tournaments)
        ? tournaments.reduce((acc, tournament) => ({ ...acc, [tournament.id]: tournament }), {})
        : tournaments,
    })),
    
    setLeagues: (leagues) => set((state) => ({
      leagues: Array.isArray(leagues)
        ? leagues.reduce((acc, league) => ({ ...acc, [league.id]: league }), {})
        : leagues,
    })),
    
    setResults: (results) => set((state) => ({
      results: Array.isArray(results)
        ? results.reduce((acc, result) => ({ ...acc, [result.id]: result }), {})
        : results,
    })),
    
    updateMember: (id, updates) => set((state) => ({
      members: {
        ...state.members,
        [id]: { ...state.members[id], ...updates }
      }
    })),
    
    updateTournament: (id, updates) => set((state) => ({
      tournaments: {
        ...state.tournaments,
        [id]: { ...state.tournaments[id], ...updates }
      }
    })),
    
    setLoading: (entity, loading) => set((state) => ({
      loading: { ...state.loading, [entity]: loading }
    }))
  }))
);

// ===== UI STATE STORE =====
export const useUIStore = create((set, get) => ({
  // Modal management
  activeModal: null,
  modalData: null,
  
  // Alert system
  alert: null,
  
  // Actions
  openModal: (modalType, data = null) => set({
    activeModal: modalType,
    modalData: data
  }),
  
  closeModal: () => set({
    activeModal: null,
    modalData: null
  }),
  
  showAlert: (type, title, message) => set({
    alert: { type, title, message, id: Date.now() }
  }),
  
  clearAlert: () => set({ alert: null })
}));

// ===== SELECTORS =====
export const selectActiveTournaments = () => {
  const entities = useEntitiesStore.getState();
  return Object.values(entities.tournaments).filter(
    tournament => tournament.status !== 'archived'
  );
};

export const selectActiveLeagues = () => {
  const entities = useEntitiesStore.getState();
  return Object.values(entities.leagues).filter(
    league => league.status !== 'archived'
  );
};

export const selectMembers = () => {
  const entities = useEntitiesStore.getState();
  return Object.values(entities.members);
};