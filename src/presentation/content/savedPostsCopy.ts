import { t } from '../i18n';

export const savedPostsCopy = {
  title: t('savedPosts.title'),
  errorSignInRequired: t('savedPosts.error.signInRequired'),
  alerts: {
    signInRequired: {
      title: t('savedPosts.alert.signInRequired.title'),
      message: t('savedPosts.alert.signInRequired.message'),
    },
    offline: {
      title: t('savedPosts.alert.offline.title'),
      message: t('savedPosts.alert.offline.message'),
    },
    savedFailed: {
      title: t('savedPosts.alert.savedFailed.title'),
    },
    likeFailed: {
      title: t('savedPosts.alert.likeFailed.title'),
    },
  },
  testIds: {
    list: 'saved-post-list',
  },
};
