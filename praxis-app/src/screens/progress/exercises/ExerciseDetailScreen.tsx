import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useTheme } from '@theme';
import { Card, Spacer } from '@components';
import { useProgressionStore, ExerciseHistoryEntry } from '@/store/progressionStore';
import {
  getExerciseHistory,
  getExerciseWeightTrend,
  getExerciseRpeTrend,
  getExerciseVolumeTrend,
} from '@/utils/progressAnalyticsEx';
import { EXERCISES } from '@core/data/exercises';
import ExerciseTrendChart from '@/components/progress/exercises/ExerciseTrendChart';
import ExerciseStatCard from '@/components/progress/exercises/ExerciseStatCard';
import dayjs from 'dayjs';

/**
 * Format date for history list
 */
function formatHistoryDate(dateString: string): string {
  const date = dayjs(dateString);
  const today = dayjs();
  const yesterday = today.subtract(1, 'day');

  if (date.isSame(today, 'day')) {
    return 'Today';
  }
  if (date.isSame(yesterday, 'day')) {
    return 'Yesterday';
  }
  if (date.isAfter(today.subtract(7, 'day'))) {
    return date.format('dddd'); // Day of week
  }
  return date.format('MMM D, YYYY');
}

export default function ExerciseDetailScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ exercise?: string }>();
  const exerciseName = params.exercise ? decodeURIComponent(params.exercise) : null;
  const { history, _hasHydrated } = useProgressionStore();

  // Wait for hydration
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

  if (!exerciseName) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.appBg }]}
        edges={['top']}
      >
        <View style={{ padding: theme.spacing.lg }}>
          <Text
            style={{
              color: theme.colors.textPrimary,
              fontFamily: theme.typography.fonts.heading,
              fontSize: theme.typography.sizes.h2,
            }}
          >
            Exercise not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Get all history entries
  const allHistoryEntries = useMemo(() => {
    const entries: ExerciseHistoryEntry[] = [];
    Object.values(history).forEach((exerciseHistory) => {
      entries.push(...exerciseHistory);
    });
    return entries;
  }, [history]);

  // Get exercise-specific history
  const exerciseHistory = useMemo(() => {
    return getExerciseHistory(allHistoryEntries, exerciseName);
  }, [allHistoryEntries, exerciseName]);

  // Calculate trends
  const weightTrend = useMemo(() => {
    return getExerciseWeightTrend(exerciseHistory);
  }, [exerciseHistory]);

  const rpeTrend = useMemo(() => {
    return getExerciseRpeTrend(exerciseHistory);
  }, [exerciseHistory]);

  const volumeTrend = useMemo(() => {
    return getExerciseVolumeTrend(exerciseHistory);
  }, [exerciseHistory]);

  // Calculate stats
  const stats = useMemo(() => {
    if (exerciseHistory.length === 0) {
      return {
        sessions: 0,
        bestWeight: 0,
        avgRpe: null,
      };
    }

    // Count unique sessions
    const uniqueSessions = new Set(exerciseHistory.map((e) => e.sessionId));
    const sessions = uniqueSessions.size;

    // Best weight (highest single set weight)
    const bestWeight = Math.max(...exerciseHistory.map((e) => e.weight));

    // Average RPE
    const rpeSum = exerciseHistory.reduce((sum, e) => sum + e.rpe, 0);
    const avgRpe = rpeSum / exerciseHistory.length;

    return {
      sessions,
      bestWeight: Math.round(bestWeight),
      avgRpe: Math.round(avgRpe * 10) / 10,
    };
  }, [exerciseHistory]);

  // Group history by session for display
  const historyBySession = useMemo(() => {
    if (exerciseHistory.length === 0) return [];

    const sessionMap = new Map<string, ExerciseHistoryEntry[]>();
    exerciseHistory.forEach((entry) => {
      const existing = sessionMap.get(entry.sessionId) || [];
      sessionMap.set(entry.sessionId, [...existing, entry]);
    });

    return Array.from(sessionMap.entries())
      .map(([sessionId, entries]) => {
        const date = entries[0].date;
        const totalVolume = entries.reduce((sum, e) => sum + e.volume, 0);
        const avgWeight =
          entries.reduce((sum, e) => sum + e.weight, 0) / entries.length;
        const avgRpe = entries.reduce((sum, e) => sum + e.rpe, 0) / entries.length;
        const reps = entries[0].reps; // Assume same reps for all sets in session

        return {
          sessionId,
          date,
          weight: Math.round(avgWeight),
          reps,
          rpe: Math.round(avgRpe * 10) / 10,
          volume: Math.round(totalVolume),
          sets: entries.length,
        };
      })
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA; // Newest first
      });
  }, [exerciseHistory]);

  if (exerciseHistory.length === 0) {
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
            {exerciseName}
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
                },
              ]}
            >
              Not enough data for this exercise
            </Text>
          </Card>
        </ScrollView>
      </SafeAreaView>
    );
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
          {exerciseName}
        </Text>

        {/* Stat Cards Row */}
        <View style={styles.statsRow}>
          <ExerciseStatCard label="Sessions" value={stats.sessions} />
          <View style={{ width: theme.spacing.md }} />
          <ExerciseStatCard label="Best Weight" value={`${stats.bestWeight} lb`} />
          <View style={{ width: theme.spacing.md }} />
          <ExerciseStatCard
            label="Avg RPE"
            value={stats.avgRpe !== null ? stats.avgRpe.toFixed(1) : '—'}
          />
        </View>

        <Spacer size="lg" />

        {/* Weight Trend Chart */}
        {weightTrend.length >= 2 && (
          <>
            <ExerciseTrendChart title="Weight Trend" data={weightTrend} />
            <Spacer size="lg" />
          </>
        )}

        {/* RPE Trend Chart */}
        {rpeTrend.length >= 2 && (
          <>
            <ExerciseTrendChart title="RPE Trend" data={rpeTrend} />
            <Spacer size="lg" />
          </>
        )}

        {/* Volume Trend Chart */}
        {volumeTrend.length >= 2 && (
          <>
            <ExerciseTrendChart title="Volume Trend" data={volumeTrend} />
            <Spacer size="lg" />
          </>
        )}

        {/* History List */}
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
          History
        </Text>

        {historyBySession.map((session, index) => (
          <React.Fragment key={session.sessionId}>
            <Card variant="elevated" padding="lg">
              <View style={styles.historyRow}>
                <View style={styles.historyContent}>
                  <Text
                    style={[
                      styles.historyDate,
                      {
                        color: theme.colors.textPrimary,
                        fontFamily: theme.typography.fonts.headingMedium,
                        fontSize: theme.typography.sizes.h4,
                        marginBottom: theme.spacing.xs,
                      },
                    ]}
                  >
                    {formatHistoryDate(session.date)}
                  </Text>
                  <Text
                    style={[
                      styles.historyDetails,
                      {
                        color: theme.colors.textSecondary,
                        fontFamily: theme.typography.fonts.body,
                        fontSize: theme.typography.sizes.body,
                      },
                    ]}
                  >
                    {session.weight} lb × {session.reps} @ RPE {session.rpe}
                  </Text>
                  <Text
                    style={[
                      styles.historyVolume,
                      {
                        color: theme.colors.textMuted,
                        fontFamily: theme.typography.fonts.body,
                        fontSize: theme.typography.sizes.bodySmall,
                        marginTop: theme.spacing.xs,
                      },
                    ]}
                  >
                    {session.sets} {session.sets === 1 ? 'set' : 'sets'} •{' '}
                    {session.volume.toLocaleString()} lb total
                  </Text>
                </View>
              </View>
            </Card>
            {index < historyBySession.length - 1 && <Spacer size="md" />}
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
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontWeight: '600',
  },
  emptyText: {
    fontWeight: '400',
    lineHeight: 22,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  historyContent: {
    flex: 1,
  },
  historyDate: {
    fontWeight: '600',
  },
  historyDetails: {
    fontWeight: '400',
  },
  historyVolume: {
    fontWeight: '400',
  },
});
