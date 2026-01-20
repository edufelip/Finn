import type { ModerationStatus, Post } from '../models/post';

export interface PostRepository {
  getUserFeed(userId: string, page: number): Promise<Post[]>;
  getFollowingFeed(userId: string, page: number): Promise<Post[]>;
  getPublicFeed(page: number): Promise<Post[]>;
  getPostsFromCommunity(communityId: number, page: number): Promise<Post[]>;
  getPostsFromUser(userId: string, page: number): Promise<Post[]>;
  getSavedPosts(userId: string, page: number): Promise<Post[]>;
  getSavedPostsCount(userId: string): Promise<number>;
  getPendingPosts(communityId: number): Promise<Post[]>;
  getPostLikes(postId: number): Promise<number>;
  findLike(postId: number, userId: string): Promise<boolean>;
  findSavedPost(postId: number, userId: string): Promise<boolean>;
  likePost(postId: number, userId: string): Promise<void>;
  dislikePost(postId: number, userId: string): Promise<void>;
  bookmarkPost(postId: number, userId: string): Promise<void>;
  unbookmarkPost(postId: number, userId: string): Promise<void>;
  savePost(post: Post, imageUri?: string | null): Promise<Post>;
  updateModerationStatus(postId: number, status: ModerationStatus): Promise<void>;
  markPostForReview(postId: number): Promise<void>;
  deletePost(postId: number): Promise<void>;
}
