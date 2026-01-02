import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

import PostDetailScreen from '../src/presentation/screens/PostDetailScreen';
import { RepositoryProvider } from '../src/app/providers/RepositoryProvider';

const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack }),
  useRoute: () => ({
    params: {
      post: {
        id: 1,
        content: 'Hello',
        communityId: 1,
        communityTitle: 'General',
        userId: 'user-1',
        userName: 'Tester',
        likesCount: 0,
        commentsCount: 0,
        isLiked: false,
        isSaved: false,
      },
    },
  }),
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

describe('PostDetailScreen', () => {
  beforeAll(() => {
    process.env.EXPO_PUBLIC_APP_MODE = 'prod';
  });

  beforeEach(() => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    mockGoBack.mockReset();
    network.getNetworkStateAsync.mockReset();
    enqueueWrite.mockReset();
    network.getNetworkStateAsync.mockResolvedValue({ isConnected: true });
  });

  it('loads comments and can add a comment', async () => {
    const postsRepo = {
      likePost: jest.fn(),
      dislikePost: jest.fn(),
      bookmarkPost: jest.fn(),
      unbookmarkPost: jest.fn(),
      deletePost: jest.fn(),
    };
    const commentsRepo = {
      getCommentsForPost: jest.fn().mockResolvedValue([]),
      saveComment: jest.fn().mockResolvedValue({
        id: 10,
        postId: 1,
        userId: 'user-1',
        content: 'Nice',
      }),
    };

    const { getByTestId } = render(
      <RepositoryProvider overrides={{ posts: postsRepo, comments: commentsRepo }}>
        <PostDetailScreen />
      </RepositoryProvider>
    );

    await waitFor(() => expect(getByTestId('post-detail-comments')).toBeTruthy());
    fireEvent.changeText(getByTestId('post-detail-comment-input'), 'Nice');
    fireEvent.press(getByTestId('post-detail-comment-submit'));

    await waitFor(() =>
      expect(commentsRepo.saveComment).toHaveBeenCalledWith({
        id: 0,
        postId: 1,
        userId: 'user-1',
        content: 'Nice',
      })
    );
  });

  it('queues comment when offline', async () => {
    network.getNetworkStateAsync.mockResolvedValue({ isConnected: false });
    const postsRepo = {
      likePost: jest.fn(),
      dislikePost: jest.fn(),
      bookmarkPost: jest.fn(),
      unbookmarkPost: jest.fn(),
      deletePost: jest.fn(),
    };
    const commentsRepo = {
      getCommentsForPost: jest.fn().mockResolvedValue([]),
      saveComment: jest.fn(),
    };

    const { getByTestId } = render(
      <RepositoryProvider overrides={{ posts: postsRepo, comments: commentsRepo }}>
        <PostDetailScreen />
      </RepositoryProvider>
    );

    fireEvent.changeText(getByTestId('post-detail-comment-input'), 'Offline');
    fireEvent.press(getByTestId('post-detail-comment-submit'));

    await waitFor(() =>
      expect(enqueueWrite).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'add_comment',
          payload: { postId: 1, userId: 'user-1', content: 'Offline' },
        })
      )
    );
  });
});
