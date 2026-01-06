import { t } from '../i18n';

type TrendingTag = {
  id: string;
  label: string;
  tone: 'tech' | 'travel' | 'design';
};

type TopicItem = {
  id: string;
  label: string;
  icon: 'sports-esports' | 'music-note' | 'movie' | 'science';
  tone: 'orange' | 'green' | 'purple' | 'blue';
};

export const exploreCopy = {
  searchPlaceholder: t('explore.searchPlaceholder'),
  trendingTitle: t('explore.trending.title'),
  trendingSeeAll: t('explore.trending.seeAll'),
  trendingLimit: 3,
  trendingTags: [
    { id: 'tech', label: t('explore.trending.tag.tech'), tone: 'tech' },
    { id: 'travel', label: t('explore.trending.tag.travel'), tone: 'travel' },
    { id: 'design', label: t('explore.trending.tag.design'), tone: 'design' },
  ] as TrendingTag[],
  trendingMembersLabel: (count: string) => t('explore.trending.members', { count }),
  feedTitle: t('explore.feed.title'),
  emptyTitle: t('explore.empty.title'),
  emptyBody: t('explore.empty.body'),
  primaryCta: t('explore.cta.primary'),
  secondaryCta: t('explore.cta.secondary'),
  topicsTitle: t('explore.topics.title'),
  topics: [
    { id: 'gaming', label: t('explore.topics.gaming'), icon: 'sports-esports', tone: 'orange' },
    { id: 'music', label: t('explore.topics.music'), icon: 'music-note', tone: 'green' },
    { id: 'movies', label: t('explore.topics.movies'), icon: 'movie', tone: 'purple' },
    { id: 'science', label: t('explore.topics.science'), icon: 'science', tone: 'blue' },
  ] as TopicItem[],
  communityFallback: t('explore.community.fallback'),
  testIds: {
    avatar: 'explore-avatar',
    search: 'explore-search',
    notifications: 'explore-notifications',
    trendingList: 'explore-trending-list',
    trendingCard: 'explore-trending-card',
    trendingTitle: 'explore-trending-title',
    seeAll: 'explore-see-all',
    feedCard: 'explore-feed-card',
  },
};
