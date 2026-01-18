import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';

import PostCard from '../src/presentation/components/PostCard';
import { postCardCopy } from '../src/presentation/content/postCardCopy';

describe('PostCard', () => {
  it('renders community image when provided', () => {
    const { getByTestId, getByText } = render(
      <PostCard
        post={{
          id: 1,
          content: 'Hello',
          communityId: 1,
          communityTitle: 'General',
          communityImageUrl: 'https://example.com/community.jpg',
          userId: 'user-1',
          userName: 'Tester',
        }}
      />
    );

    expect(getByTestId('post-community-image-1')).toBeTruthy();
    expect(getByText('General')).toBeTruthy();
    expect(getByText(postCardCopy.postedBy('Tester'))).toBeTruthy();
    expect(getByText(postCardCopy.share)).toBeTruthy();
  });

  it('renders post image when provided', () => {
    const { getByTestId, getByText } = render(
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
    );

    expect(getByTestId('post-image-2')).toBeTruthy();
    expect(getByText(postCardCopy.share)).toBeTruthy();
  });

  it('skips community image when missing', () => {
    const { queryByTestId, getByText } = render(
      <PostCard
        post={{
          id: 2,
          content: 'Hello',
          communityId: 1,
          userId: 'user-1',
          userName: 'Tester',
        }}
      />
    );

    expect(queryByTestId('post-community-image-2')).toBeNull();
    expect(getByText(postCardCopy.communityFallback)).toBeTruthy();
    expect(getByText(postCardCopy.postedBy('Tester'))).toBeTruthy();
  });

  it('shows save option for unsaved posts', () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const { getByTestId } = render(
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
        onToggleSave={jest.fn()}
      />
    );

    fireEvent.press(getByTestId('post-options-3'));

    const alertArgs = alertSpy.mock.calls[0] ?? [];
    const title = alertArgs[0];
    const buttons = alertArgs[2];
    expect(title).toBe(postCardCopy.optionsTitle);
    expect(buttons?.[0]?.text).toBe(postCardCopy.save);
    expect(buttons?.[1]?.text).toBe(postCardCopy.cancel);

    alertSpy.mockRestore();
  });
});
