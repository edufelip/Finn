import { t } from '../i18n';

export const searchCopy = {
  get placeholder() { return t('search.placeholder'); },
  get emptyStateTitle() { return t('search.emptyState.title'); },
  get emptyStateSubtitle() { return t('search.emptyState.subtitle'); },
  get empty() { return t('search.empty'); },
  get followersLabel() { return t('search.followersLabel'); },
  get sortBy() { return t('common.sortBy'); },
  get sortMostFollowed() { return t('search.sort.mostFollowed'); },
  get sortLeastFollowed() { return t('search.sort.leastFollowed'); },
  get sortNewest() { return t('search.sort.newest'); },
  get sortOldest() { return t('search.sort.oldest'); },
  get cancel() { return t('common.cancel'); },
  get allTopics() { return t('common.allTopics'); },
  get filterByTopic() { return t('common.filterByTopic'); },
  testIds: {
    avatar: 'search-avatar',
    searchInput: 'community-search',
    list: 'community-list',
    sortButton: 'search-sort-button',
    topicFilterButton: 'search-topic-filter-button',
  },
};
