import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { Card, PraxisButton, Spacer, IconButton, Chip } from '@/components';
import { useSessionStore, usePlanStore } from '@/core/store';
import type { WorkoutSessionLog } from '@/core/types';
import dayjs from 'dayjs';

type MainStackParamList = {
  ActiveWorkout: { planDayId: string } | undefined;
  WorkoutSummary: { session: WorkoutSessionLog } | undefined;
  Home: undefined;
};

type ActiveWorkoutRouteProp = RouteProp<MainStackParamList, 'ActiveWorkout'>;

type NavigationProp = StackNavigationProp<MainStackParamList>;

/**
 * Format ISO date string to readable format (e.g., "Monday, Feb 12")
 */
function formatDate(dateString: string): string {
  const date = dayjs(dateString);
  return date.format('dddd, MMM D');
}

/**
 * Format exercise ID to readable name
 */
function formatExerciseName(exerciseId: string): string {
  // Simple formatting: replace underscores with spaces and capitalize
  return exerciseId
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function ActiveWorkoutScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ActiveWorkoutRouteProp>();
  const { planDayId } = route.params || {};

  const {
    activeSession,
    isSessionActive,
    logStrengthSet,
    logConditioningRound,
    finishSession,
    startSession,
  } = useSessionStore();

  const { plan } = usePlanStore();

  // Find the workout plan day
  const today = plan.find((day) => day.id === planDayId);

  // Block navigation state
  const [blockIndex, setBlockIndex] = useState(0);

  // Strength set logging state
  const [weight, setWeight] = useState<string>('');
  const [reps, setReps] = useState<string>('');
  const [rpe, setRpe] = useState<string>('');

  // Conditioning round state
  const [roundIndex, setRoundIndex] = useState(0);
  const [perceivedIntensity, setPerceivedIntensity] = useState<string>('');
  const [isConditioningActive, setIsConditioningActive] = useState(false);
  const [conditioningTimer, setConditioningTimer] = useState<number>(0);

  // Accessory completion state
  const [completedAccessoryExercises, setCompletedAccessoryExercises] =
    useState<Set<string>>(new Set());

  // Ensure session is started
  useEffect(() => {
    if (!isSessionActive && planDayId) {
      startSession(planDayId);
    }
  }, [isSessionActive, planDayId, startSession]);

  // Get current block
  const block = today?.blocks[blockIndex];
  const isLastBlock = blockIndex === (today?.blocks.length || 0) - 1;

  // Get completed sets count for current block
  const getCompletedSetsCount = (blockId: string): number => {
    if (!activeSession) return 0;
    return activeSession.completedSets.filter((set) => set.blockId === blockId)
      .length;
  };

  // Get completed rounds count for current block
  const getCompletedRoundsCount = (blockId: string): number => {
    if (!activeSession) return 0;
    return activeSession.conditioningRounds.filter(
      (round) => round.blockId === blockId
    ).length;
  };

  // Handle back navigation
  const handleBack = () => {
    navigation.navigate('Home');
  };

  // Handle next block
  const handleNextBlock = () => {
    if (today && blockIndex < today.blocks.length - 1) {
      setBlockIndex(blockIndex + 1);
      // Reset state for next block
      setWeight('');
      setReps('');
      setRpe('');
      setPerceivedIntensity('');
      setIsConditioningActive(false);
      setRoundIndex(0);
    }
  };

  // Handle log strength set
  const handleLogStrengthSet = () => {
    if (!block || !activeSession || block.type !== 'strength') return;

    const exerciseId = block.strengthMain?.exerciseId;
    if (!exerciseId) return;

    const completedSetsCount = getCompletedSetsCount(block.id);

    logStrengthSet({
      exerciseId,
      blockId: block.id,
      setIndex: completedSetsCount,
      weight: weight ? parseFloat(weight) : undefined,
      reps: reps ? parseInt(reps, 10) : undefined,
      rpe: rpe ? parseFloat(rpe) : undefined,
    });

    // Reset inputs
    setWeight('');
    setReps('');
    setRpe('');

    // Check if all sets are completed
    const targetSets = block.strengthMain?.sets.length || 0;
    if (completedSetsCount + 1 >= targetSets) {
      // All sets completed, can move to next block
    }
  };

  // Handle start conditioning round
  const handleStartConditioningRound = () => {
    setIsConditioningActive(true);
    setConditioningTimer(block?.conditioning?.workSeconds || 0);
  };

  // Handle finish conditioning round
  const handleFinishConditioningRound = () => {
    if (!block || !activeSession || block.type !== 'conditioning') return;

    const completedRoundsCount = getCompletedRoundsCount(block.id);

    logConditioningRound({
      blockId: block.id,
      roundIndex: completedRoundsCount,
      workSeconds: block.conditioning?.workSeconds || 0,
      restSeconds: block.conditioning?.restSeconds || 0,
      perceivedIntensity: perceivedIntensity
        ? parseFloat(perceivedIntensity)
        : undefined,
    });

    setIsConditioningActive(false);
    setPerceivedIntensity('');
    setRoundIndex(completedRoundsCount + 1);

    // Check if all rounds are completed
    const targetRounds = block.conditioning?.rounds || 0;
    if (completedRoundsCount + 1 >= targetRounds) {
      // All rounds completed
    }
  };

  // Handle complete accessory exercise
  const handleCompleteAccessoryExercise = (exerciseId: string) => {
    setCompletedAccessoryExercises(
      new Set(completedAccessoryExercises).add(exerciseId)
    );
  };

  // Handle finish workout
  const handleFinishWorkout = () => {
    const completed = finishSession();
    if (completed) {
      navigation.replace('WorkoutSummary', { session: completed });
    } else {
      navigation.navigate('Home');
    }
  };

  // Error state: Workout not found
  if (!today) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.black }]}
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
                color: theme.colors.white,
                fontFamily: theme.typography.fonts.heading,
                fontSize: theme.typography.sizes.h2,
                marginBottom: theme.spacing.md,
              },
            ]}
          >
            Workout not found.
          </Text>
          <PraxisButton
            title="Back to Home"
            onPress={handleBack}
            size="medium"
          />
        </View>
      </SafeAreaView>
    );
  }

  // Workout complete state
  if (blockIndex >= today.blocks.length) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.black }]}
        edges={['top', 'bottom']}
      >
        <View
          style={[
            styles.completeContainer,
            {
              padding: theme.spacing.xl,
            },
          ]}
        >
          <Text
            style={[
              styles.completeTitle,
              {
                color: theme.colors.white,
                fontFamily: theme.typography.fonts.heading,
                fontSize: theme.typography.sizes.h1,
                marginBottom: theme.spacing.md,
              },
            ]}
          >
            Workout complete.
          </Text>
          <PraxisButton
            title="Finish Workout"
            onPress={handleFinishWorkout}
            size="large"
          />
        </View>
      </SafeAreaView>
    );
  }

  if (!block) {
    return null;
  }

  const completedSetsCount = getCompletedSetsCount(block.id);
  const completedRoundsCount = getCompletedRoundsCount(block.id);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.black }]}
      edges={['top']}
    >
      {/* Header */}
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
          onPress={handleBack}
          variant="ghost"
          size="medium"
        />
        <View style={styles.headerContent}>
          <Text
            style={[
              styles.headerTitle,
              {
                color: theme.colors.white,
                fontFamily: theme.typography.fonts.heading,
                fontSize: theme.typography.sizes.h2,
                marginBottom: theme.spacing.xs,
              },
            ]}
          >
            {formatDate(today.date)}
          </Text>
          {today.focusTags.length > 0 && (
            <View style={styles.focusTagsContainer}>
              {today.focusTags.map((tag, index) => (
                <Chip
                  key={index}
                  label={tag}
                  variant="accent"
                  size="small"
                  style={{ marginRight: theme.spacing.xs }}
                />
              ))}
            </View>
          )}
          <Text
            style={[
              styles.duration,
              {
                color: theme.colors.muted,
                fontFamily: theme.typography.fonts.body,
                fontSize: theme.typography.sizes.bodySmall,
                marginTop: theme.spacing.xs,
              },
            ]}
          >
            {today.estimatedDurationMinutes} min
          </Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { padding: theme.spacing.lg },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Block Title */}
          <Text
            style={[
              styles.blockTitle,
              {
                color: theme.colors.white,
                fontFamily: theme.typography.fonts.headingMedium,
                fontSize: theme.typography.sizes.h2,
                marginBottom: theme.spacing.md,
              },
            ]}
          >
            {block.title}
          </Text>

          {/* Block Type: STRENGTH */}
          {block.type === 'strength' && block.strengthMain && (
            <Card
              variant="elevated"
              padding="lg"
              style={{
                backgroundColor: theme.colors.graphite,
                borderRadius: theme.radius.lg,
              }}
            >
              <Text
                style={[
                  styles.exerciseName,
                  {
                    color: theme.colors.white,
                    fontFamily: theme.typography.fonts.headingMedium,
                    fontSize: theme.typography.sizes.h3,
                    marginBottom: theme.spacing.md,
                  },
                ]}
              >
                {formatExerciseName(block.strengthMain.exerciseId)}
              </Text>

              {block.strengthMain.sets.length > 0 && (
                <Text
                  style={[
                    styles.prescription,
                    {
                      color: theme.colors.muted,
                      fontFamily: theme.typography.fonts.body,
                      fontSize: theme.typography.sizes.body,
                      marginBottom: theme.spacing.lg,
                    },
                  ]}
                >
                  Target: {block.strengthMain.sets.length} ×{' '}
                  {block.strengthMain.sets[0]?.targetReps || '?'} reps
                  {block.strengthMain.sets[0]?.targetPercent1RM
                    ? ` @ ${Math.round(
                        (block.strengthMain.sets[0].targetPercent1RM || 0) * 100
                      )}%`
                    : block.strengthMain.sets[0]?.targetRpe
                      ? ` @ RPE ${block.strengthMain.sets[0].targetRpe}`
                      : ''}
                </Text>
              )}

              <Text
                style={[
                  styles.setCount,
                  {
                    color: theme.colors.acidGreen,
                    fontFamily: theme.typography.fonts.bodyMedium,
                    fontSize: theme.typography.sizes.body,
                    marginBottom: theme.spacing.lg,
                  },
                ]}
              >
                Set {completedSetsCount + 1} of {block.strengthMain.sets.length}
              </Text>

              {/* Input Fields */}
              <View style={styles.inputGroup}>
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
                      borderRadius: theme.radius.md,
                      paddingVertical: theme.spacing.md,
                      paddingHorizontal: theme.spacing.lg,
                    },
                  ]}
                  value={weight}
                  onChangeText={setWeight}
                  placeholder="Enter weight"
                  placeholderTextColor={theme.colors.mutedDark}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
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
                      borderRadius: theme.radius.md,
                      paddingVertical: theme.spacing.md,
                      paddingHorizontal: theme.spacing.lg,
                    },
                  ]}
                  value={reps}
                  onChangeText={setReps}
                  placeholder="Enter reps"
                  placeholderTextColor={theme.colors.mutedDark}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
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
                  RPE
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.colors.graphite,
                      borderColor: theme.colors.steel,
                      color: theme.colors.white,
                      borderRadius: theme.radius.md,
                      paddingVertical: theme.spacing.md,
                      paddingHorizontal: theme.spacing.lg,
                    },
                  ]}
                  value={rpe}
                  onChangeText={setRpe}
                  placeholder="Enter RPE (1-10)"
                  placeholderTextColor={theme.colors.mutedDark}
                  keyboardType="numeric"
                />
              </View>

              <Spacer size="md" />

              <PraxisButton
                title="Log Set"
                onPress={handleLogStrengthSet}
                size="large"
              />

              {completedSetsCount > 0 && (
                <View style={styles.completedIndicator}>
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={theme.colors.acidGreen}
                  />
                  <Text
                    style={[
                      styles.completedText,
                      {
                        color: theme.colors.acidGreen,
                        fontFamily: theme.typography.fonts.bodyMedium,
                        fontSize: theme.typography.sizes.bodySmall,
                        marginLeft: theme.spacing.sm,
                      },
                    ]}
                  >
                    {completedSetsCount} set
                    {completedSetsCount !== 1 ? 's' : ''} logged
                  </Text>
                </View>
              )}

              {completedSetsCount >= block.strengthMain.sets.length && (
                <View style={{ marginTop: theme.spacing.md }}>
                  <PraxisButton
                    title="Next Block"
                    onPress={handleNextBlock}
                    variant="outline"
                    size="medium"
                  />
                </View>
              )}
            </Card>
          )}

          {/* Block Type: CONDITIONING */}
          {block.type === 'conditioning' && block.conditioning && (
            <Card
              variant="elevated"
              padding="lg"
              style={{
                backgroundColor: theme.colors.graphite,
                borderRadius: theme.radius.lg,
              }}
            >
              <Text
                style={[
                  styles.prescription,
                  {
                    color: theme.colors.muted,
                    fontFamily: theme.typography.fonts.body,
                    fontSize: theme.typography.sizes.body,
                    marginBottom: theme.spacing.md,
                  },
                ]}
              >
                {block.conditioning.rounds || '?'} rounds
              </Text>

              <Text
                style={[
                  styles.prescription,
                  {
                    color: theme.colors.white,
                    fontFamily: theme.typography.fonts.body,
                    fontSize: theme.typography.sizes.body,
                    marginBottom: theme.spacing.sm,
                  },
                ]}
              >
                Work: {block.conditioning.workSeconds || '?'}s
              </Text>

              {block.conditioning.restSeconds && (
                <Text
                  style={[
                    styles.prescription,
                    {
                      color: theme.colors.white,
                      fontFamily: theme.typography.fonts.body,
                      fontSize: theme.typography.sizes.body,
                      marginBottom: theme.spacing.sm,
                    },
                  ]}
                >
                  Rest: {block.conditioning.restSeconds}s
                </Text>
              )}

              {block.conditioning.targetZone && (
                <Text
                  style={[
                    styles.prescription,
                    {
                      color: theme.colors.acidGreen,
                      fontFamily: theme.typography.fonts.bodyMedium,
                      fontSize: theme.typography.sizes.body,
                      marginBottom: theme.spacing.lg,
                    },
                  ]}
                >
                  Target: {block.conditioning.targetZone}
                </Text>
              )}

              <Text
                style={[
                  styles.setCount,
                  {
                    color: theme.colors.acidGreen,
                    fontFamily: theme.typography.fonts.bodyMedium,
                    fontSize: theme.typography.sizes.body,
                    marginBottom: theme.spacing.lg,
                  },
                ]}
              >
                Round {completedRoundsCount + 1} of{' '}
                {block.conditioning.rounds || '?'}
              </Text>

              {/* TODO: Replace timers with a proper interval timer component */}
              {isConditioningActive && (
                <View
                  style={[
                    styles.timerContainer,
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
                      styles.timerText,
                      {
                        color: theme.colors.acidGreen,
                        fontFamily: theme.typography.fonts.heading,
                        fontSize: 48,
                      },
                    ]}
                  >
                    {conditioningTimer}s
                  </Text>
                </View>
              )}

              {!isConditioningActive ? (
                <PraxisButton
                  title="Start Round"
                  onPress={handleStartConditioningRound}
                  size="large"
                />
              ) : (
                <>
                  <PraxisButton
                    title="Finish Round"
                    onPress={handleFinishConditioningRound}
                    size="large"
                  />

                  <Spacer size="md" />

                  <View style={styles.inputGroup}>
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
                      Perceived Intensity (1-10)
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: theme.colors.graphite,
                          borderColor: theme.colors.steel,
                          color: theme.colors.white,
                          borderRadius: theme.radius.md,
                          paddingVertical: theme.spacing.md,
                          paddingHorizontal: theme.spacing.lg,
                        },
                      ]}
                      value={perceivedIntensity}
                      onChangeText={setPerceivedIntensity}
                      placeholder="Enter intensity"
                      placeholderTextColor={theme.colors.mutedDark}
                      keyboardType="numeric"
                    />
                  </View>
                </>
              )}

              {completedRoundsCount > 0 && (
                <View style={styles.completedIndicator}>
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={theme.colors.acidGreen}
                  />
                  <Text
                    style={[
                      styles.completedText,
                      {
                        color: theme.colors.acidGreen,
                        fontFamily: theme.typography.fonts.bodyMedium,
                        fontSize: theme.typography.sizes.bodySmall,
                        marginLeft: theme.spacing.sm,
                      },
                    ]}
                  >
                    {completedRoundsCount} round
                    {completedRoundsCount !== 1 ? 's' : ''} logged
                  </Text>
                </View>
              )}

              {completedRoundsCount >= (block.conditioning.rounds || 0) && (
                <View style={{ marginTop: theme.spacing.md }}>
                  <PraxisButton
                    title="Next Block"
                    onPress={handleNextBlock}
                    variant="outline"
                    size="medium"
                  />
                </View>
              )}
            </Card>
          )}

          {/* Block Type: ACCESSORY */}
          {block.type === 'accessory' && block.accessory && (
            <Card
              variant="elevated"
              padding="lg"
              style={{
                backgroundColor: theme.colors.graphite,
                borderRadius: theme.radius.lg,
              }}
            >
              {block.accessory.map((exercise, index) => (
                <View key={index} style={styles.accessoryExercise}>
                  <View style={styles.accessoryExerciseInfo}>
                    <Text
                      style={[
                        styles.exerciseName,
                        {
                          color: theme.colors.white,
                          fontFamily: theme.typography.fonts.bodyMedium,
                          fontSize: theme.typography.sizes.body,
                          marginBottom: theme.spacing.xs,
                        },
                      ]}
                    >
                      {formatExerciseName(exercise.exerciseId)}
                    </Text>
                    <Text
                      style={[
                        styles.prescription,
                        {
                          color: theme.colors.muted,
                          fontFamily: theme.typography.fonts.body,
                          fontSize: theme.typography.sizes.bodySmall,
                        },
                      ]}
                    >
                      {exercise.sets.length} ×{' '}
                      {exercise.sets[0]?.targetReps || '?'} reps
                    </Text>
                  </View>
                  {completedAccessoryExercises.has(exercise.exerciseId) ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={theme.colors.acidGreen}
                    />
                  ) : (
                    <PraxisButton
                      title="Complete"
                      onPress={() =>
                        handleCompleteAccessoryExercise(exercise.exerciseId)
                      }
                      variant="outline"
                      size="small"
                    />
                  )}
                </View>
              ))}

              {/* TODO: Improve accessory tracking (per-movement logging) */}
              <Spacer size="md" />

              <PraxisButton
                title="Next Block"
                onPress={handleNextBlock}
                variant="outline"
                size="medium"
              />
            </Card>
          )}

          {/* Block Type: WARMUP / COOLDOWN */}
          {(block.type === 'warmup' || block.type === 'cooldown') && (
            <Card
              variant="elevated"
              padding="lg"
              style={{
                backgroundColor: theme.colors.graphite,
                borderRadius: theme.radius.lg,
              }}
            >
              {block.type === 'warmup' && block.warmupItems && (
                <View>
                  {block.warmupItems.map((item, index) => (
                    <Text
                      key={index}
                      style={[
                        styles.instructionItem,
                        {
                          color: theme.colors.white,
                          fontFamily: theme.typography.fonts.body,
                          fontSize: theme.typography.sizes.body,
                          marginBottom:
                            index < block.warmupItems!.length - 1
                              ? theme.spacing.sm
                              : 0,
                        },
                      ]}
                    >
                      • {item}
                    </Text>
                  ))}
                </View>
              )}

              {block.type === 'cooldown' && block.cooldownItems && (
                <View>
                  {block.cooldownItems.map((item, index) => (
                    <Text
                      key={index}
                      style={[
                        styles.instructionItem,
                        {
                          color: theme.colors.white,
                          fontFamily: theme.typography.fonts.body,
                          fontSize: theme.typography.sizes.body,
                          marginBottom:
                            index < block.cooldownItems!.length - 1
                              ? theme.spacing.sm
                              : 0,
                        },
                      ]}
                    >
                      • {item}
                    </Text>
                  ))}
                </View>
              )}

              <Spacer size="md" />

              <PraxisButton
                title="Next Block"
                onPress={handleNextBlock}
                variant="outline"
                size="medium"
              />
            </Card>
          )}

          <Spacer size="xl" />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer: Finish Workout */}
      {isLastBlock && (
        <View
          style={[
            styles.footer,
            {
              padding: theme.spacing.lg,
              borderTopWidth: 1,
              borderTopColor: theme.colors.steel,
            },
          ]}
        >
          <PraxisButton
            title="Finish Workout"
            onPress={handleFinishWorkout}
            size="large"
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
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
    fontWeight: '700',
  },
  focusTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 4,
  },
  duration: {
    fontWeight: '400',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  blockTitle: {
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  exerciseName: {
    fontWeight: '600',
  },
  prescription: {
    fontWeight: '400',
  },
  setCount: {
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    fontFamily: 'System', // TODO: Use theme font
  },
  completedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  completedText: {
    fontWeight: '500',
  },
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontWeight: '700',
  },
  accessoryExercise: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  accessoryExerciseInfo: {
    flex: 1,
  },
  instructionItem: {
    lineHeight: 22,
  },
  footer: {
    width: '100%',
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
  completeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeTitle: {
    fontWeight: '700',
    textAlign: 'center',
  },
});
