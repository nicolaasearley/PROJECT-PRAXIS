import { WorkoutRecord } from '@/types/workout';
import {
  calculateAcuteLoad,
  calculateChronicLoad,
  calculateAcwr,
  calculateMovementPatternFatigue,
} from '@/utils/recoveryAnalytics';

export type AcwrZone = 'under' | 'optimal' | 'high';

export interface FatigueAnalysis {
  squat: number;
  hinge: number;
  push: number;
  pull: number;
  acwrZone: AcwrZone;
  acwrValue: number; // PATCH PART 1: Include actual ACWR value for consistent use
}

/**
 * Analyze fatigue from workout history
 * Computes pattern fatigue and ACWR zone
 */
export function analyzeFatigue(workouts: WorkoutRecord[]): FatigueAnalysis {
  if (workouts.length === 0) {
    return {
      squat: 0,
      hinge: 0,
      push: 0,
      pull: 0,
      acwrZone: 'optimal',
      acwrValue: 0, // PATCH PART 1: Include acwrValue
    };
  }

  // Calculate movement pattern fatigue
  const patternFatigue = calculateMovementPatternFatigue(workouts);

  // Calculate ACWR
  const acute = calculateAcuteLoad(workouts);
  const chronic = calculateChronicLoad(workouts);
  const acwrFatigue = calculateAcwr(acute, chronic);

  // PATCH PART 1: Get actual ACWR value and zone with updated thresholds
  let acwrValue: number;
  let acwrZone: AcwrZone;
  
  if (chronic === 0) {
    acwrValue = 0;
    acwrZone = 'optimal'; // No chronic load = neutral
  } else {
    acwrValue = acute / chronic;
    acwrZone = getAcwrZone(acwrValue);
  }

  const PERIODIZATION_DEBUG = true;
  if (PERIODIZATION_DEBUG) {
    console.log('[Fatigue] ACWR:', { acwrValue: acwrValue.toFixed(2), acwrZone });
  }

  return {
    squat: patternFatigue.squat,
    hinge: patternFatigue.hinge,
    push: patternFatigue.push,
    pull: patternFatigue.pull,
    acwrZone,
    acwrValue, // PATCH PART 1: Include actual ACWR value
  };
}

/**
 * PATCH PART 1: Get ACWR zone from numeric ACWR value
 * Updated thresholds: optimal = 0.8-1.2, high = 1.2+
 */
function getAcwrZone(acwr: number): AcwrZone {
  if (!isFinite(acwr) || acwr <= 0) return 'under';

  if (acwr < 0.8) return 'under';
  if (acwr <= 1.2) return 'optimal'; // Shrink "optimal" band (was 1.3)
  return 'high'; // 1.2+ = high ACWR (was 1.3+)
}
