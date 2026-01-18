import type { CommentRepository } from '../../domain/repositories/CommentRepository';
import type { CommunityRepository } from '../../domain/repositories/CommunityRepository';
import type { PostRepository } from '../../domain/repositories/PostRepository';
import type { UserRepository } from '../../domain/repositories/UserRepository';
import { isMockMode } from '../../config/appConfig';
import { SupabaseCommentRepository } from './SupabaseCommentRepository';
import { SupabaseCommunityRepository } from './SupabaseCommunityRepository';
import { SupabasePostRepository } from './SupabasePostRepository';
import { SupabaseUserRepository } from './SupabaseUserRepository';
import { MockCommentRepository } from './mock/MockCommentRepository';
import { MockCommunityRepository } from './mock/MockCommunityRepository';
import { MockPostRepository } from './mock/MockPostRepository';
import { MockUserRepository } from './mock/MockUserRepository';

export type RepositoryBundle = {
  posts: PostRepository;
  communities: CommunityRepository;
  users: UserRepository;
  comments: CommentRepository;
};

export function createRepositories(): RepositoryBundle {
  if (isMockMode()) {
    return {
      posts: new MockPostRepository(),
      communities: new MockCommunityRepository(),
      users: new MockUserRepository(),
      comments: new MockCommentRepository(),
    };
  }

  return {
    posts: new SupabasePostRepository(),
    communities: new SupabaseCommunityRepository(),
    users: new SupabaseUserRepository(),
    comments: new SupabaseCommentRepository(),
  };
}
