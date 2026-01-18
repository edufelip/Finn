import { t } from '../i18n';

export const notificationsCopy = {
  title: t('notifications.title'),
  tabs: {
    all: t('notifications.tabs.all'),
    myPosts: t('notifications.tabs.myPosts'),
  },
  sections: {
    new: t('notifications.section.new'),
    earlier: t('notifications.section.earlier'),
  },
  actions: {
    markAllRead: t('notifications.action.markAllRead'),
    followBack: t('notifications.action.followBack'),
    following: t('notifications.action.following'),
  },
  items: {
    followedYouSuffix: t('notifications.item.followedYouSuffix'),
    likedPostSuffix: t('notifications.item.likedPostSuffix'),
    commentedPostSuffix: (preview: string) => t('notifications.item.commentedPostSuffix', { preview }),
    commentFallback: t('notifications.item.commentFallback'),
    likeFallback: t('notifications.item.likeFallback'),
  },
  empty: {
    title: t('notifications.empty.title'),
    body: t('notifications.empty.body'),
  },
  alerts: {
    loadFailed: {
      title: t('notifications.error.title'),
      message: t('notifications.error.message'),
    },
    followFailed: {
      title: t('notifications.alert.followFailed.title'),
      message: t('notifications.alert.followFailed.message'),
    },
    markReadFailed: {
      title: t('notifications.alert.markReadFailed.title'),
      message: t('notifications.alert.markReadFailed.message'),
    },
  },
  testIds: {
    tabAll: 'notifications-tab-all',
    tabMyPosts: 'notifications-tab-my-posts',
    markAllRead: 'notifications-mark-all-read',
  },
};
