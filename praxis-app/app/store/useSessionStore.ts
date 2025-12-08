import { create } from 'zustand';
import type {
  WorkoutSessionLog,
  CompletedSet,
  ConditioningRoundLog,
} from '../core/types';
import dayjs from 'dayjs';

interface SessionStoreState {
  // State
  activeSession: WorkoutSessionLog | null;
  isSessionActive: boolean;

  // Actions
  startSession: (planDayId: string) => void;
  logStrengthSet: (params: {
    exerciseId: string;
    blockId: string;
    setIndex: number;
    weight?: number;
    reps?: number;
    rpe?: number;
    durationSeconds?: number;
  }) => void;
  logConditioningRound: (params: {
    blockId: string;
    roundIndex: number;
    workSeconds: number;
    restSeconds: number;
    perceivedIntensity?: number;
  }) => void;
  finishSession: () => WorkoutSessionLog | null;
  cancelSession: () => void;
}

const generateSessionId = (): string => {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const useSessionStore = create<SessionStoreState>((set, get) => ({
  // Initial state
  activeSession: null,
  isSessionActive: false,

  // Start a new session
  startSession: (planDayId) => {
    const now = new Date().toISOString();
    const today = dayjs().format('YYYY-MM-DD');

    // TODO: Get userId from userStore or context
    // For now using placeholder - will be set by caller context
    const userId = 'user-placeholder';

    const newSession: WorkoutSessionLog = {
      id: generateSessionId(),
      userId,
      planDayId,
      date: today,
      startedAt: now,
      endedAt: '', // Will be set when finishing
      completedSets: [],
      conditioningRounds: [],
      createdAt: now,
    };

    set({
      activeSession: newSession,
      isSessionActive: true,
    });
  },

  // Log a strength set
  logStrengthSet: (params) => {
    const state = get();
    if (!state.activeSession) return;

    const newSet: CompletedSet = {
      exerciseId: params.exerciseId,
      blockId: params.blockId,
      setIndex: params.setIndex,
      weight: params.weight,
      reps: params.reps,
      rpe: params.rpe,
      durationSeconds: params.durationSeconds,
      completedAt: new Date().toISOString(),
    };

    set({
      activeSession: {
        ...state.activeSession,
        completedSets: [...state.activeSession.completedSets, newSet],
      },
    });
  },

  // Log a conditioning round
  logConditioningRound: (params) => {
    const state = get();
    if (!state.activeSession) return;

    const newRound: ConditioningRoundLog = {
      blockId: params.blockId,
      roundIndex: params.roundIndex,
      workSeconds: params.workSeconds,
      restSeconds: params.restSeconds,
      perceivedIntensity: params.perceivedIntensity,
    };

    set({
      activeSession: {
        ...state.activeSession,
        conditioningRounds: [
          ...state.activeSession.conditioningRounds,
          newRound,
        ],
      },
    });
  },

  // Finish the session
  finishSession: () => {
    const state = get();
    if (!state.activeSession) return null;

    const completedSession: WorkoutSessionLog = {
      ...state.activeSession,
      endedAt: new Date().toISOString(),
    };

    set({
      activeSession: null,
      isSessionActive: false,
    });

    return completedSession;
  },

  // Cancel the session
  cancelSession: () => {
    set({
      activeSession: null,
      isSessionActive: false,
    });
  },
}));

export default useSessionStore;
