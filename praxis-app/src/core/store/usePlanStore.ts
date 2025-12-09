import { create } from 'zustand';
import type { WorkoutPlanDay } from '../types';
import dayjs from 'dayjs';

interface PlanState {
  plan: WorkoutPlanDay[];
  currentPlanDay: WorkoutPlanDay | null;
  selectedDate: string | null;
  setPlan: (plan: WorkoutPlanDay[]) => void;
  setPlanDays: (plan: WorkoutPlanDay[]) => void;
  addPlanDay: (day: WorkoutPlanDay) => void;
  updatePlanDay: (id: string, updates: Partial<WorkoutPlanDay>) => void;
  removePlanDay: (id: string) => void;
  clearPlan: () => void;
  getTodayPlan: () => WorkoutPlanDay | null;
  setCurrentPlanDay: (day: WorkoutPlanDay | null) => void;
  setCurrentPlanDayByDate: (date: string) => void;
  setSelectedDate: (date: string | null) => void;
  getPlanDayByDate: (date: string) => WorkoutPlanDay | null;
  getPlanDayById: (id: string) => WorkoutPlanDay | null;
}

export const usePlanStore = create<PlanState>((set, get) => ({
  plan: [],
  currentPlanDay: null,
  selectedDate: null,

  setPlan: (plan) => set({ plan, currentPlanDay: null }),
  setPlanDays: (plan) => set({ plan, currentPlanDay: null }),
  addPlanDay: (day) => set((state) => ({ plan: [...state.plan, day] })),
  updatePlanDay: (id, updates) =>
    set((state) => ({
      plan: state.plan.map((day) => (day.id === id ? { ...day, ...updates } : day)),
      currentPlanDay:
        state.currentPlanDay?.id === id
          ? { ...state.currentPlanDay, ...updates }
          : state.currentPlanDay,
    })),
  removePlanDay: (id) =>
    set((state) => ({
      plan: state.plan.filter((day) => day.id !== id),
      currentPlanDay: state.currentPlanDay?.id === id ? null : state.currentPlanDay,
    })),
  clearPlan: () => set({ plan: [], currentPlanDay: null, selectedDate: null }),
  getTodayPlan: () => {
    const today = dayjs().format('YYYY-MM-DD');
    return get().plan.find((day) => day.date === today) || null;
  },
  setCurrentPlanDay: (day) => set({ currentPlanDay: day }),
  setCurrentPlanDayByDate: (date) => {
    const day = get().getPlanDayByDate(date);
    set({ currentPlanDay: day, selectedDate: date });
  },
  setSelectedDate: (date) => set({ selectedDate: date }),
  getPlanDayByDate: (date) => {
    return get().plan.find((day) => day.date === date) || null;
  },
  getPlanDayById: (id) => {
    return get().plan.find((day) => day.id === id) || null;
  },
}));

export default usePlanStore;
