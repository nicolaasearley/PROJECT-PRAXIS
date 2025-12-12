import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@theme';
import { Card, Chip, Spacer } from '@components';
import { RecoveryBreakdown } from '@/utils/recoveryAnalytics';

interface RecoverySummaryCardProps {
  score: number | null;
  breakdown: RecoveryBreakdown | null;
}

/**
 * Get readiness label based on score
 */
function getReadinessLabel(score: number): string {
  if (score >= 80) return 'Excellent readiness';
  if (score >= 60) return 'Moderate readiness';
  if (score >= 40) return 'Compromised readiness';
  return 'Low readiness';
}

/**
 * Get readiness color based on score
 */
function getReadinessColor(score: number, theme: ReturnType<typeof useTheme>): string {
  if (score >= 80) return theme.colors.success;
  if (score >= 60) return theme.colors.primary;
  if (score >= 40) return theme.colors.warning;
  return theme.colors.danger;
}

export default function RecoverySummaryCard({
  score,
  breakdown,
}: RecoverySummaryCardProps) {
  const theme = useTheme();

  const handlePress = () => {
    router.push('/progress/recovery');
  };

  // Fallback: No score available
  if (score === null || breakdown === null) {
    return (
      <Card variant="elevated" padding="lg">
        <Text
          style={[
            styles.title,
            {
              color: theme.colors.textPrimary,
              fontFamily: theme.typography.fonts.headingMedium,
              fontSize: theme.typography.sizes.h3,
              marginBottom: theme.spacing.sm,
            },
          ]}
        >
          Recovery Score
        </Text>
        <Text
          style={[
            styles.emptyText,
            {
              color: theme.colors.textMuted,
              fontFamily: theme.typography.fonts.body,
              fontSize: theme.typography.sizes.body,
            },
          ]}
        >
          Complete a workout to begin tracking recovery.
        </Text>
      </Card>
    );
  }

  const readinessLabel = getReadinessLabel(score);
  const readinessColor = getReadinessColor(score, theme);

  // Calculate average pattern fatigue
  const avgPatternFatigue = breakdown.movementPatternFatigue.average;

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <Card variant="elevated" padding="lg">
        <View style={styles.header}>
          <Text
            style={[
              styles.title,
              {
                color: theme.colors.textPrimary,
                fontFamily: theme.typography.fonts.headingMedium,
                fontSize: theme.typography.sizes.h3,
              },
            ]}
          >
            Recovery Score
          </Text>
          <Chip
            label={readinessLabel}
            variant="outlined"
            style={{
              backgroundColor: 'transparent',
              borderColor: readinessColor,
            }}
            textStyle={{
              color: readinessColor,
              fontFamily: theme.typography.fonts.bodyMedium,
              fontSize: theme.typography.sizes.bodySmall,
            }}
          />
        </View>

        <Spacer size="md" />

        {/* Large Score Display */}
        <View style={styles.scoreContainer}>
          <Text
            style={[
              styles.scoreText,
              {
                color: readinessColor,
                fontFamily: theme.typography.fonts.heading,
                fontSize: 48,
              },
            ]}
          >
            {score}
          </Text>
          <View
            style={[
              styles.scoreRing,
              {
                borderColor: readinessColor,
                backgroundColor: `${readinessColor}20`, // 20% opacity
              },
            ]}
          />
        </View>

        <Spacer size="md" />

        {/* Breakdown Preview */}
        <View style={styles.breakdownContainer}>
          <View style={styles.breakdownRow}>
            <Text
              style={[
                styles.breakdownLabel,
                {
                  color: theme.colors.textSecondary,
                  fontFamily: theme.typography.fonts.body,
                  fontSize: theme.typography.sizes.bodySmall,
                },
              ]}
            >
              Pattern Fatigue
            </Text>
            <Text
              style={[
                styles.breakdownValue,
                {
                  color: theme.colors.textPrimary,
                  fontFamily: theme.typography.fonts.bodyMedium,
                  fontSize: theme.typography.sizes.bodySmall,
                },
              ]}
            >
              {Math.round(avgPatternFatigue)}%
            </Text>
          </View>

          <View style={styles.breakdownRow}>
            <Text
              style={[
                styles.breakdownLabel,
                {
                  color: theme.colors.textSecondary,
                  fontFamily: theme.typography.fonts.body,
                  fontSize: theme.typography.sizes.bodySmall,
                },
              ]}
            >
              ACWR
            </Text>
            <Text
              style={[
                styles.breakdownValue,
                {
                  color: theme.colors.textPrimary,
                  fontFamily: theme.typography.fonts.bodyMedium,
                  fontSize: theme.typography.sizes.bodySmall,
                },
              ]}
            >
              {Math.round(breakdown.acwr)}%
            </Text>
          </View>

          <View style={styles.breakdownRow}>
            <Text
              style={[
                styles.breakdownLabel,
                {
                  color: theme.colors.textSecondary,
                  fontFamily: theme.typography.fonts.body,
                  fontSize: theme.typography.sizes.bodySmall,
                },
              ]}
            >
              Intensity + Rest
            </Text>
            <Text
              style={[
                styles.breakdownValue,
                {
                  color: theme.colors.textPrimary,
                  fontFamily: theme.typography.fonts.bodyMedium,
                  fontSize: theme.typography.sizes.bodySmall,
                },
              ]}
            >
              {Math.round((breakdown.intensityFatigue + breakdown.restFatigue) / 2)}%
            </Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontWeight: '600',
  },
  emptyText: {
    fontWeight: '400',
    lineHeight: 20,
  },
  scoreContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: 100,
  },
  scoreText: {
    fontWeight: '700',
    zIndex: 2,
  },
  scoreRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    zIndex: 1,
  },
  breakdownContainer: {
    gap: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    fontWeight: '400',
  },
  breakdownValue: {
    fontWeight: '500',
  },
});
