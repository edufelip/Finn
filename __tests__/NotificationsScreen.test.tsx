import React from 'react';
import { render } from '@testing-library/react-native';

import NotificationsScreen from '../src/presentation/screens/NotificationsScreen';
import { RepositoryProvider } from '../src/app/providers/RepositoryProvider';
import { notificationsCopy } from '../src/presentation/content/notificationsCopy';

const mockUseAuth = jest.fn();

jest.mock('@react-navigation/native', () => {
  const React = require('react');
  return {
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
    }),
    useFocusEffect: (effect: () => void | (() => void)) =>
      React.useEffect(() => effect(), [effect]),
  };
});

jest.mock('../src/app/providers/AuthProvider', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('NotificationsScreen', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      session: { user: { id: 'user-1', email: 'user@example.com' } },
      initializing: false,
    });
  });

  it('renders empty state copy', async () => {
    const usersRepo = {
      getNotifications: jest.fn().mockResolvedValue([]),
    };

    const { findByText, getByText } = render(
      <RepositoryProvider overrides={{ users: usersRepo }}>
        <NotificationsScreen />
      </RepositoryProvider>
    );

    expect(getByText(notificationsCopy.title)).toBeTruthy();
    expect(getByText(notificationsCopy.tabs.all)).toBeTruthy();
    expect(getByText(notificationsCopy.tabs.myPosts)).toBeTruthy();
    expect(await findByText(notificationsCopy.empty.title)).toBeTruthy();
    expect(getByText(notificationsCopy.empty.body)).toBeTruthy();
  });
});
