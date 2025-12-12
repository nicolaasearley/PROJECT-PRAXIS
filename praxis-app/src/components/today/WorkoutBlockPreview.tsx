import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@theme';
import { Card } from '@components';
import { WorkoutBlock } from '@core/types';

// Type alias for compatibility with requirements
type TrainingBlock = WorkoutBlock;

interface WorkoutBlockPreviewProps {
  block: TrainingBlock;
}

/**
 * Format exercise ID to readable name
 */
function formatExerciseName(exerciseId: string): string {
  return exerciseId
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function WorkoutBlockPreview({
  block,
}: WorkoutBlockPreviewProps) {
  const theme = useTheme();

  // Format sets & reps for strength main lift
  const getStrengthPrescription = (): string | null => {
    if (block.type === 'strength' && block.strengthMain) {
      const sets = block.strengthMain.sets.length;
      const firstSet = block.strengthMain.sets[0];
      const reps = firstSet?.targetReps;
      const rpe = firstSet?.targetRpe;

      if (sets && reps) {
        let prescription = `${sets} × ${reps}`;
        if (rpe) {
          prescription += ` @ RPE ${rpe}`;
        }
        return prescription;
      }
    }
    return null;
  };

  // Get exercise names for accessory, warmup, or cooldown blocks
  const getExerciseNames = (): string[] => {
    const exercises: string[] = [];

    // Accessory exercises
    if (block.accessory && block.accessory.length > 0) {
      block.accessory.forEach((exercise) => {
        exercises.push(formatExerciseName(exercise.exerciseId));
      });
    }

    // Warmup items
    if (block.warmupItems && block.warmupItems.length > 0) {
      exercises.push(...block.warmupItems);
    }

    // Cooldown items
    if (block.cooldownItems && block.cooldownItems.length > 0) {
      exercises.push(...block.cooldownItems);
    }

    return exercises;
  };

  const strengthPrescription = getStrengthPrescription();
  const exerciseNames = getExerciseNames();

  return (
    <Card variant="elevated" padding="lg">
      {/* Title */}
      <Text
        style={[
          styles.title,
          {
            color: theme.colors.textPrimary,
            fontFamily: theme.typography.fonts.headingMedium,
            fontSize: theme.typography.sizes.h3,
            marginBottom: theme.spacing.md,
          },
        ]}
      >
        {block.title}
      </Text>

      {/* Sets & Reps for main lift */}
      {strengthPrescription && (
        <Text
          style={[
            styles.prescription,
            {
              color: theme.colors.textSecondary,
              fontFamily: theme.typography.fonts.body,
              fontSize: theme.typography.sizes.body,
              marginBottom: exerciseNames.length > 0 ? theme.spacing.md : 0,
            },
          ]}
        >
          {strengthPrescription}
        </Text>
      )}

      {/* Exercise list for accessory/warmup/cooldown */}
      {exerciseNames.length > 0 && (
        <View style={styles.exercisesList}>
          {exerciseNames.map((exerciseName, index) => (
            <Text
              key={index}
              style={[
                styles.exerciseItem,
                {
                  color: theme.colors.textPrimary,
                  fontFamily: theme.typography.fonts.body,
                  fontSize: theme.typography.sizes.body,
                },
              ]}
            >
              • {exerciseName}
            </Text>
          ))}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  title: {
    fontWeight: '600',
  },
  prescription: {
    fontWeight: '400',
  },
  exercisesList: {
    marginTop: 0,
  },
  exerciseItem: {
    marginBottom: 4,
    lineHeight: 20,
  },
});
