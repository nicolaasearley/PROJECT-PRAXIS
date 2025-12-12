import { ExerciseHistoryEntry } from '@/store/progressionStore';

interface GetRecommendedWeightParams {
  exerciseId: string;
  targetRpe: number | null;
  recoveryScore: number | null;
  history: ExerciseHistoryEntry[];
}

/**
 * Get recommended weight for an exercise based on history, target RPE, and recovery score
 * Returns null if no history exists
 */
export function getRecommendedWeight({
  exerciseId,
  targetRpe,
  recoveryScore,
  history,
}: GetRecommendedWeightParams): number | null {
  // If no history, return null
  if (history.length === 0) {
    return null;
  }

  // Get most recent entry
  const sortedHistory = [...history].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    if (dateA !== dateB) {
      return dateB - dateA; // Most recent first
    }
    return b.sessionId.localeCompare(a.sessionId); // Tie-breaker by sessionId
  });

  const last = sortedHistory[0];

  // Base weight from last performance
  let recommendedWeight = last.weight;

  // RPE adjustments (only if targetRpe is provided)
  if (targetRpe !== null && last.rpe !== null) {
    const rpeDiff = last.rpe - targetRpe;

    if (rpeDiff < -1) {
      // Last RPE was much lower than target (too easy) → increase by 5%
      recommendedWeight = recommendedWeight * 1.05;
    } else if (rpeDiff > 1) {
      // Last RPE was much higher than target (too hard) → decrease by 5%
      recommendedWeight = recommendedWeight * 0.95;
    }
  }

  // Recovery adjustments (only if recoveryScore is provided)
  if (recoveryScore !== null) {
    if (recoveryScore < 40) {
      // Low recovery → reduce weight by 5%
      recommendedWeight = recommendedWeight * 0.95;
    } else if (recoveryScore > 85) {
      // High recovery → increase weight by 2.5%
      recommendedWeight = recommendedWeight * 1.025;
    }
  }

  // Clamp minimum weight (45 lbs = 20.4 kg, but we'll use 45 lbs for now)
  const minWeight = 45;
  recommendedWeight = Math.max(minWeight, recommendedWeight);

  // Round to nearest 2.5 lbs
  recommendedWeight = Math.round(recommendedWeight / 2.5) * 2.5;

  return recommendedWeight;
}
