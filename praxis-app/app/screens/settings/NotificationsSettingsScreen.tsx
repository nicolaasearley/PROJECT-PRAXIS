import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/theme';
import { PraxisButton, IconButton, Card, Spacer } from '../../components';
import { useUserStore } from '../../../src/core/store';

type MainStackParamList = {
  Settings: undefined;
};

type NavigationProp = StackNavigationProp<MainStackParamList>;

interface NotificationSettings {
  dailyTrainingReminder: boolean;
  missedWorkoutAlerts: boolean;
  prAchievementAlerts: boolean;
  adaptivePlanAdjustmentAlerts: boolean;
  weeklySummary: boolean;
}

export default function NotificationsSettingsScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { userProfile } = useUserStore();

  // Default notification settings
  const defaultSettings: NotificationSettings = {
    dailyTrainingReminder: true,
    missedWorkoutAlerts: false,
    prAchievementAlerts: true,
    adaptivePlanAdjustmentAlerts: true,
    weeklySummary: true,
  };

  // Initialize state from store or use defaults
  // TODO: Load from useUserStore.notificationSettings when implemented
  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettings>(defaultSettings);

  // Sync with store when it updates (if implemented)
  useEffect(() => {
    // TODO: Load notification settings from useUserStore when available
    // if (userProfile?.notificationSettings) {
    //   setNotificationSettings(userProfile.notificationSettings);
    // }
  }, [userProfile]);

  const handleToggle = (key: keyof NotificationSettings, value: boolean) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = () => {
    // TODO: Save to useUserStore when notification settings are added to store
    try {
      // updateUserProfile({ notificationSettings });
      console.log('Saving notification settings:', notificationSettings);
      navigation.goBack();
    } catch (error) {
      // TODO: Handle error case when store is not implemented
      console.log('Error saving notification settings:', error);
      // For now, still navigate back
      navigation.goBack();
    }
  };

  const renderSwitchRow = (
    label: string,
    value: boolean,
    onValueChange: (value: boolean) => void,
    isLast: boolean = false
  ) => {
    return (
      <View
        style={[
          styles.switchRow,
          {
            paddingVertical: theme.spacing.md,
            borderBottomWidth: isLast ? 0 : 1,
            borderBottomColor: theme.colors.steel,
          },
        ]}
      >
        <Text
          style={[
            styles.switchLabel,
            {
              color: theme.colors.white,
              fontFamily: theme.typography.fonts.body,
              fontSize: theme.typography.sizes.body,
              flex: 1,
            },
          ]}
        >
          {label}
        </Text>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{
            false: theme.colors.graphite,
            true: theme.colors.acidGreen + '80', // Add opacity for track
          }}
          thumbColor={value ? theme.colors.acidGreen : theme.colors.mutedDark}
          ios_backgroundColor={theme.colors.graphite}
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
            Notifications
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
        {/* Notification Toggles */}
        <Card
          variant="elevated"
          padding="lg"
          style={{ marginBottom: theme.spacing.lg }}
        >
          {renderSwitchRow(
            'Daily Training Reminder',
            notificationSettings.dailyTrainingReminder,
            (value) => handleToggle('dailyTrainingReminder', value),
            false
          )}
          {renderSwitchRow(
            'Missed Workout Alerts',
            notificationSettings.missedWorkoutAlerts,
            (value) => handleToggle('missedWorkoutAlerts', value),
            false
          )}
          {renderSwitchRow(
            'PR Achievement Alerts',
            notificationSettings.prAchievementAlerts,
            (value) => handleToggle('prAchievementAlerts', value),
            false
          )}
          {renderSwitchRow(
            'Adaptive Plan Adjustment Alerts',
            notificationSettings.adaptivePlanAdjustmentAlerts,
            (value) => handleToggle('adaptivePlanAdjustmentAlerts', value),
            false
          )}
          {renderSwitchRow(
            'Weekly Summary',
            notificationSettings.weeklySummary,
            (value) => handleToggle('weeklySummary', value),
            true
          )}
        </Card>

        <Spacer size="lg" />
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
        <PraxisButton title="Save Settings" onPress={handleSave} size="large" />

        <Text
          style={[
            styles.permissionsNote,
            {
              color: theme.colors.muted,
              fontFamily: theme.typography.fonts.body,
              fontSize: theme.typography.sizes.bodySmall,
              marginTop: theme.spacing.md,
              textAlign: 'center',
            },
          ]}
        >
          Notification permissions may need to be enabled in your device
          settings.
        </Text>
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabel: {
    fontWeight: '400',
  },
  footer: {
    width: '100%',
  },
  permissionsNote: {
    fontWeight: '400',
  },
});
