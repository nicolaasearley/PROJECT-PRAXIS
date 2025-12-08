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
import { PraxisButton, IconButton } from '../../components';
import { useUserStore } from '../../../src/core/store';

type MainStackParamList = {
  Settings: undefined;
};

type NavigationProp = StackNavigationProp<MainStackParamList>;

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

export default function EquipmentSettingsScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { userProfile, updatePreferences } = useUserStore();

  // Initialize selected equipment from store or use empty array
  const initialSelectedIds = userProfile?.preferences?.equipmentIds || []; // TODO: Handle if store not implemented
  const [selectedEquipmentIds, setSelectedEquipmentIds] =
    useState<string[]>(initialSelectedIds);

  // Update local state when userProfile changes (if needed)
  useEffect(() => {
    if (userProfile?.preferences?.equipmentIds) {
      setSelectedEquipmentIds(userProfile.preferences.equipmentIds);
    }
  }, [userProfile?.preferences?.equipmentIds]);

  const handleToggleEquipment = (equipmentId: string) => {
    setSelectedEquipmentIds((prev) => {
      if (prev.includes(equipmentId)) {
        return prev.filter((id) => id !== equipmentId);
      }
      return [...prev, equipmentId];
    });
  };

  const handleSave = () => {
    // TODO: Ensure useUserStore.updatePreferences is fully implemented
    try {
      updatePreferences({ equipmentIds: selectedEquipmentIds });
      navigation.goBack();
    } catch (error) {
      // TODO: Handle error case when store is not implemented
      console.log('Error saving equipment preferences:', error);
      // For now, still navigate back
      navigation.goBack();
    }
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
            Equipment
          </Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      {/* Equipment List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { padding: theme.spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {equipmentList.map((equipment, index) => {
          const isSelected = selectedEquipmentIds.includes(equipment.id);
          return (
            <TouchableOpacity
              key={equipment.id}
              onPress={() => handleToggleEquipment(equipment.id)}
              activeOpacity={0.7}
              style={[
                styles.equipmentRow,
                {
                  backgroundColor: theme.colors.graphite,
                  borderRadius: theme.radius.md,
                  paddingVertical: theme.spacing.xxl,
                  paddingHorizontal: theme.spacing.lg,
                  marginBottom: theme.spacing.md,
                  borderWidth: isSelected ? 2 : 1,
                  borderColor: isSelected
                    ? theme.colors.acidGreen
                    : theme.colors.steel,
                },
              ]}
            >
              <Text
                style={[
                  styles.equipmentName,
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
                  size={28}
                  color={theme.colors.acidGreen}
                />
              ) : (
                <Ionicons
                  name="ellipse-outline"
                  size={28}
                  color={theme.colors.mutedDark}
                />
              )}
            </TouchableOpacity>
          );
        })}
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
          title="Save Equipment"
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
  equipmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  equipmentName: {
    fontWeight: '400',
    flex: 1,
  },
  footer: {
    width: '100%',
  },
});
