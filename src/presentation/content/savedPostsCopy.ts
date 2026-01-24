import { t } from '../i18n';

export const savedPostsCopy = {
  get title() { return t('savedPosts.title'); },
  get errorSignInRequired() { return t('savedPosts.error.signInRequired'); },
  alerts: {
    signInRequired: {
      get title() { return t('savedPosts.alert.signInRequired.title'); },
      get message() { return t('savedPosts.alert.signInRequired.message'); },
    },
    offline: {
      get title() { return t('savedPosts.alert.offline.title'); },
      get message() { return t('savedPosts.alert.offline.message'); },
    },
    savedFailed: {
      get title() { return t('savedPosts.alert.savedFailed.title'); },
    },
    likeFailed: {
      get title() { return t('savedPosts.alert.likeFailed.title'); },
    },
  },
  testIds: {
    list: 'saved-post-list',
  },
};
