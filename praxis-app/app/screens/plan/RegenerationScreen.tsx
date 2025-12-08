import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/theme';
import { Card, IconButton, PraxisButton, Spacer } from '../../components';
import { useUserStore } from '../../../src/core/store';
import { usePlanStore } from '../../../src/core/store';
import { generateDailyWorkout } from '../../../src/engine/generation/generateDailyWorkout';
import { generateMicrocycle } from '../../../src/engine/generation/generateMicrocycle';
import { generateTrainingCycle } from '../../../src/engine/generation/generateTrainingCycle';

type MainStackParamList = {
  Home: undefined;
  OnboardingComplete: undefined;
};

type NavigationProp = StackNavigationProp<MainStackParamList>;

/**
 * Check if two date strings represent the same date
 */
function isSameDate(d1: string, d2: string): boolean {
  return d1.slice(0, 10) === d2.slice(0, 10);
}

export default function RegenerationScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();

  // Get user preferences from store
  const {
    goal,
    experienceLevel,
    trainingDaysPerWeek,
    equipmentIds,
    units,
    strengthNumbers,
  } = useUserStore();

  // Get plan from store
  const { plan, setPlan, getTodayPlan } = usePlanStore();

  // Loading states for each regeneration type
  const [loadingToday, setLoadingToday] = useState(false);
  const [loadingWeek, setLoadingWeek] = useState(false);
  const [loadingCycle, setLoadingCycle] = useState(false);

  // Today's date
  const todayDate = new Date().toISOString().slice(0, 10);

  // Get today's workout (optional)
  const todayWorkout = getTodayPlan();

  // Handle regenerate today's workout
  const handleRegenerateToday = async () => {
    setLoadingToday(true);

    try {
      // Generate new daily workout
      const newWorkout = generateDailyWorkout({
        goal,
        experienceLevel,
        equipmentIds,
        units,
        strengthNumbers:
          Object.keys(strengthNumbers).length > 0 ? strengthNumbers : undefined,
        userId: undefined,
      });

      // Replace only today's planDay in existing plan
      const updatedPlan = plan.map((day) =>
        isSameDate(day.date, todayDate)
          ? { ...newWorkout, date: todayDate }
          : day
      );

      // If today's workout wasn't in the plan, add it
      const todayExists = plan.some((day) => isSameDate(day.date, todayDate));
      const finalPlan = todayExists
        ? updatedPlan
        : [...plan, { ...newWorkout, date: todayDate }];

      // Save to store
      setPlan(finalPlan);

      // Navigate to Home
      navigation.replace('Home');
    } catch (error) {
      console.error("Error regenerating today's workout:", error);
    } finally {
      setLoadingToday(false);
    }
  };

  // Handle regenerate this week (microcycle)
  const handleRegenerateWeek = async () => {
    setLoadingWeek(true);

    try {
      // Generate new microcycle
      const micro = generateMicrocycle({
        startDate: todayDate,
        goal,
        experienceLevel,
        trainingDaysPerWeek,
        equipmentIds,
        units,
        strengthNumbers:
          Object.keys(strengthNumbers).length > 0 ? strengthNumbers : undefined,
        userId: undefined,
      });

      // Flatten all 7 days
      const updatedPlan = micro;

      // Save to store
      setPlan(updatedPlan);

      // Navigate to Home
      navigation.replace('Home');
    } catch (error) {
      console.error('Error regenerating week:', error);
    } finally {
      setLoadingWeek(false);
    }
  };

  // Handle regenerate full cycle
  const handleRegenerateCycle = async () => {
    setLoadingCycle(true);

    try {
      // Generate new training cycle
      const cycle = generateTrainingCycle({
        startDate: todayDate,
        goal,
        experienceLevel,
        trainingDaysPerWeek,
        equipmentIds,
        units,
        weeks: 4,
        strengthNumbers:
          Object.keys(strengthNumbers).length > 0 ? strengthNumbers : undefined,
        userId: undefined,
      });

      // Flatten cycle weeks
      const updatedPlan = cycle.weeks.flat();

      // Save to store
      setPlan(updatedPlan);

      // Navigate to Home
      navigation.replace('Home');
    } catch (error) {
      console.error('Error regenerating cycle:', error);
    } finally {
      setLoadingCycle(false);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    navigation.navigate('Home');
  };

  // Error state: No plan exists
  if (plan.length === 0) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.black }]}
        edges={['top', 'bottom']}
      >
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
              <Ionicons
                name="arrow-back"
                size={24}
                color={theme.colors.white}
              />
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
                },
              ]}
            >
              Regenerate Training
            </Text>
          </View>
          <View style={{ width: 44 }} />
        </View>

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
            No training plan found.
          </Text>
          <PraxisButton
            title="Generate Plan"
            onPress={() => navigation.navigate('OnboardingComplete')}
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
              },
            ]}
          >
            Regenerate Training
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
        {/* Subtitle */}
        <Text
          style={[
            styles.subtitle,
            {
              color: theme.colors.muted,
              fontFamily: theme.typography.fonts.body,
              fontSize: theme.typography.sizes.body,
              marginBottom: theme.spacing.xl,
              textAlign: 'center',
            },
          ]}
        >
          Update today's workout, this week, or your full training cycle.
        </Text>

        {/* Regenerate Today's Workout */}
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
              styles.optionTitle,
              {
                color: theme.colors.white,
                fontFamily: theme.typography.fonts.headingMedium,
                fontSize: theme.typography.sizes.h3,
                marginBottom: theme.spacing.sm,
              },
            ]}
          >
            1. Regenerate Today's Workout
          </Text>
          <Text
            style={[
              styles.optionDescription,
              {
                color: theme.colors.muted,
                fontFamily: theme.typography.fonts.body,
                fontSize: theme.typography.sizes.bodySmall,
                marginBottom: theme.spacing.md,
              },
            ]}
          >
            Generate a new workout plan for today only.
          </Text>
          <PraxisButton
            title="Regenerate Today's Workout"
            onPress={handleRegenerateToday}
            size="large"
            loading={loadingToday}
            disabled={loadingToday || loadingWeek || loadingCycle}
          />
        </Card>

        {/* Regenerate This Week */}
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
              styles.optionTitle,
              {
                color: theme.colors.white,
                fontFamily: theme.typography.fonts.headingMedium,
                fontSize: theme.typography.sizes.h3,
                marginBottom: theme.spacing.sm,
              },
            ]}
          >
            2. Regenerate This Week
          </Text>
          <Text
            style={[
              styles.optionDescription,
              {
                color: theme.colors.muted,
                fontFamily: theme.typography.fonts.body,
                fontSize: theme.typography.sizes.bodySmall,
                marginBottom: theme.spacing.md,
              },
            ]}
          >
            Generate a new 7-day microcycle starting from today.
          </Text>
          <PraxisButton
            title="Regenerate This Week"
            onPress={handleRegenerateWeek}
            size="large"
            loading={loadingWeek}
            disabled={loadingToday || loadingWeek || loadingCycle}
          />
        </Card>

        {/* Regenerate Full Cycle */}
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
              styles.optionTitle,
              {
                color: theme.colors.white,
                fontFamily: theme.typography.fonts.headingMedium,
                fontSize: theme.typography.sizes.h3,
                marginBottom: theme.spacing.sm,
              },
            ]}
          >
            3. Regenerate Full Cycle
          </Text>
          <Text
            style={[
              styles.optionDescription,
              {
                color: theme.colors.muted,
                fontFamily: theme.typography.fonts.body,
                fontSize: theme.typography.sizes.bodySmall,
                marginBottom: theme.spacing.md,
              },
            ]}
          >
            Generate a new 4-week training cycle starting from today.
          </Text>
          <PraxisButton
            title="Regenerate Full Cycle"
            onPress={handleRegenerateCycle}
            size="large"
            loading={loadingCycle}
            disabled={loadingToday || loadingWeek || loadingCycle}
          />
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  subtitle: {
    fontWeight: '400',
    lineHeight: 22,
  },
  optionTitle: {
    fontWeight: '600',
  },
  optionDescription: {
    fontWeight: '400',
    lineHeight: 20,
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

// TODO: store regeneration history for analytics
// TODO: show changes overview before applying plan
// TODO: add readiness-based regeneration suggestions
