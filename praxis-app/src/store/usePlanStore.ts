import { create } from 'zustand';
import type { WorkoutPlanDay } from '../core/types';
import dayjs from 'dayjs';

interface PlanStoreState {
  // Plan data
  plan: WorkoutPlanDay[];

  // Getters
  getTodayPlan: () => WorkoutPlanDay | null;

  // Mutators
  setPlan: (plan: WorkoutPlanDay[]) => void;
  updatePlanDay: (id: string, updated: Partial<WorkoutPlanDay>) => void;

  // Utilities
  clearPlan: () => void;
}

export const usePlanStore = create<PlanStoreState>((set, get) => ({
  // Initial state
  plan: [],

  // Getter - Today's plan
  getTodayPlan: () => {
    const state = get();
    const today = dayjs().format('YYYY-MM-DD');
    return state.plan.find((day) => day.date === today) || null;
  },

  // Mutator - Set entire plan
  setPlan: (plan) => set({ plan }),

  // Mutator - Update specific plan day
  updatePlanDay: (id, updated) =>
    set((state) => ({
      plan: state.plan.map((day) =>
        day.id === id ? { ...day, ...updated } : day
      ),
    })),

  // Utility - Clear plan
  clearPlan: () => set({ plan: [] }),
}));

export default usePlanStore;
