import 'react-native-gesture-handler/jestSetup';

jest.mock('expo-router', () => ({
  Link: 'Link',
  Stack: () => null,
}));
