import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { Card, IconButton, Spacer } from '../../components';
import { useUserStore } from '../../core/store';

type MainStackParamList = {
  Progress: undefined;
};

type NavigationProp = StackNavigationProp<MainStackParamList>;

interface ReadinessFactor {
  name: string;
  value: number; // 1-5
}

interface FactorTrend {
  factor: string;
  trend: string;
}

export default function ReadinessDetailScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { currentReadiness, readinessHistory } = useUserStore();

  // TODO: Replace with actual data from useUserStore.readinessHistory
  const mockReadinessData = {
    averageReadiness: 72,
    bestDay: { name: 'Thursday', score: 85 },
    lowestDay: { name: 'Monday', score: 58 },
  };

  // TODO: Replace with actual factor values from currentReadiness or latest entry
  const mockFactors: ReadinessFactor[] = [
    { name: 'Sleep Quality', value: 4 },
    { name: 'Energy', value: 3 },
    { name: 'Soreness', value: 2 },
    { name: 'Stress', value: 3 },
  ];

  // TODO: Replace with actual trend calculations from readinessHistory
  const mockFactorTrends: FactorTrend[] = [
    { factor: 'Sleep Quality', trend: 'improving (+8% over last week)' },
    { factor: 'Stress', trend: 'stable' },
    { factor: 'Energy', trend: 'slightly increasing' },
    { factor: 'Soreness', trend: 'higher after heavy lower-body days' },
  ];

  // TODO: Replace with algorithmic insights from readiness engine
  const mockInsights = [
    'Your highest readiness tends to occur mid-week.',
    'Lower readiness days correlate with high-intensity conditioning sessions.',
    'Increasing sleep by even 30 minutes appears to improve readiness scores.',
  ];

  const renderFactorBar = (value: number) => {
    return (
      <View
        style={[
          styles.factorBarContainer,
          {
            flexDirection: 'row',
            width: 100,
            height: 8,
            backgroundColor: theme.colors.steel,
            borderRadius: theme.radius.sm,
            overflow: 'hidden',
          },
        ]}
      >
        {[1, 2, 3, 4, 5].map((level) => (
          <View
            key={level}
            style={[
              styles.factorBarSegment,
              {
                flex: 1,
                backgroundColor:
                  level <= value ? theme.colors.acidGreen : 'transparent',
                marginRight: level < 5 ? 1 : 0,
              },
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.carbon }]}
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
          onPress={() => navigation.goBack()}
          variant="ghost"
          size="medium"
        />
        <View style={styles.headerContent}>
          <Text
            style={[
              styles.headerTitle,
              {
                color: theme.colors.white,
                fontFamily: theme.typography.fonts.headingMedium,
                fontSize: theme.typography.sizes.h2,
              },
            ]}
          >
            Readiness
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
        {/* Readiness Trend Chart */}
        <Card
          variant="elevated"
          padding="lg"
          style={{ marginBottom: theme.spacing.lg }}
        >
          <Text
            style={[
              styles.sectionTitle,
              {
                color: theme.colors.white,
                fontFamily: theme.typography.fonts.headingMedium,
                fontSize: theme.typography.sizes.h3,
                marginBottom: theme.spacing.xs,
              },
            ]}
          >
            Weekly Trend
          </Text>
          <Text
            style={[
              styles.sectionSubtitle,
              {
                color: theme.colors.muted,
                fontFamily: theme.typography.fonts.body,
                fontSize: theme.typography.sizes.bodySmall,
                marginBottom: theme.spacing.lg,
              },
            ]}
          >
            Last 7 Days
          </Text>

          {/* Chart Placeholder */}
          <View
            style={[
              styles.chartPlaceholder,
              {
                backgroundColor: theme.colors.graphite,
                borderRadius: theme.radius.md,
                padding: theme.spacing.xxxl,
                marginBottom: theme.spacing.lg,
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 200,
              },
            ]}
          >
            <Text
              style={[
                styles.chartPlaceholderText,
                {
                  color: theme.colors.muted,
                  fontFamily: theme.typography.fonts.body,
                  fontSize: theme.typography.sizes.body,
                },
              ]}
            >
              [Readiness Trend Chart Placeholder]
            </Text>
            {/* TODO: Replace with real chart library and readiness data from useUserStore.readinessHistory */}
          </View>

          {/* Summary Stats */}
          <View style={styles.statsContainer}>
            <View
              style={[
                styles.statRow,
                {
                  marginBottom: theme.spacing.sm,
                },
              ]}
            >
              <Text
                style={[
                  styles.statLabel,
                  {
                    color: theme.colors.muted,
                    fontFamily: theme.typography.fonts.body,
                    fontSize: theme.typography.sizes.body,
                  },
                ]}
              >
                Average Readiness:
              </Text>
              <Text
                style={[
                  styles.statValue,
                  {
                    color: theme.colors.acidGreen,
                    fontFamily: theme.typography.fonts.headingMedium,
                    fontSize: theme.typography.sizes.body,
                  },
                ]}
              >
                {mockReadinessData.averageReadiness}
              </Text>
            </View>
            <View
              style={[
                styles.statRow,
                {
                  marginBottom: theme.spacing.sm,
                },
              ]}
            >
              <Text
                style={[
                  styles.statLabel,
                  {
                    color: theme.colors.muted,
                    fontFamily: theme.typography.fonts.body,
                    fontSize: theme.typography.sizes.body,
                  },
                ]}
              >
                Best Day:
              </Text>
              <Text
                style={[
                  styles.statValue,
                  {
                    color: theme.colors.acidGreen,
                    fontFamily: theme.typography.fonts.bodyMedium,
                    fontSize: theme.typography.sizes.body,
                  },
                ]}
              >
                {mockReadinessData.bestDay.name} (
                {mockReadinessData.bestDay.score})
              </Text>
            </View>
            <View style={styles.statRow}>
              <Text
                style={[
                  styles.statLabel,
                  {
                    color: theme.colors.muted,
                    fontFamily: theme.typography.fonts.body,
                    fontSize: theme.typography.sizes.body,
                  },
                ]}
              >
                Lowest Day:
              </Text>
              <Text
                style={[
                  styles.statValue,
                  {
                    color: theme.colors.white,
                    fontFamily: theme.typography.fonts.bodyMedium,
                    fontSize: theme.typography.sizes.body,
                  },
                ]}
              >
                {mockReadinessData.lowestDay.name} (
                {mockReadinessData.lowestDay.score})
              </Text>
            </View>
          </View>
        </Card>

        {/* Readiness Factor Breakdown */}
        <Card
          variant="elevated"
          padding="lg"
          style={{ marginBottom: theme.spacing.lg }}
        >
          <Text
            style={[
              styles.sectionTitle,
              {
                color: theme.colors.white,
                fontFamily: theme.typography.fonts.headingMedium,
                fontSize: theme.typography.sizes.h3,
                marginBottom: theme.spacing.lg,
              },
            ]}
          >
            Daily Factors
          </Text>

          {mockFactors.map((factor, index) => (
            <View
              key={factor.name}
              style={[
                styles.factorRow,
                {
                  paddingVertical: theme.spacing.md,
                  borderBottomWidth: index < mockFactors.length - 1 ? 1 : 0,
                  borderBottomColor: theme.colors.steel,
                },
              ]}
            >
              <Text
                style={[
                  styles.factorLabel,
                  {
                    color: theme.colors.white,
                    fontFamily: theme.typography.fonts.body,
                    fontSize: theme.typography.sizes.body,
                    flex: 1,
                  },
                ]}
              >
                {factor.name}
              </Text>
              <View style={styles.factorRight}>
                {renderFactorBar(factor.value)}
                <Text
                  style={[
                    styles.factorValue,
                    {
                      color: theme.colors.acidGreen,
                      fontFamily: theme.typography.fonts.bodyMedium,
                      fontSize: theme.typography.sizes.body,
                      marginLeft: theme.spacing.md,
                      minWidth: 30,
                      textAlign: 'right',
                    },
                  ]}
                >
                  {factor.value}
                </Text>
              </View>
            </View>
          ))}
        </Card>

        {/* Factor Trends */}
        <Card
          variant="elevated"
          padding="lg"
          style={{ marginBottom: theme.spacing.lg }}
        >
          <Text
            style={[
              styles.sectionTitle,
              {
                color: theme.colors.white,
                fontFamily: theme.typography.fonts.headingMedium,
                fontSize: theme.typography.sizes.h3,
                marginBottom: theme.spacing.lg,
              },
            ]}
          >
            Factor Trends
          </Text>

          {mockFactorTrends.map((trend, index) => (
            <Text
              key={index}
              style={[
                styles.trendText,
                {
                  color: theme.colors.muted,
                  fontFamily: theme.typography.fonts.body,
                  fontSize: theme.typography.sizes.body,
                  marginBottom:
                    index < mockFactorTrends.length - 1 ? theme.spacing.md : 0,
                  lineHeight: 22,
                },
              ]}
            >
              • {trend.factor} {trend.trend}
            </Text>
          ))}
        </Card>

        {/* Readiness Insights */}
        <Card
          variant="elevated"
          padding="lg"
          style={{ marginBottom: theme.spacing.lg }}
        >
          <Text
            style={[
              styles.sectionTitle,
              {
                color: theme.colors.white,
                fontFamily: theme.typography.fonts.headingMedium,
                fontSize: theme.typography.sizes.h3,
                marginBottom: theme.spacing.lg,
              },
            ]}
          >
            Insights
          </Text>

          {mockInsights.map((insight, index) => (
            <Text
              key={index}
              style={[
                styles.insightText,
                {
                  color: theme.colors.muted,
                  fontFamily: theme.typography.fonts.body,
                  fontSize: theme.typography.sizes.body,
                  marginBottom:
                    index < mockInsights.length - 1 ? theme.spacing.md : 0,
                  lineHeight: 22,
                },
              ]}
            >
              • {insight}
            </Text>
          ))}
        </Card>

        {/* Future Premium Features */}
        <Card
          variant="elevated"
          padding="lg"
          style={{ marginBottom: theme.spacing.lg }}
        >
          <Text
            style={[
              styles.sectionTitle,
              {
                color: theme.colors.white,
                fontFamily: theme.typography.fonts.headingMedium,
                fontSize: theme.typography.sizes.h3,
                marginBottom: theme.spacing.lg,
              },
            ]}
          >
            Coming Soon
          </Text>

          <View
            style={[
              styles.futureFeatureRow,
              {
                paddingVertical: theme.spacing.md,
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.steel,
                opacity: 0.4,
              },
            ]}
          >
            <Text
              style={[
                styles.futureFeatureLabel,
                {
                  color: theme.colors.muted,
                  fontFamily: theme.typography.fonts.body,
                  fontSize: theme.typography.sizes.body,
                },
              ]}
            >
              Sleep Source Integration (Apple Health)
            </Text>
          </View>

          <View
            style={[
              styles.futureFeatureRow,
              {
                paddingVertical: theme.spacing.md,
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.steel,
                opacity: 0.4,
              },
            ]}
          >
            <Text
              style={[
                styles.futureFeatureLabel,
                {
                  color: theme.colors.muted,
                  fontFamily: theme.typography.fonts.body,
                  fontSize: theme.typography.sizes.body,
                },
              ]}
            >
              Heart Rate & HRV Metrics
            </Text>
          </View>

          <View
            style={[
              styles.futureFeatureRow,
              {
                paddingVertical: theme.spacing.md,
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.steel,
                opacity: 0.4,
              },
            ]}
          >
            <Text
              style={[
                styles.futureFeatureLabel,
                {
                  color: theme.colors.muted,
                  fontFamily: theme.typography.fonts.body,
                  fontSize: theme.typography.sizes.body,
                },
              ]}
            >
              Recovery Score Predictions
            </Text>
          </View>

          <View
            style={[
              styles.futureFeatureRow,
              {
                paddingVertical: theme.spacing.md,
                opacity: 0.4,
              },
            ]}
          >
            <Text
              style={[
                styles.futureFeatureLabel,
                {
                  color: theme.colors.muted,
                  fontFamily: theme.typography.fonts.body,
                  fontSize: theme.typography.sizes.body,
                },
              ]}
            >
              Impact-Based Session Rebalancing
            </Text>
          </View>
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
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  sectionTitle: {
    fontWeight: '600',
  },
  sectionSubtitle: {
    fontWeight: '400',
  },
  chartPlaceholder: {
    // Styled inline
  },
  chartPlaceholderText: {
    fontWeight: '400',
  },
  statsContainer: {
    width: '100%',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontWeight: '400',
  },
  statValue: {
    fontWeight: '500',
  },
  factorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  factorLabel: {
    fontWeight: '400',
  },
  factorRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  factorBarContainer: {
    // Styled inline
  },
  factorBarSegment: {
    // Styled inline
  },
  factorValue: {
    fontWeight: '500',
  },
  trendText: {
    fontWeight: '400',
  },
  insightText: {
    fontWeight: '400',
  },
  futureFeatureRow: {
    width: '100%',
  },
  futureFeatureLabel: {
    fontWeight: '400',
  },
});
