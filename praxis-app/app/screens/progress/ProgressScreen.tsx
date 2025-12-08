import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../../../src/theme';
import { Card, PraxisButton, Spacer } from '../../components';
import { useUserStore } from '../../../src/core/store';

type MainStackParamList = {
  StrengthDetail: undefined;
  ConditioningDetail: undefined;
  ReadinessDetail: undefined;
};

type NavigationProp = StackNavigationProp<MainStackParamList>;

interface StrengthLift {
  name: string;
  current1RM: number;
  previous1RM: number;
  change: number;
  timePeriod: string;
}

export default function ProgressScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { personalRecords } = useUserStore();

  // TODO: Replace with actual data from useSessionStore and PR detection
  const mockStrengthLifts: StrengthLift[] = [
    {
      name: 'Back Squat',
      current1RM: 295,
      previous1RM: 275,
      change: 20,
      timePeriod: '6 weeks',
    },
    {
      name: 'Bench Press',
      current1RM: 195,
      previous1RM: 185,
      change: 10,
      timePeriod: '6 weeks',
    },
    {
      name: 'Deadlift',
      current1RM: 355,
      previous1RM: 335,
      change: 20,
      timePeriod: '6 weeks',
    },
  ];

  // TODO: Replace with actual conditioning data from useSessionStore
  const mockConditioningData = {
    zoneDistribution: {
      z1: 12,
      z2: 32,
      z3: 38,
      z4: 14,
      z5: 4,
    },
    bestInterval: {
      type: '4x4 @ Z4',
      avgPace: '1:48/500m',
    },
    engineTrend: {
      improvement: 3,
      timePeriod: 'last 4 weeks',
    },
  };

  // TODO: Replace with actual readiness data from useUserStore.readinessHistory
  const mockReadinessData = {
    weeklyAverage: 72,
    trend: 6,
    bestDay: {
      name: 'Thursday',
      score: 85,
    },
    lowestDay: {
      name: 'Monday',
      score: 58,
    },
  };

  // TODO: Replace with actual PRs from useUserStore.personalRecords
  const mockRecentPRs = [
    'Back Squat: +10 lb estimated',
    '500m Row: New Best — 1:38',
    'Bench Press: +5 lb',
  ];

  const handleViewStrengthGraph = () => {
    navigation.navigate('StrengthDetail');
  };

  const handleViewConditioningDetails = () => {
    navigation.navigate('ConditioningDetail');
  };

  const handleViewReadinessGraph = () => {
    navigation.navigate('ReadinessDetail');
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
          Progress
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { padding: theme.spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Strength Progression Section */}
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
                marginBottom: theme.spacing.xl,
              },
            ]}
          >
            Strength Progression
          </Text>

          {mockStrengthLifts.map((lift, index) => (
            <View
              key={index}
              style={[
                styles.liftRow,
                {
                  marginBottom:
                    index < mockStrengthLifts.length - 1 ? theme.spacing.lg : 0,
                  paddingBottom:
                    index < mockStrengthLifts.length - 1 ? theme.spacing.lg : 0,
                  borderBottomWidth:
                    index < mockStrengthLifts.length - 1 ? 1 : 0,
                  borderBottomColor: theme.colors.steel,
                },
              ]}
            >
              <View style={styles.liftInfo}>
                <Text
                  style={[
                    styles.liftName,
                    {
                      color: theme.colors.white,
                      fontFamily: theme.typography.fonts.headingMedium,
                      fontSize: theme.typography.sizes.body,
                      marginBottom: theme.spacing.xs,
                    },
                  ]}
                >
                  {lift.name}
                </Text>
                <Text
                  style={[
                    styles.liftValue,
                    {
                      color: theme.colors.acidGreen,
                      fontFamily: theme.typography.fonts.bodyMedium,
                      fontSize: theme.typography.sizes.h3,
                      marginBottom: theme.spacing.xs,
                    },
                  ]}
                >
                  {lift.current1RM} lb
                </Text>
                <Text
                  style={[
                    styles.liftChange,
                    {
                      color: theme.colors.muted,
                      fontFamily: theme.typography.fonts.body,
                      fontSize: theme.typography.sizes.bodySmall,
                    },
                  ]}
                >
                  {lift.change > 0 ? '+' : ''}
                  {lift.change} lb in {lift.timePeriod}
                </Text>
              </View>
            </View>
          ))}

          <Spacer size="md" />

          <PraxisButton
            title="View Graph"
            onPress={handleViewStrengthGraph}
            variant="outline"
            size="medium"
          />
        </Card>

        {/* Conditioning Progression Section */}
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
                marginBottom: theme.spacing.xl,
              },
            ]}
          >
            Conditioning Progress
          </Text>

          <View style={styles.conditioningContent}>
            <Text
              style={[
                styles.conditioningLabel,
                {
                  color: theme.colors.muted,
                  fontFamily: theme.typography.fonts.bodyMedium,
                  fontSize: theme.typography.sizes.bodySmall,
                  marginBottom: theme.spacing.sm,
                },
              ]}
            >
              Zone Time Distribution
            </Text>
            <Text
              style={[
                styles.conditioningValue,
                {
                  color: theme.colors.white,
                  fontFamily: theme.typography.fonts.body,
                  fontSize: theme.typography.sizes.body,
                  marginBottom: theme.spacing.lg,
                },
              ]}
            >
              Z1: {mockConditioningData.zoneDistribution.z1}% Z2:{' '}
              {mockConditioningData.zoneDistribution.z2}% Z3:{' '}
              {mockConditioningData.zoneDistribution.z3}% Z4:{' '}
              {mockConditioningData.zoneDistribution.z4}% Z5:{' '}
              {mockConditioningData.zoneDistribution.z5}%
            </Text>

            <Text
              style={[
                styles.conditioningLabel,
                {
                  color: theme.colors.muted,
                  fontFamily: theme.typography.fonts.bodyMedium,
                  fontSize: theme.typography.sizes.bodySmall,
                  marginBottom: theme.spacing.sm,
                },
              ]}
            >
              Best Interval Performance
            </Text>
            <Text
              style={[
                styles.conditioningValue,
                {
                  color: theme.colors.white,
                  fontFamily: theme.typography.fonts.body,
                  fontSize: theme.typography.sizes.body,
                  marginBottom: theme.spacing.lg,
                },
              ]}
            >
              {mockConditioningData.bestInterval.type} — Avg Pace:{' '}
              {mockConditioningData.bestInterval.avgPace}
            </Text>

            <Text
              style={[
                styles.conditioningLabel,
                {
                  color: theme.colors.muted,
                  fontFamily: theme.typography.fonts.bodyMedium,
                  fontSize: theme.typography.sizes.bodySmall,
                  marginBottom: theme.spacing.sm,
                },
              ]}
            >
              Engine Trend
            </Text>
            <Text
              style={[
                styles.conditioningValue,
                {
                  color: theme.colors.acidGreen,
                  fontFamily: theme.typography.fonts.bodyMedium,
                  fontSize: theme.typography.sizes.body,
                },
              ]}
            >
              +{mockConditioningData.engineTrend.improvement}% improvement over{' '}
              {mockConditioningData.engineTrend.timePeriod}
            </Text>
          </View>

          <Spacer size="md" />

          <PraxisButton
            title="View Details"
            onPress={handleViewConditioningDetails}
            variant="outline"
            size="medium"
          />
        </Card>

        {/* Readiness Trend Section */}
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
                marginBottom: theme.spacing.xl,
              },
            ]}
          >
            Readiness
          </Text>

          <View style={styles.readinessContent}>
            <View
              style={[
                styles.readinessRow,
                {
                  marginBottom: theme.spacing.md,
                  paddingBottom: theme.spacing.md,
                  borderBottomWidth: 1,
                  borderBottomColor: theme.colors.steel,
                },
              ]}
            >
              <Text
                style={[
                  styles.readinessLabel,
                  {
                    color: theme.colors.muted,
                    fontFamily: theme.typography.fonts.body,
                    fontSize: theme.typography.sizes.body,
                  },
                ]}
              >
                This Week: Avg
              </Text>
              <Text
                style={[
                  styles.readinessValue,
                  {
                    color: theme.colors.acidGreen,
                    fontFamily: theme.typography.fonts.headingMedium,
                    fontSize: theme.typography.sizes.h2,
                  },
                ]}
              >
                {mockReadinessData.weeklyAverage}
              </Text>
            </View>

            <View
              style={[
                styles.readinessRow,
                {
                  marginBottom: theme.spacing.md,
                },
              ]}
            >
              <Text
                style={[
                  styles.readinessLabel,
                  {
                    color: theme.colors.muted,
                    fontFamily: theme.typography.fonts.body,
                    fontSize: theme.typography.sizes.body,
                  },
                ]}
              >
                Trend:
              </Text>
              <Text
                style={[
                  styles.readinessValue,
                  {
                    color: theme.colors.acidGreen,
                    fontFamily: theme.typography.fonts.bodyMedium,
                    fontSize: theme.typography.sizes.body,
                  },
                ]}
              >
                +{mockReadinessData.trend}% vs last week
              </Text>
            </View>

            <View
              style={[
                styles.readinessDayRow,
                {
                  marginBottom: theme.spacing.sm,
                },
              ]}
            >
              <Text
                style={[
                  styles.readinessLabel,
                  {
                    color: theme.colors.muted,
                    fontFamily: theme.typography.fonts.body,
                    fontSize: theme.typography.sizes.bodySmall,
                  },
                ]}
              >
                Best:
              </Text>
              <Text
                style={[
                  styles.readinessDayValue,
                  {
                    color: theme.colors.white,
                    fontFamily: theme.typography.fonts.bodyMedium,
                    fontSize: theme.typography.sizes.bodySmall,
                  },
                ]}
              >
                {mockReadinessData.bestDay.name} (
                {mockReadinessData.bestDay.score})
              </Text>
            </View>

            <View style={styles.readinessDayRow}>
              <Text
                style={[
                  styles.readinessLabel,
                  {
                    color: theme.colors.muted,
                    fontFamily: theme.typography.fonts.body,
                    fontSize: theme.typography.sizes.bodySmall,
                  },
                ]}
              >
                Lowest:
              </Text>
              <Text
                style={[
                  styles.readinessDayValue,
                  {
                    color: theme.colors.white,
                    fontFamily: theme.typography.fonts.bodyMedium,
                    fontSize: theme.typography.sizes.bodySmall,
                  },
                ]}
              >
                {mockReadinessData.lowestDay.name} (
                {mockReadinessData.lowestDay.score})
              </Text>
            </View>
          </View>

          <Spacer size="md" />

          <PraxisButton
            title="View Graph"
            onPress={handleViewReadinessGraph}
            variant="outline"
            size="medium"
          />
        </Card>

        {/* Recent PR Highlights Section */}
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
                marginBottom: theme.spacing.xl,
              },
            ]}
          >
            Recent PRs
          </Text>

          {mockRecentPRs.length > 0 ? (
            <View style={styles.prList}>
              {mockRecentPRs.map((pr, index) => (
                <Text
                  key={index}
                  style={[
                    styles.prItem,
                    {
                      color: theme.colors.white,
                      fontFamily: theme.typography.fonts.body,
                      fontSize: theme.typography.sizes.body,
                      marginBottom:
                        index < mockRecentPRs.length - 1 ? theme.spacing.md : 0,
                    },
                  ]}
                >
                  • {pr}
                </Text>
              ))}
            </View>
          ) : (
            <Text
              style={[
                styles.emptyText,
                {
                  color: theme.colors.muted,
                  fontFamily: theme.typography.fonts.body,
                  fontSize: theme.typography.sizes.body,
                },
              ]}
            >
              No PRs yet. Keep training hard.
            </Text>
          )}
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
    alignItems: 'center',
    justifyContent: 'center',
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
  liftRow: {
    width: '100%',
  },
  liftInfo: {
    width: '100%',
  },
  liftName: {
    fontWeight: '500',
  },
  liftValue: {
    fontWeight: '600',
  },
  liftChange: {
    fontWeight: '400',
  },
  conditioningContent: {
    width: '100%',
  },
  conditioningLabel: {
    fontWeight: '500',
  },
  conditioningValue: {
    fontWeight: '400',
    lineHeight: 22,
  },
  readinessContent: {
    width: '100%',
  },
  readinessRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  readinessLabel: {
    fontWeight: '400',
  },
  readinessValue: {
    fontWeight: '600',
  },
  readinessDayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  readinessDayValue: {
    fontWeight: '500',
  },
  prList: {
    width: '100%',
  },
  prItem: {
    lineHeight: 22,
  },
  emptyText: {
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
