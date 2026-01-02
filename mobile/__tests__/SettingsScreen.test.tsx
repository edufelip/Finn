import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

import SettingsScreen from '../src/presentation/screens/SettingsScreen';
import { RepositoryProvider } from '../src/app/providers/RepositoryProvider';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));

jest.mock('../src/app/providers/AuthProvider', () => ({
  useAuth: () => ({
    session: { user: { id: 'user-1', email: 'user@example.com' } },
    initializing: false,
  }),
}));

jest.mock('expo-network', () => ({
  getNetworkStateAsync: jest.fn(),
}));

jest.mock('../src/data/supabase/client', () => ({
  supabase: {
    auth: {
      signOut: jest.fn(),
    },
  },
}));

const network = jest.requireMock('expo-network');
const { supabase } = jest.requireMock('../src/data/supabase/client');

describe('SettingsScreen', () => {
  beforeAll(() => {
    process.env.EXPO_PUBLIC_APP_MODE = 'prod';
  });

  beforeEach(() => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    network.getNetworkStateAsync.mockReset();
    network.getNetworkStateAsync.mockResolvedValue({ isConnected: true });
    supabase.auth.signOut.mockReset();
  });

  it('shows placeholder alert for toggles', () => {
    const usersRepo = {
      deleteUser: jest.fn(),
    };

    const { getByTestId } = render(
      <RepositoryProvider overrides={{ users: usersRepo }}>
        <SettingsScreen />
      </RepositoryProvider>
    );

    fireEvent(getByTestId('settings-dark-toggle'), 'valueChange', true);
    fireEvent(getByTestId('settings-notifications-toggle'), 'valueChange', false);

    expect(Alert.alert).toHaveBeenCalled();
  });

  it('deletes profile data when online', async () => {
    const usersRepo = {
      deleteUser: jest.fn().mockResolvedValue(undefined),
    };

    jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
      const confirm = buttons?.find((button) => button.style === 'destructive');
      confirm?.onPress?.();
    });

    const { getByTestId } = render(
      <RepositoryProvider overrides={{ users: usersRepo }}>
        <SettingsScreen />
      </RepositoryProvider>
    );

    fireEvent.press(getByTestId('settings-delete'));

    await waitFor(() => expect(usersRepo.deleteUser).toHaveBeenCalledWith('user-1'));
    expect(supabase.auth.signOut).toHaveBeenCalled();
  });

  it('blocks delete when offline', async () => {
    network.getNetworkStateAsync.mockResolvedValue({ isConnected: false });
    const usersRepo = {
      deleteUser: jest.fn(),
    };

    jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
      const confirm = buttons?.find((button) => button.style === 'destructive');
      confirm?.onPress?.();
    });

    const { getByTestId } = render(
      <RepositoryProvider overrides={{ users: usersRepo }}>
        <SettingsScreen />
      </RepositoryProvider>
    );

    fireEvent.press(getByTestId('settings-delete'));

    await waitFor(() => expect(usersRepo.deleteUser).not.toHaveBeenCalled());
  });
});
