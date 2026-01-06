/* global jest */
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
process.env.EXPO_PUBLIC_APP_MODE = 'mock';

jest.mock('react-native-reanimated', () => {
  const ReactNative = require('react-native');
  const transition = {
    duration: () => transition,
    easing: () => transition,
  };

  const Animated = {
    View: ReactNative.View,
    Text: ReactNative.Text,
    Image: ReactNative.Image,
    ScrollView: ReactNative.ScrollView,
    FlatList: ReactNative.FlatList,
    createAnimatedComponent: (Component) => Component,
  };

  return {
    __esModule: true,
    default: Animated,
    ...Animated,
    useSharedValue: (value) => ({ value }),
    useAnimatedStyle: (fn) => fn(),
    useDerivedValue: (fn) => ({ value: fn() }),
    useReducedMotion: () => false,
    withTiming: (value) => value,
    interpolate: (_value, _input, output) => (output ? output[0] : 0),
    interpolateColor: (_value, _input, output) => (output ? output[0] : 'transparent'),
    Easing: { out: (value) => value, cubic: (value) => value },
    Layout: { springify: () => ({ damping: () => ({ stiffness: () => ({}) }) }) },
    SlideInLeft: transition,
    SlideInRight: transition,
    SlideOutLeft: transition,
    SlideOutRight: transition,
  };
});

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const MockIcon = ({ name }) => React.createElement(Text, null, name);
  MockIcon.displayName = 'MockIcon';

  return {
    MaterialIcons: MockIcon,
    MaterialCommunityIcons: MockIcon,
    Ionicons: MockIcon,
    Feather: MockIcon,
    FontAwesome: MockIcon,
  };
});

jest.mock('expo-font', () => ({
  loadAsync: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, ...props }) => React.createElement(View, props, children),
    SafeAreaProvider: ({ children }) => React.createElement(View, null, children),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

jest.mock('react-native/Libraries/Lists/VirtualizedList', () => {
  const React = require('react');
  const { ScrollView } = require('react-native');
  return ({ data = [], renderItem }) => (
    <ScrollView>{data.map((item, index) => renderItem({ item, index }))}</ScrollView>
  );
});

const originalConsoleError = console.error;
console.error = (...args) => {
  if (args.some((arg) => String(arg).includes('VirtualizedList'))) {
    return;
  }
  originalConsoleError(...args);
};
