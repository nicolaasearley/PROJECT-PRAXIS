import { TrainingBlockType } from './buildWeeklyStructure';
import { ReadinessAnalysis } from './analyzeReadiness';
import { FatigueAnalysis } from './analyzeFatigue';
import { WorkoutRecord } from '@/types/workout';
import { calculateAcuteLoad, calculateChronicLoad } from '@/utils/recoveryAnalytics';
import dayjs from 'dayjs';

const PERIODIZATION_DEBUG = true;

/**
 * Infer training block type from workout history, readiness, and fatigue
 * 
 * Simple deterministic rule:
 * - Uses ISO week number modulo 4 to create a repeating 4-week cycle:
 *   - Week 1: accumulation (build volume)
 *   - Week 2: accumulation (continue building)
 *   - Week 3: intensification (peak intensity)
 *   - Week 4: deload (recovery)
 * 
 * Override rules (take priority):
 * - If ACWR ≥ 1.5 → "deload" (hard deload)
 * - If ACWR ≥ 1.3 → "deload" (force recovery)
 * - If ACWR is 'high' or average recovery < 40 → "deload" (force recovery)
 * - If ACWR is 'under' and readiness is 'high' → can start with "accumulation"
 * 
 * This is a lightweight heuristic that provides structure while respecting
 * recovery signals.
 */
export function inferBlockTypeFromHistory(
  history: WorkoutRecord[],
  readiness: ReadinessAnalysis,
  fatigue: FatigueAnalysis,
  weekStartISO: string
): TrainingBlockType {
  // PATCH PART 2: ACWR hard safety override - takes precedence over everything
  // Use acwrValue and acwrZone from fatigue analysis for consistency
  if (fatigue.acwrZone === 'high' || fatigue.acwrValue >= 1.2) {
    if (PERIODIZATION_DEBUG) {
      console.log('[Periodization] ACWR override → FORCED DELOAD', {
        acwrValue: fatigue.acwrValue.toFixed(2),
        acwrZone: fatigue.acwrZone,
      });
    }
    return 'deload';
  }

  // Override: Force deload if recovery is very low (but ACWR is not high)
  if (readiness.score < 40) {
    if (PERIODIZATION_DEBUG) {
      console.log('[Periodization] Low recovery override → FORCED DELOAD (recovery:', readiness.score, ')');
    }
    return 'deload';
  }

  // Override: If ACWR is 'under' (too fresh) and readiness is high, start accumulation
  if (fatigue.acwrZone === 'under' && readiness.category === 'high') {
    // Use week parity to alternate, but default to accumulation
    const weekStart = dayjs(weekStartISO);
    const weekNumber = weekStart.isoWeek();
    return weekNumber % 2 === 0 ? 'accumulation' : 'intensification';
  }

  // Default: Use ISO week number modulo 4 for repeating cycle
  // This creates a predictable 4-week pattern:
  // Week 1: accumulation (0 mod 4)
  // Week 2: accumulation (1 mod 4)
  // Week 3: intensification (2 mod 4)
  // Week 4: deload (3 mod 4)
  const weekStart = dayjs(weekStartISO);
  const weekNumber = weekStart.isoWeek();
  const cyclePosition = weekNumber % 4;

  switch (cyclePosition) {
    case 0:
    case 1:
      return 'accumulation';
    case 2:
      return 'intensification';
    case 3:
      return 'deload';
    default:
      // Fallback (shouldn't happen)
      return 'accumulation';
  }
}
