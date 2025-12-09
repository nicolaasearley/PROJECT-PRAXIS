module.exports = {
  preset: 'jest-expo',
  testPathIgnorePatterns: ['/node_modules/', '/e2e/'],
  transformIgnorePatterns: [
    'node_modules/(?!@?react-native|react-clone-referenced-element|@?react-navigation|expo(nent)?|@expo(nent)?|sentry-expo|@sentry/.*|native-base|react-native-svg)',
  ],
};
