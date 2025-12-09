import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../../../theme';
import { useUserStore, usePlanStore } from '../../../core/store';
import { generateInitialPlan } from '../../../core/engine';
import dayjs from 'dayjs';

export default function GeneratingPlanScreen() {
  const theme = useTheme();
  const { userProfile } = useUserStore();
  const { setPlanDays } = usePlanStore();

  useEffect(() => {
    const generateAndNavigate = async () => {
      try {
        if (!userProfile) {
          // If no user profile, navigate anyway (shouldn't happen in normal flow)
          setTimeout(() => {
            router.replace('/home');
          }, 2000);
          return;
        }

        // Get today's date in yyyy-mm-dd format
        const startDate = dayjs().format('YYYY-MM-DD');

        // TODO: Remove mock when generateInitialPlan is implemented
        // For now, mock the call with setTimeout since engine is not implemented
        setTimeout(async () => {
          try {
            const planDays = generateInitialPlan(userProfile, startDate);
            setPlanDays(planDays);
          } catch (error) {
            // Engine not implemented yet, continue with empty plan
            console.log('Plan generation not yet implemented, continuing...');
          }

          // Navigate to Home screen
          router.replace('/home');
        }, 2000); // 2 second delay for loading animation
      } catch (error) {
        console.error('Error generating plan:', error);
        // Navigate anyway after delay
        setTimeout(() => {
          router.replace('/home');
        }, 2000);
      }
    };

    generateAndNavigate();
  }, [userProfile, setPlanDays]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.black }]}
      edges={['top', 'bottom']}
    >
      <View style={[styles.content, { paddingHorizontal: theme.spacing.xl }]}>
        <View
          style={[styles.logoContainer, { marginBottom: theme.spacing.xxl }]}
        >
          <Text
            style={[
              styles.logo,
              {
                color: theme.colors.acidGreen,
                fontSize: 64,
              },
            ]}
          >
            [PRAXIS ICON]
          </Text>
        </View>

        <ActivityIndicator
          size="large"
          color={theme.colors.acidGreen}
          style={{ marginBottom: theme.spacing.xl }}
        />

        <Text
          style={[
            styles.title,
            {
              color: theme.colors.white,
              fontFamily: theme.typography.fonts.heading,
              fontSize: theme.typography.sizes.h2,
              marginBottom: theme.spacing.md,
            },
          ]}
        >
          Building Your Training Plan…
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
          This may take a moment.
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
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    fontWeight: 'bold',
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
});
