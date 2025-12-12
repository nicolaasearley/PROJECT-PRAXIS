import type {
  WorkoutPlanDay,
  WorkoutBlock,
  TrainingGoal,
  ExperienceLevel,
  StrengthNumbers,
  ExerciseDefinition,
  MuscleGroup,
} from '@core/types';
import type { Exercise, MovementPattern } from '@core/types/exercise';
import {
  EXERCISES,
  getExercisesByPatternAndEquipment,
  getExercisesByTag,
  getExercisesByDifficulty,
} from '@core/data/exercises';
import { useUserStore } from '@core/store/useUserStore';
import { generateStrengthPrescription } from '../strength/generateStrengthPrescription';
import { generateConditioningPrescription } from '../conditioning/generateConditioningPrescription';
import { constructWorkoutBlocks } from './constructWorkoutBlocks';
import type { WeeklyDayStructure } from '@/utils/periodization/buildWeeklyStructure';
import dayjs from 'dayjs';

interface GenerateDailyWorkoutParams {
  goal: TrainingGoal;
  experienceLevel: ExperienceLevel;
  equipmentIds: string[];
  units: 'metric' | 'imperial';
  strengthNumbers?: StrengthNumbers;
  userId?: string;
  date?: string; // yyyy-mm-dd format
  focusPatternOverride?: string; // NEW: supplied by weekly template
  weekIndex?: number; // available for future periodization
  weeklyStructureDay?: WeeklyDayStructure; // NEW: weekly structure guidance
}

/**
 * Generate a unique ID for workout blocks and plan days
 */
function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Select warmup exercises from library
 */
function selectWarmupExercises(
  equipmentIds: string[],
  dayIndex: number
): Exercise[] {
  // Get exercises tagged as warmup, primer, or core_anti_extension
  const warmupCandidates = [
    ...getExercisesByTag('warmup'),
    ...getExercisesByTag('primer'),
    ...getExercisesByTag('core_anti_extension'),
  ].filter(
    (exercise) =>
      exercise.equipmentIds.length === 0 ||
      exercise.equipmentIds.some((id) => equipmentIds.includes(id))
  );

  // Remove duplicates by id
  const uniqueWarmups = Array.from(
    new Map(warmupCandidates.map((ex) => [ex.id, ex])).values()
  );

  // Select 2-3 exercises, rotating based on dayIndex
  const selected: Exercise[] = [];
  const count = Math.min(3, uniqueWarmups.length);
  for (let i = 0; i < count; i++) {
    const index = (dayIndex + i) % uniqueWarmups.length;
    selected.push(uniqueWarmups[index]);
  }

  return selected;
}

/**
 * Create warm-up block with real exercises
 */
function createWarmupBlock(
  equipmentIds: string[],
  dayIndex: number
): WorkoutBlock {
  const warmupExercises = selectWarmupExercises(equipmentIds, dayIndex);

  return {
    id: generateId('warmup'),
    type: 'warmup',
    title: 'Warm-Up',
    warmupItems: warmupExercises.map((ex) => ex.name),
    estimatedDurationMinutes: 5 + warmupExercises.length * 2, // ~2 min per exercise
  };
}

/**
 * Select main strength exercise based on pattern rotation with fallback logic
 */
function selectMainStrengthExercise(
  pattern: MovementPattern,
  equipmentIds: string[],
  experienceLevel: ExperienceLevel,
  dayIndex: number
): Exercise | null {
  // Try primary pattern first
  let candidates = getExercisesByPatternAndEquipment(pattern, equipmentIds);

  // Filter by difficulty (prefer exact match, but allow any if none found)
  let difficultyFiltered = candidates.filter(
    (ex) => ex.difficulty === experienceLevel
  );
  if (difficultyFiltered.length > 0) {
    candidates = difficultyFiltered;
  }

  // Filter to strength-focused exercises
  candidates = candidates.filter((ex) => ex.tags.includes('strength'));

  let usedPattern = pattern;
  let usedFallback = false;

  // If no candidates found, try fallback patterns
  if (candidates.length === 0) {
    const fallbackPatterns = getFallbackPatterns(pattern);
    for (const fallbackPattern of fallbackPatterns) {
      let fallbackCandidates = getExercisesByPatternAndEquipment(
        fallbackPattern,
        equipmentIds
      );

      // Filter by difficulty
      difficultyFiltered = fallbackCandidates.filter(
        (ex) => ex.difficulty === experienceLevel
      );
      if (difficultyFiltered.length > 0) {
        fallbackCandidates = difficultyFiltered;
      }

      // Filter to strength-focused exercises
      fallbackCandidates = fallbackCandidates.filter((ex) =>
        ex.tags.includes('strength')
      );

      if (fallbackCandidates.length > 0) {
        candidates = fallbackCandidates;
        usedPattern = fallbackPattern;
        usedFallback = true;
        break;
      }
    }
  }

  if (candidates.length === 0) {
    return null;
  }

  // Rotate selection based on dayIndex to add variety
  const selectedIndex = dayIndex % candidates.length;
  const selected = candidates[selectedIndex];

  if (process.env.NODE_ENV !== 'production' && usedFallback) {
    console.log(
      '[StrengthEngine] Used fallback pattern:',
      usedPattern,
      'for primary:',
      pattern,
      'selected:',
      selected.name
    );
  }

  return selected;
}

