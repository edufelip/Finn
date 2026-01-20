import type { Post } from '../../../domain/models/post';
import type { PostRepository } from '../../../domain/repositories/PostRepository';
import { mockPosts, mockSavedPosts, nextPostId } from './mockData';

export class MockPostRepository implements PostRepository {
  async getUserFeed(_userId: string, _page: number): Promise<Post[]> {
    return [...mockPosts].sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
  }

  async getFollowingFeed(_userId: string, _page: number): Promise<Post[]> {
    return [...mockPosts].sort((a, b) => (b.id ?? 0) - (a.id ?? 0)).slice(0, 5);
  }

  async getPublicFeed(_page: number): Promise<Post[]> {
    return [...mockPosts].sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
  }

  async getPostsFromCommunity(communityId: number, _page: number): Promise<Post[]> {
    return mockPosts.filter((post) => post.communityId === communityId);
  }

  async getPostsFromUser(userId: string, _page: number): Promise<Post[]> {
    return mockPosts.filter((post) => post.userId === userId);
  }

  async getSavedPosts(userId: string, _page: number): Promise<Post[]> {
    const savedIds = mockSavedPosts.filter((saved) => saved.userId === userId).map((saved) => saved.postId);
    const savedPosts = savedIds
      .map((id) => mockPosts.find((post) => post.id === id))
      .filter((post): post is Post => Boolean(post));
    return savedPosts.map((post) => ({ ...post, isSaved: true }));
  }

  async getSavedPostsCount(userId: string): Promise<number> {
    return mockSavedPosts.filter((saved) => saved.userId === userId).length;
  }

  async getPostLikes(postId: number): Promise<number> {
    const post = mockPosts.find((item) => item.id === postId);
    return post?.likesCount ?? 0;
  }

  async findLike(postId: number, _userId: string): Promise<boolean> {
    const post = mockPosts.find((item) => item.id === postId);
    return Boolean(post?.isLiked);
  }

  async findSavedPost(postId: number, userId: string): Promise<boolean> {
    return mockSavedPosts.some((saved) => saved.postId === postId && saved.userId === userId);
  }

  async likePost(postId: number, _userId: string): Promise<void> {
    const post = mockPosts.find((item) => item.id === postId);
    if (!post) return;
    if (!post.isLiked) {
      post.isLiked = true;
      post.likesCount = (post.likesCount ?? 0) + 1;
    }
  }

  async dislikePost(postId: number, _userId: string): Promise<void> {
    const post = mockPosts.find((item) => item.id === postId);
    if (!post) return;
    if (post.isLiked) {
      post.isLiked = false;
      post.likesCount = Math.max(0, (post.likesCount ?? 0) - 1);
    }
  }

  async bookmarkPost(postId: number, userId: string): Promise<void> {
    if (mockSavedPosts.some((saved) => saved.postId === postId && saved.userId === userId)) {
      return;
    }
    mockSavedPosts.unshift({ postId, userId });
    const post = mockPosts.find((item) => item.id === postId);
    if (post) {
      post.isSaved = true;
    }
  }

  async unbookmarkPost(postId: number, userId: string): Promise<void> {
    const index = mockSavedPosts.findIndex((saved) => saved.postId === postId && saved.userId === userId);
    if (index >= 0) {
      mockSavedPosts.splice(index, 1);
    }
    const post = mockPosts.find((item) => item.id === postId);
    if (post) {
      post.isSaved = false;
    }
  }

  async savePost(post: Post, imageUri?: string | null): Promise<Post> {
    const created: Post = {
      ...post,
      id: nextPostId(),
      communityTitle: post.communityTitle ?? 'General',
      userName: post.userName ?? 'Mock User',
      likesCount: 0,
      commentsCount: 0,
      isLiked: false,
      isSaved: false,
      imageUrl: imageUri ?? post.imageUrl ?? null,
    };
    mockPosts.unshift(created);
    return created;
  }

  async getPendingPosts(communityId: number): Promise<Post[]> {
    return mockPosts.filter(
      (post) => post.communityId === communityId && post.moderationStatus === 'pending'
    );
  }

  async updateModerationStatus(postId: number, status: Post['moderationStatus']): Promise<void> {
    const post = mockPosts.find((p) => p.id === postId);
    if (post) {
      post.moderationStatus = status;
    }
  }

  async markPostForReview(postId: number): Promise<void> {
    const post = mockPosts.find((p) => p.id === postId);
    if (post) {
      post.moderationStatus = 'pending';
    }
  }

  async deletePost(postId: number): Promise<void> {
    const index = mockPosts.findIndex((post) => post.id === postId);
    if (index >= 0) {
      mockPosts.splice(index, 1);
    }
  }
}
