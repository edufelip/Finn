import React, { createContext, useContext, useMemo } from 'react';

import type { CommentRepository } from '../../domain/repositories/CommentRepository';
import type { ChatRepository } from '../../domain/repositories/ChatRepository';
import type { CommunityRepository } from '../../domain/repositories/CommunityRepository';
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
import { createRepositories } from '../../data/repositories/repositoryFactory';

export type RepositoryContextValue = {
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
};

const RepositoryContext = createContext<RepositoryContextValue | undefined>(undefined);

const applyOverrides = <T extends object>(base: T, override?: Partial<T>) => {
  if (!override) {
    return base;
  }
  return Object.assign(Object.create(Object.getPrototypeOf(base)), base, override);
};

type RepositoryProviderProps = {
  children: React.ReactNode;
  overrides?: {
    chats?: Partial<ChatRepository>;
    posts?: Partial<PostRepository>;
    communities?: Partial<CommunityRepository>;
    users?: Partial<UserRepository>;
    comments?: Partial<CommentRepository>;
    postReports?: Partial<PostReportRepository>;
    communityReports?: Partial<CommunityReportRepository>;
    topics?: Partial<TopicRepository>;
    communityModerators?: Partial<CommunityModeratorRepository>;
    moderationLogs?: Partial<ModerationLogRepository>;
    userBlocks?: Partial<UserBlockRepository>;
    communityBans?: Partial<CommunityBanRepository>;
    userBans?: Partial<UserBanRepository>;
  };
};

export function RepositoryProvider({ children, overrides }: RepositoryProviderProps) {
  const defaultRepositories = useMemo(() => createRepositories(), []);
  const value = useMemo(
    () => ({
      chats: applyOverrides(defaultRepositories.chats, overrides?.chats),
      posts: applyOverrides(defaultRepositories.posts, overrides?.posts),
      communities: applyOverrides(defaultRepositories.communities, overrides?.communities),
      users: applyOverrides(defaultRepositories.users, overrides?.users),
      comments: applyOverrides(defaultRepositories.comments, overrides?.comments),
      postReports: applyOverrides(defaultRepositories.postReports, overrides?.postReports),
      communityReports: applyOverrides(defaultRepositories.communityReports, overrides?.communityReports),
      topics: applyOverrides(defaultRepositories.topics, overrides?.topics),
      communityModerators: applyOverrides(defaultRepositories.communityModerators, overrides?.communityModerators),
      moderationLogs: applyOverrides(defaultRepositories.moderationLogs, overrides?.moderationLogs),
      userBlocks: applyOverrides(defaultRepositories.userBlocks, overrides?.userBlocks),
      communityBans: applyOverrides(defaultRepositories.communityBans, overrides?.communityBans),
      userBans: applyOverrides(defaultRepositories.userBans, overrides?.userBans),
    }),
    [defaultRepositories, overrides]
  );

  return <RepositoryContext.Provider value={value}>{children}</RepositoryContext.Provider>;
}

export function useRepositories() {
  const context = useContext(RepositoryContext);
  if (!context) {
    throw new Error('useRepositories must be used within RepositoryProvider');
  }
  return context;
}
