import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '@theme';
import { Card } from '@components';
import {
  VictoryChart,
  VictoryLine,
  VictoryAxis,
  VictoryTooltip,
  VictoryVoronoiContainer,
} from 'victory-native';

interface ExerciseTrendChartProps {
  title: string;
  data: Array<{ dateLabel: string; value: number }>;
}

const chartHeight = 200;

export default function ExerciseTrendChart({
  title,
  data,
}: ExerciseTrendChartProps) {
  const theme = useTheme();
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - theme.spacing.lg * 2 - theme.spacing.lg * 2;

  // Prepare chart data
  const chartData = useMemo(() => {
    if (data.length === 0) return [];
    return data.map((point, index) => ({
      x: index + 1,
      y: point.value,
      dateLabel: point.dateLabel,
      label: `${point.dateLabel}\n${title}: ${point.value}`,
    }));
  }, [data, title]);

  // Calculate Y-axis domain
  const yDomain = useMemo(() => {
    if (chartData.length === 0) return [0, 100];
    const values = chartData.map((d) => d.y);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const padding = (max - min) * 0.1 || max * 0.1;
    return [Math.max(0, min - padding), max + padding];
  }, [chartData]);

  // Don't render if fewer than 2 data points
  if (chartData.length < 2) {
    return null;
  }

  // Format Y-axis labels based on value range
  const formatYLabel = (value: number): string => {
    if (chartData.length === 0) return value.toString();
    const maxValue = Math.max(...chartData.map((d) => d.y));
    if (maxValue >= 1000) {
      return `${Math.round(value / 1000)}k`;
    }
    return Math.round(value).toString();
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
        {title}
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
              tickFormat={formatYLabel}
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
                  return dataPoint.dateLabel;
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
});
