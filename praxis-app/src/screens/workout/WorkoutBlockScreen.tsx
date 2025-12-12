import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useTheme } from '@theme';
import { Card, PraxisButton, Spacer, Chip } from '@components';
// Gesture handler will be loaded lazily if available
// For now, disable gestures to allow app to load without native module
const GESTURE_HANDLER_ENABLED = false;
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  useAnimatedReaction,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useWorkoutSessionStore } from '@/store/workoutSessionStore';
import { useWorkoutHistoryStore } from '@/store/workoutHistoryStore';
import { useProgressionStore } from '@/store/progressionStore';
import { usePerformanceStore, SetSuggestion } from '@/store/performanceStore';
import { useRecoveryStore } from '@/store/recoveryStore';
import { usePeriodizationStore } from '@/store/periodizationStore';
import { usePlanStore } from '@core/store';
import { WorkoutBlock, MovementPattern } from '@core/types';
import { Ionicons } from '@expo/vector-icons';
import { WorkoutRecord } from '@/types/workout';
import { EXERCISES } from '@core/data/exercises';
import { roundToIncrement } from '@/engine/autoregulation/autoRegEngine';
import {
  getAutoRegRecommendation,
  DEFAULT_AUTO_REG_RULES,
} from '@/engine/autoregulation/autoRegEngine';
import type {
  AutoRegSetInput,
  AutoRegContext,
  DifficultyFlag,
} from '@/engine/autoregulation/autoRegTypes';
import type { AdjustmentMetadata } from '@/utils/recoveryAdjustment';
import {
  calculateBlockVolume,
  calculateBlockAvgRpe,
  calculateBlockAvgRest,
  calculateWorkoutTotals,
  calculateDensityScore,
  calculateIntensityScore,
} from '@/utils/workoutMetrics';

// Type alias for compatibility
type TrainingBlock = WorkoutBlock;

/**
 * Format exercise ID to readable name
 */
