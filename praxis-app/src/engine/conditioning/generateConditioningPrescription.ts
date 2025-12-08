import type { TrainingGoal, ExperienceLevel } from '../../core/types';

/**
 * Conditioning Block interface for prescription generation
 * This represents a conditioning training block that needs pace/zone/RPE prescription
 */
interface ConditioningBlock {
  id: string;
  type: 'conditioning';
  title: string;
  modality: 'row' | 'bike' | 'ski' | 'run';
  target: {
    method: 'zone' | 'rpe' | 'pace'; // pace = future
    value: number; // Z1–Z5 or RPE 3–10
  };
  workSeconds: number;
  restSeconds?: number | null;
  rounds: number;
  prescribed?: {
    targetPace?: string; // "1:55/500m"
    targetZone?: number;
    targetRPE?: number;
  };
}

interface GenerateConditioningPrescriptionParams {
  block: ConditioningBlock;
  userGoal: TrainingGoal;
  experienceLevel: ExperienceLevel;
}

/**
 * Zone to pace multiplier mapping
 * Multiplier applied to base pace (lower multiplier = faster pace)
 */
const zoneToPaceMultiplier: Record<number, number> = {
  1: 1.2,
  2: 1.1,
  3: 1.0,
  4: 0.92,
  5: 0.85,
};

/**
 * RPE to zone proxy mapping
 * Used to convert RPE targets to approximate zones
 */
const rpeToZone: Record<number, number> = {
  3: 1,
  4: 1,
  5: 2,
  6: 2,
  7: 3,
  8: 3,
  9: 4,
  10: 5,
};

/**
 * Base pace in seconds (2:00/500m = 120 seconds)
 * Placeholder until user performance data is available
 */
const BASE_PACE_SECONDS = 120;

/**
 * Convert split time string to seconds
 * Example: "1:55" → 115 seconds
 */
function splitToSeconds(split: string): number {
  const parts = split.split(':');
  if (parts.length === 2) {
    const minutes = parseInt(parts[0], 10);
    const seconds = parseInt(parts[1], 10);
    return minutes * 60 + seconds;
  }
  // If format is invalid, return base pace
  return BASE_PACE_SECONDS;
}

/**
 * Convert seconds to split time string
 * Example: 115 seconds → "1:55"
 */
