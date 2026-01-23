module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@assets': './assets',
            '@components': './src/presentation/components',
            '@screens': './src/presentation/screens',
            '@utils': './src/utils',
          },
        },
      ],
    ],
  };
};
