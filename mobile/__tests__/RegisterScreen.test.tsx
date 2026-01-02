import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

import RegisterScreen from '../src/presentation/screens/RegisterScreen';

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
      signUp: jest.fn(),
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

    fireEvent.changeText(getByTestId('register-name'), 'Jane Doe');
    fireEvent.changeText(getByTestId('register-email'), 'jane@example.com');
    fireEvent.changeText(getByTestId('register-password'), 'password123');
    fireEvent.changeText(getByTestId('register-confirm'), 'password123');
    fireEvent.press(getByTestId('register-submit'));

    await waitFor(() =>
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'jane@example.com',
        password: 'password123',
        options: {
          data: { name: 'Jane Doe' },
        },
      })
    );
    expect(mockGoBack).toHaveBeenCalled();
  });

  it('blocks invalid email', async () => {
    const { getByTestId } = render(<RegisterScreen />);

    fireEvent.changeText(getByTestId('register-name'), 'Jane Doe');
    fireEvent.changeText(getByTestId('register-email'), 'invalid');
    fireEvent.changeText(getByTestId('register-password'), 'password123');
    fireEvent.changeText(getByTestId('register-confirm'), 'password123');
    fireEvent.press(getByTestId('register-submit'));

    await waitFor(() => expect(supabase.auth.signUp).not.toHaveBeenCalled());
  });

  it('blocks mismatched passwords', async () => {
    const { getByTestId } = render(<RegisterScreen />);

    fireEvent.changeText(getByTestId('register-name'), 'Jane Doe');
    fireEvent.changeText(getByTestId('register-email'), 'jane@example.com');
    fireEvent.changeText(getByTestId('register-password'), 'password123');
    fireEvent.changeText(getByTestId('register-confirm'), 'different');
    fireEvent.press(getByTestId('register-submit'));

    await waitFor(() => expect(supabase.auth.signUp).not.toHaveBeenCalled());
  });
});
