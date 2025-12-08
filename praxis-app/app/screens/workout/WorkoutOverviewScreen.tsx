import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { Card, PraxisButton, Spacer, IconButton } from '../../components';
import { usePlanStore } from '../../core/store';
import dayjs from 'dayjs';

type MainStackParamList = {
  WorkoutSession: undefined;
};

type NavigationProp = StackNavigationProp<MainStackParamList>;

export default function WorkoutOverviewScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const planStore = usePlanStore();

  const todayDate = dayjs().format('YYYY-MM-DD');
  const workoutPlan = useMemo(
    () => planStore.getPlanDayByDate(todayDate),
    [todayDate, planStore]
  );

  // TODO: Replace with actual exercise names from exercise definitions
  const getExerciseName = (exerciseId: string): string => {
    const exerciseNames: Record<string, string> = {
      back_squat: 'Back Squat',
      bench_press: 'Bench Press',
      deadlift: 'Deadlift',
      rdl: 'RDL',
      hanging_knee_raise: 'Hanging Knee Raise',
    };
    return exerciseNames[exerciseId] || exerciseId;
  };

  const warmupBlock = workoutPlan?.blocks.find((b) => b.type === 'warmup');
  const strengthBlock = workoutPlan?.blocks.find((b) => b.type === 'strength');
  const accessoryBlock = workoutPlan?.blocks.find(
    (b) => b.type === 'accessory'
  );
  const conditioningBlock = workoutPlan?.blocks.find(
    (b) => b.type === 'conditioning'
  );
  const cooldownBlock = workoutPlan?.blocks.find((b) => b.type === 'cooldown');

  const handleBeginSession = () => {
    navigation.navigate('WorkoutSession');
  };

  const handleViewDetails = () => {
    // TODO: Implement view details modal/screen
  };

  const handleEditLoad = () => {
    // TODO: Implement edit load modal
  };

  const formatDuration = (minutes?: number): string => {
    if (!minutes) return '';
    return `${minutes} min`;
  };

  const formatSetPrescription = (sets: any[]): string => {
    if (!sets || sets.length === 0) return '';
    const firstSet = sets[0];
    const reps = firstSet.targetReps ?? '?';
    const rpe = firstSet.targetRpe ?? '?';
    return `${sets.length} x ${reps} @ RPE ${rpe}`;
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
                fontFamily: theme.typography.fonts.heading,
                fontSize: theme.typography.sizes.h2,
              },
            ]}
          >
            Today's Workout
          </Text>
          {workoutPlan ? (
            <Text
              style={[
                styles.headerSubtext,
                {
                  color: theme.colors.muted,
                  fontFamily: theme.typography.fonts.body,
                  fontSize: theme.typography.sizes.bodySmall,
                },
              ]}
            >
              Day {workoutPlan.dayIndex} — {workoutPlan.focusTags.join(' + ')} —{' '}
              {workoutPlan.estimatedDurationMinutes} min
            </Text>
          ) : (
            <Text
              style={[
                styles.headerSubtext,
                {
                  color: theme.colors.muted,
                  fontFamily: theme.typography.fonts.body,
                  fontSize: theme.typography.sizes.bodySmall,
                },
              ]}
            >
              Day 3 — Strength + Engine — 58 min
            </Text>
          )}
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
        {/* Warmup Block */}
        <Card variant="elevated" padding="lg">
          <Text
            style={[
              styles.blockTitle,
              {
                color: theme.colors.white,
                fontFamily: theme.typography.fonts.headingMedium,
                fontSize: theme.typography.sizes.h3,
                marginBottom: theme.spacing.md,
              },
            ]}
          >
            WARMUP
          </Text>
          {warmupBlock?.warmupItems && warmupBlock.warmupItems.length > 0 ? (
            warmupBlock.warmupItems.map((item, index) => (
              <Text
                key={index}
                style={[
                  styles.blockItem,
                  {
                    color: theme.colors.white,
                    fontFamily: theme.typography.fonts.body,
                    fontSize: theme.typography.sizes.body,
                    marginBottom:
                      index < warmupBlock.warmupItems!.length - 1
                        ? theme.spacing.sm
                        : 0,
                  },
                ]}
              >
                • {item}
              </Text>
            ))
          ) : (
            <>
              <Text
                style={[
                  styles.blockItem,
                  {
                    color: theme.colors.white,
                    fontFamily: theme.typography.fonts.body,
                    fontSize: theme.typography.sizes.body,
                    marginBottom: theme.spacing.sm,
                  },
                ]}
              >
                • Movement Prep (5 min)
              </Text>
              <Text
                style={[
                  styles.blockItem,
                  {
                    color: theme.colors.white,
                    fontFamily: theme.typography.fonts.body,
                    fontSize: theme.typography.sizes.body,
                  },
                ]}
              >
                • Mobility Sequence (3 min)
              </Text>
            </>
          )}
        </Card>

        <Spacer size="lg" />

        {/* Strength Block */}
        <Card variant="elevated" padding="lg">
          <Text
            style={[
              styles.blockTitle,
              {
                color: theme.colors.white,
                fontFamily: theme.typography.fonts.headingMedium,
                fontSize: theme.typography.sizes.h3,
                marginBottom: theme.spacing.md,
              },
            ]}
          >
            STRENGTH
            {strengthBlock?.strengthMain?.exerciseId
              ? ` — ${getExerciseName(strengthBlock.strengthMain.exerciseId)}`
              : ' — Back Squat'}
          </Text>

          {strengthBlock?.strengthMain ? (
            <Text
              style={[
                styles.prescriptionText,
                {
                  color: theme.colors.white,
                  fontFamily: theme.typography.fonts.body,
                  fontSize: theme.typography.sizes.body,
                  marginBottom: theme.spacing.md,
                },
              ]}
            >
              {formatSetPrescription(strengthBlock.strengthMain.sets)}
            </Text>
          ) : (
            <Text
              style={[
                styles.prescriptionText,
                {
                  color: theme.colors.white,
                  fontFamily: theme.typography.fonts.body,
                  fontSize: theme.typography.sizes.body,
                  marginBottom: theme.spacing.md,
                },
              ]}
            >
              3 x 5 @ RPE 8
            </Text>
          )}

          <View style={styles.blockActions}>
            <PraxisButton
              title="View Details"
              onPress={handleViewDetails}
              variant="outline"
              size="small"
              style={{ flex: 1, marginRight: theme.spacing.sm }}
            />
            <PraxisButton
              title="Edit Load"
              onPress={handleEditLoad}
              variant="outline"
              size="small"
              style={{ flex: 1, marginLeft: theme.spacing.sm }}
            />
          </View>
        </Card>

        <Spacer size="lg" />

        {/* Accessory Block */}
        <Card variant="elevated" padding="lg">
          <Text
            style={[
              styles.blockTitle,
              {
                color: theme.colors.white,
                fontFamily: theme.typography.fonts.headingMedium,
                fontSize: theme.typography.sizes.h3,
                marginBottom: theme.spacing.md,
              },
            ]}
          >
            ACCESSORY
          </Text>

          {accessoryBlock?.accessory && accessoryBlock.accessory.length > 0 ? (
            accessoryBlock.accessory.map((exercise, index) => (
              <Text
                key={index}
                style={[
                  styles.blockItem,
                  {
                    color: theme.colors.white,
                    fontFamily: theme.typography.fonts.body,
                    fontSize: theme.typography.sizes.body,
                    marginBottom:
                      index < accessoryBlock.accessory!.length - 1
                        ? theme.spacing.sm
                        : 0,
                  },
                ]}
              >
                • {getExerciseName(exercise.exerciseId)} —{' '}
                {formatSetPrescription(exercise.sets)}
              </Text>
            ))
          ) : (
            <>
              <Text
                style={[
                  styles.blockItem,
                  {
                    color: theme.colors.white,
                    fontFamily: theme.typography.fonts.body,
                    fontSize: theme.typography.sizes.body,
                    marginBottom: theme.spacing.sm,
                  },
                ]}
              >
                • RDL — 3 x 8
              </Text>
              <Text
                style={[
                  styles.blockItem,
                  {
                    color: theme.colors.white,
                    fontFamily: theme.typography.fonts.body,
                    fontSize: theme.typography.sizes.body,
                  },
                ]}
              >
                • Hanging Knee Raise — 3 x 10
              </Text>
            </>
          )}
        </Card>

        <Spacer size="lg" />

        {/* Conditioning Block */}
        <Card variant="elevated" padding="lg">
          <Text
            style={[
              styles.blockTitle,
              {
                color: theme.colors.white,
                fontFamily: theme.typography.fonts.headingMedium,
                fontSize: theme.typography.sizes.h3,
                marginBottom: theme.spacing.md,
              },
            ]}
          >
            CONDITIONING
            {conditioningBlock?.conditioning?.mode
              ? ` — ${conditioningBlock.conditioning.mode.charAt(0).toUpperCase() + conditioningBlock.conditioning.mode.slice(1)}`
              : ' — Intervals'}
          </Text>

          {conditioningBlock?.conditioning ? (
            <>
              {conditioningBlock.conditioning.rounds &&
              conditioningBlock.conditioning.workSeconds &&
              conditioningBlock.conditioning.targetZone ? (
                <View>
                  <Text
                    style={[
                      styles.blockItem,
                      {
                        color: theme.colors.white,
                        fontFamily: theme.typography.fonts.body,
                        fontSize: theme.typography.sizes.body,
                        marginBottom: theme.spacing.sm,
                      },
                    ]}
                  >
                    {conditioningBlock.conditioning.rounds} x{' '}
                    {Math.round(
                      conditioningBlock.conditioning.workSeconds / 60
                    )}{' '}
                    min @ {conditioningBlock.conditioning.targetZone}
                  </Text>
                  {conditioningBlock.conditioning.restSeconds && (
                    <Text
                      style={[
                        styles.blockItem,
                        {
                          color: theme.colors.muted,
                          fontFamily: theme.typography.fonts.body,
                          fontSize: theme.typography.sizes.bodySmall,
                          marginBottom: theme.spacing.sm,
                        },
                      ]}
                    >
                      {Math.round(
                        conditioningBlock.conditioning.restSeconds / 60
                      )}{' '}
                      min rest between sets
                    </Text>
                  )}
                  {conditioningBlock.estimatedDurationMinutes && (
                    <Text
                      style={[
                        styles.blockItem,
                        {
                          color: theme.colors.muted,
                          fontFamily: theme.typography.fonts.body,
                          fontSize: theme.typography.sizes.bodySmall,
                        },
                      ]}
                    >
                      Estimated: {conditioningBlock.estimatedDurationMinutes}{' '}
                      min
                    </Text>
                  )}
                </View>
              ) : (
                <Text
                  style={[
                    styles.blockItem,
                    {
                      color: theme.colors.muted,
                      fontFamily: theme.typography.fonts.body,
                      fontSize: theme.typography.sizes.body,
                    },
                  ]}
                >
                  {conditioningBlock.conditioning.notes ||
                    'No details available'}
                </Text>
              )}
            </>
          ) : (
            <>
              <Text
                style={[
                  styles.blockItem,
                  {
                    color: theme.colors.white,
                    fontFamily: theme.typography.fonts.body,
                    fontSize: theme.typography.sizes.body,
                    marginBottom: theme.spacing.sm,
                  },
                ]}
              >
                4 x 4 min @ Zone 4
              </Text>
              <Text
                style={[
                  styles.blockItem,
                  {
                    color: theme.colors.muted,
                    fontFamily: theme.typography.fonts.body,
                    fontSize: theme.typography.sizes.bodySmall,
                    marginBottom: theme.spacing.sm,
                  },
                ]}
              >
                2 min rest between sets
              </Text>
              <Text
                style={[
                  styles.blockItem,
                  {
                    color: theme.colors.muted,
                    fontFamily: theme.typography.fonts.body,
                    fontSize: theme.typography.sizes.bodySmall,
                  },
                ]}
              >
                Estimated: 18 min
              </Text>
            </>
          )}
        </Card>

        <Spacer size="lg" />

        {/* Cooldown Block */}
        <Card variant="elevated" padding="lg">
          <Text
            style={[
              styles.blockTitle,
              {
                color: theme.colors.white,
                fontFamily: theme.typography.fonts.headingMedium,
                fontSize: theme.typography.sizes.h3,
                marginBottom: theme.spacing.md,
              },
            ]}
          >
            COOLDOWN
          </Text>
          {cooldownBlock?.cooldownItems &&
          cooldownBlock.cooldownItems.length > 0 ? (
            cooldownBlock.cooldownItems.map((item, index) => (
              <Text
                key={index}
                style={[
                  styles.blockItem,
                  {
                    color: theme.colors.white,
                    fontFamily: theme.typography.fonts.body,
                    fontSize: theme.typography.sizes.body,
                    marginBottom:
                      index < cooldownBlock.cooldownItems!.length - 1
                        ? theme.spacing.sm
                        : 0,
                  },
                ]}
              >
                • {item}
              </Text>
            ))
          ) : (
            <Text
              style={[
                styles.blockItem,
                {
                  color: theme.colors.white,
                  fontFamily: theme.typography.fonts.body,
                  fontSize: theme.typography.sizes.body,
                },
              ]}
            >
              • Stretching & Breath Work (4 min)
            </Text>
          )}
        </Card>

        <Spacer size="xl" />
      </ScrollView>

      {/* Primary CTA */}
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
        <PraxisButton
          title="Begin Session"
          onPress={handleBeginSession}
          size="large"
        />
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
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtext: {
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  blockTitle: {
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  blockItem: {
    lineHeight: 22,
  },
  prescriptionText: {
    fontWeight: '500',
  },
  blockActions: {
    flexDirection: 'row',
    width: '100%',
  },
  footer: {
    width: '100%',
  },
});
