import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@theme';
import { Card, PraxisButton, Spacer, Chip } from '@components';
import { usePlanStore } from '@core/store';
import { useRecoveryStore } from '@/store/recoveryStore';
import { useWorkoutHistoryStore } from '@/store/workoutHistoryStore';
import WorkoutSummaryCard from '@/components/today/WorkoutSummaryCard';
import WorkoutBlocksList from '@/components/today/WorkoutBlocksList';
import RecoverySummaryCard from '@/components/today/RecoverySummaryCard';

export default function HomeScreen() {
  const theme = useTheme();
  const { plan, getTodayPlan, _hasHydrated } = usePlanStore();
  const { recoveryToday, breakdown, calculateRecovery, _hasHydrated: recoveryHydrated } = useRecoveryStore();
  const { _hasHydrated: historyHydrated } = useWorkoutHistoryStore();

  // Calculate recovery score when stores are hydrated
  useEffect(() => {
    if (recoveryHydrated && historyHydrated) {
      calculateRecovery();
    }
  }, [recoveryHydrated, historyHydrated, calculateRecovery]);

  // Wait for hydration before rendering plan state
  if (!_hasHydrated) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.appBg }]}
        edges={['top']}
      >
        <View style={{ padding: theme.spacing.lg }}>
          <Text
            style={{
              color: theme.colors.textMuted,
              fontFamily: theme.typography.fonts.body,
            }}
          >
            Loading...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const todayWorkout = _hasHydrated ? getTodayPlan() : null;
  const hasActivePlan = _hasHydrated && plan.length > 0;

  // Log when no plan exists
  useEffect(() => {
    if (_hasHydrated && plan.length === 0) {
      console.log('[TodayScreen] No plan detected — showing Generate Plan button');
    }
  }, [_hasHydrated, plan.length]);

  // Handle navigation to WorkoutOverview
  const handleOpenWorkout = () => {
    if (todayWorkout) {
      router.push({
        pathname: '/workout/overview',
        params: { planDayId: todayWorkout.id },
      });
    } else {
      // Fallback if workout is missing
      router.push('/workout/overview');
    }
  };

  // Handle navigation to plan generation
  const navigateToGeneratePlan = () => {
    router.push('/plan/plan-regeneration');
  };

  // Handle navigation to calendar/week view
  const handleViewWeek = () => {
    router.push('/calendar');
  };

  // Handle regeneration
  const handleRegenerateWeek = () => {
    router.push('/plan/plan-regeneration');
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.appBg }]}
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
        {/* Developer QA Button */}
        {__DEV__ && (
          <PraxisButton
            title="DEV: Periodization QA"
            variant="outline"
            onPress={() => router.push('/debug/periodization-qa')}
            style={{ marginBottom: theme.spacing.lg }}
          />
        )}

        {/* Recovery Summary Card */}
        <RecoverySummaryCard score={recoveryToday} breakdown={breakdown} />
        
        <Spacer size="lg" />

        {/* Workout Summary Card */}
        <WorkoutSummaryCard workout={todayWorkout} hasActivePlan={hasActivePlan} />
        
        <Spacer size="lg" />

        {/* State 1: Rest Day (workout exists but has no blocks) */}
        {todayWorkout && todayWorkout.blocks.length === 0 ? (
          /* State 2: Rest Day */
          <Card variant="elevated" padding="lg">
            <Text
              style={[
                styles.restDayTitle,
                {
                  color: theme.colors.textPrimary,
                  fontFamily: theme.typography.fonts.heading,
                  fontSize: theme.typography.sizes.h1,
                  marginBottom: theme.spacing.md,
                },
              ]}
            >
              Rest Day
            </Text>
            <Text
              style={[
                styles.restDaySubtitle,
                {
                  color: theme.colors.textMuted,
                  fontFamily: theme.typography.fonts.body,
                  fontSize: theme.typography.sizes.body,
                  marginBottom: theme.spacing.xl,
                },
              ]}
            >
              Recovery is part of the process.
            </Text>
            <PraxisButton
              title="View Week"
              onPress={handleViewWeek}
              variant="outline"
              size="medium"
              style={{ marginBottom: theme.spacing.md }}
            />
            <PraxisButton
              title="Regenerate Week"
              onPress={handleRegenerateWeek}
              variant="ghost"
              size="medium"
            />
          </Card>
        ) : todayWorkout ? (
          /* State 2: Has Workout */
          <>
            {/* Workout Blocks List */}
            <WorkoutBlocksList blocks={todayWorkout.blocks} />

            <Spacer size="lg" />

            {/* Open Workout Button */}
            <PraxisButton
              title="Open Today's Workout"
              onPress={handleOpenWorkout}
              size="large"
            />
          </>
        ) : null}

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
  title: {
    fontWeight: '700',
  },
  cardTitle: {
    fontWeight: '600',
  },
  emptyTitle: {
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    lineHeight: 22,
  },
  restDayTitle: {
    fontWeight: '700',
    textAlign: 'center',
  },
  restDaySubtitle: {
    textAlign: 'center',
    lineHeight: 22,
  },
  focusTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  duration: {
    fontWeight: '400',
  },
});
