import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@theme';
import { Spacer } from '@components';
import { WorkoutRecord } from '@/types/workout';
import WorkoutHistoryItem from './WorkoutHistoryItem';
import dayjs from 'dayjs';

interface WorkoutHistoryListProps {
  workouts: WorkoutRecord[];
}

export default function WorkoutHistoryList({
  workouts,
}: WorkoutHistoryListProps) {
  const theme = useTheme();

  if (workouts.length === 0) {
    return null;
  }

  // Sort by date descending (most recent first)
  const sortedWorkouts = [...workouts].sort((a, b) => {
    const dateA = dayjs(a.date);
    const dateB = dayjs(b.date);
    if (dateA.isAfter(dateB)) return -1;
    if (dateA.isBefore(dateB)) return 1;
    // If same date, sort by startTime descending
    return b.startTime - a.startTime;
  });

  return (
    <View style={styles.container}>
      {sortedWorkouts.map((workout, index) => (
        <React.Fragment key={workout.id}>
          <WorkoutHistoryItem workout={workout} />
          {index < sortedWorkouts.length - 1 && <Spacer size="md" />}
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});
