import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@theme';
import { Card, Chip, Spacer, PraxisButton } from '@components';
import { WorkoutPlanDay } from '@core/types';
import { useUserStore } from '@core/store/useUserStore';

// Type alias for compatibility with requirements
type TrainingDay = WorkoutPlanDay;

interface WorkoutSummaryCardProps {
  workout: TrainingDay | null;
  hasActivePlan?: boolean; // Whether a plan exists (even if today has no workout)
}

export default function WorkoutSummaryCard({
  workout,
  hasActivePlan = false,
}: WorkoutSummaryCardProps) {
  const theme = useTheme();
  const { userProfile } = useUserStore();

  // Get user's name, default to "Nic" if not available
  const userName = userProfile?.name || 'Nic';

  // Generate greeting based on time of day
  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return `Good morning, ${userName}`;
    } else if (hour < 17) {
      return `Good afternoon, ${userName}`;
    } else {
      return `Good evening, ${userName}`;
    }
  };

  // Handle navigation to plan generation
  const navigateToGeneratePlan = () => {
    router.push('/plan/plan-regeneration');
  };

  // Handle navigation to plan regeneration
  const handleRegeneratePlan = () => {
    router.push('/plan/plan-regeneration');
  };

  // If no workout, show empty state with different messages based on plan status
  if (!workout) {
    // No plan exists at all
    if (!hasActivePlan) {
      return (
        <Card variant="elevated" padding="lg">
          <Text
            style={[
              styles.emptyMessage,
              {
                color: theme.colors.textPrimary,
                fontFamily: theme.typography.fonts.body,
                fontSize: theme.typography.sizes.body,
                marginBottom: theme.spacing.lg,
              },
            ]}
          >
            No workout found for today.
          </Text>
          <PraxisButton
            title="Generate Plan"
            onPress={navigateToGeneratePlan}
            size="medium"
          />
        </Card>
      );
    }
    
    // Plan exists but no workout for today
    return (
      <Card variant="elevated" padding="lg">
        <Text
          style={[
            styles.emptyMessage,
            {
              color: theme.colors.textPrimary,
              fontFamily: theme.typography.fonts.body,
              fontSize: theme.typography.sizes.body,
              marginBottom: theme.spacing.lg,
            },
          ]}
        >
          You may need to regenerate your plan.
        </Text>
        <PraxisButton
          title="Regenerate Plan"
          onPress={handleRegeneratePlan}
          size="medium"
        />
      </Card>
    );
  }

  return (
    <Card variant="elevated" padding="lg">
      {/* Greeting */}
      <Text
        style={[
          styles.greeting,
          {
            color: theme.colors.textPrimary,
            fontFamily: theme.typography.fonts.headingMedium,
            fontSize: theme.typography.sizes.h3,
            marginBottom: theme.spacing.md,
          },
        ]}
      >
        {getGreeting()}
      </Text>

      {/* Focus Tags */}
      {workout.focusTags && workout.focusTags.length > 0 && (
        <View style={styles.focusTagsContainer}>
          {workout.focusTags.map((tag, index) => (
            <Chip
              key={index}
              label={tag}
              variant="accent"
              size="small"
              style={{ marginRight: theme.spacing.xs, marginBottom: theme.spacing.xs }}
            />
          ))}
        </View>
      )}

      <Spacer size="md" />

      {/* Duration */}
      <View style={styles.infoRow}>
        <Text
          style={[
            styles.infoLabel,
            {
              color: theme.colors.textMuted,
              fontFamily: theme.typography.fonts.bodyMedium,
              fontSize: theme.typography.sizes.bodySmall,
            },
          ]}
        >
          Estimated Duration:
        </Text>
        <Text
          style={[
            styles.infoValue,
            {
              color: theme.colors.textPrimary,
              fontFamily: theme.typography.fonts.bodyMedium,
              fontSize: theme.typography.sizes.bodySmall,
            },
          ]}
        >
          {workout.estimatedDurationMinutes} min
        </Text>
      </View>

      <Spacer size="sm" />

      {/* Recovery Score Placeholder */}
      <View style={styles.infoRow}>
        <Text
          style={[
            styles.infoLabel,
            {
              color: theme.colors.textMuted,
              fontFamily: theme.typography.fonts.bodyMedium,
              fontSize: theme.typography.sizes.bodySmall,
            },
          ]}
        >
          Recovery Score:
        </Text>
        <Text
          style={[
            styles.infoValue,
            {
              color: theme.colors.textMuted,
              fontFamily: theme.typography.fonts.body,
              fontSize: theme.typography.sizes.bodySmall,
              fontStyle: 'italic',
            },
          ]}
        >
          — coming soon
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  greeting: {
    fontWeight: '600',
  },
  focusTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoLabel: {
    fontWeight: '500',
  },
  infoValue: {
    fontWeight: '400',
  },
  emptyMessage: {
    textAlign: 'center',
    lineHeight: 22,
  },
});