/**
 * Determine primary movement pattern for the day
 * Simple rotation: squat -> hinge -> horizontal_push -> horizontal_pull
 */
function getPrimaryPatternForDay(dayIndex: number): MovementPattern {
  const patterns: MovementPattern[] = [
    'squat',
    'hinge',
    'horizontal_push',
    'horizontal_pull',
  ];
  return patterns[dayIndex % patterns.length];
}

/**
 * PATTERN OVERRIDE MAPPING
 * Converts template focus → actual strength pattern
 */
function resolvePatternFromOverride(
  override?: string,
  dayIndex: number = 0
): MovementPattern | 'rest' | 'conditioning' | null {
  if (!override) return null;

  switch (override) {
    case 'rest':
      return 'rest';

    case 'conditioning':
      return 'conditioning';

    case 'squat':
      return 'squat';

    case 'hinge':
      return 'hinge';

    case 'upper_push_pull':
      // Rotate based on dayIndex
      const upperPatterns: MovementPattern[] = [
        'horizontal_push',
        'horizontal_pull',
        'vertical_push',
        'vertical_pull',
      ];
      return upperPatterns[dayIndex % 4];

    case 'mixed_full_body':
      // Choose a pattern based on dayIndex
      const fullBodyPatterns: MovementPattern[] = [
        'squat',
        'hinge',
        'horizontal_push',
        'horizontal_pull',
      ];
      return fullBodyPatterns[dayIndex % 4];

    default:
      return null;
  }
}

/**
 * Get fallback patterns for a given movement pattern
 * Provides biomechanically reasonable alternatives when primary pattern has no exercises
 */
function getFallbackPatterns(pattern: MovementPattern): MovementPattern[] {
  const fallbackMap: Record<MovementPattern, MovementPattern[]> = {
    squat: ['hinge', 'lunge'],
    hinge: ['squat', 'lunge'],
    horizontal_push: ['vertical_push'],
    vertical_push: ['horizontal_push'],
    horizontal_pull: ['vertical_pull'],
    vertical_pull: ['horizontal_pull'],
    carry: ['core'],
    core: ['carry'],
    lunge: ['squat', 'hinge'],
    unilateral_lower: ['squat', 'lunge'],
    unilateral_upper: ['horizontal_push', 'vertical_push'],
    locomotion: ['conditioning'],
    conditioning: ['locomotion'],
  };

  return fallbackMap[pattern] ?? [];
}

/**
 * Determine if conditioning should be included based on goal and day index
 * dayIndex is 0-6 within the microcycle week
 */
function shouldIncludeConditioningForGoal(
  goal: TrainingGoal,
  dayIndex: number
): boolean {
  switch (goal) {
    case 'conditioning':
      return true; // every day gets some engine work
    case 'hybrid':
      // every other day, e.g. 0, 2, 4
      return dayIndex % 2 === 0;
    case 'general':
      // ~2x per week, e.g. mid + late week
      return dayIndex === 2 || dayIndex === 5;
    case 'strength':
    default:
      // 1x per week (optional light engine focus)
      return dayIndex === 3;
  }
}

/**
 * Get rep scheme based on experience level
 */
function getRepSchemeForExperience(experienceLevel: ExperienceLevel): {
  sets: number;
  reps: number;
  rpe?: number;
} {
  switch (experienceLevel) {
    case 'beginner':
      return { sets: 3, reps: 8, rpe: 7 };
    case 'intermediate':
      return { sets: 4, reps: 6, rpe: 8 };
    case 'advanced':
      return { sets: 5, reps: 4, rpe: 9 };
    default:
      return { sets: 3, reps: 8, rpe: 7 };
  }
}

