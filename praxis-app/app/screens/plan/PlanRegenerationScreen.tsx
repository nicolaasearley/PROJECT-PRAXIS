import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { Card, IconButton, PraxisButton, Spacer } from '../../components';
import { useUserStore, usePlanStore } from '../../core/store';

type MainStackParamList = {
  Home: undefined;
  WorkoutOverview: undefined;
};

type NavigationProp = StackNavigationProp<MainStackParamList>;

type RegenerationType = 'today' | 'week' | 'fullCycle' | 'readinessTrend';

interface RegenerationOption {
  id: RegenerationType;
  title: string;
  subtitle: string;
  confirmationMessage: string;
}

export default function PlanRegenerationScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { readinessHistory } = useUserStore();
  const { setPlanDays } = usePlanStore();

  const [confirmationModalVisible, setConfirmationModalVisible] =
    useState(false);
  const [loadingModalVisible, setLoadingModalVisible] = useState(false);
  const [selectedRegenerationType, setSelectedRegenerationType] =
    useState<RegenerationType | null>(null);

  // TODO: Replace with actual data from useUserStore.readinessHistory
  const mockReadinessData = {
    last7DaysAvg: 72,
    trend: 6,
    bestDay: { name: 'Thu', score: 85 },
    lowestDay: { name: 'Mon', score: 58 },
  };

  const regenerationOptions: RegenerationOption[] = [
    {
      id: 'today',
      title: 'Rebuild Today',
      subtitle:
        "Replace only today's session using your latest readiness score.",
      confirmationMessage: "Rebuild today's workout?",
    },
    {
      id: 'week',
      title: 'Rebuild This Week',
      subtitle:
        'Rebuild all sessions for the current week while keeping your overall goal intact.',
      confirmationMessage: "Rebuild this week's training plan?",
    },
    {
      id: 'fullCycle',
      title: 'Regenerate Full Cycle',
      subtitle:
        'Recalculate the full microcycle using your preferences, readiness patterns, and workout history.',
      confirmationMessage: 'Regenerate full training cycle?',
    },
    {
      id: 'readinessTrend',
      title: 'Rebuild Based on Readiness Trend',
      subtitle:
        'Use your last 7 days of readiness to adjust volume and intensity.',
      confirmationMessage: 'Adapt plan based on readiness trend?',
    },
  ];

  // TODO: Implement actual plan generation logic
  const generateDailyWorkout = async (): Promise<void> => {
    // TODO: Call engine.generateDailyWorkout() with current readiness
    // TODO: Update usePlanStore with new workout
    return new Promise((resolve) => setTimeout(resolve, 1500));
  };

  const generateWeeklyPlan = async (): Promise<void> => {
    // TODO: Call engine.generateWeeklyPlan() with current preferences
    // TODO: Update usePlanStore.setPlanDays() with new week
    return new Promise((resolve) => setTimeout(resolve, 1500));
  };

  const generateFullCycle = async (): Promise<void> => {
    // TODO: Call engine.generateInitialPlan() with updated preferences/history
    // TODO: Update usePlanStore.setPlanDays() with full cycle
    return new Promise((resolve) => setTimeout(resolve, 1500));
  };

  const generateTrendAdjustedCycle = async (): Promise<void> => {
    // TODO: Call engine.generateTrendAdjustedCycle() with readinessHistory
    // TODO: Update usePlanStore.setPlanDays() with adjusted plan
    return new Promise((resolve) => setTimeout(resolve, 1500));
  };

  const handleRegenerationPress = (type: RegenerationType) => {
    setSelectedRegenerationType(type);
    setConfirmationModalVisible(true);
  };

  const handleConfirmRegeneration = async () => {
    setConfirmationModalVisible(false);
    setLoadingModalVisible(true);

    try {
      switch (selectedRegenerationType) {
        case 'today':
          await generateDailyWorkout();
          navigation.navigate('WorkoutOverview');
          break;
        case 'week':
          await generateWeeklyPlan();
          navigation.navigate('Home');
          break;
        case 'fullCycle':
          await generateFullCycle();
          navigation.navigate('Home');
          break;
        case 'readinessTrend':
          await generateTrendAdjustedCycle();
          navigation.navigate('Home');
          break;
      }
    } catch (error) {
      console.error('Error regenerating plan:', error);
      // TODO: Show error message to user
    } finally {
      setLoadingModalVisible(false);
    }
  };

  const handleCancelRegeneration = () => {
    setConfirmationModalVisible(false);
    setSelectedRegenerationType(null);
  };

  const selectedOption = regenerationOptions.find(
    (opt) => opt.id === selectedRegenerationType
  );

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
            Regenerate Plan
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
        {/* Introduction Card */}
        <Card
          variant="elevated"
          padding="lg"
          style={{ marginBottom: theme.spacing.lg }}
        >
          <View style={styles.introContent}>
            <Text
              style={[
                styles.introIcon,
                {
                  color: theme.colors.acidGreen,
                  fontSize: 48,
                  marginBottom: theme.spacing.lg,
                },
              ]}
            >
              [REGEN ICON]
            </Text>
            <Text
              style={[
                styles.introTitle,
                {
                  color: theme.colors.white,
                  fontFamily: theme.typography.fonts.headingMedium,
                  fontSize: theme.typography.sizes.h3,
                  marginBottom: theme.spacing.md,
                },
              ]}
            >
              Adjust Your Training Plan
            </Text>
            <Text
              style={[
                styles.introBody,
                {
                  color: theme.colors.white,
                  fontFamily: theme.typography.fonts.body,
                  fontSize: theme.typography.sizes.body,
                  marginBottom: theme.spacing.md,
                  textAlign: 'center',
                },
              ]}
            >
              This tool lets you rebuild workouts or entire training cycles
              based on your preferences and readiness trends.
            </Text>
            <Text
              style={[
                styles.introSubtitle,
                {
                  color: theme.colors.muted,
                  fontFamily: theme.typography.fonts.body,
                  fontSize: theme.typography.sizes.bodySmall,
                  textAlign: 'center',
                },
              ]}
            >
              Use with intention. Regeneration makes permanent updates.
            </Text>
          </View>
        </Card>

        {/* Regeneration Options */}
        {regenerationOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            onPress={() => handleRegenerationPress(option.id)}
            activeOpacity={0.7}
          >
            <Card
              variant="elevated"
              padding="lg"
              style={{ marginBottom: theme.spacing.lg }}
            >
              <Text
                style={[
                  styles.optionTitle,
                  {
                    color: theme.colors.white,
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
                  styles.optionSubtitle,
                  {
                    color: theme.colors.muted,
                    fontFamily: theme.typography.fonts.body,
                    fontSize: theme.typography.sizes.bodySmall,
                  },
                ]}
              >
                {option.subtitle}
              </Text>
            </Card>
          </TouchableOpacity>
        ))}

        {/* Readiness Snapshot */}
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
            Readiness Snapshot
          </Text>

          <View
            style={[
              styles.readinessRow,
              {
                paddingVertical: theme.spacing.sm,
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.steel,
              },
            ]}
          >
            <Text
              style={[
                styles.readinessLabel,
                {
                  color: theme.colors.muted,
                  fontFamily: theme.typography.fonts.body,
                  fontSize: theme.typography.sizes.body,
                },
              ]}
            >
              Last 7 Days Avg:
            </Text>
            <Text
              style={[
                styles.readinessValue,
                {
                  color: theme.colors.acidGreen,
                  fontFamily: theme.typography.fonts.bodyMedium,
                  fontSize: theme.typography.sizes.body,
                },
              ]}
            >
              {mockReadinessData.last7DaysAvg}
            </Text>
          </View>

          <View
            style={[
              styles.readinessRow,
              {
                paddingVertical: theme.spacing.sm,
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.steel,
              },
            ]}
          >
            <Text
              style={[
                styles.readinessLabel,
                {
                  color: theme.colors.muted,
                  fontFamily: theme.typography.fonts.body,
                  fontSize: theme.typography.sizes.body,
                },
              ]}
            >
              Trend:
            </Text>
            <Text
              style={[
                styles.readinessValue,
                {
                  color: theme.colors.acidGreen,
                  fontFamily: theme.typography.fonts.bodyMedium,
                  fontSize: theme.typography.sizes.body,
                },
              ]}
            >
              +{mockReadinessData.trend}%
            </Text>
          </View>

          <View
            style={[
              styles.readinessRow,
              {
                paddingVertical: theme.spacing.sm,
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.steel,
              },
            ]}
          >
            <Text
              style={[
                styles.readinessLabel,
                {
                  color: theme.colors.muted,
                  fontFamily: theme.typography.fonts.body,
                  fontSize: theme.typography.sizes.body,
                },
              ]}
            >
              Best Day:
            </Text>
            <Text
              style={[
                styles.readinessValue,
                {
                  color: theme.colors.white,
                  fontFamily: theme.typography.fonts.bodyMedium,
                  fontSize: theme.typography.sizes.body,
                },
              ]}
            >
              {mockReadinessData.bestDay.name} (
              {mockReadinessData.bestDay.score})
            </Text>
          </View>

          <View
            style={[
              styles.readinessRow,
              {
                paddingVertical: theme.spacing.sm,
              },
            ]}
          >
            <Text
              style={[
                styles.readinessLabel,
                {
                  color: theme.colors.muted,
                  fontFamily: theme.typography.fonts.body,
                  fontSize: theme.typography.sizes.body,
                },
              ]}
            >
              Lowest:
            </Text>
            <Text
              style={[
                styles.readinessValue,
                {
                  color: theme.colors.white,
                  fontFamily: theme.typography.fonts.bodyMedium,
                  fontSize: theme.typography.sizes.body,
                },
              ]}
            >
              {mockReadinessData.lowestDay.name} (
              {mockReadinessData.lowestDay.score})
            </Text>
          </View>
        </Card>

        <Spacer size="xl" />
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal
        visible={confirmationModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCancelRegeneration}
      >
        <View
          style={[
            styles.modalOverlay,
            { backgroundColor: 'rgba(0, 0, 0, 0.8)' },
          ]}
        >
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.colors.graphite,
                borderRadius: theme.radius.xl,
                padding: theme.spacing.xxxl,
              },
            ]}
          >
            <Text
              style={[
                styles.modalTitle,
                {
                  color: theme.colors.white,
                  fontFamily: theme.typography.fonts.headingMedium,
                  fontSize: theme.typography.sizes.h3,
                  marginBottom: theme.spacing.xl,
                  textAlign: 'center',
                },
              ]}
            >
              {selectedOption?.confirmationMessage}
            </Text>

            <View style={styles.modalActions}>
              <PraxisButton
                title="Cancel"
                onPress={handleCancelRegeneration}
                variant="outline"
                size="medium"
                style={{ flex: 1, marginRight: theme.spacing.sm }}
              />
              <PraxisButton
                title="Confirm"
                onPress={handleConfirmRegeneration}
                size="medium"
                style={{ flex: 1, marginLeft: theme.spacing.sm }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Loading Modal */}
      <Modal visible={loadingModalVisible} transparent animationType="fade">
        <View
          style={[
            styles.loadingOverlay,
            { backgroundColor: 'rgba(0, 0, 0, 0.9)' },
          ]}
        >
          <View style={styles.loadingContent}>
            <ActivityIndicator
              size="large"
              color={theme.colors.acidGreen}
              style={{ marginBottom: theme.spacing.lg }}
            />
            <Text
              style={[
                styles.loadingText,
                {
                  color: theme.colors.white,
                  fontFamily: theme.typography.fonts.body,
                  fontSize: theme.typography.sizes.body,
                },
              ]}
            >
              [Rebuilding Plan…]
            </Text>
          </View>
        </View>
      </Modal>
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
  introContent: {
    alignItems: 'center',
    width: '100%',
  },
  introIcon: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  introTitle: {
    fontWeight: '600',
    textAlign: 'center',
  },
  introBody: {
    fontWeight: '400',
    lineHeight: 22,
  },
  introSubtitle: {
    fontWeight: '400',
  },
  optionTitle: {
    fontWeight: '600',
  },
  optionSubtitle: {
    fontWeight: '400',
    lineHeight: 20,
  },
  sectionTitle: {
    fontWeight: '600',
  },
  readinessRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  readinessLabel: {
    fontWeight: '400',
  },
  readinessValue: {
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    width: '100%',
  },
  loadingOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontWeight: '400',
  },
});
