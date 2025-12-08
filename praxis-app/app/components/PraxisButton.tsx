import React, { ReactNode } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../theme';

interface PraxisButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: ReactNode;
}

export default function PraxisButton({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
}: PraxisButtonProps) {
  const theme = useTheme();

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: theme.radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    };

    // Size variants
    if (size === 'small') {
      baseStyle.paddingVertical = theme.spacing.sm;
      baseStyle.paddingHorizontal = theme.spacing.md;
    } else if (size === 'medium') {
      baseStyle.paddingVertical = theme.spacing.md;
      baseStyle.paddingHorizontal = theme.spacing.lg;
    } else if (size === 'large') {
      baseStyle.paddingVertical = theme.spacing.lg;
      baseStyle.paddingHorizontal = theme.spacing.xl;
    }

    // Variant styles
    if (variant === 'primary') {
      baseStyle.backgroundColor = theme.colors.acidGreen;
    } else if (variant === 'secondary') {
      baseStyle.backgroundColor = theme.colors.graphite;
    } else if (variant === 'outline') {
      baseStyle.backgroundColor = 'transparent';
      baseStyle.borderWidth = 1;
      baseStyle.borderColor = theme.colors.acidGreen;
    } else if (variant === 'ghost') {
      baseStyle.backgroundColor = 'transparent';
    }

    return baseStyle;
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontFamily: theme.typography.fonts.headingMedium,
      fontWeight: '600',
    };

    if (size === 'small') {
      baseStyle.fontSize = theme.typography.sizes.bodySmall;
    } else if (size === 'medium') {
      baseStyle.fontSize = theme.typography.sizes.body;
    } else if (size === 'large') {
      baseStyle.fontSize = theme.typography.sizes.h3;
    }

    if (variant === 'primary') {
      baseStyle.color = theme.colors.black;
    } else if (variant === 'secondary') {
      baseStyle.color = theme.colors.white;
    } else if (variant === 'outline' || variant === 'ghost') {
      baseStyle.color = theme.colors.acidGreen;
    }

    if (disabled) {
      baseStyle.opacity = 0.5;
    }

    return baseStyle;
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), disabled && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === 'primary' ? theme.colors.black : theme.colors.acidGreen
          }
          size="small"
        />
      ) : (
        <>
          {icon && <>{icon}</>}
          <Text
            style={[getTextStyle(), icon && styles.textWithIcon, textStyle]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.5,
  },
  textWithIcon: {
    marginLeft: 8,
  },
});
