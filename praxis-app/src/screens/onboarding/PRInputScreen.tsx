import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../../../theme';
import { PraxisButton } from '../../components';
import { useUserStore } from '../../../core/store';

export default function PRInputScreen() {
  const theme = useTheme();
  const { updateStrengthNumbers } = useUserStore();
  const [squat1RM, setSquat1RM] = useState<string>('');
  const [bench1RM, setBench1RM] = useState<string>('');
  const [deadlift1RM, setDeadlift1RM] = useState<string>('');

  const handleContinue = () => {
    const strengthNumbers: {
      squat1RM?: number;
      bench1RM?: number;
      deadlift1RM?: number;
    } = {};

    if (squat1RM.trim()) {
      strengthNumbers.squat1RM = parseFloat(squat1RM);
    }
    if (bench1RM.trim()) {
      strengthNumbers.bench1RM = parseFloat(bench1RM);
    }
    if (deadlift1RM.trim()) {
      strengthNumbers.deadlift1RM = parseFloat(deadlift1RM);
    }

    if (Object.keys(strengthNumbers).length > 0) {
      updateStrengthNumbers(strengthNumbers);
    }

    router.push('/onboarding/generating');
  };

  const handleSkip = () => {
    router.push('/onboarding/generating');
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.carbon }]}
      edges={['top', 'bottom']}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
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
            Optional: Enter your current PRs
          </Text>

          <View style={styles.inputsContainer}>
            <View
              style={[styles.inputGroup, { marginBottom: theme.spacing.xxl }]}
            >
              <Text
                style={[
                  styles.label,
                  {
                    color: theme.colors.muted,
                    fontFamily: theme.typography.fonts.bodyMedium,
                    fontSize: theme.typography.sizes.bodySmall,
                    marginBottom: theme.spacing.sm,
                  },
                ]}
              >
                Back Squat 1RM
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.graphite,
                    borderColor: theme.colors.steel,
                    color: theme.colors.white,
                    fontFamily: theme.typography.fonts.body,
                    fontSize: theme.typography.sizes.body,
                    borderRadius: theme.radius.md,
                    paddingVertical: theme.spacing.lg,
                    paddingHorizontal: theme.spacing.lg,
                  },
                ]}
                value={squat1RM}
                onChangeText={setSquat1RM}
                placeholder="Enter weight"
                placeholderTextColor={theme.colors.mutedDark}
                keyboardType="numeric"
              />
            </View>

            <View
              style={[styles.inputGroup, { marginBottom: theme.spacing.xxl }]}
            >
              <Text
                style={[
                  styles.label,
                  {
                    color: theme.colors.muted,
                    fontFamily: theme.typography.fonts.bodyMedium,
                    fontSize: theme.typography.sizes.bodySmall,
                    marginBottom: theme.spacing.sm,
                  },
                ]}
              >
                Bench Press 1RM
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.graphite,
                    borderColor: theme.colors.steel,
                    color: theme.colors.white,
                    fontFamily: theme.typography.fonts.body,
                    fontSize: theme.typography.sizes.body,
                    borderRadius: theme.radius.md,
                    paddingVertical: theme.spacing.lg,
                    paddingHorizontal: theme.spacing.lg,
                  },
                ]}
                value={bench1RM}
                onChangeText={setBench1RM}
                placeholder="Enter weight"
                placeholderTextColor={theme.colors.mutedDark}
                keyboardType="numeric"
              />
            </View>

            <View
              style={[styles.inputGroup, { marginBottom: theme.spacing.xxl }]}
            >
              <Text
                style={[
                  styles.label,
                  {
                    color: theme.colors.muted,
                    fontFamily: theme.typography.fonts.bodyMedium,
                    fontSize: theme.typography.sizes.bodySmall,
                    marginBottom: theme.spacing.sm,
                  },
                ]}
              >
                Deadlift 1RM
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.graphite,
                    borderColor: theme.colors.steel,
                    color: theme.colors.white,
                    fontFamily: theme.typography.fonts.body,
                    fontSize: theme.typography.sizes.body,
                    borderRadius: theme.radius.md,
                    paddingVertical: theme.spacing.lg,
                    paddingHorizontal: theme.spacing.lg,
                  },
                ]}
                value={deadlift1RM}
                onChangeText={setDeadlift1RM}
                placeholder="Enter weight"
                placeholderTextColor={theme.colors.mutedDark}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        <View
          style={[
            styles.buttonContainer,
            {
              padding: theme.spacing.lg,
              flexDirection: 'row',
              justifyContent: 'space-between',
            },
          ]}
        >
          <PraxisButton
            title="Skip"
            onPress={handleSkip}
            variant="ghost"
            size="large"
            style={{ flex: 1, marginRight: theme.spacing.sm }}
          />
          <PraxisButton
            title="Continue"
            onPress={handleContinue}
            size="large"
            style={{ flex: 1, marginLeft: theme.spacing.sm }}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  title: {
    textAlign: 'center',
  },
  inputsContainer: {
    flex: 1,
  },
  inputGroup: {
    // marginBottom set inline
  },
  label: {
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
  },
  buttonContainer: {
    width: '100%',
  },
});
