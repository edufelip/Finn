import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

import SettingsScreen from '../src/presentation/screens/SettingsScreen';
import { RepositoryProvider } from '../src/app/providers/RepositoryProvider';
import { settingsCopy } from '../src/presentation/content/settingsCopy';

const mockSetOnlineVisibility = jest.fn();
const mockSetNotificationsEnabled = jest.fn();
const mockSavePushToken = jest.fn();
const mockRegisterPushToken = jest.fn();
const mockSetNotificationGatePreference = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
}));

jest.mock('../src/app/providers/AuthProvider', () => ({
  useAuth: () => ({
    session: { user: { id: 'user-1', email: 'user@example.com' } },
    initializing: false,
  }),
}));

jest.mock('../src/app/providers/LocalizationProvider', () => ({
  useLocalization: () => ({
    locale: 'en',
    setLocale: jest.fn(),
    supportedLocales: ['en'],
  }),
}));

jest.mock('../src/app/providers/PresenceProvider', () => ({
  usePresence: () => ({
    isOnlineVisible: true,
    setOnlineVisibility: mockSetOnlineVisibility,
  }),
}));

jest.mock('expo-network', () => ({
  getNetworkStateAsync: jest.fn(),
}));

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
}));

jest.mock('../src/app/notifications/pushTokens', () => ({
  registerPushToken: (...args: any[]) => mockRegisterPushToken(...args),
  setNotificationGatePreference: (...args: any[]) => mockSetNotificationGatePreference(...args),
}));

jest.mock('../src/data/supabase/client', () => ({
  supabase: {
    auth: {
      signOut: jest.fn(),
    },
  },
}));

const network = jest.requireMock('expo-network');
const notifications = jest.requireMock('expo-notifications');
const { supabase } = jest.requireMock('../src/data/supabase/client');

