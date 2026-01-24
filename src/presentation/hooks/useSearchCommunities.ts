import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import * as Network from 'expo-network';

import type { Community } from '../../domain/models/community';
import type { Topic } from '../../domain/models/topic';
import type { Subscription } from '../../domain/models/subscription';
import type { CommunitySortOrder } from '../../domain/repositories/CommunityRepository';
import { useRepositories } from '../../app/providers/RepositoryProvider';
import { useAuth } from '../../app/providers/AuthProvider';
import { isMockMode } from '../../config/appConfig';
import { enqueueWrite } from '../../data/offline/queueStore';
import { useCommunityStore } from '../../app/store/communityStore';
import { communityDetailCopy } from '../content/communityDetailCopy';

type UseSearchCommunitiesParams = {
  initialSort?: CommunitySortOrder;
  initialTopicId?: number;
  shouldLoadOnMount?: boolean;
};

const COMMUNITY_PAGE_SIZE = 20;

export const useSearchCommunities = ({
  initialSort = 'mostFollowed',
  initialTopicId,
  shouldLoadOnMount = false,
}: UseSearchCommunitiesParams) => {
  const { session, isGuest, exitGuest } = useAuth();
  const { communities: communityRepository, topics: topicRepository } = useRepositories();
  const { subscriptions: userSubscriptions, setSubscription, setSubscriptions } = useCommunityStore();

  const [communities, setCommunities] = useState<Community[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<number | undefined>(initialTopicId);
  const [sortOrder, setSortOrder] = useState<CommunitySortOrder>(initialSort);
  const [activeQuery, setActiveQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Load topics on mount
  useEffect(() => {
    topicRepository.getTopics().then(setTopics).catch(() => setTopics([]));
  }, [topicRepository]);

  const loadCommunities = useCallback(
    async ({
      query,
      pageToLoad = 0,
      replace = false,
      sort = sortOrder,
      topicId = selectedTopicId,
    }: {
      query?: string;
      pageToLoad?: number;
      replace?: boolean;
      sort?: CommunitySortOrder;
      topicId?: number | null;
    } = {}) => {
      if (replace) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const data = await communityRepository.getCommunities({
          search: query ?? activeQuery,
          sort,
          topicId: topicId ?? null,
          page: pageToLoad,
          pageSize: COMMUNITY_PAGE_SIZE,
        });

        if (session?.user?.id) {
          const subs = await Promise.all(
            data.map((comm: Community) => communityRepository.getSubscription(session.user.id, comm.id))
          );
          const subMap: Record<number, Subscription | null> = {};
          data.forEach((comm: Community, index: number) => {
            subMap[comm.id] = subs[index];
          });
          setSubscriptions(subMap);
        }

        setCommunities((prev) => (replace ? data : [...prev, ...data]));
        setPage(pageToLoad);
        setHasMore(data.length === COMMUNITY_PAGE_SIZE);
      } catch (err) {
        // Silent fail - could add error handling here
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setInitialLoad(false);
      }
    },
    [
      activeQuery,
      communityRepository,
      selectedTopicId,
      session?.user?.id,
      setSubscriptions,
      sortOrder,
    ]
  );

  // Load on mount if requested
  useEffect(() => {
    if (shouldLoadOnMount) {
      loadCommunities({ query: '', pageToLoad: 0, replace: true });
    }
  }, [loadCommunities, shouldLoadOnMount]);

  const searchCommunities = useCallback(
    (query: string) => {
      const normalized = query.trim();
      setActiveQuery(normalized);
      loadCommunities({ query: normalized, pageToLoad: 0, replace: true });
    },
    [loadCommunities]
  );

  const applyTopicFilter = useCallback(
    (topicId?: number) => {
      setSelectedTopicId(topicId);
      loadCommunities({
        query: activeQuery,
        pageToLoad: 0,
        replace: true,
        topicId: topicId ?? null,
      });
    },
    [activeQuery, loadCommunities]
  );

  const applySortOrder = useCallback(
    (nextSort: CommunitySortOrder) => {
      setSortOrder(nextSort);
      if (!activeQuery && !selectedTopicId) {
        return;
      }
      loadCommunities({ query: activeQuery, pageToLoad: 0, replace: true, sort: nextSort });
    },
    [activeQuery, loadCommunities, selectedTopicId]
  );

  const loadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore || communities.length === 0) {
      return;
    }
    loadCommunities({ pageToLoad: page + 1 });
  }, [communities.length, hasMore, loadCommunities, loading, loadingMore, page]);

  const handleToggleSubscription = useCallback(
    (community: Community) => {
      if (isGuest) {
        return 'guest';
      }

      const currentSubscription = userSubscriptions[community.id];
      const nextSubscribed = !currentSubscription;

      if (!nextSubscribed) {
        return new Promise<void>((resolve, reject) => {
          Alert.alert(
            'Unsubscribe',
            `Are you sure you want to leave ${community.title}?`,
            [
              { text: 'Cancel', style: 'cancel', onPress: () => reject() },
              {
                text: 'Unsubscribe',
                style: 'destructive',
                onPress: () => {
                  performToggleSubscription(community, currentSubscription, nextSubscribed)
                    .then(resolve)
                    .catch(reject);
                },
              },
            ]
          );
        });
      }

      return performToggleSubscription(community, currentSubscription, nextSubscribed);
    },
    [isGuest, userSubscriptions]
  );

  const performToggleSubscription = async (
    community: Community,
    current: Subscription | null,
    nextSubscribed: boolean
  ) => {
    if (!session?.user?.id) return;

    const currentId = current?.id ?? 0;

    // Optimistic update
    setSubscription(
      community.id,
      nextSubscribed ? { id: currentId, userId: session.user.id, communityId: community.id } : null
    );

    const status = isMockMode() ? { isConnected: true } : await Network.getNetworkStateAsync();
    if (!status.isConnected) {
      await enqueueWrite({
        id: `${Date.now()}`,
        type: nextSubscribed ? 'subscribe_community' : 'unsubscribe_community',
        payload: {
          id: current?.id ?? 0,
          userId: session.user.id,
          communityId: community.id,
        },
        createdAt: Date.now(),
      });
      Alert.alert(communityDetailCopy.alerts.offline.title, communityDetailCopy.alerts.offline.message);
      return;
    }

    try {
      if (nextSubscribed) {
        const created = await communityRepository.subscribe({
          id: 0,
          userId: session.user.id,
          communityId: community.id,
        });
        setSubscription(community.id, created);
      } else {
        await communityRepository.unsubscribe({
          id: current?.id ?? 0,
          userId: session.user.id,
          communityId: community.id,
        });
        setSubscription(community.id, null);
      }
    } catch (err) {
      // Revert optimistic update
      setSubscription(community.id, current);
      if (err instanceof Error) {
        Alert.alert(communityDetailCopy.alerts.subscriptionFailed.title, err.message);
      }
      throw err;
    }
  };

  return {
    communities,
    topics,
    selectedTopicId,
    sortOrder,
    loading,
    initialLoad,
    loadingMore,
    hasMore,
    activeQuery,
    userSubscriptions,
    isGuest,
    exitGuest,
    searchCommunities,
    applyTopicFilter,
    applySortOrder,
    loadMore,
    handleToggleSubscription,
  };
};
