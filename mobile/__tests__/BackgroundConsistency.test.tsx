import React from 'react';
import { render } from '@testing-library/react-native';
import InboxScreen from '../src/presentation/screens/InboxScreen';

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

// Mock ThemeProvider with inline theme object to avoid scope issues
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

// Mock StatusBar - mocking react-native directly is tricky in some setups,
// so we focus on verifying the style prop propagation which confirms the theme usage.
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.StatusBar = (props: any) => <RN.View testID="mock-statusbar" {...props} />;
  return RN;
});

const EXPECTED_BG = '#F9FAFB';

describe('Background Consistency', () => {
  it('InboxScreen uses theme.background for safe area and header', () => {
    const { toJSON } = render(<InboxScreen />);
    const json = toJSON();
    
    // Recursive function to find styles
    const findStyleWithBackgroundColor = (node: any, color: string): boolean => {
      if (!node) return false;
      if (node.props && node.props.style) {
        const style = Array.isArray(node.props.style) ? Object.assign({}, ...node.props.style) : node.props.style;
        if (style.backgroundColor === color) {
          return true;
        }
      }
      if (node.children) {
        for (const child of node.children) {
          if (findStyleWithBackgroundColor(child, color)) return true;
        }
      }
      return false;
    };

    expect(findStyleWithBackgroundColor(json, EXPECTED_BG)).toBe(true);
  });
});