function formatExerciseName(exerciseId: string): string {
  return exerciseId
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Animated Checkmark Component
 */
interface CheckmarkWithAnimationProps {
  isCompleted: boolean;
  canComplete: boolean;
  theme: ReturnType<typeof useTheme>;
}

function CheckmarkWithAnimation({ isCompleted, canComplete, theme, children }: CheckmarkWithAnimationProps & { children?: React.ReactNode }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(canComplete || isCompleted ? 1 : 0.5);

  useEffect(() => {
    if (isCompleted) {
      // Scale animation on completion
      scale.value = withSpring(1.2, { damping: 10, stiffness: 200 });
      setTimeout(() => {
        scale.value = withSpring(1, { damping: 10, stiffness: 200 });
      }, 200);
    } else {
      scale.value = 1;
    }
    opacity.value = canComplete || isCompleted ? 1 : 0.5;
  }, [isCompleted, canComplete, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View
      style={[
        styles.checkbox,
        {
          width: 24,
          height: 24,
          borderRadius: 12,
          borderWidth: 2,
          borderColor: isCompleted
            ? theme.colors.primary
            : canComplete
              ? theme.colors.primary
              : theme.colors.surface3,
          backgroundColor: isCompleted
            ? theme.colors.primary
            : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        },
        animatedStyle,
      ]}
    >
      {children}
    </Animated.View>
  );
}

/**
 * Animated Suggestion Row Component
 */
interface SuggestionRowProps {
  suggestion: SetSuggestion;
  weightDiff: number | null;
  blockId: string;
  setIndex: number;
  sessionPlanDayId: string | null;
  setWeight: (blockId: string, setIndex: number, weight: number) => void;
  clearSuggestionForSet: (planDayId: string, blockId: string, setIndex: number) => void;
  clampAndRoundWeight: (weight: number) => number;
  theme: ReturnType<typeof useTheme>;
}

function SuggestionRow({
  suggestion,
  weightDiff,
  blockId,
  setIndex,
  sessionPlanDayId,
  setWeight,
  clearSuggestionForSet,
  clampAndRoundWeight,
  theme,
}: SuggestionRowProps) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Fade in when suggestion appears
    opacity.value = withTiming(1, { duration: 300 });
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  const handleApply = () => {
    if (suggestion.suggestedWeight && suggestion.suggestedWeight > 0) {
      // Light haptic feedback
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {
        // Fallback no-op
      }

      // Clamp and round the suggested weight before applying
      const processedWeight = clampAndRoundWeight(suggestion.suggestedWeight);
      
      // Update weight in store
      setWeight(blockId, setIndex, processedWeight);
      
      // Fade out and clear the suggestion
      opacity.value = withTiming(0, { duration: 200 }, () => {
        runOnJS(clearSuggestionForSet)(
          sessionPlanDayId || '',
          blockId,
          setIndex
        );
      });
      
      if (__DEV__) {
        console.log('[AutoReg] Suggestion applied', {
          blockId,
          setIndex,
          originalSuggestion: suggestion.suggestedWeight,
          processedWeight,
        });
      }
    }
  };

  return (
    <Animated.View style={[styles.suggestionRow, { marginTop: theme.spacing.xs }, animatedStyle]}>
      <Text
        style={{
          color: theme.colors.textMuted,
          fontFamily: theme.typography.fonts.body,
          fontSize: theme.typography.sizes.bodySmall,
          flex: 1,
        }}
      >
        Suggested:{' '}
        <Text
          style={{
            color: theme.colors.textPrimary,
            fontFamily: theme.typography.fonts.bodyMedium,
            fontWeight: '600',
          }}
        >
          {suggestion.suggestedWeight.toFixed(1)} lb
        </Text>
        {weightDiff !== null && weightDiff !== 0 && (
          <Text
            style={{
              color:
                weightDiff > 0
                  ? theme.colors.primary
                  : theme.colors.warning,
              fontFamily: theme.typography.fonts.bodyMedium,
            }}
          >
            {' '}({weightDiff > 0 ? '+' : ''}{weightDiff.toFixed(1)})
          </Text>
        )}
      </Text>
      <TouchableOpacity
        onPress={handleApply}
        activeOpacity={0.7}
      >
        <Text
          style={{
            color: theme.colors.primary,
            fontFamily: theme.typography.fonts.bodyMedium,
            fontSize: theme.typography.sizes.bodySmall,
            fontWeight: '500',
          }}
        >
          Apply
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

/**
 * Global Rest Timer Overlay Component
 */
interface GlobalRestTimerProps {
  isVisible: boolean;
  remainingSeconds: number;
  onSkip: () => void;
  theme: ReturnType<typeof useTheme>;
}

function GlobalRestTimer({ isVisible, remainingSeconds, onSkip, theme }: GlobalRestTimerProps) {
  const opacity = useSharedValue(isVisible ? 1 : 0);
  const translateY = useSharedValue(isVisible ? 0 : 50);

  useEffect(() => {
    if (isVisible) {
      opacity.value = withSpring(1, { damping: 15, stiffness: 150 });
      translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(50, { duration: 200 });
    }
  }, [isVisible, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isVisible && opacity.value === 0) return null;

  return (
    <Animated.View
      style={[
        styles.globalRestTimer,
        {
          position: 'absolute',
          bottom: 120, // Above the Complete Workout button
          alignSelf: 'center',
          zIndex: 1000,
        },
        animatedStyle,
      ]}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        onPress={onSkip}
        activeOpacity={0.8}
        style={[
          styles.restTimerPill,
          {
            backgroundColor: theme.colors.surface2,
            borderColor: theme.colors.primary,
            borderWidth: 2,
            borderRadius: 24,
            paddingVertical: theme.spacing.sm,
            paddingHorizontal: theme.spacing.lg,
            minWidth: 200,
            alignItems: 'center',
            shadowColor: theme.colors.textPrimary,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5,
          },
        ]}
      >
        <Text
          style={{
            color: theme.colors.textPrimary,
            fontFamily: theme.typography.fonts.bodyMedium,
            fontSize: theme.typography.sizes.body,
            fontWeight: '600',
          }}
        >
          Rest: {formatTime(remainingSeconds)}
        </Text>
        <Text
          style={{
            color: theme.colors.textMuted,
            fontFamily: theme.typography.fonts.body,
            fontSize: theme.typography.sizes.bodySmall,
            marginTop: theme.spacing.xs,
          }}
        >
          (Tap to skip)
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

/**
 * Collapsible Block Component
 */
interface CollapsibleBlockProps {
  block: WorkoutBlock;
  blockIndex: number;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  summary: string;
  theme: ReturnType<typeof useTheme>;
  adjustmentMetadata?: AdjustmentMetadata | null;
}

function CollapsibleBlock({
  block,
  blockIndex,
  isExpanded,
  onToggle,
  children,
  summary,
  theme,
  adjustmentMetadata,
}: CollapsibleBlockProps) {
  const height = useSharedValue(isExpanded ? 1 : 0);
  const rotation = useSharedValue(isExpanded ? 1 : 0);

  // Update height when expanded state changes
  useEffect(() => {
    height.value = withSpring(isExpanded ? 1 : 0, {
      damping: 15,
      stiffness: 150,
    });
    rotation.value = withSpring(isExpanded ? 1 : 0, {
      damping: 15,
      stiffness: 150,
    });
  }, [isExpanded, height, rotation]);

  const animatedChevron = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotate: `${interpolate(rotation.value, [0, 1], [0, 90])}deg`,
        },
      ],
    };
  });

  const contentStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(height.value, [0, 1], [0, 1]),
    };
  });

  const isStrengthBlock = block.type === 'strength';

  return (
    <Card variant="elevated" padding="lg" style={{ marginBottom: theme.spacing.md }}>
      {/* Header */}
      <TouchableOpacity
        onPress={onToggle}
        activeOpacity={0.7}
        style={styles.blockHeader}
      >
        <View style={styles.blockHeaderContent}>
          <Text
            style={[
              styles.blockTitle,
              {
                color: theme.colors.textPrimary,
                fontFamily: theme.typography.fonts.headingMedium,
                fontSize: theme.typography.sizes.h3,
                flex: 1,
              },
            ]}
          >
            {block.title}
          </Text>
          {isStrengthBlock && adjustmentMetadata && (
            <Chip
              label={
                adjustmentMetadata.level === 'under'
                  ? 'Adjusted ↓'
                  : adjustmentMetadata.level === 'high'
                  ? 'Performance ↑'
                  : 'Adjusted'
              }
              variant="outlined"
              size="small"
              style={{
                backgroundColor: 'transparent',
                borderColor:
                  adjustmentMetadata.level === 'under'
                    ? theme.colors.warning
                    : adjustmentMetadata.level === 'high'
                    ? theme.colors.primary
                    : theme.colors.textMuted,
                marginRight: theme.spacing.sm,
              }}
              textStyle={{
                color:
                  adjustmentMetadata.level === 'under'
                    ? theme.colors.warning
                    : adjustmentMetadata.level === 'high'
                    ? theme.colors.primary
                    : theme.colors.textMuted,
                fontFamily: theme.typography.fonts.bodyMedium,
                fontSize: theme.typography.sizes.bodySmall,
              }}
            />
          )}
          <Animated.View style={animatedChevron}>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={theme.colors.textSecondary}
            />
          </Animated.View>
        </View>
        <Text
          style={[
            styles.blockSummary,
            {
              color: theme.colors.textSecondary,
              fontFamily: theme.typography.fonts.body,
              fontSize: theme.typography.sizes.bodySmall,
              marginTop: theme.spacing.xs,
            },
          ]}
        >
          {summary}
        </Text>
      </TouchableOpacity>

      {/* Collapsible Content */}
      {isExpanded && (
        <Animated.View style={contentStyle}>
          {children}
        </Animated.View>
      )}
    </Card>
  );
}

/**
 * Swipeable Set Row Component
 */
interface SwipeableSetRowProps {
  children: React.ReactNode;
  setIndex: number;
  canComplete: boolean;
  isCompleted: boolean;
  onComplete: () => void;
  onUndo: () => void;
  theme: ReturnType<typeof useTheme>;
  totalSets: number;
  blockId: string;
  planDayId: string | null;
  clearSuggestionForSet: (planDayId: string, blockId: string, setIndex: number) => void;
}

