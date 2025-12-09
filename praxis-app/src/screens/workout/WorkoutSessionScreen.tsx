import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme';
import { PraxisButton, IconButton, Spacer } from '../../components';
import { usePlanStore, useSessionStore } from '../../../core/store';
import type { WorkoutBlock } from '../../../core/types';
import dayjs from 'dayjs';

type MainStackParamList = {
  WorkoutSummary: undefined;
};

type NavigationProp = StackNavigationProp<MainStackParamList>;

type BlockType =
  | 'warmup'
  | 'strength'
  | 'accessory'
  | 'conditioning'
  | 'cooldown';

// TODO: Replace with actual exercise names from exercise definitions
const getExerciseName = (exerciseId: string): string => {
  const exerciseNames: Record<string, string> = {
    back_squat: 'Back Squat',
    bench_press: 'Bench Press',
    deadlift: 'Deadlift',
    rdl: 'RDL',
    hanging_knee_raise: 'Hanging Knee Raise',
  };
  return exerciseNames[exerciseId] || exerciseId;
};

export default function WorkoutSessionScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const planStore = usePlanStore();
  const { addCompletedSet } = useSessionStore();

  const todayDate = dayjs().format('YYYY-MM-DD');
  const workoutPlan = useMemo(
    () => planStore.getPlanDayByDate(todayDate),
    [todayDate, planStore]
  );

  // Session state
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [strengthWeight, setStrengthWeight] = useState<string>('');
  const [strengthReps, setStrengthReps] = useState<string>('');
  const [selectedRPE, setSelectedRPE] = useState<number | null>(null);
  const [completedAccessorySets, setCompletedAccessorySets] = useState<
    Set<number>
  >(new Set());
  const [isRestTimerVisible, setIsRestTimerVisible] = useState(false);
  const [restTimerSeconds, setRestTimerSeconds] = useState(0);
  const [conditioningTimerSeconds, setConditioningTimerSeconds] = useState(0);
  const [isConditioningWorkPhase, setIsConditioningWorkPhase] = useState(true);
  const [completedConditioningRounds, setCompletedConditioningRounds] =
    useState<Set<number>>(new Set());

  const blocks = workoutPlan?.blocks || [];
  const currentBlock = blocks[currentBlockIndex];

  // Filter out warmup and cooldown for navigation (or include them - let's include)
  const navigationBlocks = blocks.filter(
    (b) =>
      b.type === 'strength' ||
      b.type === 'accessory' ||
      b.type === 'conditioning' ||
      b.type === 'cooldown'
  );

  // Rest timer logic
  useEffect(() => {
    if (!isRestTimerVisible || restTimerSeconds <= 0) return;

    const interval = setInterval(() => {
      setRestTimerSeconds((prev) => {
        if (prev <= 1) {
          setIsRestTimerVisible(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRestTimerVisible, restTimerSeconds]);

  // Initialize conditioning timer when entering conditioning block
  useEffect(() => {
    if (currentBlock?.type === 'conditioning' && currentBlock.conditioning) {
      setConditioningTimerSeconds(currentBlock.conditioning.workSeconds || 240);
      setIsConditioningWorkPhase(true);
    }
  }, [currentBlockIndex, currentBlock]);

  // Conditioning timer logic
  useEffect(() => {
    if (
      currentBlock?.type !== 'conditioning' ||
      !currentBlock.conditioning ||
      completedConditioningRounds.has(currentRoundIndex)
    )
      return;

    const interval = setInterval(() => {
      setConditioningTimerSeconds((prev) => {
        if (prev <= 1) {
          if (isConditioningWorkPhase) {
            // Switch to rest phase
            setIsConditioningWorkPhase(false);
            return currentBlock.conditioning?.restSeconds || 120;
          } else {
            // Complete round, move to next
            return 0;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [
    currentBlock,
    conditioningTimerSeconds,
    isConditioningWorkPhase,
    currentRoundIndex,
    completedConditioningRounds,
  ]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCompleteStrengthSet = () => {
    if (!currentBlock || !selectedRPE) return;

    // TODO: Save to useSessionStore.addCompletedSet()
    const completedSet = {
      exerciseId: currentBlock.strengthMain?.exerciseId || '',
      blockId: currentBlock.id,
      setIndex: currentSetIndex,
      weight: strengthWeight ? parseFloat(strengthWeight) : undefined,
      reps: strengthReps ? parseInt(strengthReps, 10) : undefined,
      rpe: selectedRPE,
      completedAt: new Date().toISOString(),
    };
    // addCompletedSet(completedSet);

    const totalSets = currentBlock.strengthMain?.sets.length || 0;
    if (currentSetIndex < totalSets - 1) {
      // Start rest timer
      const restSeconds = 60; // TODO: Get from block/set prescription
      setRestTimerSeconds(restSeconds);
      setIsRestTimerVisible(true);
      setCurrentSetIndex(currentSetIndex + 1);
      setStrengthWeight('');
      setStrengthReps('');
      setSelectedRPE(null);
    } else {
      // All sets complete, move to next block
      moveToNextBlock();
    }
  };

  const handleCompleteAccessorySet = (setIndex: number) => {
    const newCompleted = new Set(completedAccessorySets);
    newCompleted.add(setIndex);
    setCompletedAccessorySets(newCompleted);

    const totalSets = currentBlock?.accessory?.[0]?.sets.length || 0;
    if (newCompleted.size >= totalSets) {
      // All accessory sets complete
      setTimeout(() => moveToNextBlock(), 500);
    }
  };

  const handleCompleteConditioningRound = () => {
    const newCompleted = new Set(completedConditioningRounds);
    newCompleted.add(currentRoundIndex);
    setCompletedConditioningRounds(newCompleted);

    const totalRounds = currentBlock?.conditioning?.rounds || 4;
    if (newCompleted.size >= totalRounds) {
      // All rounds complete, move to next block
      moveToNextBlock();
    } else {
      // Start next round
      setCurrentRoundIndex(currentRoundIndex + 1);
      setIsConditioningWorkPhase(true);
      setConditioningTimerSeconds(
        currentBlock?.conditioning?.workSeconds || 240
      );
    }
  };

  const handleCompleteCooldown = () => {
    // Navigate to summary
    navigation.navigate('WorkoutSummary');
  };

  const moveToNextBlock = () => {
    if (currentBlockIndex < blocks.length - 1) {
      setCurrentBlockIndex(currentBlockIndex + 1);
      setCurrentSetIndex(0);
      setCurrentRoundIndex(0);
      setCompletedAccessorySets(new Set());
      setCompletedConditioningRounds(new Set());
      setStrengthWeight('');
      setStrengthReps('');
      setSelectedRPE(null);
    } else {
      // All blocks complete, navigate to summary
      navigation.navigate('WorkoutSummary');
    }
  };

  const handleSkipRest = () => {
    setIsRestTimerVisible(false);
    setRestTimerSeconds(0);
  };

  const handleAddRestTime = () => {
    setRestTimerSeconds((prev) => prev + 30);
  };

  const handleBlockNavigation = (blockType: BlockType) => {
    const targetIndex = blocks.findIndex((b) => b.type === blockType);
    if (targetIndex !== -1) {
      setCurrentBlockIndex(targetIndex);
      setCurrentSetIndex(0);
      setCurrentRoundIndex(0);
    }
  };

  const renderStrengthUI = () => {
    if (!currentBlock?.strengthMain) return null;

    const totalSets = currentBlock.strengthMain.sets.length;
    const currentSet = currentBlock.strengthMain.sets[currentSetIndex];
    const targetRPE = currentSet.targetRpe || 8;

    return (
      <View style={styles.blockContent}>
        <Text
          style={[
            styles.setTitle,
            {
              color: theme.colors.white,
              fontFamily: theme.typography.fonts.headingMedium,
              fontSize: theme.typography.sizes.h3,
              marginBottom: theme.spacing.xl,
            },
          ]}
        >
          SET {currentSetIndex + 1} OF {totalSets}
        </Text>

        <View style={styles.inputRow}>
          <View style={{ flex: 1, marginRight: theme.spacing.sm }}>
            <Text
              style={[
                styles.inputLabel,
                {
                  color: theme.colors.muted,
                  fontFamily: theme.typography.fonts.bodyMedium,
                  fontSize: theme.typography.sizes.bodySmall,
                  marginBottom: theme.spacing.sm,
                },
              ]}
            >
              Weight
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.graphite,
                  borderColor: theme.colors.steel,
                  color: theme.colors.white,
                  fontFamily: theme.typography.fonts.body,
                  fontSize: theme.typography.sizes.body,
                  borderRadius: theme.radius.md,
                  paddingVertical: theme.spacing.md,
                  paddingHorizontal: theme.spacing.lg,
                },
              ]}
              value={strengthWeight}
              onChangeText={setStrengthWeight}
              placeholder="0"
              placeholderTextColor={theme.colors.mutedDark}
              keyboardType="numeric"
            />
          </View>

          <View style={{ flex: 1, marginLeft: theme.spacing.sm }}>
            <Text
              style={[
                styles.inputLabel,
                {
                  color: theme.colors.muted,
                  fontFamily: theme.typography.fonts.bodyMedium,
                  fontSize: theme.typography.sizes.bodySmall,
                  marginBottom: theme.spacing.sm,
                },
              ]}
            >
              Reps
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.graphite,
                  borderColor: theme.colors.steel,
                  color: theme.colors.white,
                  fontFamily: theme.typography.fonts.body,
                  fontSize: theme.typography.sizes.body,
                  borderRadius: theme.radius.md,
                  paddingVertical: theme.spacing.md,
                  paddingHorizontal: theme.spacing.lg,
                },
              ]}
              value={strengthReps}
              onChangeText={setStrengthReps}
              placeholder="0"
              placeholderTextColor={theme.colors.mutedDark}
              keyboardType="numeric"
            />
          </View>
        </View>

        <Spacer size="lg" />

        <Text
          style={[
            styles.inputLabel,
            {
              color: theme.colors.muted,
              fontFamily: theme.typography.fonts.bodyMedium,
              fontSize: theme.typography.sizes.bodySmall,
              marginBottom: theme.spacing.md,
            },
          ]}
        >
          RPE
        </Text>
        <View style={styles.rpeRow}>
          {[6, 7, 8, 9, 10].map((rpe) => (
            <View
              key={rpe}
              style={{
                flex: 1,
                marginRight: rpe < 10 ? theme.spacing.sm : 0,
              }}
            >
              <PraxisButton
                title={rpe.toString()}
                onPress={() => setSelectedRPE(rpe)}
                variant={selectedRPE === rpe ? 'primary' : 'secondary'}
                size="medium"
              />
            </View>
          ))}
        </View>

        <Spacer size="xl" />

        <PraxisButton
          title="Complete Set"
          onPress={handleCompleteStrengthSet}
          size="large"
          disabled={!selectedRPE}
        />
      </View>
    );
  };

  const renderAccessoryUI = () => {
    if (!currentBlock?.accessory || currentBlock.accessory.length === 0)
      return null;

    const exercise = currentBlock.accessory[0];
    const totalSets = exercise.sets.length;

    return (
      <View style={styles.blockContent}>
        <Text
          style={[
            styles.blockTitle,
            {
              color: theme.colors.white,
              fontFamily: theme.typography.fonts.headingMedium,
              fontSize: theme.typography.sizes.h3,
              marginBottom: theme.spacing.xl,
            },
          ]}
        >
          ACCESSORY — {getExerciseName(exercise.exerciseId).toUpperCase()}
        </Text>

        {exercise.sets.map((_, index) => (
          <View
            key={index}
            style={[
              styles.accessorySetRow,
              {
                backgroundColor: theme.colors.graphite,
                borderRadius: theme.radius.md,
                padding: theme.spacing.lg,
                marginBottom: theme.spacing.md,
              },
            ]}
          >
            <Text
              style={[
                styles.accessorySetText,
                {
                  color: completedAccessorySets.has(index)
                    ? theme.colors.acidGreen
                    : theme.colors.white,
                  fontFamily: theme.typography.fonts.bodyMedium,
                  fontSize: theme.typography.sizes.body,
                },
              ]}
            >
              Set {index + 1}
              {completedAccessorySets.has(index) && (
                <Text style={{ marginLeft: theme.spacing.sm }}>✓</Text>
              )}
            </Text>
            {!completedAccessorySets.has(index) && (
              <PraxisButton
                title="Complete"
                onPress={() => handleCompleteAccessorySet(index)}
                variant="outline"
                size="small"
              />
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderConditioningUI = () => {
    if (!currentBlock?.conditioning) return null;

    const totalRounds = currentBlock.conditioning.rounds || 4;
    const isComplete = completedConditioningRounds.has(currentRoundIndex);

    return (
      <View style={styles.blockContent}>
        <Text
          style={[
            styles.roundTitle,
            {
              color: theme.colors.white,
              fontFamily: theme.typography.fonts.headingMedium,
              fontSize: theme.typography.sizes.h3,
              marginBottom: theme.spacing.xl,
            },
          ]}
        >
          Round {currentRoundIndex + 1} of {totalRounds}
        </Text>

        <View
          style={[
            styles.conditioningTimerContainer,
            {
              backgroundColor: isConditioningWorkPhase
                ? theme.colors.acidGreen
                : theme.colors.graphite,
              borderRadius: theme.radius.xl,
              padding: theme.spacing.xxxl,
              marginBottom: theme.spacing.xl,
            },
          ]}
        >
          <Text
            style={[
              styles.conditioningPhase,
              {
                color: isConditioningWorkPhase
                  ? theme.colors.black
                  : theme.colors.white,
                fontFamily: theme.typography.fonts.heading,
                fontSize: theme.typography.sizes.h1,
                marginBottom: theme.spacing.md,
              },
            ]}
          >
            {isConditioningWorkPhase ? 'WORK' : 'REST'}
          </Text>
          <Text
            style={[
              styles.conditioningTimer,
              {
                color: isConditioningWorkPhase
                  ? theme.colors.black
                  : theme.colors.white,
                fontFamily: theme.typography.fonts.heading,
                fontSize: 48,
              },
            ]}
          >
            {formatTime(conditioningTimerSeconds)}
          </Text>
          {isConditioningWorkPhase && currentBlock.conditioning?.targetZone && (
            <Text
              style={[
                styles.conditioningZone,
                {
                  color: theme.colors.black,
                  fontFamily: theme.typography.fonts.bodyMedium,
                  fontSize: theme.typography.sizes.body,
                  marginTop: theme.spacing.md,
                },
              ]}
            >
              {currentBlock.conditioning.targetZone} — Push Hard
            </Text>
          )}
        </View>

        {isConditioningWorkPhase && (
          <Text
            style={[
              styles.conditioningSubtext,
              {
                color: theme.colors.muted,
                fontFamily: theme.typography.fonts.body,
                fontSize: theme.typography.sizes.body,
                marginBottom: theme.spacing.lg,
              },
            ]}
          >
            {formatTime(conditioningTimerSeconds)} remaining
          </Text>
        )}

        {!isConditioningWorkPhase && (
          <Text
            style={[
              styles.conditioningSubtext,
              {
                color: theme.colors.muted,
                fontFamily: theme.typography.fonts.body,
                fontSize: theme.typography.sizes.body,
                marginBottom: theme.spacing.lg,
              },
            ]}
          >
            {formatTime(conditioningTimerSeconds)} remaining
          </Text>
        )}

        {isConditioningWorkPhase && (
          <PraxisButton
            title="End Round Early"
            onPress={handleCompleteConditioningRound}
            variant="outline"
            size="medium"
            style={{ marginBottom: theme.spacing.md }}
          />
        )}

        {currentRoundIndex === totalRounds - 1 && !isConditioningWorkPhase && (
          <PraxisButton
            title="Finish Conditioning"
            onPress={handleCompleteConditioningRound}
            size="large"
          />
        )}
      </View>
    );
  };

  const renderCooldownUI = () => {
    return (
      <View style={styles.blockContent}>
        <Text
          style={[
            styles.blockTitle,
            {
              color: theme.colors.white,
              fontFamily: theme.typography.fonts.headingMedium,
              fontSize: theme.typography.sizes.h3,
              marginBottom: theme.spacing.xl,
            },
          ]}
        >
          COOLDOWN
        </Text>

        {currentBlock?.cooldownItems &&
        currentBlock.cooldownItems.length > 0 ? (
          currentBlock.cooldownItems.map((item, index) => (
            <Text
              key={index}
              style={[
                styles.cooldownItem,
                {
                  color: theme.colors.white,
                  fontFamily: theme.typography.fonts.body,
                  fontSize: theme.typography.sizes.body,
                  marginBottom: theme.spacing.md,
                },
              ]}
            >
              • {item}
            </Text>
          ))
        ) : (
          <Text
            style={[
              styles.cooldownItem,
              {
                color: theme.colors.muted,
                fontFamily: theme.typography.fonts.body,
                fontSize: theme.typography.sizes.body,
                marginBottom: theme.spacing.xl,
              },
            ]}
          >
            Complete your cooldown routine.
          </Text>
        )}

        <PraxisButton
          title="Complete Cooldown"
          onPress={handleCompleteCooldown}
          size="large"
        />
      </View>
    );
  };

  const renderCurrentBlockUI = () => {
    if (!currentBlock) return null;

    switch (currentBlock.type) {
      case 'strength':
        return renderStrengthUI();
      case 'accessory':
        return renderAccessoryUI();
      case 'conditioning':
        return renderConditioningUI();
      case 'cooldown':
        return renderCooldownUI();
      default:
        return null;
    }
  };

  const getExerciseNameFromBlock = (): string => {
    if (!currentBlock) return '';
    if (currentBlock.strengthMain?.exerciseId) {
      return getExerciseName(currentBlock.strengthMain.exerciseId);
    }
    if (currentBlock.accessory && currentBlock.accessory.length > 0) {
      return getExerciseName(currentBlock.accessory[0].exerciseId);
    }
    return currentBlock.title;
  };

  const getSetInfo = (): string => {
    if (!currentBlock) return '';
    if (currentBlock.type === 'strength' && currentBlock.strengthMain) {
      const totalSets = currentBlock.strengthMain.sets.length;
      const currentSet = currentBlock.strengthMain.sets[currentSetIndex];
      const targetRPE = currentSet.targetRpe || 8;
      return `Set ${currentSetIndex + 1} of ${totalSets} — Target RPE ${targetRPE}`;
    }
    return '';
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.black }]}
      edges={['top']}
    >
      {/* Exercise Header Bar */}
      <View
        style={[
          styles.header,
          {
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.steel,
          },
        ]}
      >
        <IconButton
          icon={
            <Ionicons name="arrow-back" size={24} color={theme.colors.white} />
          }
          onPress={() => navigation.goBack()}
          variant="ghost"
          size="medium"
        />
        <View style={styles.headerContent}>
          <Text
            style={[
              styles.headerTitle,
              {
                color: theme.colors.white,
                fontFamily: theme.typography.fonts.headingMedium,
                fontSize: theme.typography.sizes.h2,
              },
            ]}
          >
            {getExerciseNameFromBlock()}
          </Text>
          {currentBlock?.type === 'strength' && (
            <Text
              style={[
                styles.headerSubtext,
                {
                  color: theme.colors.muted,
                  fontFamily: theme.typography.fonts.body,
                  fontSize: theme.typography.sizes.bodySmall,
                },
              ]}
            >
              {getSetInfo()}
            </Text>
          )}
        </View>
        <View style={{ width: 44 }} />
      </View>

      {/* Main Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { padding: theme.spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {renderCurrentBlockUI()}
      </ScrollView>

      {/* Block Navigation Row */}
      <View
        style={[
          styles.blockNav,
          {
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.md,
            borderTopWidth: 1,
            borderTopColor: theme.colors.steel,
          },
        ]}
      >
        {navigationBlocks.map((block, index) => {
          const isActive = block.id === currentBlock?.id;
          const blockIcon: keyof typeof Ionicons.glyphMap =
            block.type === 'strength'
              ? 'barbell'
              : block.type === 'accessory'
                ? 'fitness'
                : block.type === 'conditioning'
                  ? 'flash'
                  : 'checkmark-circle';

          return (
            <View
              key={block.id}
              style={[
                styles.blockNavItem,
                {
                  marginRight:
                    index < navigationBlocks.length - 1 ? theme.spacing.md : 0,
                },
              ]}
            >
              <View
                style={[
                  styles.blockNavDot,
                  {
                    backgroundColor: isActive
                      ? theme.colors.acidGreen
                      : theme.colors.graphite,
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                  },
                ]}
              >
                <Ionicons
                  name={blockIcon}
                  size={20}
                  color={isActive ? theme.colors.black : theme.colors.white}
                />
              </View>
              <Text
                style={[
                  styles.blockNavLabel,
                  {
                    color: isActive
                      ? theme.colors.acidGreen
                      : theme.colors.muted,
                    fontFamily: theme.typography.fonts.bodyMedium,
                    fontSize: theme.typography.sizes.caption,
                    marginTop: theme.spacing.xs,
                  },
                ]}
              >
                {block.type.charAt(0).toUpperCase() + block.type.slice(1)}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Rest Timer Modal */}
      <Modal
        visible={isRestTimerVisible}
        transparent
        animationType="fade"
        onRequestClose={handleSkipRest}
      >
        <View
          style={[
            styles.modalOverlay,
            { backgroundColor: 'rgba(0, 0, 0, 0.8)' },
          ]}
        >
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.colors.graphite,
                borderRadius: theme.radius.xl,
                padding: theme.spacing.xxxl,
              },
            ]}
          >
            <Text
              style={[
                styles.modalTitle,
                {
                  color: theme.colors.white,
                  fontFamily: theme.typography.fonts.heading,
                  fontSize: theme.typography.sizes.h1,
                  marginBottom: theme.spacing.xl,
                },
              ]}
            >
              REST
            </Text>

            <View
              style={[
                styles.restTimerCircle,
                {
                  width: 200,
                  height: 200,
                  borderRadius: 100,
                  borderWidth: 4,
                  borderColor: theme.colors.acidGreen,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: theme.spacing.xl,
                },
              ]}
            >
              <Text
                style={[
                  styles.restTimerText,
                  {
                    color: theme.colors.acidGreen,
                    fontFamily: theme.typography.fonts.heading,
                    fontSize: 48,
                  },
                ]}
              >
                {formatTime(restTimerSeconds)}
              </Text>
            </View>

            {currentBlock?.strengthMain && (
              <Text
                style={[
                  styles.modalSubtext,
                  {
                    color: theme.colors.muted,
                    fontFamily: theme.typography.fonts.body,
                    fontSize: theme.typography.sizes.body,
                    marginBottom: theme.spacing.xl,
                  },
                ]}
              >
                Next: Set {currentSetIndex + 1} —{' '}
                {currentBlock.strengthMain.sets[currentSetIndex]?.targetReps ||
                  3}{' '}
                reps @ RPE{' '}
                {currentBlock.strengthMain.sets[currentSetIndex]?.targetRpe ||
                  8}
              </Text>
            )}

            <View style={styles.modalActions}>
              <PraxisButton
                title="Skip Rest"
                onPress={handleSkipRest}
                variant="outline"
                size="medium"
                style={{ flex: 1, marginRight: theme.spacing.sm }}
              />
              <PraxisButton
                title="Add 30 sec"
                onPress={handleAddRestTime}
                variant="secondary"
                size="medium"
                style={{ flex: 1, marginLeft: theme.spacing.sm }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  headerSubtext: {
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  blockContent: {
    width: '100%',
  },
  setTitle: {
    fontWeight: '600',
    textAlign: 'center',
  },
  blockTitle: {
    fontWeight: '600',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  roundTitle: {
    fontWeight: '600',
    textAlign: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    width: '100%',
  },
  inputLabel: {
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
  },
  rpeRow: {
    flexDirection: 'row',
    width: '100%',
  },
  accessorySetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  accessorySetText: {
    fontWeight: '500',
  },
  conditioningTimerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  conditioningPhase: {
    fontWeight: '700',
    textAlign: 'center',
  },
  conditioningTimer: {
    fontWeight: '700',
    textAlign: 'center',
  },
  conditioningZone: {
    fontWeight: '500',
    textAlign: 'center',
  },
  conditioningSubtext: {
    textAlign: 'center',
  },
  cooldownItem: {
    lineHeight: 22,
  },
  blockNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  blockNavItem: {
    alignItems: 'center',
    flex: 1,
  },
  blockNavDot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockNavLabel: {
    fontWeight: '500',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalTitle: {
    fontWeight: '700',
    textAlign: 'center',
  },
  restTimerCircle: {
    borderStyle: 'solid',
  },
  restTimerText: {
    fontWeight: '700',
  },
  modalSubtext: {
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    width: '100%',
  },
});
