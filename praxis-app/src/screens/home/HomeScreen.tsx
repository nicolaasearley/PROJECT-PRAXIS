import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../../theme';
import { Card, PraxisButton, Spacer, Chip } from '../../components';
import { usePlanStore } from '../../core/store';

export default function HomeScreen() {
  const theme = useTheme();
  const { plan, getTodayPlan } = usePlanStore();

  const todayWorkout = getTodayPlan();

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
  const handleGeneratePlan = () => {
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
        {/* Title */}
        <Text
          style={[
            styles.title,
            {
              color: theme.colors.white,
              fontFamily: theme.typography.fonts.heading,
              fontSize: theme.typography.sizes.h1,
              marginBottom: theme.spacing.xl,
            },
          ]}
        >
          Today
        </Text>

        {/* State 1: No Plan */}
        {plan.length === 0 ? (
          <Card variant="elevated" padding="lg">
            <Text
              style={[
                styles.emptyTitle,
                {
                  color: theme.colors.white,
                  fontFamily: theme.typography.fonts.headingMedium,
                  fontSize: theme.typography.sizes.h3,
                  marginBottom: theme.spacing.md,
                },
              ]}
            >
              No active training cycle.
            </Text>
            <Text
              style={[
                styles.emptyText,
                {
                  color: theme.colors.muted,
                  fontFamily: theme.typography.fonts.body,
                  fontSize: theme.typography.sizes.body,
                  marginBottom: theme.spacing.lg,
                },
              ]}
            >
              No training plan found. Please regenerate your plan.
            </Text>
            <PraxisButton
              title="Generate Plan"
              onPress={handleGeneratePlan}
              size="medium"
            />
          </Card>
        ) : todayWorkout && todayWorkout.blocks.length === 0 ? (
          /* State 2: Rest Day */
          <Card variant="elevated" padding="lg">
            <Text
              style={[
                styles.restDayTitle,
                {
                  color: theme.colors.white,
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
                  color: theme.colors.muted,
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
          /* State 3: Has Workout */
          <Card variant="elevated" padding="lg">
            <View style={styles.workoutHeader}>
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

              {/* Focus Tags */}
              {todayWorkout.focusTags.length > 0 && (
                <View style={styles.focusTagsContainer}>
                  {todayWorkout.focusTags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      variant="accent"
                      size="small"
                      style={{ marginRight: theme.spacing.xs }}
                    />
                  ))}
                </View>
              )}

              {/* Duration */}
              <Text
                style={[
                  styles.duration,
                  {
                    color: theme.colors.muted,
                    fontFamily: theme.typography.fonts.body,
                    fontSize: theme.typography.sizes.body,
                    marginTop: theme.spacing.md,
                    marginBottom: theme.spacing.md,
                  },
                ]}
              >
                Duration: {todayWorkout.estimatedDurationMinutes} min
              </Text>

              {/* Block Titles List */}
              <View style={styles.blocksList}>
                {todayWorkout.blocks.map((block, index) => (
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
                    • {block.title}
                  </Text>
                ))}
              </View>
            </View>

            <Spacer size="md" />

            <PraxisButton
              title="Open Today's Workout"
              onPress={handleOpenWorkout}
              size="large"
            />
          </Card>
        ) : (
          /* Fallback: Plan exists but no workout for today */
          <Card variant="elevated" padding="lg">
            <Text
              style={[
                styles.emptyText,
                {
                  color: theme.colors.muted,
                  fontFamily: theme.typography.fonts.body,
                  fontSize: theme.typography.sizes.body,
                  marginBottom: theme.spacing.lg,
                },
              ]}
            >
              No workout planned for today.
            </Text>
            <PraxisButton
              title="View Week"
              onPress={handleViewWeek}
              variant="outline"
              size="medium"
            />
          </Card>
        )}

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
  workoutHeader: {
    width: '100%',
  },
  focusTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  duration: {
    fontWeight: '400',
  },
  blocksList: {
    marginTop: 8,
  },
  blockItem: {
    marginBottom: 8,
    lineHeight: 20,
  },
});
