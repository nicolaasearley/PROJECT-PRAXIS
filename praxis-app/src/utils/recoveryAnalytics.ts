import { WorkoutRecord } from '@/types/workout';
import { MovementPattern } from '@core/types';
import dayjs from 'dayjs';

/**
 * Recovery Score Breakdown Interface
 */
export interface RecoveryBreakdown {
  acwr: number; // 0-100, lower is better (fatigue)
  movementPatternFatigue: {
    squat: number;
    hinge: number;
    push: number;
    pull: number;
    average: number;
  };
  intensityFatigue: number;
  restFatigue: number;
}

/**
 * Calculate Acute Load (last 7 days)
 * Weighted average with most recent workouts having higher weight
 * Returns normalized 0-100
 */
export function calculateAcuteLoad(workouts: WorkoutRecord[]): number {
  if (workouts.length === 0) return 0;

  const now = dayjs();
  const sevenDaysAgo = now.subtract(7, 'days');

  // Filter workouts from last 7 days (0-6 days ago)
  const recentWorkouts = workouts
    .filter((w) => {
      const workoutDate = dayjs(w.date);
      const daysAgo = now.diff(workoutDate, 'days');
      // Include workouts from 0-6 days ago
      return daysAgo >= 0 && daysAgo <= 6;
    })
    .sort((a, b) => {
      const dateA = dayjs(a.date);
      const dateB = dayjs(b.date);
      if (dateA.isBefore(dateB)) return -1;
      if (dateA.isAfter(dateB)) return 1;
      return a.startTime - b.startTime;
    });

  if (recentWorkouts.length === 0) return 0;

  // Calculate weighted average (most recent = higher weight)
  let totalWeightedVolume = 0;
  let totalWeight = 0;

  recentWorkouts.forEach((workout, index) => {
    const daysAgo = now.diff(dayjs(workout.date), 'days');
    const weight = 8 - daysAgo; // Weight decreases with days ago (7 days ago = weight 1, today = weight 8)
    totalWeightedVolume += workout.totalVolume * weight;
    totalWeight += weight;
  });

  const avgVolume = totalWeight > 0 ? totalWeightedVolume / totalWeight : 0;

  // Normalize to 0-100 (assuming max reasonable volume is 50,000 lbs)
  // This is a heuristic - adjust based on actual data distribution
  const maxVolume = 50000;
  return Math.min(100, Math.max(0, (avgVolume / maxVolume) * 100));
}

/**
 * Calculate Chronic Load (days 7-34, EXCLUDING acute window)
 * Weighted average with smoother curve
 * Returns normalized 0-100
 * 
 * PATCH: Chronic load must exclude the acute window (0-6 days ago)
 * to properly calculate ACWR as a ratio of recent spike vs baseline.
 */
export function calculateChronicLoad(workouts: WorkoutRecord[]): number {
  if (workouts.length === 0) return 0;

  const now = dayjs();
  const thirtyFourDaysAgo = now.subtract(34, 'days');
  const sevenDaysAgo = now.subtract(7, 'days');

  // Filter workouts from days 7-34 (EXCLUDE acute window of 0-6 days ago)
  const recentWorkouts = workouts
    .filter((w) => {
      const workoutDate = dayjs(w.date);
      const daysAgo = now.diff(workoutDate, 'days');
      // Include workouts from 7-34 days ago (exclude acute window)
      return daysAgo >= 7 && daysAgo <= 34;
    })
    .sort((a, b) => {
      const dateA = dayjs(a.date);
      const dateB = dayjs(b.date);
      if (dateA.isBefore(dateB)) return -1;
      if (dateA.isAfter(dateB)) return 1;
      return a.startTime - b.startTime;
    });

  if (recentWorkouts.length === 0) return 0;

  // Calculate weighted average (smoother curve - exponential decay)
  let totalWeightedVolume = 0;
  let totalWeight = 0;

  recentWorkouts.forEach((workout) => {
    const daysAgo = now.diff(dayjs(workout.date), 'days');
    const weight = Math.exp(-daysAgo / 7); // Exponential decay with 7-day half-life
    totalWeightedVolume += workout.totalVolume * weight;
    totalWeight += weight;
  });

  const avgVolume = totalWeight > 0 ? totalWeightedVolume / totalWeight : 0;

  // Normalize to 0-100 (same max as acute)
  const maxVolume = 50000;
  return Math.min(100, Math.max(0, (avgVolume / maxVolume) * 100));
}

