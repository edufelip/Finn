import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

import PostCommentsScreen from '../src/presentation/screens/PostCommentsScreen';
import { RepositoryProvider } from '../src/app/providers/RepositoryProvider';

jest.mock('@react-navigation/native', () => ({
  useRoute: () => ({ params: { postId: 1 } }),
  useNavigation: () => ({ goBack: jest.fn() }),
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

describe('PostCommentsScreen', () => {
  beforeAll(() => {
    process.env.EXPO_PUBLIC_APP_MODE = 'prod';
  });

  beforeEach(() => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    enqueueWrite.mockReset();
    network.getNetworkStateAsync.mockReset();
  });

  it('loads comments and creates a new comment when online', async () => {
    network.getNetworkStateAsync.mockResolvedValue({ isConnected: true });
    const commentsRepo = {
      getCommentsForPost: jest.fn().mockResolvedValue([
        {
          id: 1,
          postId: 1,
          userId: 'user-2',
          userName: 'Other',
          content: 'Nice post',
        },
      ]),
      saveComment: jest.fn().mockResolvedValue({
        id: 2,
        postId: 1,
        userId: 'user-1',
        userName: 'Me',
        content: 'Thanks!',
      }),
    };

    const { getByText, getByTestId } = render(
      <RepositoryProvider overrides={{ comments: commentsRepo }}>
        <PostCommentsScreen />
      </RepositoryProvider>
    );

    await waitFor(() => expect(getByText('Nice post')).toBeTruthy());
    fireEvent.changeText(getByTestId('comment-input'), 'Thanks!');
    fireEvent.press(getByTestId('comment-submit'));

    await waitFor(() => {
      expect(commentsRepo.saveComment).toHaveBeenCalled();
      expect(getByText('Thanks!')).toBeTruthy();
    });
  });

  it('queues a comment when offline', async () => {
    network.getNetworkStateAsync.mockResolvedValue({ isConnected: false });
    const commentsRepo = {
      getCommentsForPost: jest.fn().mockResolvedValue([]),
      saveComment: jest.fn(),
    };

    const { getByTestId, getByText } = render(
      <RepositoryProvider overrides={{ comments: commentsRepo }}>
        <PostCommentsScreen />
      </RepositoryProvider>
    );

    fireEvent.changeText(getByTestId('comment-input'), 'Offline comment');
    fireEvent.press(getByTestId('comment-submit'));

    await waitFor(() => {
      expect(enqueueWrite).toHaveBeenCalled();
      expect(getByText('Offline comment')).toBeTruthy();
    });
  });
});