describe('SettingsScreen', () => {
  beforeAll(() => {
    process.env.EXPO_PUBLIC_APP_MODE = 'prod';
  });

  beforeEach(() => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    network.getNetworkStateAsync.mockReset();
    network.getNetworkStateAsync.mockResolvedValue({ isConnected: true });
    notifications.getPermissionsAsync.mockReset();
    notifications.requestPermissionsAsync.mockReset();
    notifications.getPermissionsAsync.mockResolvedValue({ status: 'granted', canAskAgain: false });
    supabase.auth.signOut.mockReset();
    mockSetOnlineVisibility.mockReset();
    mockSetNotificationsEnabled.mockReset();
    mockRegisterPushToken.mockReset();
    mockSetNotificationGatePreference.mockReset();
    mockSavePushToken.mockReset();
  });

  it('updates notifications preference', async () => {
    const usersRepo = {
      deleteUser: jest.fn(),
      getUser: jest.fn().mockResolvedValue({ notificationsEnabled: true }),
      setNotificationsEnabled: mockSetNotificationsEnabled,
      savePushToken: mockSavePushToken,
    };

    const { getByTestId } = render(
      <RepositoryProvider overrides={{ users: usersRepo }}>
        <SettingsScreen />
      </RepositoryProvider>
    );

    fireEvent(getByTestId(settingsCopy.testIds.notifications), 'valueChange', false);

    await waitFor(() => {
      expect(mockSetNotificationsEnabled).toHaveBeenCalledWith('user-1', false);
    });

    expect(mockRegisterPushToken).not.toHaveBeenCalled();
  });

  it('reverts notifications when permission denied', async () => {
    notifications.getPermissionsAsync.mockResolvedValue({ status: 'denied', canAskAgain: false });
    const usersRepo = {
      deleteUser: jest.fn(),
      getUser: jest.fn().mockResolvedValue({ notificationsEnabled: false }),
      setNotificationsEnabled: mockSetNotificationsEnabled,
      savePushToken: mockSavePushToken,
    };

    const { getByTestId } = render(
      <RepositoryProvider overrides={{ users: usersRepo }}>
        <SettingsScreen />
      </RepositoryProvider>
    );

    fireEvent(getByTestId(settingsCopy.testIds.notifications), 'valueChange', true);

    await waitFor(() => {
      expect(mockSetNotificationsEnabled).toHaveBeenCalledWith('user-1', false);
      expect(Alert.alert).toHaveBeenCalledWith(
        settingsCopy.alerts.notificationsPermission.title,
        settingsCopy.alerts.notificationsPermission.message,
        expect.any(Array)
      );
    });
  });

  it('registers token when enabling notifications with permission', async () => {
    notifications.getPermissionsAsync.mockResolvedValue({ status: 'granted', canAskAgain: false });
    const usersRepo = {
      deleteUser: jest.fn(),
      getUser: jest.fn().mockResolvedValue({ notificationsEnabled: false }),
      setNotificationsEnabled: mockSetNotificationsEnabled,
      savePushToken: mockSavePushToken,
    };

    const { getByTestId } = render(
      <RepositoryProvider overrides={{ users: usersRepo }}>
        <SettingsScreen />
      </RepositoryProvider>
    );

    fireEvent(getByTestId(settingsCopy.testIds.notifications), 'valueChange', true);

    await waitFor(() => {
      expect(mockRegisterPushToken).toHaveBeenCalled();
      expect(mockRegisterPushToken.mock.calls[0][1]).toBe('user-1');
      expect(mockSetNotificationsEnabled).toHaveBeenCalledWith('user-1', true);
    });
  });

  it('updates online visibility preference', async () => {
    const usersRepo = {
      deleteUser: jest.fn(),
      getUser: jest.fn().mockResolvedValue({ notificationsEnabled: true }),
      setNotificationsEnabled: mockSetNotificationsEnabled,
      savePushToken: mockSavePushToken,
    };
    mockSetOnlineVisibility.mockResolvedValue(undefined);

    const { getByTestId } = render(
      <RepositoryProvider overrides={{ users: usersRepo }}>
        <SettingsScreen />
      </RepositoryProvider>
    );

    fireEvent(getByTestId(settingsCopy.testIds.onlineStatus), 'valueChange', false);

    await waitFor(() => {
      expect(mockSetOnlineVisibility).toHaveBeenCalledWith(false);
    });
  });

  it('deletes profile data when online', async () => {
    const usersRepo = {
      deleteUser: jest.fn().mockResolvedValue(undefined),
      getUser: jest.fn().mockResolvedValue({ notificationsEnabled: true }),
      setNotificationsEnabled: mockSetNotificationsEnabled,
      savePushToken: mockSavePushToken,
    };

    const { getByTestId, findByTestId } = render(
      <RepositoryProvider overrides={{ users: usersRepo }}>
        <SettingsScreen />
      </RepositoryProvider>
    );

    fireEvent.press(getByTestId(settingsCopy.testIds.delete));
    const emailInput = await findByTestId(settingsCopy.testIds.deleteEmail);
    fireEvent.changeText(emailInput, 'user@example.com');
    fireEvent.press(getByTestId(settingsCopy.testIds.deleteConfirm));

    await waitFor(() => {
      expect(usersRepo.deleteUser).toHaveBeenCalledWith('user-1');
      expect(Alert.alert).toHaveBeenCalledWith(
        settingsCopy.alerts.deleted.title,
        settingsCopy.alerts.deleted.message
      );
    });
    expect(supabase.auth.signOut).toHaveBeenCalled();
  });

  it('confirms logout before signing out', async () => {
    const usersRepo = {
      deleteUser: jest.fn(),
      getUser: jest.fn().mockResolvedValue({ notificationsEnabled: true }),
      setNotificationsEnabled: mockSetNotificationsEnabled,
      savePushToken: mockSavePushToken,
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

    fireEvent.press(getByTestId(settingsCopy.testIds.logout));

    await waitFor(() => {
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });
  });

  it('blocks delete when offline', async () => {
    network.getNetworkStateAsync.mockResolvedValue({ isConnected: false });
    const usersRepo = {
      deleteUser: jest.fn(),
      getUser: jest.fn().mockResolvedValue({ notificationsEnabled: true }),
      setNotificationsEnabled: mockSetNotificationsEnabled,
      savePushToken: mockSavePushToken,
    };

    const { getByTestId, findByTestId } = render(
      <RepositoryProvider overrides={{ users: usersRepo }}>
        <SettingsScreen />
      </RepositoryProvider>
    );

    fireEvent.press(getByTestId(settingsCopy.testIds.delete));
    const emailInput = await findByTestId(settingsCopy.testIds.deleteEmail);
    fireEvent.changeText(emailInput, 'user@example.com');
    fireEvent.press(getByTestId(settingsCopy.testIds.deleteConfirm));

    await waitFor(() => {
      expect(usersRepo.deleteUser).not.toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith(
        settingsCopy.alerts.offline.title,
        settingsCopy.alerts.offline.message
      );
    });
  });

  it('renders settings copy', () => {
    const usersRepo = {
      deleteUser: jest.fn(),
      getUser: jest.fn().mockResolvedValue({ notificationsEnabled: true }),
      setNotificationsEnabled: mockSetNotificationsEnabled,
      savePushToken: mockSavePushToken,
    };

    const { getByText } = render(
      <RepositoryProvider overrides={{ users: usersRepo }}>
        <SettingsScreen />
      </RepositoryProvider>
    );

    expect(getByText(settingsCopy.title)).toBeTruthy();
    expect(getByText(settingsCopy.sections.preferences)).toBeTruthy();
    expect(getByText(settingsCopy.sections.account)).toBeTruthy();
    expect(getByText(settingsCopy.sections.preferencesNote)).toBeTruthy();
    expect(getByText(settingsCopy.sections.accountNote)).toBeTruthy();
    expect(getByText(settingsCopy.options.darkMode)).toBeTruthy();
    expect(getByText(settingsCopy.options.notifications)).toBeTruthy();
    expect(getByText(settingsCopy.options.onlineStatus)).toBeTruthy();
    expect(getByText(settingsCopy.options.logout)).toBeTruthy();
    expect(getByText(settingsCopy.options.deleteAccount)).toBeTruthy();
    expect(getByText(settingsCopy.footer.privacy)).toBeTruthy();
    expect(getByText(settingsCopy.footer.terms)).toBeTruthy();
    expect(getByText(settingsCopy.footer.help)).toBeTruthy();
  });
});
