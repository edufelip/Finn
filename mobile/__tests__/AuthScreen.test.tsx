import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

import AuthScreen from '../src/presentation/screens/AuthScreen';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock('expo-auth-session/providers/google', () => ({
  useAuthRequest: () => [null, null, jest.fn()],
}));

jest.mock('expo-auth-session', () => ({
  makeRedirectUri: jest.fn(() => 'finn://auth/callback'),
}));

jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
}));

jest.mock('expo-apple-authentication', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(false),
  AppleAuthenticationScope: { FULL_NAME: 0, EMAIL: 1 },
  signInAsync: jest.fn(),
}));

jest.mock('expo-network', () => ({
  getNetworkStateAsync: jest.fn(),
}));

jest.mock('../src/data/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signInWithIdToken: jest.fn(),
    },
  },
}));

const network = jest.requireMock('expo-network');
const { supabase } = jest.requireMock('../src/data/supabase/client');

describe('AuthScreen', () => {
  beforeAll(() => {
    process.env.EXPO_PUBLIC_APP_MODE = 'prod';
  });

  beforeEach(() => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    mockNavigate.mockReset();
    supabase.auth.signInWithPassword.mockReset();
    network.getNetworkStateAsync.mockReset();
    network.getNetworkStateAsync.mockResolvedValue({ isConnected: true });
  });

  it('signs in with email and password', async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({ data: {}, error: null });

    const { getByTestId } = render(<AuthScreen />);

    fireEvent.changeText(getByTestId('auth-email'), 'user@example.com');
    fireEvent.changeText(getByTestId('auth-password'), 'password123');
    fireEvent.press(getByTestId('auth-signin'));

    await waitFor(() =>
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'password123',
      })
    );
  });

  it('navigates to register and forgot password', () => {
    const { getByTestId } = render(<AuthScreen />);

    fireEvent.press(getByTestId('auth-register'));
    expect(mockNavigate).toHaveBeenCalledWith('Register');

    fireEvent.press(getByTestId('auth-forgot'));
    expect(mockNavigate).toHaveBeenCalledWith('ForgotPassword');
  });
});
