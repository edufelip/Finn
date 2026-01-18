import type { Comment } from '../../../domain/models/comment';
import type { Community } from '../../../domain/models/community';
import type { Post } from '../../../domain/models/post';
import type { Subscription } from '../../../domain/models/subscription';

type SavedPost = {
  postId: number;
  userId: string;
};

export const mockCommunities: Community[] = [
  {
    id: 1,
    title: 'General',
    description: 'General discussions',
    ownerId: 'mock-user',
  },
  {
    id: 2,
    title: 'Tech',
    description: 'Technology updates',
    ownerId: 'mock-user',
  },
];

const initialSubscriptions: Subscription[] = [];
const initialSavedPosts: SavedPost[] = [];
export const mockSubscriptions: Subscription[] = [...initialSubscriptions];
export const mockSavedPosts: SavedPost[] = [...initialSavedPosts];

let postId = 2;
let commentId = 1;
let communityId = mockCommunities.reduce((max, community) => Math.max(max, community.id), 0);
let subscriptionId = initialSubscriptions.length;

export const mockPosts: Post[] = [
  {
    id: 1,
    content: 'Welcome to Finn!',
    communityId: 1,
    communityTitle: 'General',
    userId: 'mock-user',
    userName: 'Mock User',
    likesCount: 3,
    commentsCount: 1,
    isLiked: false,
    isSaved: false,
  },
  {
    id: 2,
    content: 'Share your first post.',
    communityId: 2,
    communityTitle: 'Tech',
    userId: 'mock-user',
    userName: 'Mock User',
    likesCount: 1,
    commentsCount: 0,
    isLiked: false,
    isSaved: false,
  },
];

export const mockComments: Comment[] = [
  {
    id: 1,
    postId: 1,
    userId: 'mock-user',
    userName: 'Mock User',
    content: 'Glad you are here!',
  },
];

export function nextPostId() {
  postId += 1;
  return postId;
}

export function nextCommentId() {
  commentId += 1;
  return commentId;
}

export function nextCommunityId() {
  communityId += 1;
  return communityId;
}

export function nextSubscriptionId() {
  subscriptionId += 1;
  return subscriptionId;
}

export function resetMockData() {
  postId = mockPosts.length;
  commentId = mockComments.length;
  communityId = mockCommunities.reduce((max, community) => Math.max(max, community.id), 0);
  subscriptionId = initialSubscriptions.length;
  mockSubscriptions.splice(0, mockSubscriptions.length, ...initialSubscriptions);
  mockSavedPosts.splice(0, mockSavedPosts.length, ...initialSavedPosts);
}
