import { create } from 'zustand';
import type {
  DistanceUnit,
  PRRecord,
  ReadinessEntry,
  StrengthNumbers,
  TrainingPreferences,
  UserProfile,
} from '@/core/types';

export interface UserState {
  userProfile: UserProfile | null;
  preferences: TrainingPreferences;
  strengthNumbers: StrengthNumbers;
  distanceUnits: DistanceUnit;
  isAuthenticated: boolean;
  currentReadiness: ReadinessEntry | null;
  readinessHistory: ReadinessEntry[];
  personalRecords: PRRecord[];
  setUserProfile: (profile: UserProfile) => void;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  updatePreferences: (preferences: Partial<TrainingPreferences>) => void;
  updateStrengthNumbers: (numbers: Partial<StrengthNumbers>) => void;
  setDistanceUnits: (unit: DistanceUnit) => void;
  clearUserProfile: () => void;
  setAuthenticated: (authenticated: boolean) => void;
  setCurrentReadiness: (readiness: ReadinessEntry) => void;
  addReadinessEntry: (readiness: ReadinessEntry) => void;
  setReadinessHistory: (history: ReadinessEntry[]) => void;
  addPersonalRecord: (pr: PRRecord) => void;
  updatePersonalRecord: (id: string, updates: Partial<PRRecord>) => void;
  setPersonalRecords: (prs: PRRecord[]) => void;
  removePersonalRecord: (id: string) => void;
}

const defaultPreferences: TrainingPreferences = {
  goal: 'hybrid',
  experienceLevel: 'intermediate',
  trainingDaysPerWeek: 4,
  timeAvailability: 'standard',
  equipmentIds: [],
  adaptationMode: 'automatic',
  readinessScalingEnabled: true,
};

export const useUserStore = create<UserState>((set) => ({
  userProfile: null,
  preferences: defaultPreferences,
  strengthNumbers: {},
  distanceUnits: 'kilometers',
  isAuthenticated: false,
  currentReadiness: null,
  readinessHistory: [],
  personalRecords: [],

  setUserProfile: (profile) =>
    set({
      userProfile: profile,
      preferences: profile.preferences ?? defaultPreferences,
      strengthNumbers: profile.strengthNumbers ?? {},
      distanceUnits: profile.distanceUnits ?? 'kilometers',
    }),

  updateUserProfile: (updates) =>
    set((state) => {
      const mergedProfile = state.userProfile
        ? { ...state.userProfile, ...updates }
        : null;
      const mergedPreferences: TrainingPreferences = {
        ...state.preferences,
        ...(updates.preferences ?? {}),
      };

      return {
        userProfile: mergedProfile
          ? {
              ...mergedProfile,
              preferences: mergedPreferences,
              strengthNumbers: {
                ...state.strengthNumbers,
                ...mergedProfile.strengthNumbers,
              },
              updatedAt: new Date().toISOString(),
            }
          : null,
        preferences: mergedPreferences,
        strengthNumbers: {
          ...state.strengthNumbers,
          ...(updates.strengthNumbers ?? {}),
        },
        distanceUnits: updates.distanceUnits ?? state.distanceUnits,
      };
    }),

  updatePreferences: (preferences) =>
    set((state) => {
      const mergedPreferences: TrainingPreferences = {
        ...state.preferences,
        ...preferences,
      };

      return {
        preferences: mergedPreferences,
        userProfile: state.userProfile
          ? {
              ...state.userProfile,
              preferences: mergedPreferences,
              updatedAt: new Date().toISOString(),
            }
          : null,
      };
    }),

  updateStrengthNumbers: (numbers) =>
    set((state) => ({
      strengthNumbers: {
        ...state.strengthNumbers,
        ...numbers,
      },
      userProfile: state.userProfile
        ? {
            ...state.userProfile,
            strengthNumbers: {
              ...(state.userProfile.strengthNumbers ?? {}),
              ...numbers,
            },
            updatedAt: new Date().toISOString(),
          }
        : null,
    })),

  setDistanceUnits: (unit) =>
    set((state) => ({
      distanceUnits: unit,
      userProfile: state.userProfile
        ? { ...state.userProfile, distanceUnits: unit, updatedAt: new Date().toISOString() }
        : null,
    })),

  clearUserProfile: () =>
    set({
      userProfile: null,
      preferences: defaultPreferences,
      strengthNumbers: {},
      distanceUnits: 'kilometers',
      isAuthenticated: false,
      currentReadiness: null,
      readinessHistory: [],
      personalRecords: [],
    }),

  setAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),

  setCurrentReadiness: (readiness) => set({ currentReadiness: readiness }),

  addReadinessEntry: (readiness) =>
    set((state) => ({
      currentReadiness: readiness,
      readinessHistory: [...state.readinessHistory, readiness],
    })),

  setReadinessHistory: (history) => set({ readinessHistory: history }),

  addPersonalRecord: (pr) =>
    set((state) => ({ personalRecords: [...state.personalRecords, pr] })),

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

export default useUserStore;
