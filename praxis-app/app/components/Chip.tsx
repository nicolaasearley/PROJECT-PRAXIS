import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme';

interface ChipProps {
  label: string;
  variant?: 'default' | 'accent' | 'success' | 'warning' | 'danger';
  size?: 'small' | 'medium';
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: ReactNode;
  onPress?: () => void;
}

export default function Chip({
  label,
  variant = 'default',
  size = 'medium',
  style,
  textStyle,
  icon,
  onPress,
}: ChipProps) {
  const theme = useTheme();

  const getBackgroundColor = (): string => {
    if (variant === 'accent') return theme.colors.acidGreen;
    if (variant === 'success') return theme.colors.success;
    if (variant === 'warning') return theme.colors.warning;
    if (variant === 'danger') return theme.colors.danger;
    return theme.colors.steel;
  };

  const getTextColor = (): string => {
    if (variant === 'accent') return theme.colors.black;
    if (variant === 'default') return theme.colors.white;
    return theme.colors.black;
  };

  const Component = onPress ? TouchableOpacity : View;

  return (
    <Component
      style={[
        styles.chip,
        {
          backgroundColor: getBackgroundColor(),
          paddingVertical:
            size === 'small' ? theme.spacing.xs : theme.spacing.sm,
          paddingHorizontal:
            size === 'small' ? theme.spacing.sm : theme.spacing.md,
          borderRadius: theme.radius.pill,
        },
        style,
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {icon && <>{icon}</>}
      <Text
        style={[
          styles.text,
          {
            color: getTextColor(),
            fontSize:
              size === 'small'
                ? theme.typography.sizes.caption
                : theme.typography.sizes.bodySmall,
            fontFamily: theme.typography.fonts.bodyMedium,
          },
          icon && styles.textWithIcon,
          textStyle,
        ]}
      >
        {label}
      </Text>
    </Component>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '500',
  },
  textWithIcon: {
    marginLeft: 4,
  },
});
