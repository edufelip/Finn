import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

import HomeScreen from '../src/presentation/screens/HomeScreen';
import { RepositoryProvider } from '../src/app/providers/RepositoryProvider';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    getParent: () => ({ openDrawer: jest.fn() }),
  }),
}));

jest.mock('../src/app/providers/AuthProvider', () => ({
  useAuth: () => ({
    session: { user: { id: 'user-1', email: 'user@example.com' } },
    initializing: false,
  }),
}));

describe('HomeScreen', () => {
  it('renders posts and search entry', async () => {
    const postsRepo = {
      getUserFeed: jest.fn().mockResolvedValue([
        {
          id: 1,
          content: 'Hello world',
          communityId: 1,
          communityTitle: 'General',
          userId: 'user-1',
          userName: 'Tester',
          likesCount: 2,
          commentsCount: 1,
          isLiked: false,
        },
      ]),
      likePost: jest.fn(),
      dislikePost: jest.fn(),
      bookmarkPost: jest.fn(),
      unbookmarkPost: jest.fn(),
    };

    const usersRepo = {
      getUser: jest.fn().mockResolvedValue({ id: 'user-1', name: 'Tester' }),
    };

    const { getByText, getByTestId } = render(
      <RepositoryProvider overrides={{ posts: postsRepo, users: usersRepo }}>
        <HomeScreen />
      </RepositoryProvider>
    );

    await waitFor(() => {
      expect(getByText('Hello world')).toBeTruthy();
    });
    expect(getByTestId('home-search')).toBeTruthy();
    expect(getByTestId('home-feed-list')).toBeTruthy();
    expect(getByTestId('post-card-1')).toBeTruthy();
  });

  it('toggles like on a post', async () => {
    const postsRepo = {
      getUserFeed: jest.fn().mockResolvedValue([
        {
          id: 2,
          content: 'Like me',
          communityId: 1,
          communityTitle: 'General',
          userId: 'user-1',
          userName: 'Tester',
          likesCount: 0,
          commentsCount: 0,
          isLiked: false,
        },
      ]),
      likePost: jest.fn().mockResolvedValue(undefined),
      dislikePost: jest.fn().mockResolvedValue(undefined),
      bookmarkPost: jest.fn(),
      unbookmarkPost: jest.fn(),
    };

    const usersRepo = {
      getUser: jest.fn().mockResolvedValue({ id: 'user-1', name: 'Tester' }),
    };

    const { getByTestId } = render(
      <RepositoryProvider overrides={{ posts: postsRepo, users: usersRepo }}>
        <HomeScreen />
      </RepositoryProvider>
    );

    await waitFor(() => expect(getByTestId('post-like-2')).toBeTruthy());
    fireEvent.press(getByTestId('post-like-2'));

    await waitFor(() => {
      expect(postsRepo.likePost).toHaveBeenCalledWith(2, 'user-1');
    });
  });

  it('saves a post via options menu', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
      if (buttons && buttons[0] && buttons[0].onPress) {
        buttons[0].onPress();
      }
    });

    const postsRepo = {
      getUserFeed: jest.fn().mockResolvedValue([
        {
          id: 3,
          content: 'Save me',
          communityId: 1,
          communityTitle: 'General',
          userId: 'user-1',
          userName: 'Tester',
          likesCount: 0,
          commentsCount: 0,
          isLiked: false,
          isSaved: false,
        },
      ]),
      likePost: jest.fn(),
      dislikePost: jest.fn(),
      bookmarkPost: jest.fn().mockResolvedValue(undefined),
      unbookmarkPost: jest.fn().mockResolvedValue(undefined),
    };

    const usersRepo = {
      getUser: jest.fn().mockResolvedValue({ id: 'user-1', name: 'Tester' }),
    };

    const { getByTestId } = render(
      <RepositoryProvider overrides={{ posts: postsRepo, users: usersRepo }}>
        <HomeScreen />
      </RepositoryProvider>
    );

    await waitFor(() => expect(getByTestId('post-options-3')).toBeTruthy());
    fireEvent.press(getByTestId('post-options-3'));

    await waitFor(() => expect(postsRepo.bookmarkPost).toHaveBeenCalledWith(3, 'user-1'));
    alertSpy.mockRestore();
  });
});