/**
 * Create strength block with real exercise from library
 */
function createStrengthBlock(
  goal: TrainingGoal,
  equipmentIds: string[],
  experienceLevel: ExperienceLevel,
  strengthNumbers?: StrengthNumbers,
  dayIndex: number = 0,
  patternOverride?: MovementPattern
): WorkoutBlock | null {
  // Only create strength block for specific goals
  if (goal !== 'strength' && goal !== 'hybrid' && goal !== 'general') {
    return null;
  }

  // Determine primary pattern for the day (use override if provided)
  const primaryPattern = patternOverride || getPrimaryPatternForDay(dayIndex);

  // Select main exercise (may use fallback pattern)
  const mainExercise = selectMainStrengthExercise(
    primaryPattern,
    equipmentIds,
    experienceLevel,
    dayIndex
  );

  if (!mainExercise) {
    // Only log after all fallbacks exhausted
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        '[DailyWorkoutEngine] No strength exercise found after fallbacks for pattern:',
        primaryPattern,
        'equipment:',
        equipmentIds
      );
    }
    return null;
  }

  // Get rep scheme
  const repScheme = getRepSchemeForExperience(experienceLevel);

  // Create sets array
  const sets = Array.from({ length: repScheme.sets }, () => ({
    targetReps: repScheme.reps,
    targetRpe: repScheme.rpe,
    targetPercent1RM: strengthNumbers ? 0.75 : undefined,
  }));

  // Logging is handled inside selectMainStrengthExercise for fallback detection
  if (process.env.NODE_ENV !== 'production') {
    console.log('[StrengthEngine] Selected main lift:', mainExercise.name, {
      primaryPattern,
      difficulty: mainExercise.difficulty,
      sets: repScheme.sets,
      reps: repScheme.reps,
    });
  }

  return {
    id: generateId('strength-main'),
    type: 'strength' as const,
    title: `Main Lift – ${mainExercise.name}`,
    strengthMain: {
      exerciseId: mainExercise.id,
      sets,
    },
    estimatedDurationMinutes: 25 + repScheme.sets * 3, // ~3 min per set including rest
  };
}

/**
 * Get target accessory count based on experience level
 */
function getTargetAccessoryCount(
  experienceLevel: ExperienceLevel
): { min: number; max: number } {
  switch (experienceLevel) {
    case 'beginner':
      return { min: 1, max: 2 };
    case 'intermediate':
      return { min: 2, max: 2 };
    case 'advanced':
    default:
      return { min: 2, max: 3 };
  }
}

/**
 * Select accessory exercises based on main lift pattern
 */
