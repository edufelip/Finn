import type { CommentRepository } from '../../domain/repositories/CommentRepository';
import type { CommunityRepository } from '../../domain/repositories/CommunityRepository';
import type { ChatRepository } from '../../domain/repositories/ChatRepository';
import type { PostRepository } from '../../domain/repositories/PostRepository';
import type { UserRepository } from '../../domain/repositories/UserRepository';
import type { PostReportRepository } from '../../domain/repositories/PostReportRepository';
import type { TopicRepository } from '../../domain/repositories/TopicRepository';
import type { CommunityModeratorRepository } from '../../domain/repositories/CommunityModeratorRepository';
import type { ModerationLogRepository } from '../../domain/repositories/ModerationLogRepository';
import { isMockMode } from '../../config/appConfig';
import { SupabaseCommentRepository } from './SupabaseCommentRepository';
import { SupabaseChatRepository } from './SupabaseChatRepository';
import { SupabaseCommunityRepository } from './SupabaseCommunityRepository';
import { SupabasePostRepository } from './SupabasePostRepository';
import { SupabaseUserRepository } from './SupabaseUserRepository';
import { SupabasePostReportRepository } from './SupabasePostReportRepository';
import { SupabaseTopicRepository } from './SupabaseTopicRepository';
import { SupabaseCommunityModeratorRepository } from './SupabaseCommunityModeratorRepository';
import { SupabaseModerationLogRepository } from './SupabaseModerationLogRepository';
import { MockCommentRepository } from './mock/MockCommentRepository';
import { MockChatRepository } from './mock/MockChatRepository';
import { MockCommunityRepository } from './mock/MockCommunityRepository';
import { MockPostRepository } from './mock/MockPostRepository';
import { MockUserRepository } from './mock/MockUserRepository';
import { MockPostReportRepository } from './mock/MockPostReportRepository';
import { MockTopicRepository } from './mock/MockTopicRepository';
import { MockCommunityModeratorRepository } from './mock/MockCommunityModeratorRepository';
import { MockModerationLogRepository } from './mock/MockModerationLogRepository';

export type RepositoryBundle = {
  chats: ChatRepository;
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
      chats: new MockChatRepository(),
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
    chats: new SupabaseChatRepository(),
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
