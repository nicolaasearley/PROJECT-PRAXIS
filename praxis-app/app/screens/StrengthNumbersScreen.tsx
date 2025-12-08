import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../src/theme';

export default function StrengthNumbersScreen() {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.carbon }]}>
      <Text style={[styles.title, { color: theme.colors.white }]}>
        Strength Numbers
      </Text>
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
  },
});