function secondsToSplit(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Adjust base pace by multiplier and return formatted split
 * Lower multiplier = faster pace (shorter time)
 */
function adjustPace(baseSeconds: number, multiplier: number): string {
  const adjustedSeconds = baseSeconds * multiplier;
  return secondsToSplit(adjustedSeconds);
}

/**
 * Get user goal pace multiplier
 */
function getUserGoalMultiplier(userGoal: TrainingGoal): number {
  switch (userGoal) {
    case 'hybrid':
      return 1.0;
    case 'strength':
      return 1.05; // Slightly easier
    case 'conditioning':
      return 0.95; // Slightly harder
    case 'general':
      return 1.0;
    default:
      return 1.0;
  }
}

/**
 * Get experience level pace multiplier
 */
function getExperienceLevelMultiplier(
  experienceLevel: ExperienceLevel
): number {
  switch (experienceLevel) {
    case 'beginner':
      return 1.1; // Make slightly easier
    case 'intermediate':
      return 1.0;
    case 'advanced':
      return 0.95; // Increase difficulty
    default:
      return 1.0;
  }
}

/**
 * Calculate prescribed pace from zone
 */
function calculatePaceFromZone(
  zone: number,
  goalMultiplier: number,
  experienceMultiplier: number
): string {
  const clampedZone = Math.max(1, Math.min(5, Math.round(zone)));
  const zoneMultiplier = zoneToPaceMultiplier[clampedZone] || 1.0;

  const totalMultiplier =
    zoneMultiplier * goalMultiplier * experienceMultiplier;

  return adjustPace(BASE_PACE_SECONDS, totalMultiplier);
}

/**
 * Calculate prescribed pace from RPE
 */
function calculatePaceFromRPE(
  rpe: number,
  goalMultiplier: number,
  experienceMultiplier: number
): number {
  // Convert RPE to zone proxy
  const clampedRPE = Math.max(3, Math.min(10, Math.round(rpe)));
  const zoneProxy = rpeToZone[clampedRPE] || 3;

  const clampedZone = Math.max(1, Math.min(5, zoneProxy));
  const zoneMultiplier = zoneToPaceMultiplier[clampedZone] || 1.0;

  const totalMultiplier =
    zoneMultiplier * goalMultiplier * experienceMultiplier;

  return totalMultiplier;
}

/**
 * Generate conditioning prescription by calculating prescribed targets
 *
 * @param params - Prescription parameters
 * @returns ConditioningBlock with prescribed values filled in
 */
export function generateConditioningPrescription(
  params: GenerateConditioningPrescriptionParams
): ConditioningBlock {
  const { block, userGoal, experienceLevel } = params;

  // If already prescribed, return unchanged
  if (block.prescribed) {
    return block;
  }

  // Calculate multipliers
  const goalMultiplier = getUserGoalMultiplier(userGoal);
  const experienceMultiplier = getExperienceLevelMultiplier(experienceLevel);

  // Initialize prescribed object
  const prescribed: {
    targetPace?: string;
    targetZone?: number;
    targetRPE?: number;
  } = {};

  // Determine prescribed values based on target method
  if (block.target.method === 'zone') {
    const zone = Math.max(1, Math.min(5, Math.round(block.target.value)));
    prescribed.targetZone = zone;

    // Calculate pace from zone
    prescribed.targetPace = calculatePaceFromZone(
      zone,
      goalMultiplier,
      experienceMultiplier
    );
  } else if (block.target.method === 'rpe') {
    const rpe = Math.max(3, Math.min(10, Math.round(block.target.value)));
    prescribed.targetRPE = rpe;

    // Convert RPE to zone proxy for pace calculation
    const zoneProxy = rpeToZone[rpe] || 3;
    prescribed.targetZone = zoneProxy;

    // Calculate pace from RPE
    const totalMultiplier = calculatePaceFromRPE(
      rpe,
      goalMultiplier,
      experienceMultiplier
    );
    prescribed.targetPace = adjustPace(BASE_PACE_SECONDS, totalMultiplier);
  } else if (block.target.method === 'pace') {
    // For pace method, assign value directly
    // TODO: Integrate real pace models later
    // Value might be in seconds or already formatted - handle accordingly
    if (typeof block.target.value === 'number') {
      prescribed.targetPace = secondsToSplit(block.target.value);
    } else {
      prescribed.targetPace = block.target.value.toString();
    }
  }

  // Format pace string with modality suffix (pace is already in MM:SS format)
  if (prescribed.targetPace && block.modality) {
    const paceValue = prescribed.targetPace;
    // Add appropriate suffix based on modality
    if (block.modality === 'row') {
      prescribed.targetPace = `${paceValue}/500m`;
    } else if (block.modality === 'bike') {
      prescribed.targetPace = `${paceValue}/km`;
    } else if (block.modality === 'ski') {
      prescribed.targetPace = `${paceValue}/500m`;
    } else if (block.modality === 'run') {
      prescribed.targetPace = `${paceValue}/km`;
    }
  }

  // TODO: Integrate user's historical performance data
  // - Use actual personal best paces
  // - Adjust based on recent performance trends

  // TODO: Integrate row/bike/ski-specific power conversion
  // - Convert watts to pace for bike
  // - Handle different units per modality

  // TODO: Integrate HR-based adjustments
  // - Use heart rate zones to validate pace targets
  // - Adjust if HR data conflicts with prescribed pace

  // TODO: Integrate readiness scaling (after adjustment engine)
  // - Apply readiness adjustments from adjustWorkoutForToday
  // - Scale pace targets based on daily readiness

  // Return new block with prescribed values
  return {
    ...block,
    prescribed,
  };
}