/**
 * Calculate ACWR (Acute:Chronic Workload Ratio)
 * ACWR = acute / chronic
 * Capped between 0.5 and 2.5
 * Normalized to 0-100 fatigue score (lower = better readiness)
 * 
 * PATCH: Handle zero chronic load to avoid division by zero
 */
export function calculateAcwr(acute: number, chronic: number): number {
  // PATCH: If chronic load is too low (< 1), return 0 to avoid div by zero
  // This happens when there's no baseline history
  if (chronic < 1) return 0;

  let acwr = acute / chronic;
  
  // Cap between 0.5 and 2.5
  acwr = Math.max(0.5, Math.min(2.5, acwr));

  // Convert to fatigue score (0-100)
  // ACWR of 1.0 = optimal (fatigue score 50)
  // ACWR of 0.5 = very fresh (fatigue score 0)
  // ACWR of 2.5 = very fatigued (fatigue score 100)
  const normalized = ((acwr - 0.5) / 2.0) * 100;
  return Math.min(100, Math.max(0, normalized));
}

/**
 * Calculate Movement Pattern Fatigue
 * For patterns: squat, hinge, push, pull
 * Uses last 3 workouts containing the pattern
 * Score based on volume + intensityScore
 * Returns object with 0-100 scores for each pattern
 */
export function calculateMovementPatternFatigue(
  workouts: WorkoutRecord[]
): { squat: number; hinge: number; push: number; pull: number; average: number } {
  const patterns: Array<'squat' | 'hinge' | 'push' | 'pull'> = ['squat', 'hinge', 'push', 'pull'];
  const result: { squat: number; hinge: number; push: number; pull: number; average: number } = {
    squat: 0,
    hinge: 0,
    push: 0,
    pull: 0,
    average: 0,
  };

  // Helper to infer pattern from block title
  const inferPattern = (blockTitle: string): 'squat' | 'hinge' | 'push' | 'pull' | null => {
    const titleLower = blockTitle.toLowerCase();
    if (titleLower.includes('squat')) return 'squat';
    if (titleLower.includes('deadlift') || titleLower.includes('rdl') || titleLower.includes('hinge')) return 'hinge';
    if (titleLower.includes('bench') || titleLower.includes('press')) return 'push';
    if (titleLower.includes('row') || titleLower.includes('pull')) return 'pull';
    return null;
  };

  // Sort workouts by date descending
  const sortedWorkouts = [...workouts].sort((a, b) => {
    const dateA = dayjs(a.date);
    const dateB = dayjs(b.date);
    if (dateA.isAfter(dateB)) return -1;
    if (dateA.isBefore(dateB)) return 1;
    return b.startTime - a.startTime;
  });

  patterns.forEach((pattern) => {
    // Get last 3 workouts containing this pattern
    const patternWorkouts: WorkoutRecord[] = [];
    for (const workout of sortedWorkouts) {
      const hasPattern = workout.blocks.some((block) => {
        const blockPattern = inferPattern(block.title);
        return blockPattern === pattern;
      });
      if (hasPattern) {
        patternWorkouts.push(workout);
        if (patternWorkouts.length >= 3) break;
      }
    }

    if (patternWorkouts.length === 0) {
      result[pattern] = 0; // No fatigue if no workouts
      return;
    }

    // Calculate fatigue score: volume + intensity
    let totalFatigue = 0;
    patternWorkouts.forEach((workout) => {
      // Sum volume from blocks matching this pattern
      let patternVolume = 0;
      workout.blocks.forEach((block) => {
        const blockPattern = inferPattern(block.title);
        if (blockPattern === pattern) {
          patternVolume += block.volume;
        }
      });

      // Normalize volume (0-50 contribution)
      const volumeScore = Math.min(50, (patternVolume / 10000) * 50);

      // Intensity score (0-50 contribution)
      const intensityScore = workout.intensityScore || 0;
      const intensityContribution = (intensityScore / 100) * 50;

      totalFatigue += volumeScore + intensityContribution;
    });

    // Average across workouts and normalize to 0-100
    const avgFatigue = totalFatigue / patternWorkouts.length;
    result[pattern] = Math.min(100, Math.max(0, avgFatigue));
  });

  // Calculate average
  const sum = result.squat + result.hinge + result.push + result.pull;
  result.average = sum / 4;

  return result;
}

/**
 * Calculate Intensity Fatigue
 * Higher RPE and densityScore = more fatigue
 * Uses last 3 workouts
 * Normalize 0-100
 */
