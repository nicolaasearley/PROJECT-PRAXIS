import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/theme';
import { PraxisButton, IconButton, Spacer } from '../../components';
import { useUserStore } from '../../../src/core/store';
import type {
  TrainingGoal,
  ExperienceLevel,
  TimeAvailability,
} from '../../../src/core/types';

type MainStackParamList = {
  Settings: undefined;
};

type NavigationProp = StackNavigationProp<MainStackParamList>;

const goalOptions: { label: string; value: TrainingGoal }[] = [
  { label: 'Build Strength', value: 'strength' },
  { label: 'Improve Conditioning', value: 'conditioning' },
  { label: 'Hybrid Performance', value: 'hybrid' },
  { label: 'General Fitness', value: 'general' },
];

const experienceOptions: { label: string; value: ExperienceLevel }[] = [
  { label: 'Beginner', value: 'beginner' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced', value: 'advanced' },
];

const daysOptions = [3, 4, 5, 6, 7];

const timeOptions: { label: string; value: TimeAvailability }[] = [
  { label: 'Short (30–40 min)', value: 'short' },
  { label: 'Standard (45–60 min)', value: 'standard' },
  { label: 'Full (75+ min)', value: 'full' },
];

export default function PreferencesSettingsScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { userProfile, updatePreferences } = useUserStore();

  // Initialize state from store or use defaults
  const preferences = userProfile?.preferences;

  const [goal, setGoal] = useState<TrainingGoal>(
    preferences?.goal || 'general'
  );
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(
    preferences?.experienceLevel || 'beginner'
  );
  const [trainingDaysPerWeek, setTrainingDaysPerWeek] = useState<number>(
    preferences?.trainingDaysPerWeek || 3
  );
  const [timeAvailability, setTimeAvailability] = useState<TimeAvailability>(
    preferences?.timeAvailability || 'standard'
  );

  // Sync with store when it updates
  useEffect(() => {
    if (preferences) {
      if (preferences.goal) setGoal(preferences.goal);
      if (preferences.experienceLevel)
        setExperienceLevel(preferences.experienceLevel);
      if (preferences.trainingDaysPerWeek)
        setTrainingDaysPerWeek(preferences.trainingDaysPerWeek);
      if (preferences.timeAvailability)
        setTimeAvailability(preferences.timeAvailability);
    }
  }, [preferences]);

  const handleSave = () => {
    // TODO: Ensure useUserStore.updatePreferences is fully implemented
    try {
      updatePreferences({
        goal,
        experienceLevel,
        trainingDaysPerWeek,
        timeAvailability,
      });
      navigation.goBack();
    } catch (error) {
      // TODO: Handle error case when store is not implemented
      console.log('Error saving preferences:', error);
      // For now, still navigate back
      navigation.goBack();
    }
  };

  const renderSelectableCard = (
    label: string,
    value: string,
    isSelected: boolean,
    onPress: () => void
  ) => {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
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
                color: isSelected ? theme.colors.black : theme.colors.white,
                fontFamily: theme.typography.fonts.bodyMedium,
                fontSize: theme.typography.sizes.body,
              },
            ]}
          >
            {label}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderPillButton = (
    value: number,
    isSelected: boolean,
    onPress: () => void
  ) => {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
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
              marginRight: theme.spacing.md,
              marginBottom: theme.spacing.md,
            },
          ]}
        >
          <Text
            style={[
              styles.pillText,
              {
                color: isSelected ? theme.colors.black : theme.colors.white,
                fontFamily: theme.typography.fonts.bodyMedium,
                fontSize: theme.typography.sizes.h3,
              },
            ]}
          >
            {value}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.carbon }]}
      edges={['top']}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.steel,
          },
        ]}
      >
        <IconButton
          icon={
            <Ionicons name="arrow-back" size={24} color={theme.colors.white} />
          }
          onPress={() => navigation.goBack()}
          variant="ghost"
          size="medium"
        />
        <View style={styles.headerContent}>
          <Text
            style={[
              styles.headerTitle,
              {
                color: theme.colors.white,
                fontFamily: theme.typography.fonts.headingMedium,
                fontSize: theme.typography.sizes.h2,
              },
            ]}
          >
            Training Preferences
          </Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { padding: theme.spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Goal Selection */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: theme.colors.white,
                fontFamily: theme.typography.fonts.headingMedium,
                fontSize: theme.typography.sizes.h3,
                marginBottom: theme.spacing.lg,
              },
            ]}
          >
            Primary Goal
          </Text>

          {goalOptions.map((option) =>
            renderSelectableCard(
              option.label,
              option.value,
              goal === option.value,
              () => setGoal(option.value)
            )
          )}
        </View>

        <Spacer size="xl" />

        {/* Experience Level */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: theme.colors.white,
                fontFamily: theme.typography.fonts.headingMedium,
                fontSize: theme.typography.sizes.h3,
                marginBottom: theme.spacing.lg,
              },
            ]}
          >
            Experience Level
          </Text>

          {experienceOptions.map((option) =>
            renderSelectableCard(
              option.label,
              option.value,
              experienceLevel === option.value,
              () => setExperienceLevel(option.value)
            )
          )}
        </View>

        <Spacer size="xl" />

        {/* Training Days Per Week */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: theme.colors.white,
                fontFamily: theme.typography.fonts.headingMedium,
                fontSize: theme.typography.sizes.h3,
                marginBottom: theme.spacing.lg,
              },
            ]}
          >
            Training Frequency
          </Text>

          <View style={styles.pillsContainer}>
            {daysOptions.map((days) =>
              renderPillButton(days, trainingDaysPerWeek === days, () =>
                setTrainingDaysPerWeek(days)
              )
            )}
          </View>
        </View>

        <Spacer size="xl" />

        {/* Time Availability */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: theme.colors.white,
                fontFamily: theme.typography.fonts.headingMedium,
                fontSize: theme.typography.sizes.h3,
                marginBottom: theme.spacing.lg,
              },
            ]}
          >
            Time Availability
          </Text>

          {timeOptions.map((option) =>
            renderSelectableCard(
              option.label,
              option.value,
              timeAvailability === option.value,
              () => setTimeAvailability(option.value)
            )
          )}
        </View>

        <Spacer size="xl" />
      </ScrollView>

      {/* Save Button */}
      <View
        style={[
          styles.footer,
          {
            padding: theme.spacing.lg,
            borderTopWidth: 1,
            borderTopColor: theme.colors.steel,
          },
        ]}
      >
        <PraxisButton
          title="Save Preferences"
          onPress={handleSave}
          size="large"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  section: {
    width: '100%',
  },
  sectionTitle: {
    fontWeight: '600',
  },
  optionCard: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    fontWeight: '500',
    textAlign: 'center',
  },
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  pillButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  pillText: {
    fontWeight: '600',
  },
  footer: {
    width: '100%',
  },
});
