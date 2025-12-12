import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@theme';
import { Card, Spacer, PraxisButton } from '@components';
import { usePeriodizationStore } from '@/store/periodizationStore';
import { usePlanStore } from '@core/store';
import { router } from 'expo-router';
import dayjs from 'dayjs';

/**
 * Format day name from day of week
 */
function getDayName(dayOfWeek: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayOfWeek] || '';
}

/**
 * Format date to readable format
 */
function formatDate(dateISO: string): string {
  const date = dayjs(dateISO);
  return date.format('MMM D');
}

export default function PlanScreen() {
  const theme = useTheme();
  const { currentWeekStructure, loadOrCreateWeek, _hasHydrated } = usePeriodizationStore();
  const { plan } = usePlanStore();

  // Load or create week structure on mount and when hydrated
  useEffect(() => {
    if (_hasHydrated) {
      loadOrCreateWeek();
    }
  }, [_hasHydrated, loadOrCreateWeek]);

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

  // Check if there's an active plan with sessions
  const hasActivePlan = plan && plan.length > 0;
  
  // Guard: Don't show weekly structure unless there's an active plan
  if (!hasActivePlan || !currentWeekStructure || currentWeekStructure.days.length === 0) {
    if (__DEV__ && currentWeekStructure && !hasActivePlan) {
      console.log('[PlanScreen] No active cycle — hiding weekly structure');
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
        >
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
            Training Plan
          </Text>
          <Card variant="elevated" padding="lg">
            <Text
              style={[
                styles.emptyText,
                {
                  color: theme.colors.textMuted,
                  fontFamily: theme.typography.fonts.body,
                  fontSize: theme.typography.sizes.body,
                  textAlign: 'center',
                  marginBottom: theme.spacing.lg,
                },
              ]}
            >
              No active training plan. Generate a plan to see your weekly structure.
            </Text>
            <PraxisButton
              title="Generate Plan"
              onPress={() => router.push('/plan/plan-regeneration')}
              variant="primary"
            />
          </Card>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const { days, metadata } = currentWeekStructure;

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
          Training Plan
        </Text>

        {/* Week Summary */}
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
            Week of {formatDate(currentWeekStructure.weekStartISO)}
          </Text>
          <Text
            style={[
              styles.metadataText,
              {
                color: theme.colors.textMuted,
                fontFamily: theme.typography.fonts.body,
                fontSize: theme.typography.sizes.bodySmall,
              },
            ]}
          >
            {currentWeekStructure.blockType && (
              <>
                Block:{' '}
                {currentWeekStructure.blockType.charAt(0).toUpperCase() +
                  currentWeekStructure.blockType.slice(1)}{' '}
                •{' '}
              </>
            )}
            Readiness: {metadata.readiness.category} ({metadata.readiness.score}) •{' '}
            ACWR: {metadata.fatigue.acwrZone}
          </Text>
        </Card>

        <Spacer size="lg" />

        {/* Weekly Structure */}
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
          Weekly Structure
        </Text>

        {days.map((day, index) => (
          <React.Fragment key={day.dateISO}>
            <Card variant="elevated" padding="lg">
              <View style={styles.dayHeader}>
                <View style={styles.dayInfo}>
                  <Text
                    style={[
                      styles.dayName,
                      {
                        color: theme.colors.textPrimary,
                        fontFamily: theme.typography.fonts.headingMedium,
                        fontSize: theme.typography.sizes.h4,
                        marginBottom: theme.spacing.xs,
                      },
                    ]}
                  >
                    {getDayName(day.dayOfWeek)} – {day.mainLiftCategory}
                  </Text>
                  <Text
                    style={[
                      styles.dayDate,
                      {
                        color: theme.colors.textMuted,
                        fontFamily: theme.typography.fonts.body,
                        fontSize: theme.typography.sizes.bodySmall,
                      },
                    ]}
                  >
                    {formatDate(day.dateISO)}
                  </Text>
                </View>
              </View>

              <Spacer size="sm" />

              {/* Targets */}
              <View style={styles.targetsRow}>
                <View style={styles.targetItem}>
                  <Text
                    style={[
                      styles.targetLabel,
                      {
                        color: theme.colors.textMuted,
                        fontFamily: theme.typography.fonts.body,
                        fontSize: theme.typography.sizes.bodySmall,
                      },
                    ]}
                  >
                    Volume:
                  </Text>
                  <Text
                    style={[
                      styles.targetValue,
                      {
                        color: theme.colors.textPrimary,
                        fontFamily: theme.typography.fonts.bodyMedium,
                        fontSize: theme.typography.sizes.bodySmall,
                      },
                    ]}
                  >
                    {day.volumeTarget.charAt(0).toUpperCase() + day.volumeTarget.slice(1)}
                  </Text>
                </View>

                <View style={styles.targetItem}>
                  <Text
                    style={[
                      styles.targetLabel,
                      {
                        color: theme.colors.textMuted,
                        fontFamily: theme.typography.fonts.body,
                        fontSize: theme.typography.sizes.bodySmall,
                      },
                    ]}
                  >
                    Intensity:
                  </Text>
                  <Text
                    style={[
                      styles.targetValue,
                      {
                        color: theme.colors.textPrimary,
                        fontFamily: theme.typography.fonts.bodyMedium,
                        fontSize: theme.typography.sizes.bodySmall,
                      },
                    ]}
                  >
                    {day.intensityTarget.charAt(0).toUpperCase() + day.intensityTarget.slice(1)}
                  </Text>
                </View>

                <View style={styles.targetItem}>
                  <Text
                    style={[
                      styles.targetLabel,
                      {
                        color: theme.colors.textMuted,
                        fontFamily: theme.typography.fonts.body,
                        fontSize: theme.typography.sizes.bodySmall,
                      },
                    ]}
                  >
                    Conditioning:
                  </Text>
                  <Text
                    style={[
                      styles.targetValue,
                      {
                        color: theme.colors.textPrimary,
                        fontFamily: theme.typography.fonts.bodyMedium,
                        fontSize: theme.typography.sizes.bodySmall,
                      },
                    ]}
                  >
                    {day.conditioningTarget.charAt(0).toUpperCase() + day.conditioningTarget.slice(1)}
                  </Text>
                </View>
              </View>
            </Card>
            {index < days.length - 1 && <Spacer size="md" />}
          </React.Fragment>
        ))}

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
  metadataText: {
    fontWeight: '400',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dayInfo: {
    flex: 1,
  },
  dayName: {
    fontWeight: '600',
  },
  dayDate: {
    fontWeight: '400',
  },
  targetsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  targetItem: {
    flex: 1,
  },
  targetLabel: {
    fontWeight: '400',
    marginBottom: 4,
  },
  targetValue: {
    fontWeight: '500',
  },
  emptyText: {
    fontWeight: '400',
    lineHeight: 22,
  },
});
