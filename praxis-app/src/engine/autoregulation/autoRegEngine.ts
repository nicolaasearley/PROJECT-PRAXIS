import {
  AutoRegContext,
  AutoRegSetInput,
  AutoRegRecommendation,
  AutoRegAdjustmentRules,
  DifficultyFlag,
} from './autoRegTypes';

/**
 * Default rules for auto-regulation adjustments
 * Consistent with existing progression logic
 */
export const DEFAULT_AUTO_REG_RULES: AutoRegAdjustmentRules = {
  maxIncreasePercent: 5,
  maxDecreasePercent: 10,
  highRecoveryBoostPercent: 2.5,
  lowRecoveryReductionPercent: 5,
  minWeight: 45,
  roundingIncrement: 2.5,
};

/**
 * Clamp weight to minimum value
 */
export function clampWeight(weight: number, rules: AutoRegAdjustmentRules): number {
  return Math.max(rules.minWeight, weight);
}

/**
 * Round weight to nearest increment
 */
export function roundToIncrement(weight: number, increment: number): number {
  return Math.round(weight / increment) * increment;
}

/**
 * Get recovery-based bias percentage
 * Returns a percentage delta (positive or negative) based on recoveryScore and blockType
 */
export function getRecoveryBias(context: AutoRegContext): number {
  const { recoveryScore, blockType } = context;

  if (recoveryScore === null) {
    return 0;
  }

  // Low recovery: reduce load
  if (recoveryScore <= 40) {
    return -5; // -5% to -10% (we'll use -5% as base, can be adjusted)
  }

  // High recovery + intensification: boost load
  if (recoveryScore >= 85 && blockType === 'intensification') {
    return 2.5; // +2.5% to +5% boost
  }

  // High recovery + accumulation: small boost
  if (recoveryScore >= 85 && blockType === 'accumulation') {
    return 1.25; // Small boost for accumulation
  }

  // Deload block: always reduce
  if (blockType === 'deload') {
    return -5; // Reduce load during deload
  }

  return 0; // No bias
}

/**
 * Get difficulty-based bias percentage
 * Uses difficulty flag and RPE deviation from target
 */
export function getDifficultyBias(
  input: AutoRegSetInput,
  context: AutoRegContext,
  rules: AutoRegAdjustmentRules
): number {
  const { difficulty, rpe } = input;
  const { targetRpe } = context;

  let bias = 0;

  // Difficulty flag takes precedence
  if (difficulty === 'too_easy') {
    bias = 2.5; // +2.5% to +5% increase
  } else if (difficulty === 'too_hard') {
    bias = -5; // -5% to -10% decrease
  }

  // RPE deviation from target (if no explicit difficulty flag)
  if (difficulty === null && rpe !== null && targetRpe !== null) {
    const rpeDeviation = rpe - targetRpe;

    if (rpeDeviation <= -2) {
      // RPE is 2+ below target (too easy)
      bias = 2.5;
    } else if (rpeDeviation >= 2) {
      // RPE is 2+ above target (too hard)
      bias = -5;
    } else if (rpeDeviation <= -1) {
      // RPE is 1 below target (slightly easy)
      bias = 1.25;
    } else if (rpeDeviation >= 1) {
      // RPE is 1 above target (slightly hard)
      bias = -2.5;
    }
  }

  // Bound within max increase/decrease limits
  return Math.max(
    -rules.maxDecreasePercent,
    Math.min(rules.maxIncreasePercent, bias)
  );
}

/**
 * Get auto-regulation recommendation for the next set
 */
export function getAutoRegRecommendation(
  input: AutoRegSetInput,
  context: AutoRegContext,
  rules: AutoRegAdjustmentRules = DEFAULT_AUTO_REG_RULES
): AutoRegRecommendation {
  // If insufficient data, return null recommendation
  if (input.weight === null || input.weight <= 0) {
    return {
      nextWeight: null,
      nextReps: null,
      reason: 'Insufficient data: weight is missing or invalid',
      flags: {},
    };
  }

  const baseWeight = input.weight;

  // Compute biases
  const recoveryBias = getRecoveryBias(context);
  const difficultyBias = getDifficultyBias(input, context, rules);

  // Combine biases (additive)
  const totalBiasPercent = recoveryBias + difficultyBias;

  // Bound the total bias
  const boundedBias = Math.max(
    -rules.maxDecreasePercent,
    Math.min(rules.maxIncreasePercent, totalBiasPercent)
  );

  // Apply bias to base weight
  let adjustedWeight = baseWeight * (1 + boundedBias / 100);

  // Special restrictions for deload blocks or final sets
  if (context.blockType === 'deload' && boundedBias > 0) {
    // Don't increase weight during deload
    adjustedWeight = baseWeight;
  }

  if (context.isFinalSet && boundedBias > 0) {
    // Restrict upward adjustments on final set (conservative)
    adjustedWeight = baseWeight * (1 + Math.min(2.5, boundedBias) / 100);
  }

  // Clamp and round
  adjustedWeight = clampWeight(adjustedWeight, rules);
  adjustedWeight = roundToIncrement(adjustedWeight, rules.roundingIncrement);

  // Determine flags
  const flags: AutoRegRecommendation['flags'] = {
    performanceBoost: boundedBias > 0 && (context.recoveryScore ?? 0) >= 85,
    fatigueDetected: boundedBias < 0 && input.difficulty === 'too_hard',
    autoDeloadSuggested:
      (context.recoveryScore !== null && context.recoveryScore < 40) ||
      (context.blockType === 'deload' && boundedBias < 0),
  };

  // Build reason string
  const reasonParts: string[] = [];
  reasonParts.push(`Weight: ${baseWeight.toFixed(1)} lb`);
  if (input.rpe !== null) {
    reasonParts.push(`RPE: ${input.rpe}`);
  }
  if (input.difficulty) {
    reasonParts.push(`Difficulty: ${input.difficulty.replace('_', ' ')}`);
  }
  if (context.recoveryScore !== null) {
    reasonParts.push(`Recovery: ${context.recoveryScore.toFixed(0)}`);
  }
  if (context.blockType) {
    reasonParts.push(`Block: ${context.blockType}`);
  }
  if (Math.abs(boundedBias) > 0.1) {
    reasonParts.push(
      `Adjustment: ${boundedBias > 0 ? '+' : ''}${boundedBias.toFixed(1)}%`
    );
  }
  reasonParts.push(`→ Suggested: ${adjustedWeight.toFixed(1)} lb`);

  const reason = reasonParts.join(' | ');

  return {
    nextWeight: adjustedWeight,
    nextReps: null, // For now, keep reps the same
    reason,
    flags,
  };
}
