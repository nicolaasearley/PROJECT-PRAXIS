import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

// Temporary fallback screen: the main WorkoutBlockScreen depends on native
// gesture/animation modules that are currently failing to load. This simple
// screen prevents routing failures so you can still navigate the app. To
// restore the full workout experience, rebuild the native app (expo prebuild
// --clean && expo run:ios) so react-native-gesture-handler and
// react-native-reanimated are available.

export default function WorkoutSessionFallback() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Workout screen unavailable</Text>
        <Text style={styles.body}>
          Native gesture/animation modules are missing in this build. Please rebuild the app
          (expo prebuild --clean && expo run:ios) to re-enable the full workout experience.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0F',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#1C1C22',
    padding: 20,
    borderRadius: 12,
    maxWidth: 360,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  body: {
    color: '#B0B0B8',
    fontSize: 15,
    lineHeight: 20,
    textAlign: 'center',
  },
});

