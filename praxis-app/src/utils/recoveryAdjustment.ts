import { WorkoutBlock, SetPrescription, StrengthExercisePrescription } from '@core/types';

// Type alias for compatibility
type TrainingBlock = WorkoutBlock;

/**
 * Adjustment metadata describing the type and reason for adjustments
 */
export interface AdjustmentMetadata {
  level: 'under' | 'moderate' | 'high';
  reason: string;
}

/**
 * Deep clone a TrainingBlock
 */
function deepCloneBlock(block: TrainingBlock): TrainingBlock {
  return JSON.parse(JSON.stringify(block)) as TrainingBlock;
}

/**
 * Deep clone an array of TrainingBlocks
 */
function deepCloneBlocks(blocks: TrainingBlock[]): TrainingBlock[] {
  return blocks.map(deepCloneBlock);
}

/**
 * Adjust a SetPrescription based on recovery score
 */
function adjustSetPrescription(
  set: SetPrescription,
  rpeAdjustment: number
): SetPrescription {
  const adjusted: SetPrescription = { ...set };

  if (adjusted.targetRpe !== undefined) {
    adjusted.targetRpe = Math.max(5, Math.min(10, adjusted.targetRpe + rpeAdjustment));
  }

  return adjusted;
}

/**
 * Adjust a StrengthExercisePrescription
 */
function adjustStrengthExercise(
  exercise: StrengthExercisePrescription,
  recoveryScore: number
): StrengthExercisePrescription {
  const adjusted: StrengthExercisePrescription = {
    ...exercise,
    sets: [...exercise.sets],
  };

  if (recoveryScore < 40) {
    // Under-Recovered: Reduce sets by 1 (minimum 1), reduce RPE by 1-2
    if (adjusted.sets.length > 1) {
      adjusted.sets = adjusted.sets.slice(0, -1); // Remove last set
    }
    adjusted.sets = adjusted.sets.map((set) => {
      const rpeAdjustment = set.targetRpe !== undefined ? -2 : 0;
      return adjustSetPrescription(set, rpeAdjustment);
    });
  } else if (recoveryScore >= 40 && recoveryScore < 70) {
    // Moderate Recovery: Optional RPE reduction by 1
    adjusted.sets = adjusted.sets.map((set) => {
      const rpeAdjustment = set.targetRpe !== undefined ? -1 : 0;
      return adjustSetPrescription(set, rpeAdjustment);
    });
  } else if (recoveryScore > 80) {
    // High Recovery: Add back-off set, increase RPE by +1
    const lastSet = adjusted.sets[adjusted.sets.length - 1];
    if (lastSet) {
      const backoffSet: SetPrescription = {
        targetReps: lastSet.targetReps,
        targetRpe: lastSet.targetRpe !== undefined
          ? Math.max(5, lastSet.targetRpe - 2)
          : undefined,
        targetPercent1RM: lastSet.targetPercent1RM,
      };
      adjusted.sets = [...adjusted.sets, backoffSet];
    }
    adjusted.sets = adjusted.sets.map((set) => {
      const rpeAdjustment = set.targetRpe !== undefined ? 1 : 0;
      return adjustSetPrescription(set, rpeAdjustment);
    });
  }

  return adjusted;
}

/**
 * Apply recovery-based adjustments to workout blocks
 * Returns adjusted blocks and metadata describing the adjustments
 */
export function applyRecoveryAdjustment(
  recoveryScore: number,
  blocks: TrainingBlock[]
): { adjustedBlocks: TrainingBlock[]; metadata: AdjustmentMetadata } {
  // Deep clone blocks to avoid mutating originals
  const adjustedBlocks = deepCloneBlocks(blocks);

  let metadata: AdjustmentMetadata;

  if (recoveryScore < 40) {
    // Under-Recovered
    metadata = {
      level: 'under',
      reason: 'Low recovery',
    };

    // Adjust strength blocks
    adjustedBlocks.forEach((block) => {
      if (block.type === 'strength' && block.strengthMain) {
        block.strengthMain = adjustStrengthExercise(block.strengthMain, recoveryScore);
      }
    });
  } else if (recoveryScore >= 40 && recoveryScore < 70) {
    // Moderate Recovery
    metadata = {
      level: 'moderate',
      reason: 'Moderate recovery',
    };

    // Adjust strength blocks (optional RPE reduction)
    adjustedBlocks.forEach((block) => {
      if (block.type === 'strength' && block.strengthMain) {
        block.strengthMain = adjustStrengthExercise(block.strengthMain, recoveryScore);
      }
    });
  } else if (recoveryScore > 80) {
    // High Recovery - Performance Mode
    metadata = {
      level: 'high',
      reason: 'High recovery — performance boost',
    };

    // Adjust strength blocks (add set, increase RPE)
    adjustedBlocks.forEach((block) => {
      if (block.type === 'strength' && block.strengthMain) {
        block.strengthMain = adjustStrengthExercise(block.strengthMain, recoveryScore);
      }
    });
  } else {
    // 70-80: No adjustments
    metadata = {
      level: 'moderate',
      reason: 'Normal recovery',
    };
  }

  return { adjustedBlocks, metadata };
}
