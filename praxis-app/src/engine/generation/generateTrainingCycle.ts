import type {
  WorkoutPlanDay,
  WorkoutBlock,
  TrainingGoal,
  ExperienceLevel,
  StrengthNumbers,
} from '../../core/types';
import { generateMicrocycle } from './generateMicrocycle';
import dayjs from 'dayjs';

export interface TrainingCycleParams {
  startDate: string; // yyyy-mm-dd
  goal: TrainingGoal;
  experienceLevel: ExperienceLevel;
  trainingDaysPerWeek: number;
  equipmentIds: string[];
  units: 'metric' | 'imperial';
  weeks?: number; // default 4
  strengthNumbers?: StrengthNumbers;
  userId?: string;
}

export interface TrainingCycle {
  id: string;
  startDate: string;
  endDate: string;
  weeks: WorkoutPlanDay[][];
}

/**
 * Add days to a date string
 */
function addDays(dateString: string, days: number): string {
  return dayjs(dateString).add(days, 'day').format('YYYY-MM-DD');
}

/**
 * Get week progression multiplier
 * Week 1: baseline (1.00)
 * Week 2: +5% (1.05)
 * Week 3: +8% (1.08)
 * Week 4+: deload (0.80)
 */
function getWeekMultiplier(weekIndex: number): number {
  if (weekIndex === 0) {
    return 1.0; // Week 1: baseline
  } else if (weekIndex === 1) {
    return 1.05; // Week 2: +5%
  } else if (weekIndex === 2) {
    return 1.08; // Week 3: +8%
  } else {
    return 0.8; // Week 4+: deload -20%
  }
}

/**
 * Convert split time string to seconds
 */
function splitToSeconds(split: string): number {
  // Handle formats like "1:55/500m" or "1:55"
  const cleanSplit = split.split('/')[0];
  const parts = cleanSplit.split(':');
  if (parts.length === 2) {
    const minutes = parseInt(parts[0], 10);
    const seconds = parseInt(parts[1], 10);
    return minutes * 60 + seconds;
  }
  return 120; // Default fallback
}

/**
 * Convert seconds to split time string
 */
