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
  get searchPlaceholder() { return t('explore.searchPlaceholder'); },
  get trendingTitle() { return t('explore.trending.title'); },
  get trendingSeeAll() { return t('explore.trending.seeAll'); },
  trendingLimit: 3,
  feedLimit: 6,
  feedSkeletonCount: 2,
  get trendingTags(): TrendingTag[] {
    return [
      { id: 'tech', label: t('explore.trending.tag.tech'), tone: 'tech' },
      { id: 'travel', label: t('explore.trending.tag.travel'), tone: 'travel' },
      { id: 'design', label: t('explore.trending.tag.design'), tone: 'design' },
    ];
  },
  trendingMembersLabel: (count: string) => t('explore.trending.members', { count }),
  get feedTitle() { return t('explore.feed.title'); },
  get emptyTitle() { return t('explore.empty.title'); },
  get emptyBody() { return t('explore.empty.body'); },
  get primaryCta() { return t('explore.cta.primary'); },
  get secondaryCta() { return t('explore.cta.secondary'); },
  get topicsTitle() { return t('explore.topics.title'); },
  get topics(): TopicItem[] {
    return [
      { id: 'gaming', label: t('explore.topics.gaming'), icon: 'sports-esports', tone: 'orange' },
      { id: 'music', label: t('explore.topics.music'), icon: 'music-note', tone: 'green' },
      { id: 'movies', label: t('explore.topics.movies'), icon: 'movie', tone: 'purple' },
      { id: 'science', label: t('explore.topics.science'), icon: 'science', tone: 'blue' },
    ];
  },
  get communityFallback() { return t('explore.community.fallback'); },
  testIds: {
    avatar: 'explore-avatar',
    search: 'explore-search',
    notifications: 'explore-notifications',
    trendingList: 'explore-trending-list',
    trendingCard: 'explore-trending-card',
    trendingTitle: 'explore-trending-title',
    seeAll: 'explore-see-all',
    feedCard: 'explore-feed-card',
    trendingSkeleton: 'explore-trending-skeleton',
    feedSkeleton: 'explore-feed-skeleton',
  },
};
