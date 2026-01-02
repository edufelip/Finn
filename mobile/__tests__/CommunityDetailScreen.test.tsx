import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

import CommunityDetailScreen from '../src/presentation/screens/CommunityDetailScreen';
import { RepositoryProvider } from '../src/app/providers/RepositoryProvider';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
  useRoute: () => ({ params: { communityId: 1 } }),
}));

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
const { enqueueWrite } = jest.requireMock('../src/data/offline/queueStore');

describe('CommunityDetailScreen', () => {
  beforeAll(() => {
    process.env.EXPO_PUBLIC_APP_MODE = 'prod';
  });

  beforeEach(() => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    mockNavigate.mockReset();
    mockGoBack.mockReset();
    network.getNetworkStateAsync.mockReset();
    enqueueWrite.mockReset();
  });

  it('loads community details and posts', async () => {
    network.getNetworkStateAsync.mockResolvedValue({ isConnected: true });
    const communitiesRepo = {
      getCommunity: jest.fn().mockResolvedValue({
        id: 1,
        title: 'General',
        description: 'General',
        ownerId: 'user-1',
        imageUrl: 'https://example.com/community.jpg',
      }),
      getCommunitySubscribersCount: jest.fn().mockResolvedValue(3),
      getSubscription: jest.fn().mockResolvedValue(null),
      subscribe: jest.fn().mockResolvedValue({ id: 1, userId: 'user-1', communityId: 1 }),
      unsubscribe: jest.fn().mockResolvedValue(undefined),
      deleteCommunity: jest.fn().mockResolvedValue(undefined),
    };
    const postsRepo = {
      getPostsFromCommunity: jest.fn().mockResolvedValue([
        {
          id: 1,
          content: 'Hello',
          communityId: 1,
          communityTitle: 'General',
          userId: 'user-1',
          userName: 'Tester',
          likesCount: 0,
          commentsCount: 0,
          isLiked: false,
        },
      ]),
      getSavedPosts: jest.fn().mockResolvedValue([]),
      findLike: jest.fn().mockResolvedValue(false),
      likePost: jest.fn(),
      dislikePost: jest.fn(),
      bookmarkPost: jest.fn(),
      unbookmarkPost: jest.fn(),
    };

    const { getByTestId } = render(
      <RepositoryProvider overrides={{ communities: communitiesRepo, posts: postsRepo }}>
        <CommunityDetailScreen />
      </RepositoryProvider>
    );

    await waitFor(() => expect(getByTestId('community-detail-title').props.children).toBe('General'));
    expect(getByTestId('community-detail-image')).toBeTruthy();
    expect(getByTestId('community-detail-description').props.children).toBe('General');
    expect(getByTestId('post-card-1')).toBeTruthy();
  });

  it('subscribes when online', async () => {
    network.getNetworkStateAsync.mockResolvedValue({ isConnected: true });
    const communitiesRepo = {
      getCommunity: jest.fn().mockResolvedValue({
        id: 1,
        title: 'General',
        description: 'General',
        ownerId: 'user-1',
      }),
      getCommunitySubscribersCount: jest.fn().mockResolvedValue(3),
      getSubscription: jest.fn().mockResolvedValue(null),
      subscribe: jest.fn().mockResolvedValue({ id: 11, userId: 'user-1', communityId: 1 }),
      unsubscribe: jest.fn().mockResolvedValue(undefined),
      deleteCommunity: jest.fn(),
    };
    const postsRepo = {
      getPostsFromCommunity: jest.fn().mockResolvedValue([]),
      getSavedPosts: jest.fn().mockResolvedValue([]),
      findLike: jest.fn().mockResolvedValue(false),
      likePost: jest.fn(),
      dislikePost: jest.fn(),
      bookmarkPost: jest.fn(),
      unbookmarkPost: jest.fn(),
    };

    const { getByTestId } = render(
      <RepositoryProvider overrides={{ communities: communitiesRepo, posts: postsRepo }}>
        <CommunityDetailScreen />
      </RepositoryProvider>
    );

    await waitFor(() => expect(getByTestId('community-detail-subscribe')).toBeTruthy());
    fireEvent.press(getByTestId('community-detail-subscribe'));

    await waitFor(() =>
      expect(communitiesRepo.subscribe).toHaveBeenCalledWith({ id: 0, userId: 'user-1', communityId: 1 })
    );
  });

  it('queues subscription when offline', async () => {
    network.getNetworkStateAsync.mockResolvedValue({ isConnected: false });
    const communitiesRepo = {
      getCommunity: jest.fn().mockResolvedValue({
        id: 1,
        title: 'General',
        description: 'General',
        ownerId: 'user-1',
      }),
      getCommunitySubscribersCount: jest.fn().mockResolvedValue(3),
      getSubscription: jest.fn().mockResolvedValue(null),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
      deleteCommunity: jest.fn(),
    };
    const postsRepo = {
      getPostsFromCommunity: jest.fn().mockResolvedValue([]),
      getSavedPosts: jest.fn().mockResolvedValue([]),
      findLike: jest.fn().mockResolvedValue(false),
      likePost: jest.fn(),
      dislikePost: jest.fn(),
      bookmarkPost: jest.fn(),
      unbookmarkPost: jest.fn(),
    };

    const { getByTestId } = render(
      <RepositoryProvider overrides={{ communities: communitiesRepo, posts: postsRepo }}>
        <CommunityDetailScreen />
      </RepositoryProvider>
    );

    await waitFor(() => expect(getByTestId('community-detail-subscribe')).toBeTruthy());
    fireEvent.press(getByTestId('community-detail-subscribe'));

    await waitFor(() =>
      expect(enqueueWrite).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'subscribe_community',
          payload: { id: 0, userId: 'user-1', communityId: 1 },
        })
      )
    );
  });

  it('likes a post', async () => {
    network.getNetworkStateAsync.mockResolvedValue({ isConnected: true });
    const communitiesRepo = {
      getCommunity: jest.fn().mockResolvedValue({
        id: 1,
        title: 'General',
        description: 'General',
        ownerId: 'user-1',
      }),
      getCommunitySubscribersCount: jest.fn().mockResolvedValue(3),
      getSubscription: jest.fn().mockResolvedValue(null),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
      deleteCommunity: jest.fn(),
    };
    const postsRepo = {
      getPostsFromCommunity: jest.fn().mockResolvedValue([
        {
          id: 2,
          content: 'Post',
          communityId: 1,
          communityTitle: 'General',
          userId: 'user-1',
          userName: 'Tester',
          likesCount: 0,
          commentsCount: 0,
          isLiked: false,
        },
      ]),
      getSavedPosts: jest.fn().mockResolvedValue([]),
      findLike: jest.fn().mockResolvedValue(false),
      likePost: jest.fn().mockResolvedValue(undefined),
      dislikePost: jest.fn(),
      bookmarkPost: jest.fn(),
      unbookmarkPost: jest.fn(),
    };

    const { getByTestId } = render(
      <RepositoryProvider overrides={{ communities: communitiesRepo, posts: postsRepo }}>
        <CommunityDetailScreen />
      </RepositoryProvider>
    );

    await waitFor(() => expect(getByTestId('post-like-2')).toBeTruthy());
    fireEvent.press(getByTestId('post-like-2'));

    await waitFor(() => expect(postsRepo.likePost).toHaveBeenCalledWith(2, 'user-1'));
  });

});
