import { t, tList } from '../i18n';

export const homeCopy = {
  searchPlaceholder: t('home.searchPlaceholder'),
  tabs: {
    communities: t('home.tabs.communities'),
    people: t('home.tabs.people'),
  },
  emptyTitle: t('home.emptyTitle'),
  emptyBody: t('home.emptyBody'),
  followingEmptyTitle: t('home.followingEmptyTitle'),
  followingEmptyBody: t('home.followingEmptyBody'),
  followingGuestBody: t('home.followingGuestBody'),
  primaryCta: t('home.primaryCta'),
  secondaryCta: t('home.secondaryCta'),
  tagsTitle: t('home.tagsTitle'),
  tags: tList('home.tags'),
  alerts: {
    signInRequired: {
      title: t('home.alert.signInRequired.title'),
      message: t('home.alert.signInRequired.message'),
    },
    likeFailed: {
      title: t('home.alert.likeFailed.title'),
    },
    savedFailed: {
      title: t('home.alert.savedFailed.title'),
    },
  },
  testIds: {
    avatar: 'home-avatar',
    search: 'home-search',
    feedList: 'home-feed-list',
    explore: 'home-explore',
    connections: 'home-connections',
    notifications: 'home-notifications',
  },
};
