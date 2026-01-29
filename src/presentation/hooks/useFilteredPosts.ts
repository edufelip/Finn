import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';

import type { Post } from '../../domain/models/post';
import { usePostsStore } from '../../app/store/postsStore';
import { useBlockedUsersStore } from '../../app/store/blockedUsersStore';

const EMPTY_IDS: number[] = [];

const useBlockedSet = () => {
  const blockedIds = useBlockedUsersStore((state) => state.blockedUserIds);
  return useMemo(() => new Set(blockedIds), [blockedIds]);
};

export const useHomePosts = () => {
  const blockedSet = useBlockedSet();
  return usePostsStore(
    useShallow((state) =>
      state.homeIds
        .map((id) => state.postsById[id])
        .filter((post): post is Post => Boolean(post) && !blockedSet.has(post.userId))
    )
  );
};

export const useFollowingPosts = () => {
  const blockedSet = useBlockedSet();
  return usePostsStore(
    useShallow((state) =>
      state.followingIds
        .map((id) => state.postsById[id])
        .filter((post): post is Post => Boolean(post) && !blockedSet.has(post.userId))
    )
  );
};

export const useCommunityPosts = (communityId: number) => {
  const blockedSet = useBlockedSet();
  return usePostsStore(
    useShallow((state) => {
      const ids = state.communityIds[communityId] ?? EMPTY_IDS;
      return ids
        .map((id) => state.postsById[id])
        .filter((post): post is Post => Boolean(post) && !blockedSet.has(post.userId));
    })
  );
};

export const useProfilePosts = (userId?: string) => {
  const blockedSet = useBlockedSet();
  return usePostsStore(
    useShallow((state) => {
      const ids = userId ? state.profileIds[userId] ?? EMPTY_IDS : EMPTY_IDS;
      return ids
        .map((id) => state.postsById[id])
        .filter((post): post is Post => Boolean(post) && !blockedSet.has(post.userId));
    })
  );
};

export const useSavedPosts = (userId?: string) => {
  const blockedSet = useBlockedSet();
  return usePostsStore(
    useShallow((state) => {
      const ids = userId ? state.savedIds[userId] ?? EMPTY_IDS : EMPTY_IDS;
      return ids
        .map((id) => state.postsById[id])
        .filter((post): post is Post => Boolean(post) && !blockedSet.has(post.userId));
    })
  );
};
