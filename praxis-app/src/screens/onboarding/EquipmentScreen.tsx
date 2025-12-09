import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme';
import { PraxisButton } from '../../components';
import { useUserStore } from '../../../core/store';

const equipmentOptions: { id: string; name: string }[] = [
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

export default function EquipmentScreen() {
  const theme = useTheme();
  const { updatePreferences } = useUserStore();
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<string[]>(
    []
  );

  const handleToggleEquipment = (equipmentId: string) => {
    setSelectedEquipmentIds((prev) => {
      if (prev.includes(equipmentId)) {
        return prev.filter((id) => id !== equipmentId);
      }
      return [...prev, equipmentId];
    });
  };

  const handleContinue = () => {
    if (selectedEquipmentIds.length > 0) {
      updatePreferences({ equipment: selectedEquipmentIds });
      router.push('/onboarding/experience');
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
          What equipment do you have access to?
        </Text>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{
            paddingBottom: theme.spacing.lg,
          }}
          showsVerticalScrollIndicator={false}
        >
          {equipmentOptions.map((equipment) => {
            const isSelected = selectedEquipmentIds.includes(equipment.id);
            return (
              <TouchableOpacity
                key={equipment.id}
                onPress={() => handleToggleEquipment(equipment.id)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.equipmentRow,
                    {
                      backgroundColor: theme.colors.graphite,
                      borderWidth: isSelected ? 2 : 1,
                      borderColor: isSelected
                        ? theme.colors.acidGreen
                        : theme.colors.steel,
                      borderRadius: theme.radius.md,
                      paddingVertical: theme.spacing.lg,
                      paddingHorizontal: theme.spacing.lg,
                      marginBottom: theme.spacing.md,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.equipmentText,
                      {
                        color: theme.colors.white,
                        fontFamily: theme.typography.fonts.bodyMedium,
                        fontSize: theme.typography.sizes.body,
                      },
                    ]}
                  >
                    {equipment.name}
                  </Text>
                  {isSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={theme.colors.acidGreen}
                    />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={[styles.buttonContainer, { padding: theme.spacing.lg }]}>
        <PraxisButton
          title="Continue"
          onPress={handleContinue}
          size="large"
          disabled={selectedEquipmentIds.length === 0}
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
  scrollView: {
    flex: 1,
  },
  equipmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  equipmentText: {
    fontWeight: '500',
    flex: 1,
  },
  buttonContainer: {
    width: '100%',
  },
});
