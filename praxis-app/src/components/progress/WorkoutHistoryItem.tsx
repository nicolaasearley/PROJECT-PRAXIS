import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@theme';
import { Card, Spacer } from '@components';
import { WorkoutRecord } from '@/types/workout';
import dayjs from 'dayjs';

interface WorkoutHistoryItemProps {
  workout: WorkoutRecord;
}

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
 * Format date to readable format
 */
function formatDate(dateString: string): string {
  const date = dayjs(dateString);
  const today = dayjs();
  const yesterday = today.subtract(1, 'day');

  if (date.isSame(today, 'day')) {
    return 'Today';
  }
  if (date.isSame(yesterday, 'day')) {
    return 'Yesterday';
  }
  if (date.isAfter(today.subtract(7, 'day'))) {
    return date.format('dddd'); // Day of week
  }
  return date.format('MMM D, YYYY');
}

export default function WorkoutHistoryItem({
  workout,
}: WorkoutHistoryItemProps) {
  const theme = useTheme();

  return (
    <Card variant="elevated" padding="lg">
      {/* Date */}
      <Text
        style={[
          styles.date,
          {
            color: theme.colors.textPrimary,
            fontFamily: theme.typography.fonts.headingMedium,
            fontSize: theme.typography.sizes.h4,
            marginBottom: theme.spacing.sm,
          },
        ]}
      >
        {formatDate(workout.date)}
      </Text>

      {/* Duration */}
      <View style={styles.metricRow}>
        <Text
          style={[
            styles.metricLabel,
            {
              color: theme.colors.textMuted,
              fontFamily: theme.typography.fonts.bodyMedium,
              fontSize: theme.typography.sizes.bodySmall,
            },
          ]}
        >
          Duration:
        </Text>
        <Text
          style={[
            styles.metricValue,
            {
              color: theme.colors.textPrimary,
              fontFamily: theme.typography.fonts.bodyMedium,
              fontSize: theme.typography.sizes.bodySmall,
            },
          ]}
        >
          {formatDuration(workout.durationMin)}
        </Text>
      </View>

      <Spacer size="xs" />

      {/* Total Volume */}
      <View style={styles.metricRow}>
        <Text
          style={[
            styles.metricLabel,
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
            styles.metricValue,
            {
              color: theme.colors.textPrimary,
              fontFamily: theme.typography.fonts.bodyMedium,
              fontSize: theme.typography.sizes.bodySmall,
            },
          ]}
        >
          {workout.totalVolume.toLocaleString()} lbs
        </Text>
      </View>

      <Spacer size="xs" />

      {/* Avg RPE */}
      <View style={styles.metricRow}>
        <Text
          style={[
            styles.metricLabel,
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
            styles.metricValue,
            {
              color: theme.colors.textPrimary,
              fontFamily: theme.typography.fonts.bodyMedium,
              fontSize: theme.typography.sizes.bodySmall,
            },
          ]}
        >
          {workout.avgRpe !== null ? workout.avgRpe.toFixed(1) : '—'}
        </Text>
      </View>

      <Spacer size="xs" />

      {/* Intensity Score */}
      <View style={styles.metricRow}>
        <Text
          style={[
            styles.metricLabel,
            {
              color: theme.colors.textMuted,
              fontFamily: theme.typography.fonts.bodyMedium,
              fontSize: theme.typography.sizes.bodySmall,
            },
          ]}
        >
          Intensity Score:
        </Text>
        <Text
          style={[
            styles.metricValue,
            {
              color: theme.colors.textPrimary,
              fontFamily: theme.typography.fonts.bodyMedium,
              fontSize: theme.typography.sizes.bodySmall,
            },
          ]}
        >
          {workout.intensityScore}
        </Text>
      </View>

      <Spacer size="xs" />

      {/* Density Score */}
      <View style={styles.metricRow}>
        <Text
          style={[
            styles.metricLabel,
            {
              color: theme.colors.textMuted,
              fontFamily: theme.typography.fonts.bodyMedium,
              fontSize: theme.typography.sizes.bodySmall,
            },
          ]}
        >
          Density Score:
        </Text>
        <Text
          style={[
            styles.metricValue,
            {
              color: theme.colors.textPrimary,
              fontFamily: theme.typography.fonts.bodyMedium,
              fontSize: theme.typography.sizes.bodySmall,
            },
          ]}
        >
          {workout.densityScore.toFixed(1)}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  date: {
    fontWeight: '600',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    fontWeight: '500',
  },
  metricValue: {
    fontWeight: '600',
    textAlign: 'right',
  },
});
