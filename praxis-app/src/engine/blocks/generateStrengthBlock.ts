import type { WorkoutBlock, MovementPattern, StrengthNumbers } from '@core/types';
import type { Exercise, ExerciseDifficulty } from '@core/types/exercise';
import { EXERCISES, getExercisesByPatternAndEquipment } from '@core/data/exercises';
import { getIntensityWave, getRepScheme, buildStrengthSets } from '../strength/strengthProgression';
import { useUserStore } from '@core/store/useUserStore';
import type { WeeklyDayStructure } from '@/utils/periodization/buildWeeklyStructure';

const PERIODIZATION_DEBUG = true;

interface GenerateStrengthBlockOptions {
  pattern: MovementPattern;
  dayIndex: number;
  equipmentIds: string[];
  experienceLevel: ExerciseDifficulty;
  strengthNumbers?: Record<string, number>;
  focusPatternOverride?: string; // NEW — weekly template override
  weekIndex?: number; // NEW — future periodization
  weeklyStructureDay?: WeeklyDayStructure; // NEW — weekly structure guidance
}

/**
 * Check if user has equipment for an exercise
 */
function userHasEquipmentFor(
  exercise: Exercise,
  equipmentIds: string[]
): boolean {
  // If exercise requires no equipment, user always has it
  if (exercise.equipmentIds.length === 0) {
    return true;
  }
  // User must have at least one required equipment
  return exercise.equipmentIds.some((id) => equipmentIds.includes(id));
}

/**
 * Map exercise ID to corresponding 1RM field in strengthNumbers
 */
function getOneRmForExercise(
  exerciseId: string,
  strengthNumbers: StrengthNumbers | undefined
): number | null {
  if (!strengthNumbers) return null;

  // Map exercise IDs to 1RM fields
  const exerciseTo1Rm: Record<string, keyof StrengthNumbers> = {
    back_squat: 'squat1RM',
    front_squat: 'squat1RM',
    bench_press: 'bench1RM',
    db_bench_press: 'bench1RM',
    deadlift: 'deadlift1RM',
    sumo_deadlift: 'deadlift1RM',
    rdl: 'deadlift1RM',
    overhead_press: 'press1RM',
  };

  const field = exerciseTo1Rm[exerciseId];
  if (field && strengthNumbers[field]) {
    return strengthNumbers[field] as number;
  }

  return null;
}

/**
 * Generate a unique ID for workout blocks
 */
