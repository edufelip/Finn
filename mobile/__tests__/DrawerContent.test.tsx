import React from 'react';
import { Alert } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';

import DrawerContent from '../src/presentation/navigation/DrawerContent';
import { RepositoryProvider } from '../src/app/providers/RepositoryProvider';
import { drawerCopy } from '../src/presentation/content/drawerCopy';

jest.mock('@react-navigation/drawer', () => {
  const React = require('react');

  return {
    DrawerContentScrollView: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
  };
});

jest.mock('../src/app/providers/AuthProvider', () => ({
  useAuth: () => ({
    session: { user: { id: 'user-1', email: 'user@example.com' } },
    initializing: false,
  }),
}));

jest.mock('../src/app/providers/PresenceProvider', () => ({
  usePresence: () => ({
    isOnline: true,
    isOnlineVisible: true,
    setOnlineVisibility: jest.fn(),
  }),
}));

describe('DrawerContent', () => {
  beforeEach(() => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  it('renders drawer labels', async () => {
    const usersRepo = {
      getUser: jest.fn().mockResolvedValue({ id: 'user-1', name: 'Jane Doe' }),
    };
    const postsRepo = {
      getSavedPostsCount: jest.fn().mockResolvedValue(12),
    };

    const navigation = {
      closeDrawer: jest.fn(),
      getParent: () => ({ navigate: jest.fn() }),
    } as any;

    const state = {
      index: 0,
      key: 'drawer',
      routeNames: ['Tabs'],
      routes: [{ key: 'tabs', name: 'Tabs' }],
    } as any;

    const descriptors = {} as any;

    const { getByText, getByTestId } = render(
      <RepositoryProvider overrides={{ users: usersRepo, posts: postsRepo }}>
        <DrawerContent navigation={navigation} state={state} descriptors={descriptors} />
      </RepositoryProvider>
    );

    await waitFor(() => expect(getByText('Jane Doe')).toBeTruthy());
    expect(getByText('12')).toBeTruthy();
    expect(getByTestId(drawerCopy.testIds.profile)).toBeTruthy();
    expect(getByTestId(drawerCopy.testIds.saved)).toBeTruthy();
    expect(getByTestId(drawerCopy.testIds.posts)).toBeTruthy();
    expect(getByTestId(drawerCopy.testIds.settings)).toBeTruthy();
    expect(getByTestId(drawerCopy.testIds.privacy)).toBeTruthy();
    expect(getByTestId(drawerCopy.testIds.logout)).toBeTruthy();
    expect(getByText(drawerCopy.profile)).toBeTruthy();
    expect(getByText(drawerCopy.saved)).toBeTruthy();
    expect(getByText(drawerCopy.posts)).toBeTruthy();
    expect(getByText(drawerCopy.settings)).toBeTruthy();
    expect(getByText(drawerCopy.privacyPolicy)).toBeTruthy();
    expect(getByText(drawerCopy.logout)).toBeTruthy();
  });

  it('confirms before logout', async () => {
    const usersRepo = {
      getUser: jest.fn().mockResolvedValue({ id: 'user-1', name: 'Jane Doe' }),
    };
    const postsRepo = {
      getSavedPostsCount: jest.fn().mockResolvedValue(0),
    };

    const navigation = {
      closeDrawer: jest.fn(),
      getParent: () => ({ navigate: jest.fn() }),
    } as any;

    const state = {
      index: 0,
      key: 'drawer',
      routeNames: ['Tabs'],
      routes: [{ key: 'tabs', name: 'Tabs' }],
    } as any;

    const descriptors = {} as any;

    const { getByTestId } = render(
      <RepositoryProvider overrides={{ users: usersRepo, posts: postsRepo }}>
        <DrawerContent navigation={navigation} state={state} descriptors={descriptors} />
      </RepositoryProvider>
    );

    await waitFor(() => expect(usersRepo.getUser).toHaveBeenCalled());
    getByTestId(drawerCopy.testIds.logout).props.onPress();
    expect(Alert.alert).toHaveBeenCalledWith(
      drawerCopy.alerts.logout.title,
      drawerCopy.alerts.logout.message,
      expect.any(Array)
    );
  });
});
