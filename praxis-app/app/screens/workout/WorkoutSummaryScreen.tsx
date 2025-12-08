import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/theme';
import { Card, IconButton, PraxisButton, Spacer, Chip } from '../../components';
import { usePlanStore } from '../../../src/core/store';
import { detectNewPRs } from '../../../src/engine/progress/detectPRs';
import type {
  WorkoutSessionLog,
  PRRecord,
  CompletedSet,
} from '../../../src/core/types';
import dayjs from 'dayjs';

type MainStackParamList = {
  WorkoutSummary: { session: WorkoutSessionLog } | undefined;
  Home: undefined;
};

type WorkoutSummaryRouteProp = RouteProp<MainStackParamList, 'WorkoutSummary'>;

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
  return exerciseId
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Estimate 1RM using Epley formula (same as in detectPRs)
 */
function estimate1RM(weight: number, reps: number): number | null {
  if (!weight || weight <= 0 || !reps || reps < 1 || reps > 12) {
    return null;
  }
  return weight * (1 + reps / 30);
}

/**
 * Calculate session duration in minutes
 */
function calculateDuration(startedAt: string, endedAt: string): number {
  const start = dayjs(startedAt);
  const end = dayjs(endedAt);
  return Math.round(end.diff(start, 'minute', true));
}

