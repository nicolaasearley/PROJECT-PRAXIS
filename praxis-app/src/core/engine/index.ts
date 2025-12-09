import type {
  AdaptationMode,
  PRRecord,
  ReadinessEntry,
  ReadinessInputs,
  UserProfile,
  WorkoutPlanDay,
  WorkoutSessionLog,
} from '@/core/types';

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

/**
 * Calculate readiness score based on daily inputs
 * @param inputs - Daily readiness inputs (sleep, energy, soreness, stress, time availability)
 * @returns Readiness score from 0-100
 */
export function calculateReadiness(inputs: ReadinessInputs): number {
  const { sleepQuality, energy, soreness, stress, timeAvailability } = inputs;
  const availabilityWeight: Record<ReadinessInputs['timeAvailability'], number> = {
    short: 0.9,
    standard: 1,
    full: 1.05,
  };

  const normalizedSleep = clamp(sleepQuality, 1, 5) / 5;
  const normalizedEnergy = clamp(energy, 1, 5) / 5;
  const normalizedSoreness = 1 - clamp(soreness, 1, 5) / 5;
  const normalizedStress = 1 - clamp(stress, 1, 5) / 5;

  const readinessRaw =
    (normalizedSleep * 0.3 +
      normalizedEnergy * 0.3 +
      normalizedSoreness * 0.2 +
      normalizedStress * 0.2) *
    availabilityWeight[timeAvailability];

  return Math.round(clamp(readinessRaw * 100, 0, 100));
}

/**
 * Generate initial workout plan based on user preferences
 * Creates the first week/cycle of workouts tailored to the athlete's goals and constraints
 * @param userProfile - User profile containing preferences, goals, and equipment
 * @param startDate - Start date for the plan (yyyy-mm-dd)
 * @returns Array of WorkoutPlanDay objects for the initial cycle
 */
export function generateInitialPlan(
  userProfile: UserProfile,
  startDate: string
): WorkoutPlanDay[] {
  const trainingDays = userProfile.preferences.trainingDaysPerWeek;
  const durationEstimate =
    userProfile.preferences.timeAvailability === 'short'
      ? 35
      : userProfile.preferences.timeAvailability === 'full'
        ? 75
        : 55;

  return Array.from({ length: trainingDays }).map((_, index) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + index);
    const isoDate = date.toISOString().slice(0, 10);

    const focusTags =
      userProfile.preferences.goal === 'strength'
        ? ['strength']
        : userProfile.preferences.goal === 'conditioning'
          ? ['engine']
          : ['hybrid'];

    const strengthBlockId = `strength-${index}`;
    return {
      id: `plan-${userProfile.id}-${isoDate}`,
      userId: userProfile.id,
      date: isoDate,
      dayIndex: index,
      focusTags,
      estimatedDurationMinutes: durationEstimate,
      adjustedForReadiness: false,
      createdAt: new Date().toISOString(),
      blocks: [
        {
          id: strengthBlockId,
          type: 'strength',
          title: 'Main Strength',
          estimatedDurationMinutes: Math.round(durationEstimate * 0.5),
          strengthMain: {
            exerciseId: 'barbell_back_squat',
            sets: [
              { targetReps: 5, targetPercent1RM: 75 },
              { targetReps: 5, targetPercent1RM: 75 },
              { targetReps: 5, targetPercent1RM: 75 },
            ],
          },
        },
        {
          id: `accessory-${index}`,
          type: 'accessory',
          title: 'Accessory',
          accessory: [
            {
              exerciseId: 'db_row',
              sets: [
                { targetReps: 12 },
                { targetReps: 12 },
              ],
            },
          ],
        },
        {
          id: `engine-${index}`,
          type: 'conditioning',
          title: 'Engine',
          conditioning: {
            mode: 'interval',
            workSeconds: 45,
            restSeconds: 30,
            rounds: 8,
            targetZone: 'Z3',
          },
        },
      ],
    } satisfies WorkoutPlanDay;
  });
}

/**
 * Adjust today's workout plan based on current readiness score
 * Modifies intensity, volume, and exercise selection to match athlete's readiness
 * @param plannedWorkout - The originally planned workout for today
 * @param readinessScore - Current readiness score (0-100)
 * @param adaptationMode - User's preferred adaptation mode (conservative/automatic/aggressive)
 * @returns Adjusted WorkoutPlanDay with modified blocks
 */
