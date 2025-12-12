import { create } from 'zustand';
import { WorkoutBlock } from '@core/types';
import { applyRecoveryAdjustment, AdjustmentMetadata } from '@/utils/recoveryAdjustment';
import { getRecommendedWeight } from '@/utils/progression';

// Type alias for compatibility
type TrainingBlock = WorkoutBlock;

// Map to track active rest timer start times: key = `${blockId}-${setIndex}`
const activeRestTimers = new Map<string, number>();

interface WorkoutSessionState {
  session: {
    planDayId: string | null;
    startTime: number | null;
    endTime: number | null;
    currentBlockIndex: number;
    completedBlocks: string[];
    completedSets: {
      [blockId: string]: {
        sets: {
          completed: boolean;
          weight: number | null;
          rpe: number | null;
          restTimeMs: number | null;
          recommendedWeight?: number;
        }[];
      };
    };
    blocks: TrainingBlock[];
    originalBlocks: TrainingBlock[] | null;
    adjustmentMetadata: AdjustmentMetadata | null;
  };
  startSession: (planDayId: string, blocks: TrainingBlock[]) => void;
  completeBlock: (blockId: string) => void;
  completeSet: (blockId: string, setIndex: number) => void;
  undoSet: (blockId: string, setIndex: number) => void;
  setWeight: (blockId: string, setIndex: number, weight: number) => void;
  setRpe: (blockId: string, setIndex: number, rpe: number) => void;
  startRestTimer: (blockId: string, setIndex: number) => void;
  stopRestTimer: (blockId: string, setIndex: number) => void;
  getActiveRestTimers: () => Map<string, number>;
  nextBlock: () => void;
  finishSession: () => void;
  resetSession: () => void;
}

const defaultSession = {
  planDayId: null,
  startTime: null,
  endTime: null,
  currentBlockIndex: 0,
  completedBlocks: [],
  completedSets: {},
  blocks: [],
  originalBlocks: null,
  adjustmentMetadata: null,
};

