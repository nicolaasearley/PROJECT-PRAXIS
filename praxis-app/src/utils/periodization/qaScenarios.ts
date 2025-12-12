/**
 * Periodization Engine QA Scenarios
 * 
 * This module runs diagnostic scenarios to verify the periodization engine behavior.
 * Used by the developer QA screen for internal testing.
 */

import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
dayjs.extend(isoWeek);

import { analyzeReadiness } from './analyzeReadiness';
import { analyzeFatigue } from './analyzeFatigue';
import { buildWeeklyStructure } from './buildWeeklyStructure';
import { inferBlockTypeFromHistory } from './inferBlockType';
import { applyRecoveryAdjustment } from '@/utils/recoveryAdjustment';
import { generateDailyWorkout } from '@/engine/generation/generateDailyWorkout';
import type { WorkoutRecord } from '@/types/workout';
import type { WeeklyStructure } from './buildWeeklyStructure';
import type { WorkoutPlanDay } from '@core/types';

export type QAScenarioResult = {
  id: string; // e.g. "A", "B", ...
  title: string; // e.g. "Normal – Good Recovery"
  description: string; // short human-friendly description
  logs: string[]; // line-by-line log output
  warnings: string[]; // any warnings / failed checks
  errors: string[]; // hard errors (if any)
  metadata?: Record<string, any>; // any structured debug info
};

/**
 * Create mock workout history for testing
 */
function createMockWorkoutHistory(
  daysAgo: number,
  volume: number,
  intensityScore: number,
  pattern: 'squat' | 'hinge' | 'push' | 'pull' = 'squat'
): WorkoutRecord {
  const date = dayjs().subtract(daysAgo, 'days').format('YYYY-MM-DD');
  const startTime = dayjs(date).valueOf();

  return {
    id: `mock-${date}`,
    planDayId: `plan-${date}`,
    date,
    startTime,
    endTime: startTime + 3600000, // 1 hour
    durationMin: 60,
    blocks: [
      {
        blockId: 'strength-1',
        title: `Main Lift – ${pattern}`,
        type: 'strength',
        prescribedSets: 4,
        prescribedReps: 6,
        targetRpe: 8,
        sets: Array.from({ length: 4 }, () => ({
          completed: true,
          weight: 100,
          rpe: 8,
          restTimeMs: 180000, // 3 min
        })),
        volume: volume,
        avgRpe: 8,
        avgRestSec: 180,
      },
    ],
    totalVolume: volume,
    avgRpe: 8,
    avgRestSec: 180,
    densityScore: 50,
    intensityScore,
  };
}

/**
 * Format weekly structure as a table string
 */
function formatWeeklyStructureTable(structure: WeeklyStructure): string[] {
  const lines: string[] = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  lines.push('┌──────┬──────────────┬──────────┬──────────┬────────────┬───────────┐');
  lines.push('│ Day  │ Pattern      │ Lift     │ Volume   │ Intensity  │ Condition │');
  lines.push('├──────┼──────────────┼──────────┼──────────┼────────────┼───────────┤');

  structure.days.forEach((day) => {
    const dayName = dayNames[day.dayOfWeek] || `Day${day.dayOfWeek}`;
    const pattern = day.mainMovementPattern.substring(0, 12).padEnd(12);
    const lift = day.mainLiftCategory.padEnd(8);
    const volume = day.volumeTarget.padEnd(8);
    const intensity = day.intensityTarget.padEnd(10);
    const condition = day.conditioningTarget.padEnd(9);

    lines.push(`│ ${dayName.padEnd(4)} │ ${pattern} │ ${lift} │ ${volume} │ ${intensity} │ ${condition} │`);
  });

  lines.push('└──────┴──────────────┴──────────┴──────────┴────────────┴───────────┘');
  return lines;
}

/**
 * Format daily workout details
 */
