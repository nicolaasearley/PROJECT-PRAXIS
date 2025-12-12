import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme';
import { Card } from '@components';

interface ExerciseListItemProps {
  name: string;
  latestWeight: number | null;
  latestRpe: number | null;
  onPress: () => void;
}

export default function ExerciseListItem({
  name,
  latestWeight,
  latestRpe,
  onPress,
}: ExerciseListItemProps) {
  const theme = useTheme();

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card variant="elevated" padding="lg">
        <View style={styles.container}>
          <View style={styles.content}>
            {/* Exercise Name */}
            <Text
              style={[
                styles.exerciseName,
                {
                  color: theme.colors.textPrimary,
                  fontFamily: theme.typography.fonts.headingMedium,
                  fontSize: theme.typography.sizes.h4,
                  marginBottom: theme.spacing.xs,
                },
              ]}
            >
              {name}
            </Text>

            {/* Subtext */}
            <Text
              style={[
                styles.subtext,
                {
                  color: theme.colors.textMuted,
                  fontFamily: theme.typography.fonts.body,
                  fontSize: theme.typography.sizes.bodySmall,
                },
              ]}
            >
              {latestWeight !== null && latestRpe !== null
                ? `Last: ${latestWeight} lb @ RPE ${latestRpe}`
                : 'No recent data'}
            </Text>
          </View>

          {/* Right Arrow */}
          <Ionicons
            name="chevron-forward"
            size={20}
            color={theme.colors.textMuted}
          />
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
  },
  exerciseName: {
    fontWeight: '600',
  },
  subtext: {
    fontWeight: '400',
  },
});
