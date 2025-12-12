import { WorkoutRecord } from '@/types/workout';
import { MovementPattern } from '@core/types';
import { EXERCISES, getExerciseById } from '@core/data/exercises';
import dayjs from 'dayjs';

/**
 * Get 7-day volume trend
 * Returns: 'higher', 'lower', or 'same'
 */
export function get7DayVolumeTrend(workouts: WorkoutRecord[]): 'higher' | 'lower' | 'same' {
  if (workouts.length < 2) return 'same';

  const now = dayjs();
  const sevenDaysAgo = now.subtract(7, 'day');

  // Get workouts from last 7 days
  const recentWorkouts = workouts.filter((w) => {
    const workoutDate = dayjs(w.date);
    return workoutDate.isAfter(sevenDaysAgo) || workoutDate.isSame(sevenDaysAgo, 'day');
  });

  // Get workouts from 7-14 days ago
  const previousWorkouts = workouts.filter((w) => {
    const workoutDate = dayjs(w.date);
    return (
      workoutDate.isAfter(now.subtract(14, 'day')) &&
      workoutDate.isBefore(now.subtract(7, 'day'))
    );
  });

  if (recentWorkouts.length === 0 || previousWorkouts.length === 0) return 'same';

  const recentVolume = recentWorkouts.reduce((sum, w) => sum + w.totalVolume, 0);
  const previousVolume = previousWorkouts.reduce((sum, w) => sum + w.totalVolume, 0);

  const threshold = previousVolume * 0.05; // 5% threshold for "same"

  if (recentVolume > previousVolume + threshold) return 'higher';
  if (recentVolume < previousVolume - threshold) return 'lower';
  return 'same';
}

/**
 * Calculate average RPE across all workouts
 */
export function getAvgRpe(workouts: WorkoutRecord[]): number | null {
  if (workouts.length === 0) return null;

  const rpeValues = workouts
    .map((w) => w.avgRpe)
    .filter((rpe): rpe is number => rpe !== null);

  if (rpeValues.length === 0) return null;

  const sum = rpeValues.reduce((acc, rpe) => acc + rpe, 0);
  return Math.round((sum / rpeValues.length) * 10) / 10; // Round to 1 decimal
}

/**
 * Calculate average rest time in seconds across all workouts
 */
export function getAvgRestSec(workouts: WorkoutRecord[]): number | null {
  if (workouts.length === 0) return null;

  const restValues = workouts
    .map((w) => w.avgRestSec)
    .filter((rest): rest is number => rest !== null);

  if (restValues.length === 0) return null;

  const sum = restValues.reduce((acc, rest) => acc + rest, 0);
  return Math.round(sum / restValues.length);
}

/**
 * Calculate average intensity score across all workouts
 */
export function getAvgIntensityScore(workouts: WorkoutRecord[]): number {
  if (workouts.length === 0) return 0;

  const sum = workouts.reduce((acc, w) => acc + w.intensityScore, 0);
  return Math.round(sum / workouts.length);
}

/**
 * Calculate average density score across all workouts
 */
export function getAvgDensityScore(workouts: WorkoutRecord[]): number {
  if (workouts.length === 0) return 0;

  const sum = workouts.reduce((acc, w) => acc + w.densityScore, 0);
  return Math.round((sum / workouts.length) * 10) / 10; // Round to 1 decimal
}

/**
 * Infer movement pattern from block title
 * Tries to match exercise name, then falls back to keyword matching
 */
function inferPatternFromBlockTitle(blockTitle: string): MovementPattern | null {
  // Try exact match with exercise names
  const exercise = EXERCISES.find((ex) => ex.name.toLowerCase() === blockTitle.toLowerCase());
  if (exercise) {
    // Map exercise pattern (from exercise.ts) to core types pattern (from index.ts)
    const patternMap: Record<string, MovementPattern> = {
      squat: 'squat',
      hinge: 'hinge',
      horizontal_push: 'horizontal_press', // Map push -> press
      vertical_push: 'vertical_press', // Map push -> press
      horizontal_pull: 'horizontal_pull',
      vertical_pull: 'vertical_pull',
    };
    const mapped = patternMap[exercise.pattern];
    return mapped || null;
  }

  // Fallback: keyword matching
  const titleLower = blockTitle.toLowerCase();
  if (titleLower.includes('squat')) return 'squat';
  if (titleLower.includes('deadlift') || titleLower.includes('rdl') || titleLower.includes('hinge')) return 'hinge';
  if ((titleLower.includes('bench') || titleLower.includes('press')) && !titleLower.includes('overhead')) return 'horizontal_press';
  if (titleLower.includes('overhead') || titleLower.includes('shoulder press')) return 'vertical_press';
  if (titleLower.includes('row') || (titleLower.includes('pull') && !titleLower.includes('vertical') && !titleLower.includes('pull-up'))) return 'horizontal_pull';
  if (titleLower.includes('pull-up') || titleLower.includes('chin-up') || titleLower.includes('lat pulldown')) return 'vertical_pull';

  return null;
}

/**
 * Get volume trend for a specific movement pattern
 * Returns array of { date, volume } for last 10 workouts with that pattern
 */
export function getPatternVolumeTrend(
  workouts: WorkoutRecord[],
  pattern: MovementPattern
): Array<{ date: string; volume: number; startTime: number }> {
  if (workouts.length === 0) return [];

  const trendData: Array<{ date: string; volume: number; startTime: number }> = [];

  // Sort workouts by date ascending
  const sortedWorkouts = [...workouts].sort((a, b) => {
    const dateA = dayjs(a.date);
    const dateB = dayjs(b.date);
    if (dateA.isBefore(dateB)) return -1;
    if (dateA.isAfter(dateB)) return 1;
    return a.startTime - b.startTime;
  });

  for (const workout of sortedWorkouts) {
    let patternVolume = 0;

    // Sum volume from all blocks matching this pattern
    for (const block of workout.blocks) {
      const blockPattern = inferPatternFromBlockTitle(block.title);
      if (blockPattern === pattern) {
        patternVolume += block.volume;
      }
    }

    if (patternVolume > 0) {
      trendData.push({
        date: workout.date,
        volume: patternVolume,
        startTime: workout.startTime,
      });
    }
  }

  // Return last 10 entries
  return trendData.slice(-10);
}

/**
 * Get volume trend for a specific block title
 * Returns array of { date, volume } for last 10 workouts with that block
 */
export function getBlockVolumeTrend(
  workouts: WorkoutRecord[],
  blockTitle: string
): Array<{ date: string; volume: number; startTime: number }> {
  if (workouts.length === 0) return [];

  const trendData: Array<{ date: string; volume: number; startTime: number }> = [];

  // Sort workouts by date ascending
  const sortedWorkouts = [...workouts].sort((a, b) => {
    const dateA = dayjs(a.date);
    const dateB = dayjs(b.date);
    if (dateA.isBefore(dateB)) return -1;
    if (dateA.isAfter(dateB)) return 1;
    return a.startTime - b.startTime;
  });

  for (const workout of sortedWorkouts) {
    // Find blocks with matching title
    for (const block of workout.blocks) {
      if (block.title.toLowerCase() === blockTitle.toLowerCase()) {
        trendData.push({
          date: workout.date,
          volume: block.volume,
          startTime: workout.startTime,
        });
        break; // Only count once per workout
      }
    }
  }

  // Return last 10 entries
  return trendData.slice(-10);
}
