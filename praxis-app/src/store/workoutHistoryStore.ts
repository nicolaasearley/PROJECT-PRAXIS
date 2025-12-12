import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkoutRecord } from '@/types/workout';

interface WorkoutHistoryState {
  workouts: WorkoutRecord[];
  _hasHydrated: boolean;
  setHasHydrated: (hydrated: boolean) => void;
  addWorkout: (record: WorkoutRecord) => void;
  getWorkouts: () => WorkoutRecord[];
  clearHistory: () => void;
}

export const useWorkoutHistoryStore = create<WorkoutHistoryState>()(
  persist(
    (set, get) => ({
      workouts: [],
      _hasHydrated: false,
      setHasHydrated: (hydrated: boolean) => set({ _hasHydrated: hydrated }),

      addWorkout: (record) => {
        set((state) => ({
          workouts: [...state.workouts, record],
        }));
      },

      getWorkouts: () => {
        return get().workouts;
      },

      clearHistory: () => {
        set({ workouts: [] });
      },
    }),
    {
      name: 'workoutHistoryStore',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
