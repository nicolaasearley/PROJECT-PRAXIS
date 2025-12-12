import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@theme';
import { Card } from '@components';

interface ExerciseStatCardProps {
  label: string;
  value: string | number;
}

export default function ExerciseStatCard({
  label,
  value,
}: ExerciseStatCardProps) {
  const theme = useTheme();

  return (
    <Card variant="elevated" padding="md" style={styles.card}>
      <Text
        style={[
          styles.label,
          {
            color: theme.colors.textMuted,
            fontFamily: theme.typography.fonts.body,
            fontSize: theme.typography.sizes.bodySmall,
            marginBottom: theme.spacing.xs,
          },
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.value,
          {
            color: theme.colors.textPrimary,
            fontFamily: theme.typography.fonts.headingMedium,
            fontSize: theme.typography.sizes.h4,
          },
        ]}
      >
        {value}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 100,
  },
  label: {
    fontWeight: '400',
  },
  value: {
    fontWeight: '600',
  },
});