function SwipeableSetRow({
  children,
  setIndex,
  canComplete,
  isCompleted,
  onComplete,
  onUndo,
  theme,
  totalSets,
  blockId,
  planDayId,
  clearSuggestionForSet,
}: SwipeableSetRowProps) {
  const translateX = useSharedValue(0);
  const backgroundColor = useSharedValue(theme.colors.surface2);
  const [flashAnimation, setFlashAnimation] = useState(false);

  // Gesture handler disabled until native module is rebuilt
  // Swipe gestures will be re-enabled after rebuilding the native app
  const hasGestureHandler = false;
  const panGesture = null;

  // Animated styles
  const animatedRowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    backgroundColor: flashAnimation ? theme.colors.primary : backgroundColor.value,
  }));

  const rightBackgroundStyle = useAnimatedStyle(() => {
    const opacity = translateX.value > 0 ? Math.min(translateX.value / 100, 0.3) : 0;
    return { opacity };
  });

  const leftBackgroundStyle = useAnimatedStyle(() => {
    const opacity = translateX.value < 0 ? Math.min(Math.abs(translateX.value) / 100, 0.3) : 0;
    return { opacity };
  });

  return (
    <View style={styles.setRowContainer}>
      {/* Background indicators */}
      <Animated.View
        style={[
          styles.swipeBackground,
          styles.swipeBackgroundRight,
          {
            backgroundColor: theme.colors.primary,
          },
          rightBackgroundStyle,
        ]}
        pointerEvents="none"
      >
        <Text
          style={[
            styles.swipeLabel,
            {
              color: theme.colors.textPrimary,
              fontFamily: theme.typography.fonts.bodyMedium,
              fontSize: theme.typography.sizes.body,
            },
          ]}
        >
          Complete
        </Text>
      </Animated.View>
      <Animated.View
        style={[
          styles.swipeBackground,
          styles.swipeBackgroundLeft,
          {
            backgroundColor: theme.colors.surface3,
          },
          leftBackgroundStyle,
        ]}
        pointerEvents="none"
      >
        <Text
          style={[
            styles.swipeLabel,
            {
              color: theme.colors.textSecondary,
              fontFamily: theme.typography.fonts.bodyMedium,
              fontSize: theme.typography.sizes.body,
            },
          ]}
        >
          Undo
        </Text>
      </Animated.View>

      {/* Swipeable row */}
      {hasGestureHandler && panGesture ? (
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              styles.setRow,
              {
                paddingVertical: theme.spacing.md,
              backgroundColor: theme.colors.surface2,
            },
            animatedRowStyle,
          ]}
        >
          {children}
        </Animated.View>
      </GestureDetector>
      ) : (
        <Animated.View
          style={[
            styles.setRow,
            {
              paddingVertical: theme.spacing.md,
              backgroundColor: theme.colors.surface2,
            },
            animatedRowStyle,
          ]}
        >
          {children}
        </Animated.View>
      )}
    </View>
  );
}

