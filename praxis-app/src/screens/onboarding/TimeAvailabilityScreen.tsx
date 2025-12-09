import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../../../theme';
import { PraxisButton } from '../../components';
import { useUserStore } from '../../../core/store';
const timeOptions: { label: string; value: number }[] = [
  { label: 'Short (30–40 min)', value: 40 },
  { label: 'Standard (45–60 min)', value: 60 },
  { label: 'Full (75+ min)', value: 90 },
];

export default function TimeAvailabilityScreen() {
  const theme = useTheme();
  const { updatePreferences } = useUserStore();
  const [selectedTime, setSelectedTime] = useState<number | null>(null);

  const handleSelectTime = (time: number) => {
    setSelectedTime(time);
  };

  const handleContinue = () => {
    if (selectedTime) {
      updatePreferences({ timeAvailability: selectedTime });
      router.push('/onboarding/pr-input');
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
          How much time do you have for training?
        </Text>

        <View style={styles.optionsContainer}>
          {timeOptions.map((option) => {
            const isSelected = selectedTime === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                onPress={() => handleSelectTime(option.value)}
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
          disabled={!selectedTime}
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
