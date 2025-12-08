import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../../theme';
import { Card, PraxisButton, Spacer } from '../../components';
import { useUserStore, usePlanStore } from '../../core/store';
import dayjs from 'dayjs';

type MainStackParamList = {
  WorkoutOverview: undefined;
  WorkoutSession: undefined;
};

type NavigationProp = StackNavigationProp<MainStackParamList>;

export default function HomeScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { currentReadiness, personalRecords } = useUserStore();
  const planStore = usePlanStore();

  const todayDate = dayjs().format('YYYY-MM-DD');
  const todayWorkout = useMemo(
    () => planStore.getPlanDayByDate(todayDate),
    [todayDate, planStore]
  );

  // TODO: Get from useSessionStore when implemented
  // Mock weekly consistency data for now
  const weeklyConsistency = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    // TODO: Replace with actual session completion data from useSessionStore
    return days.map((day) => ({
      day,
      status: 'upcoming' as 'completed' | 'missed' | 'upcoming',
    }));
  }, []);

  const getReadinessClassification = (score: number): string => {
    if (score >= 80) return 'High Readiness';
    if (score >= 60) return 'Moderate Readiness';
    return 'Low Readiness';
  };

  const handleViewDetails = () => {
    navigation.navigate('WorkoutOverview');
  };

  const handleStartWorkout = () => {
    navigation.navigate('WorkoutSession');
  };

  const readinessScore = currentReadiness?.readinessScore ?? 75; // TODO: Remove mock when readiness is implemented
  const readinessClassification = getReadinessClassification(readinessScore);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.carbon }]}
      edges={['top']}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { padding: theme.spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Daily Readiness Card */}
        <Card variant="elevated" padding="lg">
          <Text
            style={[
              styles.cardTitle,
              {
                color: theme.colors.white,
                fontFamily: theme.typography.fonts.headingMedium,
                fontSize: theme.typography.sizes.h3,
                marginBottom: theme.spacing.md,
              },
            ]}
          >
            Today's Readiness
          </Text>

          <View style={styles.readinessContent}>
            <Text
              style={[
                styles.readinessScore,
                {
                  color: theme.colors.acidGreen,
                  fontFamily: theme.typography.fonts.heading,
                  fontSize: 56,
                },
              ]}
            >
              {readinessScore}
            </Text>
            <Text
              style={[
                styles.readinessLabel,
                {
                  color: theme.colors.muted,
                  fontFamily: theme.typography.fonts.body,
                  fontSize: theme.typography.sizes.body,
                },
              ]}
            >
              {readinessClassification}
            </Text>
          </View>

          {/* Simple bar visualization placeholder */}
          <View
            style={[
              styles.readinessBar,
              {
                backgroundColor: theme.colors.steel,
                borderRadius: theme.radius.pill,
                height: 6,
                marginTop: theme.spacing.md,
              },
            ]}
          >
            <View
              style={[
                styles.readinessBarFill,
                {
                  backgroundColor: theme.colors.acidGreen,
                  width: `${readinessScore}%`,
                  borderRadius: theme.radius.pill,
                },
              ]}
            />
          </View>
        </Card>

        <Spacer size="lg" />

        {/* Today's Workout Card */}
        <Card variant="elevated" padding="lg">
          <Text
            style={[
              styles.cardTitle,
              {
                color: theme.colors.white,
                fontFamily: theme.typography.fonts.headingMedium,
                fontSize: theme.typography.sizes.h3,
                marginBottom: theme.spacing.md,
              },
            ]}
          >
            Today's Training
          </Text>

          {todayWorkout ? (
            <>
              <View style={styles.workoutInfo}>
                {todayWorkout.focusTags.length > 0 && (
                  <View style={styles.focusTags}>
                    {todayWorkout.focusTags.map((tag, index) => (
                      <Text
                        key={index}
                        style={[
                          styles.tag,
                          {
                            color: theme.colors.acidGreen,
                            fontFamily: theme.typography.fonts.bodyMedium,
                            fontSize: theme.typography.sizes.bodySmall,
                            marginRight:
                              index < todayWorkout.focusTags.length - 1
                                ? theme.spacing.sm
                                : 0,
                          },
                        ]}
                      >
                        {tag}
                        {index < todayWorkout.focusTags.length - 1 ? ' + ' : ''}
                      </Text>
                    ))}
                  </View>
                )}

                <Text
                  style={[
                    styles.duration,
                    {
                      color: theme.colors.muted,
                      fontFamily: theme.typography.fonts.body,
                      fontSize: theme.typography.sizes.body,
                      marginTop: theme.spacing.sm,
                    },
                  ]}
                >
                  {todayWorkout.estimatedDurationMinutes} min
                </Text>

                <View style={styles.blocksList}>
                  {todayWorkout.blocks.map((block, index) => {
                    let blockText = block.title;
                    if (block.strengthMain) {
                      const sets = block.strengthMain.sets.length;
                      blockText = `${block.title} — ${sets}x5 @ RPE 8`;
                    } else if (block.conditioning) {
                      const rounds = block.conditioning.rounds ?? 4;
                      const zone = block.conditioning.targetZone ?? 'Z4';
                      blockText = `${block.title} — ${rounds}x4 @ ${zone}`;
                    }

                    return (
                      <Text
                        key={block.id}
                        style={[
                          styles.blockItem,
                          {
                            color: theme.colors.white,
                            fontFamily: theme.typography.fonts.body,
                            fontSize: theme.typography.sizes.bodySmall,
                          },
                        ]}
                      >
                        • {blockText}
                      </Text>
                    );
                  })}
                </View>
              </View>

              <Spacer size="md" />

              <View style={styles.workoutActions}>
                <PraxisButton
                  title="View Details"
                  onPress={handleViewDetails}
                  variant="outline"
                  size="medium"
                  style={{ flex: 1, marginRight: theme.spacing.sm }}
                />
                <PraxisButton
                  title="Start Workout"
                  onPress={handleStartWorkout}
                  size="medium"
                  style={{ flex: 1, marginLeft: theme.spacing.sm }}
                />
              </View>
            </>
          ) : (
            <Text
              style={[
                styles.emptyText,
                {
                  color: theme.colors.muted,
                  fontFamily: theme.typography.fonts.body,
                  fontSize: theme.typography.sizes.body,
                },
              ]}
            >
              No workout planned for today.
            </Text>
          )}
        </Card>

        <Spacer size="lg" />

        {/* Weekly Consistency Summary */}
        <Card variant="elevated" padding="lg">
          <Text
            style={[
              styles.cardTitle,
              {
                color: theme.colors.white,
                fontFamily: theme.typography.fonts.headingMedium,
                fontSize: theme.typography.sizes.h3,
                marginBottom: theme.spacing.md,
              },
            ]}
          >
            Weekly Consistency
          </Text>

          <View style={styles.consistencyRow}>
            {weeklyConsistency.map((day, index) => {
              let dotColor = theme.colors.graphite;
              if (day.status === 'completed') {
                dotColor = theme.colors.acidGreen;
              } else if (day.status === 'missed') {
                dotColor = theme.colors.danger;
              }

              return (
                <View
                  key={index}
                  style={[
                    styles.consistencyDay,
                    { marginRight: index < 6 ? theme.spacing.md : 0 },
                  ]}
                >
                  <View
                    style={[
                      styles.consistencyDot,
                      {
                        backgroundColor: dotColor,
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.consistencyDayLabel,
                      {
                        color: theme.colors.muted,
                        fontFamily: theme.typography.fonts.body,
                        fontSize: theme.typography.sizes.caption,
                        marginTop: theme.spacing.xs,
                      },
                    ]}
                  >
                    {day.day}
                  </Text>
                </View>
              );
            })}
          </View>
        </Card>

        <Spacer size="lg" />

        {/* Recent PR Highlights */}
        <Card variant="elevated" padding="lg">
          <Text
            style={[
              styles.cardTitle,
              {
                color: theme.colors.white,
                fontFamily: theme.typography.fonts.headingMedium,
                fontSize: theme.typography.sizes.h3,
                marginBottom: theme.spacing.md,
              },
            ]}
          >
            Recent Personal Records
          </Text>

          {personalRecords.length > 0 ? (
            <View style={styles.prList}>
              {personalRecords.slice(0, 3).map((pr) => {
                const changeText =
                  pr.changeFromPrevious && pr.changeFromPrevious > 0
                    ? `+${pr.changeFromPrevious} lb`
                    : 'New Best';

                return (
                  <Text
                    key={pr.id}
                    style={[
                      styles.prItem,
                      {
                        color: theme.colors.white,
                        fontFamily: theme.typography.fonts.body,
                        fontSize: theme.typography.sizes.body,
                      },
                    ]}
                  >
                    {pr.exerciseId}: {changeText}
                  </Text>
                );
              })}
            </View>
          ) : (
            <Text
              style={[
                styles.emptyText,
                {
                  color: theme.colors.muted,
                  fontFamily: theme.typography.fonts.body,
                  fontSize: theme.typography.sizes.body,
                },
              ]}
            >
              No PRs yet. They're coming.
            </Text>
          )}
        </Card>

        <Spacer size="lg" />
      </ScrollView>
    </SafeAreaView>
  );
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
  cardTitle: {
    fontWeight: '600',
  },
  readinessContent: {
    alignItems: 'center',
  },
  readinessScore: {
    fontWeight: '700',
    lineHeight: 64,
  },
  readinessLabel: {
    marginTop: 4,
  },
  readinessBar: {
    overflow: 'hidden',
    width: '100%',
  },
  readinessBarFill: {
    height: '100%',
  },
  workoutInfo: {
    width: '100%',
  },
  focusTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    fontWeight: '500',
  },
  duration: {
    fontWeight: '400',
  },
  blocksList: {
    marginTop: 12,
  },
  blockItem: {
    marginBottom: 6,
    lineHeight: 20,
  },
  workoutActions: {
    flexDirection: 'row',
    width: '100%',
  },
  emptyText: {
    textAlign: 'center',
    fontStyle: 'italic',
  },
  consistencyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  consistencyDay: {
    alignItems: 'center',
    flex: 1,
  },
  consistencyDot: {
    // Size and color set inline
  },
  consistencyDayLabel: {
    textAlign: 'center',
  },
  prList: {
    width: '100%',
  },
  prItem: {
    marginBottom: 8,
    lineHeight: 22,
  },
});
