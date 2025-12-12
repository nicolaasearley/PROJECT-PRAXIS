import { MovementPattern } from '@core/types';

/**
 * Difficulty flag indicating how a set felt
 */
export type DifficultyFlag = 'too_easy' | 'on_target' | 'too_hard';

/**
 * Context for auto-regulation recommendations
 */
export interface AutoRegContext {
  recoveryScore: number | null; // Daily recovery score (0-100)
  blockType: 'accumulation' | 'intensification' | 'deload' | null;
  pattern: MovementPattern | null; // Movement pattern for this block
  priorSetIndex: number; // Index of the set that just completed
  totalSetsInBlock: number; // Total number of sets in this block
  targetRpe: number | null; // Original target RPE for this set
  planRpe: number | null; // Plan-level RPE for the block
  lastEstimated1Rm?: number | null; // Optional estimated 1RM if available
  isFinalSet: boolean; // Whether this is the final set in the block
}

/**
 * Input data for a completed set
 */
export interface AutoRegSetInput {
  weight: number | null; // Weight used for this set
  reps: number | null; // Reps performed
  rpe: number | null; // RPE reported by user
  difficulty: DifficultyFlag | null; // User's difficulty assessment (or derived)
}

/**
 * Recommendation for the next set
 */
export interface AutoRegRecommendation {
  nextWeight: number | null; // Suggested weight for the next set
  nextReps: number | null; // Optional rep adjustment for next set
  reason: string; // Human-readable explanation
  flags: {
    performanceBoost?: boolean; // True if delta > 0 and recovery is high
    fatigueDetected?: boolean; // True if delta < 0 and difficulty === "too_hard"
    autoDeloadSuggested?: boolean; // True if recoveryScore is very low OR blockType === "deload"
  };
}

/**
 * Rules for auto-regulation adjustments
 */
export interface AutoRegAdjustmentRules {
  maxIncreasePercent: number; // e.g., 5
  maxDecreasePercent: number; // e.g., 10
  highRecoveryBoostPercent: number; // e.g., +2.5 for high recovery & easy set
  lowRecoveryReductionPercent: number; // e.g., -5 for low recovery
  minWeight: number; // e.g., 45 (lbs) - align with existing min weight logic
  roundingIncrement: number; // e.g., 2.5
}
