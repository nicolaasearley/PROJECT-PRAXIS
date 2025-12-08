import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/theme';
import { Card, PraxisButton, Spacer } from '../../components';
import { useUserStore } from '../../../src/core/store';
import type {
  TrainingGoal,
  ExperienceLevel,
  TimeAvailability,
  AdaptationMode,
} from '../../../src/core/types';

type MainStackParamList = {
  Preferences: undefined;
  EquipmentSettings: undefined;
  EditProfile: undefined;
};

type NavigationProp = StackNavigationProp<MainStackParamList>;

// Helper functions to format display values
const formatGoal = (goal: TrainingGoal): string => {
  const goalMap: Record<TrainingGoal, string> = {
    strength: 'Build Strength',
    conditioning: 'Improve Conditioning',
    hybrid: 'Hybrid Performance',
    general: 'General Fitness',
  };
  return goalMap[goal] || goal;
};

const formatExperience = (level: ExperienceLevel): string => {
  const expMap: Record<ExperienceLevel, string> = {
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
  };
  return expMap[level] || level;
};

const formatTimeAvailability = (time: TimeAvailability): string => {
  const timeMap: Record<TimeAvailability, string> = {
    short: 'Short (30–40 min)',
    standard: 'Standard (45–60 min)',
    full: 'Full (75+ min)',
  };
  return timeMap[time] || time;
};

const formatAdaptationMode = (mode: AdaptationMode): string => {
  const modeMap: Record<AdaptationMode, string> = {
    conservative: 'Conservative',
    automatic: 'Automatic (Recommended)',
    aggressive: 'Aggressive',
  };
  return modeMap[mode] || mode;
};

const equipmentList = [
  { id: 'barbell', name: 'Barbell & Plates' },
  { id: 'dumbbell', name: 'Dumbbells' },
  { id: 'kettlebell', name: 'Kettlebells' },
  { id: 'rower', name: 'Rower' },
  { id: 'bike', name: 'Bike' },
  { id: 'ski_erg', name: 'Ski Erg' },
  { id: 'sled', name: 'Sled' },
  { id: 'medicine_ball', name: 'Medicine Ball' },
  { id: 'pullup_bar', name: 'Pull-up Bar' },
];

