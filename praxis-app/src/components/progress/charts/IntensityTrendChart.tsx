import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '@theme';
import { Card } from '@components';
import { WorkoutRecord } from '@/types/workout';
import {
  VictoryChart,
  VictoryLine,
  VictoryAxis,
  VictoryTooltip,
  VictoryVoronoiContainer,
} from 'victory-native';
import dayjs from 'dayjs';

interface IntensityTrendChartProps {
  workouts: WorkoutRecord[];
}

// Chart dimensions will be calculated based on screen width and padding
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
  return date.format('ddd'); // Weekday abbreviation
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

export default function IntensityTrendChart({
  workouts,
}: IntensityTrendChartProps) {
  const theme = useTheme();
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - theme.spacing.lg * 2 - theme.spacing.lg * 2; // Screen padding + card padding

  // Prepare chart data - last 10 workouts, sorted by date ascending
  const chartData = useMemo(() => {
    if (workouts.length === 0) return [];

    // Sort by date ascending for chart
    const sorted = [...workouts]
      .sort((a, b) => {
        const dateA = dayjs(a.date);
        const dateB = dayjs(b.date);
        if (dateA.isBefore(dateB)) return -1;
        if (dateA.isAfter(dateB)) return 1;
        return a.startTime - b.startTime;
      })
      .slice(-10); // Last 10 workouts

    return sorted.map((workout, index) => ({
      x: index + 1,
      y: workout.intensityScore,
      date: workout.date,
      label: `${formatTooltipDate(workout.date)}\nIntensity: ${workout.intensityScore.toFixed(1)}`,
    }));
  }, [workouts]);

  // Calculate Y-axis domain
  const yDomain = useMemo(() => {
    if (chartData.length === 0) return [0, 100];
    const values = chartData.map((d) => d.y);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const padding = (max - min) * 0.1 || max * 0.1;
    return [Math.max(0, min - padding), max + padding];
  }, [chartData]);

  if (chartData.length === 0) {
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
          Intensity Trend
        </Text>
        <View
          style={[
            styles.emptyChart,
            {
              backgroundColor: theme.colors.surface2,
              borderRadius: theme.radius.xl,
              minHeight: chartHeight,
            },
          ]}
        >
          <Text
            style={[
              styles.emptyText,
              {
                color: theme.colors.textMuted,
                fontFamily: theme.typography.fonts.body,
                fontSize: theme.typography.sizes.bodySmall,
              },
            ]}
          >
            No data available
          </Text>
        </View>
      </Card>
    );
  }

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
        Intensity Trend
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
              const dataPoint = chartData.find((d) => d.x === t);
              if (dataPoint) {
                return formatXAxisLabel(dataPoint.date);
              }
              return '';
            }}
          />
          <VictoryLine
            data={chartData}
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
  );
}

const styles = StyleSheet.create({
  title: {
    fontWeight: '600',
  },
  chartContainer: {
    overflow: 'hidden',
  },
  emptyChart: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontWeight: '400',
  },
});
