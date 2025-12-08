import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { Card, IconButton, PraxisButton, Spacer } from '../../components';
import { useSessionStore, useUserStore } from '../../core/store';

type MainStackParamList = {
  Home: undefined;
};

type NavigationProp = StackNavigationProp<MainStackParamList>;

interface PRHighlight {
  exercise: string;
  type: string;
  value: string;
  change?: string;
}

export default function WorkoutSummaryScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { activeSession } = useSessionStore();
  const { personalRecords } = useUserStore();

  // TODO: Replace with actual calculations from activeSession
  const mockSessionMetrics = {
    totalVolume: '12,450 lb',
    totalSets: 18,
    duration: 58,
    conditioningOutput: {
      avgPace: '1:52/500m',
      bestRound: '1:48',
      zonesHit: 'Z2–Z4',
    },
  };

  // TODO: Replace with actual PR detection from completed session
  const mockPRs: PRHighlight[] = [
    {
      exercise: 'Back Squat',
      type: 'New Est. 1RM',
      value: '300 lb',
      change: '+5',
    },
    {
      exercise: 'RDL',
      type: 'Rep PR',
      value: '225 x 8',
    },
  ];

  // TODO: Replace with actual readiness impact calculation
  const mockReadinessInsight =
    "Today's training should increase tomorrow's readiness slightly.";

  const handleFinish = () => {
    navigation.navigate('Home');
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
          onPress={() => navigation.navigate('Home')}
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
            Session Summary
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
        {/* Session Completed Card */}
        <Card
          variant="elevated"
          padding="lg"
          style={{ marginBottom: theme.spacing.lg }}
        >
          <View style={styles.completionContent}>
            <View
              style={[
                styles.checkmarkContainer,
                {
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: theme.colors.acidGreen,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: theme.spacing.lg,
                },
              ]}
            >
              <Text
                style={[
                  styles.checkmark,
                  {
                    color: theme.colors.black,
                    fontSize: 48,
                  },
                ]}
              >
                [✔]
              </Text>
              {/* TODO: Replace with proper checkmark icon */}
            </View>
            <Text
              style={[
                styles.completionTitle,
                {
                  color: theme.colors.white,
                  fontFamily: theme.typography.fonts.heading,
                  fontSize: theme.typography.sizes.h1,
                  marginBottom: theme.spacing.sm,
                },
              ]}
            >
              Great work!
            </Text>
            <Text
              style={[
                styles.completionSubtitle,
                {
                  color: theme.colors.muted,
                  fontFamily: theme.typography.fonts.body,
                  fontSize: theme.typography.sizes.body,
                },
              ]}
            >
              Here's how today went.
            </Text>
          </View>
        </Card>

        {/* Performance Metrics */}
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
            Performance
          </Text>

          <View
            style={[
              styles.metricRow,
              {
                paddingVertical: theme.spacing.md,
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.steel,
              },
            ]}
          >
            <Text
              style={[
                styles.metricLabel,
                {
                  color: theme.colors.muted,
                  fontFamily: theme.typography.fonts.body,
                  fontSize: theme.typography.sizes.body,
                },
              ]}
            >
              Total Volume:
            </Text>
            <Text
              style={[
                styles.metricValue,
                {
                  color: theme.colors.white,
                  fontFamily: theme.typography.fonts.bodyMedium,
                  fontSize: theme.typography.sizes.body,
                },
              ]}
            >
              {mockSessionMetrics.totalVolume}
            </Text>
          </View>

          <View
            style={[
              styles.metricRow,
              {
                paddingVertical: theme.spacing.md,
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.steel,
              },
            ]}
          >
            <Text
              style={[
                styles.metricLabel,
                {
                  color: theme.colors.muted,
                  fontFamily: theme.typography.fonts.body,
                  fontSize: theme.typography.sizes.body,
                },
              ]}
            >
              Total Sets Completed:
            </Text>
            <Text
              style={[
                styles.metricValue,
                {
                  color: theme.colors.white,
                  fontFamily: theme.typography.fonts.bodyMedium,
                  fontSize: theme.typography.sizes.body,
                },
              ]}
            >
              {mockSessionMetrics.totalSets} sets
            </Text>
          </View>

          <View
            style={[
              styles.metricRow,
              {
                paddingVertical: theme.spacing.md,
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.steel,
              },
            ]}
          >
            <Text
              style={[
                styles.metricLabel,
                {
                  color: theme.colors.muted,
                  fontFamily: theme.typography.fonts.body,
                  fontSize: theme.typography.sizes.body,
                },
              ]}
            >
              Duration:
            </Text>
            <Text
              style={[
                styles.metricValue,
                {
                  color: theme.colors.white,
                  fontFamily: theme.typography.fonts.bodyMedium,
                  fontSize: theme.typography.sizes.body,
                },
              ]}
            >
              {mockSessionMetrics.duration} min
            </Text>
          </View>

          <View
            style={[
              styles.conditioningSection,
              {
                paddingTop: theme.spacing.md,
              },
            ]}
          >
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
              Conditioning Output:
            </Text>
            <Text
              style={[
                styles.conditioningValue,
                {
                  color: theme.colors.white,
                  fontFamily: theme.typography.fonts.body,
                  fontSize: theme.typography.sizes.bodySmall,
                  marginBottom: theme.spacing.xs,
                },
              ]}
            >
              Avg Pace: {mockSessionMetrics.conditioningOutput.avgPace}
            </Text>
            <Text
              style={[
                styles.conditioningValue,
                {
                  color: theme.colors.white,
                  fontFamily: theme.typography.fonts.body,
                  fontSize: theme.typography.sizes.bodySmall,
                  marginBottom: theme.spacing.xs,
                },
              ]}
            >
              Best Round: {mockSessionMetrics.conditioningOutput.bestRound}
            </Text>
            <Text
              style={[
                styles.conditioningValue,
                {
                  color: theme.colors.white,
                  fontFamily: theme.typography.fonts.body,
                  fontSize: theme.typography.sizes.bodySmall,
                },
              ]}
            >
              Zones Hit: {mockSessionMetrics.conditioningOutput.zonesHit}
            </Text>
          </View>
        </Card>

        {/* PR Highlights */}
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
            PR Highlights
          </Text>

          {mockPRs.length > 0 ? (
            mockPRs.map((pr, index) => (
              <Text
                key={index}
                style={[
                  styles.prItem,
                  {
                    color: theme.colors.acidGreen,
                    fontFamily: theme.typography.fonts.body,
                    fontSize: theme.typography.sizes.body,
                    marginBottom:
                      index < mockPRs.length - 1 ? theme.spacing.md : 0,
                    lineHeight: 22,
                  },
                ]}
              >
                • {pr.exercise}: {pr.type} — {pr.value}
                {pr.change && ` (${pr.change})`}
              </Text>
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
              No PRs today — but progress was still made.
            </Text>
          )}
        </Card>

        {/* Readiness Impact */}
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
            Readiness Insight
          </Text>

          <Text
            style={[
              styles.insightText,
              {
                color: theme.colors.muted,
                fontFamily: theme.typography.fonts.body,
                fontSize: theme.typography.sizes.body,
                lineHeight: 22,
              },
            ]}
          >
            {mockReadinessInsight}
          </Text>
        </Card>

        {/* Session Notes */}
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
                marginBottom: theme.spacing.md,
              },
            ]}
          >
            Session Notes
          </Text>

          <View
            style={[
              styles.notesPlaceholder,
              {
                backgroundColor: theme.colors.graphite,
                borderRadius: theme.radius.md,
                padding: theme.spacing.lg,
                borderWidth: 1,
                borderColor: theme.colors.steel,
                minHeight: 100,
              },
            ]}
          >
            <Text
              style={[
                styles.notesPlaceholderText,
                {
                  color: theme.colors.mutedDark,
                  fontFamily: theme.typography.fonts.body,
                  fontSize: theme.typography.sizes.body,
                },
              ]}
            >
              Add notes about today's session… (feature coming soon)
            </Text>
          </View>
        </Card>

        <Spacer size="lg" />
      </ScrollView>

      {/* Finish Button */}
      <View
        style={[
          styles.footer,
          {
            padding: theme.spacing.lg,
            borderTopWidth: 1,
            borderTopColor: theme.colors.steel,
          },
        ]}
      >
        <PraxisButton title="Finish" onPress={handleFinish} size="large" />
      </View>
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
  completionContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkContainer: {
    // Styled inline
  },
  checkmark: {
    fontWeight: 'bold',
  },
  completionTitle: {
    fontWeight: '700',
    textAlign: 'center',
  },
  completionSubtitle: {
    fontWeight: '400',
    textAlign: 'center',
  },
  sectionTitle: {
    fontWeight: '600',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    fontWeight: '400',
  },
  metricValue: {
    fontWeight: '500',
  },
  conditioningSection: {
    width: '100%',
  },
  conditioningLabel: {
    fontWeight: '500',
  },
  conditioningValue: {
    fontWeight: '400',
  },
  prItem: {
    fontWeight: '400',
  },
  emptyText: {
    fontWeight: '400',
    fontStyle: 'italic',
  },
  insightText: {
    fontWeight: '400',
  },
  notesPlaceholder: {
    // Styled inline
  },
  notesPlaceholderText: {
    fontWeight: '400',
    fontStyle: 'italic',
  },
  footer: {
    width: '100%',
  },
});
