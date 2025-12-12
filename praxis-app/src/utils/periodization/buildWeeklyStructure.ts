import { ReadinessAnalysis } from './analyzeReadiness';
import { FatigueAnalysis } from './analyzeFatigue';
import { MovementPattern } from '@core/types';
import dayjs from 'dayjs';

const PERIODIZATION_DEBUG = true;

export type VolumeTarget = 'low' | 'medium' | 'high';
export type IntensityTarget = 'low' | 'medium' | 'high';
export type ConditioningTarget = 'light' | 'mixed' | 'intensity';
export type TrainingBlockType = 'accumulation' | 'intensification' | 'deload';

export interface WeeklyDayStructure {
  dateISO: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  mainMovementPattern: MovementPattern;
  mainLiftCategory: string; // e.g., "Bench", "Deadlift", "Squat", "Pull"
  volumeTarget: VolumeTarget;
  intensityTarget: IntensityTarget;
  conditioningTarget: ConditioningTarget;
  blockType?: TrainingBlockType; // Optional: derived from parent WeeklyStructure
  fatigueProtected?: boolean; // PATCH PART 4: Flag for fatigue-protected days
}

export interface WeeklyStructure {
  weekStartISO: string;
  days: WeeklyDayStructure[];
  blockType: TrainingBlockType; // NEW: training block type for this week
  metadata: {
    readiness: ReadinessAnalysis;
    fatigue: FatigueAnalysis;
    trainingDaysPerWeek: number;
  };
}

interface BuildWeeklyStructureParams {
  readiness: ReadinessAnalysis;
  fatigue: FatigueAnalysis;
  trainingDaysPerWeek: number;
  weekStartISO?: string; // Optional, defaults to current week start (Monday)
  blockType: TrainingBlockType; // NEW: training block type for this week
}

/**
 * Build a weekly training structure based on readiness, fatigue, and user preferences
 */