export const useWorkoutSessionStore = create<WorkoutSessionState>((set, get) => ({
  session: defaultSession,

  startSession: (planDayId, blocks) => {
    // Store original blocks
    const originalBlocks = JSON.parse(JSON.stringify(blocks)) as TrainingBlock[];

    // Get recovery score and apply adjustments
    let adjustedBlocks = blocks;
    let adjustmentMetadata: AdjustmentMetadata | null = null;

    try {
      const { useRecoveryStore } = require('./recoveryStore');
      const recoveryScore = useRecoveryStore.getState().getRecovery();
      
      if (recoveryScore !== null) {
        const adjustment = applyRecoveryAdjustment(recoveryScore, blocks);
        adjustedBlocks = adjustment.adjustedBlocks;
        adjustmentMetadata = adjustment.metadata;
      }
    } catch (error) {
      // If recovery store is not available, use original blocks
      console.warn('Recovery store not available, using original blocks:', error);
    }

    // Initialize sets for each strength block (using adjusted blocks)
    const completedSets: WorkoutSessionState['session']['completedSets'] = {};

    // Get progression history and recovery score for weight recommendations
    let progressionHistory: Record<string, any[]> = {};
    let recoveryScore: number | null = null;

    try {
      const { useProgressionStore } = require('./progressionStore');
      const { useRecoveryStore } = require('./recoveryStore');
      
      const progressionState = useProgressionStore.getState();
      recoveryScore = useRecoveryStore.getState().getRecovery();

      // Get history for all exercises in this workout
      adjustedBlocks.forEach((block) => {
        if (block.type === 'strength' && block.strengthMain) {
          const exerciseId = block.strengthMain.exerciseId;
          progressionHistory[exerciseId] = progressionState.getHistoryForExercise(exerciseId);
        }
      });
    } catch (error) {
      console.warn('Progression or recovery store not available:', error);
    }

    adjustedBlocks.forEach((block) => {
      if (block.type === 'strength' && block.strengthMain) {
        const numSets = block.strengthMain.sets.length;
        const exerciseId = block.strengthMain.exerciseId;
        const history = progressionHistory[exerciseId] || [];

        // Get recommended weight for this exercise
        const firstSet = block.strengthMain.sets[0];
        const targetRpe = firstSet?.targetRpe || null;
        const recommendedWeight = getRecommendedWeight({
          exerciseId,
          targetRpe,
          recoveryScore,
          history,
        });

        completedSets[block.id] = {
          sets: Array.from({ length: numSets }, (_, index) => ({
            completed: false,
            weight: recommendedWeight !== null ? recommendedWeight : null, // Prefill with recommended weight
            rpe: null,
            restTimeMs: null,
            recommendedWeight, // Store recommendation for UI display
          })),
        };
      }
    });

    set({
      session: {
        planDayId,
        startTime: Date.now(),
        endTime: null,
        currentBlockIndex: 0,
        completedBlocks: [],
        completedSets,
        blocks: adjustedBlocks,
        originalBlocks,
        adjustmentMetadata,
      },
    });
  },

  completeBlock: (blockId) => {
    const state = get();
    const completedBlocks = [...state.session.completedBlocks, blockId];
    set({
      session: {
        ...state.session,
        completedBlocks,
      },
    });
  },

  completeSet: (blockId, setIndex) => {
    const state = get();
    const blockSets = state.session.completedSets[blockId];
    if (!blockSets || !blockSets.sets[setIndex]) return;

    // Toggle completed flag only
    const updatedSets = [...blockSets.sets];
    updatedSets[setIndex] = {
      ...updatedSets[setIndex],
      completed: !updatedSets[setIndex].completed,
    };

    set({
      session: {
        ...state.session,
        completedSets: {
          ...state.session.completedSets,
          [blockId]: {
            sets: updatedSets,
          },
        },
      },
    });
  },

  undoSet: (blockId, setIndex) => {
    const state = get();
    const blockSets = state.session.completedSets[blockId];
    if (!blockSets || !blockSets.sets[setIndex]) return;

    // Toggle completed flag only
    const updatedSets = [...blockSets.sets];
    updatedSets[setIndex] = {
      ...updatedSets[setIndex],
      completed: false,
    };

    set({
      session: {
        ...state.session,
        completedSets: {
          ...state.session.completedSets,
          [blockId]: {
            sets: updatedSets,
          },
        },
      },
    });
  },

  setWeight: (blockId, setIndex, weight) => {
    const state = get();
    const blockSets = state.session.completedSets[blockId];
    
    // Normalize weight: 0 becomes null for empty state
    const normalizedWeight = weight === 0 ? null : weight;
    
    if (!blockSets || !blockSets.sets[setIndex]) {
      // Initialize if needed (for backward compatibility)
      const existingSets = blockSets?.sets || [];
      if (!existingSets[setIndex]) {
        existingSets[setIndex] = {
          completed: false,
          weight: null,
          rpe: null,
          restTimeMs: null,
          recommendedWeight: undefined,
        };
      }
      existingSets[setIndex] = {
        ...existingSets[setIndex],
        weight: normalizedWeight,
      };
      set({
        session: {
          ...state.session,
          completedSets: {
            ...state.session.completedSets,
            [blockId]: {
              sets: existingSets,
            },
          },
        },
      });
      return;
    }

    const updatedSets = [...blockSets.sets];
    updatedSets[setIndex] = {
      ...updatedSets[setIndex],
      weight: normalizedWeight,
      // If weight is cleared, also clear completion
      completed: normalizedWeight === null ? false : updatedSets[setIndex].completed,
    };

    set({
      session: {
        ...state.session,
        completedSets: {
          ...state.session.completedSets,
          [blockId]: {
            sets: updatedSets,
          },
        },
      },
    });
  },

  setRpe: (blockId, setIndex, rpe) => {
    const state = get();
    const blockSets = state.session.completedSets[blockId];
    if (!blockSets || !blockSets.sets[setIndex]) {
      // Initialize if needed (for backward compatibility)
      const existingSets = blockSets?.sets || [];
      if (!existingSets[setIndex]) {
        existingSets[setIndex] = {
          completed: false,
          weight: null,
          rpe: null,
          restTimeMs: null,
          recommendedWeight: undefined,
        };
      }
      existingSets[setIndex] = {
        ...existingSets[setIndex],
        rpe,
      };
      set({
        session: {
          ...state.session,
          completedSets: {
            ...state.session.completedSets,
            [blockId]: {
              sets: existingSets,
            },
          },
        },
      });
      return;
    }

    const updatedSets = [...blockSets.sets];
    updatedSets[setIndex] = {
      ...updatedSets[setIndex],
      rpe,
    };

    set({
      session: {
        ...state.session,
        completedSets: {
          ...state.session.completedSets,
          [blockId]: {
            sets: updatedSets,
          },
        },
      },
    });
  },

  startRestTimer: (blockId, setIndex) => {
    const timerKey = `${blockId}-${setIndex}`;
    activeRestTimers.set(timerKey, Date.now());
  },

  stopRestTimer: (blockId, setIndex) => {
    const timerKey = `${blockId}-${setIndex}`;
    const startTime = activeRestTimers.get(timerKey);
    
    if (!startTime) return;

    const elapsedMs = Date.now() - startTime;
    activeRestTimers.delete(timerKey);

    const state = get();
    const blockSets = state.session.completedSets[blockId];
    if (!blockSets || !blockSets.sets[setIndex]) {
      // Initialize if needed
      const existingSets = blockSets?.sets || [];
      if (!existingSets[setIndex]) {
        existingSets[setIndex] = {
          completed: false,
          weight: null,
          rpe: null,
          restTimeMs: null,
          recommendedWeight: undefined,
        };
      }
      existingSets[setIndex] = {
        ...existingSets[setIndex],
        restTimeMs: elapsedMs,
      };
      set({
        session: {
          ...state.session,
          completedSets: {
            ...state.session.completedSets,
            [blockId]: {
              sets: existingSets,
            },
          },
        },
      });
      return;
    }

    const updatedSets = [...blockSets.sets];
    updatedSets[setIndex] = {
      ...updatedSets[setIndex],
      restTimeMs: elapsedMs,
    };

    set({
      session: {
        ...state.session,
        completedSets: {
          ...state.session.completedSets,
          [blockId]: {
            sets: updatedSets,
          },
        },
      },
    });
  },

  getActiveRestTimers: () => {
    return new Map(activeRestTimers);
  },

  nextBlock: () => {
    const state = get();
    const nextIndex = state.session.currentBlockIndex + 1;
    set({
      session: {
        ...state.session,
        currentBlockIndex: nextIndex,
      },
    });
  },

  finishSession: () => {
    const state = get();
    set({
      session: {
        ...state.session,
        endTime: Date.now(),
      },
    });
  },

  resetSession: () => {
    activeRestTimers.clear();
    set({
      session: {
        ...defaultSession,
        originalBlocks: null,
        adjustmentMetadata: null,
      },
    });
  },
}));
