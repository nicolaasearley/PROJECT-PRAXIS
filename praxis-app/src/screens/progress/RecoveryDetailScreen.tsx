import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@theme';
import { Card, Spacer } from '@components';
import { useWorkoutHistoryStore } from '@/store/workoutHistoryStore';
import { useRecoveryStore } from '@/store/recoveryStore';
import {
  calculateAcuteLoad,
  calculateChronicLoad,
  calculateAcwr,
  calculateMovementPatternFatigue,
  calculateIntensityFatigue,
  calculateRestFatigue,
  calculateRecoveryScore,
} from '@/utils/recoveryAnalytics';
import {
  VictoryChart,
  VictoryLine,
  VictoryAxis,
  VictoryTooltip,
  VictoryVoronoiContainer,
} from 'victory-native';
import dayjs from 'dayjs';

const chartHeight = 200;

/**
 * Format date for X-axis labels
 */
function formatXAxisLabel(dateString: string): string {
  const date = dayjs(dateString);
  const today = dayjs();
  const yesterday = today.subtract(1, 'day');

  if (date.isSame(today, 'day')) {
    return 'Today';
  }
  if (date.isSame(yesterday, 'day')) {
    return 'Yesterday';
  }
  return date.format('ddd');
}

/**
 * Format date for tooltip
 */
function formatTooltipDate(dateString: string): string {
  const date = dayjs(dateString);
  const today = dayjs();
  const yesterday = today.subtract(1, 'day');

  if (date.isSame(today, 'day')) {
    return 'Today';
  }
  if (date.isSame(yesterday, 'day')) {
    return 'Yesterday';
  }
  return date.format('MMM D');
}

