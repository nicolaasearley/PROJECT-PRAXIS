import { create } from 'zustand';
import type {
  UserProfile,
  TrainingPreferences,
  StrengthNumbers,
  ReadinessEntry,
  PRRecord,
} from '../types';

interface UserState {
  // User profile
  userProfile: UserProfile | null;
  isAuthenticated: boolean;

  // Readiness tracking
  currentReadiness: ReadinessEntry | null;
  readinessHistory: ReadinessEntry[];

  // Personal records
  personalRecords: PRRecord[];

  // Actions - User Profile
  setUserProfile: (profile: UserProfile) => void;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  updatePreferences: (preferences: Partial<TrainingPreferences>) => void;
  updateStrengthNumbers: (numbers: Partial<StrengthNumbers>) => void;
  clearUserProfile: () => void;

  // Actions - Authentication
  setAuthenticated: (authenticated: boolean) => void;

  // Actions - Readiness
  setCurrentReadiness: (readiness: ReadinessEntry) => void;
  addReadinessEntry: (readiness: ReadinessEntry) => void;
  setReadinessHistory: (history: ReadinessEntry[]) => void;

  // Actions - Personal Records
  addPersonalRecord: (pr: PRRecord) => void;
  updatePersonalRecord: (id: string, updates: Partial<PRRecord>) => void;
  setPersonalRecords: (prs: PRRecord[]) => void;
  removePersonalRecord: (id: string) => void;
}

export const useUserStore = create<UserState>((set) => ({
  // Initial state
  userProfile: null,
  isAuthenticated: false,
  currentReadiness: null,
  readinessHistory: [],
  personalRecords: [],

  // User Profile actions
  setUserProfile: (profile) => set({ userProfile: profile }),
  updateUserProfile: (updates) =>
    set((state) => ({
      userProfile: state.userProfile
        ? {
            ...state.userProfile,
            ...updates,
            updatedAt: new Date().toISOString(),
          }
        : null,
    })),
  updatePreferences: (preferences) =>
    set((state) => ({
      userProfile: state.userProfile
        ? {
            ...state.userProfile,
            preferences: {
              ...state.userProfile.preferences,
              ...preferences,
            },
            updatedAt: new Date().toISOString(),
          }
        : null,
    })),
  updateStrengthNumbers: (numbers) =>
    set((state) => ({
      userProfile: state.userProfile
        ? {
            ...state.userProfile,
            strengthNumbers: {
              ...state.userProfile.strengthNumbers,
              ...numbers,
            },
            updatedAt: new Date().toISOString(),
          }
        : null,
    })),
  clearUserProfile: () =>
    set({
      userProfile: null,
      isAuthenticated: false,
      currentReadiness: null,
      readinessHistory: [],
      personalRecords: [],
    }),

  // Authentication actions
  setAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),

  // Readiness actions
  setCurrentReadiness: (readiness) => set({ currentReadiness: readiness }),
  addReadinessEntry: (readiness) =>
    set((state) => ({
      currentReadiness: readiness,
      readinessHistory: [...state.readinessHistory, readiness],
    })),
  setReadinessHistory: (history) => set({ readinessHistory: history }),

  // Personal Records actions
  addPersonalRecord: (pr) =>
    set((state) => ({
      personalRecords: [...state.personalRecords, pr],
    })),
  updatePersonalRecord: (id, updates) =>
    set((state) => ({
      personalRecords: state.personalRecords.map((pr) =>
        pr.id === id ? { ...pr, ...updates } : pr
      ),
    })),
  setPersonalRecords: (prs) => set({ personalRecords: prs }),
  removePersonalRecord: (id) =>
    set((state) => ({
      personalRecords: state.personalRecords.filter((pr) => pr.id !== id),
    })),
}));
