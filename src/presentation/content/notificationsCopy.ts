import { t } from '../i18n';

export const notificationsCopy = {
  get title() { return t('notifications.title'); },
  tabs: {
    get all() { return t('notifications.tabs.all'); },
    get myPosts() { return t('notifications.tabs.myPosts'); },
  },
  sections: {
    get new() { return t('notifications.section.new'); },
    get earlier() { return t('notifications.section.earlier'); },
  },
  actions: {
    get markAllRead() { return t('notifications.action.markAllRead'); },
    get followBack() { return t('notifications.action.followBack'); },
    get following() { return t('notifications.action.following'); },
  },
  items: {
    get followedYouSuffix() { return t('notifications.item.followedYouSuffix'); },
    get likedPostSuffix() { return t('notifications.item.likedPostSuffix'); },
    commentedPostSuffix: (preview: string) => t('notifications.item.commentedPostSuffix', { preview }),
    get commentFallback() { return t('notifications.item.commentFallback'); },
    get likeFallback() { return t('notifications.item.likeFallback'); },
  },
  empty: {
    get title() { return t('notifications.empty.title'); },
    get body() { return t('notifications.empty.body'); },
  },
  alerts: {
    loadFailed: {
      get title() { return t('notifications.error.title'); },
      get message() { return t('notifications.error.message'); },
    },
    followFailed: {
      get title() { return t('notifications.alert.followFailed.title'); },
      get message() { return t('notifications.alert.followFailed.message'); },
    },
    markReadFailed: {
      get title() { return t('notifications.alert.markReadFailed.title'); },
      get message() { return t('notifications.alert.markReadFailed.message'); },
    },
  },
  testIds: {
    tabAll: 'notifications-tab-all',
    tabMyPosts: 'notifications-tab-my-posts',
    markAllRead: 'notifications-mark-all-read',
  },
};
