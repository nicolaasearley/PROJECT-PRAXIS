// @ts-nocheck
import { useUserStore, usePlanStore, useSessionStore } from '@/core/store';

describe('zustand stores', () => {
  afterEach(() => {
    useUserStore.setState((state) => ({
      ...state,
      userProfile: null,
      preferences: {
        goal: 'hybrid',
        experienceLevel: 'intermediate',
        trainingDaysPerWeek: 4,
        timeAvailability: 'standard',
        equipmentIds: [],
        adaptationMode: 'automatic',
        readinessScalingEnabled: true,
      },
      strengthNumbers: {},
      readinessHistory: [],
      personalRecords: [],
    }));
    usePlanStore.setState({ plan: [], currentPlanDay: null, selectedDate: null });
    useSessionStore.setState({ activeSession: null, isSessionActive: false, sessionHistory: [] });
  });

  it('updates preferences without a profile', () => {
    useUserStore.getState().updatePreferences({ goal: 'strength', trainingDaysPerWeek: 3 });
    const state = useUserStore.getState();
    expect(state.preferences.goal).toBe('strength');
    expect(state.preferences.trainingDaysPerWeek).toBe(3);
  });

  it('adds plan days and retrieves today plan', () => {
    const today = new Date().toISOString().slice(0, 10);
    usePlanStore.getState().setPlan([
      {
        id: 'plan-1',
        userId: 'user-1',
        date: today,
        dayIndex: 0,
        focusTags: ['strength'],
        blocks: [],
        estimatedDurationMinutes: 45,
        adjustedForReadiness: false,
        createdAt: today,
      },
    ]);

    expect(usePlanStore.getState().getTodayPlan()?.id).toBe('plan-1');
  });

  it('creates and finishes a session', () => {
    useSessionStore.getState().startSession('plan-1', 'user-1');
    useSessionStore.getState().logStrengthSet({
      blockId: 'block-1',
      exerciseId: 'squat',
      setIndex: 0,
      weight: 100,
      reps: 5,
    });
    const finished = useSessionStore.getState().finishSession();
    expect(finished?.completedSets.length).toBe(1);
    expect(useSessionStore.getState().sessionHistory.length).toBe(1);
  });
});