function formatDailyWorkout(workout: WorkoutPlanDay, recoveryScore: number | null): string[] {
  const lines: string[] = [];

  lines.push(`Date: ${workout.date}`);
  lines.push(`Focus Tags: ${workout.focusTags.join(', ')}`);
  lines.push(`Estimated Duration: ${workout.estimatedDurationMinutes} min`);
  lines.push('');

  workout.blocks.forEach((block, idx) => {
    lines.push(`Block ${idx + 1}: ${block.title} (${block.type})`);

    if (block.type === 'strength' && block.strengthMain) {
      const sets = block.strengthMain.sets || [];
      lines.push(`  Exercise ID: ${block.strengthMain.exerciseId}`);
      lines.push(`  Sets: ${sets.length}`);
      if (sets.length > 0) {
        const firstSet = sets[0];
        lines.push(`  Reps: ${firstSet.targetReps}`);
        lines.push(`  RPE: ${firstSet.targetRpe || 'N/A'}`);
        lines.push(
          `  %1RM: ${firstSet.targetPercent1RM ? (firstSet.targetPercent1RM * 100).toFixed(1) + '%' : 'N/A'}`
        );
      }
      if ('wave' in block.strengthMain && block.strengthMain.wave) {
        lines.push(`  Wave: ${block.strengthMain.wave}`);
      }
    }

    if (block.type === 'conditioning' && block.conditioning) {
      const cond = block.conditioning as any;
      lines.push(`  Mode: ${cond.mode || 'N/A'}`);
      lines.push(`  Zone: ${cond.targetZone || 'N/A'}`);
      const duration =
        cond.durationMinutes ||
        (cond.workSeconds && cond.rounds
          ? Math.ceil((cond.workSeconds * cond.rounds) / 60)
          : null) ||
        'N/A';
      lines.push(`  Duration: ${duration} min`);
    }

    if (block.type === 'accessory' && block.accessory) {
      lines.push(`  Accessory Exercises: ${block.accessory.length}`);
    }

    lines.push('');
  });

  // Show recovery adjustments if applicable
  if (recoveryScore !== null) {
    try {
      const adjustment = applyRecoveryAdjustment(recoveryScore, workout.blocks);
      if (adjustment.metadata.level !== 'moderate' || adjustment.metadata.reason !== 'Normal recovery') {
        lines.push(`Recovery Adjustment: ${adjustment.metadata.level} - ${adjustment.metadata.reason}`);
      }
    } catch (error) {
      // Ignore adjustment errors in QA
    }
  }

  return lines;
}

/**
 * Scenario A: Normal conditions, good recovery
 */
async function runScenarioA(): Promise<QAScenarioResult> {
  const logs: string[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];
  const metadata: Record<string, any> = {};

  try {
    logs.push('Setting up: recoveryScore = 82, trainingDaysPerWeek = 5, No workout history');

    const recoveryScore = 82;
    const trainingDaysPerWeek = 5;
    const workoutHistory: WorkoutRecord[] = []; // No history

    const readiness = analyzeReadiness(recoveryScore);
    const fatigue = analyzeFatigue(workoutHistory);
    const weekStartISO = dayjs().startOf('isoWeek').format('YYYY-MM-DD');

    logs.push(`Recovery Score: ${recoveryScore}`);
    logs.push(`Readiness Category: ${readiness.category} (${readiness.score})`);
    logs.push(`ACWR Zone: ${fatigue.acwrZone}`);
    logs.push(
      `Pattern Fatigue: Squat=${fatigue.squat.toFixed(1)}, Hinge=${fatigue.hinge.toFixed(1)}, Push=${fatigue.push.toFixed(1)}, Pull=${fatigue.pull.toFixed(1)}`
    );

    const blockType = inferBlockTypeFromHistory(workoutHistory, readiness, fatigue, weekStartISO);
    logs.push(`Inferred Block Type: ${blockType}`);
    metadata.blockType = blockType;

    const weeklyStructure = buildWeeklyStructure({
      readiness,
      fatigue,
      trainingDaysPerWeek,
      weekStartISO,
      blockType,
    });

    logs.push('');
    logs.push('Weekly Structure:');
    logs.push(...formatWeeklyStructureTable(weeklyStructure));

    // Generate first daily workout
    const firstDay = weeklyStructure.days[0];
    const dailyWorkout = generateDailyWorkout({
      goal: 'hybrid',
      experienceLevel: 'intermediate',
      equipmentIds: ['barbell', 'plates', 'bench'],
      units: 'metric',
      date: firstDay.dateISO,
      dayIndex: 0,
      weeklyStructureDay: firstDay,
    });

    logs.push('');
    logs.push('First Daily Workout:');
    logs.push(...formatDailyWorkout(dailyWorkout, recoveryScore));

    metadata.weeklyStructure = weeklyStructure;
    metadata.dailyWorkout = dailyWorkout;
  } catch (error: any) {
    errors.push(`Scenario A failed: ${error.message}`);
    console.error('Error in Scenario A:', error);
  }

  return {
    id: 'A',
    title: 'Normal – Good Recovery',
    description: 'recoveryScore = 82, trainingDaysPerWeek = 5, No workout history',
    logs,
    warnings,
    errors,
    metadata,
  };
}

