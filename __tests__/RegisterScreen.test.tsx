import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

import RegisterScreen from '../src/presentation/screens/RegisterScreen';
import { registerCopy } from '../src/presentation/content/registerCopy';
import { authCopy } from '../src/presentation/content/authCopy';

const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack }),
}));

jest.mock('expo-network', () => ({
  getNetworkStateAsync: jest.fn(),
}));

jest.mock('expo-auth-session', () => ({
  makeRedirectUri: jest.fn(() => 'finn://callback'),
}));

jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
  openAuthSessionAsync: jest.fn().mockResolvedValue({ type: 'cancel' }),
}));

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      scheme: 'finn',
      version: '1.0.0',
    },
  },
}));

jest.mock('expo-apple-authentication', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(false),
  AppleAuthenticationScope: { FULL_NAME: 0, EMAIL: 1 },
  signInAsync: jest.fn(),
}));

jest.mock('expo-crypto', () => ({
  digestStringAsync: jest.fn().mockResolvedValue('hashed-nonce'),
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
}));

jest.mock('../src/data/supabase/client', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithOAuth: jest.fn(),
      setSession: jest.fn(),
      signInWithIdToken: jest.fn(),
    },
  },
}));

const network = jest.requireMock('expo-network');
const { supabase } = jest.requireMock('../src/data/supabase/client');

describe('RegisterScreen', () => {
  beforeAll(() => {
    process.env.EXPO_PUBLIC_APP_MODE = 'prod';
  });

  beforeEach(() => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    mockGoBack.mockReset();
    supabase.auth.signUp.mockReset();
    network.getNetworkStateAsync.mockReset();
    network.getNetworkStateAsync.mockResolvedValue({ isConnected: true });
  });

  it('creates account with name, email, and password', async () => {
    supabase.auth.signUp.mockResolvedValue({ data: {}, error: null });

    const { getByTestId } = render(<RegisterScreen />);

    fireEvent.changeText(getByTestId(registerCopy.testIds.name), 'Jane Doe');
    fireEvent.changeText(getByTestId(registerCopy.testIds.email), 'jane@example.com');
    fireEvent.changeText(getByTestId(registerCopy.testIds.password), 'password123');
    fireEvent.changeText(getByTestId(registerCopy.testIds.confirm), 'password123');
    fireEvent.press(getByTestId(registerCopy.testIds.submit));

    await waitFor(() => {
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'jane@example.com',
        password: 'password123',
        options: {
          data: { name: 'Jane Doe' },
        },
      });
      expect(Alert.alert).toHaveBeenCalledWith(
        registerCopy.alerts.checkEmail.title,
        registerCopy.alerts.checkEmail.message
      );
    });
    expect(mockGoBack).toHaveBeenCalled();
  });

  it('blocks invalid email', async () => {
    const { getByTestId } = render(<RegisterScreen />);

    fireEvent.changeText(getByTestId(registerCopy.testIds.name), 'Jane Doe');
    fireEvent.changeText(getByTestId(registerCopy.testIds.email), 'invalid');
    fireEvent.changeText(getByTestId(registerCopy.testIds.password), 'password123');
    fireEvent.changeText(getByTestId(registerCopy.testIds.confirm), 'password123');
    fireEvent.press(getByTestId(registerCopy.testIds.submit));

    await waitFor(() => {
      expect(supabase.auth.signUp).not.toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith(
        registerCopy.alerts.invalidEmail.title,
        registerCopy.alerts.invalidEmail.message
      );
    });
  });

  it('blocks mismatched passwords', async () => {
    const { getByTestId } = render(<RegisterScreen />);

    fireEvent.changeText(getByTestId(registerCopy.testIds.name), 'Jane Doe');
    fireEvent.changeText(getByTestId(registerCopy.testIds.email), 'jane@example.com');
    fireEvent.changeText(getByTestId(registerCopy.testIds.password), 'password123');
    fireEvent.changeText(getByTestId(registerCopy.testIds.confirm), 'different');
    fireEvent.press(getByTestId(registerCopy.testIds.submit));

    await waitFor(() => {
      expect(supabase.auth.signUp).not.toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith(
        registerCopy.alerts.mismatch.title,
        registerCopy.alerts.mismatch.message
      );
    });
  });

  it('renders registration copy', () => {
    const { getByText, getByPlaceholderText } = render(<RegisterScreen />);

    expect(getByText(registerCopy.title)).toBeTruthy();
    expect(getByPlaceholderText(registerCopy.placeholders.name)).toBeTruthy();
    expect(getByPlaceholderText(registerCopy.placeholders.email)).toBeTruthy();
    expect(getByPlaceholderText(registerCopy.placeholders.password)).toBeTruthy();
    expect(getByPlaceholderText(registerCopy.placeholders.confirm)).toBeTruthy();
    expect(getByText(registerCopy.submit)).toBeTruthy();
    expect(getByText(authCopy.divider)).toBeTruthy();
    expect(getByText(authCopy.google)).toBeTruthy();
  });
});
