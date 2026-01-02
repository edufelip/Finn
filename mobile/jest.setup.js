import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
process.env.EXPO_PUBLIC_APP_MODE = 'mock';

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

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
