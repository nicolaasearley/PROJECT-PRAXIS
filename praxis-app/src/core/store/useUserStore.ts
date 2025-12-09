import { create } from 'zustand';
import type { PRRecord, ReadinessEntry, UserProfile } from '../types';

export interface UserPreferences {
  goal: string | null;
  experience: string | null;
  timeAvailability: number | null;
  personalRecords: Record<string, number>;
  trainingDays: number | null;
  equipment: string[];
}

interface UserState {
  userProfile: UserProfile | null;
  isAuthenticated: boolean;
  preferences: UserPreferences;
  hasCompletedOnboarding: boolean;
  currentReadiness: ReadinessEntry | null;
  readinessHistory: ReadinessEntry[];
  personalRecords: PRRecord[];
  setUserProfile: (profile: UserProfile) => void;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  updateStrengthNumbers: (records: Record<string, number>) => void;
  setOnboardingCompleted: () => void;
  resetOnboarding: () => void;
  setAuthenticated: (authenticated: boolean) => void;
  setCurrentReadiness: (entry: ReadinessEntry) => void;
  addReadinessEntry: (entry: ReadinessEntry) => void;
  addPersonalRecord: (record: PRRecord) => void;
  setPersonalRecords: (records: PRRecord[]) => void;
}

const defaultPreferences: UserPreferences = {
  goal: null,
  experience: null,
  timeAvailability: null,
  personalRecords: {},
  trainingDays: null,
  equipment: [],
};

export const useUserStore = create<UserState>((set, get) => ({
  userProfile: null,
  isAuthenticated: false,
  preferences: defaultPreferences,
  hasCompletedOnboarding: false,
  currentReadiness: null,
  readinessHistory: [],
  personalRecords: [],

  setUserProfile: (profile) => set({ userProfile: profile }),
  updateUserProfile: (updates) =>
    set((state) => ({
      userProfile: state.userProfile
        ? { ...state.userProfile, ...updates, updatedAt: new Date().toISOString() }
        : null,
    })),
  updatePreferences: (prefs) =>
    set((state) => ({
      preferences: { ...state.preferences, ...prefs },
    })),
  updateStrengthNumbers: (records) =>
    set((state) => ({
      preferences: {
        ...state.preferences,
        personalRecords: { ...state.preferences.personalRecords, ...records },
      },
    })),
  setOnboardingCompleted: () => set({ hasCompletedOnboarding: true }),
  resetOnboarding: () =>
    set({
      preferences: defaultPreferences,
      hasCompletedOnboarding: false,
      currentReadiness: null,
    }),
  setAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),
  setCurrentReadiness: (entry) => set({ currentReadiness: entry }),
  addReadinessEntry: (entry) =>
    set((state) => ({
      readinessHistory: [...state.readinessHistory, entry],
      currentReadiness: entry,
    })),
  addPersonalRecord: (record) =>
    set((state) => ({
      personalRecords: [...state.personalRecords, record],
    })),
  setPersonalRecords: (records) => set({ personalRecords: records }),
}));

export default useUserStore;
