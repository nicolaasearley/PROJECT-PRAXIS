// @ts-nocheck
import {
  calculateReadiness,
  generateInitialPlan,
  estimate1RM,
  adjustWorkoutForToday,
  detectNewPRs,
} from '@/core/engine';
import type { ReadinessInputs, UserProfile, WorkoutSessionLog } from '@/core/types';

describe('training engine', () => {
  it('calculates readiness with weighted inputs', () => {
    const inputs: ReadinessInputs = {
      date: '2024-01-01',
      sleepQuality: 5,
      energy: 4,
      soreness: 2,
      stress: 1,
      timeAvailability: 'standard',
    };

    const score = calculateReadiness(inputs);
    expect(score).toBeGreaterThan(70);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('builds an initial plan using preferences', () => {
    const profile: UserProfile = {
      id: 'user-1',
      email: 'demo@example.com',
      name: 'Demo User',
      units: 'metric',
      preferences: {
        goal: 'hybrid',
        experienceLevel: 'beginner',
        trainingDaysPerWeek: 3,
        timeAvailability: 'standard',
        equipmentIds: ['barbell'],
        adaptationMode: 'automatic',
        readinessScalingEnabled: true,
      },
      strengthNumbers: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const plan = generateInitialPlan(profile, '2024-01-01');
    expect(plan).toHaveLength(3);
    expect(plan[0].blocks.length).toBeGreaterThan(0);
  });

  it('adjusts workouts for readiness', () => {
    const profile: UserProfile = {
      id: 'user-2',
      email: 'demo@example.com',
      name: 'Demo User',
      units: 'metric',
      preferences: {
        goal: 'strength',
        experienceLevel: 'intermediate',
        trainingDaysPerWeek: 1,
        timeAvailability: 'standard',
        equipmentIds: ['barbell'],
        adaptationMode: 'automatic',
        readinessScalingEnabled: true,
      },
      strengthNumbers: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const [plannedWorkout] = generateInitialPlan(profile, '2024-01-01');
    const adjusted = adjustWorkoutForToday(plannedWorkout, 30, 'conservative');
    expect(adjusted.adjustedForReadiness).toBe(true);
    expect(adjusted.estimatedDurationMinutes).toBeLessThan(
      plannedWorkout.estimatedDurationMinutes
    );
  });

  it('detects new PRs based on session logs', () => {
    const session: WorkoutSessionLog = {
      id: 'session-1',
      userId: 'user-1',
      date: '2024-01-01',
      startedAt: '2024-01-01T00:00:00Z',
      endedAt: '2024-01-01T01:00:00Z',
      completedSets: [
        { blockId: 'block-1', exerciseId: 'squat', setIndex: 0, weight: 100, reps: 5, completedAt: '2024-01-01T00:00:10Z' },
      ],
      conditioningRounds: [],
      createdAt: '2024-01-01T00:00:00Z',
    };

    const prs = detectNewPRs(session, []);
    expect(prs.length).toBe(1);
    expect(prs[0].estimated1RM).toBeGreaterThan(0);
  });

  it('estimates 1RM safely', () => {
    expect(estimate1RM(100, 5)).toBeGreaterThan(100);
    expect(estimate1RM(0, 5)).toBe(0);
  });
});
