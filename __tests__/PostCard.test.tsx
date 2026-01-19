import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

import PostCard from '../src/presentation/components/PostCard';
import { postCardCopy } from '../src/presentation/content/postCardCopy';
import { RepositoryProvider } from '../src/app/providers/RepositoryProvider';

jest.mock('../src/app/providers/AuthProvider', () => ({
  useAuth: () => ({
    session: { user: { id: 'user-1', email: 'user@example.com' } },
    initializing: false,
  }),
}));

describe('PostCard', () => {
  it('renders user image when provided', () => {
    const { getByTestId, getByText } = render(
      <RepositoryProvider
        overrides={{
          posts: {
            likePost: jest.fn(),
            dislikePost: jest.fn(),
            bookmarkPost: jest.fn(),
            unbookmarkPost: jest.fn(),
          },
        }}
      >
        <PostCard
          post={{
            id: 1,
            content: 'Hello',
            communityId: 1,
            communityTitle: 'General',
            userPhotoUrl: 'https://example.com/user.jpg',
            userId: 'user-1',
            userName: 'Tester',
          }}
        />
      </RepositoryProvider>
    );

    expect(getByTestId('post-user-image-1')).toBeTruthy();
    expect(getByText('Tester')).toBeTruthy();
    expect(getByText('Posted in General')).toBeTruthy();
    expect(getByText(postCardCopy.share)).toBeTruthy();
  });

  it('renders post image when provided', () => {
    const { getByTestId } = render(
      <RepositoryProvider
        overrides={{
          posts: {
            likePost: jest.fn(),
            dislikePost: jest.fn(),
            bookmarkPost: jest.fn(),
            unbookmarkPost: jest.fn(),
          },
        }}
      >
        <PostCard
          post={{
            id: 2,
            content: 'Hello',
            communityId: 1,
            communityTitle: 'General',
            userId: 'user-1',
            userName: 'Tester',
            imageUrl: 'https://example.com/post.jpg',
          }}
        />
      </RepositoryProvider>
    );

    expect(getByTestId('post-image-2')).toBeTruthy();
  });

  it('shows fallback user image when missing', () => {
    const { getByText } = render(
      <RepositoryProvider
        overrides={{
          posts: {
            likePost: jest.fn(),
            dislikePost: jest.fn(),
            bookmarkPost: jest.fn(),
            unbookmarkPost: jest.fn(),
          },
        }}
      >
        <PostCard
          post={{
            id: 2,
            content: 'Hello',
            communityId: 1,
            userId: 'user-1',
            userName: 'Tester',
          }}
        />
      </RepositoryProvider>
    );

    // Should still have header info
    expect(getByText('Tester')).toBeTruthy();
  });

  it('shows save option in modal for unsaved posts', async () => {
    const onToggleSave = jest.fn();
    const { getByTestId, getByText } = render(
      <RepositoryProvider
        overrides={{
          posts: {
            likePost: jest.fn(),
            dislikePost: jest.fn(),
            bookmarkPost: jest.fn(),
            unbookmarkPost: jest.fn(),
          },
        }}
      >
        <PostCard
          post={{
            id: 3,
            content: 'Hello',
            communityId: 1,
            communityTitle: 'General',
            userId: 'user-1',
            userName: 'Tester',
            isSaved: false,
          }}
          onToggleSave={onToggleSave}
        />
      </RepositoryProvider>
    );

    fireEvent.press(getByTestId('post-options-3'));
    
    // Wait for modal to appear and press save
    await waitFor(() => expect(getByTestId('post-option-save')).toBeTruthy());
    expect(getByText('Save')).toBeTruthy();
    
    fireEvent.press(getByTestId('post-option-save'));
    expect(onToggleSave).toHaveBeenCalled();
  });
});