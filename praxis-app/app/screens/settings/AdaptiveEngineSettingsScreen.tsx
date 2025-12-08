import React, { useState, useEffect } from 'react';
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
import { PraxisButton, IconButton, Card, Spacer } from '../../components';
import { useUserStore } from '../../../src/core/store';
import type { AdaptationMode } from '../../../src/core/types';

type MainStackParamList = {
  Settings: undefined;
};

type NavigationProp = StackNavigationProp<MainStackParamList>;

interface AdaptationModeOption {
  value: AdaptationMode;
  title: string;
  subtitle: string;
}

const adaptationModeOptions: AdaptationModeOption[] = [
  {
    value: 'conservative',
    title: 'Conservative',
    subtitle: 'Small adjustments. Minimal intensity changes.',
  },
  {
    value: 'automatic',
    title: 'Automatic (Recommended)',
    subtitle: 'Balanced adjustments based on readiness scores.',
  },
  {
    value: 'aggressive',
    title: 'Aggressive',
    subtitle: 'Large adjustments. More variation in intensity + volume.',
  },
];

interface AdvancedOption {
  label: string;
  subtext: string;
}

const advancedOptions: AdvancedOption[] = [
  { label: 'Fatigue Modeling', subtext: 'COMING SOON' },
  { label: 'Session Impact Weighting', subtext: 'COMING SOON' },
  { label: 'Microcycle Auto-Rebalancing', subtext: 'COMING SOON' },
];

export default function AdaptiveEngineSettingsScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { userProfile, updatePreferences } = useUserStore();

  // Initialize state from store
  const preferences = userProfile?.preferences;

  const [adaptationMode, setAdaptationMode] = useState<AdaptationMode>(
    preferences?.adaptationMode || 'automatic'
  );
  const [readinessScalingEnabled, setReadinessScalingEnabled] =
    useState<boolean>(preferences?.readinessScalingEnabled ?? true);

  // Sync with store when it updates
  useEffect(() => {
    if (preferences) {
      if (preferences.adaptationMode) {
        setAdaptationMode(preferences.adaptationMode);
      }
      if (preferences.readinessScalingEnabled !== undefined) {
        setReadinessScalingEnabled(preferences.readinessScalingEnabled);
      }
    }
  }, [preferences]);

  const handleSave = () => {
    // TODO: Ensure useUserStore.updatePreferences is fully implemented
    try {
      updatePreferences({
        adaptationMode,
        readinessScalingEnabled,
      });
      navigation.goBack();
    } catch (error) {
      // TODO: Handle error case when store is not implemented
      console.log('Error saving adaptive engine settings:', error);
      // For now, still navigate back
      navigation.goBack();
    }
  };

  const renderAdaptationModeCard = (
    option: AdaptationModeOption,
    isSelected: boolean
  ) => {
    return (
      <TouchableOpacity
        key={option.value}
        onPress={() => setAdaptationMode(option.value)}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.modeCard,
            {
              backgroundColor: isSelected
                ? theme.colors.acidGreen
                : theme.colors.graphite,
              borderWidth: isSelected ? 0 : 2,
              borderColor: isSelected
                ? theme.colors.transparent
                : theme.colors.steel,
              borderRadius: theme.radius.lg,
              padding: theme.spacing.lg,
              marginBottom: theme.spacing.md,
            },
          ]}
        >
          <Text
            style={[
              styles.modeTitle,
              {
                color: isSelected ? theme.colors.black : theme.colors.white,
                fontFamily: theme.typography.fonts.headingMedium,
                fontSize: theme.typography.sizes.body,
                marginBottom: theme.spacing.xs,
              },
            ]}
          >
            {option.title}
          </Text>
          <Text
            style={[
              styles.modeSubtitle,
              {
                color: isSelected ? theme.colors.black : theme.colors.muted,
                fontFamily: theme.typography.fonts.body,
                fontSize: theme.typography.sizes.bodySmall,
              },
            ]}
          >
            {option.subtitle}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderDisabledRow = (option: AdvancedOption) => {
    return (
      <View
        key={option.label}
        style={[
          styles.disabledRow,
          {
            paddingVertical: theme.spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.steel,
            opacity: 0.4,
          },
        ]}
      >
        <View style={styles.disabledRowContent}>
          <Text
            style={[
              styles.disabledLabel,
              {
                color: theme.colors.white,
                fontFamily: theme.typography.fonts.body,
                fontSize: theme.typography.sizes.body,
              },
            ]}
          >
            {option.label}
          </Text>
          <Text
            style={[
              styles.disabledSubtext,
              {
                color: theme.colors.muted,
                fontFamily: theme.typography.fonts.body,
                fontSize: theme.typography.sizes.bodySmall,
                marginTop: theme.spacing.xs,
              },
            ]}
          >
            {option.subtext}
          </Text>
        </View>
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
            Adaptive Engine
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
        {/* Adaptation Mode Section */}
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
            Adaptation Mode
          </Text>

          {adaptationModeOptions.map((option) =>
            renderAdaptationModeCard(option, adaptationMode === option.value)
          )}
        </Card>

        {/* Readiness Scaling Section */}
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
            Readiness Scaling
          </Text>

          <Text
            style={[
              styles.descriptionText,
              {
                color: theme.colors.muted,
                fontFamily: theme.typography.fonts.body,
                fontSize: theme.typography.sizes.bodySmall,
                marginBottom: theme.spacing.lg,
              },
            ]}
          >
            When enabled, your daily readiness score influences training
            intensity and volume.
          </Text>

          <View
            style={[
              styles.switchRow,
              {
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              },
            ]}
          >
            <View style={{ flex: 1 }} />
            <Switch
              value={readinessScalingEnabled}
              onValueChange={setReadinessScalingEnabled}
              trackColor={{
                false: theme.colors.graphite,
                true: theme.colors.acidGreen + '80', // Reduced opacity
              }}
              thumbColor={
                readinessScalingEnabled
                  ? theme.colors.acidGreen
                  : theme.colors.mutedDark
              }
              ios_backgroundColor={theme.colors.graphite}
            />
          </View>
        </Card>

        {/* Advanced Controls Section */}
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
            Advanced Controls
          </Text>

          {advancedOptions.map((option, index) => (
            <View key={option.label}>{renderDisabledRow(option)}</View>
          ))}
        </Card>

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
        <PraxisButton title="Save Settings" onPress={handleSave} size="large" />
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
  sectionTitle: {
    fontWeight: '600',
  },
  modeCard: {
    // Styled inline
  },
  modeTitle: {
    fontWeight: '600',
  },
  modeSubtitle: {
    fontWeight: '400',
  },
  descriptionText: {
    fontWeight: '400',
    lineHeight: 20,
  },
  switchRow: {
    // Styled inline
  },
  disabledRow: {
    // Styled inline
  },
  disabledRowContent: {
    width: '100%',
  },
  disabledLabel: {
    fontWeight: '400',
  },
  disabledSubtext: {
    fontWeight: '400',
  },
  footer: {
    width: '100%',
  },
});