function selectAccessoryExercises(
  primaryPattern: MovementPattern,
  equipmentIds: string[],
  experienceLevel: ExperienceLevel,
  mainExerciseId: string,
  dayIndex: number
): Exercise[] {
  const selected: Exercise[] = [];
  const usedIds = new Set([mainExerciseId]);
  const { min, max } = getTargetAccessoryCount(experienceLevel);

  // Determine complementary patterns and tags
  let targetTags: string[] = [];
  let targetPatterns: MovementPattern[] = [];

  switch (primaryPattern) {
    case 'squat':
      targetTags = ['unilateral_lower', 'posterior_chain', 'core'];
      targetPatterns = ['lunge', 'hinge', 'core'];
      break;
    case 'hinge':
      targetTags = ['unilateral_lower', 'core'];
      targetPatterns = ['lunge', 'core'];
      break;
    case 'horizontal_push':
      targetTags = ['unilateral_upper', 'posterior_chain', 'core'];
      targetPatterns = ['horizontal_pull', 'vertical_pull', 'core'];
      break;
    case 'horizontal_pull':
      targetTags = ['unilateral_upper', 'core'];
      targetPatterns = ['horizontal_push', 'vertical_push', 'core'];
      break;
    case 'vertical_push':
      targetTags = ['unilateral_upper', 'horizontal_pull'];
      targetPatterns = ['horizontal_pull', 'vertical_pull'];
      break;
    case 'vertical_pull':
      targetTags = ['unilateral_upper', 'horizontal_push'];
      targetPatterns = ['horizontal_push', 'vertical_push'];
      break;
    default:
      targetTags = ['hypertrophy', 'unilateral', 'core'];
  }

  // Collect candidates
  const candidates: Exercise[] = [];
  for (const tag of targetTags) {
    const tagged = getExercisesByTag(tag as any).filter(
      (ex) =>
        !usedIds.has(ex.id) &&
        (ex.equipmentIds.length === 0 ||
          ex.equipmentIds.some((id) => equipmentIds.includes(id)))
    );
    candidates.push(...tagged);
  }

  for (const pattern of targetPatterns) {
    const patterned = getExercisesByPatternAndEquipment(pattern, equipmentIds)
      .filter(
        (ex) =>
          !usedIds.has(ex.id) &&
          ex.tags.includes('hypertrophy') &&
          ex.difficulty === experienceLevel
      );
    candidates.push(...patterned);
  }

  // Remove duplicates and filter
  const unique = Array.from(
    new Map(candidates.map((ex) => [ex.id, ex])).values()
  );

  // If we have fewer candidates than min, use what we have
  // Otherwise, select between min and max based on availability
  let targetCount = Math.min(max, unique.length);
  if (targetCount < min && unique.length > 0) {
    targetCount = unique.length; // Use all available if less than min
  } else if (unique.length >= min) {
    targetCount = Math.max(min, Math.min(max, unique.length));
  }

  // If still no candidates, try generic fallback tags
  if (unique.length === 0) {
    const fallbackCandidates = [
      ...getExercisesByTag('core'),
      ...getExercisesByTag('posterior_chain'),
      ...getExercisesByTag('hypertrophy'),
    ].filter(
      (ex) =>
        !usedIds.has(ex.id) &&
        (ex.equipmentIds.length === 0 ||
          ex.equipmentIds.some((id) => equipmentIds.includes(id)))
    );

    const fallbackUnique = Array.from(
      new Map(fallbackCandidates.map((ex) => [ex.id, ex])).values()
    );

    if (fallbackUnique.length > 0) {
      targetCount = Math.min(max, fallbackUnique.length);
      for (let i = 0; i < targetCount; i++) {
        const index = (dayIndex * 2 + i) % fallbackUnique.length;
        selected.push(fallbackUnique[index]);
        usedIds.add(fallbackUnique[index].id);
      }

      if (process.env.NODE_ENV !== 'production') {
        console.log(
          '[DailyWorkoutEngine] Used fallback tags for accessories:',
          fallbackUnique.slice(0, targetCount).map((ex) => ex.name)
        );
      }

      return selected;
    }
  }

  // Select target count exercises deterministically
  for (let i = 0; i < targetCount; i++) {
    const index = (dayIndex * 2 + i) % unique.length;
    selected.push(unique[index]);
    usedIds.add(unique[index].id);
  }

  return selected;
}

/**
 * Create accessory block with real exercises
 */
function createAccessoryBlock(
  primaryPattern: MovementPattern,
  equipmentIds: string[],
  experienceLevel: ExperienceLevel,
  mainExerciseId: string,
  dayIndex: number
): WorkoutBlock {
  const accessoryExercises = selectAccessoryExercises(
    primaryPattern,
    equipmentIds,
    experienceLevel,
    mainExerciseId,
    dayIndex
  );

  const accessoryPrescriptions = accessoryExercises.map((ex) => ({
    exerciseId: ex.id,
    sets: Array.from({ length: 3 }, () => ({
      targetReps: 10,
      targetRpe: 7,
    })),
  }));

  if (process.env.NODE_ENV !== 'production') {
    console.log('[DailyWorkoutEngine] Selected accessory exercises:', {
      count: accessoryExercises.length,
      exercises: accessoryExercises.map((ex) => ex.name),
    });
  }

  return {
    id: generateId('accessory'),
    type: 'accessory',
    title: 'Accessory Work',
    accessory: accessoryPrescriptions,
    estimatedDurationMinutes: 15 + accessoryExercises.length * 5,
  };
}

/**
 * Select conditioning exercise from library
 */
function selectConditioningExercise(
  equipmentIds: string[],
  dayIndex: number
): Exercise | null {
  // Get conditioning exercises
  let candidates = [
    ...getExercisesByTag('conditioning'),
    ...getExercisesByTag('hyrox'),
  ].filter(
    (ex) =>
      ex.equipmentIds.length === 0 ||
      ex.equipmentIds.some((id) => equipmentIds.includes(id))
  );

  // Remove duplicates
  candidates = Array.from(
    new Map(candidates.map((ex) => [ex.id, ex])).values()
  );

  if (candidates.length === 0) {
    return null;
  }

  // Prefer cardio machines if available
  const cardioMachines = candidates.filter((ex) =>
    ['rower', 'bike', 'ski_erg'].some((eq) => equipmentIds.includes(eq))
  );
  if (cardioMachines.length > 0) {
    candidates = cardioMachines;
  }

  // Rotate selection
  const selectedIndex = dayIndex % candidates.length;
  return candidates[selectedIndex];
}

