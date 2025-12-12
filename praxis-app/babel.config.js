module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'expo-router/babel',
      [
        'module-resolver',
        {
          root: ['./'],
          extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
          alias: {
            '@': './src',
            '@theme': './src/theme',
            '@core': './src/core',
            '@components': './src/components',
            '@engine': './src/engine',
            '@utils': './src/utils',
            '@screens': './src/screens',
            '@constants': './src/constants',
            '@app': './app',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
