import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../../../theme';
import { PraxisButton } from '../../components';
import { useUserStore } from '../../../core/store';

const daysOptions = [3, 4, 5, 6, 7];

export default function DaysPerWeekScreen() {
  const theme = useTheme();
  const { updatePreferences } = useUserStore();
  const [selectedDays, setSelectedDays] = useState<number | null>(null);

  const handleSelectDays = (days: number) => {
    setSelectedDays(days);
  };

  const handleContinue = () => {
    if (selectedDays !== null) {
      updatePreferences({ trainingDays: selectedDays });
      router.push('/onboarding/equipment');
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
          How many days per week can you train?
        </Text>

        <View style={styles.optionsContainer}>
          {daysOptions.map((days) => {
            const isSelected = selectedDays === days;
            return (
              <TouchableOpacity
                key={days}
                onPress={() => handleSelectDays(days)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.pillButton,
                    {
                      backgroundColor: isSelected
                        ? theme.colors.acidGreen
                        : theme.colors.graphite,
                      borderWidth: isSelected ? 0 : 1,
                      borderColor: isSelected
                        ? theme.colors.transparent
                        : theme.colors.steel,
                      borderRadius: theme.radius.pill,
                      paddingVertical: theme.spacing.md,
                      paddingHorizontal: theme.spacing.xl,
                      marginBottom: theme.spacing.md,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.pillText,
                      {
                        color: isSelected
                          ? theme.colors.black
                          : theme.colors.white,
                        fontFamily: theme.typography.fonts.bodyMedium,
                        fontSize: theme.typography.sizes.h3,
                      },
                    ]}
                  >
                    {days}
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
          disabled={selectedDays === null}
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
    alignItems: 'center',
  },
  pillButton: {
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: {
    fontWeight: '600',
  },
  buttonContainer: {
    width: '100%',
  },
});
