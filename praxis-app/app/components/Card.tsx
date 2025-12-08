import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../theme';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated';
  padding?: keyof typeof import('../theme/spacing').spacing;
}

export default function Card({
  children,
  style,
  variant = 'default',
  padding = 'lg',
}: CardProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.graphite,
          padding: theme.spacing[padding],
          borderRadius: theme.radius.md,
        },
        variant === 'elevated' && theme.shadows.card,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
});
