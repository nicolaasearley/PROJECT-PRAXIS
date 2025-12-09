import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../../../theme';
import { PraxisButton } from '../../components';
import { useUserStore } from '../../../core/store';
import { usePlanStore } from '../../../core/store';
import { generateTrainingCycle } from '../../../engine/generation/generateTrainingCycle';

export default function OnboardingCompleteScreen() {
  const theme = useTheme();
  const {
    preferences,
    setOnboardingCompleted,
  } = useUserStore();
  const { setPlan } = usePlanStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleGeneratePlan = async () => {
    setIsLoading(true);

    try {
      // Get today's date in yyyy-mm-dd format
      const startDate = new Date().toISOString().slice(0, 10);

      // Generate a 4-week training cycle
      const cycle = generateTrainingCycle({
        startDate,
        goal: preferences.goal || 'general',
        experienceLevel: (preferences.experience as any) || 'beginner',
        trainingDaysPerWeek: preferences.trainingDays || 3,
        equipmentIds: preferences.equipment,
        units: 'metric',
        weeks: 4,
        strengthNumbers:
          Object.keys(preferences.personalRecords).length > 0
            ? (preferences.personalRecords as Record<string, number>)
            : undefined,
      });

      // Flatten the weeks array into a single array of WorkoutPlanDay
      const fullPlan = cycle.weeks.flat();

      // Save to plan store
      setPlan(fullPlan);
      setOnboardingCompleted();

      // TODO: Save cycle metadata to Supabase once backend integration exists.
      // TODO: Store cycle.id for analytics and history tracking.

      // Navigate to Home screen
      router.replace('/home');
    } catch (error) {
      console.error('Error generating training plan:', error);
      // Navigate anyway, even if generation fails
      router.replace('/home');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.black }]}
      edges={['top', 'bottom']}
    >
      <View style={[styles.content, { paddingHorizontal: theme.spacing.xl }]}>
        <View style={[styles.header, { marginBottom: theme.spacing.xxl }]}>
          <Text
            style={[
              styles.title,
              {
                color: theme.colors.white,
                fontFamily: theme.typography.fonts.heading,
                fontSize: theme.typography.sizes.h1,
                marginBottom: theme.spacing.md,
              },
            ]}
          >
            You're All Set!
          </Text>
          <Text
            style={[
              styles.subtitle,
              {
                color: theme.colors.muted,
                fontFamily: theme.typography.fonts.body,
                fontSize: theme.typography.sizes.body,
              },
            ]}
          >
            Let's build your personalized training plan based on your goals and
            preferences.
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <PraxisButton
            title="Generate My Plan"
            onPress={handleGeneratePlan}
            size="large"
            loading={isLoading}
            disabled={isLoading}
          />
          {isLoading && (
            <Text
              style={[
                styles.loadingText,
                {
                  color: theme.colors.muted,
                  fontFamily: theme.typography.fonts.body,
                  fontSize: theme.typography.sizes.bodySmall,
                  marginTop: theme.spacing.md,
                },
              ]}
            >
              Generating…
            </Text>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    alignItems: 'center',
  },
  loadingText: {
    textAlign: 'center',
  },
});
