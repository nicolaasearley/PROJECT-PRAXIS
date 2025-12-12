import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { calculateRecoveryScore, RecoveryBreakdown } from '@/utils/recoveryAnalytics';
import dayjs from 'dayjs';

interface RecoveryState {
  recoveryToday: number | null;
  breakdown: RecoveryBreakdown | null;
  lastCalculatedISO: string | null;
  _hasHydrated: boolean;
  setHasHydrated: (hydrated: boolean) => void;
  calculateRecovery: () => void;
  getRecovery: () => number | null;
  clearRecovery: () => void;
}

export const useRecoveryStore = create<RecoveryState>()(
  persist(
    (set, get) => ({
      recoveryToday: null,
      breakdown: null,
      lastCalculatedISO: null,
      _hasHydrated: false,
      setHasHydrated: (hydrated: boolean) => set({ _hasHydrated: hydrated }),

      calculateRecovery: (workouts?: any[]) => {
        const todayISO = dayjs().format('YYYY-MM-DD');
        const state = get();

        // Only recalculate if date has changed
        if (state.lastCalculatedISO === todayISO && state.recoveryToday !== null) {
          return;
        }

        // Get workouts from history store if not provided
        let workoutList = workouts;
        if (!workoutList) {
          // Dynamic import to avoid circular dependency
          const { useWorkoutHistoryStore } = require('./workoutHistoryStore');
          workoutList = useWorkoutHistoryStore.getState().getWorkouts();
        }

        // If no workouts, set to 100 (fully fresh)
        if (workoutList.length === 0) {
          set({
            recoveryToday: 100,
            breakdown: {
              acwr: 0,
              movementPatternFatigue: {
                squat: 0,
                hinge: 0,
                push: 0,
                pull: 0,
                average: 0,
              },
              intensityFatigue: 0,
              restFatigue: 0,
            },
            lastCalculatedISO: todayISO,
          });
          return;
        }

        // Calculate recovery score
        const { score, breakdown } = calculateRecoveryScore(workoutList);

        set({
          recoveryToday: score,
          breakdown,
          lastCalculatedISO: todayISO,
        });
      },

      getRecovery: () => {
        const state = get();
        const todayISO = dayjs().format('YYYY-MM-DD');

        // Recalculate if stale or missing
        if (state.lastCalculatedISO !== todayISO || state.recoveryToday === null) {
          // Get workouts and recalculate
          const { useWorkoutHistoryStore } = require('./workoutHistoryStore');
          const workouts = useWorkoutHistoryStore.getState().getWorkouts();
          get().calculateRecovery(workouts);
          return get().recoveryToday;
        }

        return state.recoveryToday;
      },

      clearRecovery: () => {
        set({
          recoveryToday: null,
          breakdown: null,
          lastCalculatedISO: null,
        });
      },
    }),
    {
      name: 'recoveryStore',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state?.setHasHydrated) {
          state.setHasHydrated(true);
        }
      },
    }
  )
);
