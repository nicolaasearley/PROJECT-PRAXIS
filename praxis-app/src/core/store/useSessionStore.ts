import { create } from 'zustand';
import type {
  WorkoutSessionLog,
  CompletedSet,
  ConditioningRoundLog,
} from '../types';

interface SessionState {
  // Current active session
  activeSession: WorkoutSessionLog | null;
  isSessionActive: boolean;

  // Session history
  sessionHistory: WorkoutSessionLog[];

  // Actions - Session lifecycle
  startSession: (session: WorkoutSessionLog) => void;
  endSession: () => void;
  updateActiveSession: (updates: Partial<WorkoutSessionLog>) => void;

  // Actions - Set logging
  addCompletedSet: (set: CompletedSet) => void;
  updateCompletedSet: (
    blockId: string,
    setIndex: number,
    updates: Partial<CompletedSet>
  ) => void;
  removeCompletedSet: (blockId: string, setIndex: number) => void;
  clearCompletedSets: () => void;

  // Actions - Conditioning rounds
  addConditioningRound: (round: ConditioningRoundLog) => void;
  updateConditioningRound: (
    blockId: string,
    roundIndex: number,
    updates: Partial<ConditioningRoundLog>
  ) => void;
  removeConditioningRound: (blockId: string, roundIndex: number) => void;
  clearConditioningRounds: () => void;

  // Actions - Session metadata
  setSessionRPE: (rpe: number) => void;
  setSessionNotes: (notes: string) => void;
  setSessionVolume: (volume: number) => void;

  // Actions - Session history
  addSessionToHistory: (session: WorkoutSessionLog) => void;
  setSessionHistory: (sessions: WorkoutSessionLog[]) => void;
  getSessionById: (id: string) => WorkoutSessionLog | null;

  // Helpers
  getCompletedSetsByBlock: (blockId: string) => CompletedSet[];
  getConditioningRoundsByBlock: (blockId: string) => ConditioningRoundLog[];
}

export const useSessionStore = create<SessionState>((set, get) => ({
  // Initial state
  activeSession: null,
  isSessionActive: false,
  sessionHistory: [],

  // Session lifecycle actions
  startSession: (session) =>
    set({
      activeSession: session,
      isSessionActive: true,
    }),
  endSession: () => {
    const state = get();
    if (state.activeSession) {
      const completedSession: WorkoutSessionLog = {
        ...state.activeSession,
        endedAt: new Date().toISOString(),
      };
      set((prev) => ({
        activeSession: null,
        isSessionActive: false,
        sessionHistory: [...prev.sessionHistory, completedSession],
      }));
    }
  },
  updateActiveSession: (updates) =>
    set((state) => ({
      activeSession: state.activeSession
        ? { ...state.activeSession, ...updates }
        : null,
    })),

  // Set logging actions
  addCompletedSet: (set) =>
    set((state) => ({
      activeSession: state.activeSession
        ? {
            ...state.activeSession,
            completedSets: [...state.activeSession.completedSets, set],
          }
        : null,
    })),
  updateCompletedSet: (blockId, setIndex, updates) =>
    set((state) => ({
      activeSession: state.activeSession
        ? {
            ...state.activeSession,
            completedSets: state.activeSession.completedSets.map((s) =>
              s.blockId === blockId && s.setIndex === setIndex
                ? { ...s, ...updates }
                : s
            ),
          }
        : null,
    })),
  removeCompletedSet: (blockId, setIndex) =>
    set((state) => ({
      activeSession: state.activeSession
        ? {
            ...state.activeSession,
            completedSets: state.activeSession.completedSets.filter(
              (s) => !(s.blockId === blockId && s.setIndex === setIndex)
            ),
          }
        : null,
    })),
  clearCompletedSets: () =>
    set((state) => ({
      activeSession: state.activeSession
        ? {
            ...state.activeSession,
            completedSets: [],
          }
        : null,
    })),

  // Conditioning rounds actions
  addConditioningRound: (round) =>
    set((state) => ({
      activeSession: state.activeSession
        ? {
            ...state.activeSession,
            conditioningRounds: [
              ...state.activeSession.conditioningRounds,
              round,
            ],
          }
        : null,
    })),
  updateConditioningRound: (blockId, roundIndex, updates) =>
    set((state) => ({
      activeSession: state.activeSession
        ? {
            ...state.activeSession,
            conditioningRounds: state.activeSession.conditioningRounds.map(
              (r) =>
                r.blockId === blockId && r.roundIndex === roundIndex
                  ? { ...r, ...updates }
                  : r
            ),
          }
        : null,
    })),
  removeConditioningRound: (blockId, roundIndex) =>
    set((state) => ({
      activeSession: state.activeSession
        ? {
            ...state.activeSession,
            conditioningRounds: state.activeSession.conditioningRounds.filter(
              (r) => !(r.blockId === blockId && r.roundIndex === roundIndex)
            ),
          }
        : null,
    })),
  clearConditioningRounds: () =>
    set((state) => ({
      activeSession: state.activeSession
        ? {
            ...state.activeSession,
            conditioningRounds: [],
          }
        : null,
    })),

  // Session metadata actions
  setSessionRPE: (rpe) =>
    set((state) => ({
      activeSession: state.activeSession
        ? { ...state.activeSession, sessionRpe: rpe }
        : null,
    })),
  setSessionNotes: (notes) =>
    set((state) => ({
      activeSession: state.activeSession
        ? { ...state.activeSession, notes }
        : null,
    })),
  setSessionVolume: (volume) =>
    set((state) => ({
      activeSession: state.activeSession
        ? { ...state.activeSession, totalVolume: volume }
        : null,
    })),

  // Session history actions
  addSessionToHistory: (session) =>
    set((state) => ({
      sessionHistory: [...state.sessionHistory, session],
    })),
  setSessionHistory: (sessions) => set({ sessionHistory: sessions }),
  getSessionById: (id) => {
    const state = get();
    return state.sessionHistory.find((s) => s.id === id) || null;
  },

  // Helper functions
  getCompletedSetsByBlock: (blockId) => {
    const state = get();
    return (
      state.activeSession?.completedSets.filter((s) => s.blockId === blockId) ||
      []
    );
  },
  getConditioningRoundsByBlock: (blockId) => {
    const state = get();
    return (
      state.activeSession?.conditioningRounds.filter(
        (r) => r.blockId === blockId
      ) || []
    );
  },
}));
