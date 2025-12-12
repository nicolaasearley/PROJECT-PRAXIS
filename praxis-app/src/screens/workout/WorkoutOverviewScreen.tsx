import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme';
import { PraxisButton, Spacer, IconButton, Chip } from '@components';
import { ExpandableBlock } from '@components/blocks/ExpandableBlock';
import { StrengthBlockRenderer } from '@components/blocks/renderers/StrengthBlockRenderer';
import { AccessoryBlockRenderer } from '@components/blocks/renderers/AccessoryBlockRenderer';
import { ConditioningBlockRenderer } from '@components/blocks/renderers/ConditioningBlockRenderer';
import { WarmupBlockRenderer } from '@components/blocks/renderers/WarmupBlockRenderer';
import { CooldownBlockRenderer } from '@components/blocks/renderers/CooldownBlockRenderer';
import { HyroxRaceBlock } from '@components/workout/HyroxRaceBlock';
import { usePlanStore } from '@core/store';
import { useSessionStore } from '@core/store';
import { useWorkoutSessionStore } from '@/store/workoutSessionStore';
import { useRecoveryStore } from '@/store/recoveryStore';
import { applyRecoveryAdjustment } from '@/utils/recoveryAdjustment';
import { Card } from '@components';
import dayjs from 'dayjs';

/**
 * Format ISO date string to readable format (e.g., "Monday, Feb 12")
 */
function formatDate(dateString: string): string {
  const date = dayjs(dateString);
  return date.format('dddd, MMM D');
}

