import React, { createContext, useContext, useMemo } from 'react';

import type { CommentRepository } from '../../domain/repositories/CommentRepository';
import type { CommunityRepository } from '../../domain/repositories/CommunityRepository';
import type { PostRepository } from '../../domain/repositories/PostRepository';
import type { UserRepository } from '../../domain/repositories/UserRepository';
import { createRepositories } from '../../data/repositories/repositoryFactory';

export type RepositoryContextValue = {
  posts: PostRepository;
  communities: CommunityRepository;
  users: UserRepository;
  comments: CommentRepository;
};

const RepositoryContext = createContext<RepositoryContextValue | undefined>(undefined);

type RepositoryProviderProps = {
  children: React.ReactNode;
  overrides?: Partial<RepositoryContextValue>;
};

export function RepositoryProvider({ children, overrides }: RepositoryProviderProps) {
  const defaultRepositories = useMemo(() => createRepositories(), []);
  const value = useMemo(
    () => ({
      posts: overrides?.posts ?? defaultRepositories.posts,
      communities: overrides?.communities ?? defaultRepositories.communities,
      users: overrides?.users ?? defaultRepositories.users,
      comments: overrides?.comments ?? defaultRepositories.comments,
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