export default function RecoveryDetailScreen() {
  const theme = useTheme();
  const { getWorkouts, _hasHydrated: historyHydrated } = useWorkoutHistoryStore();
  const { recoveryToday, breakdown, _hasHydrated: recoveryHydrated } = useRecoveryStore();
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - theme.spacing.lg * 2 - theme.spacing.lg * 2;

  const workouts = getWorkouts();

  // Calculate historical recovery scores (last 14 days)
  const recoveryHistory = useMemo(() => {
    if (workouts.length === 0) return [];

    const now = dayjs();
    const history: Array<{ date: string; score: number; acwr: number }> = [];

    // For each of the last 14 days, calculate recovery score
    for (let i = 13; i >= 0; i--) {
      const targetDate = now.subtract(i, 'days');
      const targetISO = targetDate.format('YYYY-MM-DD');

      // Get workouts up to and including this date
      const workoutsUpToDate = workouts.filter((w) => {
        const workoutDate = dayjs(w.date);
        return workoutDate.isBefore(targetDate) || workoutDate.isSame(targetDate, 'day');
      });

      if (workoutsUpToDate.length === 0) continue;

      // Calculate recovery score using the full function
      const { score } = calculateRecoveryScore(workoutsUpToDate);
      
      // Calculate ACWR separately for the chart
      const acute = calculateAcuteLoad(workoutsUpToDate);
      const chronic = calculateChronicLoad(workoutsUpToDate);
      const acwrFatigue = calculateAcwr(acute, chronic);

      history.push({
        date: targetISO,
        score: Math.min(100, Math.max(0, Math.round(score))),
        acwr: acwrFatigue,
      });
    }

    return history;
  }, [workouts]);

  // Prepare chart data
  const recoveryChartData = useMemo(() => {
    if (recoveryHistory.length === 0) return [];
    return recoveryHistory.map((point, index) => ({
      x: index + 1,
      y: point.score,
      date: point.date,
      label: `${formatTooltipDate(point.date)}\nRecovery: ${point.score}`,
    }));
  }, [recoveryHistory]);

  const acwrChartData = useMemo(() => {
    if (recoveryHistory.length === 0) return [];
    return recoveryHistory.map((point, index) => ({
      x: index + 1,
      y: point.acwr,
      date: point.date,
      label: `${formatTooltipDate(point.date)}\nACWR Fatigue: ${Math.round(point.acwr)}%`,
    }));
  }, [recoveryHistory]);

  // Movement pattern fatigue data
  const movementFatigueData = useMemo(() => {
    if (!breakdown) return null;
    return breakdown.movementPatternFatigue;
  }, [breakdown]);

  if (!historyHydrated || !recoveryHydrated) {
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
            styles.pageTitle,
            {
              color: theme.colors.textPrimary,
              fontFamily: theme.typography.fonts.heading,
              fontSize: theme.typography.sizes.h1,
              marginBottom: theme.spacing.xl,
            },
          ]}
        >
          Recovery Analysis
        </Text>

        {/* Current Recovery Score */}
        {recoveryToday !== null && breakdown && (
          <>
            <Card variant="elevated" padding="lg">
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
                Today's Recovery Score
              </Text>
              <View style={styles.scoreContainer}>
                <Text
                  style={[
                    styles.scoreText,
                    {
                      color: theme.colors.primary,
                      fontFamily: theme.typography.fonts.heading,
                      fontSize: 64,
                    },
                  ]}
                >
                  {recoveryToday}
                </Text>
              </View>
            </Card>

            <Spacer size="lg" />
          </>
        )}

        {/* Recovery Score Trend */}
        {recoveryChartData.length >= 2 && (
          <>
            <Card variant="elevated" padding="lg">
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
                Recovery Score Trend
              </Text>
              <View
                style={[
                  styles.chartContainer,
                  {
                    backgroundColor: theme.colors.surface2,
                    borderRadius: theme.radius.xl,
                  },
                ]}
              >
                <VictoryChart
                  width={chartWidth}
                  height={chartHeight}
                  padding={{ left: 50, right: 20, top: 20, bottom: 40 }}
                  domainPadding={{ x: 10, y: 10 }}
                  containerComponent={
                    <VictoryVoronoiContainer
                      voronoiDimension="x"
                      labels={({ datum }: any) => datum.label}
                      labelComponent={
                        <VictoryTooltip
                          flyoutStyle={{
                            fill: theme.colors.surface2,
                            stroke: theme.colors.surface3,
                            strokeWidth: 1,
                          }}
                          style={{
                            fill: theme.colors.textPrimary,
                            fontFamily: theme.typography.fonts.body,
                            fontSize: theme.typography.sizes.bodySmall,
                          }}
                        />
                      }
                    />
                  }
                >
                  <VictoryAxis
                    dependentAxis
                    style={{
                      axis: { stroke: theme.colors.surface3 },
                      tickLabels: {
                        fill: theme.colors.textMuted,
                        fontFamily: theme.typography.fonts.body,
                        fontSize: theme.typography.sizes.bodySmall,
                      },
                      grid: {
                        stroke: theme.colors.surface3,
                        strokeWidth: 1,
                      },
                    }}
                  />
                  <VictoryAxis
                    style={{
                      axis: { stroke: theme.colors.surface3 },
                      tickLabels: {
                        fill: theme.colors.textMuted,
                        fontFamily: theme.typography.fonts.body,
                        fontSize: theme.typography.sizes.bodySmall,
                      },
                    }}
                    tickFormat={(t) => {
                      const dataPoint = recoveryChartData.find((d) => d.x === t);
                      if (dataPoint) {
                        return formatXAxisLabel(dataPoint.date);
                      }
                      return '';
                    }}
                  />
                  <VictoryLine
                    data={recoveryChartData}
                    style={{
                      data: {
                        stroke: theme.colors.primary,
                        strokeWidth: 2,
                      },
                    }}
                    interpolation="monotoneX"
                  />
                </VictoryChart>
              </View>
            </Card>

            <Spacer size="lg" />
          </>
        )}

        {/* ACWR Trend */}
        {acwrChartData.length >= 2 && (
          <>
            <Card variant="elevated" padding="lg">
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
                ACWR Fatigue Trend
              </Text>
              <View
                style={[
                  styles.chartContainer,
                  {
                    backgroundColor: theme.colors.surface2,
                    borderRadius: theme.radius.xl,
                  },
                ]}
              >
                <VictoryChart
                  width={chartWidth}
                  height={chartHeight}
                  padding={{ left: 50, right: 20, top: 20, bottom: 40 }}
                  domainPadding={{ x: 10, y: 10 }}
                  containerComponent={
                    <VictoryVoronoiContainer
                      voronoiDimension="x"
                      labels={({ datum }: any) => datum.label}
                      labelComponent={
                        <VictoryTooltip
                          flyoutStyle={{
                            fill: theme.colors.surface2,
                            stroke: theme.colors.surface3,
                            strokeWidth: 1,
                          }}
                          style={{
                            fill: theme.colors.textPrimary,
                            fontFamily: theme.typography.fonts.body,
                            fontSize: theme.typography.sizes.bodySmall,
                          }}
                        />
                      }
                    />
                  }
                >
                  <VictoryAxis
                    dependentAxis
                    style={{
                      axis: { stroke: theme.colors.surface3 },
                      tickLabels: {
                        fill: theme.colors.textMuted,
                        fontFamily: theme.typography.fonts.body,
                        fontSize: theme.typography.sizes.bodySmall,
                      },
                      grid: {
                        stroke: theme.colors.surface3,
                        strokeWidth: 1,
                      },
                    }}
                  />
                  <VictoryAxis
                    style={{
                      axis: { stroke: theme.colors.surface3 },
                      tickLabels: {
                        fill: theme.colors.textMuted,
                        fontFamily: theme.typography.fonts.body,
                        fontSize: theme.typography.sizes.bodySmall,
                      },
                    }}
                    tickFormat={(t) => {
                      const dataPoint = acwrChartData.find((d) => d.x === t);
                      if (dataPoint) {
                        return formatXAxisLabel(dataPoint.date);
                      }
                      return '';
                    }}
                  />
                  <VictoryLine
                    data={acwrChartData}
                    style={{
                      data: {
                        stroke: theme.colors.warning,
                        strokeWidth: 2,
                      },
                    }}
                    interpolation="monotoneX"
                  />
                </VictoryChart>
              </View>
            </Card>

            <Spacer size="lg" />
          </>
        )}

        {/* Movement Pattern Fatigue */}
        {movementFatigueData && (
          <>
            <Card variant="elevated" padding="lg">
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
                Movement Pattern Fatigue
              </Text>
              <View style={styles.fatigueGrid}>
                <View style={styles.fatigueItem}>
                  <Text
                    style={[
                      styles.fatigueLabel,
                      {
                        color: theme.colors.textSecondary,
                        fontFamily: theme.typography.fonts.body,
                        fontSize: theme.typography.sizes.bodySmall,
                      },
                    ]}
                  >
                    Squat
                  </Text>
                  <Text
                    style={[
                      styles.fatigueValue,
                      {
                        color: theme.colors.textPrimary,
                        fontFamily: theme.typography.fonts.bodyMedium,
                        fontSize: theme.typography.sizes.body,
                      },
                    ]}
                  >
                    {Math.round(movementFatigueData.squat)}%
                  </Text>
                </View>
                <View style={styles.fatigueItem}>
                  <Text
                    style={[
                      styles.fatigueLabel,
                      {
                        color: theme.colors.textSecondary,
                        fontFamily: theme.typography.fonts.body,
                        fontSize: theme.typography.sizes.bodySmall,
                      },
                    ]}
                  >
                    Hinge
                  </Text>
                  <Text
                    style={[
                      styles.fatigueValue,
                      {
                        color: theme.colors.textPrimary,
                        fontFamily: theme.typography.fonts.bodyMedium,
                        fontSize: theme.typography.sizes.body,
                      },
                    ]}
                  >
                    {Math.round(movementFatigueData.hinge)}%
                  </Text>
                </View>
                <View style={styles.fatigueItem}>
                  <Text
                    style={[
                      styles.fatigueLabel,
                      {
                        color: theme.colors.textSecondary,
                        fontFamily: theme.typography.fonts.body,
                        fontSize: theme.typography.sizes.bodySmall,
                      },
                    ]}
                  >
                    Push
                  </Text>
                  <Text
                    style={[
                      styles.fatigueValue,
                      {
                        color: theme.colors.textPrimary,
                        fontFamily: theme.typography.fonts.bodyMedium,
                        fontSize: theme.typography.sizes.body,
                      },
                    ]}
                  >
                    {Math.round(movementFatigueData.push)}%
                  </Text>
                </View>
                <View style={styles.fatigueItem}>
                  <Text
                    style={[
                      styles.fatigueLabel,
                      {
                        color: theme.colors.textSecondary,
                        fontFamily: theme.typography.fonts.body,
                        fontSize: theme.typography.sizes.bodySmall,
                      },
                    ]}
                  >
                    Pull
                  </Text>
                  <Text
                    style={[
                      styles.fatigueValue,
                      {
                        color: theme.colors.textPrimary,
                        fontFamily: theme.typography.fonts.bodyMedium,
                        fontSize: theme.typography.sizes.body,
                      },
                    ]}
                  >
                    {Math.round(movementFatigueData.pull)}%
                  </Text>
                </View>
              </View>
            </Card>

            <Spacer size="lg" />
          </>
        )}

        {/* Guidance Text */}
        <Card variant="elevated" padding="lg">
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
            Understanding Recovery Score
          </Text>
          <Text
            style={[
              styles.guidanceText,
              {
                color: theme.colors.textSecondary,
                fontFamily: theme.typography.fonts.body,
                fontSize: theme.typography.sizes.body,
                lineHeight: 22,
              },
            ]}
          >
            Your Recovery Score combines multiple factors to assess your readiness to train:
            {'\n\n'}
            • ACWR (30%): Compares your recent 7-day load to your 28-day average
            {'\n'}
            • Movement Pattern Fatigue (30%): Tracks fatigue across squat, hinge, push, and pull patterns
            {'\n'}
            • Intensity Fatigue (20%): Based on RPE and workout density
            {'\n'}
            • Rest Fatigue (20%): Average rest time between sets
            {'\n\n'}
            Higher scores indicate better recovery and readiness. Use this to guide your training intensity.
          </Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  pageTitle: {
    fontWeight: '700',
  },
  sectionTitle: {
    fontWeight: '600',
  },
  scoreContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  scoreText: {
    fontWeight: '700',
  },
  chartContainer: {
    overflow: 'hidden',
  },
  fatigueGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  fatigueItem: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  fatigueLabel: {
    fontWeight: '400',
  },
  fatigueValue: {
    fontWeight: '500',
  },
  guidanceText: {
    fontWeight: '400',
  },
});
