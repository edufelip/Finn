import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import InboxScreen from '../src/presentation/screens/InboxScreen';
import { inboxCopy } from '../src/presentation/content/inboxCopy';

jest.mock('@react-navigation/native', () => ({
  useIsFocused: () => true,
}));

jest.mock('@react-navigation/bottom-tabs', () => ({
  useBottomTabBarHeight: () => 80,
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

describe('InboxScreen', () => {
  it('renders header and tabs', () => {
    const { getByText, getByTestId } = render(<InboxScreen />);

    expect(getByText(inboxCopy.title)).toBeTruthy();
    expect(getByText(inboxCopy.tabs.primary)).toBeTruthy();
    expect(getByText(inboxCopy.tabs.requests)).toBeTruthy();
    expect(getByText(inboxCopy.tabs.archived)).toBeTruthy();
    expect(getByTestId(inboxCopy.testIds.searchInput)).toBeTruthy();
  });

  it('shows empty state for tabs without messages', () => {
    const { getByTestId, getByText } = render(<InboxScreen />);

    fireEvent.press(getByTestId(inboxCopy.testIds.tabRequests));

    expect(getByText(inboxCopy.empty.title)).toBeTruthy();
    expect(getByText(inboxCopy.empty.body)).toBeTruthy();
  });
});
