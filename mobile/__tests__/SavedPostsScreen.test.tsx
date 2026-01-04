import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

import SavedPostsScreen from '../src/presentation/screens/SavedPostsScreen';
import { RepositoryProvider } from '../src/app/providers/RepositoryProvider';
import { savedPostsCopy } from '../src/presentation/content/savedPostsCopy';
import { postCardCopy } from '../src/presentation/content/postCardCopy';

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
const { enqueueWrite } = jest.requireMock('../src/data/offline/queueStore');

describe('SavedPostsScreen', () => {
  beforeAll(() => {
    process.env.EXPO_PUBLIC_APP_MODE = 'prod';
  });

  beforeEach(() => {
    mockNavigate.mockReset();
    network.getNetworkStateAsync.mockReset();
    enqueueWrite.mockReset();
    network.getNetworkStateAsync.mockResolvedValue({ isConnected: true });
  });

  it('loads saved posts and can unsave online', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
      if (buttons && buttons[0] && buttons[0].onPress) {
        buttons[0].onPress();
      }
    });

    const postsRepo = {
      getSavedPosts: jest.fn().mockResolvedValue([
        {
          id: 1,
          content: 'Saved post',
          communityId: 1,
          communityTitle: 'General',
          userId: 'user-1',
          userName: 'Tester',
          likesCount: 0,
          commentsCount: 0,
          isLiked: false,
          isSaved: true,
        },
      ]),
      findLike: jest.fn().mockResolvedValue(false),
      likePost: jest.fn(),
      dislikePost: jest.fn(),
      bookmarkPost: jest.fn(),
      unbookmarkPost: jest.fn().mockResolvedValue(undefined),
    };

    const { getByTestId } = render(
      <RepositoryProvider overrides={{ posts: postsRepo }}>
        <SavedPostsScreen />
      </RepositoryProvider>
    );

    await waitFor(() => expect(getByTestId('post-options-1')).toBeTruthy());
    fireEvent.press(getByTestId('post-options-1'));

    await waitFor(() => expect(postsRepo.unbookmarkPost).toHaveBeenCalledWith(1, 'user-1'));
    const alertArgs = alertSpy.mock.calls[0] ?? [];
    const title = alertArgs[0];
    const buttons = alertArgs[2];
    expect(title).toBe(postCardCopy.optionsTitle);
    expect(buttons?.[0]?.text).toBe(postCardCopy.unsave);
    expect(buttons?.[1]?.text).toBe(postCardCopy.cancel);
    alertSpy.mockRestore();
  });

  it('queues unsave when offline', async () => {
    network.getNetworkStateAsync.mockResolvedValue({ isConnected: false });
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
      if (buttons && buttons[0] && buttons[0].onPress) {
        buttons[0].onPress();
      }
    });

    const postsRepo = {
      getSavedPosts: jest.fn().mockResolvedValue([
        {
          id: 2,
          content: 'Saved post',
          communityId: 1,
          communityTitle: 'General',
          userId: 'user-1',
          userName: 'Tester',
          likesCount: 0,
          commentsCount: 0,
          isLiked: false,
          isSaved: true,
        },
      ]),
      findLike: jest.fn().mockResolvedValue(false),
      likePost: jest.fn(),
      dislikePost: jest.fn(),
      bookmarkPost: jest.fn(),
      unbookmarkPost: jest.fn(),
    };

    const { getByTestId } = render(
      <RepositoryProvider overrides={{ posts: postsRepo }}>
        <SavedPostsScreen />
      </RepositoryProvider>
    );

    await waitFor(() => expect(getByTestId('post-options-2')).toBeTruthy());
    fireEvent.press(getByTestId('post-options-2'));

    await waitFor(() =>
      expect(enqueueWrite).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'unsave_post',
          payload: { postId: 2, userId: 'user-1' },
        })
      )
    );
    expect(alertSpy).toHaveBeenCalledWith(
      savedPostsCopy.alerts.offline.title,
      savedPostsCopy.alerts.offline.message
    );

    alertSpy.mockRestore();
  });

  it('renders saved posts header copy', async () => {
    const postsRepo = {
      getSavedPosts: jest.fn().mockResolvedValue([]),
      findLike: jest.fn().mockResolvedValue(false),
      likePost: jest.fn(),
      dislikePost: jest.fn(),
      bookmarkPost: jest.fn(),
      unbookmarkPost: jest.fn(),
    };

    const { getByText, getByTestId } = render(
      <RepositoryProvider overrides={{ posts: postsRepo }}>
        <SavedPostsScreen />
      </RepositoryProvider>
    );

    await waitFor(() => expect(getByTestId(savedPostsCopy.testIds.list)).toBeTruthy());
    expect(getByText(savedPostsCopy.title)).toBeTruthy();
  });
});
