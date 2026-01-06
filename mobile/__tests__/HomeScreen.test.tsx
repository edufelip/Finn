import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

import HomeScreen from '../src/presentation/screens/HomeScreen';
import { RepositoryProvider } from '../src/app/providers/RepositoryProvider';
import { homeCopy } from '../src/presentation/content/homeCopy';

const mockNavigate = jest.fn();
const mockUseAuth = jest.fn();

const waitForHomeEffects = async (postsRepo: { getUserFeed: jest.Mock }, usersRepo: { getUser: jest.Mock }) => {
  await waitFor(() => expect(postsRepo.getUserFeed).toHaveBeenCalled());
  await waitFor(() => expect(usersRepo.getUser).toHaveBeenCalled());
};

jest.mock('@react-navigation/native', () => {
  const React = require('react');
  return {
    useNavigation: () => ({
      navigate: mockNavigate,
      getParent: () => ({ openDrawer: jest.fn() }),
    }),
    useFocusEffect: (effect: () => void | (() => void)) =>
      React.useEffect(() => effect(), [effect]),
  };
});

jest.mock('../src/app/providers/AuthProvider', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('HomeScreen', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      session: { user: { id: 'user-1', email: 'user@example.com' } },
      initializing: false,
    });
    mockNavigate.mockReset();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

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
    await waitForHomeEffects(postsRepo, usersRepo);
    expect(getByTestId(homeCopy.testIds.search)).toBeTruthy();
    expect(getByTestId(homeCopy.testIds.feedList)).toBeTruthy();
    expect(getByTestId('post-card-1')).toBeTruthy();
  });

  it('renders empty state copy', async () => {
    const postsRepo = {
      getUserFeed: jest.fn().mockResolvedValue([]),
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
      expect(getByText(homeCopy.emptyTitle)).toBeTruthy();
    });
    await waitForHomeEffects(postsRepo, usersRepo);

    expect(getByText(homeCopy.emptyBody)).toBeTruthy();
    expect(getByText(homeCopy.primaryCta)).toBeTruthy();
    expect(getByText(homeCopy.secondaryCta)).toBeTruthy();
    expect(getByText(homeCopy.tagsTitle)).toBeTruthy();
    homeCopy.tags.forEach((tag) => {
      expect(getByText(tag)).toBeTruthy();
    });
    expect(getByText(homeCopy.searchPlaceholder)).toBeTruthy();
    expect(getByTestId(homeCopy.testIds.notifications)).toBeTruthy();
  });

  it('navigates to notifications from header', async () => {
    const postsRepo = {
      getUserFeed: jest.fn().mockResolvedValue([]),
      likePost: jest.fn(),
      dislikePost: jest.fn(),
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

    await waitForHomeEffects(postsRepo, usersRepo);
    fireEvent.press(getByTestId(homeCopy.testIds.notifications));
    expect(mockNavigate).toHaveBeenCalledWith('Notifications');
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
    await waitForHomeEffects(postsRepo, usersRepo);
  });

  it('shows alert when like fails', async () => {
    const postsRepo = {
      getUserFeed: jest.fn().mockResolvedValue([
        {
          id: 5,
          content: 'Like fail',
          communityId: 1,
          communityTitle: 'General',
          userId: 'user-1',
          userName: 'Tester',
          likesCount: 0,
          commentsCount: 0,
          isLiked: false,
        },
      ]),
      likePost: jest.fn().mockRejectedValue(new Error('boom')),
      dislikePost: jest.fn(),
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

    await waitFor(() => expect(getByTestId('post-like-5')).toBeTruthy());
    fireEvent.press(getByTestId('post-like-5'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(homeCopy.alerts.likeFailed.title, 'boom');
    });
    await waitForHomeEffects(postsRepo, usersRepo);
  });

  it('shows alert when save fails', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
      if (buttons && buttons[0] && buttons[0].onPress) {
        buttons[0].onPress();
      }
    });

    const postsRepo = {
      getUserFeed: jest.fn().mockResolvedValue([
        {
          id: 6,
          content: 'Save fail',
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
      bookmarkPost: jest.fn().mockRejectedValue(new Error('save-error')),
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

    await waitFor(() => expect(getByTestId('post-options-6')).toBeTruthy());
    fireEvent.press(getByTestId('post-options-6'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(homeCopy.alerts.savedFailed.title, 'save-error');
    });
    await waitForHomeEffects(postsRepo, usersRepo);

    alertSpy.mockRestore();
  });

  it('shows sign-in required alert when session is missing', async () => {
    const postsRepo = {
      getUserFeed: jest.fn().mockResolvedValue([
        {
          id: 7,
          content: 'Sign in',
          communityId: 1,
          communityTitle: 'General',
          userId: 'user-1',
          userName: 'Tester',
          likesCount: 0,
          commentsCount: 0,
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

    const { getByTestId, rerender } = render(
      <RepositoryProvider overrides={{ posts: postsRepo, users: usersRepo }}>
        <HomeScreen />
      </RepositoryProvider>
    );

    await waitFor(() => expect(getByTestId('post-like-7')).toBeTruthy());
    mockUseAuth.mockReturnValue({ session: null, initializing: false });
    rerender(
      <RepositoryProvider overrides={{ posts: postsRepo, users: usersRepo }}>
        <HomeScreen />
      </RepositoryProvider>
    );

    fireEvent.press(getByTestId('post-like-7'));
    expect(Alert.alert).toHaveBeenCalledWith(
      homeCopy.alerts.signInRequired.title,
      homeCopy.alerts.signInRequired.message
    );
    await waitForHomeEffects(postsRepo, usersRepo);
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
    await waitForHomeEffects(postsRepo, usersRepo);
    alertSpy.mockRestore();
  });
});