export default function WorkoutOverviewScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ planDayId?: string | string[] }>();
  const planDayId = Array.isArray(params.planDayId)
    ? params.planDayId[0]
    : params.planDayId;
  const { plan } = usePlanStore();
  const { startSession } = useSessionStore();
  const { session, startSession: startWorkoutSession } = useWorkoutSessionStore();
  const { getRecovery } = useRecoveryStore();
  const reorderAccessoryExercises = usePlanStore((s) => s.reorderAccessoryExercises);
  const updateStrengthSet = usePlanStore((s) => s.updateStrengthSet);
  const addStrengthSet = usePlanStore((s) => s.addStrengthSet);
  const removeStrengthSet = usePlanStore((s) => s.removeStrengthSet);

  // Find the plan day by ID
  const planDay = plan.find((day) => day.id === planDayId) ?? plan[0];

  // Check if there's an active session for today's workout
  const hasActiveSession = session.planDayId === planDayId && session.startTime !== null;
  const canResume = hasActiveSession && session.currentBlockIndex < session.blocks.length;

  // Calculate adjustment metadata if not already in session
  const adjustmentMetadata = session.adjustmentMetadata || (() => {
    if (!planDay) return null;
    const recoveryScore = getRecovery();
    if (recoveryScore === null) return null;
    const adjustment = applyRecoveryAdjustment(recoveryScore, planDay.blocks);
    return adjustment.metadata;
  })();

  const orderedBlocks = [...(planDay?.blocks ?? [])].sort((a: any, b: any) => {
    const order: Record<string, number> = {
      warmup: 0,
      strength: 1,
      accessory: 2,
      conditioning: 3,
      cooldown: 4,
    };
    return (order[a.type] ?? 99) - (order[b.type] ?? 99);
  });

  const renderBlockContent = (block: any) => {
    switch (block.type) {
      case 'warmup':
        return <WarmupBlockRenderer block={block} />;
      case 'strength':
        return <StrengthBlockRenderer block={block} />;
      case 'accessory':
        return <AccessoryBlockRenderer block={block} />;
      case 'conditioning':
        return <ConditioningBlockRenderer block={block} />;
      case 'cooldown':
        return <CooldownBlockRenderer block={block} />;
      default:
        return null;
    }
  };

  // Handle "Start Workout" button press
  const handleStartWorkout = () => {
    if (!planDay || !planDayId) return;

    // Start the workout session
    startWorkoutSession(planDayId, planDay.blocks);

    // Navigate to session screen with first block
    router.push('/workout/session?blockIndex=0');
  };

  // Handle "Resume Workout" button press
  const handleResumeWorkout = () => {
    if (!planDay || !planDayId) return;

    // Navigate to current block in session
    router.push(`/workout/session?blockIndex=${session.currentBlockIndex}`);
  };

  // Handle back navigation
  const handleBack = () => {
    router.replace('/today');
  };

  // Error state: Workout not found
  if (planDayId && !planDay) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.appBg }]}
        edges={['top', 'bottom']}
      >
        <View
          style={[
            styles.errorContainer,
            {
              padding: theme.spacing.xl,
            },
          ]}
        >
          <Text
            style={[
              styles.errorTitle,
              {
                color: theme.colors.textPrimary,
                fontFamily: theme.typography.fonts.heading,
                fontSize: theme.typography.sizes.h2,
                marginBottom: theme.spacing.md,
              },
            ]}
          >
            Workout not found.
          </Text>
          <PraxisButton
            title="Back to Home"
            onPress={handleBack}
            size="medium"
          />
        </View>
      </SafeAreaView>
    );
  }

  // Rest day state: No blocks
  if (planDay && planDay.blocks.length === 0) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.appBg }]}
        edges={['top']}
      >
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
              <Ionicons
                name="arrow-back"
                size={24}
                color={theme.colors.white}
              />
            }
            onPress={handleBack}
            variant="ghost"
            size="medium"
          />
          <View style={styles.headerContent}>
            <Text
              style={[
                styles.headerTitle,
                {
                  color: theme.colors.textPrimary,
                  fontFamily: theme.typography.fonts.heading,
                  fontSize: theme.typography.sizes.h2,
                },
              ]}
            >
              Today&apos;s Workout
            </Text>
          </View>
          <View style={{ width: 44 }} />
        </View>

        <View
          style={[
            styles.restDayContainer,
            {
              padding: theme.spacing.xl,
            },
          ]}
        >
          <Text
            style={[
              styles.restDayTitle,
              {
                color: theme.colors.textPrimary,
                fontFamily: theme.typography.fonts.heading,
                fontSize: theme.typography.sizes.h1,
                marginBottom: theme.spacing.md,
              },
            ]}
          >
            Rest day — no workout planned.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Normal workout state
  if (!planDay) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.appBg }]}
        edges={['top', 'bottom']}
      >
        <View
          style={[
            styles.errorContainer,
            {
              padding: theme.spacing.xl,
            },
          ]}
        >
          <Text
            style={[
              styles.errorTitle,
              {
                color: theme.colors.textPrimary,
                fontFamily: theme.typography.fonts.heading,
                fontSize: theme.typography.sizes.h2,
                marginBottom: theme.spacing.md,
              },
            ]}
          >
            Workout not found.
          </Text>
          <PraxisButton
            title="Back to Home"
            onPress={handleBack}
            size="medium"
          />
        </View>
      </SafeAreaView>
    );
  }

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
            <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
          }
          onPress={handleBack}
          variant="ghost"
          size="medium"
        />
        <View style={styles.headerContent}>
          <Text
            style={[
              styles.headerTitle,
              {
                color: theme.colors.textPrimary,
                fontFamily: theme.typography.fonts.heading,
                fontSize: theme.typography.sizes.h2,
                marginBottom: theme.spacing.xs,
              },
            ]}
          >
            Today&apos;s Workout
          </Text>
          <Text
            style={[
              styles.subtitle,
              {
                color: theme.colors.textMuted,
                fontFamily: theme.typography.fonts.body,
                fontSize: theme.typography.sizes.body,
              },
            ]}
          >
            {planDay?.date} • {planDay?.estimatedDurationMinutes} min
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
        <Spacer size="lg" />

        {orderedBlocks.map((block: any, index: number) => {
          // HYROX RACE SIMULATION RENDERER
          if (
            block.type === 'conditioning' &&
            block.conditioning &&
            'stations' in block.conditioning &&
            Array.isArray(block.conditioning.stations)
          ) {
            return (
              <React.Fragment key={block.id ?? `${block.type}-${index}`}>
                <HyroxRaceBlock race={block.conditioning as any} />
                {index < orderedBlocks.length - 1 && <Spacer size="lg" />}
              </React.Fragment>
            );
          }

          return (
            <ExpandableBlock
              key={block.id ?? `${block.type}-${index}`}
              title={block.title ?? ''}
              subtitle={
                block.type === 'strength'
                  ? 'Main lift + key accessory work'
                  : undefined
              }
              type={block.type}
              durationMinutes={block.estimatedDurationMinutes}
              defaultExpanded={index === 0}
            >
              {renderBlockContent(block)}
            </ExpandableBlock>
          );
        })}

        <Spacer size="xl" />
      </ScrollView>

      {/* Primary CTA */}
      {planDay && planDay.blocks.length > 0 && (
        <View
          style={[
            styles.footer,
            {
              padding: theme.spacing.lg,
              borderTopWidth: 1,
              borderTopColor: theme.colors.surface3,
            },
          ]}
        >
          {/* Adjustment Banner */}
          {adjustmentMetadata && (
            <>
              <Card
                variant="elevated"
                padding="md"
                style={{
                  marginBottom: theme.spacing.md,
                  backgroundColor:
                    adjustmentMetadata.level === 'under'
                      ? `${theme.colors.warning}20`
                      : adjustmentMetadata.level === 'high'
                      ? `${theme.colors.primary}20`
                      : `${theme.colors.primary}15`,
                  borderLeftWidth: 3,
                  borderLeftColor:
                    adjustmentMetadata.level === 'under'
                      ? theme.colors.warning
                      : adjustmentMetadata.level === 'high'
                      ? theme.colors.primary
                      : theme.colors.textMuted,
                }}
              >
                <Text
                  style={[
                    styles.adjustmentText,
                    {
                      color:
                        adjustmentMetadata.level === 'under'
                          ? theme.colors.warning
                          : adjustmentMetadata.level === 'high'
                          ? theme.colors.primary
                          : theme.colors.textPrimary,
                      fontFamily: theme.typography.fonts.bodyMedium,
                      fontSize: theme.typography.sizes.bodySmall,
                    },
                  ]}
                >
                  {adjustmentMetadata.level === 'under'
                    ? "Today's workout has been reduced due to low recovery."
                    : adjustmentMetadata.level === 'high'
                    ? 'Performance mode enabled — your workout has been boosted.'
                    : 'A recommended adjustment has been applied.'}
                </Text>
              </Card>
            </>
          )}

          {hasActiveSession && canResume ? (
            <PraxisButton
              title="Resume Workout"
              onPress={handleResumeWorkout}
              size="large"
            />
          ) : (
          <PraxisButton
              title="Start Workout"
              onPress={handleStartWorkout}
            size="large"
          />
          )}
        </View>
      )}
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
  },
  focusTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 4,
  },
  duration: {
    fontWeight: '400',
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
  blockDescription: {
    lineHeight: 22,
  },
  footer: {
    width: '100%',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorTitle: {
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontWeight: '400',
  },
  restDayContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restDayTitle: {
    fontWeight: '700',
    textAlign: 'center',
  },
});
