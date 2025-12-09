import dayjs from 'dayjs';
import { create } from 'zustand';
import type { WorkoutPlanDay } from '@/core/types';

export interface PlanState {
  plan: WorkoutPlanDay[];
  currentPlanDay: WorkoutPlanDay | null;
  selectedDate: string | null;
  setPlan: (plan: WorkoutPlanDay[]) => void;
  setPlanDays: (plan: WorkoutPlanDay[]) => void;
  addPlanDay: (planDay: WorkoutPlanDay) => void;
  updatePlanDay: (id: string, updates: Partial<WorkoutPlanDay>) => void;
  removePlanDay: (id: string) => void;
  clearPlan: () => void;
  getTodayPlan: () => WorkoutPlanDay | null;
  setCurrentPlanDay: (planDay: WorkoutPlanDay | null) => void;
  setCurrentPlanDayByDate: (date: string) => void;
  setSelectedDate: (date: string | null) => void;
  getPlanDayByDate: (date: string) => WorkoutPlanDay | null;
  getPlanDayById: (id: string) => WorkoutPlanDay | null;
}

const sortPlan = (plan: WorkoutPlanDay[]): WorkoutPlanDay[] => {
  return [...plan].sort((a, b) => a.date.localeCompare(b.date));
};

export const usePlanStore = create<PlanState>((set, get) => ({
  plan: [],
  currentPlanDay: null,
  selectedDate: null,

  setPlan: (plan) => set({ plan: sortPlan(plan) }),

  setPlanDays: (plan) => set({ plan: sortPlan(plan) }),

  addPlanDay: (planDay) =>
    set((state) => ({
      plan: sortPlan([...state.plan.filter((day) => day.id !== planDay.id), planDay]),
    })),

  updatePlanDay: (id, updates) =>
    set((state) => {
      const updatedPlan = state.plan.map((day) =>
        day.id === id ? { ...day, ...updates } : day
      );
      const currentPlanDay =
        state.currentPlanDay?.id === id
          ? { ...state.currentPlanDay, ...updates }
          : state.currentPlanDay;
      return { plan: sortPlan(updatedPlan), currentPlanDay };
    }),

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

  setCurrentPlanDay: (planDay) => set({ currentPlanDay: planDay }),

  setCurrentPlanDayByDate: (date) => {
    const planDay = get().getPlanDayByDate(date);
    set({ currentPlanDay: planDay, selectedDate: date });
  },

  setSelectedDate: (date) => set({ selectedDate: date }),

  getPlanDayByDate: (date) => get().plan.find((day) => day.date === date) || null,

  getPlanDayById: (id) => get().plan.find((day) => day.id === id) || null,
}));

export default usePlanStore;
