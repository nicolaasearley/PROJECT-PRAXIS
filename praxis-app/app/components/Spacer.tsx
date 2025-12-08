import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../theme';

interface SpacerProps {
  size?: keyof typeof import('../theme/spacing').spacing | number;
  horizontal?: boolean;
  style?: ViewStyle;
}

export default function Spacer({
  size = 'md',
  horizontal = false,
  style,
}: SpacerProps) {
  const theme = useTheme();

  const getSpacing = (): number => {
    if (typeof size === 'number') {
      return size;
    }
    return theme.spacing[size];
  };

  return (
    <View
      style={[
        horizontal ? { width: getSpacing() } : { height: getSpacing() },
        style,
      ]}
    />
  );
}