export default function WorkoutBlockScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ blockIndex?: string | string[] }>();
  const blockIndex = Array.isArray(params.blockIndex)
    ? parseInt(params.blockIndex[0] || '0', 10)
    : parseInt(params.blockIndex || '0', 10);

  const {
    session,
    completeBlock,
    completeSet,
    undoSet,
    setWeight,
    setRpe,
    startRestTimer,
    stopRestTimer,
    getActiveRestTimers,
    nextBlock,
    finishSession,
  } = useWorkoutSessionStore();
  const { addWorkout } = useWorkoutHistoryStore();
  const { addHistoryEntry } = useProgressionStore();
  const { addEvent, addSuggestion, clearSuggestionForSet, suggestions } = usePerformanceStore();
  const { getRecovery } = useRecoveryStore();
  const { currentWeekStructure } = usePeriodizationStore();
  const { getPlanDayById } = usePlanStore();

  // Track active timers and update UI
  const [activeTimers, setActiveTimers] = useState<Map<string, number>>(new Map());
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Track expanded state for each block (first block expanded by default)
  const [expandedBlocks, setExpandedBlocks] = useState<Set<number>>(
    new Set([0]) // First block expanded
  );

  // Global rest timer state
  const [globalRestTimer, setGlobalRestTimer] = useState<{
    isActive: boolean;
    startTime: number;
    durationSeconds: number;
  } | null>(null);

  // Update timer display every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
      setActiveTimers(getActiveRestTimers());
    }, 1000);

    return () => clearInterval(interval);
  }, [getActiveRestTimers]);

  // Global rest timer countdown (updates every second with currentTime)
  useEffect(() => {
    if (!globalRestTimer || !globalRestTimer.isActive) return;

    const elapsed = Math.floor((currentTime - globalRestTimer.startTime) / 1000);
    const remaining = Math.max(0, globalRestTimer.durationSeconds - elapsed);

    if (remaining <= 0) {
      // Timer finished - trigger haptic and hide
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {
        // Fallback no-op
      }
      setGlobalRestTimer(null);
    }
  }, [currentTime, globalRestTimer]);

  // Check if any timer is active
  const hasActiveTimer = activeTimers.size > 0;

  const adjustmentMetadata = session.adjustmentMetadata;

  // Toggle block expansion
  const toggleBlock = (index: number) => {
    setExpandedBlocks((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  // Generate block summary
  const getBlockSummary = (block: WorkoutBlock): string => {
    if (block.type === 'strength' && block.strengthMain) {
      const sets = block.strengthMain.sets.length;
      const firstSet = block.strengthMain.sets[0];
      const reps = firstSet?.targetReps;
      const rpe = firstSet?.targetRpe;
      if (sets && reps) {
        return rpe ? `${sets} sets × ${reps} reps @ RPE ${rpe}` : `${sets} sets × ${reps} reps`;
      }
      return `${sets} sets`;
    }
    if (block.type === 'accessory' && block.accessory && block.accessory.length > 0) {
      return `${block.accessory.length} movement${block.accessory.length > 1 ? 's' : ''}`;
    }
    if (block.type === 'conditioning' && block.conditioning) {
      const cond = block.conditioning;
      if (cond.rounds) {
        return `${cond.rounds} rounds`;
      }
      if (cond.durationSeconds) {
        return `${Math.floor(cond.durationSeconds / 60)} min`;
      }
      return 'Conditioning';
    }
    if (block.type === 'warmup' && block.warmupItems) {
      return `${block.warmupItems.length} movement${block.warmupItems.length > 1 ? 's' : ''}`;
    }
    if (block.type === 'cooldown' && block.cooldownItems) {
      return `${block.cooldownItems.length} stretch${block.cooldownItems.length > 1 ? 'es' : ''}`;
    }
    return '';
  };

  // Check if all sets are completed (with weight and RPE)
  const allSetsCompleted =
    isStrengthBlock &&
    blockSetsData.length === totalSets &&
    blockSetsData.every((set) => set.completed && set.weight !== null && set.rpe !== null);
  
  // Check if any rest timer is active for this block
  const hasActiveTimerForBlock = isStrengthBlock && 
    Array.from({ length: totalSets }, (_, index) => {
      const timerKey = `${currentBlock?.id || ''}-${index}`;
      return activeTimers.has(timerKey);
    }).some(Boolean);

  // Format time in MM:SS format
  const formatRestTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Get elapsed time for a specific timer
  const getElapsedTime = (blockId: string, setIndex: number): number => {
    const timerKey = `${blockId}-${setIndex}`;
    const startTime = activeTimers.get(timerKey);
    if (!startTime) return 0;
    return currentTime - startTime;
  };

  // Handle toggle set completion (only if weight and RPE are set)
  const handleToggleSet = (block: WorkoutBlock, blockId: string, setIndex: number) => {
    const blockSetsData = session.completedSets[blockId]?.sets || [];
    const setData = blockSetsData[setIndex];
    if (!setData) return;

    const isStrengthBlock = block.type === 'strength' && block.strengthMain?.sets.length > 0;
    const totalSets = block.strengthMain?.sets.length || 0;

    // Only allow completion if weight and RPE are provided
    if (!setData.completed && setData.weight !== null && setData.rpe !== null) {
      // Trigger haptic feedback
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {
        // Fallback no-op if haptics unavailable
      }
      
      completeSet(blockId, setIndex);
      // Start rest timer when set is completed
      startRestTimer(blockId, setIndex);

      // Start global rest timer (only if not the last set in the block)
      const block = session.blocks.find((b) => b.id === blockId);
      if (block && block.type === 'strength' && block.strengthMain) {
        const totalSets = block.strengthMain.sets.length;
        const isLastSet = setIndex >= totalSets - 1;
        
        // Only start global timer if not the last set
        if (!isLastSet) {
          const defaultRestSeconds = 90; // Default 90 seconds for strength sets
          // TODO: Get prescribed rest from block if available (SetPrescription doesn't have restSeconds yet)
          const restSeconds = defaultRestSeconds;
          
          setGlobalRestTimer({
            isActive: true,
            startTime: Date.now(),
            durationSeconds: restSeconds,
          });

          // Auto-focus next weight input and scroll
          const nextSetKey = `${blockId}-${setIndex + 1}`;
          setTimeout(() => {
            const nextInput = weightInputRefs.current[nextSetKey];
            if (nextInput) {
              nextInput.focus();
            }

            // Auto-scroll to next set row (smooth scroll)
            // Use estimated position based on set index
            const estimatedY = (setIndex + 1) * 150; // Approximate height per set row including spacing
            scrollViewRef.current?.scrollTo({
              y: estimatedY,
              animated: true,
            });
          }, 300);
        } else {
          // Last set completed - clear timer if active
          setGlobalRestTimer(null);
        }
      }

      // Auto-regulation: capture set performance and generate recommendation
      if (isStrengthBlock && block.strengthMain) {
        try {
          // Build AutoRegSetInput
          const targetRpe = block.strengthMain.sets[setIndex]?.targetRpe || null;
          const prescribedReps = block.strengthMain.sets[setIndex]?.targetReps || null;

          // Derive difficulty from RPE vs target
          let difficulty: DifficultyFlag | null = null;
          if (setData.rpe !== null && targetRpe !== null) {
            const rpeDiff = setData.rpe - targetRpe;
            if (rpeDiff <= -2) {
              difficulty = 'too_easy';
            } else if (rpeDiff >= 2) {
              difficulty = 'too_hard';
            } else {
              difficulty = 'on_target';
            }
          } else {
            difficulty = 'on_target'; // Default if no RPE/target
          }

          const input: AutoRegSetInput = {
            weight: setData.weight,
            reps: prescribedReps,
            rpe: setData.rpe,
            difficulty,
          };

          // Build AutoRegContext
          const recoveryScore = getRecovery();
          const blockType = currentWeekStructure?.blockType || null;
          
          // Try to get pattern from weekly structure day, or infer from exercise
          let pattern: MovementPattern | null = null;
          if (currentWeekStructure?.days && currentWeekStructure.days.length > 0) {
            // Use the first day's pattern as a fallback (could be improved with date matching)
            pattern = currentWeekStructure.days[0]?.mainMovementPattern || null;
          }
          
          // If still null, try to infer from exercise name (basic heuristic)
          if (!pattern && block.strengthMain?.exerciseId) {
            const exerciseId = block.strengthMain.exerciseId.toLowerCase();
            if (exerciseId.includes('squat')) pattern = 'squat';
            else if (exerciseId.includes('deadlift') || exerciseId.includes('rdl') || exerciseId.includes('hinge')) pattern = 'hinge';
            else if (exerciseId.includes('bench') || exerciseId.includes('press')) pattern = 'horizontal_push';
            else if (exerciseId.includes('row') || exerciseId.includes('pull')) pattern = 'horizontal_pull';
          }

          const context: AutoRegContext = {
            recoveryScore,
            blockType: blockType as 'accumulation' | 'intensification' | 'deload' | null,
            pattern,
            priorSetIndex: setIndex,
            totalSetsInBlock: totalSets,
            targetRpe,
            planRpe: targetRpe, // Use same as target for now
            lastEstimated1Rm: null, // Not available yet
            isFinalSet: setIndex === totalSets - 1,
          };

          // Get recommendation
          const recommendation = getAutoRegRecommendation(
            input,
            context,
            DEFAULT_AUTO_REG_RULES
          );

          // Store performance event
          addEvent({
            planDayId: session.planDayId,
            blockId: currentBlock.id,
            setIndex,
            input,
            context,
            recommendation,
          });

          // Create suggestion for next set if applicable
          const nextSetIndex = setIndex + 1;
          if (
            recommendation.nextWeight !== null &&
            recommendation.nextWeight > 0 &&
            nextSetIndex < totalSets &&
            session.planDayId
          ) {
            // Check if the suggested weight is different from the next set's current weight
            const nextSetData = blockSetsData[nextSetIndex];
            const nextSetCurrentWeight = nextSetData?.weight;
            const shouldCreateSuggestion =
              nextSetCurrentWeight === null ||
              nextSetCurrentWeight === undefined ||
              Math.abs(nextSetCurrentWeight - recommendation.nextWeight) > 0.1; // Allow small floating point differences

            if (shouldCreateSuggestion) {
              addSuggestion({
                id: `${session.planDayId}-${currentBlock.id}-${nextSetIndex}-${Date.now()}`,
                planDayId: session.planDayId,
                blockId: currentBlock.id,
                setIndex: nextSetIndex,
                prevWeight: setData.weight,
                suggestedWeight: recommendation.nextWeight,
                difficulty: input.difficulty,
                createdAtISO: new Date().toISOString(),
              });
            }
          }

          // Log for debugging
          if (__DEV__) {
            console.log('[AutoReg] Set completed', {
              blockId: currentBlock.id,
              setIndex,
              nextSetIndex,
              weight: input.weight,
              rpe: input.rpe,
              recommendation: {
                nextWeight: recommendation.nextWeight,
                reason: recommendation.reason,
                flags: recommendation.flags,
              },
            });
          }
        } catch (error) {
          // Silently fail if auto-regulation fails (non-critical)
          if (__DEV__) {
            console.warn('[AutoReg] Error processing set completion:', error);
          }
        }
      }
    } else if (setData.completed) {
      // Allow undoing completion
      undoSet(currentBlock.id, setIndex);
      // Stop rest timer if it's running
      const timerKey = `${currentBlock.id}-${setIndex}`;
      if (activeTimers.has(timerKey)) {
        stopRestTimer(currentBlock.id, setIndex);
      }
      
      // Clear suggestion for the next set since the basis changed
      if (session.planDayId) {
        const nextSetIndex = setIndex + 1;
        clearSuggestionForSet(session.planDayId, currentBlock.id, nextSetIndex);
      }
    }
  };

  // Handle stop rest timer
  const handleStopRest = (blockId: string, setIndex: number) => {
    stopRestTimer(blockId, setIndex);
  };

  // Utility function to clamp and round weight
  const clampAndRoundWeight = (weight: number): number => {
    // Clamp to minimum of 0
    const clamped = Math.max(0, weight);
    // Round to nearest 2.5 lbs (consistent with progression rules)
    return roundToIncrement(clamped, 2.5);
  };

  // Handle weight change (during typing - no rounding yet)
  const handleWeightChange = (blockId: string, setIndex: number, value: string) => {
    if (!session.planDayId) return;
    
    // Allow empty string (will be treated as null)
    if (value === '' || value === '0') {
      setWeight(blockId, setIndex, 0); // Store as 0, converted to null in store
      
      // Clear any suggestion for this set when weight is cleared
      clearSuggestionForSet(session.planDayId, blockId, setIndex);
    } else {
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue >= 0) {
        // Clamp to minimum 0, but don't round yet (allow user to type freely)
        const clampedWeight = Math.max(0, numValue);
        
        // Update weight in store (will be rounded on blur)
        setWeight(blockId, setIndex, clampedWeight);
        
        // Clear suggestion when weight changes (any change, not just exact match)
        const suggestion = suggestions.find(
          (s) =>
            s.planDayId === session.planDayId &&
            s.blockId === blockId &&
            s.setIndex === setIndex
        );
        
        if (suggestion) {
          clearSuggestionForSet(session.planDayId, blockId, setIndex);
          
          if (__DEV__) {
            console.log('[WorkoutScreen] Weight changed, cleared suggestion', {
              blockId,
              setIndex,
              newWeight: clampedWeight,
              previousSuggestion: suggestion.suggestedWeight,
            });
          }
        }
      }
    }
  };

  // Handle weight blur (round to nearest 2.5 lbs)
  const handleWeightBlur = (blockId: string, setIndex: number) => {
    const blockSetsData = session.completedSets[blockId]?.sets || [];
    const setData = blockSetsData[setIndex];
    if (setData && setData.weight !== null && setData.weight > 0) {
      // Round the weight to nearest 2.5 lbs
      const roundedWeight = clampAndRoundWeight(setData.weight);
      
      // Only update if rounding changed the value
      if (Math.abs(roundedWeight - setData.weight) > 0.01) {
        setWeight(blockId, setIndex, roundedWeight);
        
        if (__DEV__) {
          console.log('[WorkoutScreen] Weight rounded on blur', {
            blockId,
            setIndex,
            original: setData.weight,
            rounded: roundedWeight,
          });
        }
      }
    }
  };

  // Handle RPE selection
  const handleRpeSelect = (blockId: string, setIndex: number, rpe: number) => {
    // Light haptic feedback
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {
      // Fallback no-op
    }
    setRpe(blockId, setIndex, rpe);
  };

  // Build WorkoutRecord from session data
  const buildWorkoutRecord = (): WorkoutRecord | null => {
    if (!session.planDayId || !session.startTime) return null;

    const planDay = getPlanDayById(session.planDayId);
    if (!planDay) return null;

    const endTime = Date.now();
    const durationMin = Math.round((endTime - session.startTime) / 60000);

    // Build blocks array with calculated metrics
    const blocks = session.blocks.map((block) => {
      const blockSetsData = session.completedSets[block.id]?.sets || [];
      
      // Get prescribed values from block (only for strength blocks)
      let prescribedSets = 0;
      let prescribedReps: number | null = null;
      let targetRpe: number | null = null;

      if (block.type === 'strength' && block.strengthMain) {
        prescribedSets = block.strengthMain.sets.length;
        prescribedReps = block.strengthMain.sets[0]?.targetReps || null;
        targetRpe = block.strengthMain.sets[0]?.targetRpe || null;
      } else if (block.type === 'accessory' && block.accessory && block.accessory.length > 0) {
        // For accessory blocks, use first exercise's sets
        prescribedSets = block.accessory[0].sets.length;
        prescribedReps = block.accessory[0].sets[0]?.targetReps || null;
      }

      const blockWithSets = {
        blockId: block.id,
        title: block.title,
        type: block.type,
        prescribedSets,
        prescribedReps,
        targetRpe,
        sets: blockSetsData,
      };

      return {
        ...blockWithSets,
        volume: calculateBlockVolume(blockWithSets),
        avgRpe: calculateBlockAvgRpe(blockWithSets),
        avgRestSec: calculateBlockAvgRest(blockWithSets),
      };
    });

    // Calculate workout-level totals
    const totals = calculateWorkoutTotals(blocks);

    const workoutRecord: WorkoutRecord = {
      id: `workout-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      planDayId: session.planDayId,
      date: new Date().toISOString().split('T')[0], // yyyy-mm-dd
      startTime: session.startTime,
      endTime,
      durationMin,
      blocks,
      ...totals,
      densityScore: 0, // Will calculate after creating record
      intensityScore: 0, // Will calculate after creating record
    };

    // Calculate scores
    workoutRecord.densityScore = calculateDensityScore(workoutRecord);
    workoutRecord.intensityScore = calculateIntensityScore(workoutRecord);

    // Record progression data for each completed strength block
    workoutRecord.blocks.forEach((block) => {
      if (block.type === 'strength' && block.sets.length > 0) {
        // Find the corresponding block in session to get exerciseId
        const sessionBlock = session.blocks.find((b) => b.id === block.blockId);
        if (sessionBlock?.type === 'strength' && sessionBlock.strengthMain) {
          const exerciseId = sessionBlock.strengthMain.exerciseId;
          const prescribedReps = block.prescribedReps || 0;

          // Record each completed set as a separate entry
          block.sets.forEach((set) => {
            if (set.completed && set.weight !== null && set.weight > 0 && set.rpe !== null) {
              addHistoryEntry({
                date: workoutRecord.date,
                exerciseId,
                blockId: block.blockId,
                sessionId: workoutRecord.id,
                weight: set.weight,
                reps: prescribedReps,
                sets: 1,
                rpe: set.rpe,
                volume: set.weight * prescribedReps,
              });
            }
          });
        }
      }
    });

    return workoutRecord;
  };

  // ScrollView ref for auto-scrolling
  const scrollViewRef = useRef<ScrollView>(null);
  // Weight input refs for auto-focus
  const weightInputRefs = useRef<{ [key: string]: TextInput | null }>({});

  // Log collapsible blocks
  useEffect(() => {
    if (__DEV__ && session.blocks.length > 0) {
      console.log('[WorkoutUX] Collapsible workout blocks added');
    }
  }, [session.blocks.length]);

  // Log global rest timer
  useEffect(() => {
    if (__DEV__) {
      console.log('[WorkoutUX] Global rest timer added');
    }
  }, []);

  // Log micro interactions
  useEffect(() => {
    if (__DEV__) {
      console.log('[WorkoutUX] Micro interactions added');
    }
  }, []);

  // Error state: No blocks found
  if (!session.blocks || session.blocks.length === 0) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.appBg }]}
        edges={['top', 'bottom']}
      >
        <View
          style={[
            styles.errorContainer,
            {
              padding: theme.spacing.xl,
            },
          ]}
        >
          <Text
            style={[
              styles.errorTitle,
              {
                color: theme.colors.textPrimary,
                fontFamily: theme.typography.fonts.heading,
                fontSize: theme.typography.sizes.h2,
                marginBottom: theme.spacing.md,
              },
            ]}
          >
            No workout blocks found.
          </Text>
          <PraxisButton
            title="Back to Overview"
            onPress={() => router.back()}
            size="medium"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.appBg }]}
      edges={['top']}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { padding: theme.spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {session.blocks.map((block, index) => {
          const isExpanded = expandedBlocks.has(index);
          const blockSetsData = session.completedSets[block.id]?.sets || [];
          const isStrengthBlock = block.type === 'strength' && block.strengthMain?.sets.length > 0;
          const totalSets = block.strengthMain?.sets.length || 0;
          const isLastBlock = index >= session.blocks.length - 1;
          const allSetsCompleted =
            isStrengthBlock &&
            blockSetsData.length === totalSets &&
            blockSetsData.every((set) => set.completed && set.weight !== null && set.rpe !== null);
          const hasActiveTimerForBlock = isStrengthBlock && 
            Array.from({ length: totalSets }, (_, idx) => {
              const timerKey = `${block.id}-${idx}`;
              return activeTimers.has(timerKey);
            }).some(Boolean);

          return (
            <CollapsibleBlock
              key={block.id}
              block={block}
              blockIndex={index}
              isExpanded={isExpanded}
              onToggle={() => toggleBlock(index)}
              summary={getBlockSummary(block)}
              theme={theme}
              adjustmentMetadata={index === 0 ? adjustmentMetadata : null}
            >
              {/* Block Content */}
              {renderBlockContent(block, blockSetsData, isStrengthBlock, totalSets, isLastBlock, allSetsCompleted, hasActiveTimerForBlock, index)}
            </CollapsibleBlock>
          );
        })}

        {/* Complete Workout Button (only show when all blocks are completed) */}
        {session.blocks.every((b) => session.completedBlocks.includes(b.id)) && (
          <Card variant="elevated" padding="lg" style={{ marginBottom: 120 }}>
            <PraxisButton
              title="Complete Workout"
              onPress={() => {
                // Clear global rest timer when completing workout
                setGlobalRestTimer(null);
                
                const workoutRecord = buildWorkoutRecord();
                if (workoutRecord) {
                  addWorkout(workoutRecord);
                }
                finishSession();
                router.replace('/workout/summary');
              }}
              size="large"
            />
          </Card>
        )}
      </ScrollView>

      {/* Global Rest Timer Overlay */}
      {globalRestTimer && globalRestTimer.isActive && (() => {
        const elapsed = Math.floor((currentTime - globalRestTimer.startTime) / 1000);
        const remaining = Math.max(0, globalRestTimer.durationSeconds - elapsed);
        return remaining > 0 ? (
          <GlobalRestTimer
            isVisible={true}
            remainingSeconds={remaining}
            onSkip={() => {
              setGlobalRestTimer(null);
            }}
            theme={theme}
          />
        ) : null;
      })()}
    </SafeAreaView>
  );

  // Render block content based on type
  function renderBlockContent(
    block: WorkoutBlock,
    blockSetsData: any[],
    isStrengthBlock: boolean,
    totalSets: number,
    isLastBlock: boolean,
    allSetsCompleted: boolean,
    hasActiveTimerForBlock: boolean,
    blockIndex: number
  ) {
    // Get instructions for this block
    const instructions: string[] = [];
    if (block.type === 'strength' && block.strengthMain) {
      const sets = block.strengthMain.sets.length;
      const firstSet = block.strengthMain.sets[0];
      const reps = firstSet?.targetReps;
      const rpe = firstSet?.targetRpe;
      if (sets && reps) {
        let instruction = `${sets} sets × ${reps} reps`;
        if (rpe) {
          instruction += ` @ RPE ${rpe}`;
        }
        instructions.push(instruction);
      }
    }
    if (block.type === 'accessory' && block.accessory && block.accessory.length > 0) {
      block.accessory.forEach((exercise) => {
        const exerciseName = formatExerciseName(exercise.exerciseId);
        const sets = exercise.sets.length;
        const firstSet = exercise.sets[0];
        const reps = firstSet?.targetReps;
        instructions.push(`${exerciseName}: ${sets} sets × ${reps || '?'} reps`);
      });
    }
    if (block.type === 'warmup' && block.warmupItems && block.warmupItems.length > 0) {
      instructions.push(...block.warmupItems);
    }
    if (block.type === 'cooldown' && block.cooldownItems && block.cooldownItems.length > 0) {
      instructions.push(...block.cooldownItems);
    }
    if (block.type === 'conditioning' && block.conditioning) {
      const cond = block.conditioning;
      if (cond.workSeconds && cond.restSeconds && cond.rounds) {
        instructions.push(
          `${cond.rounds} rounds: ${cond.workSeconds}s work / ${cond.restSeconds}s rest`
        );
      }
      if (cond.targetZone) {
        instructions.push(`Target: Zone ${cond.targetZone}`);
      }
    }

    return (
      <View>
        {/* Instructions */}
        {instructions.length > 0 && (
          <View style={styles.instructionsContainer}>
            {instructions.map((instruction, idx) => (
              <Text
                key={idx}
                style={[
                  styles.instructionItem,
                  {
                    color: theme.colors.textPrimary,
                    fontFamily: theme.typography.fonts.body,
                    fontSize: theme.typography.sizes.body,
                  },
                ]}
              >
                • {instruction}
              </Text>
            ))}
          </View>
        )}

        {/* Strength Block: Set-by-set tracking */}
        {isStrengthBlock && (
          <View key="strength-block">
            <Spacer size="md" />
            <View style={styles.setsContainer}>
              {Array.from({ length: totalSets }, (_, idx) => {
                const setIndex = idx;
                const setData = blockSetsData[setIndex] || {
                  completed: false,
                  weight: null,
                  rpe: null,
                  recommendedWeight: undefined,
                };
                const isCompleted = setData.completed;
                const hasWeight = setData.weight !== null && setData.weight > 0;
                const hasRpe = setData.rpe !== null;
                const canComplete = hasWeight && hasRpe && !isCompleted;

                  // Get rest timer info
                  const timerKey = `${block.id}-${setIndex}`;
                  const isTimerActive = activeTimers.has(timerKey);
                  const elapsedMs = isTimerActive
                    ? getElapsedTime(block.id, setIndex)
                    : setData.restTimeMs || 0;
                  const showRestTimer = isCompleted && (isTimerActive || (setData.restTimeMs !== null && setData.restTimeMs > 0));

                  // Get AutoReg suggestion
                  const suggestion = suggestions.find(
                    (s) =>
                      s.planDayId === session.planDayId &&
                      s.blockId === block.id &&
                      s.setIndex === setIndex
                  );
                  const weightDiff = suggestion && suggestion.prevWeight && suggestion.prevWeight > 0
                    ? suggestion.suggestedWeight! - suggestion.prevWeight
                    : null;

                  // Get prescribed reps
                  const prescribedReps = block.strengthMain?.sets[setIndex]?.targetReps || null;

                  const handleUndoSet = () => {
                    undoSet(block.id, setIndex);
                    stopRestTimer(block.id, setIndex);
                  };

                  return (
                    <View
                      key={setIndex}
                      nativeID={`${block.id}-set-${setIndex}`}
                      style={[
                        {
                          borderBottomWidth: idx < totalSets - 1 ? 1 : 0,
                          borderBottomColor: theme.colors.surface3,
                        },
                      ]}
                    >
                      <SwipeableSetRow
                        setIndex={setIndex}
                        canComplete={canComplete}
                        isCompleted={isCompleted}
                        onComplete={() => handleToggleSet(block, block.id, setIndex)}
                        onUndo={handleUndoSet}
                        theme={theme}
                        totalSets={totalSets}
                        blockId={block.id}
                        planDayId={session.planDayId}
                        clearSuggestionForSet={clearSuggestionForSet}
                      >
                        {/* Left: Completion checkbox */}
                        <TouchableOpacity
                          onPress={() => handleToggleSet(block, block.id, setIndex)}
                          disabled={!canComplete && !isCompleted}
                          activeOpacity={canComplete || isCompleted ? 0.7 : 1}
                          style={[styles.checkboxContainer, { marginRight: theme.spacing.md }]}
                        >
                        <CheckmarkWithAnimation
                          isCompleted={isCompleted}
                          canComplete={canComplete}
                          theme={theme}
                        >
                          {isCompleted && (
                            <Ionicons
                              name="checkmark"
                              size={16}
                              color={theme.colors.textPrimary}
                            />
                          )}
                        </CheckmarkWithAnimation>
                      </TouchableOpacity>

                      {/* Right: Content */}
                      <View style={styles.setContent}>
                        {/* Line 1: Set X + Rest timer */}
                        <View style={[styles.setHeaderRow, { marginBottom: theme.spacing.xs }]}>
                          <Text
                            style={[
                              styles.setNumber,
                              {
                                color: theme.colors.textPrimary,
                                fontFamily: theme.typography.fonts.bodyMedium,
                                fontSize: theme.typography.sizes.body,
                                fontWeight: '600',
                              },
                            ]}
                          >
                            Set {setIndex + 1}
                          </Text>
                          {showRestTimer && (
                            <Text
                              style={[
                                styles.restTimerLabel,
                                {
                                  color: theme.colors.textMuted,
                                  fontFamily: theme.typography.fonts.body,
                                  fontSize: theme.typography.sizes.bodySmall,
                                  marginLeft: theme.spacing.sm,
                                },
                              ]}
                            >
                              Rest: {formatRestTime(elapsedMs)}
                            </Text>
                          )}
                          {isTimerActive && (
                            <TouchableOpacity
                              onPress={() => handleStopRest(block.id, setIndex)}
                              activeOpacity={0.7}
                              style={{ marginLeft: theme.spacing.xs }}
                            >
                              <Text
                                style={{
                                  color: theme.colors.primary,
                                  fontFamily: theme.typography.fonts.bodyMedium,
                                  fontSize: theme.typography.sizes.bodySmall,
                                }}
                              >
                                Stop
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>

                        {/* Line 2: Weight + Reps inputs inline */}
                        <View style={[styles.inputsRow, { marginBottom: theme.spacing.sm, gap: theme.spacing.sm }]}>
                          {/* Weight input */}
                          <View style={styles.inputWrapper}>
                            <TextInput
                              ref={(ref) => {
                                const key = `${block.id}-${setIndex}`;
                                weightInputRefs.current[key] = ref;
                              }}
                              style={[
                                styles.numericInput,
                                {
                                  backgroundColor: theme.colors.surface2,
                                  borderColor: hasWeight
                                    ? theme.colors.primary
                                    : theme.colors.surface3,
                                  color: theme.colors.textPrimary,
                                  fontFamily: theme.typography.fonts.bodyMedium,
                                  fontSize: theme.typography.sizes.body,
                                  borderRadius: theme.radius.md,
                                  paddingVertical: theme.spacing.xs,
                                  paddingHorizontal: theme.spacing.sm,
                                  borderWidth: 1,
                                  minWidth: 60,
                                  textAlign: 'center',
                                },
                              ]}
                              value={
                                setData.weight !== null && setData.weight > 0
                                  ? setData.weight.toFixed(1).replace(/\.0$/, '') // Show as integer if .0, otherwise 1 decimal
                                  : ''
                              }
                              onChangeText={(value) => handleWeightChange(block.id, setIndex, value)}
                              onFocus={() => {
                                // Auto-select text when tapping weight field
                                const key = `${block.id}-${setIndex}`;
                                const input = weightInputRefs.current[key];
                                if (input) {
                                  const value = setData.weight !== null && setData.weight > 0
                                    ? setData.weight.toFixed(1).replace(/\.0$/, '')
                                    : '';
                                  if (value) {
                                    input.setNativeProps({ selection: { start: 0, end: value.length } });
                                  }
                                }
                              }}
                              onBlur={() => handleWeightBlur(block.id, setIndex)}
                              placeholder="Weight"
                              placeholderTextColor={theme.colors.textMuted}
                              keyboardType="numeric"
                              returnKeyType="done"
                            />
                          </View>

                          {/* Reps input */}
                          <View style={styles.inputWrapper}>
                            <TextInput
                              style={[
                                styles.numericInput,
                                {
                                  backgroundColor: theme.colors.surface2,
                                  borderColor: theme.colors.surface3,
                                  color: theme.colors.textPrimary,
                                  fontFamily: theme.typography.fonts.bodyMedium,
                                  fontSize: theme.typography.sizes.body,
                                  borderRadius: theme.radius.md,
                                  paddingVertical: theme.spacing.xs,
                                  paddingHorizontal: theme.spacing.sm,
                                  borderWidth: 1,
                                  minWidth: 50,
                                  textAlign: 'center',
                                },
                              ]}
                              value={prescribedReps?.toString() || ''}
                              editable={false}
                              placeholder="Reps"
                              placeholderTextColor={theme.colors.textMuted}
                            />
                          </View>
                        </View>

                        {/* Line 3: RPE selector row */}
                        <View style={[styles.rpeRow, { marginBottom: theme.spacing.xs }]}>
                          {[6, 7, 8, 9, 10].map((rpe) => (
                            <TouchableOpacity
                              key={rpe}
                              onPress={() => handleRpeSelect(block.id, setIndex, rpe)}
                              activeOpacity={0.7}
                            >
                              <View
                                style={[
                                  styles.rpeChip,
                                  {
                                    backgroundColor:
                                      setData.rpe === rpe
                                        ? theme.colors.primary
                                        : theme.colors.surface2,
                                    borderRadius: theme.radius.md,
                                    paddingVertical: theme.spacing.xs,
                                    paddingHorizontal: theme.spacing.sm,
                                    marginRight: theme.spacing.xs,
                                    borderWidth: setData.rpe === rpe ? 0 : 1,
                                    borderColor: theme.colors.surface3,
                                  },
                                ]}
                              >
                                <Text
                                  style={{
                                    color:
                                      setData.rpe === rpe
                                        ? theme.colors.textPrimary
                                        : theme.colors.textSecondary,
                                    fontFamily: theme.typography.fonts.bodyMedium,
                                    fontSize: theme.typography.sizes.bodySmall,
                                    fontWeight: setData.rpe === rpe ? '600' : '400',
                                  }}
                                >
                                  {rpe}
                                </Text>
                              </View>
                            </TouchableOpacity>
                          ))}
                        </View>

                        {/* Line 4: AutoReg suggestion (conditional, one line) */}
                        {suggestion && suggestion.suggestedWeight && (
                          <SuggestionRow
                            suggestion={suggestion}
                            weightDiff={weightDiff}
                            blockId={block.id}
                            setIndex={setIndex}
                            sessionPlanDayId={session.planDayId}
                            setWeight={setWeight}
                            clearSuggestionForSet={clearSuggestionForSet}
                            clampAndRoundWeight={clampAndRoundWeight}
                            theme={theme}
                          />
                        )}
                      </View>
                    </SwipeableSetRow>
                    </View>
                  );
                })}
            </View>
          </View>
        )}

        {/* Accessory Block */}
        {block.type === 'accessory' && block.accessory && block.accessory.length > 0 && (
          <View>
            {block.accessory.map((exercise, exIdx) => (
              <View key={exIdx} style={{ marginBottom: theme.spacing.md }}>
                <Text
                  style={{
                    color: theme.colors.textPrimary,
                    fontFamily: theme.typography.fonts.bodyMedium,
                    fontSize: theme.typography.sizes.body,
                    fontWeight: '600',
                    marginBottom: theme.spacing.sm,
                  }}
                >
                  {formatExerciseName(exercise.exerciseId)}
                </Text>
                <Text
                  style={{
                    color: theme.colors.textSecondary,
                    fontFamily: theme.typography.fonts.body,
                    fontSize: theme.typography.sizes.bodySmall,
                  }}
                >
                  {exercise.sets.length} sets × {exercise.sets[0]?.targetReps || '?'} reps
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Conditioning Block */}
        {block.type === 'conditioning' && block.conditioning && (
          <View>
            {block.conditioning.durationSeconds && (
              <Text
                style={{
                  color: theme.colors.textPrimary,
                  fontFamily: theme.typography.fonts.body,
                  fontSize: theme.typography.sizes.body,
                  marginBottom: theme.spacing.sm,
                }}
              >
                Duration: {Math.floor(block.conditioning.durationSeconds / 60)} min
              </Text>
            )}
            {block.conditioning.targetZone && (
              <Text
                style={{
                  color: theme.colors.textSecondary,
                  fontFamily: theme.typography.fonts.body,
                  fontSize: theme.typography.sizes.bodySmall,
                }}
              >
                Target Zone: {block.conditioning.targetZone}
              </Text>
            )}
          </View>
        )}

        {/* Warmup Block */}
        {block.type === 'warmup' && block.warmupItems && block.warmupItems.length > 0 && (
          <View>
            {block.warmupItems.map((item, idx) => (
              <Text
                key={idx}
                style={{
                  color: theme.colors.textPrimary,
                  fontFamily: theme.typography.fonts.body,
                  fontSize: theme.typography.sizes.body,
                  marginBottom: theme.spacing.xs,
                }}
              >
                • {item}
              </Text>
            ))}
          </View>
        )}

        {/* Cooldown Block */}
        {block.type === 'cooldown' && block.cooldownItems && block.cooldownItems.length > 0 && (
          <View>
            {block.cooldownItems.map((item, idx) => (
              <Text
                key={idx}
                style={{
                  color: theme.colors.textPrimary,
                  fontFamily: theme.typography.fonts.body,
                  fontSize: theme.typography.sizes.body,
                  marginBottom: theme.spacing.xs,
                }}
              >
                • {item}
              </Text>
            ))}
          </View>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  title: {
    fontWeight: '600',
  },
  instructionsContainer: {
    marginTop: 0,
  },
  instructionItem: {
    marginBottom: 8,
    lineHeight: 22,
  },
  setsContainer: {
    marginTop: 0,
  },
  setRowContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  swipeBackground: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 0,
  },
  swipeBackgroundRight: {
    left: 0,
    right: '50%',
  },
  swipeBackgroundLeft: {
    left: '50%',
    right: 0,
  },
  swipeLabel: {
    fontWeight: '600',
  },
  checkboxContainer: {
    marginTop: 2,
  },
  checkbox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  setContent: {
    flex: 1,
  },
  setHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  setNumber: {
    fontWeight: '600',
  },
  restTimerLabel: {
    fontWeight: '400',
  },
  inputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  inputWrapper: {
    flex: 0,
  },
  numericInput: {
    fontWeight: '500',
  },
  rpeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rpeChip: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 36,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  blockHeader: {
    width: '100%',
  },
  blockHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  blockTitle: {
    fontWeight: '600',
  },
  blockSummary: {
    fontWeight: '400',
  },
  hintText: {
    fontWeight: '400',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorTitle: {
    fontWeight: '700',
    textAlign: 'center',
  },
  globalRestTimer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  restTimerPill: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
