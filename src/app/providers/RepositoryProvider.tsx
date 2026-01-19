import React, { createContext, useContext, useMemo } from 'react';

import type { CommentRepository } from '../../domain/repositories/CommentRepository';
import type { CommunityRepository } from '../../domain/repositories/CommunityRepository';
import type { PostRepository } from '../../domain/repositories/PostRepository';
import type { UserRepository } from '../../domain/repositories/UserRepository';
import type { PostReportRepository } from '../../domain/repositories/PostReportRepository';
import type { TopicRepository } from '../../domain/repositories/TopicRepository';
import { createRepositories } from '../../data/repositories/repositoryFactory';

export type RepositoryContextValue = {
  posts: PostRepository;
  communities: CommunityRepository;
  users: UserRepository;
  comments: CommentRepository;
  postReports: PostReportRepository;
  topics: TopicRepository;
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
    posts?: Partial<PostRepository>;
    communities?: Partial<CommunityRepository>;
    users?: Partial<UserRepository>;
    comments?: Partial<CommentRepository>;
    postReports?: Partial<PostReportRepository>;
    topics?: Partial<TopicRepository>;
  };
};

export function RepositoryProvider({ children, overrides }: RepositoryProviderProps) {
  const defaultRepositories = useMemo(() => createRepositories(), []);
  const value = useMemo(
    () => ({
      posts: applyOverrides(defaultRepositories.posts, overrides?.posts),
      communities: applyOverrides(defaultRepositories.communities, overrides?.communities),
      users: applyOverrides(defaultRepositories.users, overrides?.users),
      comments: applyOverrides(defaultRepositories.comments, overrides?.comments),
      postReports: applyOverrides(defaultRepositories.postReports, overrides?.postReports),
      topics: applyOverrides(defaultRepositories.topics, overrides?.topics),
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
