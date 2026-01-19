import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

import PostDetailScreen from '../src/presentation/screens/PostDetailScreen';
import { RepositoryProvider } from '../src/app/providers/RepositoryProvider';
import { postDetailCopy } from '../src/presentation/content/postDetailCopy';

const mockGoBack = jest.fn();

const mockPost = {
  id: 1,
  content: 'Test Post',
  userId: 'user-1',
  userName: 'User',
  likesCount: 0,
  commentsCount: 0,
  isLiked: false,
  isSaved: false,
};

jest.mock('@react-navigation/native', () => ({
  useRoute: () => ({
    params: {
      post: mockPost,
    },
  }),
  useNavigation: () => ({ goBack: jest.fn(), navigate: jest.fn() }),
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
      getCommentsForPost: jest.fn().mockResolvedValue([
        {
          id: 5,
          postId: 1,
          userId: 'user-2',
          userName: 'Other',
          content: 'Hello',
        },
      ]),
      saveComment: jest.fn().mockResolvedValue({
        id: 10,
        postId: 1,
        userId: 'user-1',
        content: 'Nice',
      }),
    };

    const { getByTestId, getByText } = render(
      <RepositoryProvider overrides={{ posts: postsRepo, comments: commentsRepo }}>
        <PostDetailScreen />
      </RepositoryProvider>
    );

    await waitFor(() => expect(getByTestId(postDetailCopy.testIds.list)).toBeTruthy());
    expect(getByText(postDetailCopy.commentsTitle)).toBeTruthy();
    expect(getByText(postDetailCopy.commentAge)).toBeTruthy();
    fireEvent.changeText(getByTestId(postDetailCopy.testIds.input), 'Nice');
    fireEvent.press(getByTestId(postDetailCopy.testIds.submit));

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

    fireEvent.changeText(getByTestId(postDetailCopy.testIds.input), 'Offline');
    fireEvent.press(getByTestId(postDetailCopy.testIds.submit));

    await waitFor(() => {
      expect(enqueueWrite).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'add_comment',
          payload: { postId: 1, userId: 'user-1', content: 'Offline' },
        })
      );
      expect(Alert.alert).toHaveBeenCalledWith(
        postDetailCopy.alerts.offline.title,
        postDetailCopy.alerts.offline.message
      );
    });
  });

  it('shows empty comments copy', async () => {
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

    const { getByText } = render(
      <RepositoryProvider overrides={{ posts: postsRepo, comments: commentsRepo }}>
        <PostDetailScreen />
      </RepositoryProvider>
    );

    await waitFor(() => expect(getByText(postDetailCopy.empty)).toBeTruthy());
  });
});
