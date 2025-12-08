import type {
  StrengthNumbers,
  ExerciseDefinition,
  MuscleGroup,
} from '../../core/types';

/**
 * Strength Block interface for prescription generation
 * This represents a strength training block that needs load prescription
 */
interface StrengthBlock {
  id: string;
  type: 'strength';
  title: string;
  targetIntensity: {
    method: 'percentage' | 'rpe';
    value: number; // % as decimal (0.75) or RPE (6–10)
  };
  reps: number;
  sets: number;
  exercise: ExerciseDefinition;
  prescribedLoad?: number; // Will be filled by this function
}

interface GenerateStrengthPrescriptionParams {
  block: StrengthBlock;
  strengthNumbers: StrengthNumbers; // from user profile
  units: 'metric' | 'imperial';
}

/**
 * RPE to percentage adjustment mapping
 * Simple heuristic until full RPE tables are implemented
 */
const rpeAdjustment: Record<number, number> = {
  6: 0.7,
  7: 0.75,
  8: 0.8,
  9: 0.85,
  10: 0.9,
};

/**
 * Map muscle group to strength number key
 * TODO: Expand mapping for more exercises
 */
function getStrengthNumberKey(
  muscleGroup: MuscleGroup
): keyof StrengthNumbers | null {
  // Map primary muscle groups to strength number keys
  const mapping: Partial<Record<MuscleGroup, keyof StrengthNumbers>> = {
    quads: 'squat1RM',
    hamstrings: 'deadlift1RM',
    glutes: 'deadlift1RM',
    chest: 'bench1RM',
    shoulders: 'press1RM',
    back: 'deadlift1RM', // Default to deadlift for back, could be refined
  };

  return mapping[muscleGroup] || null;
}

/**
 * Round load based on units
 * Imperial: round to nearest 5 lb
 * Metric: round to nearest 2.5 kg
 */
function roundLoad(load: number, units: 'metric' | 'imperial'): number {
  if (units === 'imperial') {
    return Math.round(load / 5) * 5;
  } else {
    // metric
    return Math.round(load / 2.5) * 2.5;
  }
}

/**
 * Clamp RPE value to valid range (6-10)
 */
function clampRPE(rpe: number): number {
  return Math.max(6, Math.min(10, Math.round(rpe)));
}

/**
 * Get estimated 1RM for an exercise based on muscle group
 */
function getEstimated1RM(
  exercise: ExerciseDefinition,
  strengthNumbers: StrengthNumbers
): number | null {
  // Use primary muscle group to determine which 1RM to use
  const primaryMuscle = exercise.primaryMuscles[0];
  const strengthKey = getStrengthNumberKey(primaryMuscle);

  if (!strengthKey) {
    return null;
  }

  return strengthNumbers[strengthKey] || null;
}

/**
 * Calculate load based on percentage method
 */
function calculateLoadFromPercentage(
  estimated1RM: number,
  percentage: number
): number {
  return estimated1RM * percentage;
}

/**
 * Calculate load based on RPE method
 */
function calculateLoadFromRPE(estimated1RM: number, rpe: number): number {
  const clampedRPE = clampRPE(rpe);
  const adjustment = rpeAdjustment[clampedRPE];

  if (!adjustment) {
    // Fallback to middle RPE if value not in table
    return estimated1RM * 0.8;
  }

  return estimated1RM * adjustment;
}

/**
 * Generate strength prescription by calculating prescribed load
 *
 * @param params - Prescription parameters
 * @returns StrengthBlock with prescribedLoad filled in
 */
export function generateStrengthPrescription(
  params: GenerateStrengthPrescriptionParams
): StrengthBlock {
  const { block, strengthNumbers, units } = params;

  // If load is already prescribed, return unchanged
  if (block.prescribedLoad !== undefined) {
    return block;
  }

  // Get estimated 1RM for the exercise
  const estimated1RM = getEstimated1RM(block.exercise, strengthNumbers);

  if (!estimated1RM) {
    // TODO: Handle missing 1RM data
    // For now, return block unchanged
    return block;
  }

  let calculatedLoad: number;

  // Calculate load based on intensity method
  if (block.targetIntensity.method === 'percentage') {
    calculatedLoad = calculateLoadFromPercentage(
      estimated1RM,
      block.targetIntensity.value
    );
  } else if (block.targetIntensity.method === 'rpe') {
    calculatedLoad = calculateLoadFromRPE(
      estimated1RM,
      block.targetIntensity.value
    );
  } else {
    // Unknown method, return unchanged
    return block;
  }

  // Round load based on units
  const roundedLoad = roundLoad(calculatedLoad, units);

  // TODO: Integrate progression models
  // - Track volume progression over time
  // - Apply linear/undulating periodization

  // TODO: Movement-specific load adjustments
  // - Adjust for exercise variations (e.g., front squat vs back squat)
  // - Account for movement efficiency differences

  // TODO: Fatigue adjustments from readiness score
  // - Reduce load if readiness is low
  // - Increase load if readiness is high

  // TODO: Autoregulation (AMRAP data)
  // - Adjust based on previous session's AMRAP performance
  // - Use RPE feedback to modify future loads

  // TODO: Deload logic
  // - Implement deload weeks
  // - Handle plateaus with strategic deloads

  // Return new block with prescribed load
  return {
    ...block,
    prescribedLoad: roundedLoad,
  };
}
