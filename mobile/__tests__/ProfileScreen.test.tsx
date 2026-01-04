import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

import ProfileScreen from '../src/presentation/screens/ProfileScreen';
import { RepositoryProvider } from '../src/app/providers/RepositoryProvider';
import { profileCopy } from '../src/presentation/content/profileCopy';
import { formatMonthYear } from '../src/presentation/i18n/formatters';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => {
  const React = require('react');
  return {
    useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn() }),
    useFocusEffect: (effect: () => void | (() => void)) =>
      React.useEffect(() => effect(), [effect]),
  };
});

jest.mock('../src/app/providers/AuthProvider', () => ({
  useAuth: () => ({
    session: { user: { id: 'user-1', email: 'user@example.com' } },
    initializing: false,
  }),
}));

jest.mock('expo-network', () => ({
  getNetworkStateAsync: jest.fn(),
}));

jest.mock('../src/data/offline/queueStore', () => ({
  enqueueWrite: jest.fn(),
}));

const network = jest.requireMock('expo-network');

describe('ProfileScreen', () => {
  beforeAll(() => {
    process.env.EXPO_PUBLIC_APP_MODE = 'prod';
  });

  beforeEach(() => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    mockNavigate.mockReset();
    network.getNetworkStateAsync.mockReset();
    network.getNetworkStateAsync.mockResolvedValue({ isConnected: true });
  });

  it('renders profile info and posts', async () => {
    const usersRepo = {
      getUser: jest.fn().mockResolvedValue({
        id: 'user-1',
        name: 'Jane Doe',
        photoUrl: null,
        createdAt: '2024-01-01T00:00:00Z',
        followersCount: 128,
        followingCount: 45,
      }),
    };
    const postsRepo = {
      getPostsFromUser: jest.fn().mockResolvedValue([
        {
          id: 1,
          content: 'Hello',
          communityId: 1,
          communityTitle: 'General',
          userId: 'user-1',
          userName: 'Jane Doe',
          likesCount: 0,
          commentsCount: 0,
          isLiked: false,
        },
      ]),
      findLike: jest.fn().mockResolvedValue(false),
      likePost: jest.fn().mockResolvedValue(undefined),
      dislikePost: jest.fn().mockResolvedValue(undefined),
      bookmarkPost: jest.fn(),
      unbookmarkPost: jest.fn(),
    };

    const { getByTestId, getByText } = render(
      <RepositoryProvider overrides={{ users: usersRepo, posts: postsRepo }}>
        <ProfileScreen />
      </RepositoryProvider>
    );

    await waitFor(() =>
      expect(getByTestId(profileCopy.testIds.name).props.children).toBe('Jane Doe')
    );
    expect(getByTestId(profileCopy.testIds.email).props.children).toBe('user@example.com');
    const joinedText = profileCopy.memberSince(formatMonthYear('2024-01-01T00:00:00Z'));
    expect(getByTestId(profileCopy.testIds.memberSince).props.children).toContain(joinedText);
    expect(getByText(profileCopy.tabs.posts)).toBeTruthy();
    expect(getByTestId(profileCopy.testIds.statsPosts).props.children).toBe(1);
    expect(getByTestId(profileCopy.testIds.statsFollowers).props.children).toBe(128);
    expect(getByTestId(profileCopy.testIds.statsFollowing).props.children).toBe(45);
    expect(getByTestId('post-card-1')).toBeTruthy();
  });

  it('opens post detail from comments', async () => {
    const usersRepo = {
      getUser: jest.fn().mockResolvedValue({
        id: 'user-1',
        name: 'Jane Doe',
        photoUrl: null,
      }),
    };
    const postsRepo = {
      getPostsFromUser: jest.fn().mockResolvedValue([
        {
          id: 1,
          content: 'Hello',
          communityId: 1,
          communityTitle: 'General',
          userId: 'user-1',
          userName: 'Jane Doe',
          likesCount: 0,
          commentsCount: 0,
          isLiked: false,
        },
      ]),
      findLike: jest.fn().mockResolvedValue(false),
      likePost: jest.fn(),
      dislikePost: jest.fn(),
      bookmarkPost: jest.fn(),
      unbookmarkPost: jest.fn(),
    };

    const { getByTestId } = render(
      <RepositoryProvider overrides={{ users: usersRepo, posts: postsRepo }}>
        <ProfileScreen />
      </RepositoryProvider>
    );

    await waitFor(() => expect(getByTestId('post-comment-1')).toBeTruthy());
    fireEvent.press(getByTestId('post-comment-1'));

    expect(mockNavigate).toHaveBeenCalledWith('PostDetail', {
      post: expect.objectContaining({ id: 1 }),
    });
  });

  it('shows empty state when no posts', async () => {
    const usersRepo = {
      getUser: jest.fn().mockResolvedValue({
        id: 'user-1',
        name: 'Jane Doe',
        photoUrl: null,
      }),
    };
    const postsRepo = {
      getPostsFromUser: jest.fn().mockResolvedValue([]),
      findLike: jest.fn().mockResolvedValue(false),
      likePost: jest.fn(),
      dislikePost: jest.fn(),
      bookmarkPost: jest.fn(),
      unbookmarkPost: jest.fn(),
    };

    const { getByText } = render(
      <RepositoryProvider overrides={{ users: usersRepo, posts: postsRepo }}>
        <ProfileScreen />
      </RepositoryProvider>
    );

    await waitFor(() => expect(getByText(profileCopy.empty.title)).toBeTruthy());
  });

  it('likes a post', async () => {
    const usersRepo = {
      getUser: jest.fn().mockResolvedValue({
        id: 'user-1',
        name: 'Jane Doe',
        photoUrl: null,
      }),
    };
    const postsRepo = {
      getPostsFromUser: jest.fn().mockResolvedValue([
        {
          id: 2,
          content: 'Hello',
          communityId: 1,
          communityTitle: 'General',
          userId: 'user-1',
          userName: 'Jane Doe',
          likesCount: 0,
          commentsCount: 0,
          isLiked: false,
        },
      ]),
      findLike: jest.fn().mockResolvedValue(false),
      likePost: jest.fn().mockResolvedValue(undefined),
      dislikePost: jest.fn().mockResolvedValue(undefined),
      bookmarkPost: jest.fn(),
      unbookmarkPost: jest.fn(),
    };

    const { getByTestId } = render(
      <RepositoryProvider overrides={{ users: usersRepo, posts: postsRepo }}>
        <ProfileScreen />
      </RepositoryProvider>
    );

    await waitFor(() => expect(getByTestId('post-like-2')).toBeTruthy());
    fireEvent.press(getByTestId('post-like-2'));

    await waitFor(() => expect(postsRepo.likePost).toHaveBeenCalledWith(2, 'user-1'));
  });
});
