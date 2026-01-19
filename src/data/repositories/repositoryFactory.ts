import type { CommentRepository } from '../../domain/repositories/CommentRepository';
import type { CommunityRepository } from '../../domain/repositories/CommunityRepository';
import type { PostRepository } from '../../domain/repositories/PostRepository';
import type { UserRepository } from '../../domain/repositories/UserRepository';
import type { PostReportRepository } from '../../domain/repositories/PostReportRepository';
import type { TopicRepository } from '../../domain/repositories/TopicRepository';
import { isMockMode } from '../../config/appConfig';
import { SupabaseCommentRepository } from './SupabaseCommentRepository';
import { SupabaseCommunityRepository } from './SupabaseCommunityRepository';
import { SupabasePostRepository } from './SupabasePostRepository';
import { SupabaseUserRepository } from './SupabaseUserRepository';
import { SupabasePostReportRepository } from './SupabasePostReportRepository';
import { SupabaseTopicRepository } from './SupabaseTopicRepository';
import { MockCommentRepository } from './mock/MockCommentRepository';
import { MockCommunityRepository } from './mock/MockCommunityRepository';
import { MockPostRepository } from './mock/MockPostRepository';
import { MockUserRepository } from './mock/MockUserRepository';
import { MockPostReportRepository } from './mock/MockPostReportRepository';
import { MockTopicRepository } from './mock/MockTopicRepository';

export type RepositoryBundle = {
  posts: PostRepository;
  communities: CommunityRepository;
  users: UserRepository;
  comments: CommentRepository;
  postReports: PostReportRepository;
  topics: TopicRepository;
};

export function createRepositories(): RepositoryBundle {
  if (isMockMode()) {
    return {
      posts: new MockPostRepository(),
      communities: new MockCommunityRepository(),
      users: new MockUserRepository(),
      comments: new MockCommentRepository(),
      postReports: new MockPostReportRepository(),
      topics: new MockTopicRepository(),
    };
  }

  return {
    posts: new SupabasePostRepository(),
    communities: new SupabaseCommunityRepository(),
    users: new SupabaseUserRepository(),
    comments: new SupabaseCommentRepository(),
    postReports: new SupabasePostReportRepository(),
    topics: new SupabaseTopicRepository(),
  };
}
