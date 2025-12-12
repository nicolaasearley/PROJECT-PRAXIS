import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@theme';
import { Card, Spacer } from '@components';
import { useWorkoutHistoryStore } from '@/store/workoutHistoryStore';
import ProgressSummaryCard from '@/components/progress/ProgressSummaryCard';
import WorkoutHistoryList from '@/components/progress/WorkoutHistoryList';
import VolumeTrendChart from '@/components/progress/charts/VolumeTrendChart';
import IntensityTrendChart from '@/components/progress/charts/IntensityTrendChart';
import PatternVolumeTrendChart from '@/components/progress/charts/PatternVolumeTrendChart';
import BlockVolumeTrendChart from '@/components/progress/charts/BlockVolumeTrendChart';
import { getPatternVolumeTrend, getBlockVolumeTrend } from '@/utils/progressAnalytics';

export default function ProgressScreen() {
  const theme = useTheme();
  const { getWorkouts, _hasHydrated } = useWorkoutHistoryStore();

  // Wait for hydration before rendering
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

  const workouts = getWorkouts();

  // Log header layout fix
  if (__DEV__) {
    console.log('[ProgressScreen] Header layout fixed');
  }

  // Get unique block titles from all workouts (for Main Lift Trends)
  const uniqueBlockTitles = useMemo(() => {
    const titles = new Set<string>();
    workouts.forEach((workout) => {
      workout.blocks.forEach((block) => {
        // Only include strength blocks (main lifts)
        if (block.type === 'strength' && block.volume > 0) {
          titles.add(block.title);
        }
      });
    });
    return Array.from(titles).sort();
  }, [workouts]);

  // Filter block titles to only those with at least 2 data points
  const blockTitlesWithData = useMemo(() => {
    return uniqueBlockTitles.filter((title) => {
      const trend = getBlockVolumeTrend(workouts, title);
      return trend.length >= 2;
    });
  }, [uniqueBlockTitles, workouts]);

  // Patterns to show (only those with data)
  const patternsToShow = useMemo(() => {
    const patterns: Array<'squat' | 'hinge' | 'horizontal_press' | 'horizontal_pull'> = [
      'squat',
      'hinge',
      'horizontal_press',
      'horizontal_pull',
    ];
    return patterns.filter((pattern) => {
      const trend = getPatternVolumeTrend(workouts, pattern);
      return trend.length >= 2;
    });
  }, [workouts]);

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
        {/* Page Title */}
        <Text
          style={[
            styles.headerTitle,
            {
              color: theme.colors.textPrimary,
              fontFamily: theme.typography.fonts.heading,
              fontSize: theme.typography.sizes.h1,
              paddingHorizontal: 0,
              marginBottom: theme.spacing.xl,
            },
          ]}
        >
          Progress Dashboard
        </Text>

        {/* Header Links */}
        <View style={styles.headerLinks}>
          <TouchableOpacity
            onPress={() => router.push('/progress/exercises')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.headerLink,
                {
                  color: theme.colors.primary,
                  fontFamily: theme.typography.fonts.bodyMedium,
                  fontSize: theme.typography.sizes.body,
                  marginRight: theme.spacing.md,
                },
              ]}
            >
              Strength Progress →
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/progress/recovery')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.headerLink,
                {
                  color: theme.colors.primary,
                  fontFamily: theme.typography.fonts.bodyMedium,
                  fontSize: theme.typography.sizes.body,
                },
              ]}
            >
              Recovery Details →
            </Text>
          </TouchableOpacity>
        </View>

        <Spacer size="md" />

        {/* No Workouts State */}
        {workouts.length === 0 ? (
          <Card variant="elevated" padding="lg">
            <Text
              style={[
                styles.emptyTitle,
                {
                  color: theme.colors.textPrimary,
                  fontFamily: theme.typography.fonts.headingMedium,
                  fontSize: theme.typography.sizes.h3,
                  marginBottom: theme.spacing.md,
                  textAlign: 'center',
                },
              ]}
            >
              No workouts yet
            </Text>
            <Text
              style={[
                styles.emptyText,
                {
                  color: theme.colors.textMuted,
                  fontFamily: theme.typography.fonts.body,
                  fontSize: theme.typography.sizes.body,
                  textAlign: 'center',
                },
              ]}
            >
              Complete your first workout to see your progress here.
            </Text>
          </Card>
        ) : (
          <>
            {/* Overall Progress Summary Card */}
            <ProgressSummaryCard workouts={workouts} />

            <Spacer size="lg" />

            {/* Volume Trend Chart */}
            <VolumeTrendChart workouts={workouts} />

            <Spacer size="lg" />

            {/* Intensity Trend Chart */}
            <IntensityTrendChart workouts={workouts} />

            <Spacer size="lg" />

            {/* Movement Pattern Trends Section */}
            {patternsToShow.length > 0 && (
              <>
                <Text
                  style={[
                    styles.sectionTitle,
                    {
                      color: theme.colors.textPrimary,
                      fontFamily: theme.typography.fonts.headingMedium,
                      fontSize: theme.typography.sizes.h3,
                      marginBottom: theme.spacing.md,
                    },
                  ]}
                >
                  Movement Pattern Trends
                </Text>

                {patternsToShow.map((pattern, index) => (
                  <React.Fragment key={pattern}>
                    <PatternVolumeTrendChart workouts={workouts} pattern={pattern} />
                    {index < patternsToShow.length - 1 && <Spacer size="lg" />}
                  </React.Fragment>
                ))}

                <Spacer size="lg" />
              </>
            )}

            {/* Main Lift Trends Section */}
            {blockTitlesWithData.length > 0 && (
              <>
                <Text
                  style={[
                    styles.sectionTitle,
                    {
                      color: theme.colors.textPrimary,
                      fontFamily: theme.typography.fonts.headingMedium,
                      fontSize: theme.typography.sizes.h3,
                      marginBottom: theme.spacing.md,
                    },
                  ]}
                >
                  Main Lift Trends
                </Text>

                {blockTitlesWithData.map((blockTitle, index) => (
                  <React.Fragment key={blockTitle}>
                    <BlockVolumeTrendChart workouts={workouts} blockTitle={blockTitle} />
                    {index < blockTitlesWithData.length - 1 && <Spacer size="lg" />}
                  </React.Fragment>
                ))}

                <Spacer size="lg" />
              </>
            )}

            {/* Recent Workouts Section */}
            <Text
              style={[
                styles.sectionTitle,
                {
                  color: theme.colors.textPrimary,
                  fontFamily: theme.typography.fonts.headingMedium,
                  fontSize: theme.typography.sizes.h3,
                  marginBottom: theme.spacing.md,
                },
              ]}
            >
              Recent Workouts
            </Text>

            {/* Workout History List */}
            <WorkoutHistoryList workouts={workouts} />

            <Spacer size="lg" />
          </>
        )}
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
  headerTitle: {
    fontWeight: '600',
  },
  headerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLink: {
    fontWeight: '500',
  },
  sectionTitle: {
    fontWeight: '600',
  },
  emptyTitle: {
    fontWeight: '600',
  },
  emptyText: {
    fontWeight: '400',
    lineHeight: 22,
  },
});
