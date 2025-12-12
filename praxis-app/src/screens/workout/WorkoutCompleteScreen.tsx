import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@theme';
import { Card, PraxisButton, Spacer, Chip } from '@components';
import { useWorkoutSessionStore } from '@/store/workoutSessionStore';
import { useWorkoutHistoryStore } from '@/store/workoutHistoryStore';
import { usePerformanceStore } from '@/store/performanceStore';
import { WorkoutRecord } from '@/types/workout';

/**
 * Format duration in minutes to readable format
 */
function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

/**
 * Format seconds to readable format
 */
function formatSeconds(seconds: number | null): string {
  if (seconds === null) return '—';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
}

export default function WorkoutCompleteScreen() {
  const theme = useTheme();
  const { session, resetSession } = useWorkoutSessionStore();
  const { getWorkouts } = useWorkoutHistoryStore();
  const { clearSession: clearPerformanceSession, clearSessionSuggestions } = usePerformanceStore();
  const adjustmentMetadata = session.adjustmentMetadata;

  // Get the most recent workout from history
  const latestWorkout = useMemo(() => {
    const workouts = getWorkouts();
    if (workouts.length === 0) return null;
    // Return the most recent workout (last in array)
    return workouts[workouts.length - 1];
  }, [getWorkouts]);

  // Reset session after component mounts (to allow next workout to start fresh)
  useEffect(() => {
    // Reset session after component has rendered
    // This ensures the summary is visible before resetting
    const timer = setTimeout(() => {
      resetSession();
      clearPerformanceSession(); // Clear performance events when workout ends
      clearSessionSuggestions(); // Clear suggestions when workout ends
    }, 100);

    return () => clearTimeout(timer);
  }, [resetSession, clearPerformanceSession, clearSessionSuggestions]);

  const handleReturnToToday = () => {
    router.replace('/today');
  };

  const handleViewProgress = () => {
    router.push('/progress');
  };

  // If no workout record found, show fallback
  if (!latestWorkout) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.appBg }]}
        edges={['top', 'bottom']}
      >
        <View
          style={[
            styles.content,
            {
              padding: theme.spacing.lg,
            },
          ]}
        >
          <Card variant="elevated" padding="lg">
            <Text
              style={[
                styles.title,
                {
                  color: theme.colors.textPrimary,
                  fontFamily: theme.typography.fonts.heading,
                  fontSize: theme.typography.sizes.h2,
                  marginBottom: theme.spacing.lg,
                  textAlign: 'center',
                },
              ]}
            >
              Workout Complete!
            </Text>
            <Text
              style={[
                styles.errorText,
                {
                  color: theme.colors.textMuted,
                  fontFamily: theme.typography.fonts.body,
                  fontSize: theme.typography.sizes.body,
                  marginBottom: theme.spacing.xl,
                  textAlign: 'center',
                },
              ]}
            >
              Workout data not available.
            </Text>
            <PraxisButton
              title="Return to Today"
              onPress={handleReturnToToday}
              size="large"
            />
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.appBg }]}
      edges={['top', 'bottom']}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { padding: theme.spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Summary Card */}
        <Card variant="elevated" padding="lg">
          <Text
            style={[
              styles.title,
              {
                color: theme.colors.textPrimary,
                fontFamily: theme.typography.fonts.heading,
                fontSize: theme.typography.sizes.h2,
                marginBottom: theme.spacing.md,
                textAlign: 'center',
              },
            ]}
          >
            Workout Complete!
          </Text>

          {/* Adjustment Badge */}
          {adjustmentMetadata && (
            <View style={styles.adjustmentBadgeContainer}>
              <Chip
                label="Adjusted Today"
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
            </View>
          )}

          <Spacer size="md" />

          {/* Duration */}
          <View style={styles.summaryRow}>
            <Text
              style={[
                styles.label,
                {
                  color: theme.colors.textMuted,
                  fontFamily: theme.typography.fonts.bodyMedium,
                  fontSize: theme.typography.sizes.body,
                },
              ]}
            >
              Duration:
            </Text>
            <Text
              style={[
                styles.value,
                {
                  color: theme.colors.textPrimary,
                  fontFamily: theme.typography.fonts.bodyMedium,
                  fontSize: theme.typography.sizes.body,
                },
              ]}
            >
              {formatDuration(latestWorkout.durationMin)}
            </Text>
          </View>

          <Spacer size="sm" />

          {/* Total Volume */}
          <View style={styles.summaryRow}>
            <Text
              style={[
                styles.label,
                {
                  color: theme.colors.textMuted,
                  fontFamily: theme.typography.fonts.bodyMedium,
                  fontSize: theme.typography.sizes.body,
                },
              ]}
            >
              Total Volume:
            </Text>
            <Text
              style={[
                styles.value,
                {
                  color: theme.colors.textPrimary,
                  fontFamily: theme.typography.fonts.bodyMedium,
                  fontSize: theme.typography.sizes.body,
                },
              ]}
            >
              {latestWorkout.totalVolume.toLocaleString()} lbs
            </Text>
          </View>

          <Spacer size="sm" />

          {/* Avg RPE */}
          <View style={styles.summaryRow}>
            <Text
              style={[
                styles.label,
                {
                  color: theme.colors.textMuted,
                  fontFamily: theme.typography.fonts.bodyMedium,
                  fontSize: theme.typography.sizes.body,
                },
              ]}
            >
              Avg RPE:
            </Text>
            <Text
              style={[
                styles.value,
                {
                  color: theme.colors.textPrimary,
                  fontFamily: theme.typography.fonts.bodyMedium,
                  fontSize: theme.typography.sizes.body,
                },
              ]}
            >
              {latestWorkout.avgRpe !== null ? latestWorkout.avgRpe.toFixed(1) : '—'}
            </Text>
          </View>

          <Spacer size="sm" />

          {/* Avg Rest */}
          <View style={styles.summaryRow}>
            <Text
              style={[
                styles.label,
                {
                  color: theme.colors.textMuted,
                  fontFamily: theme.typography.fonts.bodyMedium,
                  fontSize: theme.typography.sizes.body,
                },
              ]}
            >
              Avg Rest:
            </Text>
            <Text
              style={[
                styles.value,
                {
                  color: theme.colors.textPrimary,
                  fontFamily: theme.typography.fonts.bodyMedium,
                  fontSize: theme.typography.sizes.body,
                },
              ]}
            >
              {formatSeconds(latestWorkout.avgRestSec)}
            </Text>
          </View>

          <Spacer size="sm" />

          {/* Intensity Score */}
          <View style={styles.summaryRow}>
            <Text
              style={[
                styles.label,
                {
                  color: theme.colors.textMuted,
                  fontFamily: theme.typography.fonts.bodyMedium,
                  fontSize: theme.typography.sizes.body,
                },
              ]}
            >
              Intensity Score:
            </Text>
            <Text
              style={[
                styles.value,
                {
                  color: theme.colors.textPrimary,
                  fontFamily: theme.typography.fonts.bodyMedium,
                  fontSize: theme.typography.sizes.body,
                },
              ]}
            >
              {latestWorkout.intensityScore}
            </Text>
          </View>

          <Spacer size="sm" />

          {/* Density Score */}
          <View style={styles.summaryRow}>
            <Text
              style={[
                styles.label,
                {
                  color: theme.colors.textMuted,
                  fontFamily: theme.typography.fonts.bodyMedium,
                  fontSize: theme.typography.sizes.body,
                },
              ]}
            >
              Density Score:
            </Text>
            <Text
              style={[
                styles.value,
                {
                  color: theme.colors.textPrimary,
                  fontFamily: theme.typography.fonts.bodyMedium,
                  fontSize: theme.typography.sizes.body,
                },
              ]}
            >
              {latestWorkout.densityScore.toFixed(1)}
            </Text>
          </View>
        </Card>

        <Spacer size="lg" />

        {/* Block Breakdown Cards */}
        {latestWorkout.blocks.map((block, index) => (
          <React.Fragment key={block.blockId}>
            <Card variant="elevated" padding="lg">
              <Text
                style={[
                  styles.blockTitle,
                  {
                    color: theme.colors.textPrimary,
                    fontFamily: theme.typography.fonts.headingMedium,
                    fontSize: theme.typography.sizes.h3,
                    marginBottom: theme.spacing.md,
                  },
                ]}
              >
                {block.title}
              </Text>

              {/* Prescribed sets/reps */}
              <View style={styles.summaryRow}>
                <Text
                  style={[
                    styles.label,
                    {
                      color: theme.colors.textMuted,
                      fontFamily: theme.typography.fonts.bodyMedium,
                      fontSize: theme.typography.sizes.bodySmall,
                    },
                  ]}
                >
                  Prescribed:
                </Text>
                <Text
                  style={[
                    styles.value,
                    {
                      color: theme.colors.textSecondary,
                      fontFamily: theme.typography.fonts.body,
                      fontSize: theme.typography.sizes.bodySmall,
                    },
                  ]}
                >
                  {block.prescribedSets} sets
                  {block.prescribedReps !== null ? ` × ${block.prescribedReps} reps` : ''}
                  {block.targetRpe !== null ? ` @ RPE ${block.targetRpe}` : ''}
                </Text>
              </View>

              <Spacer size="xs" />

              {/* Completed sets */}
              <View style={styles.summaryRow}>
                <Text
                  style={[
                    styles.label,
                    {
                      color: theme.colors.textMuted,
                      fontFamily: theme.typography.fonts.bodyMedium,
                      fontSize: theme.typography.sizes.bodySmall,
                    },
                  ]}
                >
                  Completed:
                </Text>
                <Text
                  style={[
                    styles.value,
                    {
                      color: theme.colors.textPrimary,
                      fontFamily: theme.typography.fonts.bodyMedium,
                      fontSize: theme.typography.sizes.bodySmall,
                    },
                  ]}
                >
                  {block.sets.filter((s) => s.completed).length} / {block.prescribedSets}
                </Text>
              </View>

              <Spacer size="xs" />

              {/* Volume */}
              <View style={styles.summaryRow}>
                <Text
                  style={[
                    styles.label,
                    {
                      color: theme.colors.textMuted,
                      fontFamily: theme.typography.fonts.bodyMedium,
                      fontSize: theme.typography.sizes.bodySmall,
                    },
                  ]}
                >
                  Volume:
                </Text>
                <Text
                  style={[
                    styles.value,
                    {
                      color: theme.colors.textPrimary,
                      fontFamily: theme.typography.fonts.bodyMedium,
                      fontSize: theme.typography.sizes.bodySmall,
                    },
                  ]}
                >
                  {block.volume.toLocaleString()} lbs
                </Text>
              </View>

              <Spacer size="xs" />

              {/* Avg RPE */}
              <View style={styles.summaryRow}>
                <Text
                  style={[
                    styles.label,
                    {
                      color: theme.colors.textMuted,
                      fontFamily: theme.typography.fonts.bodyMedium,
                      fontSize: theme.typography.sizes.bodySmall,
                    },
                  ]}
                >
                  Avg RPE:
                </Text>
                <Text
                  style={[
                    styles.value,
                    {
                      color: theme.colors.textPrimary,
                      fontFamily: theme.typography.fonts.bodyMedium,
                      fontSize: theme.typography.sizes.bodySmall,
                    },
                  ]}
                >
                  {block.avgRpe !== null ? block.avgRpe.toFixed(1) : '—'}
                </Text>
              </View>

              <Spacer size="xs" />

              {/* Avg Rest */}
              <View style={styles.summaryRow}>
                <Text
                  style={[
                    styles.label,
                    {
                      color: theme.colors.textMuted,
                      fontFamily: theme.typography.fonts.bodyMedium,
                      fontSize: theme.typography.sizes.bodySmall,
                    },
                  ]}
                >
                  Avg Rest:
                </Text>
                <Text
                  style={[
                    styles.value,
                    {
                      color: theme.colors.textPrimary,
                      fontFamily: theme.typography.fonts.bodyMedium,
                      fontSize: theme.typography.sizes.bodySmall,
                    },
                  ]}
                >
                  {formatSeconds(block.avgRestSec)}
                </Text>
              </View>
            </Card>

            {index < latestWorkout.blocks.length - 1 && <Spacer size="md" />}
          </React.Fragment>
        ))}

        <Spacer size="lg" />

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <PraxisButton
            title="Return to Today"
            onPress={handleReturnToToday}
            size="large"
            style={{ marginBottom: theme.spacing.md }}
          />
          <PraxisButton
            title="View Progress"
            onPress={handleViewProgress}
            variant="outline"
            size="large"
          />
        </View>

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
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontWeight: '700',
  },
  adjustmentBadgeContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  blockTitle: {
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontWeight: '500',
  },
  value: {
    fontWeight: '600',
    textAlign: 'right',
  },
  errorText: {
    fontWeight: '400',
  },
  actionsContainer: {
    width: '100%',
  },
});
