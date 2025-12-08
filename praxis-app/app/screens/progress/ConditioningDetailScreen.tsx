import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/theme';
import { Card, IconButton, Spacer } from '../../components';
import { useSessionStore } from '../../../src/core/store';

type MainStackParamList = {
  Progress: undefined;
};

type NavigationProp = StackNavigationProp<MainStackParamList>;

interface ZoneData {
  zone: string;
  label: string;
  percentage: number;
}

interface IntervalSession {
  title: string;
  stat: string;
}

export default function ConditioningDetailScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { sessionHistory } = useSessionStore();

  // TODO: Replace with actual data from useSessionStore
  const mockZoneDistribution: ZoneData[] = [
    { zone: 'Z1', label: 'Low', percentage: 12 },
    { zone: 'Z2', label: 'Easy', percentage: 32 },
    { zone: 'Z3', label: 'Moderate', percentage: 38 },
    { zone: 'Z4', label: 'Hard', percentage: 14 },
    { zone: 'Z5', label: 'Max Effort', percentage: 4 },
  ];

  // TODO: Replace with actual data from useSessionStore
  const mockPaceData = {
    averagePace: '1:52/500m',
    improvement: 3,
    bestInterval: '1:48/500m',
  };

  // TODO: Replace with actual data from useSessionStore
  const mockIntervalSessions: IntervalSession[] = [
    { title: '4x4 @ Z4', stat: 'Avg Pace 1:52' },
    { title: '3x8 @ Z3', stat: 'Avg Pace 2:02' },
    { title: '10:00 Steady Z2', stat: 'Avg HR 144' },
    { title: '5x3 @ Z5', stat: 'Avg Pace 1:48' },
    { title: '20:00 Steady Z3', stat: 'Avg HR 158' },
  ];

  // TODO: Replace with actual insights from analytics engine
  const mockInsights = [
    'Your aerobic base (Z2) has steadily improved over the last month.',
    'Intervals in Z4 appear to drive the strongest improvements.',
    'You spent more time in Z3 than any other zone this month.',
  ];

  const getZoneColor = (zone: string): string => {
    switch (zone) {
      case 'Z1':
        return theme.colors.zone1;
      case 'Z2':
        return theme.colors.zone2;
      case 'Z3':
        return theme.colors.zone3;
      case 'Z4':
        return theme.colors.zone4;
      case 'Z5':
        return theme.colors.zone5;
      default:
        return theme.colors.muted;
    }
  };

  const handleIntervalPress = () => {
    // TODO: Navigate to interval detail screen when implemented
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
            Conditioning Progress
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
        {/* Zone Distribution */}
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
            Zone Distribution
          </Text>

          {mockZoneDistribution.map((zoneData, index) => (
            <View
              key={zoneData.zone}
              style={[
                styles.zoneRow,
                {
                  marginBottom:
                    index < mockZoneDistribution.length - 1
                      ? theme.spacing.md
                      : 0,
                },
              ]}
            >
              <View style={styles.zoneLabelContainer}>
                <Text
                  style={[
                    styles.zoneLabel,
                    {
                      color: theme.colors.white,
                      fontFamily: theme.typography.fonts.bodyMedium,
                      fontSize: theme.typography.sizes.body,
                      marginRight: theme.spacing.sm,
                    },
                  ]}
                >
                  {zoneData.zone} —
                </Text>
                <Text
                  style={[
                    styles.zoneLabel,
                    {
                      color: theme.colors.muted,
                      fontFamily: theme.typography.fonts.body,
                      fontSize: theme.typography.sizes.body,
                    },
                  ]}
                >
                  {zoneData.label}
                </Text>
              </View>
              <View
                style={[
                  styles.zoneBarContainer,
                  {
                    flex: 1,
                    height: 24,
                    backgroundColor: theme.colors.steel,
                    borderRadius: theme.radius.sm,
                    marginLeft: theme.spacing.md,
                    overflow: 'hidden',
                  },
                ]}
              >
                <View
                  style={[
                    styles.zoneBar,
                    {
                      width: `${zoneData.percentage}%`,
                      height: '100%',
                      backgroundColor: getZoneColor(zoneData.zone),
                      borderRadius: theme.radius.sm,
                    },
                  ]}
                />
              </View>
              <Text
                style={[
                  styles.zonePercentage,
                  {
                    color: theme.colors.white,
                    fontFamily: theme.typography.fonts.bodyMedium,
                    fontSize: theme.typography.sizes.body,
                    marginLeft: theme.spacing.md,
                    minWidth: 40,
                    textAlign: 'right',
                  },
                ]}
              >
                {zoneData.percentage}%
              </Text>
            </View>
          ))}
          {/* TODO: Replace with real visualization library */}
        </Card>

        {/* Pace / Output Trend */}
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
            Engine Trend
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
            Last 6 Weeks
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
              [Pace Trend Chart Placeholder]
            </Text>
            {/* TODO: Replace with real chart library (e.g., Victory Native or Recharts) */}
          </View>

          {/* Stats Summary */}
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
                Average Pace:
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
                {mockPaceData.averagePace}
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
                Improvement:
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
                +{mockPaceData.improvement}%
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
                Best Interval:
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
                {mockPaceData.bestInterval}
              </Text>
            </View>
          </View>
        </Card>

        {/* Interval History */}
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
            Interval Sessions
          </Text>

          {mockIntervalSessions.length > 0 ? (
            mockIntervalSessions.map((session, index) => (
              <TouchableOpacity
                key={index}
                onPress={handleIntervalPress}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.intervalRow,
                    {
                      paddingVertical: theme.spacing.md,
                      borderBottomWidth:
                        index < mockIntervalSessions.length - 1 ? 1 : 0,
                      borderBottomColor: theme.colors.steel,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.intervalTitle,
                      {
                        color: theme.colors.white,
                        fontFamily: theme.typography.fonts.body,
                        fontSize: theme.typography.sizes.body,
                        flex: 1,
                      },
                    ]}
                  >
                    {session.title}
                  </Text>
                  <View style={styles.intervalRight}>
                    <Text
                      style={[
                        styles.intervalStat,
                        {
                          color: theme.colors.muted,
                          fontFamily: theme.typography.fonts.body,
                          fontSize: theme.typography.sizes.body,
                          marginRight: theme.spacing.sm,
                        },
                      ]}
                    >
                      {session.stat}
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={theme.colors.muted}
                    />
                  </View>
                </View>
              </TouchableOpacity>
            ))
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
              No interval history yet.
            </Text>
          )}
        </Card>

        {/* Conditioning Insights */}
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

        {/* Future Features */}
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
              VO2max Estimation
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
              Engine Efficiency Index
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
              Adaptive Conditioning Targets
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
  zoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  zoneLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 100,
  },
  zoneLabel: {
    fontWeight: '500',
  },
  zoneBarContainer: {
    // Styled inline
  },
  zoneBar: {
    // Styled inline
  },
  zonePercentage: {
    fontWeight: '500',
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
  intervalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  intervalTitle: {
    fontWeight: '400',
  },
  intervalRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  intervalStat: {
    fontWeight: '400',
  },
  emptyText: {
    fontWeight: '400',
    fontStyle: 'italic',
    textAlign: 'center',
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
