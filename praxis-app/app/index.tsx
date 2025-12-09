import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/theme';

export default function HomeScreen() {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.carbon,
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
          },
        ]}
      >
        Project Praxis
      </Text>
      <Text
        style={[
          styles.subtitle,
          {
            color: theme.colors.muted,
            fontFamily: theme.typography.fonts.body,
            fontSize: theme.typography.sizes.body,
          },
        ]}
      >
        Ready to train
      </Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
});
