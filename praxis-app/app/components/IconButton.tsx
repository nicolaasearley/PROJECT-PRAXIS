import React, { ReactNode } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../theme';

interface IconButtonProps {
  icon: ReactNode;
  onPress: () => void;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'accent' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

export default function IconButton({
  icon,
  onPress,
  size = 'medium',
  variant = 'default',
  disabled = false,
  loading = false,
  style,
  accessibilityLabel,
}: IconButtonProps) {
  const theme = useTheme();

  const getButtonSize = (): number => {
    if (size === 'small') return 32;
    if (size === 'medium') return 44;
    return 56;
  };

  const getBackgroundColor = (): string => {
    if (variant === 'accent') return theme.colors.acidGreen;
    if (variant === 'ghost') return 'transparent';
    return theme.colors.steel;
  };

  const buttonSize = getButtonSize();

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          width: buttonSize,
          height: buttonSize,
          borderRadius: theme.radius.md,
          backgroundColor: getBackgroundColor(),
        },
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'accent' ? theme.colors.black : theme.colors.white}
          size="small"
        />
      ) : (
        icon
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});
