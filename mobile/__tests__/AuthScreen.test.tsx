import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

import AuthScreen from '../src/presentation/screens/AuthScreen';
import { authCopy } from '../src/presentation/content/authCopy';

const mockNavigate = jest.fn();
const mockUseAuthRequest = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock('expo-auth-session/providers/google', () => ({
  useAuthRequest: () => mockUseAuthRequest(),
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

jest.mock('../src/app/providers/AuthProvider', () => ({
  useAuth: () => ({
    session: null,
    initializing: false,
    isGuest: false,
    enterGuest: jest.fn(),
    exitGuest: jest.fn(),
  }),
}));

const network = jest.requireMock('expo-network');
const { supabase } = jest.requireMock('../src/data/supabase/client');
const appleAuth = jest.requireMock('expo-apple-authentication');
const waitForAppleAvailability = () =>
  waitFor(() => expect(appleAuth.isAvailableAsync).toHaveBeenCalled());

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
    appleAuth.isAvailableAsync.mockResolvedValue(false);
    appleAuth.signInAsync.mockReset();
    mockUseAuthRequest.mockReturnValue([null, null, jest.fn()]);
  });

  it('renders all primary copy', async () => {
    appleAuth.isAvailableAsync.mockResolvedValue(true);
    const { getByText, getByPlaceholderText } = render(<AuthScreen />);

    expect(getByText(authCopy.heading)).toBeTruthy();
    expect(getByText(authCopy.subheading)).toBeTruthy();
    expect(getByPlaceholderText(authCopy.emailPlaceholder)).toBeTruthy();
    expect(getByPlaceholderText(authCopy.passwordPlaceholder)).toBeTruthy();
    expect(getByText(authCopy.login)).toBeTruthy();
    expect(getByText(authCopy.forgotPrompt)).toBeTruthy();
    expect(getByText(authCopy.forgotAction)).toBeTruthy();
    expect(getByText(authCopy.divider)).toBeTruthy();
    expect(getByText(authCopy.google)).toBeTruthy();
    expect(getByText(authCopy.signupPrompt)).toBeTruthy();
    expect(getByText(authCopy.signupAction)).toBeTruthy();

    await waitFor(() => {
      expect(getByText(authCopy.apple)).toBeTruthy();
    });
  });

  it('signs in with email and password', async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({ data: {}, error: null });

    const { getByTestId } = render(<AuthScreen />);

    fireEvent.changeText(getByTestId(authCopy.testIds.email), 'user@example.com');
    fireEvent.changeText(getByTestId(authCopy.testIds.password), 'password123');
    fireEvent.press(getByTestId(authCopy.testIds.signin));

    await waitFor(() =>
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'password123',
      })
    );
  });

  it('shows sign-in failed alert when credentials are rejected', async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: {},
      error: { message: 'Invalid credentials' },
    });
    const { getByTestId } = render(<AuthScreen />);

    fireEvent.changeText(getByTestId(authCopy.testIds.email), 'user@example.com');
    fireEvent.changeText(getByTestId(authCopy.testIds.password), 'password123');
    fireEvent.press(getByTestId(authCopy.testIds.signin));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(authCopy.alerts.signInFailed.title, 'Invalid credentials');
    });
  });

  it('shows validation alerts', async () => {
    const { getByTestId } = render(<AuthScreen />);

    fireEvent.press(getByTestId(authCopy.testIds.signin));
    expect(Alert.alert).toHaveBeenCalledWith(
      authCopy.alerts.emailRequired.title,
      authCopy.alerts.emailRequired.message
    );

    fireEvent.changeText(getByTestId(authCopy.testIds.email), 'invalid-email');
    fireEvent.press(getByTestId(authCopy.testIds.signin));
    expect(Alert.alert).toHaveBeenCalledWith(
      authCopy.alerts.invalidEmail.title,
      authCopy.alerts.invalidEmail.message
    );

    fireEvent.changeText(getByTestId(authCopy.testIds.email), 'user@example.com');
    fireEvent.press(getByTestId(authCopy.testIds.signin));
    expect(Alert.alert).toHaveBeenCalledWith(
      authCopy.alerts.passwordRequired.title,
      authCopy.alerts.passwordRequired.message
    );

    await waitForAppleAvailability();
  });

  it('shows offline alert', async () => {
    network.getNetworkStateAsync.mockResolvedValue({ isConnected: false });
    const { getByTestId } = render(<AuthScreen />);

    fireEvent.changeText(getByTestId(authCopy.testIds.email), 'user@example.com');
    fireEvent.changeText(getByTestId(authCopy.testIds.password), 'password123');
    fireEvent.press(getByTestId(authCopy.testIds.signin));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(authCopy.alerts.offline.title, authCopy.alerts.offline.message);
    });
  });

  it('shows google missing token alert', async () => {
    mockUseAuthRequest.mockReturnValue([null, { type: 'success', authentication: {} }, jest.fn()]);
    render(<AuthScreen />);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        authCopy.alerts.googleFailed.title,
        authCopy.alerts.googleFailed.missingToken
      );
    });
  });

  it('shows apple missing token alert', async () => {
    appleAuth.isAvailableAsync.mockResolvedValue(true);
    appleAuth.signInAsync.mockResolvedValue({ identityToken: null });
    const { getByText } = render(<AuthScreen />);

    await waitFor(() => {
      expect(getByText(authCopy.apple)).toBeTruthy();
    });
    fireEvent.press(getByText(authCopy.apple));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        authCopy.alerts.appleFailed.title,
        authCopy.alerts.appleFailed.missingToken
      );
    });
  });

  it('navigates to register and forgot password', async () => {
    const { getByTestId } = render(<AuthScreen />);

    fireEvent.press(getByTestId(authCopy.testIds.register));
    expect(mockNavigate).toHaveBeenCalledWith('Register');

    fireEvent.press(getByTestId(authCopy.testIds.forgot));
    expect(mockNavigate).toHaveBeenCalledWith('ForgotPassword');

    await waitForAppleAvailability();
  });
});
