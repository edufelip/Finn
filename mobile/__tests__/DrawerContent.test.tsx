import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

import DrawerContent from '../src/presentation/navigation/DrawerContent';
import { RepositoryProvider } from '../src/app/providers/RepositoryProvider';
import { drawerCopy } from '../src/presentation/content/drawerCopy';

jest.mock('@react-navigation/drawer', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return {
    DrawerContentScrollView: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    DrawerItem: ({ label, testID }: { label: string; testID?: string }) =>
      React.createElement(Text, { testID }, label),
  };
});

jest.mock('../src/app/providers/AuthProvider', () => ({
  useAuth: () => ({
    session: { user: { id: 'user-1', email: 'user@example.com' } },
    initializing: false,
  }),
}));

describe('DrawerContent', () => {
  it('renders drawer labels', async () => {
    const usersRepo = {
      getUser: jest.fn().mockResolvedValue({ id: 'user-1', name: 'Jane Doe' }),
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
      <RepositoryProvider overrides={{ users: usersRepo }}>
        <DrawerContent navigation={navigation} state={state} descriptors={descriptors} />
      </RepositoryProvider>
    );

    await waitFor(() => expect(getByText('Jane Doe')).toBeTruthy());
    expect(getByTestId(drawerCopy.testIds.profile)).toBeTruthy();
    expect(getByTestId(drawerCopy.testIds.saved)).toBeTruthy();
    expect(getByTestId(drawerCopy.testIds.settings)).toBeTruthy();
    expect(getByText(drawerCopy.profile)).toBeTruthy();
    expect(getByText(drawerCopy.saved)).toBeTruthy();
    expect(getByText(drawerCopy.posts)).toBeTruthy();
    expect(getByText(drawerCopy.settings)).toBeTruthy();
    expect(getByText(drawerCopy.privacyPolicy)).toBeTruthy();
    expect(getByText(drawerCopy.logout)).toBeTruthy();
  });
});