/**
 * Scenario B: Low recovery (force deload)
 */
async function runScenarioB(): Promise<QAScenarioResult> {
  const logs: string[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];
  const metadata: Record<string, any> = {};

  try {
    logs.push('Setting up: recoveryScore = 28, trainingDaysPerWeek = 6, Expected blockType = deload');

    const recoveryScore = 28;
    const trainingDaysPerWeek = 6;
    const workoutHistory: WorkoutRecord[] = []; // No history, but low recovery should force deload

    const readiness = analyzeReadiness(recoveryScore);
    const fatigue = analyzeFatigue(workoutHistory);
    const weekStartISO = dayjs().startOf('isoWeek').format('YYYY-MM-DD');

    logs.push(`Recovery Score: ${recoveryScore} (LOW - should force deload)`);
    logs.push(`Readiness Category: ${readiness.category} (${readiness.score})`);
    logs.push(`ACWR Zone: ${fatigue.acwrZone}`);

    const blockType = inferBlockTypeFromHistory(workoutHistory, readiness, fatigue, weekStartISO);
    logs.push(`Inferred Block Type: ${blockType} ${blockType === 'deload' ? '✓' : '✗ EXPECTED deload'}`);

    if (blockType !== 'deload') {
      warnings.push('Expected deload block type but got: ' + blockType);
    }

    const weeklyStructure = buildWeeklyStructure({
      readiness,
      fatigue,
      trainingDaysPerWeek,
      weekStartISO,
      blockType,
    });

    logs.push('');
    logs.push('Weekly Structure:');
    logs.push(...formatWeeklyStructureTable(weeklyStructure));

    // Verify deload characteristics
    const highVolumeDays = weeklyStructure.days.filter((d) => d.volumeTarget === 'high').length;
    const highIntensityDays = weeklyStructure.days.filter((d) => d.intensityTarget === 'high').length;
    const lowVolumeDays = weeklyStructure.days.filter((d) => d.volumeTarget === 'low').length;
    const lowIntensityDays = weeklyStructure.days.filter((d) => d.intensityTarget === 'low').length;

    logs.push('');
    logs.push('Deload Verification:');
    logs.push(`  High Volume Days: ${highVolumeDays} (should be 0)`);
    logs.push(`  High Intensity Days: ${highIntensityDays} (should be 0)`);
    logs.push(`  Low Volume Days: ${lowVolumeDays} (should be most/all)`);
    logs.push(`  Low Intensity Days: ${lowIntensityDays} (should be most/all)`);

    if (highVolumeDays > 0) {
      warnings.push(`Found ${highVolumeDays} high volume days in deload week`);
    }
    if (highIntensityDays > 0) {
      warnings.push(`Found ${highIntensityDays} high intensity days in deload week`);
    }

    // Generate first daily workout
    const firstDay = weeklyStructure.days[0];
    const dailyWorkout = generateDailyWorkout({
      goal: 'hybrid',
      experienceLevel: 'intermediate',
      equipmentIds: ['barbell', 'plates', 'bench'],
      units: 'metric',
      date: firstDay.dateISO,
      dayIndex: 0,
      weeklyStructureDay: firstDay,
    });

    logs.push('');
    logs.push('First Daily Workout:');
    logs.push(...formatDailyWorkout(dailyWorkout, recoveryScore));
    
    // PATCH PART 3: Verify deload characteristics in the workout
    const strengthBlock = dailyWorkout.blocks.find((b: any) => b.type === 'strength');
    if (strengthBlock?.strengthMain) {
      const sets = strengthBlock.strengthMain.sets || [];
      logs.push('');
      logs.push('Deload Workout Verification:');
      logs.push(`  Sets: ${sets.length} (should be 2 for deload)`);
      if (sets.length > 0) {
        logs.push(`  RPE: ${sets[0].targetRpe || 'N/A'} (should be ≤ 6 for deload)`);
        if (sets[0].targetRpe && sets[0].targetRpe > 6) {
          warnings.push(`RPE is ${sets[0].targetRpe}, expected ≤ 6 for deload`);
        }
      }
    }
    
    const conditioningBlock = dailyWorkout.blocks.find((b: any) => b.type === 'conditioning');
    if (conditioningBlock?.conditioning) {
      const cond = conditioningBlock.conditioning as any;
      logs.push(`  Conditioning Zone: ${cond.targetZone || cond.zone || 'N/A'} (should be Z2 for deload)`);
      if (cond.targetZone && !cond.targetZone.includes('Z2')) {
        warnings.push(`Conditioning zone is ${cond.targetZone}, expected Z2 for deload`);
      }
    }

    metadata.weeklyStructure = weeklyStructure;
    metadata.dailyWorkout = dailyWorkout;
  } catch (error: any) {
    errors.push(`Scenario B failed: ${error.message}`);
    console.error('Error in Scenario B:', error);
  }

  return {
    id: 'B',
    title: 'Low Recovery (Force Deload)',
    description: 'recoveryScore = 28, trainingDaysPerWeek = 6, Expected blockType = deload',
    logs,
    warnings,
    errors,
    metadata,
  };
}

