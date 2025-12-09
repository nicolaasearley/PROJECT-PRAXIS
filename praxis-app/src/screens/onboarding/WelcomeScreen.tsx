import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../../../theme';
import { PraxisButton } from '../../components';
import { trackEvent, trackScreen } from '../../../core/analytics';

type AuthStackParamList = {
  Goal: undefined;
};

type NavigationProp = StackNavigationProp<AuthStackParamList>;

export default function WelcomeScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    trackScreen('onboarding_welcome');
    trackEvent('onboarding_step_viewed', { step: 'welcome', position: 1 });
  }, []);

  const handleContinue = () => {
    navigation.navigate('Goal');
    trackEvent('onboarding_step_completed', { step: 'welcome', position: 1 });
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.carbon }]}
      edges={['top', 'bottom']}
    >
      <View style={[styles.content, { paddingHorizontal: theme.spacing.xl }]}>
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
            styles.heading,
            {
              color: theme.colors.white,
              fontFamily: theme.typography.fonts.heading,
              fontSize: theme.typography.sizes.h1,
              marginBottom: theme.spacing.md,
            },
          ]}
        >
          Welcome to PROJECT PRAXIS
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
          The adaptive training engine built for hybrid athletes.
        </Text>
      </View>

      <View style={[styles.buttonContainer, { padding: theme.spacing.lg }]}>
        <PraxisButton title="Continue" onPress={handleContinue} size="large" />
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
  heading: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
  },
});
