import { t, tList } from '../i18n';

export const homeCopy = {
  get searchPlaceholder() { return t('home.searchPlaceholder'); },
  tabs: {
    get communities() { return t('home.tabs.communities'); },
    get people() { return t('home.tabs.people'); },
  },
  get emptyTitle() { return t('home.emptyTitle'); },
  get emptyBody() { return t('home.emptyBody'); },
  get followingEmptyTitle() { return t('home.followingEmptyTitle'); },
  get followingEmptyBody() { return t('home.followingEmptyBody'); },
  get followingGuestBody() { return t('home.followingGuestBody'); },
  get primaryCta() { return t('home.primaryCta'); },
  get secondaryCta() { return t('home.secondaryCta'); },
  get tagsTitle() { return t('home.tagsTitle'); },
  get tags() { return tList('home.tags'); },
  alerts: {
    signInRequired: {
      get title() { return t('home.alert.signInRequired.title'); },
      get message() { return t('home.alert.signInRequired.message'); },
    },
    likeFailed: {
      get title() { return t('home.alert.likeFailed.title'); },
    },
    savedFailed: {
      get title() { return t('home.alert.savedFailed.title'); },
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