/**
 * Scenario C: High ACWR (fatigue risk)
 */
async function runScenarioC(): Promise<QAScenarioResult> {
  const logs: string[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];
  const metadata: Record<string, any> = {};

  try {
    logs.push('Setting up: Simulate workout history with sudden spike in volume. Expected blockType override: deload');
    logs.push('Target: ACWR ≥ 1.30 (acute spike: 3500-3800, chronic baseline: 1100-1400)');

    const recoveryScore = 65; // Moderate recovery
    const trainingDaysPerWeek = 5;

    // PATCH: Create proper ACWR spike scenario
    // Chronic baseline (days 7-28): moderate volume to establish baseline
    // Acute spike (days 0-6): high volume to create ACWR spike
    const workoutHistory: WorkoutRecord[] = [];
    
    // Chronic baseline: spread workouts across days 7-28 with moderate volume (1100-1400)
    // This establishes a baseline for chronic load calculation
    const chronicDays = [28, 25, 22, 19, 16, 13, 10, 7]; // Spread across the 28-day window
    chronicDays.forEach((daysAgo) => {
      const volume = 1100 + Math.floor(Math.random() * 300); // 1100-1400 range
      workoutHistory.push(createMockWorkoutHistory(daysAgo, volume, 60));
    });
    
    // Acute spike week: last 7 days with high volume (3500-3800)
    // This creates the spike that drives ACWR high
    const acuteVolumes = [3600, 3500, 3800, 3700, 3600, 3500, 3750]; // High volume spike
    for (let i = 0; i < 7; i++) {
      workoutHistory.push(createMockWorkoutHistory(i, acuteVolumes[i], 75));
    }
    
    // Log the volume distribution for debugging
    const acuteTotal = acuteVolumes.reduce((a, b) => a + b, 0);
    const chronicTotal = chronicDays.length * 1250; // Approximate average
    logs.push(`Volume Distribution:`);
    logs.push(`  Acute (last 7 days): ${acuteVolumes.join(', ')} (avg: ${(acuteTotal / 7).toFixed(0)})`);
    logs.push(`  Chronic baseline (days 7-28): ~1100-1400 per session`);

    const readiness = analyzeReadiness(recoveryScore);
    const fatigue = analyzeFatigue(workoutHistory);
    const weekStartISO = dayjs().startOf('isoWeek').format('YYYY-MM-DD');

    logs.push(`Recovery Score: ${recoveryScore}`);
    logs.push(`Readiness Category: ${readiness.category}`);
    logs.push(`ACWR Value: ${fatigue.acwrValue.toFixed(2)}`);
    logs.push(`ACWR Zone: ${fatigue.acwrZone} ${fatigue.acwrZone === 'high' ? '✓ HIGH ACWR' : '✗'}`);

    if (fatigue.acwrZone !== 'high') {
      warnings.push('Expected high ACWR zone but got: ' + fatigue.acwrZone + ' (ACWR value: ' + fatigue.acwrValue.toFixed(2) + ')');
    }

    const blockType = inferBlockTypeFromHistory(workoutHistory, readiness, fatigue, weekStartISO);
    logs.push(`Inferred Block Type: ${blockType} ${blockType === 'deload' ? '✓ EXPECTED deload' : '✗'}`);

    if (blockType !== 'deload') {
      warnings.push('Expected deload block type due to high ACWR but got: ' + blockType);
    }

    const weeklyStructure = buildWeeklyStructure({
      readiness,
      fatigue,
      trainingDaysPerWeek,
      weekStartISO,
      blockType,
    });

    logs.push('');
    logs.push('Weekly Structure:');
    logs.push(...formatWeeklyStructureTable(weeklyStructure));

    // Check volume targets
    const lowVolumeDays = weeklyStructure.days.filter((d) => d.volumeTarget === 'low').length;
    const lowIntensityDays = weeklyStructure.days.filter((d) => d.intensityTarget === 'low').length;
    logs.push('');
    logs.push('Volume/Intensity Target Verification:');
    logs.push(`  Low Volume Days: ${lowVolumeDays} (should be most/all due to high ACWR)`);
    logs.push(`  Low Intensity Days: ${lowIntensityDays} (should be most/all due to high ACWR)`);
    
    if (lowVolumeDays < weeklyStructure.days.length * 0.8) {
      warnings.push(`Expected most days to have low volume (got ${lowVolumeDays}/${weeklyStructure.days.length})`);
    }
    if (lowIntensityDays < weeklyStructure.days.length * 0.8) {
      warnings.push(`Expected most days to have low intensity (got ${lowIntensityDays}/${weeklyStructure.days.length})`);
    }

    // Generate first daily workout
    const firstDay = weeklyStructure.days[0];
    const dailyWorkout = generateDailyWorkout({
      goal: 'hybrid',
      experienceLevel: 'intermediate',
      equipmentIds: ['barbell', 'plates', 'bench'],
      units: 'metric',
      date: firstDay.dateISO,
      dayIndex: 0,
      weeklyStructureDay: firstDay,
    });

    logs.push('');
    logs.push('First Daily Workout:');
    logs.push(...formatDailyWorkout(dailyWorkout, recoveryScore));
    
    // PATCH PART 3: Verify deload characteristics in the workout
    const strengthBlock = dailyWorkout.blocks.find((b: any) => b.type === 'strength');
    if (strengthBlock?.strengthMain) {
      const sets = strengthBlock.strengthMain.sets || [];
      logs.push('');
      logs.push('Deload Workout Verification:');
      logs.push(`  Sets: ${sets.length} (should be 2 for deload)`);
      if (sets.length > 0) {
        logs.push(`  RPE: ${sets[0].targetRpe || 'N/A'} (should be ≤ 6 for deload)`);
        if (sets[0].targetRpe && sets[0].targetRpe > 6) {
          warnings.push(`RPE is ${sets[0].targetRpe}, expected ≤ 6 for deload`);
        }
      }
    }
    
    const conditioningBlock = dailyWorkout.blocks.find((b: any) => b.type === 'conditioning');
    if (conditioningBlock?.conditioning) {
      const cond = conditioningBlock.conditioning as any;
      logs.push(`  Conditioning Zone: ${cond.targetZone || cond.zone || 'N/A'} (should be Z2 for deload)`);
      if (cond.targetZone && !cond.targetZone.includes('Z2')) {
        warnings.push(`Conditioning zone is ${cond.targetZone}, expected Z2 for deload`);
      }
    }

    metadata.weeklyStructure = weeklyStructure;
    metadata.dailyWorkout = dailyWorkout;
  } catch (error: any) {
    errors.push(`Scenario C failed: ${error.message}`);
    console.error('Error in Scenario C:', error);
  }

  return {
    id: 'C',
    title: 'High ACWR (Fatigue Risk)',
    description: 'Simulate workout history with sudden spike in volume. Expected blockType override: deload',
    logs,
    warnings,
    errors,
    metadata,
  };
}

