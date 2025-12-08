import type {
  WorkoutPlanDay,
  WorkoutBlock,
  AdaptationMode,
  StrengthExercisePrescription,
  AccessoryExercisePrescription,
  ConditioningPrescription,
  SetPrescription,
} from '../../core/types';

interface AdjustWorkoutParams {
  workout: WorkoutPlanDay;
  readinessScore: number; // 0–100
  adaptationMode: AdaptationMode;
  readinessScalingEnabled: boolean;
}

// Note: roundLoad function removed - percentages are rounded inline
// TODO: Add real unit-aware rounding for actual weight values when units are known

/**
 * Clamp a value between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Convert zone string (e.g., "Z3") to numeric intensity (1-5)
 */
function zoneToIntensity(zone: string): number {
  const match = zone.match(/Z(\d)/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return 3; // Default to Z3 if parsing fails
}

/**
 * Convert numeric intensity (1-5) back to zone string
 */
function intensityToZone(intensity: number): string {
  const clamped = Math.round(clamp(intensity, 1, 5));
  return `Z${clamped}`;
}

/**
 * Calculate base scaler based on readiness score
 */
function getBaseScaler(readinessScore: number): number {
  if (readinessScore < 40) {
    return 0.75; // Reduce intensity & volume
  } else if (readinessScore >= 40 && readinessScore < 60) {
    return 0.9;
  } else if (readinessScore >= 60 && readinessScore <= 80) {
    return 1.0;
  } else {
    // readinessScore > 80
    return 1.1;
  }
}

/**
 * Get adaptation mode multiplier
 */
function getAdaptationModeMultiplier(adaptationMode: AdaptationMode): number {
  switch (adaptationMode) {
    case 'conservative':
      return 0.9;
    case 'automatic':
      return 1.0;
    case 'aggressive':
      return 1.15;
    default:
      return 1.0;
  }
}

/**
 * Adjust strength exercise prescription
 */
function adjustStrengthExercise(
  exercise: StrengthExercisePrescription,
  finalScaler: number
): StrengthExercisePrescription {
  return {
    ...exercise,
    sets: exercise.sets.map((set) => {
      const adjustedSet: SetPrescription = { ...set };

      // Scale load (targetPercent1RM)
      // targetPercent1RM is a percentage (e.g., 75 for 75% of 1RM)
      if (set.targetPercent1RM !== undefined) {
        const scaledPercent = set.targetPercent1RM * finalScaler;
        // Round to nearest 2.5% increment
        adjustedSet.targetPercent1RM = Math.round(scaledPercent / 2.5) * 2.5;
      }

      // Scale reps only if < 20
      if (set.targetReps !== undefined && set.targetReps < 20) {
        adjustedSet.targetReps = Math.round(set.targetReps * finalScaler);
      }

      // Scale RPE if present
      if (set.targetRpe !== undefined) {
        adjustedSet.targetRpe = clamp(set.targetRpe * finalScaler, 1, 10);
      }

      return adjustedSet;
    }),
  };
}

/**
 * Adjust accessory exercise prescription
 */
function adjustAccessoryExercise(
  exercise: AccessoryExercisePrescription,
  finalScaler: number
): AccessoryExercisePrescription {
  // Mild volume scaling for accessory work
  const volumeScaler = (finalScaler - 1) * 0.5 + 1;

  return {
    ...exercise,
    sets: exercise.sets.map((set) => {
      const adjustedSet: SetPrescription = { ...set };

      // Scale reps with mild volume scaler
      if (set.targetReps !== undefined) {
        adjustedSet.targetReps = Math.round(set.targetReps * volumeScaler);
      }

      return adjustedSet;
    }),
  };
}

/**
 * Adjust conditioning prescription
 */
function adjustConditioning(
  conditioning: ConditioningPrescription,
  finalScaler: number
): ConditioningPrescription {
  const adjusted: ConditioningPrescription = { ...conditioning };

  // Scale target zone if present
  if (conditioning.targetZone) {
    const intensity = zoneToIntensity(conditioning.targetZone);
    const scaledIntensity = clamp(intensity * finalScaler, 1, 5);
    adjusted.targetZone = intensityToZone(scaledIntensity);
  }

  // TODO: Support modifying rest intervals
  // - Scale restSeconds based on readiness
  // - Longer rest for lower readiness

  // TODO: Support pacing targets
  // - If pace targets exist, divide by finalScaler (higher readiness = faster pace)

  return adjusted;
}

/**
 * Adjust a single workout block
 */
function adjustBlock(block: WorkoutBlock, finalScaler: number): WorkoutBlock {
  const adjustedBlock: WorkoutBlock = {
    ...block,
  };

  // Adjust strength main exercise
  if (block.strengthMain) {
    adjustedBlock.strengthMain = adjustStrengthExercise(
      block.strengthMain,
      finalScaler
    );
  }

  // Adjust strength secondary exercises
  if (block.strengthSecondary && block.strengthSecondary.length > 0) {
    adjustedBlock.strengthSecondary = block.strengthSecondary.map((exercise) =>
      adjustStrengthExercise(exercise, finalScaler)
    );
  }

  // Adjust accessory exercises
  if (block.accessory && block.accessory.length > 0) {
    adjustedBlock.accessory = block.accessory.map((exercise) =>
      adjustAccessoryExercise(exercise, finalScaler)
    );
  }

  // Adjust conditioning
  if (block.conditioning) {
    adjustedBlock.conditioning = adjustConditioning(
      block.conditioning,
      finalScaler
    );
  }

  // Warmup and cooldown blocks are not adjusted
  // TODO: Support swapping movements on very low readiness days

  return adjustedBlock;
}

/**
 * Adjust today's workout plan based on readiness score
 *
 * @param params - Adjustment parameters
 * @returns Adjusted WorkoutPlanDay
 */
export function adjustWorkoutForToday(
  params: AdjustWorkoutParams
): WorkoutPlanDay {
  const { workout, readinessScore, adaptationMode, readinessScalingEnabled } =
    params;

  // If readiness scaling is disabled, return workout unchanged
  if (!readinessScalingEnabled) {
    return workout;
  }

  // Calculate base scaler from readiness score
  const baseScaler = getBaseScaler(readinessScore);

  // Apply adaptation mode multiplier
  const adaptationMultiplier = getAdaptationModeMultiplier(adaptationMode);

  // Calculate final scaler
  const finalScaler = baseScaler * adaptationMultiplier;

  // Adjust all blocks
  const adjustedBlocks = workout.blocks.map((block) =>
    adjustBlock(block, finalScaler)
  );

  // Create new workout plan day with adjusted blocks
  const adjustedWorkout: WorkoutPlanDay = {
    ...workout,
    blocks: adjustedBlocks,
    adjustedForReadiness: true,
  };

  // TODO: Support modifying rest intervals globally
  // TODO: Support swapping movements on very low readiness days
  // TODO: Integrate user equipment limitations
  // TODO: Integrate soreness-specific scaling by body region

  return adjustedWorkout;
}
