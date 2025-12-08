import { create } from 'zustand';
import type { WorkoutPlanDay } from '../types';

interface PlanState {
  // Workout plans
  planDays: WorkoutPlanDay[];
  currentPlanDay: WorkoutPlanDay | null;
  selectedDate: string | null; // yyyy-mm-dd

  // Actions - Plan management
  setPlanDays: (days: WorkoutPlanDay[]) => void;
  addPlanDay: (day: WorkoutPlanDay) => void;
  updatePlanDay: (id: string, updates: Partial<WorkoutPlanDay>) => void;
  removePlanDay: (id: string) => void;
  clearPlanDays: () => void;

  // Actions - Current plan
  setCurrentPlanDay: (day: WorkoutPlanDay | null) => void;
  setCurrentPlanDayByDate: (date: string) => void;
  setSelectedDate: (date: string | null) => void;

  // Helpers
  getPlanDayByDate: (date: string) => WorkoutPlanDay | null;
  getPlanDayById: (id: string) => WorkoutPlanDay | null;
}

export const usePlanStore = create<PlanState>((set, get) => ({
  // Initial state
  planDays: [],
  currentPlanDay: null,
  selectedDate: null,

  // Plan management actions
  setPlanDays: (days) => set({ planDays: days }),
  addPlanDay: (day) =>
    set((state) => ({
      planDays: [...state.planDays, day],
    })),
  updatePlanDay: (id, updates) =>
    set((state) => ({
      planDays: state.planDays.map((day) =>
        day.id === id ? { ...day, ...updates } : day
      ),
      currentPlanDay:
        state.currentPlanDay?.id === id
          ? { ...state.currentPlanDay, ...updates }
          : state.currentPlanDay,
    })),
  removePlanDay: (id) =>
    set((state) => ({
      planDays: state.planDays.filter((day) => day.id !== id),
      currentPlanDay:
        state.currentPlanDay?.id === id ? null : state.currentPlanDay,
    })),
  clearPlanDays: () =>
    set({
      planDays: [],
      currentPlanDay: null,
      selectedDate: null,
    }),

  // Current plan actions
  setCurrentPlanDay: (day) => set({ currentPlanDay: day }),
  setCurrentPlanDayByDate: (date) => {
    const day = get().getPlanDayByDate(date);
    set({ currentPlanDay: day, selectedDate: date });
  },
  setSelectedDate: (date) => set({ selectedDate: date }),

  // Helper functions
  getPlanDayByDate: (date) => {
    const state = get();
    return state.planDays.find((day) => day.date === date) || null;
  },
  getPlanDayById: (id) => {
    const state = get();
    return state.planDays.find((day) => day.id === id) || null;
  },
}));