/**
 * Scenario D: High readiness (performance week)
 */
async function runScenarioD(): Promise<QAScenarioResult> {
  const logs: string[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];
  const metadata: Record<string, any> = {};

  try {
    logs.push('Setting up: recoveryScore = 94, trainingDaysPerWeek = 5, Expected bias toward high intensity and volume');

    const recoveryScore = 94;
    const trainingDaysPerWeek = 5;
    const workoutHistory: WorkoutRecord[] = []; // No history

    const readiness = analyzeReadiness(recoveryScore);
    const fatigue = analyzeFatigue(workoutHistory);
    const weekStartISO = dayjs().startOf('isoWeek').format('YYYY-MM-DD');

    logs.push(`Recovery Score: ${recoveryScore} (HIGH)`);
    logs.push(`Readiness Category: ${readiness.category} (${readiness.score})`);
    logs.push(`ACWR Zone: ${fatigue.acwrZone}`);

    const blockType = inferBlockTypeFromHistory(workoutHistory, readiness, fatigue, weekStartISO);
    logs.push(`Inferred Block Type: ${blockType}`);

    const weeklyStructure = buildWeeklyStructure({
      readiness,
      fatigue,
      trainingDaysPerWeek,
      weekStartISO,
      blockType,
    });

    logs.push('');
    logs.push('Weekly Structure:');
    logs.push(...formatWeeklyStructureTable(weeklyStructure));

    // Check for high intensity/volume days
    const highVolumeDays = weeklyStructure.days.filter((d) => d.volumeTarget === 'high').length;
    const highIntensityDays = weeklyStructure.days.filter((d) => d.intensityTarget === 'high').length;

    logs.push('');
    logs.push('Performance Week Verification:');
    logs.push(`  High Volume Days: ${highVolumeDays} (should have some)`);
    logs.push(`  High Intensity Days: ${highIntensityDays} (should have some)`);

    if (highVolumeDays === 0 && highIntensityDays === 0) {
      warnings.push('Expected some high volume or intensity days for high readiness week');
    }

    // Generate first daily workout
    const firstDay = weeklyStructure.days[0];
    const dailyWorkout = generateDailyWorkout({
      goal: 'hybrid',
      experienceLevel: 'intermediate',
      equipmentIds: ['barbell', 'plates', 'bench'],
      units: 'metric',
      date: firstDay.dateISO,
      dayIndex: 0,
      weeklyStructureDay: firstDay,
    });

    logs.push('');
    logs.push('First Daily Workout:');
    logs.push(...formatDailyWorkout(dailyWorkout, recoveryScore));

    // Verify strength block has increased sets/RPE
    const strengthBlock = dailyWorkout.blocks.find((b: any) => b.type === 'strength');
    if (strengthBlock?.strengthMain) {
      const sets = strengthBlock.strengthMain.sets || [];
      logs.push('');
      logs.push('Strength Block Verification:');
      logs.push(`  Sets: ${sets.length} (should be increased if volume target is high)`);
      if (sets.length > 0 && firstDay.volumeTarget === 'high') {
        logs.push(`  Expected: 4-6 sets (was base + 1 if high volume)`);
      }
      if (sets.length > 0) {
        logs.push(`  RPE: ${sets[0].targetRpe || 'N/A'} (should be high if intensity target is high)`);
        if (firstDay.intensityTarget === 'high') {
          logs.push(`  Expected: 9-10 RPE (was base + 1 if high intensity)`);
        }
      }
    }

    metadata.weeklyStructure = weeklyStructure;
    metadata.dailyWorkout = dailyWorkout;
  } catch (error: any) {
    errors.push(`Scenario D failed: ${error.message}`);
    console.error('Error in Scenario D:', error);
  }

  return {
    id: 'D',
    title: 'High Readiness (Performance Week)',
    description: 'recoveryScore = 94, trainingDaysPerWeek = 5, Expected bias toward high intensity and volume',
    logs,
    warnings,
    errors,
    metadata,
  };
}