export function adjustWorkoutForToday(
  plannedWorkout: WorkoutPlanDay,
  readinessScore: number,
  adaptationMode: AdaptationMode
): WorkoutPlanDay {
  const adjustmentScale = adaptationMode === 'aggressive' ? 1.15 : adaptationMode === 'conservative' ? 0.85 : 1;
  const readinessMultiplier = readinessScore >= 80 ? 1.05 : readinessScore <= 40 ? 0.85 : 1;
  const finalScale = clamp(adjustmentScale * readinessMultiplier, 0.7, 1.25);

  const adjustedBlocks = plannedWorkout.blocks.map((block) => {
    if (block.strengthMain) {
      const scaledSets = block.strengthMain.sets.map((set) => ({
        ...set,
        targetPercent1RM: set.targetPercent1RM
          ? clamp(Math.round(set.targetPercent1RM * finalScale), 50, 95)
          : undefined,
      }));

      return {
        ...block,
        strengthMain: { ...block.strengthMain, sets: scaledSets },
      };
    }

    if (block.conditioning) {
      const scaledRounds = block.conditioning.rounds
        ? Math.max(1, Math.round(block.conditioning.rounds * finalScale))
        : undefined;

      return {
        ...block,
        conditioning: { ...block.conditioning, rounds: scaledRounds },
      };
    }

    return block;
  });

  return {
    ...plannedWorkout,
    blocks: adjustedBlocks,
    adjustedForReadiness: true,
    estimatedDurationMinutes: Math.round(
      plannedWorkout.estimatedDurationMinutes * (1 + (finalScale - 1) * 0.3)
    ),
  };
}

/**
 * Detect new personal records from completed workout session
 * Compares completed sets against previous PR records to identify improvements
 * @param sessionLog - Completed workout session log with all sets
 * @param previousPRs - Array of existing PR records for the user
 * @returns Array of new PRRecord objects (empty if no new PRs detected)
 */
export function detectNewPRs(
  sessionLog: WorkoutSessionLog,
  previousPRs: PRRecord[]
): PRRecord[] {
  const bestByExercise = new Map<string, PRRecord>();
  previousPRs.forEach((pr) => {
    const currentBest = bestByExercise.get(pr.exerciseId);
    if (!currentBest || pr.estimated1RM > currentBest.estimated1RM) {
      bestByExercise.set(pr.exerciseId, pr);
    }
  });

  const newPRs: PRRecord[] = [];

  sessionLog.completedSets.forEach((set) => {
    if (!set.weight || !set.reps) {
      return;
    }

    const estimated1RM = estimate1RM(set.weight, set.reps, set.rpe);
    const bestForExercise = bestByExercise.get(set.exerciseId);

    if (!bestForExercise || estimated1RM > bestForExercise.estimated1RM) {
      const prRecord: PRRecord = {
        id: `${sessionLog.id}-${set.exerciseId}-${set.setIndex}`,
        userId: sessionLog.userId,
        exerciseId: set.exerciseId,
        date: sessionLog.date,
        estimated1RM,
        changeFromPrevious: bestForExercise
          ? estimated1RM - bestForExercise.estimated1RM
          : undefined,
      };

      bestByExercise.set(set.exerciseId, prRecord);
      newPRs.push(prRecord);
    }
  });

  return newPRs;
}

/**
 * Estimate 1-rep max (1RM) from completed set data
 * Uses formulas like Epley or Brzycki to estimate max strength
 * @param weight - Weight lifted (in user's preferred units)
 * @param reps - Number of reps completed
 * @param rpe - Optional RPE (Rate of Perceived Exertion) for more accurate estimation
 * @returns Estimated 1RM value
 */
export function estimate1RM(weight: number, reps: number, rpe?: number): number {
  if (reps <= 0 || weight <= 0) {
    return 0;
  }

  const repsClamped = clamp(reps, 1, 20);
  const epleyEstimate = weight * (1 + repsClamped / 30);
  const brzyckiEstimate = weight * (36 / (37 - repsClamped));
  const averageEstimate = (epleyEstimate + brzyckiEstimate) / 2;

  if (rpe) {
    const fatigueModifier = clamp(1 + (10 - rpe) * 0.02, 0.85, 1.1);
    return Math.round(averageEstimate * fatigueModifier);
  }

  return Math.round(averageEstimate);
}