/**
 * Create conditioning block with real exercise from library
 */
function createConditioningBlock(
  goal: TrainingGoal,
  experienceLevel: ExperienceLevel,
  equipmentIds: string[],
  timeAvailability: string,
  dayIndex: number
): WorkoutBlock | null {
  // Skip conditioning for pure strength days
  if (goal === 'strength') {
    return null;
  }

  // Select conditioning exercise
  const conditioningExercise = selectConditioningExercise(equipmentIds, dayIndex);
  if (!conditioningExercise) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(
        '[DailyWorkoutEngine] No conditioning exercise found for equipment:',
        equipmentIds
      );
    }
    return null;
  }

  // Determine session parameters based on goal and time availability
  let targetZone = 3;
  let workSeconds = 60;
  let restSeconds = 60;
  let rounds = 8;

  // Map timeAvailability to session duration
  if (timeAvailability === 'short') {
    // 8-12 minutes total
    workSeconds = 40;
    restSeconds = 20;
    rounds = 8;
  } else if (timeAvailability === 'standard') {
    // 12-20 minutes total
    workSeconds = 60;
    restSeconds = 60;
    rounds = 8;
  } else if (timeAvailability === 'full') {
    // 20-30+ minutes total
    workSeconds = 120;
    restSeconds = 90;
    rounds = 6;
  }

  // Adjust based on goal
  if (goal === 'conditioning') {
    targetZone = 4;
    workSeconds = 120;
    restSeconds = 90;
    rounds = 6;
  } else if (goal === 'hybrid') {
    targetZone = 3;
  } else if (goal === 'general') {
    targetZone = 2;
    workSeconds = 600; // 10 minutes steady
    restSeconds = undefined;
    rounds = 1;
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log('[ConditioningEngine] Selected exercise:', conditioningExercise.name, {
      goal,
      timeAvailability,
      targetZone,
      rounds,
      workSeconds,
    });
  }

  return {
    id: generateId('conditioning'),
    type: 'conditioning' as const,
    title: `Engine – ${conditioningExercise.name}`,
    conditioning: {
      mode: targetZone <= 2 ? ('steady' as const) : ('interval' as const),
      workSeconds,
      restSeconds: restSeconds || undefined,
      rounds,
      targetZone: `Z${targetZone}`,
      notes: conditioningExercise.name,
    },
    estimatedDurationMinutes: Math.ceil(
      (workSeconds * rounds + (restSeconds || 0) * (rounds - 1)) / 60
    ),
  };
}

/**
 * Create cooldown block
 */
function createCooldownBlock(): WorkoutBlock {
  return {
    id: generateId('cooldown'),
    type: 'cooldown',
    title: 'Cooldown',
    cooldownItems: [
      '3–5 minutes easy movement',
      'Light stretch: quads, hamstrings, glutes',
    ],
    estimatedDurationMinutes: 5,
  };
}

/**
 * Calculate total estimated duration from blocks
 */
function calculateTotalDuration(blocks: WorkoutBlock[]): number {
  return blocks.reduce((total, block) => {
    return total + (block.estimatedDurationMinutes || 0);
  }, 0);
}

/**
 * Determine focus tags based on goal and blocks
 */
function determineFocusTags(
  goal: TrainingGoal,
  hasStrength: boolean
): string[] {
  const tags: string[] = [];

  if (hasStrength) {
    tags.push('strength');
  }

  if (goal === 'conditioning') {
    tags.push('engine');
  } else if (goal === 'hybrid') {
    tags.push('hybrid');
    tags.push('engine');
  } else if (goal === 'strength') {
    tags.push('strength');
  } else {
    tags.push('general');
  }

  return tags;
}

/**
 * Generate a complete daily workout session
 *
 * @param params - Generation parameters
 * @returns WorkoutPlanDay with all blocks
 */