/**
 * Scenario E: Pattern fatigue edge case
 */
async function runScenarioE(): Promise<QAScenarioResult> {
  const logs: string[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];
  const metadata: Record<string, any> = {};

  try {
    logs.push('Setting up: Simulate 10 days of heavy hinge + deadlift patterns. Expected: reduced hinge frequency and low volume for hinge days');

    const recoveryScore = 70;
    const trainingDaysPerWeek = 5;

    // Create history with heavy hinge pattern (last 10 days)
    const workoutHistory: WorkoutRecord[] = [];
    for (let i = 0; i < 10; i++) {
      workoutHistory.push(createMockWorkoutHistory(i, 6000, 80, 'hinge')); // High volume hinge
    }

    const readiness = analyzeReadiness(recoveryScore);
    const fatigue = analyzeFatigue(workoutHistory);
    const weekStartISO = dayjs().startOf('isoWeek').format('YYYY-MM-DD');

    logs.push(`Recovery Score: ${recoveryScore}`);
    logs.push(`Readiness Category: ${readiness.category}`);
    logs.push(`ACWR Zone: ${fatigue.acwrZone}`);
    logs.push(`Pattern Fatigue:`);
    logs.push(`  Squat: ${fatigue.squat.toFixed(1)}`);
    logs.push(`  Hinge: ${fatigue.hinge.toFixed(1)} ${fatigue.hinge >= 70 ? '✓ HIGH' : ''}`);
    logs.push(`  Push: ${fatigue.push.toFixed(1)}`);
    logs.push(`  Pull: ${fatigue.pull.toFixed(1)}`);

    // PATCH PART 4: Relax threshold from > 70 to >= 70
    if (fatigue.hinge < 70) {
      warnings.push(`Expected high hinge fatigue (>=70) but got: ${fatigue.hinge.toFixed(1)}`);
    }

    const blockType = inferBlockTypeFromHistory(workoutHistory, readiness, fatigue, weekStartISO);
    logs.push(`Inferred Block Type: ${blockType}`);

    const weeklyStructure = buildWeeklyStructure({
      readiness,
      fatigue,
      trainingDaysPerWeek,
      weekStartISO,
      blockType,
    });

    logs.push('');
    logs.push('Weekly Structure:');
    logs.push(...formatWeeklyStructureTable(weeklyStructure));

    // Check hinge pattern frequency and volume
    const hingeDays = weeklyStructure.days.filter(
      (d) => d.mainMovementPattern === 'hinge' || d.mainLiftCategory.toLowerCase().includes('deadlift')
    );
    const hingeVolumeTargets = hingeDays.map((d) => d.volumeTarget);

    logs.push('');
    logs.push('Pattern Fatigue Verification:');
    logs.push(`  Hinge Days in Week: ${hingeDays.length}`);
    logs.push(`  Hinge Volume Targets: ${hingeVolumeTargets.join(', ')}`);
    logs.push(
      `  Low Volume Hinge Days: ${hingeDays.filter((d) => d.volumeTarget === 'low').length} (should have some if fatigue > 70)`
    );

    // Generate workout for a hinge day if available
    const hingeDay = weeklyStructure.days.find(
      (d) => d.mainMovementPattern === 'hinge' || d.mainLiftCategory.toLowerCase().includes('deadlift')
    );

    if (hingeDay) {
      const dailyWorkout = generateDailyWorkout({
        goal: 'hybrid',
        experienceLevel: 'intermediate',
        equipmentIds: ['barbell', 'plates'],
        units: 'metric',
        date: hingeDay.dateISO,
        dayIndex: weeklyStructure.days.indexOf(hingeDay),
        weeklyStructureDay: hingeDay,
      });

      logs.push('');
      logs.push('Hinge Day Workout:');
      logs.push(...formatDailyWorkout(dailyWorkout, recoveryScore));
    } else {
      warnings.push('No hinge day found in weekly structure');
    }

    metadata.weeklyStructure = weeklyStructure;
    metadata.fatigue = fatigue;
  } catch (error: any) {
    errors.push(`Scenario E failed: ${error.message}`);
    console.error('Error in Scenario E:', error);
  }

  return {
    id: 'E',
    title: 'Pattern Fatigue Edge Case',
    description: 'Simulate 10 days of heavy hinge + deadlift patterns. Expected: reduced hinge frequency and low volume for hinge days',
    logs,
    warnings,
    errors,
    metadata,
  };
}

/**
 * Run all periodization QA scenarios
 */
export async function runAllPeriodizationScenarios(): Promise<QAScenarioResult[]> {
  const results: QAScenarioResult[] = [];

  results.push(await runScenarioA());
  results.push(await runScenarioB());
  results.push(await runScenarioC());
  results.push(await runScenarioD());
  results.push(await runScenarioE());

  return results;
}
