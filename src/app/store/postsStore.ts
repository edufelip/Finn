import { useMemo } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Post } from '../../domain/models/post';

type PostsState = {
  postsById: Record<number, Post>;
  homeIds: number[];
  communityIds: Record<number, number[]>;
  profileIds: Record<string, number[]>;
  savedIds: Record<string, number[]>;
  upsertPosts: (posts: Post[]) => void;
  setHomePosts: (posts: Post[], append?: boolean) => void;
  setCommunityPosts: (communityId: number, posts: Post[], append?: boolean) => void;
  setProfilePosts: (userId: string, posts: Post[], append?: boolean) => void;
  setSavedPosts: (userId: string, posts: Post[], append?: boolean) => void;
  updatePost: (postId: number, patch: Partial<Post>) => void;
  setSavedForUser: (userId: string, postId: number, isSaved: boolean) => void;
  reset: () => void;
};

const mergeIds = (existing: number[], next: number[], append?: boolean) => {
  if (!append) return [...next];
  const seen = new Set(existing);
  const merged = [...existing];
  next.forEach((id) => {
    if (!seen.has(id)) {
      seen.add(id);
      merged.push(id);
    }
  });
  return merged;
};

export const usePostsStore = create<PostsState>()(
  persist(
    (set) => ({
      postsById: {},
      homeIds: [],
      communityIds: {},
      profileIds: {},
      savedIds: {},
      upsertPosts: (posts) => {
        set((state) => {
          const next = { ...state.postsById };
          posts.forEach((post) => {
            next[post.id] = { ...next[post.id], ...post };
          });
          return { postsById: next };
        });
      },
      setHomePosts: (posts, append) => {
        set((state) => {
          const nextPosts = { ...state.postsById };
          const ids = posts.map((post) => post.id);
          posts.forEach((post) => {
            nextPosts[post.id] = { ...nextPosts[post.id], ...post };
          });
          return {
            postsById: nextPosts,
            homeIds: mergeIds(state.homeIds, ids, append),
          };
        });
      },
      setCommunityPosts: (communityId, posts, append) => {
        set((state) => {
          const nextPosts = { ...state.postsById };
          const ids = posts.map((post) => post.id);
          posts.forEach((post) => {
            nextPosts[post.id] = { ...nextPosts[post.id], ...post };
          });
          return {
            postsById: nextPosts,
            communityIds: {
              ...state.communityIds,
              [communityId]: mergeIds(state.communityIds[communityId] ?? [], ids, append),
            },
          };
        });
      },
      setProfilePosts: (userId, posts, append) => {
        set((state) => {
          const nextPosts = { ...state.postsById };
          const ids = posts.map((post) => post.id);
          posts.forEach((post) => {
            nextPosts[post.id] = { ...nextPosts[post.id], ...post };
          });
          return {
            postsById: nextPosts,
            profileIds: {
              ...state.profileIds,
              [userId]: mergeIds(state.profileIds[userId] ?? [], ids, append),
            },
          };
        });
      },
      setSavedPosts: (userId, posts, append) => {
        set((state) => {
          const nextPosts = { ...state.postsById };
          const ids = posts.map((post) => post.id);
          posts.forEach((post) => {
            nextPosts[post.id] = { ...nextPosts[post.id], ...post };
          });
          return {
            postsById: nextPosts,
            savedIds: {
              ...state.savedIds,
              [userId]: mergeIds(state.savedIds[userId] ?? [], ids, append),
            },
          };
        });
      },
      updatePost: (postId, patch) => {
        set((state) => {
          const existing = state.postsById[postId];
          if (!existing) return state;
          return {
            postsById: {
              ...state.postsById,
              [postId]: { ...existing, ...patch },
            },
          };
        });
      },
      setSavedForUser: (userId, postId, isSaved) => {
        set((state) => {
          const current = state.savedIds[userId] ?? [];
          if (isSaved) {
            if (current.includes(postId)) {
              return state;
            }
            return {
              savedIds: {
                ...state.savedIds,
                [userId]: [...current, postId],
              },
            };
          }
          return {
            savedIds: {
              ...state.savedIds,
              [userId]: current.filter((id) => id !== postId),
            },
          };
        });
      },
      reset: () => {
        set({
          postsById: {},
          homeIds: [],
          communityIds: {},
          profileIds: {},
          savedIds: {},
        });
      },
    }),
    {
      name: 'posts-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        postsById: state.postsById,
        homeIds: state.homeIds,
        communityIds: state.communityIds,
        profileIds: state.profileIds,
        savedIds: state.savedIds,
      }),
    }
  )
);

const EMPTY_IDS: number[] = [];

export const useHomePosts = () =>
  usePostsStore(
    useShallow((state) =>
      state.homeIds.map((id) => state.postsById[id]).filter((post): post is Post => Boolean(post))
    )
  );

export const useCommunityPosts = (communityId: number) =>
  usePostsStore(
    useShallow((state) => {
      const ids = state.communityIds[communityId] ?? EMPTY_IDS;
      return ids.map((id) => state.postsById[id]).filter((post): post is Post => Boolean(post));
    })
  );

export const useProfilePosts = (userId?: string) =>
  usePostsStore(
    useShallow((state) => {
      const ids = userId ? state.profileIds[userId] ?? EMPTY_IDS : EMPTY_IDS;
      return ids.map((id) => state.postsById[id]).filter((post): post is Post => Boolean(post));
    })
  );

export const useSavedPosts = (userId?: string) =>
  usePostsStore(
    useShallow((state) => {
      const ids = userId ? state.savedIds[userId] ?? EMPTY_IDS : EMPTY_IDS;
      return ids.map((id) => state.postsById[id]).filter((post): post is Post => Boolean(post));
    })
  );

export const usePostById = (postId: number) =>
  usePostsStore((state) => state.postsById[postId]);
