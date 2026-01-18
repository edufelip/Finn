import React from 'react';
import { render } from '@testing-library/react-native';
import InboxScreen from '../src/presentation/screens/InboxScreen';
import ProfileScreen from '../src/presentation/screens/ProfileScreen';
import { guestCopy } from '../src/presentation/content/guestCopy';

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

// Mock AuthProvider to simulate guest mode
jest.mock('../src/app/providers/AuthProvider', () => ({
  useAuth: () => ({
    session: null,
    initializing: false,
    isGuest: true,
    exitGuest: jest.fn(),
  }),
}));

// Mock repositories for ProfileScreen with stable objects
const mockUsersRepo = { getUser: jest.fn() };
const mockPostsRepo = { getPostsFromUser: jest.fn(), getSavedPosts: jest.fn() };
jest.mock('../src/app/providers/RepositoryProvider', () => ({
  useRepositories: () => ({
    users: mockUsersRepo,
    posts: mockPostsRepo,
  }),
}));

// Mock UserStore for ProfileScreen
jest.mock('../src/app/store/userStore', () => ({
  useUserStore: (selector: any) => selector({ currentUser: null }),
}));

// Mock ScreenFade to ensure it renders children (and we can verify it doesn't crash)
jest.mock('../src/presentation/components/ScreenFade', () => {
  const { View } = require('react-native');
  return function ScreenFade({ children }: { children: React.ReactNode }) {
    return <View testID="screen-fade">{children}</View>;
  };
});

describe('Guest Mode Transitions', () => {
  it('InboxScreen renders GuestGateScreen wrapped in ScreenFade when isGuest is true', () => {
    const { getByText, getByTestId } = render(<InboxScreen />);
    
    // Check if GuestGateScreen content is present
    expect(getByText(guestCopy.restricted.title(guestCopy.features.inbox))).toBeTruthy();
    
    // Check if it's wrapped in ScreenFade (using our mock testID)
    expect(getByTestId('screen-fade')).toBeTruthy();
  });

  it('ProfileScreen renders GuestGateScreen wrapped in ScreenFade when isGuest is true', () => {
    const { getByText, getByTestId } = render(<ProfileScreen />);
    
    // Check if GuestGateScreen content is present
    expect(getByText(guestCopy.profile.title)).toBeTruthy();
    
    // Check if it's wrapped in ScreenFade (using our mock testID)
    expect(getByTestId('screen-fade')).toBeTruthy();
  });
});
