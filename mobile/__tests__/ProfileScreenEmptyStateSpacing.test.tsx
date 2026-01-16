import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import ProfileScreen from '../src/presentation/screens/ProfileScreen';
import { profileCopy } from '../src/presentation/content/profileCopy';

// Mock dependencies
jest.mock('@react-navigation/native', () => {
  const React = require('react');
  return {
    useIsFocused: () => true,
    useNavigationState: () => ({ index: 0 }),
    useNavigation: () => ({ navigate: jest.fn() }),
    useFocusEffect: (effect: () => void) => React.useEffect(effect, []),
  };
});

jest.mock('@react-navigation/bottom-tabs', () => ({
  useBottomTabBarHeight: () => 80,
}));

// Mock AuthProvider
jest.mock('../src/app/providers/AuthProvider', () => ({
  useAuth: () => ({
    session: { user: { id: 'user-1' } }, // Authenticated
    initializing: false,
    isGuest: false,
    exitGuest: jest.fn(),
  }),
}));

// Mock repositories
const mockUsersRepo = { getUser: jest.fn().mockResolvedValue({ id: 'user-1' }) };
const mockPostsRepo = { getPostsFromUser: jest.fn().mockResolvedValue([]), getSavedPosts: jest.fn().mockResolvedValue([]) };
jest.mock('../src/app/providers/RepositoryProvider', () => ({
  useRepositories: () => ({
    users: mockUsersRepo,
    posts: mockPostsRepo,
  }),
}));

// Mock UserStore
jest.mock('../src/app/store/userStore', () => ({
  useUserStore: (selector: any) => selector({ currentUser: { id: 'user-1' } }),
}));

// Mock ThemeProvider
jest.mock('../src/app/providers/ThemeProvider', () => ({
  useThemeColors: () => ({
    background: '#F9FAFB',
    surface: '#FFFFFF',
    primary: '#44A2D6',
    onSurface: '#111827',
    onSurfaceVariant: '#6B7280',
    outline: '#E5E7EB',
    outlineVariant: '#F1F5F9',
    onPrimary: '#FFFFFF',
  }),
  useTheme: () => ({ isDark: false }),
}));

// Mock ScreenFade
jest.mock('../src/presentation/components/ScreenFade', () => {
  const { View } = require('react-native');
  return function ScreenFade({ children }: { children: React.ReactNode }) {
    return <View>{children}</View>;
  };
});

describe('ProfileScreen Empty State', () => {
  it('renders empty state content for posts tab', async () => {
    const { getByText } = render(<ProfileScreen />);
    
    // Wait for loading to finish and empty state to appear
    await waitFor(() => {
      expect(getByText(profileCopy.empty.title)).toBeTruthy();
    });
    
    expect(getByText(profileCopy.empty.body)).toBeTruthy();
  });
});
