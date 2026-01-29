import type { CommentRepository } from '../../domain/repositories/CommentRepository';
import type { CommunityRepository } from '../../domain/repositories/CommunityRepository';
import type { ChatRepository } from '../../domain/repositories/ChatRepository';
import type { PostRepository } from '../../domain/repositories/PostRepository';
import type { UserRepository } from '../../domain/repositories/UserRepository';
import type { PostReportRepository } from '../../domain/repositories/PostReportRepository';
import type { CommunityReportRepository } from '../../domain/repositories/CommunityReportRepository';
import type { TopicRepository } from '../../domain/repositories/TopicRepository';
import type { CommunityModeratorRepository } from '../../domain/repositories/CommunityModeratorRepository';
import type { ModerationLogRepository } from '../../domain/repositories/ModerationLogRepository';
import type { UserBlockRepository } from '../../domain/repositories/UserBlockRepository';
import type { CommunityBanRepository } from '../../domain/repositories/CommunityBanRepository';
import type { UserBanRepository } from '../../domain/repositories/UserBanRepository';
import type { FeatureConfigRepository } from '../../domain/repositories/FeatureConfigRepository';
import { isMockMode } from '../../config/appConfig';
import { SupabaseCommentRepository } from './SupabaseCommentRepository';
import { SupabaseChatRepository } from './SupabaseChatRepository';
import { SupabaseCommunityRepository } from './SupabaseCommunityRepository';
import { SupabasePostRepository } from './SupabasePostRepository';
import { SupabaseUserRepository } from './SupabaseUserRepository';
import { SupabasePostReportRepository } from './SupabasePostReportRepository';
import { SupabaseCommunityReportRepository } from './SupabaseCommunityReportRepository';
import { SupabaseTopicRepository } from './SupabaseTopicRepository';
import { SupabaseCommunityModeratorRepository } from './SupabaseCommunityModeratorRepository';
import { SupabaseModerationLogRepository } from './SupabaseModerationLogRepository';
import { SupabaseUserBlockRepository } from './SupabaseUserBlockRepository';
import { SupabaseCommunityBanRepository } from './SupabaseCommunityBanRepository';
import { SupabaseUserBanRepository } from './SupabaseUserBanRepository';
import { SupabaseFeatureConfigRepository } from './SupabaseFeatureConfigRepository';
import { MockCommentRepository } from './mock/MockCommentRepository';
import { MockChatRepository } from './mock/MockChatRepository';
import { MockCommunityRepository } from './mock/MockCommunityRepository';
import { MockPostRepository } from './mock/MockPostRepository';
import { MockUserRepository } from './mock/MockUserRepository';
import { MockPostReportRepository } from './mock/MockPostReportRepository';
import { MockCommunityReportRepository } from './mock/MockCommunityReportRepository';
import { MockTopicRepository } from './mock/MockTopicRepository';
import { MockCommunityModeratorRepository } from './mock/MockCommunityModeratorRepository';
import { MockModerationLogRepository } from './mock/MockModerationLogRepository';
import { MockUserBlockRepository } from './mock/MockUserBlockRepository';
import { MockCommunityBanRepository } from './mock/MockCommunityBanRepository';
import { MockUserBanRepository } from './mock/MockUserBanRepository';
import { MockFeatureConfigRepository } from './mock/MockFeatureConfigRepository';

export type RepositoryBundle = {
  chats: ChatRepository;
  posts: PostRepository;
  communities: CommunityRepository;
  users: UserRepository;
  comments: CommentRepository;
  postReports: PostReportRepository;
  communityReports: CommunityReportRepository;
  topics: TopicRepository;
  communityModerators: CommunityModeratorRepository;
  moderationLogs: ModerationLogRepository;
  userBlocks: UserBlockRepository;
  communityBans: CommunityBanRepository;
  userBans: UserBanRepository;
  featureConfigs: FeatureConfigRepository;
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
      communityReports: new MockCommunityReportRepository(),
      topics: new MockTopicRepository(),
      communityModerators: new MockCommunityModeratorRepository(),
      moderationLogs: new MockModerationLogRepository(),
      userBlocks: new MockUserBlockRepository(),
      communityBans: new MockCommunityBanRepository(),
      userBans: new MockUserBanRepository(),
      featureConfigs: new MockFeatureConfigRepository(),
    };
  }

  return {
    chats: new SupabaseChatRepository(),
    posts: new SupabasePostRepository(),
    communities: new SupabaseCommunityRepository(),
    users: new SupabaseUserRepository(),
    comments: new SupabaseCommentRepository(),
    postReports: new SupabasePostReportRepository(),
    communityReports: new SupabaseCommunityReportRepository(),
    topics: new SupabaseTopicRepository(),
    communityModerators: new SupabaseCommunityModeratorRepository(),
    moderationLogs: new SupabaseModerationLogRepository(),
    userBlocks: new SupabaseUserBlockRepository(),
    communityBans: new SupabaseCommunityBanRepository(),
    userBans: new SupabaseUserBanRepository(),
    featureConfigs: new SupabaseFeatureConfigRepository(),
  };
}
