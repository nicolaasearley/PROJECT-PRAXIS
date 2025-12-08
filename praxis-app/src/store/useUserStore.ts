import { create } from 'zustand';
import type {
  UserProfile,
  TrainingGoal,
  ExperienceLevel,
  TimeAvailability,
  AdaptationMode,
  StrengthNumbers,
} from '../core/types';

interface UserStoreState {
  // User profile
  userProfile: UserProfile | null;

  // Preferences
  goal: TrainingGoal;
  experienceLevel: ExperienceLevel;
  trainingDaysPerWeek: number;
  timeAvailability: TimeAvailability;
  equipmentIds: string[];
  adaptationMode: AdaptationMode;
  readinessScalingEnabled: boolean;

  // Units
  units: 'metric' | 'imperial';
  distanceUnits: 'kilometers' | 'miles';

  // Strength numbers
  strengthNumbers: StrengthNumbers;

  // Actions - User Profile
  setUserProfile: (profile: UserProfile) => void;

  // Actions - Preferences
  setGoal: (goal: TrainingGoal) => void;
  setExperienceLevel: (level: ExperienceLevel) => void;
  setTrainingDaysPerWeek: (days: number) => void;
  setTimeAvailability: (value: TimeAvailability) => void;
  setEquipmentIds: (ids: string[]) => void;
  setAdaptationMode: (mode: AdaptationMode) => void;
  setReadinessScalingEnabled: (flag: boolean) => void;

  // Actions - Units
  setUnits: (units: 'metric' | 'imperial') => void;
  setDistanceUnits: (units: 'kilometers' | 'miles') => void;

  // Actions - Strength Numbers
  setStrengthNumber: (lift: keyof StrengthNumbers, value: number) => void;

  // Actions - Reset
  resetUser: () => void;
}

const defaultPreferences = {
  goal: 'hybrid' as TrainingGoal,
  experienceLevel: 'intermediate' as ExperienceLevel,
  trainingDaysPerWeek: 5,
  timeAvailability: 'standard' as TimeAvailability,
  equipmentIds: [] as string[],
  adaptationMode: 'automatic' as AdaptationMode,
  readinessScalingEnabled: true,
};

export const useUserStore = create<UserStoreState>((set) => ({
  // Initial state
  userProfile: null,
  ...defaultPreferences,
  units: 'metric',
  distanceUnits: 'kilometers',
  strengthNumbers: {},

  // User Profile actions
  setUserProfile: (profile) => set({ userProfile: profile }),

  // Preferences actions
  setGoal: (goal) => set({ goal }),
  setExperienceLevel: (level) => set({ experienceLevel: level }),
  setTrainingDaysPerWeek: (days) => set({ trainingDaysPerWeek: days }),
  setTimeAvailability: (value) => set({ timeAvailability: value }),
  setEquipmentIds: (ids) => set({ equipmentIds: ids }),
  setAdaptationMode: (mode) => set({ adaptationMode: mode }),
  setReadinessScalingEnabled: (flag) => set({ readinessScalingEnabled: flag }),

  // Units actions
  setUnits: (units) => set({ units }),
  setDistanceUnits: (units) => set({ distanceUnits: units }),

  // Strength Numbers actions
  setStrengthNumber: (lift, value) =>
    set((state) => ({
      strengthNumbers: {
        ...state.strengthNumbers,
        [lift]: value,
      },
    })),

  // Reset action
  resetUser: () =>
    set({
      userProfile: null,
      ...defaultPreferences,
      units: 'metric',
      distanceUnits: 'kilometers',
      strengthNumbers: {},
    }),
}));

export default useUserStore;
