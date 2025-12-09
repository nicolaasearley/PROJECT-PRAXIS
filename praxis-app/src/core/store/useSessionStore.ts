import dayjs from 'dayjs';
import { create } from 'zustand';
import type {
  CompletedSet,
  ConditioningRoundLog,
  WorkoutSessionLog,
} from '@/core/types';

interface SessionState {
  activeSession: WorkoutSessionLog | null;
  isSessionActive: boolean;
  sessionHistory: WorkoutSessionLog[];
  startSession: (planDayId: string, userId?: string) => void;
  logStrengthSet: (
    params: Omit<CompletedSet, 'completedAt'> & { completedAt?: string }
  ) => void;
  logConditioningRound: (round: ConditioningRoundLog) => void;
  finishSession: () => WorkoutSessionLog | null;
  cancelSession: () => void;
  addSessionToHistory: (session: WorkoutSessionLog) => void;
  getSessionById: (id: string) => WorkoutSessionLog | null;
}

const generateSessionId = (): string => {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

export const useSessionStore = create<SessionState>((set, get) => ({
  activeSession: null,
  isSessionActive: false,
  sessionHistory: [],

  startSession: (planDayId, userId = 'user-placeholder') => {
    const now = new Date().toISOString();
    const today = dayjs().format('YYYY-MM-DD');

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

    set({ activeSession: newSession, isSessionActive: true });
  },

  logStrengthSet: (params) => {
    set((state) => {
      if (!state.activeSession) {
        return state;
      }

      const completedSet: CompletedSet = {
        ...params,
        completedAt: params.completedAt ?? new Date().toISOString(),
      };

      return {
        activeSession: {
          ...state.activeSession,
          completedSets: [...state.activeSession.completedSets, completedSet],
        },
      };
    });
  },

  logConditioningRound: (round) =>
    set((state) => {
      if (!state.activeSession) {
        return state;
      }

      return {
        activeSession: {
          ...state.activeSession,
          conditioningRounds: [...state.activeSession.conditioningRounds, round],
        },
      };
    }),

  finishSession: () => {
    const { activeSession, sessionHistory } = get();
    if (!activeSession) {
      return null;
    }

    const completedSession: WorkoutSessionLog = {
      ...activeSession,
      endedAt: new Date().toISOString(),
    };

    set({
      activeSession: null,
      isSessionActive: false,
      sessionHistory: [...sessionHistory, completedSession],
    });

    return completedSession;
  },

  cancelSession: () => set({ activeSession: null, isSessionActive: false }),

  addSessionToHistory: (session) =>
    set((state) => ({ sessionHistory: [...state.sessionHistory, session] })),

  getSessionById: (id) => get().sessionHistory.find((session) => session.id === id) || null,
}));

export default useSessionStore;