export default function SettingsScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { userProfile } = useUserStore();

  // TODO: Replace with persistent storage
  const [notificationSettings, setNotificationSettings] = useState({
    dailyReminder: true,
    missedWorkoutAlerts: true,
    prAlerts: true,
    adaptivePlanAlerts: true,
    weeklySummary: false,
  });

  // Get values from store or use mock
  const preferences = userProfile?.preferences;
  const units = userProfile?.units || 'imperial'; // TODO: Default from store
  const selectedEquipmentIds = preferences?.equipmentIds || []; // TODO: Get from store

  // Mock profile data if not available
  const profileName = userProfile?.name || 'John Doe'; // TODO: Remove mock
  const profileEmail = userProfile?.email || 'john@example.com'; // TODO: Remove mock
  const profileDob = userProfile?.dob || undefined;

  const handleEditProfile = () => {
    // TODO: Navigate to EditProfile screen when implemented
    navigation.navigate('EditProfile');
  };

  const handlePreferencesPress = () => {
    navigation.navigate('Preferences');
  };

  const handleEquipmentPress = () => {
    navigation.navigate('EquipmentSettings');
  };

  const renderSettingsRow = (
    label: string,
    value: string,
    onPress?: () => void
  ) => {
    return (
      <TouchableOpacity
        style={[
          styles.settingsRow,
          {
            paddingVertical: theme.spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.steel,
          },
        ]}
        onPress={onPress}
        disabled={!onPress}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.rowLabel,
            {
              color: theme.colors.white,
              fontFamily: theme.typography.fonts.bodyMedium,
              fontSize: theme.typography.sizes.body,
            },
          ]}
        >
          {label}
        </Text>
        <View style={styles.rowRight}>
          <Text
            style={[
              styles.rowValue,
              {
                color: theme.colors.muted,
                fontFamily: theme.typography.fonts.body,
                fontSize: theme.typography.sizes.body,
                marginRight: theme.spacing.sm,
              },
            ]}
          >
            {value}
          </Text>
          {onPress && (
            <Ionicons
              name="chevron-forward"
              size={20}
              color={theme.colors.muted}
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderSwitchRow = (
    label: string,
    value: boolean,
    onValueChange: (value: boolean) => void
  ) => {
    return (
      <View
        style={[
          styles.settingsRow,
          {
            paddingVertical: theme.spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.steel,
          },
        ]}
      >
        <Text
          style={[
            styles.rowLabel,
            {
              color: theme.colors.white,
              fontFamily: theme.typography.fonts.bodyMedium,
              fontSize: theme.typography.sizes.body,
            },
          ]}
        >
          {label}
        </Text>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{
            false: theme.colors.steel,
            true: theme.colors.acidGreen,
          }}
          thumbColor={theme.colors.white}
          ios_backgroundColor={theme.colors.steel}
        />
      </View>
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
          Settings
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { padding: theme.spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <Card
          variant="elevated"
          padding="lg"
          style={{ marginBottom: theme.spacing.lg }}
        >
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
            Profile
          </Text>

          <View style={styles.profileInfo}>
            <Text
              style={[
                styles.profileLabel,
                {
                  color: theme.colors.muted,
                  fontFamily: theme.typography.fonts.bodyMedium,
                  fontSize: theme.typography.sizes.bodySmall,
                  marginBottom: theme.spacing.xs,
                },
              ]}
            >
              Name
            </Text>
            <Text
              style={[
                styles.profileValue,
                {
                  color: theme.colors.white,
                  fontFamily: theme.typography.fonts.body,
                  fontSize: theme.typography.sizes.body,
                  marginBottom: theme.spacing.md,
                },
              ]}
            >
              {profileName}
            </Text>

            <Text
              style={[
                styles.profileLabel,
                {
                  color: theme.colors.muted,
                  fontFamily: theme.typography.fonts.bodyMedium,
                  fontSize: theme.typography.sizes.bodySmall,
                  marginBottom: theme.spacing.xs,
                },
              ]}
            >
              Email
            </Text>
            <Text
              style={[
                styles.profileValue,
                {
                  color: theme.colors.white,
                  fontFamily: theme.typography.fonts.body,
                  fontSize: theme.typography.sizes.body,
                  marginBottom: theme.spacing.md,
                },
              ]}
            >
              {profileEmail}
            </Text>

            {profileDob && (
              <>
                <Text
                  style={[
                    styles.profileLabel,
                    {
                      color: theme.colors.muted,
                      fontFamily: theme.typography.fonts.bodyMedium,
                      fontSize: theme.typography.sizes.bodySmall,
                      marginBottom: theme.spacing.xs,
                    },
                  ]}
                >
                  Date of Birth
                </Text>
                <Text
                  style={[
                    styles.profileValue,
                    {
                      color: theme.colors.white,
                      fontFamily: theme.typography.fonts.body,
                      fontSize: theme.typography.sizes.body,
                      marginBottom: theme.spacing.md,
                    },
                  ]}
                >
                  {profileDob}
                </Text>
              </>
            )}
          </View>

          <View style={{ marginTop: theme.spacing.lg }}>
            <PraxisButton
              title="Edit Profile"
              onPress={handleEditProfile}
              variant="outline"
              size="medium"
            />
          </View>
        </Card>

        {/* Training Preferences Section */}
        <Card
          variant="elevated"
          padding="lg"
          style={{ marginBottom: theme.spacing.lg }}
        >
          <Text
            style={[
              styles.sectionTitle,
              {
                color: theme.colors.white,
                fontFamily: theme.typography.fonts.headingMedium,
                fontSize: theme.typography.sizes.h3,
                marginBottom: theme.spacing.md,
              },
            ]}
          >
            Training Preferences
          </Text>

          {renderSettingsRow(
            'Goal',
            preferences ? formatGoal(preferences.goal) : 'Not Set',
            handlePreferencesPress
          )}
          {renderSettingsRow(
            'Experience Level',
            preferences
              ? formatExperience(preferences.experienceLevel)
              : 'Not Set',
            handlePreferencesPress
          )}
          {renderSettingsRow(
            'Training Days per Week',
            preferences ? `${preferences.trainingDaysPerWeek} days` : 'Not Set',
            handlePreferencesPress
          )}
          {renderSettingsRow(
            'Time Availability',
            preferences
              ? formatTimeAvailability(preferences.timeAvailability)
              : 'Not Set',
            handlePreferencesPress
          )}
        </Card>

        {/* Equipment Section */}
        <Card
          variant="elevated"
          padding="lg"
          style={{ marginBottom: theme.spacing.lg }}
        >
          <Text
            style={[
              styles.sectionTitle,
              {
                color: theme.colors.white,
                fontFamily: theme.typography.fonts.headingMedium,
                fontSize: theme.typography.sizes.h3,
                marginBottom: theme.spacing.md,
              },
            ]}
          >
            Equipment
          </Text>

          <TouchableOpacity
            onPress={handleEquipmentPress}
            activeOpacity={0.7}
            style={styles.equipmentList}
          >
            {equipmentList.map((equipment, index) => {
              const isSelected = selectedEquipmentIds.includes(equipment.id);
              return (
                <View
                  key={equipment.id}
                  style={[
                    styles.equipmentRow,
                    {
                      paddingVertical: theme.spacing.md,
                      borderBottomWidth:
                        index < equipmentList.length - 1 ? 1 : 0,
                      borderBottomColor: theme.colors.steel,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.rowLabel,
                      {
                        color: theme.colors.white,
                        fontFamily: theme.typography.fonts.body,
                        fontSize: theme.typography.sizes.body,
                      },
                    ]}
                  >
                    {equipment.name}
                  </Text>
                  {isSelected ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={theme.colors.acidGreen}
                    />
                  ) : (
                    <Ionicons
                      name="ellipse-outline"
                      size={24}
                      color={theme.colors.steel}
                    />
                  )}
                </View>
              );
            })}
          </TouchableOpacity>
        </Card>

        {/* Units & Measurement Section */}
        <Card
          variant="elevated"
          padding="lg"
          style={{ marginBottom: theme.spacing.lg }}
        >
          <Text
            style={[
              styles.sectionTitle,
              {
                color: theme.colors.white,
                fontFamily: theme.typography.fonts.headingMedium,
                fontSize: theme.typography.sizes.h3,
                marginBottom: theme.spacing.md,
              },
            ]}
          >
            Units
          </Text>

          {renderSettingsRow(
            'Weight',
            units === 'imperial' ? 'Pounds (lb)' : 'Kilograms (kg)'
          )}
          {renderSettingsRow(
            'Distance',
            units === 'imperial' ? 'Miles' : 'Kilometers'
          )}
        </Card>

        {/* Notifications Section */}
        <Card
          variant="elevated"
          padding="lg"
          style={{ marginBottom: theme.spacing.lg }}
        >
          <Text
            style={[
              styles.sectionTitle,
              {
                color: theme.colors.white,
                fontFamily: theme.typography.fonts.headingMedium,
                fontSize: theme.typography.sizes.h3,
                marginBottom: theme.spacing.md,
              },
            ]}
          >
            Notifications
          </Text>

          {renderSwitchRow(
            'Daily Training Reminder',
            notificationSettings.dailyReminder,
            (value) => {
              setNotificationSettings((prev) => ({
                ...prev,
                dailyReminder: value,
              }));
              // TODO: Save to persistent storage
            }
          )}
          {renderSwitchRow(
            'Missed Workout Alerts',
            notificationSettings.missedWorkoutAlerts,
            (value) => {
              setNotificationSettings((prev) => ({
                ...prev,
                missedWorkoutAlerts: value,
              }));
              // TODO: Save to persistent storage
            }
          )}
          {renderSwitchRow(
            'PR Alerts',
            notificationSettings.prAlerts,
            (value) => {
              setNotificationSettings((prev) => ({
                ...prev,
                prAlerts: value,
              }));
              // TODO: Save to persistent storage
            }
          )}
          {renderSwitchRow(
            'Adaptive Plan Adjustment Alerts',
            notificationSettings.adaptivePlanAlerts,
            (value) => {
              setNotificationSettings((prev) => ({
                ...prev,
                adaptivePlanAlerts: value,
              }));
              // TODO: Save to persistent storage
            }
          )}
          {renderSwitchRow(
            'Weekly Summary',
            notificationSettings.weeklySummary,
            (value) => {
              setNotificationSettings((prev) => ({
                ...prev,
                weeklySummary: value,
              }));
              // TODO: Save to persistent storage
            }
          )}
        </Card>

        {/* Adaptive Engine Settings Section */}
        <Card
          variant="elevated"
          padding="lg"
          style={{ marginBottom: theme.spacing.lg }}
        >
          <Text
            style={[
              styles.sectionTitle,
              {
                color: theme.colors.white,
                fontFamily: theme.typography.fonts.headingMedium,
                fontSize: theme.typography.sizes.h3,
                marginBottom: theme.spacing.md,
              },
            ]}
          >
            Adaptive Engine
          </Text>

          {renderSettingsRow(
            'Adaptation Mode',
            preferences
              ? formatAdaptationMode(preferences.adaptationMode)
              : 'Automatic (Recommended)'
          )}

          {renderSwitchRow(
            'Readiness Scaling',
            preferences?.readinessScalingEnabled ?? true,
            (value) => {
              // TODO: Update in useUserStore
            }
          )}
        </Card>

        {/* Health Integrations Section */}
        <Card
          variant="elevated"
          padding="lg"
          style={{ marginBottom: theme.spacing.lg }}
        >
          <Text
            style={[
              styles.sectionTitle,
              {
                color: theme.colors.white,
                fontFamily: theme.typography.fonts.headingMedium,
                fontSize: theme.typography.sizes.h3,
                marginBottom: theme.spacing.md,
              },
            ]}
          >
            Integrations
          </Text>

          {renderSettingsRow('Apple Health', 'Not Connected')}
          {renderSettingsRow('Heart Rate Data', 'Not Connected')}
          {renderSettingsRow('Sleep Data', 'Not Connected')}
          {renderSettingsRow('Activity', 'Not Connected')}
        </Card>

        <Spacer size="lg" />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
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
  sectionTitle: {
    fontWeight: '600',
  },
  profileInfo: {
    width: '100%',
  },
  profileLabel: {
    fontWeight: '500',
  },
  profileValue: {
    fontWeight: '400',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLabel: {
    fontWeight: '500',
    flex: 1,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowValue: {
    fontWeight: '400',
  },
  equipmentList: {
    width: '100%',
  },
  equipmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
