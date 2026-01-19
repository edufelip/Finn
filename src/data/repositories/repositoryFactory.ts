import type { CommentRepository } from '../../domain/repositories/CommentRepository';
import type { CommunityRepository } from '../../domain/repositories/CommunityRepository';
import type { PostRepository } from '../../domain/repositories/PostRepository';
import type { UserRepository } from '../../domain/repositories/UserRepository';
import type { PostReportRepository } from '../../domain/repositories/PostReportRepository';
import type { TopicRepository } from '../../domain/repositories/TopicRepository';
import type { CommunityModeratorRepository } from '../../domain/repositories/CommunityModeratorRepository';
import type { ModerationLogRepository } from '../../domain/repositories/ModerationLogRepository';
import { isMockMode } from '../../config/appConfig';
import { SupabaseCommentRepository } from './SupabaseCommentRepository';
import { SupabaseCommunityRepository } from './SupabaseCommunityRepository';
import { SupabasePostRepository } from './SupabasePostRepository';
import { SupabaseUserRepository } from './SupabaseUserRepository';
import { SupabasePostReportRepository } from './SupabasePostReportRepository';
import { SupabaseTopicRepository } from './SupabaseTopicRepository';
import { SupabaseCommunityModeratorRepository } from './SupabaseCommunityModeratorRepository';
import { SupabaseModerationLogRepository } from './SupabaseModerationLogRepository';
import { MockCommentRepository } from './mock/MockCommentRepository';
import { MockCommunityRepository } from './mock/MockCommunityRepository';
import { MockPostRepository } from './mock/MockPostRepository';
import { MockUserRepository } from './mock/MockUserRepository';
import { MockPostReportRepository } from './mock/MockPostReportRepository';
import { MockTopicRepository } from './mock/MockTopicRepository';
import { MockCommunityModeratorRepository } from './mock/MockCommunityModeratorRepository';
import { MockModerationLogRepository } from './mock/MockModerationLogRepository';

export type RepositoryBundle = {
  posts: PostRepository;
  communities: CommunityRepository;
  users: UserRepository;
  comments: CommentRepository;
  postReports: PostReportRepository;
  topics: TopicRepository;
  communityModerators: CommunityModeratorRepository;
  moderationLogs: ModerationLogRepository;
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
      communityModerators: new MockCommunityModeratorRepository(),
      moderationLogs: new MockModerationLogRepository(),
    };
  }

  return {
    posts: new SupabasePostRepository(),
    communities: new SupabaseCommunityRepository(),
    users: new SupabaseUserRepository(),
    comments: new SupabaseCommentRepository(),
    postReports: new SupabasePostReportRepository(),
    topics: new SupabaseTopicRepository(),
    communityModerators: new SupabaseCommunityModeratorRepository(),
    moderationLogs: new SupabaseModerationLogRepository(),
  };
}
