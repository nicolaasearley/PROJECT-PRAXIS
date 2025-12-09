import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme';
import { Card, PraxisButton, Spacer, IconButton, Chip } from '../../components';
import { usePlanStore } from '../../../core/store';
import { useSessionStore } from '../../../core/store';
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

  // Find the plan day by ID
  const today =
    planDayId !== undefined ? plan.find((day) => day.id === planDayId) : null;

  // Handle "Begin Workout" button press
  const handleBeginWorkout = () => {
    if (!today || !planDayId) return;

    // Start the session
    startSession(planDayId);

    // Navigate to ActiveWorkout screen
    router.push({ pathname: '/workout/active', params: { planDayId } });
  };

  // Handle back navigation
  const handleBack = () => {
    router.replace('/home');
  };

  // Error state: Workout not found
  if (planDayId && !today) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.black }]}
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
                color: theme.colors.white,
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
  if (today && today.blocks.length === 0) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.black }]}
        edges={['top']}
      >
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
                  color: theme.colors.white,
                  fontFamily: theme.typography.fonts.heading,
                  fontSize: theme.typography.sizes.h2,
                },
              ]}
            >
              {formatDate(today.date)}
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
                color: theme.colors.white,
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
  if (!today) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.black }]}
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
                color: theme.colors.white,
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
      style={[styles.container, { backgroundColor: theme.colors.black }]}
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
          onPress={handleBack}
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
                marginBottom: theme.spacing.xs,
              },
            ]}
          >
            {formatDate(today.date)}
          </Text>
          {/* Focus Tags */}
          {today.focusTags.length > 0 && (
            <View style={styles.focusTagsContainer}>
              {today.focusTags.map((tag, index) => (
                <Chip
                  key={index}
                  label={tag}
                  variant="accent"
                  size="small"
                  style={{ marginRight: theme.spacing.xs }}
                />
              ))}
            </View>
          )}
          {/* Duration */}
          <Text
            style={[
              styles.duration,
              {
                color: theme.colors.muted,
                fontFamily: theme.typography.fonts.body,
                fontSize: theme.typography.sizes.bodySmall,
                marginTop: theme.spacing.xs,
              },
            ]}
          >
            {today.estimatedDurationMinutes} min
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
        {/* Render each block */}
        {today.blocks.map((block, blockIndex) => (
          <React.Fragment key={block.id}>
            <Card
              variant="elevated"
              padding="lg"
              style={{
                backgroundColor: theme.colors.graphite,
                borderRadius: theme.radius.lg,
              }}
            >
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
                {block.title}
              </Text>

              {/* Block type-specific content */}
              {block.type === 'strength' && block.strengthMain && (
                <View>
                  {block.strengthMain.sets.length > 0 && (
                    <Text
                      style={[
                        styles.blockDescription,
                        {
                          color: theme.colors.white,
                          fontFamily: theme.typography.fonts.body,
                          fontSize: theme.typography.sizes.body,
                        },
                      ]}
                    >
                      {block.strengthMain.sets.length} ×{' '}
                      {block.strengthMain.sets[0]?.targetReps || '?'} ×{' '}
                      {block.strengthMain.sets[0]?.targetPercent1RM
                        ? `${Math.round(
                            (block.strengthMain.sets[0].targetPercent1RM || 0) *
                              100
                          )}%`
                        : 'RPE ' +
                          (block.strengthMain.sets[0]?.targetRpe || '?')}
                    </Text>
                  )}
                </View>
              )}

              {block.type === 'accessory' && block.accessory && (
                <View>
                  {block.accessory.map((exercise, index) => (
                    <Text
                      key={index}
                      style={[
                        styles.blockDescription,
                        {
                          color: theme.colors.white,
                          fontFamily: theme.typography.fonts.body,
                          fontSize: theme.typography.sizes.bodySmall,
                          marginBottom:
                            index < block.accessory!.length - 1
                              ? theme.spacing.sm
                              : 0,
                        },
                      ]}
                    >
                      • {exercise.exerciseId} — {exercise.sets.length} ×{' '}
                      {exercise.sets[0]?.targetReps || '?'}
                    </Text>
                  ))}
                </View>
              )}

              {block.type === 'conditioning' && block.conditioning && (
                <Text
                  style={[
                    styles.blockDescription,
                    {
                      color: theme.colors.white,
                      fontFamily: theme.typography.fonts.body,
                      fontSize: theme.typography.sizes.body,
                    },
                  ]}
                >
                  {block.conditioning.rounds || '?'} rounds —{' '}
                  {block.conditioning.workSeconds
                    ? `${Math.round(block.conditioning.workSeconds / 60)}s`
                    : '?'}{' '}
                  on /{' '}
                  {block.conditioning.restSeconds
                    ? `${Math.round(block.conditioning.restSeconds / 60)}s`
                    : '?'}{' '}
                  off @ {block.conditioning.targetZone || 'Z?'}
                </Text>
              )}

              {block.type === 'warmup' && block.warmupItems && (
                <View>
                  {block.warmupItems.map((item, index) => (
                    <Text
                      key={index}
                      style={[
                        styles.blockDescription,
                        {
                          color: theme.colors.white,
                          fontFamily: theme.typography.fonts.body,
                          fontSize: theme.typography.sizes.bodySmall,
                          marginBottom:
                            index < block.warmupItems!.length - 1
                              ? theme.spacing.sm
                              : 0,
                        },
                      ]}
                    >
                      • {item}
                    </Text>
                  ))}
                </View>
              )}

              {block.type === 'cooldown' && block.cooldownItems && (
                <View>
                  {block.cooldownItems.map((item, index) => (
                    <Text
                      key={index}
                      style={[
                        styles.blockDescription,
                        {
                          color: theme.colors.white,
                          fontFamily: theme.typography.fonts.body,
                          fontSize: theme.typography.sizes.bodySmall,
                          marginBottom:
                            index < block.cooldownItems!.length - 1
                              ? theme.spacing.sm
                              : 0,
                        },
                      ]}
                    >
                      • {item}
                    </Text>
                  ))}
                </View>
              )}
            </Card>
            {blockIndex < today.blocks.length - 1 && <Spacer size="lg" />}
          </React.Fragment>
        ))}

        <Spacer size="xl" />
      </ScrollView>

      {/* Primary CTA */}
      {today.blocks.length > 0 && (
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
            title="Begin Workout"
            onPress={handleBeginWorkout}
            size="large"
          />
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
