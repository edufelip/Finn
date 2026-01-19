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
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  // Load topics on mount
  useEffect(() => {
    topicRepository.getTopics().then(setTopics).catch(() => setTopics([]));
  }, [topicRepository]);

  const loadCommunities = useCallback(
    async (searchQuery?: string) => {
      setLoading(true);
      try {
        const data = await communityRepository.getCommunities(
          searchQuery?.trim() || undefined,
          sortOrder,
          selectedTopicId ?? null
        );

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

        setCommunities(data);
      } catch (err) {
        // Silent fail - could add error handling here
      } finally {
        setLoading(false);
        setInitialLoad(false);
      }
    },
    [communityRepository, session?.user?.id, setSubscriptions, sortOrder, selectedTopicId]
  );

  // Load on mount if requested
  useEffect(() => {
    if (shouldLoadOnMount) {
      loadCommunities();
    }
  }, []);

  // Reload when filters change (but not on mount)
  useEffect(() => {
    if (!initialLoad) {
      loadCommunities();
    }
  }, [sortOrder, selectedTopicId]);

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
    userSubscriptions,
    isGuest,
    exitGuest,
    loadCommunities,
    setSelectedTopicId,
    setSortOrder,
    handleToggleSubscription,
  };
};
