import type {
  WorkoutPlanDay,
  TrainingGoal,
  ExperienceLevel,
  StrengthNumbers,
} from '../../core/types';
import { generateDailyWorkout } from './generateDailyWorkout';
import dayjs from 'dayjs';

export interface MicrocycleParams {
  startDate: string; // yyyy-mm-dd
  goal: TrainingGoal;
  experienceLevel: ExperienceLevel;
  trainingDaysPerWeek: number; // 3–7
  equipmentIds: string[];
  units: 'metric' | 'imperial';
  strengthNumbers?: StrengthNumbers;
  userId?: string;
}

type DayFocus = 'strength' | 'conditioning' | 'mixed' | 'rest';

/**
 * Add days to a date string
 */
function addDays(dateString: string, days: number): string {
  return dayjs(dateString).add(days, 'day').format('YYYY-MM-DD');
}

/**
 * Generate day focus pattern based on training days per week
 */
function generateDayFocusPattern(trainingDaysPerWeek: number): DayFocus[] {
  const pattern: DayFocus[] = new Array(7).fill('rest');

  if (trainingDaysPerWeek === 3) {
    pattern[0] = 'mixed'; // Monday
    pattern[2] = 'strength'; // Wednesday
    pattern[4] = 'conditioning'; // Friday
  } else if (trainingDaysPerWeek === 4) {
    pattern[0] = 'mixed'; // Monday
    pattern[1] = 'strength'; // Tuesday
    pattern[3] = 'conditioning'; // Thursday
    pattern[5] = 'mixed'; // Saturday
  } else if (trainingDaysPerWeek >= 5) {
    pattern[0] = 'strength'; // Monday
    pattern[1] = 'mixed'; // Tuesday
    pattern[2] = 'conditioning'; // Wednesday
    pattern[3] = 'strength'; // Thursday
    pattern[4] = 'mixed'; // Friday
    if (trainingDaysPerWeek >= 6) {
      pattern[5] = 'conditioning'; // Saturday (easy conditioning)
    }
    // Sunday remains rest
  }

  return pattern;
}

/**
 * Map day focus to training goal for generateDailyWorkout
 */
function mapFocusToGoal(focus: DayFocus, baseGoal: TrainingGoal): TrainingGoal {
  switch (focus) {
    case 'strength':
      return 'strength';
    case 'conditioning':
      return 'conditioning';
    case 'mixed':
      return 'hybrid';
    case 'rest':
      return baseGoal; // Not used for rest days
    default:
      return baseGoal;
  }
}

/**
 * Get estimated duration for a day based on focus
 */
function getEstimatedDuration(focus: DayFocus): number {
  switch (focus) {
    case 'strength':
      return 50;
    case 'conditioning':
      return 35;
    case 'mixed':
      return 60;
    case 'rest':
      return 0;
    default:
      return 0;
  }
}

/**
 * Get focus tags for a day
 */
function getFocusTags(focus: DayFocus): string[] {
  switch (focus) {
    case 'strength':
      return ['strength'];
    case 'conditioning':
      return ['conditioning'];
    case 'mixed':
      return ['mixed'];
    case 'rest':
      return ['rest'];
    default:
      return [];
  }
}

/**
 * Generate a rest day WorkoutPlanDay
 */
function createRestDay(
  date: string,
  dayIndex: number,
  userId: string
): WorkoutPlanDay {
  return {
    id: `rest-${date}`,
    userId,
    date,
    dayIndex,
    focusTags: ['rest'],
    blocks: [],
    estimatedDurationMinutes: 0,
    adjustedForReadiness: false,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Generate a training day WorkoutPlanDay
 */
function createTrainingDay(
  date: string,
  dayIndex: number,
  focus: DayFocus,
  baseGoal: TrainingGoal,
  params: MicrocycleParams
): WorkoutPlanDay {
  // Map focus to goal for workout generation
  const workoutGoal = mapFocusToGoal(focus, baseGoal);

  // Generate the daily workout
  const generatedWorkout = generateDailyWorkout({
    goal: workoutGoal,
    experienceLevel: params.experienceLevel,
    equipmentIds: params.equipmentIds,
    units: params.units,
    strengthNumbers: params.strengthNumbers,
    userId: params.userId,
  });

  // Override with microcycle-specific values
  return {
    ...generatedWorkout,
    id: `${focus}-${date}`,
    date,
    dayIndex,
    focusTags: getFocusTags(focus),
    estimatedDurationMinutes: getEstimatedDuration(focus),
  };
}

/**
 * Generate a complete microcycle (training week)
 *
 * @param params - Microcycle generation parameters
 * @returns Array of WorkoutPlanDay objects for the week
 */
export function generateMicrocycle(params: MicrocycleParams): WorkoutPlanDay[] {
  const { startDate, goal, trainingDaysPerWeek } = params;

  // Generate day focus pattern
  const dayFocusPattern = generateDayFocusPattern(trainingDaysPerWeek);

  // Generate workout plan days for the week
  const microcycle: WorkoutPlanDay[] = [];

  for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
    const date = addDays(startDate, dayIndex);
    const focus = dayFocusPattern[dayIndex];

    if (focus === 'rest') {
      // Create rest day
      microcycle.push(
        createRestDay(date, dayIndex, params.userId || 'user-placeholder')
      );
    } else {
      // Create training day
      microcycle.push(createTrainingDay(date, dayIndex, focus, goal, params));
    }
  }

  // TODO: Integrate userId from userStore
  // TODO: Support variable microcycle lengths (e.g., 5-day microcycle)
  // TODO: Integrate periodization (heavy/light days)
  // TODO: Support different templates per experience level
  // TODO: Support deload weeks

  return microcycle;
}
