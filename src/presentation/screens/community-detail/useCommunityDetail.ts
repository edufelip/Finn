import { useEffect, useRef, useState } from 'react';

import type { Community } from '../../../domain/models/community';
import { PostSortOrder } from '../../../domain/models/post';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useRepositories } from '../../../app/providers/RepositoryProvider';
import { usePostsStore } from '../../../app/store/postsStore';
import { useCommunityPosts } from '../../hooks/useFilteredPosts';
import { useCommunityStore } from '../../../app/store/communityStore';
import { communityDetailCopy } from '../../content/communityDetailCopy';

type UseCommunityDetailParams = {
  communityId: number;
  initialCommunity?: Community;
};

export const useCommunityDetail = ({
  communityId,
  initialCommunity,
}: UseCommunityDetailParams) => {
  const { session } = useAuth();
  const { communities: communityRepository, posts: postRepository } = useRepositories();
  const posts = useCommunityPosts(communityId);
  const setCommunityPosts = usePostsStore((state) => state.setCommunityPosts);
  const { subscriptions, setSubscription } = useCommunityStore();
  const subscription = subscriptions[communityId];

  const [community, setCommunity] = useState<Community | null>(initialCommunity ?? null);
  const communityRef = useRef<Community | null>(initialCommunity ?? null);
  const [subscribersCount, setSubscribersCount] = useState(initialCommunity?.subscribersCount ?? 0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<PostSortOrder>(PostSortOrder.Newest);

  useEffect(() => {
    setCommunity(initialCommunity ?? null);
    setSubscribersCount(initialCommunity?.subscribersCount ?? 0);
  }, [communityId, initialCommunity]);

  useEffect(() => {
    communityRef.current = community;
  }, [community]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
        setLoading(true);
        setError(null);

      try {
        if (!Number.isFinite(communityId)) {
          setError(communityDetailCopy.errorNotFound);
          return;
        }

        const [communityResult, countResult, postResult, subscriptionResult, savedResult] =
          await Promise.allSettled([
            communityRepository.getCommunity(communityId),
            communityRepository.getCommunitySubscribersCount(communityId),
            postRepository.getPostsFromCommunity(communityId, 0, sortOrder),
            session?.user?.id
              ? communityRepository.getSubscription(session.user.id, communityId)
              : Promise.resolve(null),
            session?.user?.id ? postRepository.getSavedPosts(session.user.id, 0) : Promise.resolve([]),
          ]);

        if (!mounted) return;

        const hasFallbackCommunity = Boolean(initialCommunity ?? communityRef.current);
        if (communityResult.status !== 'fulfilled' || !communityResult.value) {
          if (!hasFallbackCommunity) {
            const message =
              communityResult.status === 'rejected' && communityResult.reason instanceof Error
                ? communityResult.reason.message
                : communityDetailCopy.errorNotFound;
            setError(message);
            return;
          }
        } else {
          setCommunity(communityResult.value);
        }

        if (countResult.status === 'fulfilled') {
          setSubscribersCount(countResult.value ?? 0);
        }

        const savedPosts = savedResult.status === 'fulfilled' ? savedResult.value ?? [] : [];
        const savedSet = new Set(savedPosts.map((post) => post.id));
        const postData = postResult.status === 'fulfilled' ? postResult.value ?? [] : [];
        let mappedPosts = postData.map((post) => ({
          ...post,
          isSaved: savedSet.has(post.id),
        }));

        if (session?.user?.id && mappedPosts.length > 0) {
          const likes = await Promise.all(
            mappedPosts.map((postItem) =>
              postRepository.findLike(postItem.id, session.user.id).catch(() => false)
            )
          );
          mappedPosts = mappedPosts.map((postItem, index) => ({
            ...postItem,
            isLiked: likes[index],
          }));
        }

        setCommunityPosts(communityId, mappedPosts);
        setSubscription(
          communityId,
          subscriptionResult.status === 'fulfilled' ? subscriptionResult.value ?? null : null
        );
      } catch (err) {
        if (err instanceof Error && mounted) {
          setError(err.message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [
    communityId,
    communityRepository,
    postRepository,
    session?.user?.id,
    setCommunityPosts,
    setSubscription,
    initialCommunity,
    sortOrder,
  ]);

  return {
    community,
    posts,
    loading,
    error,
    subscribersCount,
    setSubscribersCount,
    subscription,
    setSubscription,
    sortOrder,
    setSortOrder,
  };
};
