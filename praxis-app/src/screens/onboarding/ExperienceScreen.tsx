import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../../../theme';
import { PraxisButton } from '../../components';
import { useUserStore } from '../../../core/store';
import type { ExperienceLevel } from '../../../core/types';

const experienceOptions: { label: string; value: ExperienceLevel }[] = [
  { label: 'Beginner', value: 'beginner' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced', value: 'advanced' },
];

export default function ExperienceScreen() {
  const theme = useTheme();
  const { updatePreferences } = useUserStore();
  const [selectedExperience, setSelectedExperience] =
    useState<ExperienceLevel | null>(null);

  const handleSelectExperience = (experience: ExperienceLevel) => {
    setSelectedExperience(experience);
  };

  const handleContinue = () => {
    if (selectedExperience) {
      updatePreferences({ experience: selectedExperience });
      router.push('/onboarding/time-availability');
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.carbon }]}
      edges={['top', 'bottom']}
    >
      <View
        style={[
          styles.content,
          {
            paddingHorizontal: theme.spacing.xl,
            paddingTop: theme.spacing.xxxl,
          },
        ]}
      >
        <Text
          style={[
            styles.title,
            {
              color: theme.colors.white,
              fontFamily: theme.typography.fonts.heading,
              fontSize: theme.typography.sizes.h2,
              marginBottom: theme.spacing.xxxl,
            },
          ]}
        >
          What is your training experience level?
        </Text>

        <View style={styles.optionsContainer}>
          {experienceOptions.map((option) => {
            const isSelected = selectedExperience === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                onPress={() => handleSelectExperience(option.value)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.optionCard,
                    {
                      backgroundColor: isSelected
                        ? theme.colors.acidGreen
                        : theme.colors.graphite,
                      borderWidth: isSelected ? 0 : 1,
                      borderColor: isSelected
                        ? theme.colors.transparent
                        : theme.colors.steel,
                      borderRadius: theme.radius.md,
                      paddingVertical: theme.spacing.xl,
                      paddingHorizontal: theme.spacing.xl,
                      marginBottom: theme.spacing.md,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      {
                        color: isSelected
                          ? theme.colors.black
                          : theme.colors.white,
                        fontFamily: theme.typography.fonts.bodyMedium,
                        fontSize: theme.typography.sizes.body,
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={[styles.buttonContainer, { padding: theme.spacing.lg }]}>
        <PraxisButton
          title="Continue"
          onPress={handleContinue}
          size="large"
          disabled={!selectedExperience}
        />
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
  },
  title: {
    textAlign: 'center',
  },
  optionsContainer: {
    flex: 1,
  },
  optionCard: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    fontWeight: '500',
  },
  buttonContainer: {
    width: '100%',
  },
});