function secondsToSplit(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Scale strength block by applying multiplier to prescribed loads
 */
function scaleStrengthBlock(
  block: WorkoutBlock,
  multiplier: number,
  units: 'metric' | 'imperial'
): WorkoutBlock {
  const scaledBlock: WorkoutBlock = { ...block };

  // Scale strength main exercise
  if (block.strengthMain) {
    scaledBlock.strengthMain = {
      ...block.strengthMain,
      sets: block.strengthMain.sets.map((set) => {
        const scaledSet = { ...set };
        // Scale targetPercent1RM if present
        if (set.targetPercent1RM !== undefined) {
          scaledSet.targetPercent1RM = set.targetPercent1RM * multiplier;
          // Round to nearest 2.5%
          scaledSet.targetPercent1RM =
            Math.round(scaledSet.targetPercent1RM / 2.5) * 2.5;
        }
        return scaledSet;
      }),
    };
  }

  // Scale strength secondary exercises
  if (block.strengthSecondary && block.strengthSecondary.length > 0) {
    scaledBlock.strengthSecondary = block.strengthSecondary.map((exercise) => ({
      ...exercise,
      sets: exercise.sets.map((set) => {
        const scaledSet = { ...set };
        if (set.targetPercent1RM !== undefined) {
          scaledSet.targetPercent1RM = set.targetPercent1RM * multiplier;
          scaledSet.targetPercent1RM =
            Math.round(scaledSet.targetPercent1RM / 2.5) * 2.5;
        }
        return scaledSet;
      }),
    }));
  }

  return scaledBlock;
}

/**
 * Scale conditioning block by adjusting pace or zones
 */
function scaleConditioningBlock(
  block: WorkoutBlock,
  multiplier: number
): WorkoutBlock {
  const scaledBlock: WorkoutBlock = { ...block };

  if (block.conditioning) {
    const conditioning = { ...block.conditioning };

    // Scale target zone if present
    if (conditioning.targetZone) {
      const zoneMatch = conditioning.targetZone.match(/Z(\d)/);
      if (zoneMatch) {
        let zoneNumber = parseInt(zoneMatch[1], 10);
        // For deload (multiplier < 1), reduce zone intensity
        // For progression (multiplier > 1), increase zone intensity
        if (multiplier < 1.0) {
          // Deload: move to easier zone
          zoneNumber = Math.max(1, zoneNumber - 1);
        } else if (multiplier > 1.05) {
          // Significant progression: move to harder zone (but not beyond Z5)
          zoneNumber = Math.min(5, zoneNumber + 1);
        }
        conditioning.targetZone = `Z${zoneNumber}`;
      }
    }

    scaledBlock.conditioning = conditioning;
  }

  return scaledBlock;
}

/**
 * Apply week progression scaling to all blocks in a workout day
 */
function applyWeekScaling(
  workoutDay: WorkoutPlanDay,
  weekMultiplier: number,
  units: 'metric' | 'imperial'
): WorkoutPlanDay {
  const scaledBlocks = workoutDay.blocks.map((block) => {
    // Skip warmup and cooldown blocks
    if (block.type === 'warmup' || block.type === 'cooldown') {
      return block;
    }

    // Scale strength blocks
    if (
      block.type === 'strength' &&
      (block.strengthMain || block.strengthSecondary)
    ) {
      return scaleStrengthBlock(block, weekMultiplier, units);
    }

    // Scale conditioning blocks
    if (block.type === 'conditioning' && block.conditioning) {
      return scaleConditioningBlock(block, weekMultiplier);
    }

    // Accessory blocks - mild scaling
    if (block.type === 'accessory' && block.accessory) {
      // TODO: Apply mild volume scaling to accessory work
      return block;
    }

    return block;
  });

  return {
    ...workoutDay,
    blocks: scaledBlocks,
  };
}

/**
 * Generate a complete training cycle (multi-week block)
 *
 * @param params - Training cycle generation parameters
 * @returns TrainingCycle with all weeks of workouts
 */
export function generateTrainingCycle(
  params: TrainingCycleParams
): TrainingCycle {
  const {
    startDate,
    goal,
    experienceLevel,
    trainingDaysPerWeek,
    equipmentIds,
    units,
    weeks = 4, // Default to 4 weeks
    strengthNumbers,
    userId,
  } = params;

  const cycleWeeks: WorkoutPlanDay[][] = [];

  // Generate each week (microcycle)
  for (let weekIndex = 0; weekIndex < weeks; weekIndex++) {
    // Calculate this week's start date
    const weekStartDate = addDays(startDate, weekIndex * 7);

    // Generate microcycle for this week
    const microcycle = generateMicrocycle({
      startDate: weekStartDate,
      goal,
      experienceLevel,
      trainingDaysPerWeek,
      equipmentIds,
      units,
      strengthNumbers,
      userId,
    });

    // Get week progression multiplier
    const weekMultiplier = getWeekMultiplier(weekIndex);

    // Apply week-level progression scaling to all days
    const scaledMicrocycle = microcycle.map((day) => {
      // Skip rest days
      if (day.focusTags.includes('rest')) {
        return day;
      }

      return applyWeekScaling(day, weekMultiplier, units);
    });

    cycleWeeks.push(scaledMicrocycle);
  }

  // Calculate end date (last day of final week)
  const lastWeek = cycleWeeks[cycleWeeks.length - 1];
  const lastDay = lastWeek[lastWeek.length - 1];
  const endDate = lastDay.date;

  // TODO: Customize progression per goal (strength vs conditioning focus)
  // - Strength-focused: emphasize load progression
  // - Conditioning-focused: emphasize pace/intensity progression

  // TODO: Integrate readiness adjustments into weekly scaling
  // - Adjust weekly multiplier based on readiness trends
  // - Reduce progression if readiness consistently low

  // TODO: Integrate block periodization (accumulation → intensification → deload)
  // - Week 1-2: Accumulation (higher volume)
  // - Week 3: Intensification (higher intensity)
  // - Week 4: Deload (reduced volume/intensity)

  // TODO: Integrate PR detection to modify progression
  // - Accelerate progression if PRs detected
  // - Maintain progression if no PRs

  // TODO: Integrate fatigue modeling
  // - Adjust progression based on cumulative fatigue
  // - Prevent overreaching with smarter deload timing

  return {
    id: `cycle-${startDate}`,
    startDate,
    endDate,
    weeks: cycleWeeks,
  };
}
