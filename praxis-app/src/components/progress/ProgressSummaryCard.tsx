import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@theme';
import { Card, Spacer } from '@components';
import { WorkoutRecord } from '@/types/workout';
import {
  getAvgRpe,
  getAvgRestSec,
  getAvgIntensityScore,
  getAvgDensityScore,
  get7DayVolumeTrend,
} from '@/utils/progressAnalytics';

interface ProgressSummaryCardProps {
  workouts: WorkoutRecord[];
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

export default function ProgressSummaryCard({
  workouts,
}: ProgressSummaryCardProps) {
  const theme = useTheme();

  const totalWorkouts = workouts.length;
  const avgRpe = getAvgRpe(workouts);
  const avgRestSec = getAvgRestSec(workouts);
  const avgIntensityScore = getAvgIntensityScore(workouts);
  const avgDensityScore = getAvgDensityScore(workouts);
  const volumeTrend = get7DayVolumeTrend(workouts);

  const getTrendLabel = (): string => {
    switch (volumeTrend) {
      case 'higher':
        return '↑ Higher';
      case 'lower':
        return '↓ Lower';
      case 'same':
        return '→ Same';
    }
  };

  const getTrendColor = (): string => {
    switch (volumeTrend) {
      case 'higher':
        return theme.colors.success;
      case 'lower':
        return theme.colors.danger;
      case 'same':
        return theme.colors.textMuted;
    }
  };

  return (
    <Card variant="elevated" padding="lg">
      <Text
        style={[
          styles.title,
          {
            color: theme.colors.textPrimary,
            fontFamily: theme.typography.fonts.headingMedium,
            fontSize: theme.typography.sizes.h3,
            marginBottom: theme.spacing.md,
          },
        ]}
      >
        Overall Progress
      </Text>

      {/* Total Workouts */}
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
          Total Workouts:
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
          {totalWorkouts}
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
          {avgRpe !== null ? avgRpe.toFixed(1) : '—'}
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
          {formatSeconds(avgRestSec)}
        </Text>
      </View>

      <Spacer size="sm" />

      {/* Avg Intensity Score */}
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
          Avg Intensity Score:
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
          {avgIntensityScore}
        </Text>
      </View>

      <Spacer size="sm" />

      {/* Avg Density Score */}
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
          Avg Density Score:
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
          {avgDensityScore.toFixed(1)}
        </Text>
      </View>

      <Spacer size="sm" />

      {/* 7-Day Volume Trend */}
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
          7-Day Volume Trend:
        </Text>
        <Text
          style={[
            styles.value,
            {
              color: getTrendColor(),
              fontFamily: theme.typography.fonts.bodyMedium,
              fontSize: theme.typography.sizes.body,
            },
          ]}
        >
          {getTrendLabel()}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  title: {
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
});
