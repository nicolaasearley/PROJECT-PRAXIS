import type {
  WorkoutPlanDay,
  TrainingGoal,
  ExperienceLevel,
  StrengthNumbers,
  TrainingPreferences,
} from '@core/types';
import { generateDailyWorkout } from './generateDailyWorkout';
import { usePeriodizationStore } from '@/store/periodizationStore';
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
 * NEW WEEKLY GOAL TEMPLATES
 */
const WEEKLY_TEMPLATES = {
  strength: [
    'squat',
    'hinge',
    'upper_push_pull',
    'squat',
    'hinge',
    'upper_push_pull',
    'rest',
  ],

  hybrid: [
    'squat',
    'upper_push_pull',
    'conditioning',
    'hinge',
    'mixed_full_body',
    'conditioning',
    'rest',
  ],

  conditioning: [
    'conditioning',
    'conditioning',
    'conditioning',
    'conditioning',
    'conditioning',
    'conditioning',
    'rest',
  ],

  general: [
    'squat',
    'upper_push_pull',
    'conditioning',
    'hinge',
    'mixed_full_body',
    'conditioning',
    'rest',
  ],
} as const;

/**
 * Helper: Apply Technique Week adjustments (week 4 of cycle)
 */
function applyTechniqueWeekModifiers(blocks: any[]) {
  return blocks.map((block) => {
    if (block.type === 'strength' && block.strengthMain) {
      return {
        ...block,
        title: block.title + ' (Technique)',
        strengthMain: {
          ...block.strengthMain,
          sets: block.strengthMain.sets.map((set: any) => ({
            ...set,
            targetRpe: Math.max(5, (set.targetRpe ?? 7) - 2),
          })),
        },
      };
    }

    if (block.type === 'conditioning' && block.conditioning) {
      const currentZone = parseInt(
        block.conditioning.targetZone?.replace('Z', '') || '2'
      );
      return {
        ...block,
        conditioning: {
          ...block.conditioning,
          targetZone: `Z${Math.max(1, currentZone - 1)}`,
          notes: 'Technique Week – Reduced Intensity',
        },
      };
    }

    return block;
  });
}

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
    dayIndex,
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
 * Map template focus to actual workout goal
 */
function mapTemplateFocusToGoal(
  focus: string,
  baseGoal: TrainingGoal
): TrainingGoal {
  if (focus === 'rest') {
    return baseGoal; // Not used for rest days
  }
  if (focus === 'conditioning') {
    return 'conditioning';
  }
  if (focus.includes('squat') || focus.includes('hinge')) {
    return 'strength';
  }
  if (focus.includes('upper') || focus.includes('mixed')) {
    return 'hybrid';
  }
  return baseGoal;
}

/**
 * GENERATE 6-WEEK CYCLE USING WEEKLY TEMPLATES
 * Now integrates with Weekly Structure Engine for periodization
 */
export function generateMicrocycle(params: MicrocycleParams): WorkoutPlanDay[] {
  const template = WEEKLY_TEMPLATES[params.goal ?? 'hybrid'];
  const weeks = 6;
  const cycle: WorkoutPlanDay[] = [];

  // Load or create weekly structure for periodization guidance
  const periodizationStore = usePeriodizationStore.getState();
  periodizationStore.loadOrCreateWeek();
  const weeklyStructure = periodizationStore.currentWeekStructure;

  // Helper to find matching weekly structure day for a given date
  const findWeeklyStructureDay = (dateISO: string) => {
    if (!weeklyStructure) return undefined;
    return weeklyStructure.days.find((day) => day.dateISO === dateISO);
  };

  for (let week = 0; week < weeks; week++) {
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const focus = template[dayIndex];
      const date = dayjs(params.startDate)
        .add(week * 7 + dayIndex, 'day')
        .format('YYYY-MM-DD');

      if (focus === 'rest') {
        // Create rest day
        cycle.push(
          createRestDay(date, dayIndex, params.userId || 'user-placeholder')
        );
      } else {
        // Map template focus to workout goal
        const workoutGoal = mapTemplateFocusToGoal(focus, params.goal);

        // Find matching weekly structure day (if available)
        const weeklyStructureDay = findWeeklyStructureDay(date);

        // Generate base workout with template focus override and weekly structure
        const baseWorkout = generateDailyWorkout({
          goal: workoutGoal,
          experienceLevel: params.experienceLevel,
          equipmentIds: params.equipmentIds,
          units: params.units,
          strengthNumbers: params.strengthNumbers,
          userId: params.userId,
          dayIndex: week * 7 + dayIndex,
          date,
          focusPatternOverride: focus, // ← main pattern comes from weekly template
          weekIndex: week,
          weeklyStructureDay, // ← weekly structure guidance for volume/intensity/conditioning
        });

        // TECHNIQUE WEEK (week 3, zero-based → 4th calendar week)
        const finalWorkout =
          week === 3
            ? {
                ...baseWorkout,
                blocks: applyTechniqueWeekModifiers(baseWorkout.blocks),
              }
            : baseWorkout;

        cycle.push(finalWorkout);
      }
    }
  }

  return cycle;
}