export function generateDailyWorkout(
  params: GenerateDailyWorkoutParams & { dayIndex?: number }
): WorkoutPlanDay {
  const {
    goal,
    experienceLevel,
    equipmentIds,
    units,
    strengthNumbers,
    userId = 'user-placeholder',
    dayIndex = 0,
    date,
    focusPatternOverride,
    weekIndex,
    weeklyStructureDay,
  } = params;

  // Resolve pattern from override if provided
  // Priority: weeklyStructureDay.mainMovementPattern > focusPatternOverride > default rotation
  let resolvedPattern = resolvePatternFromOverride(focusPatternOverride, dayIndex);
  
  // Override with weekly structure pattern if available
  if (weeklyStructureDay && weeklyStructureDay.mainMovementPattern) {
    // Map weekly structure pattern to our pattern system
    const structurePattern = weeklyStructureDay.mainMovementPattern;
    if (structurePattern !== 'engine' && structurePattern !== 'conditioning') {
      resolvedPattern = structurePattern as MovementPattern | 'rest' | 'conditioning' | null;
    } else if (structurePattern === 'engine' || structurePattern === 'conditioning') {
      resolvedPattern = 'conditioning';
    }
  }

  /**
   * EARLY EXIT: REST DAY
   */
  if (resolvedPattern === 'rest') {
    const workoutDate = date || dayjs().format('YYYY-MM-DD');
    return {
      id: generateId('rest'),
      userId,
      date: workoutDate,
      dayIndex,
      focusTags: ['rest'],
      blocks: [],
      estimatedDurationMinutes: 0,
      adjustedForReadiness: false,
      createdAt: new Date().toISOString(),
    };
  }

  // Determine primary pattern for the day (used for strength and accessory selection)
  // Use resolved pattern if available, otherwise fall back to default rotation
  const primaryPattern =
    resolvedPattern && resolvedPattern !== 'conditioning'
      ? (resolvedPattern as MovementPattern)
      : getPrimaryPatternForDay(dayIndex);

  /**
   * CONDITIONING-ONLY DAY (from weekly template)
   * Special case: only warmup, conditioning, and cooldown
   */
  if (resolvedPattern === 'conditioning') {
    const { blocks, estimatedDurationMinutes } = constructWorkoutBlocks({
      focusPatternOverride: 'conditioning',
      selectedPattern: 'conditioning',
      experienceLevel,
      goal,
      dayIndex,
      equipmentIds,
      strengthNumbers,
    });

    const workoutDate = date || dayjs().format('YYYY-MM-DD');

    return {
      id: generateId('cond-only'),
      userId,
      date: workoutDate,
      dayIndex,
      focusTags: ['engine'],
      blocks,
      estimatedDurationMinutes,
      adjustedForReadiness: false,
      createdAt: new Date().toISOString(),
    };
  }

  // New: unified block constructor
  // Pass weekly structure to constructWorkoutBlocks for volume/intensity/conditioning adjustments
  const { blocks, estimatedDurationMinutes } = constructWorkoutBlocks({
    focusPatternOverride,
    selectedPattern: primaryPattern,
    experienceLevel,
    goal,
    dayIndex,
    equipmentIds,
    strengthNumbers,
    weeklyStructureDay, // Pass weekly structure for adjustments
  });

  // Determine focus tags (check if strength block exists)
  const strengthBlock = blocks.find((b) => b.type === 'strength');
  const focusTags = determineFocusTags(goal, !!strengthBlock);

  // Use provided date or default to today
  const workoutDate = date || dayjs().format('YYYY-MM-DD');

  // Create workout plan day
  const workoutPlanDay: WorkoutPlanDay = {
    id: generateId('workout'),
    userId,
    date: workoutDate,
    dayIndex,
    focusTags,
    blocks,
    estimatedDurationMinutes,
    adjustedForReadiness: false,
    createdAt: new Date().toISOString(),
  };

  if (process.env.NODE_ENV !== 'production') {
    console.log('[DailyWorkoutEngine] Generated workout for', dayjs().format('YYYY-MM-DD'), {
      focusTags,
      blockTypes: blocks.map((b) => b.type),
      blockCount: blocks.length,
      estimatedDuration: estimatedDurationMinutes,
    });
  }

  // TODO: Integrate periodization logic
  // - Track microcycle position
  // - Apply progressive overload

  // TODO: Integrate alternating patterns (push/pull/legs)
  // - Rotate main lifts based on training history
  // - Balance movement patterns

  // TODO: Incorporate movement variety
  // - Avoid repeating same exercises too frequently
  // - Rotate exercise variations

  // TODO: Adapt volume based on trainingDaysPerWeek
  // - Higher frequency = lower volume per session
  // - Lower frequency = higher volume per session

  // TODO: Adjust main lift by microcycle progression model
  // - Linear progression
  // - Undulating periodization
  // - Wave loading

  return workoutPlanDay;
}
