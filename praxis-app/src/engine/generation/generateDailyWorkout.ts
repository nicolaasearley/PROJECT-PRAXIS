import type {
  WorkoutPlanDay,
  WorkoutBlock,
  TrainingGoal,
  ExperienceLevel,
  StrengthNumbers,
  ExerciseDefinition,
  MuscleGroup,
} from '../../core/types';
import { generateStrengthPrescription } from '../strength/generateStrengthPrescription';
import { generateConditioningPrescription } from '../conditioning/generateConditioningPrescription';
import dayjs from 'dayjs';

interface GenerateDailyWorkoutParams {
  goal: TrainingGoal;
  experienceLevel: ExperienceLevel;
  equipmentIds: string[];
  units: 'metric' | 'imperial';
  strengthNumbers?: StrengthNumbers;
  userId?: string;
}

/**
 * Generate a unique ID for workout blocks and plan days
 */
function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create warm-up block
 */
function createWarmupBlock(): WorkoutBlock {
  return {
    id: generateId('warmup'),
    type: 'warmup',
    title: 'Warm-Up',
    warmupItems: [
      '3 min easy cardio',
      'Dynamic mobility',
      "Prep for today's main movement",
    ],
    estimatedDurationMinutes: 5,
  };
}

/**
 * Create a basic strength exercise definition
 * TODO: Replace with actual exercise database lookup
 */
function createStrengthExercise(
  name: string,
  muscleGroup: MuscleGroup
): ExerciseDefinition {
  return {
    id: name.toLowerCase().replace(/\s+/g, '-'),
    name,
    movementPattern: muscleGroup === 'quads' ? 'squat' : 'hinge',
    primaryMuscles: [muscleGroup],
    equipment: ['barbell'],
    isConditioning: false,
  };
}

/**
 * Create strength block based on goal
 */
function createStrengthBlock(
  goal: TrainingGoal,
  strengthNumbers?: StrengthNumbers,
  units: 'metric' | 'imperial' = 'imperial'
): WorkoutBlock | null {
  // Only create strength block for specific goals
  if (goal !== 'strength' && goal !== 'hybrid' && goal !== 'general') {
    return null;
  }

  // TODO: Request user to enter strength numbers if missing
  if (!strengthNumbers) {
    return null;
  }

  // Create a basic strength exercise (placeholder - should be selected based on periodization)
  const exercise = createStrengthExercise('Barbell Back Squat', 'quads');

  // Create strength block structure
  const strengthBlockBase = {
    id: generateId('strength-main'),
    type: 'strength' as const,
    title: 'Main Lift',
    strengthMain: {
      exerciseId: exercise.id,
      sets: [
        {
          targetReps: 5,
          targetPercent1RM: 0.75,
        },
      ],
    },
    estimatedDurationMinutes: 30,
  };

  // Apply strength prescription if we have the required data
  // Note: We need to adapt the block structure to match the prescription engine's expected input
  // For now, we'll create a simplified version that works with WorkoutBlock
  // TODO: Integrate proper strength prescription when block structures are aligned

  return strengthBlockBase;
}

/**
 * Create accessory block
 */
function createAccessoryBlock(): WorkoutBlock {
  return {
    id: generateId('accessory'),
    type: 'accessory',
    title: 'Accessory Work',
    accessory: [
      {
        exerciseId: 'db-rdl',
        sets: [
          {
            targetReps: 10,
          },
        ],
      },
      {
        exerciseId: 'split-squat',
        sets: [
          {
            targetReps: 8,
          },
        ],
      },
    ],
    estimatedDurationMinutes: 15,
    // TODO: Build ruleset for movement selection
  };
}

/**
 * Create conditioning block based on goal
 */
function createConditioningBlock(
  goal: TrainingGoal,
  experienceLevel: ExperienceLevel,
  equipmentIds: string[]
): WorkoutBlock {
  let targetZone = 3;
  let workSeconds = 60;
  let restSeconds = 60;
  let rounds = 8;
  let modality: 'row' | 'bike' | 'ski' | 'run' = 'row';

  // Determine modality based on available equipment
  if (equipmentIds.includes('rower')) {
    modality = 'row';
  } else if (equipmentIds.includes('bike')) {
    modality = 'bike';
  } else if (equipmentIds.includes('ski_erg')) {
    modality = 'ski';
  } else {
    modality = 'run'; // Default fallback
    // TODO: Change modality or adjust block if equipment missing
  }

  // Adjust conditioning based on goal
  if (goal === 'conditioning') {
    targetZone = 4; // Z3–Z4 longer intervals
    workSeconds = 120;
    restSeconds = 90;
    rounds = 6;
  } else if (goal === 'hybrid') {
    targetZone = 3; // Z3 short intervals
    workSeconds = 60;
    restSeconds = 60;
    rounds = 8;
  } else if (goal === 'general') {
    targetZone = 2; // Z2 steady work
    workSeconds = 600; // 10 minutes
    restSeconds = null;
    rounds = 1;
  }

  const conditioningBlock = {
    id: generateId('conditioning'),
    type: 'conditioning' as const,
    title: 'Conditioning',
    conditioning: {
      mode: targetZone <= 2 ? ('steady' as const) : ('interval' as const),
      workSeconds,
      restSeconds: restSeconds || undefined,
      rounds,
      targetZone: `Z${targetZone}`,
    },
    estimatedDurationMinutes:
      workSeconds * rounds + (restSeconds || 0) * (rounds - 1),
  };

  // Apply conditioning prescription
  // Note: We need to adapt to match the prescription engine's expected structure
  // For now, return the block - prescription can be applied separately if needed
  // TODO: Integrate conditioning prescription properly

  return conditioningBlock;
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
  params: GenerateDailyWorkoutParams
): WorkoutPlanDay {
  const {
    goal,
    experienceLevel,
    equipmentIds,
    units,
    strengthNumbers,
    userId = 'user-placeholder',
  } = params;

  const blocks: WorkoutBlock[] = [];

  // 1. Warm-up block (always included)
  blocks.push(createWarmupBlock());

  // 2. Strength block (conditional)
  const strengthBlock = createStrengthBlock(goal, strengthNumbers, units);
  if (strengthBlock) {
    blocks.push(strengthBlock);
  }

  // 3. Accessory block
  blocks.push(createAccessoryBlock());

  // 4. Conditioning block (always included)
  blocks.push(createConditioningBlock(goal, experienceLevel, equipmentIds));

  // 5. Cooldown block (always included)
  blocks.push(createCooldownBlock());

  // Calculate total duration
  const estimatedDurationMinutes = calculateTotalDuration(blocks);

  // Determine focus tags
  const focusTags = determineFocusTags(goal, !!strengthBlock);

  // Create workout plan day
  const workoutPlanDay: WorkoutPlanDay = {
    id: generateId('workout'),
    userId,
    date: dayjs().format('YYYY-MM-DD'),
    dayIndex: 0, // TODO: Calculate based on training cycle position
    focusTags,
    blocks,
    estimatedDurationMinutes,
    adjustedForReadiness: false,
    createdAt: new Date().toISOString(),
  };

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