export function calculateIntensityFatigue(workouts: WorkoutRecord[]): number {
  if (workouts.length === 0) return 0;

  // Get last 3 workouts
  const sortedWorkouts = [...workouts].sort((a, b) => {
    const dateA = dayjs(a.date);
    const dateB = dayjs(b.date);
    if (dateA.isAfter(dateB)) return -1;
    if (dateA.isBefore(dateB)) return 1;
    return b.startTime - a.startTime;
  });

  const recentWorkouts = sortedWorkouts.slice(0, 3);

  if (recentWorkouts.length === 0) return 0;

  let totalFatigue = 0;
  recentWorkouts.forEach((workout) => {
    // RPE contribution (0-50)
    const avgRpe = workout.avgRpe || 0;
    const rpeContribution = (avgRpe / 10) * 50;

    // Density contribution (0-50)
    const densityContribution = (workout.densityScore / 100) * 50;

    totalFatigue += rpeContribution + densityContribution;
  });

  // Average across workouts
  const avgFatigue = totalFatigue / recentWorkouts.length;
  return Math.min(100, Math.max(0, avgFatigue));
}

/**
 * Calculate Rest Fatigue
 * Average rest per set from last 3 workouts
 * Longer rest → higher accumulated fatigue (more time needed = more fatigue)
 * Normalize 0-100
 */
export function calculateRestFatigue(workouts: WorkoutRecord[]): number {
  if (workouts.length === 0) return 0;

  // Get last 3 workouts
  const sortedWorkouts = [...workouts].sort((a, b) => {
    const dateA = dayjs(a.date);
    const dateB = dayjs(b.date);
    if (dateA.isAfter(dateB)) return -1;
    if (dateA.isBefore(dateB)) return 1;
    return b.startTime - a.startTime;
  });

  const recentWorkouts = sortedWorkouts.slice(0, 3);

  if (recentWorkouts.length === 0) return 0;

  let totalRestSec = 0;
  let totalSets = 0;

  recentWorkouts.forEach((workout) => {
    workout.blocks.forEach((block) => {
      block.sets.forEach((set) => {
        if (set.completed && set.restTimeMs !== null) {
          totalRestSec += set.restTimeMs / 1000;
          totalSets += 1;
        }
      });
    });
  });

  if (totalSets === 0) return 0;

  const avgRestSec = totalRestSec / totalSets;

  // Normalize: 0-60s rest = 0 fatigue, 180s+ rest = 100 fatigue
  // This assumes longer rest indicates more fatigue accumulation
  const normalized = Math.min(100, Math.max(0, ((avgRestSec - 60) / 120) * 100));
  return normalized;
}

/**
 * Calculate Recovery Score
 * Combines all components with weighted average
 * Returns final 0-100 score and breakdown
 * Higher score = better recovery/readiness
 */
export function calculateRecoveryScore(workouts: WorkoutRecord[]): {
  score: number;
  breakdown: RecoveryBreakdown;
} {
  // If no workouts, return perfect recovery
  if (workouts.length === 0) {
    return {
      score: 100,
      breakdown: {
        acwr: 0,
        movementPatternFatigue: {
          squat: 0,
          hinge: 0,
          push: 0,
          pull: 0,
          average: 0,
        },
        intensityFatigue: 0,
        restFatigue: 0,
      },
    };
  }

  // Calculate components
  const acute = calculateAcuteLoad(workouts);
  const chronic = calculateChronicLoad(workouts);
  const acwrFatigue = calculateAcwr(acute, chronic);
  const movementFatigue = calculateMovementPatternFatigue(workouts);
  const intensityFatigue = calculateIntensityFatigue(workouts);
  const restFatigue = calculateRestFatigue(workouts);

  // Weighted average (invert fatigue scores to get recovery scores)
  // ACWR (30%): lower fatigue = higher recovery
  const acwrRecovery = 100 - acwrFatigue;

  // Movement pattern (30%): lower fatigue = higher recovery
  const movementRecovery = 100 - movementFatigue.average;

  // Intensity (20%): lower fatigue = higher recovery
  const intensityRecovery = 100 - intensityFatigue;

  // Rest (20%): lower fatigue = higher recovery
  const restRecovery = 100 - restFatigue;

  // Calculate final score
  const finalScore =
    acwrRecovery * 0.3 +
    movementRecovery * 0.3 +
    intensityRecovery * 0.2 +
    restRecovery * 0.2;

  return {
    score: Math.min(100, Math.max(0, Math.round(finalScore))),
    breakdown: {
      acwr: acwrFatigue,
      movementPatternFatigue: movementFatigue,
      intensityFatigue,
      restFatigue,
    },
  };
}
