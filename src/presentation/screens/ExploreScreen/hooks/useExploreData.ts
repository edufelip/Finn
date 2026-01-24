import { useCallback, useEffect, useRef, useState } from 'react';
import type { Community } from '../../../../domain/models/community';
import type { Topic } from '../../../../domain/models/topic';
import type { CommunityRepository } from '../../../../domain/repositories/CommunityRepository';
import type { TopicRepository } from '../../../../domain/repositories/TopicRepository';
import { exploreCopy } from '../../../content/exploreCopy';

const MIN_SKELETON_MS = 350;

type UseExploreDataResult = {
  trending: Community[];
  feedItems: Community[];
  topics: Topic[];
  loading: boolean;
  error: string | null;
  reload: () => void;
};

export function useExploreData(
  communityRepository: CommunityRepository,
  topicRepository: TopicRepository
): UseExploreDataResult {
  const [trending, setTrending] = useState<Community[]>([]);
  const [feedItems, setFeedItems] = useState<Community[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadToken = useRef(0);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const loadData = useCallback(async () => {
    const token = ++loadToken.current;
    const start = Date.now();

    if (isMounted.current) {
      setLoading(true);
      setError(null);
    }

    try {
      const [communitiesData, topicsData] = await Promise.all([
        communityRepository.getCommunities({
          sort: 'mostFollowed',
          page: 0,
          pageSize: exploreCopy.trendingLimit + exploreCopy.feedLimit,
        }),
        topicRepository.getPopularTopics(8),
      ]);

      const sorted = [...communitiesData].sort(
        (a, b) => (b.subscribersCount ?? 0) - (a.subscribersCount ?? 0)
      );

      const trendingItems = sorted.slice(0, exploreCopy.trendingLimit);
      const feedCandidates = sorted.slice(
        exploreCopy.trendingLimit,
        exploreCopy.trendingLimit + exploreCopy.feedLimit
      );

      if (isMounted.current && loadToken.current === token) {
        setTrending(trendingItems);
        setFeedItems(feedCandidates);
        setTopics(topicsData);
      }
    } catch (err) {
      if (err instanceof Error && isMounted.current && loadToken.current === token) {
        setError(err.message);
      }
    } finally {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, MIN_SKELETON_MS - elapsed);

      if (remaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, remaining));
      }

      if (isMounted.current && loadToken.current === token) {
        setLoading(false);
      }
    }
  }, [communityRepository, topicRepository]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    trending,
    feedItems,
    topics,
    loading,
    error,
    reload: loadData,
  };
}
