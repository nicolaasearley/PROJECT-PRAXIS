import type { WorkoutBlock } from '@core/types';
import { EXERCISES } from '@core/data/exercises';
import { useUserStore } from '@core/store/useUserStore';
import { getConditioningPrescription } from '../conditioning/conditioningTemplates';
import { getHyroxConditioningTemplate } from '../conditioning/conditioningHyrox';
import { getHyroxRaceSimulation } from '../conditioning/conditioningHyroxRace';
import { getReadinessFactor } from '../conditioning/conditioningReadiness';
import type { WeeklyDayStructure } from '@/utils/periodization/buildWeeklyStructure';

const PERIODIZATION_DEBUG = true;

/**
 * Generate a unique ID for workout blocks
 */
function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

interface GenerateConditioningBlockOptions {
  goal: string;
  experienceLevel: string;
  dayIndex: number;
  equipmentIds: string[];
  weeklyStructureDay?: WeeklyDayStructure; // NEW: weekly structure guidance
}


/**
 * Generate conditioning block
 */
export function generateConditioningBlock(
  options: GenerateConditioningBlockOptions
): WorkoutBlock | null {
  const { goal, equipmentIds, dayIndex, weeklyStructureDay } = options;

  // Skip conditioning for pure strength days
  if (goal === 'strength') {
    return null;
  }

  // Get timeAvailability from user store
  const userStore = useUserStore.getState();
  const timeAvailability =
    userStore.preferences?.timeAvailability || 'standard';

  // Determine intensity, zone, style, duration
  let prescription = getConditioningPrescription(
    dayIndex,
    goal,
    timeAvailability
  );

  // PATCH PART 3C: Conditioning enforcement
  if (weeklyStructureDay?.conditioningTarget) {
    const target = weeklyStructureDay.conditioningTarget;
    
    if (target === 'light') {
      // PATCH PART 3C: Light conditioning enforcement
      // zone = 2, duration ≤ 15 min, style = 'steady'
      prescription = {
        ...prescription,
        zone: 2,
        style: 'steady',
        duration: Math.min(15, Math.max(prescription.duration, 10)), // Cap at 15 min, min 10
      };
      
      if (PERIODIZATION_DEBUG) {
        console.log('[DailyGen Override] Light conditioning enforced:', {
          zone: prescription.zone,
          style: prescription.style,
          duration: prescription.duration,
        });
      }
    } else if (target === 'intensity') {
      // Intensity = Z4, intervals, shorter but harder
      prescription = {
        ...prescription,
        zone: 4,
        style: 'interval',
        duration: Math.min(prescription.duration, 20), // Cap at 20 min for intensity
      };
    } else if (target === 'mixed') {
      // Mixed = Z3, moderate intervals (default behavior, but ensure Z3)
      prescription = {
        ...prescription,
        zone: 3,
        style: prescription.style || 'interval',
      };
    }
  }

  // PATCH PART 3B: Hard deload - conditioning always light (Z2 only, ≤12 minutes)
  if (weeklyStructureDay?.blockType === 'deload') {
    prescription = {
      ...prescription,
      zone: 2,
      style: 'steady',
      duration: Math.min(12, prescription.duration), // Cap at 12 min for hard deload
    };
    
    if (PERIODIZATION_DEBUG) {
      console.log('[DailyGen Override] Deload conditioning enforced:', {
        zone: prescription.zone,
        style: prescription.style,
        duration: prescription.duration,
      });
    }
  }

  // PATCH PART 3D: Fatigue-protected days - force light conditioning
  if (weeklyStructureDay?.fatigueProtected) {
    prescription = {
      ...prescription,
      zone: 2,
      style: 'steady',
      duration: Math.min(15, prescription.duration), // Cap at 15 min
    };
    
    if (PERIODIZATION_DEBUG) {
      console.log('[DailyGen Override] Fatigue-protected conditioning:', {
        zone: prescription.zone,
        style: prescription.style,
        duration: prescription.duration,
      });
    }
  }

  // Pull readiness from store
  const readiness = userStore.currentReadiness;
  const readinessFactor = getReadinessFactor(readiness);

  // RACE SIMULATION OVERRIDE
  if (goal === 'hyrox' && prescription.style === 'race_simulation') {
    const race = getHyroxRaceSimulation(equipmentIds, readiness);
    return {
      id: generateId('conditioning'),
      type: 'conditioning' as const,
      title: race.title,
      conditioning: race as any, // Type assertion needed as we're extending the interface
      estimatedDurationMinutes: race.estimatedDurationMinutes,
    };
  }

  // HYROX GOAL OVERRIDE – use HYROX templates first
  if (goal === 'hyrox') {
    const hyroxBlock = getHyroxConditioningTemplate(
      equipmentIds,
      prescription.dayType,
      prescription.wave,
      timeAvailability
    );

    // Scale HYROX block using readiness
    const scaledDuration = Math.round(
      hyroxBlock.durationMinutes * readinessFactor
    );

    // Scale work parameters based on block type
    let scaledBlock: any = {
      ...hyroxBlock,
      durationMinutes: scaledDuration,
      zone: prescription.zone,
      wave: prescription.wave,
      readinessFactor,
    };

    // Scale work/rounds/reps based on block type
    if ('work' in hyroxBlock && hyroxBlock.work) {
      scaledBlock.work = {
        ...hyroxBlock.work,
        rounds: Math.max(
          1,
          Math.round((hyroxBlock.work.rounds ?? 1) * readinessFactor)
        ),
        ...(hyroxBlock.work.pushMeters && {
          pushMeters: hyroxBlock.work.pushMeters,
        }),
        ...(hyroxBlock.work.pullMeters && {
          pullMeters: hyroxBlock.work.pullMeters,
        }),
        ...(hyroxBlock.work.metersPerRep && {
          metersPerRep: hyroxBlock.work.metersPerRep,
        }),
      };
    }

    if ('reps' in hyroxBlock && hyroxBlock.reps) {
      scaledBlock.reps = Math.round(hyroxBlock.reps * readinessFactor);
    }

    if ('intervals' in hyroxBlock && hyroxBlock.intervals) {
      scaledBlock.intervals = {
        ...hyroxBlock.intervals,
        rounds: Math.max(
          1,
          Math.round(hyroxBlock.intervals.rounds * readinessFactor)
        ),
      };
    }

    return {
      id: generateId('conditioning'),
      type: 'conditioning' as const,
      title: `HYROX – ${hyroxBlock.station}`,
      conditioning: scaledBlock as any, // Type assertion needed as we're extending the interface
      estimatedDurationMinutes: scaledDuration,
    };
  }

  // Choose an exercise
  let exercise =
    EXERCISES.find(
      (e) =>
        e.tags?.includes('conditioning') &&
        e.equipmentIds.some((eq) => equipmentIds.includes(eq))
    ) ??
    EXERCISES.find((e) => e.modality === 'cardio_machine') ??
    EXERCISES.find((e) => e.id === 'kb_swing'); // fallback

  if (!exercise) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(
        '[ConditioningEngine] No conditioning exercise found for equipment:',
        equipmentIds
      );
    }
    return null;
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log('[ConditioningEngine] Selected exercise:', exercise.name, {
      goal,
      timeAvailability,
      prescription,
      weeklyStructure: weeklyStructureDay ? {
        conditioningTarget: weeklyStructureDay.conditioningTarget,
      } : undefined,
    });
  }

  // STANDARD CONDITIONING
  const scaledDuration = Math.round(prescription.duration * readinessFactor);

  return {
    id: generateId('conditioning'),
    type: 'conditioning' as const,
    title: 'Engine Work',
    conditioning: {
      mode: prescription.style as 'interval' | 'steady' | 'emom',
      zone: prescription.zone,
      durationMinutes: scaledDuration,
      targetZone: `Z${prescription.zone}`,
      exerciseId: exercise.id,
      wave: prescription.wave,
      dayType: prescription.dayType,
      readinessFactor,
      notes: exercise.name,
    } as any, // Type assertion needed as we're extending the interface
    estimatedDurationMinutes: scaledDuration,
  };
}