function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function generateStrengthBlock(options: GenerateStrengthBlockOptions): WorkoutBlock | null {
  const { pattern, dayIndex, equipmentIds, experienceLevel, strengthNumbers, focusPatternOverride, weeklyStructureDay } = options;

  /**
   * Map override → actual pattern
   * Strength-only (conditioning + rest handled upstream)
   */
  function resolveOverridePattern(override?: string): MovementPattern | null {
    if (!override) return pattern;

    switch (override) {
      case 'squat':
        return 'squat';

      case 'hinge':
        return 'hinge';

      case 'upper_push_pull':
        const upperPatterns: MovementPattern[] = [
          'horizontal_push',
          'horizontal_pull',
          'vertical_push',
          'vertical_pull',
        ];
        return upperPatterns[dayIndex % 4];

      case 'mixed_full_body':
        const fullBodyPatterns: MovementPattern[] = [
          'squat',
          'hinge',
          'horizontal_push',
          'horizontal_pull',
        ];
        return fullBodyPatterns[dayIndex % 4];

      case 'conditioning':
      case 'rest':
        // Should never reach strength engine — handled in dailyWorkout
        return null;

      default:
        return pattern;
    }
  }

  const resolvedPattern = resolveOverridePattern(focusPatternOverride);

  if (!resolvedPattern) {
    return {
      id: generateId('no-strength'),
      type: 'strength',
      title: 'No Strength Block',
      strengthMain: null,
      estimatedDurationMinutes: 0,
    };
  }

  /**
   * Fallback biomechanical patterns built into strength engine
   */
  function getFallbackStrengthPatterns(primary: MovementPattern): MovementPattern[] {
    switch (primary) {
      case 'squat':
        return ['hinge', 'lunge'];
      case 'hinge':
        return ['squat', 'lunge'];
      case 'horizontal_push':
        return ['vertical_push'];
      case 'vertical_push':
        return ['horizontal_push'];
      case 'horizontal_pull':
        return ['vertical_pull', 'hinge'];
      case 'vertical_pull':
        return ['horizontal_pull', 'hinge'];
      default:
        return ['squat', 'hinge'];
    }
  }

  /**
   * Try to find a main lift by progressively relaxing constraints
   */
  function selectStrengthExercise(pattern: MovementPattern): Exercise | null {
    // 1 — Try exact match + appropriate modality
    let candidates = EXERCISES.filter(
      (e) =>
        e.pattern === pattern &&
        e.tags.includes('strength') &&
        userHasEquipmentFor(e, equipmentIds)
    );

    // Filter by difficulty (prefer exact match, but allow any if none found)
    const difficultyFiltered = candidates.filter(
      (ex) => ex.difficulty === experienceLevel
    );
    if (difficultyFiltered.length > 0) {
      candidates = difficultyFiltered;
    }

    if (candidates.length > 0) {
      return candidates[dayIndex % candidates.length];
    }

    // 2 — Try biomechanical fallbacks
    const fallbacks = getFallbackStrengthPatterns(pattern);
    for (const fb of fallbacks) {
      let fbMatches = getExercisesByPatternAndEquipment(fb, equipmentIds);
      fbMatches = fbMatches.filter(
        (e) =>
          e.tags.includes('strength') && userHasEquipmentFor(e, equipmentIds)
      );

      // Filter by difficulty
      const fbDifficultyFiltered = fbMatches.filter(
        (ex) => ex.difficulty === experienceLevel
      );
      if (fbDifficultyFiltered.length > 0) {
        fbMatches = fbDifficultyFiltered;
      }

      if (fbMatches.length > 0) {
        if (process.env.NODE_ENV !== 'production') {
          console.log('[StrengthEngine] Using fallback pattern:', fb);
        }
        return fbMatches[dayIndex % fbMatches.length];
      }
    }

    // 3 — Try ANY strength exercise user can do
    const global = EXERCISES.filter(
      (e) => e.tags.includes('strength') && userHasEquipmentFor(e, equipmentIds)
    );

    // Filter by difficulty
    const globalDifficultyFiltered = global.filter(
      (ex) => ex.difficulty === experienceLevel
    );
    const finalGlobal = globalDifficultyFiltered.length > 0 ? globalDifficultyFiltered : global;

    if (finalGlobal.length > 0) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[StrengthEngine] Global fallback selection');
      }
      return finalGlobal[dayIndex % finalGlobal.length];
    }

    if (process.env.NODE_ENV !== 'production') {
      console.warn('[StrengthEngine] No valid strength exercises available');
    }
    return null;
  }

  // SELECT EXERCISE (override-aware)
  const mainLift = selectStrengthExercise(resolvedPattern);

  if (!mainLift) {
    return {
      id: generateId('no-strength'),
      type: 'strength',
      title: 'No Strength Exercise Available',
      strengthMain: null,
      estimatedDurationMinutes: 0,
    };
  }

  /**
   * Build the strength prescription using wave-based progression
   * Adjust based on weekly structure volume/intensity targets if available
   */
  const baseIntensity = getIntensityWave(dayIndex);
  const baseRepScheme = getRepScheme(experienceLevel, baseIntensity.wave);

  // Apply weekly structure adjustments
  let adjustedSets = baseRepScheme.sets;
  let adjustedRpe = baseIntensity.rpe;
  let adjustedPercent = baseIntensity.percent;

  // PATCH PART 3: Enforce overrides in daily generators
  if (weeklyStructureDay) {
    // A. Volume/Intensity enforcement (Strength Block)
    if (weeklyStructureDay.volumeTarget === 'low') {
      // PATCH PART 3A: Stronger enforcement for low volume
      // Reduce sets by 1-2, but never below 2
      adjustedSets = Math.max(2, baseRepScheme.sets - Math.min(2, baseRepScheme.sets - 2));
    } else if (weeklyStructureDay.volumeTarget === 'high') {
      // Increase sets by +1 (max 6)
      adjustedSets = Math.min(6, baseRepScheme.sets + 1);
    }
    // "medium" = no change

    if (weeklyStructureDay.intensityTarget === 'low') {
      // PATCH PART 3A: Stronger enforcement for low intensity
      // Reduce RPE by 1 (min 5), reduce %1RM by 5%
      adjustedRpe = Math.max(5, baseIntensity.rpe - 1);
      adjustedPercent = Math.max(0.5, baseIntensity.percent - 0.05);
      
      // If volume is also low, apply additional intensity reduction
      if (weeklyStructureDay.volumeTarget === 'low') {
        adjustedRpe = Math.max(5, adjustedRpe - 1); // Another RPE reduction
        adjustedPercent = Math.max(0.5, adjustedPercent - 0.05); // Another % reduction
      }
    } else if (weeklyStructureDay.intensityTarget === 'high') {
      // Increase RPE by 1 (max 10), increase %1RM by 5%
      adjustedRpe = Math.min(10, baseIntensity.rpe + 1);
      adjustedPercent = Math.min(1.0, baseIntensity.percent + 0.05);
    }
    // "medium" = no change

    // B. Hard deload (check blockType for deload)
    if (weeklyStructureDay.blockType === 'deload') {
      // PATCH PART 3B: Hard deload enforcement
      adjustedSets = 2; // Force 2 sets
      adjustedRpe = Math.min(6, Math.max(5, adjustedRpe)); // Force RPE 5-6
      adjustedPercent = Math.max(0.5, Math.min(0.7, adjustedPercent - 0.10)); // Reduce %1RM by 10-15%
      
      if (PERIODIZATION_DEBUG) {
        console.log('[DailyGen Override] Hard deload applied:', {
          sets: adjustedSets,
          rpe: adjustedRpe,
          percent: adjustedPercent,
        });
      }
    }

    // D. Fatigue-protected days
    if (weeklyStructureDay.fatigueProtected) {
      // PATCH PART 3D: Force low volume and intensity for fatigue-protected days
      adjustedSets = Math.max(2, Math.min(3, adjustedSets)); // Max 3 sets, min 2
      adjustedRpe = Math.max(5, Math.min(6, adjustedRpe)); // Force RPE 5-6
      adjustedPercent = Math.max(0.5, Math.min(0.65, adjustedPercent - 0.10)); // Reduce %1RM significantly
      
      if (PERIODIZATION_DEBUG) {
        console.log('[DailyGen Override] Fatigue-protected day:', {
          volume: weeklyStructureDay.volumeTarget,
          intensity: weeklyStructureDay.intensityTarget,
          sets: adjustedSets,
          rpe: adjustedRpe,
          percent: adjustedPercent,
        });
      }
    }

    // Block type reinforcement (small additional nudge to ensure block type is felt)
    // This reinforces the weekly structure targets while respecting all bounds
    if (weeklyStructureDay.blockType === 'deload' && !weeklyStructureDay.fatigueProtected) {
      // Deload: extra conservative adjustment (only if not already fatigue-protected)
      if (adjustedSets > 2) {
        adjustedSets = Math.max(2, adjustedSets - 1); // Extra set reduction
      }
      if (adjustedRpe > 6) {
        adjustedRpe = Math.max(5, adjustedRpe - 1); // Extra RPE reduction
      }
      if (adjustedPercent > 0.7) {
        adjustedPercent = Math.max(0.5, adjustedPercent - 0.05); // Extra % reduction
      }
    } else if (weeklyStructureDay.blockType === 'intensification') {
      // Intensification: if intensity target is high, reinforce it slightly
      if (weeklyStructureDay.intensityTarget === 'high' && adjustedRpe < 9) {
        adjustedRpe = Math.min(10, adjustedRpe + 1); // Extra RPE boost
        adjustedPercent = Math.min(1.0, adjustedPercent + 0.03); // Extra % boost
      }
    } else if (weeklyStructureDay.blockType === 'accumulation') {
      // Accumulation: if volume target is high, reinforce it slightly
      if (weeklyStructureDay.volumeTarget === 'high' && adjustedSets < 5) {
        adjustedSets = Math.min(6, adjustedSets + 1); // Extra set boost
      }
    }

    if (PERIODIZATION_DEBUG) {
      console.log('[DailyGen Override]', {
        volume: weeklyStructureDay.volumeTarget,
        intensity: weeklyStructureDay.intensityTarget,
        fatigueProtected: weeklyStructureDay.fatigueProtected,
        blockType: weeklyStructureDay.blockType,
        finalSets: adjustedSets,
        finalRpe: adjustedRpe,
        finalPercent: adjustedPercent,
      });
    }
  }

  // Create adjusted rep scheme
  const adjustedRepScheme = {
    ...baseRepScheme,
    sets: adjustedSets,
  };

  // Create adjusted intensity
  const adjustedIntensity = {
    ...baseIntensity,
    rpe: adjustedRpe,
    percent: adjustedPercent,
  };

  // Pull 1RM from user store
  const userStore = useUserStore.getState();
  const oneRm = getOneRmForExercise(mainLift.id, userStore.strengthNumbers);

  const sets = buildStrengthSets(adjustedRepScheme, adjustedIntensity, oneRm);

  if (process.env.NODE_ENV !== 'production') {
    console.log('[StrengthEngine] Selected main lift:', mainLift.name, {
      pattern: resolvedPattern,
      difficulty: mainLift.difficulty,
      wave: adjustedIntensity.wave,
      sets: adjustedRepScheme.sets,
      reps: adjustedRepScheme.reps,
      rpe: adjustedIntensity.rpe,
      oneRm,
      weeklyStructure: weeklyStructureDay ? {
        volumeTarget: weeklyStructureDay.volumeTarget,
        intensityTarget: weeklyStructureDay.intensityTarget,
      } : undefined,
    });
  }

  return {
    id: generateId('strength-main'),
    type: 'strength' as const,
    title: `Main Lift – ${mainLift.name}`,
    strengthMain: {
      exerciseId: mainLift.id,
      sets,
      wave: adjustedIntensity.wave,
      rpe: adjustedIntensity.rpe,
      percent: adjustedIntensity.percent,
      oneRmUsed: oneRm ?? null,
    },
    estimatedDurationMinutes: 25 + adjustedRepScheme.sets * 2, // ~2 min per set including rest
  };
}