export default function WorkoutSummaryScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<WorkoutSummaryRouteProp>();
  const { session } = route.params || {};

  const { plan } = usePlanStore();

  // Get the workout plan day for context
  const workoutPlan = useMemo(() => {
    if (!session?.planDayId) return null;
    return plan.find((day) => day.id === session.planDayId) || null;
  }, [session, plan]);

  // TODO: integrate PR persistence once backend exists.
  const existingPRs: PRRecord[] = [];

  // Run PR detection
  const { newPRs } = useMemo(() => {
    if (!session) return { newPRs: [] };
    return detectNewPRs({
      session,
      existingPRs,
    });
  }, [session]);

  // Calculate session duration
  const duration = useMemo(() => {
    if (!session?.startedAt || !session?.endedAt) return 0;
    return calculateDuration(session.startedAt, session.endedAt);
  }, [session]);

  // Get exercise name for a set from the plan
  const getExerciseNameForSet = (set: CompletedSet): string => {
    if (!workoutPlan) {
      return formatExerciseName(set.exerciseId);
    }

    // Find the block that contains this exercise
    const block = workoutPlan.blocks.find((b) => b.id === set.blockId);
    if (!block) {
      return formatExerciseName(set.exerciseId);
    }

    // For strength blocks, try to get the exercise name
    if (block.type === 'strength' && block.strengthMain) {
      if (block.strengthMain.exerciseId === set.exerciseId) {
        return formatExerciseName(set.exerciseId);
      }
    }

    return formatExerciseName(set.exerciseId);
  };

  // Group sets by block for display
  const setsByBlock = useMemo(() => {
    if (!session?.completedSets) return new Map<string, CompletedSet[]>();

    const grouped = new Map<string, CompletedSet[]>();
    session.completedSets.forEach((set) => {
      const existing = grouped.get(set.blockId) || [];
      grouped.set(set.blockId, [...existing, set]);
    });

    return grouped;
  }, [session]);

  // Get block title
  const getBlockTitle = (blockId: string): string => {
    if (!workoutPlan) return 'Block';
    const block = workoutPlan.blocks.find((b) => b.id === blockId);
    return block?.title || 'Block';
  };

  const handleFinish = () => {
    navigation.replace('Home');
  };

  // Error state: No session
  if (!session) {
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
            Session not found.
          </Text>
          <PraxisButton
            title="Back to Home"
            onPress={handleFinish}
            size="medium"
          />
        </View>
      </SafeAreaView>
    );
  }

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
          onPress={handleFinish}
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
            Workout Complete
          </Text>
          <Text
            style={[
              styles.headerDate,
              {
                color: theme.colors.muted,
                fontFamily: theme.typography.fonts.body,
                fontSize: theme.typography.sizes.bodySmall,
              },
            ]}
          >
            {formatDate(session.date)}
          </Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { padding: theme.spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* PR Section */}
        {newPRs.length > 0 ? (
          <Card
            variant="elevated"
            padding="lg"
            style={{
              backgroundColor: theme.colors.graphite,
              borderRadius: theme.radius.lg,
              marginBottom: theme.spacing.lg,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: theme.spacing.md,
              }}
            >
              <Text
                style={[
                  styles.sectionTitle,
                  {
                    color: theme.colors.white,
                    fontFamily: theme.typography.fonts.headingMedium,
                    fontSize: theme.typography.sizes.h2,
                  },
                ]}
              >
                New PRs!
              </Text>
              <View
                style={[
                  styles.prBadge,
                  {
                    backgroundColor: theme.colors.acidGreen,
                    marginLeft: theme.spacing.sm,
                    paddingHorizontal: theme.spacing.sm,
                    paddingVertical: 4,
                    borderRadius: theme.radius.sm,
                  },
                ]}
              >
                <Text
                  style={[
                    {
                      color: theme.colors.black,
                      fontFamily: theme.typography.fonts.bodyMedium,
                      fontSize: theme.typography.sizes.bodySmall,
                      fontWeight: '600',
                    },
                  ]}
                >
                  PR
                </Text>
              </View>
            </View>

            {newPRs.map((pr, index) => (
              <View
                key={pr.id}
                style={[
                  styles.prCard,
                  {
                    backgroundColor: theme.colors.graphite,
                    borderRadius: theme.radius.md,
                    padding: theme.spacing.md,
                    borderWidth: 2,
                    borderColor: theme.colors.acidGreen,
                    marginBottom:
                      index < newPRs.length - 1 ? theme.spacing.md : 0,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.prExercise,
                    {
                      color: theme.colors.white,
                      fontFamily: theme.typography.fonts.headingMedium,
                      fontSize: theme.typography.sizes.h3,
                      marginBottom: theme.spacing.xs,
                    },
                  ]}
                >
                  {formatExerciseName(pr.exerciseId)}
                </Text>
                <Text
                  style={[
                    styles.prValue,
                    {
                      color: theme.colors.acidGreen,
                      fontFamily: theme.typography.fonts.heading,
                      fontSize: theme.typography.sizes.h2,
                    },
                  ]}
                >
                  {pr.estimated1RM.toFixed(1)} lb
                </Text>
                {pr.changeFromPrevious !== undefined && (
                  <Text
                    style={[
                      styles.prChange,
                      {
                        color: theme.colors.muted,
                        fontFamily: theme.typography.fonts.body,
                        fontSize: theme.typography.sizes.bodySmall,
                        marginTop: theme.spacing.xs,
                      },
                    ]}
                  >
                    +{pr.changeFromPrevious.toFixed(1)} from previous
                  </Text>
                )}
              </View>
            ))}
          </Card>
        ) : (
          <Card
            variant="elevated"
            padding="lg"
            style={{
              backgroundColor: theme.colors.graphite,
              borderRadius: theme.radius.lg,
              marginBottom: theme.spacing.lg,
            }}
          >
            <Text
              style={[
                styles.emptyText,
                {
                  color: theme.colors.muted,
                  fontFamily: theme.typography.fonts.body,
                  fontSize: theme.typography.sizes.body,
                  textAlign: 'center',
                },
              ]}
            >
              No new PRs today — but every rep counts.
            </Text>
          </Card>
        )}

        {/* Strength Sets */}
        {session.completedSets.length > 0 && (
          <Card
            variant="elevated"
            padding="lg"
            style={{
              backgroundColor: theme.colors.graphite,
              borderRadius: theme.radius.lg,
              marginBottom: theme.spacing.lg,
            }}
          >
            <Text
              style={[
                styles.sectionTitle,
                {
                  color: theme.colors.white,
                  fontFamily: theme.typography.fonts.headingMedium,
                  fontSize: theme.typography.sizes.h3,
                  marginBottom: theme.spacing.md,
                },
              ]}
            >
              Strength Sets
            </Text>

            {Array.from(setsByBlock.entries()).map(([blockId, sets]) => (
              <View key={blockId} style={{ marginBottom: theme.spacing.md }}>
                <Text
                  style={[
                    styles.blockTitle,
                    {
                      color: theme.colors.acidGreen,
                      fontFamily: theme.typography.fonts.bodyMedium,
                      fontSize: theme.typography.sizes.body,
                      marginBottom: theme.spacing.sm,
                    },
                  ]}
                >
                  {getBlockTitle(blockId)}
                </Text>
                {sets.map((set, index) => {
                  const estimated1RM =
                    set.weight && set.reps
                      ? estimate1RM(set.weight, set.reps)
                      : null;

                  return (
                    <View
                      key={index}
                      style={[
                        styles.setRow,
                        {
                          paddingVertical: theme.spacing.sm,
                          borderBottomWidth: index < sets.length - 1 ? 1 : 0,
                          borderBottomColor: theme.colors.steel,
                        },
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.setExercise,
                            {
                              color: theme.colors.white,
                              fontFamily: theme.typography.fonts.bodyMedium,
                              fontSize: theme.typography.sizes.body,
                            },
                          ]}
                        >
                          {getExerciseNameForSet(set)}
                        </Text>
                        <Text
                          style={[
                            styles.setDetails,
                            {
                              color: theme.colors.muted,
                              fontFamily: theme.typography.fonts.body,
                              fontSize: theme.typography.sizes.bodySmall,
                              marginTop: 4,
                            },
                          ]}
                        >
                          {set.reps || '?'} × {set.weight || '?'} lb
                          {set.rpe ? ` @ RPE ${set.rpe}` : ''}
                          {estimated1RM
                            ? ` (Est. 1RM: ${estimated1RM.toFixed(1)} lb)`
                            : ''}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            ))}
          </Card>
        )}

        {/* Conditioning Rounds */}
        {session.conditioningRounds.length > 0 && (
          <Card
            variant="elevated"
            padding="lg"
            style={{
              backgroundColor: theme.colors.graphite,
              borderRadius: theme.radius.lg,
              marginBottom: theme.spacing.lg,
            }}
          >
            <Text
              style={[
                styles.sectionTitle,
                {
                  color: theme.colors.white,
                  fontFamily: theme.typography.fonts.headingMedium,
                  fontSize: theme.typography.sizes.h3,
                  marginBottom: theme.spacing.md,
                },
              ]}
            >
              Conditioning Rounds
            </Text>

            {session.conditioningRounds.map((round, index) => (
              <View
                key={index}
                style={[
                  styles.roundRow,
                  {
                    paddingVertical: theme.spacing.sm,
                    borderBottomWidth:
                      index < session.conditioningRounds.length - 1 ? 1 : 0,
                    borderBottomColor: theme.colors.steel,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.roundLabel,
                    {
                      color: theme.colors.white,
                      fontFamily: theme.typography.fonts.bodyMedium,
                      fontSize: theme.typography.sizes.body,
                      marginBottom: 4,
                    },
                  ]}
                >
                  Round {round.roundIndex + 1}
                </Text>
                <Text
                  style={[
                    styles.roundDetails,
                    {
                      color: theme.colors.muted,
                      fontFamily: theme.typography.fonts.body,
                      fontSize: theme.typography.sizes.bodySmall,
                    },
                  ]}
                >
                  Work: {round.workSeconds}s | Rest: {round.restSeconds}s
                  {round.perceivedIntensity
                    ? ` | PI: ${round.perceivedIntensity}/10`
                    : ''}
                </Text>
              </View>
            ))}
          </Card>
        )}

        {/* Duration */}
        {duration > 0 && (
          <Card
            variant="elevated"
            padding="lg"
            style={{
              backgroundColor: theme.colors.graphite,
              borderRadius: theme.radius.lg,
              marginBottom: theme.spacing.lg,
            }}
          >
            <Text
              style={[
                styles.durationText,
                {
                  color: theme.colors.white,
                  fontFamily: theme.typography.fonts.body,
                  fontSize: theme.typography.sizes.body,
                },
              ]}
            >
              Session duration: {duration} minutes
            </Text>
          </Card>
        )}

        <Spacer size="lg" />
      </ScrollView>

      {/* Finish Button */}
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
          title="Back to Home"
          onPress={handleFinish}
          size="large"
        />
      </View>
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
    fontWeight: '700',
  },
  headerDate: {
    fontWeight: '400',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  sectionTitle: {
    fontWeight: '600',
  },
  prBadge: {
    // Styled inline
  },
  prCard: {
    // Styled inline
  },
  prExercise: {
    fontWeight: '600',
  },
  prValue: {
    fontWeight: '700',
  },
  prChange: {
    fontWeight: '400',
  },
  emptyText: {
    fontWeight: '400',
    fontStyle: 'italic',
  },
  blockTitle: {
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  setRow: {
    width: '100%',
  },
  setExercise: {
    fontWeight: '500',
  },
  setDetails: {
    fontWeight: '400',
  },
  roundRow: {
    width: '100%',
  },
  roundLabel: {
    fontWeight: '500',
  },
  roundDetails: {
    fontWeight: '400',
  },
  durationText: {
    fontWeight: '400',
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
});

// TODO: Persist new PRs into database (Supabase) when backend is connected
// TODO: Add charts or progress trend visualizations
// TODO: Animate PR cards (slide or fade-in)
// TODO: Show weekly progress summary
