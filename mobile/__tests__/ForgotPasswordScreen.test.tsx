import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

import ForgotPasswordScreen from '../src/presentation/screens/ForgotPasswordScreen';

const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack }),
}));

jest.mock('expo-network', () => ({
  getNetworkStateAsync: jest.fn(),
}));

jest.mock('../src/data/supabase/client', () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: jest.fn(),
    },
  },
}));

const network = jest.requireMock('expo-network');
const { supabase } = jest.requireMock('../src/data/supabase/client');

describe('ForgotPasswordScreen', () => {
  beforeAll(() => {
    process.env.EXPO_PUBLIC_APP_MODE = 'prod';
  });

  beforeEach(() => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    mockGoBack.mockReset();
    supabase.auth.resetPasswordForEmail.mockReset();
    network.getNetworkStateAsync.mockReset();
    network.getNetworkStateAsync.mockResolvedValue({ isConnected: true });
  });

  it('requests a password reset email', async () => {
    supabase.auth.resetPasswordForEmail.mockResolvedValue({ data: {}, error: null });

    const { getByTestId } = render(<ForgotPasswordScreen />);

    fireEvent.changeText(getByTestId('forgot-email'), 'user@example.com');
    fireEvent.press(getByTestId('forgot-submit'));

    await waitFor(() =>
      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('user@example.com')
    );
  });

  it('blocks invalid email', async () => {
    const { getByTestId } = render(<ForgotPasswordScreen />);

    fireEvent.changeText(getByTestId('forgot-email'), 'invalid');
    fireEvent.press(getByTestId('forgot-submit'));

    await waitFor(() => expect(supabase.auth.resetPasswordForEmail).not.toHaveBeenCalled());
  });
});
