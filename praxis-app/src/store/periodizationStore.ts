import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WeeklyStructure } from '@/utils/periodization/buildWeeklyStructure';
import { analyzeReadiness } from '@/utils/periodization/analyzeReadiness';
import { analyzeFatigue } from '@/utils/periodization/analyzeFatigue';
import { buildWeeklyStructure } from '@/utils/periodization/buildWeeklyStructure';
import { inferBlockTypeFromHistory } from '@/utils/periodization/inferBlockType';
import { useUserStore } from '@core/store/useUserStore';
import dayjs from 'dayjs';

interface PeriodizationState {
  currentWeekStructure: WeeklyStructure | null;
  _hasHydrated: boolean;
  setHasHydrated: (hydrated: boolean) => void;
  loadOrCreateWeek: () => void;
  regenerateWeek: () => void;
}

export const usePeriodizationStore = create<PeriodizationState>()(
  persist(
    (set, get) => ({
      currentWeekStructure: null,
      _hasHydrated: false,
      setHasHydrated: (hydrated: boolean) => set({ _hasHydrated: hydrated }),

      loadOrCreateWeek: () => {
        const state = get();
        const today = dayjs();
        const currentWeekStart = today.startOf('isoWeek').format('YYYY-MM-DD');

        // Check if we have a structure for the current week
        if (
          state.currentWeekStructure &&
          state.currentWeekStructure.weekStartISO === currentWeekStart
        ) {
          // If structure exists but doesn't have blockType (old structure), regenerate
          if (!state.currentWeekStructure.blockType) {
            if (process.env.NODE_ENV !== 'production') {
              console.log('[PeriodizationStore] Old structure detected, regenerating with blockType');
            }
            get().regenerateWeek();
            return;
          }
          return; // Already have current week structure with blockType
        }

        // Check if it's Monday or if no structure exists
        const isMonday = today.day() === 1;
        if (isMonday || !state.currentWeekStructure) {
          // Generate new week structure
          get().regenerateWeek();
        }
      },

      regenerateWeek: () => {
        try {
          // Get recovery score and analyze readiness
          const { useRecoveryStore } = require('./recoveryStore');
          const { useWorkoutHistoryStore } = require('./workoutHistoryStore');

          const recoveryStore = useRecoveryStore.getState();
          recoveryStore.calculateRecovery();
          const recoveryScore = recoveryStore.getRecovery();

          const readiness = analyzeReadiness(recoveryScore);

          // Get workout history for fatigue analysis
          const workouts = useWorkoutHistoryStore.getState().getWorkouts();
          const fatigue = analyzeFatigue(workouts);

          // Get user training frequency
          const userStore = useUserStore.getState();
          const trainingDaysPerWeek =
            userStore.preferences.trainingDaysPerWeek || 4;

          // Determine week start ISO for block type inference
          const weekStartISO = dayjs().startOf('isoWeek').format('YYYY-MM-DD');

          // Infer training block type from history, readiness, and fatigue
          const blockType = inferBlockTypeFromHistory(
            workouts,
            readiness,
            fatigue,
            weekStartISO
          );

          if (process.env.NODE_ENV !== 'production') {
            console.log('[PeriodizationStore] Inferred block type:', blockType, {
              weekStartISO,
              readiness: readiness.category,
              acwrZone: fatigue.acwrZone,
            });
          }

          // Build weekly structure with block type
          const weekStructure = buildWeeklyStructure({
            readiness,
            fatigue,
            trainingDaysPerWeek,
            weekStartISO,
            blockType,
          });

          set({
            currentWeekStructure: weekStructure,
          });
        } catch (error) {
          console.warn('Error generating weekly structure:', error);
          // Set a default structure if generation fails
          const defaultStructure: WeeklyStructure = {
            weekStartISO: dayjs().startOf('isoWeek').format('YYYY-MM-DD'),
            days: [],
            blockType: 'accumulation', // Default to accumulation
            metadata: {
              readiness: { score: 50, category: 'moderate' },
              fatigue: {
                squat: 0,
                hinge: 0,
                push: 0,
                pull: 0,
                acwrZone: 'optimal',
              },
              trainingDaysPerWeek: 4,
            },
          };
          set({
            currentWeekStructure: defaultStructure,
          });
        }
      },
    }),
    {
      name: 'periodizationStore',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state?.setHasHydrated) {
          state.setHasHydrated(true);
        }
      },
    }
  )
);
