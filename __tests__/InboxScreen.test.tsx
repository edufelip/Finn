import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import InboxScreen from '../src/presentation/screens/InboxScreen';
import { inboxCopy } from '../src/presentation/content/inboxCopy';
import { RepositoryProvider } from '../src/app/providers/RepositoryProvider';
import { InboxBadgeProvider } from '../src/app/providers/InboxBadgeProvider';

jest.mock('@react-navigation/native', () => ({
  useIsFocused: () => true,
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
}));

jest.mock('@react-navigation/bottom-tabs', () => ({
  useBottomTabBarHeight: () => 80,
}));

jest.mock('../src/app/providers/AuthProvider', () => ({
  useAuth: () => ({
    session: { user: { id: 'user-1' } },
    initializing: false,
    isGuest: false,
    enterGuest: jest.fn(),
    exitGuest: jest.fn(),
  }),
}));

const mockChatRepo = {
  getThreadsForUser: jest.fn().mockResolvedValue([]),
  getMessages: jest.fn().mockResolvedValue([]),
  sendMessage: jest.fn(),
  markAsRead: jest.fn(),
  getMemberStatus: jest.fn().mockResolvedValue(null),
};

const mockUserRepo = {
  getUser: jest.fn().mockResolvedValue(null),
  getUsersBatch: jest.fn().mockResolvedValue(new Map()),
};

describe('InboxScreen', () => {
  it('renders header and tabs', () => {
    const { getByText, getByTestId } = render(
      <RepositoryProvider overrides={{ chats: mockChatRepo, users: mockUserRepo }}>
        <InboxBadgeProvider>
          <InboxScreen />
        </InboxBadgeProvider>
      </RepositoryProvider>
    );

    expect(getByText(inboxCopy.title)).toBeTruthy();
    expect(getByText(inboxCopy.tabs.primary)).toBeTruthy();
    expect(getByText(inboxCopy.tabs.requests)).toBeTruthy();
    expect(getByText(inboxCopy.tabs.archived)).toBeTruthy();
    expect(getByTestId(inboxCopy.testIds.searchInput)).toBeTruthy();
  });

  it('shows empty state for tabs without messages', async () => {
    const { getByTestId, getByText } = render(
      <RepositoryProvider overrides={{ chats: mockChatRepo, users: mockUserRepo }}>
        <InboxBadgeProvider>
          <InboxScreen />
        </InboxBadgeProvider>
      </RepositoryProvider>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(getByTestId(inboxCopy.testIds.tabRequests)).toBeTruthy();
    });

    fireEvent.press(getByTestId(inboxCopy.testIds.tabRequests));

    await waitFor(() => {
      expect(getByText(inboxCopy.empty.title)).toBeTruthy();
      expect(getByText(inboxCopy.empty.body)).toBeTruthy();
    });
  });
});
