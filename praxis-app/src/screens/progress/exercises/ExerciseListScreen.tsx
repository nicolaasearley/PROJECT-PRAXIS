import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@theme';
import { Card, Spacer, PraxisButton } from '@components';
import { useProgressionStore, ExerciseHistoryEntry } from '@/store/progressionStore';
import { getUniqueExercises } from '@/utils/progressAnalyticsEx';
import { EXERCISES } from '@core/data/exercises';
import ExerciseListItem from '@/components/progress/exercises/ExerciseListItem';

export default function ExerciseListScreen() {
  const theme = useTheme();
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

  // Get all history entries
  const allHistoryEntries = useMemo(() => {
    const entries: ExerciseHistoryEntry[] = [];
    Object.values(history).forEach((exerciseHistory) => {
      entries.push(...exerciseHistory);
    });
    return entries;
  }, [history]);

  // Get unique exercises
  const uniqueExercises = useMemo(() => {
    return getUniqueExercises(allHistoryEntries);
  }, [allHistoryEntries]);

  // Get latest weight and RPE for each exercise
  const exerciseData = useMemo(() => {
    return uniqueExercises.map((exerciseName) => {
      // Find exercise ID
      const exercise = EXERCISES.find((ex) => ex.name === exerciseName);
      if (!exercise) {
        return { name: exerciseName, latestWeight: null, latestRpe: null };
      }

      // Get history for this exercise
      const exerciseHistory = history[exercise.id] || [];
      if (exerciseHistory.length === 0) {
        return { name: exerciseName, latestWeight: null, latestRpe: null };
      }

      // Sort by date (newest first)
      const sorted = [...exerciseHistory].sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (dateA !== dateB) return dateB - dateA;
        return b.sessionId.localeCompare(a.sessionId);
      });

      const latest = sorted[0];
      return {
        name: exerciseName,
        latestWeight: latest.weight,
        latestRpe: latest.rpe,
      };
    });
  }, [uniqueExercises, history]);

  const handleExercisePress = (exerciseName: string) => {
    router.push(`/progress/exercises/${encodeURIComponent(exerciseName)}`);
  };

  const handleStartTraining = () => {
    router.push('/today');
  };

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
          Strength Progress
        </Text>

        {/* Empty State */}
        {exerciseData.length === 0 ? (
          <Card variant="elevated" padding="lg">
            <Text
              style={[
                styles.emptyTitle,
                {
                  color: theme.colors.textPrimary,
                  fontFamily: theme.typography.fonts.headingMedium,
                  fontSize: theme.typography.sizes.h3,
                  marginBottom: theme.spacing.md,
                  textAlign: 'center',
                },
              ]}
            >
              No strength data yet
            </Text>
            <Text
              style={[
                styles.emptyText,
                {
                  color: theme.colors.textMuted,
                  fontFamily: theme.typography.fonts.body,
                  fontSize: theme.typography.sizes.body,
                  marginBottom: theme.spacing.lg,
                  textAlign: 'center',
                },
              ]}
            >
              Complete strength workouts to track your progress here.
            </Text>
            <PraxisButton
              title="Start Training"
              onPress={handleStartTraining}
              size="medium"
            />
          </Card>
        ) : (
          <>
            {exerciseData.map((exercise, index) => (
              <React.Fragment key={exercise.name}>
                <ExerciseListItem
                  name={exercise.name}
                  latestWeight={exercise.latestWeight}
                  latestRpe={exercise.latestRpe}
                  onPress={() => handleExercisePress(exercise.name)}
                />
                {index < exerciseData.length - 1 && <Spacer size="md" />}
              </React.Fragment>
            ))}
            <Spacer size="lg" />
          </>
        )}
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
  emptyTitle: {
    fontWeight: '600',
  },
  emptyText: {
    fontWeight: '400',
    lineHeight: 22,
  },
});
