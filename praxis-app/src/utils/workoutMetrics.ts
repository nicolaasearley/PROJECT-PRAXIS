import { WorkoutRecord } from '@/types/workout';
import { WorkoutBlock } from '@core/types';

interface BlockWithSets {
  blockId: string;
  title: string;
  type: string;
  prescribedSets: number;
  prescribedReps: number | null;
  targetRpe: number | null;
  sets: {
    completed: boolean;
    weight: number | null;
    rpe: number | null;
    restTimeMs: number | null;
  }[];
}

/**
 * Calculate volume for a block (sum of weight × reps for completed sets)
 */
export function calculateBlockVolume(block: BlockWithSets): number {
  let volume = 0;
  
  block.sets.forEach((set) => {
    if (set.completed && set.weight !== null && set.weight > 0) {
      const reps = block.prescribedReps || 0;
      volume += set.weight * reps;
    }
  });

  return volume;
}

/**
 * Calculate average RPE for a block (only from completed sets with RPE)
 */
export function calculateBlockAvgRpe(block: BlockWithSets): number | null {
  const rpeValues = block.sets
    .filter((set) => set.completed && set.rpe !== null)
    .map((set) => set.rpe as number);

  if (rpeValues.length === 0) return null;

  const sum = rpeValues.reduce((acc, rpe) => acc + rpe, 0);
  return Math.round((sum / rpeValues.length) * 10) / 10; // Round to 1 decimal
}

/**
 * Calculate average rest time in seconds for a block
 */
export function calculateBlockAvgRest(block: BlockWithSets): number | null {
  const restTimes = block.sets
    .filter((set) => set.completed && set.restTimeMs !== null && set.restTimeMs > 0)
    .map((set) => (set.restTimeMs as number) / 1000); // Convert to seconds

  if (restTimes.length === 0) return null;

  const sum = restTimes.reduce((acc, rest) => acc + rest, 0);
  return Math.round(sum / restTimes.length);
}

/**
 * Calculate workout-level totals
 */
export function calculateWorkoutTotals(blocks: BlockWithSets[]): {
  totalVolume: number;
  avgRpe: number | null;
  avgRestSec: number | null;
} {
  let totalVolume = 0;
  const allRpeValues: number[] = [];
  const allRestTimes: number[] = [];

  blocks.forEach((block) => {
    totalVolume += calculateBlockVolume(block);

    const blockRpe = calculateBlockAvgRpe(block);
    if (blockRpe !== null) {
      allRpeValues.push(blockRpe);
    }

    const blockRest = calculateBlockAvgRest(block);
    if (blockRest !== null) {
      allRestTimes.push(blockRest);
    }
  });

  const avgRpe =
    allRpeValues.length > 0
      ? Math.round((allRpeValues.reduce((acc, rpe) => acc + rpe, 0) / allRpeValues.length) * 10) / 10
      : null;

  const avgRestSec =
    allRestTimes.length > 0
      ? Math.round(allRestTimes.reduce((acc, rest) => acc + rest, 0) / allRestTimes.length)
      : null;

  return {
    totalVolume,
    avgRpe,
    avgRestSec,
  };
}

/**
 * Calculate density score (volume per minute)
 * Higher score = more work done in less time
 */
export function calculateDensityScore(workoutRecord: WorkoutRecord): number {
  if (workoutRecord.durationMin === 0) return 0;
  return Math.round((workoutRecord.totalVolume / workoutRecord.durationMin) * 10) / 10;
}

/**
 * Calculate intensity score
 * Combines RPE and volume relative to workout duration
 * Formula: (avgRpe / 10) * (totalVolume / durationMin) * 100
 */
export function calculateIntensityScore(workoutRecord: WorkoutRecord): number {
  if (workoutRecord.durationMin === 0) return 0;
  
  const rpeFactor = workoutRecord.avgRpe ? workoutRecord.avgRpe / 10 : 0.5; // Default to 0.5 if no RPE
  const volumePerMin = workoutRecord.totalVolume / workoutRecord.durationMin;
  
  return Math.round(rpeFactor * volumePerMin * 100);
}
