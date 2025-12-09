import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../../../theme';

export default function SplashScreen() {
  const theme = useTheme();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/onboarding/welcome');
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.black }]}
      edges={['top', 'bottom']}
    >
      <View style={styles.content}>
        <Text
          style={[
            styles.icon,
            {
              color: theme.colors.white,
              marginBottom: theme.spacing.xxl,
            },
          ]}
        >
          [PRAXIS ICON]
        </Text>
        <Text
          style={[
            styles.title,
            {
              color: theme.colors.white,
              fontFamily: theme.typography.fonts.heading,
              fontSize: theme.typography.sizes.h1,
              marginBottom: theme.spacing.sm,
            },
          ]}
        >
          PROJECT PRAXIS
        </Text>
        <Text
          style={[
            styles.subtitle,
            {
              color: theme.colors.muted,
              fontFamily: theme.typography.fonts.body,
              fontSize: theme.typography.sizes.body,
            },
          ]}
        >
          Performance. Engineered.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 48,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
});
