import { create } from 'zustand';
import dayjs from 'dayjs';
import type {
  WorkoutSessionLog,
  CompletedSet,
  ConditioningRoundLog,
} from '../types';

interface SessionStoreState {
  activeSession: WorkoutSessionLog | null;
  isSessionActive: boolean;
  sessionHistory: WorkoutSessionLog[];
  startSession: (planDayId: string) => void;
  logStrengthSet: (params: CompletedSet) => void;
  logConditioningRound: (params: ConditioningRoundLog) => void;
  finishSession: () => WorkoutSessionLog | null;
  cancelSession: () => void;
  addSessionToHistory: (session: WorkoutSessionLog) => void;
}

const generateSessionId = (): string => {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const useSessionStore = create<SessionStoreState>((set, get) => ({
  activeSession: null,
  isSessionActive: false,
  sessionHistory: [],

  startSession: (planDayId) => {
    const now = new Date().toISOString();
    const today = dayjs().format('YYYY-MM-DD');
    const userId = 'user-placeholder';

    const newSession: WorkoutSessionLog = {
      id: generateSessionId(),
      userId,
      planDayId,
      date: today,
      startedAt: now,
      endedAt: '',
      completedSets: [],
      conditioningRounds: [],
      createdAt: now,
    };

    set({
      activeSession: newSession,
      isSessionActive: true,
    });
  },

  logStrengthSet: (params) => {
    const state = get();
    if (!state.activeSession) return;

    const newSet: CompletedSet = {
      ...params,
      completedAt: params.completedAt || new Date().toISOString(),
    };

    set({
      activeSession: {
        ...state.activeSession,
        completedSets: [...state.activeSession.completedSets, newSet],
      },
    });
  },

  logConditioningRound: (params) => {
    const state = get();
    if (!state.activeSession) return;

    set({
      activeSession: {
        ...state.activeSession,
        conditioningRounds: [...state.activeSession.conditioningRounds, params],
      },
    });
  },

  finishSession: () => {
    const state = get();
    if (!state.activeSession) return null;

    const completed: WorkoutSessionLog = {
      ...state.activeSession,
      endedAt: new Date().toISOString(),
    };

    set({
      activeSession: null,
      isSessionActive: false,
      sessionHistory: [...state.sessionHistory, completed],
    });

    return completed;
  },

  cancelSession: () => set({ activeSession: null, isSessionActive: false }),

  addSessionToHistory: (session) =>
    set((state) => ({ sessionHistory: [...state.sessionHistory, session] })),
}));

export default useSessionStore;
