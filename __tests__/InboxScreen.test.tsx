import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import InboxScreen from '../src/presentation/screens/InboxScreen';
import { inboxCopy } from '../src/presentation/content/inboxCopy';
import { RepositoryProvider } from '../src/app/providers/RepositoryProvider';
import { InboxBadgeProvider } from '../src/app/providers/InboxBadgeProvider';

const mockSetHasUnread = jest.fn();

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

jest.mock('../src/app/providers/InboxBadgeProvider', () => ({
  useInboxBadge: () => ({
    setHasUnread: mockSetHasUnread,
  }),
  InboxBadgeProvider: ({ children }: { children: React.ReactNode }) => children,
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
  beforeEach(() => {
    mockSetHasUnread.mockClear();
  });

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

  it('does not set unread badge when last message is from the current user', async () => {
    const now = new Date().toISOString();
    const chatRepo = {
      ...mockChatRepo,
      getThreadsForUser: jest.fn().mockImplementation((_userId, filter) => {
        if (filter === 'primary') {
          return Promise.resolve([
            {
              id: 'thread-1',
              participantA: 'user-1',
              participantB: 'user-2',
              createdBy: 'user-1',
              createdAt: now,
              lastMessageAt: now,
              lastMessagePreview: 'Hello',
              lastMessageSenderId: 'user-1',
              requestStatus: 'accepted',
              archivedBy: [],
            },
          ]);
        }
        return Promise.resolve([]);
      }),
      getMemberStatus: jest.fn().mockResolvedValue({ lastReadAt: null }),
    };

    const userRepo = {
      ...mockUserRepo,
      getUsersBatch: jest.fn().mockResolvedValue(new Map([['user-2', { id: 'user-2', name: 'User 2' }]])),
    };

    render(
      <RepositoryProvider overrides={{ chats: chatRepo, users: userRepo }}>
        <InboxBadgeProvider>
          <InboxScreen />
        </InboxBadgeProvider>
      </RepositoryProvider>
    );

    await waitFor(() => {
      expect(mockSetHasUnread).toHaveBeenCalled();
      expect(mockSetHasUnread).not.toHaveBeenCalledWith(true);
    });
  });
});
