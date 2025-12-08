import React, { useState, useMemo } from 'react';
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
import { useTheme } from '../../theme';
import { Card, IconButton, Spacer } from '../../components';
import { useUserStore } from '../../core/store';

type MainStackParamList = {
  Progress: undefined;
};

type NavigationProp = StackNavigationProp<MainStackParamList>;

type LiftType = 'squat' | 'bench' | 'deadlift';

interface PRHistoryItem {
  date: string;
  estimated1RM: number;
  change: number;
}

interface LiftData {
  current1RM: number;
  change6Weeks: number;
  bestRecorded: number;
  prHistory: PRHistoryItem[];
  insights: string[];
}

export default function StrengthDetailScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { userProfile, personalRecords } = useUserStore();

  const [selectedLift, setSelectedLift] = useState<LiftType>('squat');

  // TODO: Replace with actual data from useSessionStore and PR detection engine
  const mockLiftData: Record<LiftType, LiftData> = {
    squat: {
      current1RM: 295,
      change6Weeks: 20,
      bestRecorded: 300,
      prHistory: [
        { date: 'Jan 20, 2025', estimated1RM: 295, change: 5 },
        { date: 'Jan 7, 2025', estimated1RM: 290, change: 10 },
        { date: 'Dec 12, 2024', estimated1RM: 280, change: 5 },
      ],
      insights: [
        'Your squat strength has increased 6% in the past 6 weeks.',
        'Most improvements occurred during high-volume blocks.',
        'Readiness scaling increased intensity on 3 training days.',
      ],
    },
    bench: {
      current1RM: 195,
      change6Weeks: 10,
      bestRecorded: 200,
      prHistory: [
        { date: 'Jan 18, 2025', estimated1RM: 195, change: 5 },
        { date: 'Jan 5, 2025', estimated1RM: 190, change: 5 },
        { date: 'Dec 15, 2024', estimated1RM: 185, change: 0 },
      ],
      insights: [
        'Your bench press has improved 5% over the past 6 weeks.',
        'Consistent training frequency contributed to steady progress.',
        'No significant plateaus detected in recent training.',
      ],
    },
    deadlift: {
      current1RM: 355,
      change6Weeks: 20,
      bestRecorded: 365,
      prHistory: [
        { date: 'Jan 22, 2025', estimated1RM: 355, change: 10 },
        { date: 'Jan 10, 2025', estimated1RM: 345, change: 10 },
        { date: 'Dec 20, 2024', estimated1RM: 335, change: 5 },
      ],
      insights: [
        'Deadlift strength increased 6% in the past 6 weeks.',
        'Progress accelerated during high-intensity blocks.',
        'Readiness scaling optimized load on 4 training days.',
      ],
    },
  };

  const currentLiftData = useMemo(
    () => mockLiftData[selectedLift],
    [selectedLift]
  );

  const liftLabels: Record<LiftType, string> = {
    squat: 'Squat',
    bench: 'Bench',
    deadlift: 'Deadlift',
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
            Strength Progression
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
        {/* Lift Selector Tabs */}
        <View
          style={[
            styles.tabsContainer,
            {
              flexDirection: 'row',
              marginBottom: theme.spacing.lg,
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.steel,
            },
          ]}
        >
          {(Object.keys(liftLabels) as LiftType[]).map((lift, index) => {
            const isActive = selectedLift === lift;
            return (
              <TouchableOpacity
                key={lift}
                onPress={() => setSelectedLift(lift)}
                activeOpacity={0.7}
                style={[
                  styles.tab,
                  {
                    flex: 1,
                    paddingVertical: theme.spacing.md,
                    borderBottomWidth: isActive ? 2 : 0,
                    borderBottomColor: isActive
                      ? theme.colors.acidGreen
                      : 'transparent',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    {
                      color: isActive
                        ? theme.colors.acidGreen
                        : theme.colors.muted,
                      fontFamily: theme.typography.fonts.bodyMedium,
                      fontSize: theme.typography.sizes.body,
                      textAlign: 'center',
                    },
                  ]}
                >
                  {liftLabels[lift]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Estimated 1RM Chart */}
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
            Estimated 1RM Trend
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
            Last 12 Weeks
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
              [Chart Placeholder]
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
                Current est. 1RM:
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
                {currentLiftData.current1RM} lb
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
                Change (6 weeks):
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
                {currentLiftData.change6Weeks > 0 ? '+' : ''}
                {currentLiftData.change6Weeks} lb
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
                Best recorded:
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
                {currentLiftData.bestRecorded} lb
              </Text>
            </View>
          </View>
        </Card>

        {/* PR History */}
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
            PR History
          </Text>

          {currentLiftData.prHistory.length > 0 ? (
            currentLiftData.prHistory.map((pr, index) => (
              <View
                key={index}
                style={[
                  styles.prRow,
                  {
                    paddingVertical: theme.spacing.md,
                    borderBottomWidth:
                      index < currentLiftData.prHistory.length - 1 ? 1 : 0,
                    borderBottomColor: theme.colors.steel,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.prDate,
                    {
                      color: theme.colors.white,
                      fontFamily: theme.typography.fonts.body,
                      fontSize: theme.typography.sizes.body,
                    },
                  ]}
                >
                  {pr.date}
                </Text>
                <Text
                  style={[
                    styles.prValue,
                    {
                      color: theme.colors.acidGreen,
                      fontFamily: theme.typography.fonts.bodyMedium,
                      fontSize: theme.typography.sizes.body,
                    },
                  ]}
                >
                  {pr.estimated1RM} lb ({pr.change > 0 ? '+' : ''}
                  {pr.change})
                </Text>
              </View>
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
              No PRs recorded yet.
            </Text>
          )}
        </Card>

        {/* Training Insights */}
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

          {currentLiftData.insights.map((insight, index) => (
            <Text
              key={index}
              style={[
                styles.insightText,
                {
                  color: index === 0 ? theme.colors.white : theme.colors.muted,
                  fontFamily: theme.typography.fonts.body,
                  fontSize: theme.typography.sizes.body,
                  marginBottom:
                    index < currentLiftData.insights.length - 1
                      ? theme.spacing.md
                      : 0,
                  lineHeight: 22,
                },
              ]}
            >
              • {insight}
            </Text>
          ))}
        </Card>

        {/* Future Feature Call-out */}
        <Text
          style={[
            styles.futureFeatureText,
            {
              color: theme.colors.muted,
              fontFamily: theme.typography.fonts.body,
              fontSize: theme.typography.sizes.bodySmall,
              textAlign: 'center',
            },
          ]}
        >
          More detailed lift analytics coming soon.
        </Text>

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
  tabsContainer: {
    width: '100%',
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontWeight: '500',
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
  prRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prDate: {
    fontWeight: '400',
  },
  prValue: {
    fontWeight: '500',
  },
  emptyText: {
    fontWeight: '400',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  insightText: {
    fontWeight: '400',
  },
  futureFeatureText: {
    fontWeight: '400',
    fontStyle: 'italic',
  },
});
