import React from 'react';
import { render } from '@testing-library/react-native';

import PostCard from '../src/presentation/components/PostCard';

describe('PostCard', () => {
  it('renders community image when provided', () => {
    const { getByTestId } = render(
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
  });

  it('renders post image when provided', () => {
    const { getByTestId } = render(
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
  });

  it('skips community image when missing', () => {
    const { queryByTestId } = render(
      <PostCard
        post={{
          id: 2,
          content: 'Hello',
          communityId: 1,
          communityTitle: 'General',
          userId: 'user-1',
          userName: 'Tester',
        }}
      />
    );

    expect(queryByTestId('post-community-image-2')).toBeNull();
  });
});
