import type {
  WorkoutSessionLog,
  CompletedSet,
  PRRecord,
} from '../../core/types';

export interface DetectPRsParams {
  session: WorkoutSessionLog;
  existingPRs: PRRecord[];
}

export interface DetectPRsResult {
  newPRs: PRRecord[];
}

/**
 * Estimate 1-rep max using Epley formula
 * Formula: estimated1RM = weight * (1 + reps / 30)
 *
 * @param weight - Weight lifted
 * @param reps - Number of reps completed
 * @returns Estimated 1RM, or null if invalid
 */
function estimate1RM(weight: number, reps: number): number | null {
  // Validate inputs
  if (!weight || weight <= 0) {
    return null;
  }

  if (!reps || reps < 1) {
    return null;
  }

  // Skip if reps > 12 (considered too light for PR purposes)
  if (reps > 12) {
    return null;
  }

  // Apply Epley formula
  const estimated1RM = weight * (1 + reps / 30);

  return estimated1RM;
}

/**
 * Group sets by exerciseId and find max estimated 1RM per exercise
 */
function getMaxEstimated1RMPerExercise(
  completedSets: CompletedSet[]
): Map<string, number> {
  const exerciseMax1RM = new Map<string, number>();

  for (const set of completedSets) {
    // Skip if weight or reps are missing
    if (set.weight === undefined || set.reps === undefined) {
      continue;
    }

    const estimated = estimate1RM(set.weight, set.reps);

    if (estimated === null) {
      continue;
    }

    const exerciseId = set.exerciseId;
    const currentMax = exerciseMax1RM.get(exerciseId);

    if (currentMax === undefined || estimated > currentMax) {
      exerciseMax1RM.set(exerciseId, estimated);
    }
  }

  return exerciseMax1RM;
}

/**
 * Find existing PR for an exercise
 */
function findExistingPR(
  exerciseId: string,
  existingPRs: PRRecord[]
): PRRecord | null {
  return existingPRs.find((pr) => pr.exerciseId === exerciseId) || null;
}

/**
 * Check if a new estimated 1RM qualifies as a PR
 */
function isNewPR(
  newEstimated1RM: number,
  existingPR: PRRecord | null
): boolean {
  // If no existing PR, this is automatically a new PR
  if (!existingPR) {
    return true;
  }

  // New PR only if at least 0.5% higher than existing
  const threshold = existingPR.estimated1RM * 1.005;

  return newEstimated1RM > threshold;
}

/**
 * Generate a unique PR ID
 */
function generatePRId(exerciseId: string, date: string): string {
  return `${exerciseId}-${date}`;
}

/**
 * Detect new personal records from a completed workout session
 *
 * This function scans completed strength sets, calculates estimated 1RMs,
 * and compares them against existing PR records to identify new achievements.
 *
 * @param params - Detection parameters
 * @returns DetectPRsResult with array of new PR records
 */
export function detectNewPRs(params: DetectPRsParams): DetectPRsResult {
  const { session, existingPRs } = params;

  const newPRs: PRRecord[] = [];

  // Get max estimated 1RM for each exercise in this session
  const exerciseMax1RM = getMaxEstimated1RMPerExercise(session.completedSets);

  // Check each exercise for new PRs
  for (const [exerciseId, sessionMax1RM] of exerciseMax1RM.entries()) {
    // Find existing PR for this exercise
    const existingPR = findExistingPR(exerciseId, existingPRs);

    // Check if this qualifies as a new PR
    if (isNewPR(sessionMax1RM, existingPR)) {
      // Calculate change from previous PR
      const changeFromPrevious = existingPR
        ? sessionMax1RM - existingPR.estimated1RM
        : undefined;

      // Create new PR record
      const newPR: PRRecord = {
        id: generatePRId(exerciseId, session.date),
        userId: session.userId || '',
        exerciseId,
        date: session.date,
        estimated1RM: Math.round(sessionMax1RM * 10) / 10, // Round to 1 decimal place
        changeFromPrevious:
          changeFromPrevious !== undefined
            ? Math.round(changeFromPrevious * 10) / 10
            : undefined,
      };

      newPRs.push(newPR);
    }
  }

  // TODO: Support volume PRs
  // - Track total volume per exercise
  // - Detect volume PRs (e.g., most total volume in a session)

  // TODO: Support rep PRs (max reps at a given load)
  // - Track max reps achieved at specific weight
  // - Compare against previous rep PRs at same weight

  // TODO: Support conditioning PRs (pace / time trial)
  // - Track best pace for specific distances
  // - Track time trial performances
  // - Compare against existing conditioning PRs

  // TODO: Store PR type metadata when schema supports it
  // - Add PR type field to PRRecord (e.g., "1RM", "volume", "rep", "pace")
  // - Support multiple PR types per exercise

  return {
    newPRs,
  };
}
