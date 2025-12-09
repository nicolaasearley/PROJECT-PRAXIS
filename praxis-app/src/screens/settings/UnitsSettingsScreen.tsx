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
import { useTheme } from '@/theme';
import { PraxisButton, IconButton, Card, Spacer } from '@/components';
import { useUserStore } from '@/core/store';
import type { DistanceUnit } from '@/core/types';

type MainStackParamList = {
  Settings: undefined;
};

type NavigationProp = StackNavigationProp<MainStackParamList>;

type WeightUnit = 'imperial' | 'metric';
interface WeightOption {
  label: string;
  value: WeightUnit;
}

interface DistanceOption {
  label: string;
  value: DistanceUnit;
}

const weightOptions: WeightOption[] = [
  { label: 'Pounds (lb)', value: 'imperial' },
  { label: 'Kilograms (kg)', value: 'metric' },
];

const distanceOptions: DistanceOption[] = [
  { label: 'Kilometers', value: 'kilometers' },
  { label: 'Miles', value: 'miles' },
];

export default function UnitsSettingsScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { userProfile, updateUserProfile, setDistanceUnits } = useUserStore();

  // Initialize state from store
  const currentUnits = userProfile?.units || 'imperial'; // TODO: Handle if store not implemented

  // Derive distance unit from units or default to kilometers
  // TODO: Replace with userProfile.distanceUnits when added to store
  const currentDistanceUnit: DistanceUnit =
    userProfile?.distanceUnits ||
    (currentUnits === 'imperial' ? 'miles' : 'kilometers');

  const [weightUnit, setWeightUnit] = useState<WeightUnit>(currentUnits);
  const [distanceUnit, setDistanceUnit] =
    useState<DistanceUnit>(currentDistanceUnit);

  // Sync with store when it updates
  useEffect(() => {
    if (userProfile?.units) {
      setWeightUnit(userProfile.units);
    }
    if (userProfile?.distanceUnits) {
      setDistanceUnit(userProfile.distanceUnits);
    } else if (userProfile?.units) {
      setDistanceUnit(
        userProfile.units === 'imperial' ? 'miles' : 'kilometers'
      );
    }
  }, [userProfile]);

  const handleSave = () => {
    // TODO: Ensure useUserStore.updateUserProfile supports distanceUnits
    try {
      updateUserProfile({ units: weightUnit, distanceUnits: distanceUnit });
      setDistanceUnits(distanceUnit);
      navigation.goBack();
    } catch (error) {
      // TODO: Handle error case when store is not implemented
      console.log('Error saving unit preferences:', error);
      // For now, still navigate back
      navigation.goBack();
    }
  };

  const renderUnitRow = (
    label: string,
    value: WeightUnit | DistanceUnit,
    isSelected: boolean,
    onPress: () => void
  ) => {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={[
          styles.unitRow,
          {
            paddingVertical: theme.spacing.lg,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.steel,
            borderLeftWidth: isSelected ? 3 : 0,
            borderLeftColor: isSelected
              ? theme.colors.acidGreen
              : 'transparent',
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
          {label}
        </Text>
        <View
          style={[
            styles.radioIndicator,
            {
              width: 24,
              height: 24,
              borderRadius: 12,
              borderWidth: isSelected ? 0 : 2,
              borderColor: isSelected
                ? theme.colors.transparent
                : theme.colors.mutedDark,
              backgroundColor: isSelected
                ? theme.colors.acidGreen
                : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            },
          ]}
        >
          {isSelected && (
            <View
              style={[
                styles.radioInner,
                {
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: theme.colors.black,
                },
              ]}
            />
          )}
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
            Units & Measurement
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
        {/* Weight Units Section */}
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
            Weight Units
          </Text>

          {weightOptions.map((option, index) => (
            <View key={option.value}>
              {renderUnitRow(
                option.label,
                option.value,
                weightUnit === option.value,
                () => setWeightUnit(option.value)
              )}
            </View>
          ))}
        </Card>

        {/* Distance Units Section */}
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
            Distance Units
          </Text>

          {distanceOptions.map((option, index) => (
            <View key={option.value}>
              {renderUnitRow(
                option.label,
                option.value,
                distanceUnit === option.value,
                () => setDistanceUnit(option.value)
              )}
            </View>
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
        <PraxisButton title="Save Units" onPress={handleSave} size="large" />
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
  unitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
  },
  rowLabel: {
    fontWeight: '400',
    flex: 1,
  },
  radioIndicator: {
    // Styled inline
  },
  radioInner: {
    // Styled inline - inner dot for selected state
  },
  footer: {
    width: '100%',
  },
});