export function buildWeeklyStructure({
  readiness,
  fatigue,
  trainingDaysPerWeek,
  weekStartISO,
  blockType,
}: BuildWeeklyStructureParams): WeeklyStructure {
  // Determine week start (Monday)
  const weekStart = weekStartISO
    ? dayjs(weekStartISO)
    : dayjs().startOf('isoWeek'); // ISO week starts Monday

  const weekStartISOString = weekStart.format('YYYY-MM-DD');

  // Core movement patterns to include
  const corePatterns: Array<{
    pattern: MovementPattern;
    category: string;
  }> = [
    { pattern: 'horizontal_press', category: 'Bench' },
    { pattern: 'hinge', category: 'Deadlift' },
    { pattern: 'squat', category: 'Squat' },
    { pattern: 'horizontal_pull', category: 'Pull' },
  ];

  // Determine base volume and intensity based on readiness
  // Then adjust based on block type
  const getBaseVolumeTarget = (): VolumeTarget => {
    if (readiness.category === 'low') return 'low';
    if (readiness.category === 'high') return 'high';
    return 'medium';
  };

  const getBaseIntensityTarget = (): IntensityTarget => {
    if (readiness.category === 'low') return 'low';
    if (readiness.category === 'high') return 'high';
    return 'medium';
  };

  // Adjust base targets based on block type
  // Block type biases the weekly pattern while respecting readiness
  const getVolumeTarget = (): VolumeTarget => {
    const base = getBaseVolumeTarget();
    
    if (blockType === 'deload') {
      // Deload: prioritize low volume
      if (base === 'high') return 'medium';
      if (base === 'medium') return 'low';
      return 'low'; // Already low
    } else if (blockType === 'accumulation') {
      // Accumulation: bias toward higher volume
      if (base === 'low') return 'medium';
      if (base === 'medium') return 'high';
      return 'high'; // Already high
    } else if (blockType === 'intensification') {
      // Intensification: moderate volume, let intensity be high
      if (base === 'high') return 'medium'; // Reduce volume to allow intensity
      return base; // Keep medium or low
    }
    
    return base;
  };

  const getIntensityTarget = (): IntensityTarget => {
    const base = getBaseIntensityTarget();
    
    if (blockType === 'deload') {
      // Deload: prioritize low intensity
      if (base === 'high') return 'medium';
      if (base === 'medium') return 'low';
      return 'low'; // Already low
    } else if (blockType === 'intensification') {
      // Intensification: bias toward higher intensity
      if (base === 'low') return 'medium';
      if (base === 'medium') return 'high';
      return 'high'; // Already high
    } else if (blockType === 'accumulation') {
      // Accumulation: moderate intensity, let volume be high
      if (base === 'high') return 'medium'; // Reduce intensity to allow volume
      return base; // Keep medium or low
    }
    
    return base;
  };

  const getConditioningTarget = (): ConditioningTarget => {
    if (readiness.category === 'low') return 'light';
    if (readiness.category === 'high') return 'intensity';
    return 'mixed';
  };

  // Base volume/intensity
  const baseVolume = getVolumeTarget();
  const baseIntensity = getIntensityTarget();
  const baseConditioning = getConditioningTarget();

  // PATCH PART 2: Strengthen pattern fatigue rules
  // Track which patterns are fatigue-protected (fatigue >= 80)
  // This Set is populated before day generation and updated during adjustment
  const fatigueProtectedPatterns = new Set<MovementPattern>();
  if (fatigue.squat >= 80) fatigueProtectedPatterns.add('squat');
  if (fatigue.hinge >= 80) fatigueProtectedPatterns.add('hinge');
  if (fatigue.push >= 80) fatigueProtectedPatterns.add('horizontal_press');
  if (fatigue.pull >= 80) fatigueProtectedPatterns.add('horizontal_pull');

  // Adjust based on fatigue and block type
  // Block type provides the base bias, fatigue provides pattern-specific adjustments
  const adjustForFatigue = (
    pattern: 'squat' | 'hinge' | 'push' | 'pull',
    baseVol: VolumeTarget,
    baseInt: IntensityTarget,
    dayIndex: number,
    movementPattern: MovementPattern
  ): { volume: VolumeTarget; intensity: IntensityTarget; fatigueProtected: boolean } => {
    const fatigueLevel = fatigue[pattern];
    let volume = baseVol;
    let intensity = baseInt;
    let isFatigueProtected = false;

    // PATCH PART 2: Strengthen pattern fatigue rules - takes precedence
    if (fatigueLevel >= 60) {
      // Fatigue >= 60: force low volume
      volume = 'low';
      if (PERIODIZATION_DEBUG) {
        console.log('[Periodization] Fatigue override applied for pattern:', pattern, '(fatigue:', fatigueLevel.toFixed(1), ', volume → low)');
      }
    }

    if (fatigueLevel >= 75) {
      // Fatigue >= 75: force low intensity
      intensity = 'low';
      if (PERIODIZATION_DEBUG) {
        console.log('[Periodization] Fatigue override applied for pattern:', pattern, '(fatigue:', fatigueLevel.toFixed(1), ', intensity → low)');
      }
    }

    if (fatigueLevel >= 80) {
      // Fatigue >= 80: mark as fatigue-protected
      isFatigueProtected = true;
      fatigueProtectedPatterns.add(movementPattern);
      if (PERIODIZATION_DEBUG) {
        console.log('[Periodization] Pattern fatigue-protected:', pattern, '(fatigue:', fatigueLevel.toFixed(1), ')');
      }
    }

    // Block-type specific day-level adjustments (applied after fatigue overrides)
    // This creates variation within the week while respecting block type
    if (blockType === 'accumulation') {
      // Accumulation: 2-3 days with high volume, rest medium
      // BUT: only if not fatigue-protected
      if (!isFatigueProtected) {
        if (dayIndex < 4 && baseVol === 'high' && fatigueLevel < 60) {
          volume = 'high'; // Keep high on main days if not fatigued
        } else if (dayIndex >= 4 && baseVol === 'high' && fatigueLevel < 60) {
          volume = 'medium'; // Moderate on later days if not fatigued
        }
      }
      // Intensity stays moderate to allow volume focus (unless fatigue-protected)
      if (intensity === 'high' && !isFatigueProtected) intensity = 'medium';
    } else if (blockType === 'intensification') {
      // Intensification: 2 key days with high intensity, rest medium
      // BUT: only if not fatigue-protected
      if (!isFatigueProtected) {
        if (dayIndex < 2 && baseInt === 'high' && fatigueLevel < 75) {
          intensity = 'high'; // Keep high on first 2 main days if not fatigued
        } else if (dayIndex >= 2 && baseInt === 'high' && fatigueLevel < 75) {
          intensity = 'medium'; // Moderate on later days if not fatigued
        }
      }
      // Volume stays moderate to allow intensity focus (unless fatigue-protected)
      if (volume === 'high' && !isFatigueProtected) volume = 'medium';
    } else if (blockType === 'deload') {
      // Deload: all days low, maybe one medium day (but not if fatigue-protected)
      if (isFatigueProtected || fatigueLevel >= 60) {
        volume = 'low';
      } else if (dayIndex === 0 && baseVol === 'medium') {
        volume = 'medium'; // One medium day is okay if not fatigued
      } else {
        volume = 'low'; // Everything else low
      }
      intensity = 'low'; // All intensity low
    }

    // Legacy pattern-specific fatigue adjustments (now redundant but kept for safety)
    // These are already handled above with stronger rules
    if (fatigueLevel >= 60 && volume !== 'low') {
      volume = 'low'; // Force low if somehow not already set
    }
    if (fatigueLevel >= 75 && intensity !== 'low') {
      intensity = 'low'; // Force low if somehow not already set
    }

    // Only allow boosts if pattern is fresh and not fatigue-protected
    if (fatigueLevel < 30 && readiness.category === 'high' && blockType !== 'deload' && !isFatigueProtected) {
      if (volume === 'medium' && blockType === 'accumulation') volume = 'high';
      if (intensity === 'medium' && blockType === 'intensification') intensity = 'high';
    }

    return { volume, intensity, fatigueProtected: isFatigueProtected };
  };

  // Build day structure
  const days: WeeklyDayStructure[] = [];
  const daysToGenerate = Math.min(trainingDaysPerWeek, 6); // Max 6 days

  // Always include core patterns first
  const patternOrder: MovementPattern[] = [];
  const categoryOrder: string[] = [];

  // Prioritize patterns with lower fatigue
  // PATCH PART 2: Limit frequency of fatigue-protected patterns (max 1 day per week)
  const patternFatigueMap = [
    { pattern: 'horizontal_press' as MovementPattern, category: 'Bench', fatigue: fatigue.push },
    { pattern: 'hinge' as MovementPattern, category: 'Deadlift', fatigue: fatigue.hinge },
    { pattern: 'squat' as MovementPattern, category: 'Squat', fatigue: fatigue.squat },
    { pattern: 'horizontal_pull' as MovementPattern, category: 'Pull', fatigue: fatigue.pull },
  ];

  // Sort by fatigue (lower first) but ensure all core patterns are included
  // PATCH PART 2: Fatigue-protected patterns (>= 80) should appear less frequently
  const sortedPatterns = [...patternFatigueMap].sort((a, b) => {
    // If one is fatigue-protected (>= 80) and the other isn't, prioritize the non-protected one
    const aProtected = a.fatigue >= 80;
    const bProtected = b.fatigue >= 80;
    if (aProtected && !bProtected) return 1; // Protected patterns go later
    if (!aProtected && bProtected) return -1; // Non-protected patterns go first
    return a.fatigue - b.fatigue; // Otherwise sort by fatigue level
  });

  // Add core patterns
  sortedPatterns.forEach((item) => {
    patternOrder.push(item.pattern);
    categoryOrder.push(item.category);
  });

  // Add conditioning-focused day if we have room
  if (daysToGenerate > 4) {
    patternOrder.push('engine' as MovementPattern);
    categoryOrder.push('Conditioning');
  }

  // Add hybrid/upper day if we have room
  if (daysToGenerate > 5) {
    patternOrder.push('vertical_press' as MovementPattern);
    categoryOrder.push('Hybrid');
  }

  // PATCH PART 2: Track fatigue-protected pattern frequency (max 1 per week)
  const fatigueProtectedCount = new Map<MovementPattern, number>();

  // Generate days (starting from Monday, which is day 1)
  for (let i = 0; i < daysToGenerate; i++) {
    const dayDate = weekStart.add(i, 'days');
    const dayOfWeek = dayDate.day(); // 0 = Sunday, 1 = Monday, etc.

    let pattern = patternOrder[i] || 'squat';
    let category = categoryOrder[i] || 'Squat';

    // PATCH PART 2: Skip fatigue-protected patterns if already used once this week
    if (fatigueProtectedPatterns.has(pattern)) {
      const count = fatigueProtectedCount.get(pattern) || 0;
      if (count >= 1) {
        // Already used this pattern once, skip to next non-protected pattern
        const nonProtectedPatterns = patternFatigueMap.filter(
          (p) => !fatigueProtectedPatterns.has(p.pattern) && !fatigueProtectedCount.has(p.pattern)
        );
        if (nonProtectedPatterns.length > 0) {
          pattern = nonProtectedPatterns[0].pattern;
          category = nonProtectedPatterns[0].category;
        }
      } else {
        fatigueProtectedCount.set(pattern, 1);
      }
    }

    // Map pattern to fatigue key
    const fatigueKey: 'squat' | 'hinge' | 'push' | 'pull' =
      pattern === 'horizontal_press'
        ? 'push'
        : pattern === 'horizontal_pull'
        ? 'pull'
        : pattern === 'squat'
        ? 'squat'
        : pattern === 'hinge'
        ? 'hinge'
        : 'squat'; // Default fallback

    const adjustments = adjustForFatigue(fatigueKey, baseVolume, baseIntensity, i, pattern);

    // PATCH PART 2: Set conditioning target based on fatigue
    let conditioningTarget = pattern === 'engine' ? 'intensity' : baseConditioning;
    if (adjustments.fatigueProtected || fatigue[fatigueKey] >= 80) {
      conditioningTarget = 'light'; // Force light conditioning for fatigue-protected patterns
    }

    days.push({
      dateISO: dayDate.format('YYYY-MM-DD'),
      dayOfWeek,
      mainMovementPattern: pattern,
      mainLiftCategory: category,
      volumeTarget: adjustments.volume,
      intensityTarget: adjustments.intensity,
      conditioningTarget,
      blockType, // Include block type on each day for convenience
      fatigueProtected: adjustments.fatigueProtected, // PATCH PART 4: Include fatigue protection flag
    });
  }

  // Avoid back-to-back same-pattern heavy days
  for (let i = 1; i < days.length; i++) {
    const prevDay = days[i - 1];
    const currentDay = days[i];

    // If same pattern and both are high volume/intensity, reduce current day
    if (
      prevDay.mainMovementPattern === currentDay.mainMovementPattern &&
      prevDay.volumeTarget === 'high' &&
      currentDay.volumeTarget === 'high'
    ) {
      currentDay.volumeTarget = 'medium';
    }
  }

  // PATCH PART 3: Make weekly structure more conservative when ACWR is high
  // If blockType is deload and ACWR is high, force low volume/intensity across all days
  if (blockType === 'deload' && fatigue.acwrZone === 'high') {
    if (PERIODIZATION_DEBUG) {
      console.log('[WeeklyStructure] ACWR high → enforcing low volume/intensity across week');
    }

    const conservativeDays = days.map((day) => ({
      ...day,
      volumeTarget: 'low' as VolumeTarget,
      intensityTarget: 'low' as IntensityTarget,
      conditioningTarget: (day.conditioningTarget === 'intensity' ? 'mixed' : 'light') as ConditioningTarget,
    }));

    return {
      weekStartISO: weekStartISOString,
      days: conservativeDays,
      blockType, // Store block type at weekly level
      metadata: {
        readiness,
        fatigue,
        trainingDaysPerWeek,
      },
    };
  }

  return {
    weekStartISO: weekStartISOString,
    days,
    blockType, // Store block type at weekly level
    metadata: {
      readiness,
      fatigue,
      trainingDaysPerWeek,
    },
  };
}
