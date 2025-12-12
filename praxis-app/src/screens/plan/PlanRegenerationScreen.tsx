import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme';
import { Card, IconButton, PraxisButton, Spacer } from '@components';
import { useUserStore, usePlanStore } from '@core/store';
import type { WorkoutPlanDay } from '@core/types';
import { generateDailyWorkout as generateDailyWorkoutEngine } from '@engine/generation/generateDailyWorkout';
import { generateMicrocycle } from '@engine/generation/generateMicrocycle';
import { generateTrainingCycle } from '@engine/generation/generateTrainingCycle';
import dayjs from 'dayjs';

type RegenerationType = 'today' | 'week' | 'fullCycle' | 'readinessTrend';

interface RegenerationOption {
  id: RegenerationType;
  title: string;
  subtitle: string;
  confirmationMessage: string;
}

export default function PlanRegenerationScreen() {
  const theme = useTheme();
  const { readinessHistory, preferences, strengthNumbers } = useUserStore();
  const { setPlanDays, setPlan, plan, getTodayPlan, _hasHydrated } = usePlanStore();

  const [confirmationModalVisible, setConfirmationModalVisible] =
    useState(false);
  const [loadingModalVisible, setLoadingModalVisible] = useState(false);
  const [selectedRegenerationType, setSelectedRegenerationType] =
    useState<RegenerationType | null>(null);

  // Check if plan exists
  const hasActivePlan = _hasHydrated && plan.length > 0;

  // Log plan status
  useEffect(() => {
    if (_hasHydrated) {
      if (!hasActivePlan) {
        console.log('[PlanRegeneration] No plan — showing basic Generate Plan UI');
      } else {
        console.log('[PlanRegeneration] Plan detected — showing full regeneration menu');
      }
    }
  }, [_hasHydrated, hasActivePlan]);

  // TODO: Replace with actual data from useUserStore.readinessHistory
  const mockReadinessData = {
    last7DaysAvg: 72,
    trend: 6,
    bestDay: { name: 'Thu', score: 85 },
    lowestDay: { name: 'Mon', score: 58 },
  };

  const regenerationOptions: RegenerationOption[] = [
    {
      id: 'today',
      title: 'Rebuild Today',
      subtitle:
        "Replace only today's session using your latest readiness score.",
      confirmationMessage: "Rebuild today's workout?",
    },
    {
      id: 'week',
      title: 'Rebuild This Week',
      subtitle:
        'Rebuild all sessions for the current week while keeping your overall goal intact.',
      confirmationMessage: "Rebuild this week's training plan?",
    },
    {
      id: 'fullCycle',
      title: 'Regenerate Full Cycle',
      subtitle:
        'Recalculate the full microcycle using your preferences, readiness patterns, and workout history.',
      confirmationMessage: 'Regenerate full training cycle?',
    },
    {
      id: 'readinessTrend',
      title: 'Rebuild Based on Readiness Trend',
      subtitle:
        'Use your last 7 days of readiness to adjust volume and intensity.',
      confirmationMessage: 'Adapt plan based on readiness trend?',
    },
  ];

  // Generate today's workout
  const generateDailyWorkout = async (): Promise<WorkoutPlanDay> => {
    console.log("Running daily workout generation");
    
    const today = dayjs().format('YYYY-MM-DD');
    const workout = generateDailyWorkoutEngine({
      goal: preferences.goal || 'hybrid',
      experienceLevel: preferences.experienceLevel || 'intermediate',
      equipmentIds: preferences.equipmentIds || [],
      units: 'metric', // TODO: Get from user store
      strengthNumbers: Object.keys(strengthNumbers).length > 0 ? strengthNumbers : undefined,
    });

    // Remove ALL existing workouts for today to prevent duplicates
    const planWithoutToday = plan.filter(day => day.date !== today);
    
    // Add the new workout for today
    const updatedPlan = [...planWithoutToday, workout];

    setPlanDays(updatedPlan);
    console.log("Generated daily workout:", workout);
    
    return workout;
  };

  // Generate weekly plan
  const generateWeeklyPlan = async (): Promise<WorkoutPlanDay[]> => {
    console.log("Running weekly plan generation");
    
    const today = dayjs().format('YYYY-MM-DD');
    const weekStart = dayjs().startOf('week').format('YYYY-MM-DD');
    
    // Ensure weekly structure is loaded/created before generation
    const { usePeriodizationStore } = require('@/store/periodizationStore');
    const periodizationStore = usePeriodizationStore.getState();
    periodizationStore.loadOrCreateWeek();
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('[PlanRegeneration] Weekly structure loaded:', {
        weekStart: periodizationStore.currentWeekStructure?.weekStartISO,
        days: periodizationStore.currentWeekStructure?.days.length,
      });
    }
    
    const microcycle = generateMicrocycle({
      startDate: weekStart,
      goal: preferences.goal || 'hybrid',
      experienceLevel: preferences.experienceLevel || 'intermediate',
      trainingDaysPerWeek: preferences.trainingDaysPerWeek || 4,
      equipmentIds: preferences.equipmentIds || [],
      units: 'metric',
      strengthNumbers: Object.keys(strengthNumbers).length > 0 ? strengthNumbers : undefined,
    });

    // Merge with existing plan, replacing this week's days
    // Remove ALL days within the week range to prevent duplicates
    const existingPlan = plan.filter(day => {
      const dayDate = dayjs(day.date);
      const weekStartDate = dayjs(weekStart);
      const weekEndDate = dayjs(weekStart).add(6, 'days');
      // Keep only days outside the week range
      return dayDate.isBefore(weekStartDate, 'day') || dayDate.isAfter(weekEndDate, 'day');
    });

    // Combine existing plan with new microcycle and sort by date
    const updatedPlan = [...existingPlan, ...microcycle].sort((a, b) => 
      dayjs(a.date).diff(dayjs(b.date))
    );

    setPlanDays(updatedPlan);
    console.log("Generated weekly plan:", microcycle);
    
    return microcycle;
  };

  // Generate full cycle
  const generateFullCycle = async (): Promise<WorkoutPlanDay[]> => {
    console.log("Running full cycle generation");
    
    const today = dayjs().format('YYYY-MM-DD');
    
    const cycle = generateTrainingCycle({
      startDate: today,
      goal: preferences.goal || 'hybrid',
      experienceLevel: preferences.experienceLevel || 'intermediate',
      trainingDaysPerWeek: preferences.trainingDaysPerWeek || 4,
      equipmentIds: preferences.equipmentIds || [],
      units: 'metric',
      weeks: 4,
      strengthNumbers: Object.keys(strengthNumbers).length > 0 ? strengthNumbers : undefined,
    });

    // Flatten the weeks array into a single array
    const fullPlan = cycle.weeks.flat();

    setPlan(fullPlan);
    console.log("Generated cycle:", cycle);
    console.log("Generated full plan:", fullPlan);
    
    return fullPlan;
  };

  // Generate trend-adjusted cycle
  const generateTrendAdjustedCycle = async (): Promise<WorkoutPlanDay[]> => {
    console.log("Running trend-adjusted cycle generation");
    
    const today = dayjs().format('YYYY-MM-DD');
    
    // For now, use the same generation as full cycle
    // TODO: Implement actual trend adjustment logic
    const cycle = generateTrainingCycle({
      startDate: today,
      goal: preferences.goal || 'hybrid',
      experienceLevel: preferences.experienceLevel || 'intermediate',
      trainingDaysPerWeek: preferences.trainingDaysPerWeek || 4,
      equipmentIds: preferences.equipmentIds || [],
      units: 'metric',
      weeks: 4,
      strengthNumbers: Object.keys(strengthNumbers).length > 0 ? strengthNumbers : undefined,
    });

    // Flatten the weeks array into a single array
    const fullPlan = cycle.weeks.flat();

    setPlan(fullPlan);
    console.log("Generated trend-adjusted cycle:", cycle);
    console.log("Generated trend-adjusted plan:", fullPlan);
    
    return fullPlan;
  };

  const handleRegenerationPress = (type: RegenerationType) => {
    setSelectedRegenerationType(type);
    setConfirmationModalVisible(true);
  };

  // Helper function to navigate to Plan tab after regeneration
  const navigateToPlanTab = () => {
    console.log('[PlanGeneration] Plan created — redirecting to Plan tab');
    router.replace('/(tabs)/plan');
  };

  const handleConfirmRegeneration = async () => {
    setConfirmationModalVisible(false);
    setLoadingModalVisible(true);

    try {
      switch (selectedRegenerationType) {
        case 'today':
          await generateDailyWorkout();
          navigateToPlanTab();
          break;
        case 'week':
          await generateWeeklyPlan();
          navigateToPlanTab();
          break;
        case 'fullCycle':
          await generateFullCycle();
          navigateToPlanTab();
          break;
        case 'readinessTrend':
          await generateTrendAdjustedCycle();
          navigateToPlanTab();
          break;
      }
    } catch (error) {
      console.error('[PlanRegenerationScreen] Error regenerating plan:', error);
      // Navigate to Plan tab on error as fallback (plan may have been partially created)
      router.replace('/(tabs)/plan');
    } finally {
      setLoadingModalVisible(false);
    }
  };

  const handleCancelRegeneration = () => {
    setConfirmationModalVisible(false);
    setSelectedRegenerationType(null);
  };

  // Handle Generate Plan (for when no plan exists)
  const handleGeneratePlan = async () => {
    setLoadingModalVisible(true);
    try {
      await generateFullCycle();
      navigateToPlanTab();
    } catch (error) {
      console.error('[PlanRegenerationScreen] Error generating plan:', error);
      router.replace('/(tabs)/plan');
    } finally {
      setLoadingModalVisible(false);
    }
  };

  const selectedOption = regenerationOptions.find(
    (opt) => opt.id === selectedRegenerationType
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.appBg }]}
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
            borderBottomColor: theme.colors.surface3,
          },
        ]}
      >
        <IconButton
          icon={
            <Ionicons name="arrow-back" size={24} color={theme.colors.white} />
          }
          onPress={() => router.back()}
          variant="ghost"
          size="medium"
        />
        <View style={styles.headerContent}>
          <Text
            style={[
              styles.headerTitle,
              {
                color: theme.colors.textPrimary,
                fontFamily: theme.typography.fonts.headingMedium,
                fontSize: theme.typography.sizes.h2,
              },
            ]}
          >
            Regenerate Plan
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
        {/* No Plan State: Show only Generate Plan button */}
        {!hasActivePlan ? (
          <>
            <Card
              variant="elevated"
              padding="lg"
              style={{ marginBottom: theme.spacing.lg }}
            >
              <View style={styles.introContent}>
                <Text
                  style={[
                    styles.introTitle,
                    {
                      color: theme.colors.textPrimary,
                      fontFamily: theme.typography.fonts.headingMedium,
                      fontSize: theme.typography.sizes.h3,
                      marginBottom: theme.spacing.md,
                      textAlign: 'center',
                    },
                  ]}
                >
                  Generate Your Training Plan
                </Text>
                <Text
                  style={[
                    styles.introBody,
                    {
                      color: theme.colors.textMuted,
                      fontFamily: theme.typography.fonts.body,
                      fontSize: theme.typography.sizes.body,
                      marginBottom: theme.spacing.xl,
                      textAlign: 'center',
                    },
                  ]}
                >
                  Create your first training cycle based on your preferences and goals.
                </Text>
                <PraxisButton
                  title="Generate Plan"
                  onPress={handleGeneratePlan}
                  size="large"
                />
              </View>
            </Card>
          </>
        ) : (
          <>
            {/* Introduction Card */}
            <Card
              variant="elevated"
              padding="lg"
              style={{ marginBottom: theme.spacing.lg }}
            >
              <View style={styles.introContent}>
                <Text
                  style={[
                    styles.introIcon,
                    {
                      color: theme.colors.acidGreen,
                      fontSize: 48,
                      marginBottom: theme.spacing.lg,
                    },
                  ]}
                >
                  [REGEN ICON]
                </Text>
                <Text
                  style={[
                    styles.introTitle,
                    {
                      color: theme.colors.textPrimary,
                      fontFamily: theme.typography.fonts.headingMedium,
                      fontSize: theme.typography.sizes.h3,
                      marginBottom: theme.spacing.md,
                    },
                  ]}
                >
                  Adjust Your Training Plan
                </Text>
                <Text
                  style={[
                    styles.introBody,
                    {
                      color: theme.colors.textPrimary,
                      fontFamily: theme.typography.fonts.body,
                      fontSize: theme.typography.sizes.body,
                      marginBottom: theme.spacing.md,
                      textAlign: 'center',
                    },
                  ]}
                >
                  This tool lets you rebuild workouts or entire training cycles
                  based on your preferences and readiness trends.
                </Text>
                <Text
                  style={[
                    styles.introSubtitle,
                    {
                      color: theme.colors.textMuted,
                      fontFamily: theme.typography.fonts.body,
                      fontSize: theme.typography.sizes.bodySmall,
                      textAlign: 'center',
                    },
                  ]}
                >
                  Use with intention. Regeneration makes permanent updates.
                </Text>
              </View>
            </Card>

            {/* Regeneration Options */}
            {regenerationOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                onPress={() => handleRegenerationPress(option.id)}
                activeOpacity={0.7}
              >
                <Card
                  variant="elevated"
                  padding="lg"
                  style={{ marginBottom: theme.spacing.lg }}
                >
                  <Text
                    style={[
                      styles.optionTitle,
                      {
                        color: theme.colors.textPrimary,
                        fontFamily: theme.typography.fonts.headingMedium,
                        fontSize: theme.typography.sizes.body,
                        marginBottom: theme.spacing.xs,
                      },
                    ]}
                  >
                    {option.title}
                  </Text>
                  <Text
                    style={[
                      styles.optionSubtitle,
                      {
                        color: theme.colors.textMuted,
                        fontFamily: theme.typography.fonts.body,
                        fontSize: theme.typography.sizes.bodySmall,
                      },
                    ]}
                  >
                    {option.subtitle}
                  </Text>
                </Card>
              </TouchableOpacity>
            ))}

            {/* Readiness Snapshot */}
            <Card
              variant="elevated"
              padding="lg"
              style={{ marginBottom: theme.spacing.lg }}
            >
          <Text
            style={[
              styles.sectionTitle,
              {
                color: theme.colors.textPrimary,
                fontFamily: theme.typography.fonts.headingMedium,
                fontSize: theme.typography.sizes.h3,
                marginBottom: theme.spacing.lg,
              },
            ]}
          >
            Readiness Snapshot
          </Text>

          <View
            style={[
              styles.readinessRow,
              {
                paddingVertical: theme.spacing.sm,
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.surface3,
              },
            ]}
          >
            <Text
              style={[
                styles.readinessLabel,
                {
                  color: theme.colors.textMuted,
                  fontFamily: theme.typography.fonts.body,
                  fontSize: theme.typography.sizes.body,
                },
              ]}
            >
              Last 7 Days Avg:
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
              {mockReadinessData.last7DaysAvg}
            </Text>
          </View>

          <View
            style={[
              styles.readinessRow,
              {
                paddingVertical: theme.spacing.sm,
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.surface3,
              },
            ]}
          >
            <Text
              style={[
                styles.readinessLabel,
                {
                  color: theme.colors.textMuted,
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
              +{mockReadinessData.trend}%
            </Text>
          </View>

          <View
            style={[
              styles.readinessRow,
              {
                paddingVertical: theme.spacing.sm,
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.surface3,
              },
            ]}
          >
            <Text
              style={[
                styles.readinessLabel,
                {
                  color: theme.colors.textMuted,
                  fontFamily: theme.typography.fonts.body,
                  fontSize: theme.typography.sizes.body,
                },
              ]}
            >
              Best Day:
            </Text>
            <Text
              style={[
                styles.readinessValue,
                {
                  color: theme.colors.textPrimary,
                  fontFamily: theme.typography.fonts.bodyMedium,
                  fontSize: theme.typography.sizes.body,
                },
              ]}
            >
              {mockReadinessData.bestDay.name} (
              {mockReadinessData.bestDay.score})
            </Text>
          </View>

          <View
            style={[
              styles.readinessRow,
              {
                paddingVertical: theme.spacing.sm,
              },
            ]}
          >
            <Text
              style={[
                styles.readinessLabel,
                {
                  color: theme.colors.textMuted,
                  fontFamily: theme.typography.fonts.body,
                  fontSize: theme.typography.sizes.body,
                },
              ]}
            >
              Lowest:
            </Text>
            <Text
              style={[
                styles.readinessValue,
                {
                  color: theme.colors.textPrimary,
                  fontFamily: theme.typography.fonts.bodyMedium,
                  fontSize: theme.typography.sizes.body,
                },
              ]}
            >
              {mockReadinessData.lowestDay.name} (
              {mockReadinessData.lowestDay.score})
            </Text>
          </View>
        </Card>
          </>
        )}

        <Spacer size="xl" />
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal
        visible={confirmationModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCancelRegeneration}
      >
        <View
          style={[
            styles.modalOverlay,
            { backgroundColor: 'rgba(0, 0, 0, 0.8)' },
          ]}
        >
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.colors.surface2,
                borderRadius: theme.radius.xl,
                padding: theme.spacing.xxxl,
              },
            ]}
          >
            <Text
              style={[
                styles.modalTitle,
                {
                  color: theme.colors.textPrimary,
                  fontFamily: theme.typography.fonts.headingMedium,
                  fontSize: theme.typography.sizes.h3,
                  marginBottom: theme.spacing.xl,
                  textAlign: 'center',
                },
              ]}
            >
              {selectedOption?.confirmationMessage}
            </Text>

            <View style={styles.modalActions}>
              <PraxisButton
                title="Cancel"
                onPress={handleCancelRegeneration}
                variant="outline"
                size="medium"
                style={{ flex: 1, marginRight: theme.spacing.sm }}
              />
              <PraxisButton
                title="Confirm"
                onPress={handleConfirmRegeneration}
                size="medium"
                style={{ flex: 1, marginLeft: theme.spacing.sm }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Loading Modal */}
      <Modal visible={loadingModalVisible} transparent animationType="fade">
        <View
          style={[
            styles.loadingOverlay,
            { backgroundColor: 'rgba(0, 0, 0, 0.9)' },
          ]}
        >
          <View style={styles.loadingContent}>
            <ActivityIndicator
              size="large"
              color={theme.colors.acidGreen}
              style={{ marginBottom: theme.spacing.lg }}
            />
            <Text
              style={[
                styles.loadingText,
                {
                  color: theme.colors.textPrimary,
                  fontFamily: theme.typography.fonts.body,
                  fontSize: theme.typography.sizes.body,
                },
              ]}
            >
              [Rebuilding Plan…]
            </Text>
          </View>
        </View>
      </Modal>
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
  introContent: {
    alignItems: 'center',
    width: '100%',
  },
  introIcon: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  introTitle: {
    fontWeight: '600',
    textAlign: 'center',
  },
  introBody: {
    fontWeight: '400',
    lineHeight: 22,
  },
  introSubtitle: {
    fontWeight: '400',
  },
  optionTitle: {
    fontWeight: '600',
  },
  optionSubtitle: {
    fontWeight: '400',
    lineHeight: 20,
  },
  sectionTitle: {
    fontWeight: '600',
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
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    width: '100%',
  },
  loadingOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontWeight: '400',
  },
});
