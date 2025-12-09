// -----------------------------
//   PROJECT PRAXIS DATA MODELS
// -----------------------------

// ------- USER + PREFERENCES -------

export type TrainingGoal = 'strength' | 'conditioning' | 'hybrid' | 'general';

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export type TimeAvailability = 'short' | 'standard' | 'full';

export type AdaptationMode = 'conservative' | 'automatic' | 'aggressive';

export type DistanceUnit = 'kilometers' | 'miles';

export interface EquipmentItem {
  id: string; // e.g. "barbell", "dumbbell"
  name: string;
}

export interface TrainingPreferences {
  goal: TrainingGoal;
  experienceLevel: ExperienceLevel;
  trainingDaysPerWeek: number; // e.g. 3-7 days
  timeAvailability: TimeAvailability;
  equipmentIds: string[]; // EquipmentItem.id[]
  adaptationMode: AdaptationMode;
  readinessScalingEnabled: boolean;
}

export interface StrengthNumbers {
  squat1RM?: number;
  bench1RM?: number;
  deadlift1RM?: number;
  press1RM?: number;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  dob?: string;
  country?: string;
  units: 'metric' | 'imperial';
  distanceUnits?: DistanceUnit;
  preferences: TrainingPreferences;
  strengthNumbers?: StrengthNumbers;
  createdAt: string;
  updatedAt: string;
}

// ------- EXERCISES -------

export type MovementPattern =
  | 'squat'
  | 'hinge'
  | 'horizontal_press'
  | 'vertical_press'
  | 'horizontal_pull'
  | 'vertical_pull'
  | 'carry'
  | 'engine'
  | 'core'
  | 'mobility';

export type MuscleGroup =
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'arms'
  | 'core'
  | 'full_body';

export type EquipmentType =
  | 'barbell'
  | 'dumbbell'
  | 'kettlebell'
  | 'machine'
  | 'sled'
  | 'rower'
  | 'bike'
  | 'ski_erg'
  | 'bodyweight'
  | 'other';

export interface ExerciseDefinition {
  id: string;
  name: string;
  movementPattern: MovementPattern;
  primaryMuscles: MuscleGroup[];
  equipment: EquipmentType[];
  isConditioning: boolean;
  defaultRestSeconds?: number;
  notes?: string;
}

// ------- BLOCKS & WORKOUTS -------

export type BlockType =
  | 'warmup'
  | 'strength'
  | 'accessory'
  | 'conditioning'
  | 'cooldown';

export interface SetPrescription {
  targetReps?: number;
  targetRpe?: number;
  targetPercent1RM?: number;
  targetDurationSeconds?: number;
}

export interface StrengthExercisePrescription {
  exerciseId: string;
  sets: SetPrescription[];
}

export interface AccessoryExercisePrescription {
  exerciseId: string;
  sets: SetPrescription[];
}

export interface ConditioningPrescription {
  mode: 'interval' | 'steady' | 'emom';
  workSeconds?: number;
  restSeconds?: number;
  rounds?: number;
  targetZone?: string; // e.g. "Z3" or "Z4"
  notes?: string;
}

export interface WorkoutBlock {
  id: string;
  type: BlockType;
  title: string;
  estimatedDurationMinutes?: number;

  // optional contents per type
  strengthMain?: StrengthExercisePrescription;
  strengthSecondary?: StrengthExercisePrescription[];
  accessory?: AccessoryExercisePrescription[];
  conditioning?: ConditioningPrescription;

  warmupItems?: string[];
  cooldownItems?: string[];
}

export interface WorkoutPlanDay {
  id: string;
  userId: string;
  date: string; // yyyy-mm-dd
  dayIndex: number; // sequence index within cycle/week
  focusTags: string[]; // e.g. ["lower", "engine"]
  blocks: WorkoutBlock[];
  estimatedDurationMinutes: number;
  adjustedForReadiness: boolean;
  createdAt: string;
}

// ------- WORKOUT LOGS -------

export interface CompletedSet {
  exerciseId: string;
  blockId: string;
  setIndex: number;
  weight?: number;
  reps?: number;
  rpe?: number;
  durationSeconds?: number;
  completedAt: string;
}

export interface ConditioningRoundLog {
  blockId: string;
  roundIndex: number;
  workSeconds: number;
  restSeconds: number;
  perceivedIntensity?: number; // optional
}

export interface WorkoutSessionLog {
  id: string;
  userId: string;
  planDayId?: string;
  date: string;
  startedAt: string;
  endedAt: string;
  completedSets: CompletedSet[];
  conditioningRounds: ConditioningRoundLog[];
  sessionRpe?: number;
  notes?: string;
  totalVolume?: number;
  createdAt: string;
}

// ------- READINESS & PRs -------

export interface ReadinessInputs {
  date: string;
  sleepQuality: number; // 1–5
  energy: number; // 1–5
  soreness: number; // 1–5
  stress: number; // 1–5
  timeAvailability: TimeAvailability;
}

export interface ReadinessEntry extends ReadinessInputs {
  userId: string;
  readinessScore: number; // 0–100
  createdAt: string;
}

export interface PRRecord {
  id: string;
  userId: string;
  exerciseId: string;
  date: string;
  estimated1RM: number;
  changeFromPrevious?: number;
}
