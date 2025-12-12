import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ExerciseHistoryEntry = {
  date: string; // ISO string
  exerciseId: string;
  blockId: string;
  sessionId: string;
  weight: number;
  reps: number;
  sets: number;
  rpe: number;
  volume: number;
};

interface ProgressionState {
  history: Record<string, ExerciseHistoryEntry[]>;
  _hasHydrated: boolean;
  setHasHydrated: (hydrated: boolean) => void;
  addHistoryEntry: (entry: ExerciseHistoryEntry) => void;
  getHistoryForExercise: (exerciseId: string) => ExerciseHistoryEntry[];
  clearHistory: () => void;
}

export const useProgressionStore = create<ProgressionState>()(
  persist(
    (set, get) => ({
      history: {},
      _hasHydrated: false,
      setHasHydrated: (hydrated: boolean) => set({ _hasHydrated: hydrated }),

      addHistoryEntry: (entry) => {
        set((state) => {
          const exerciseHistory = state.history[entry.exerciseId] || [];
          return {
            history: {
              ...state.history,
              [entry.exerciseId]: [...exerciseHistory, entry],
            },
          };
        });
      },

      getHistoryForExercise: (exerciseId: string) => {
        return get().history[exerciseId] || [];
      },

      clearHistory: () => {
        set({ history: {} });
      },
    }),
    {
      name: 'progressionStore',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state?.setHasHydrated) {
          state.setHasHydrated(true);
        }
      },
    }
  )
);
