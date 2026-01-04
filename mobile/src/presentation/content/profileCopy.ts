import { t } from '../i18n';

export const profileCopy = {
  postsTab: t('profile.postsTab'),
  emptyPosts: t('profile.emptyPosts'),
  errorSignInRequired: t('profile.error.signInRequired'),
  joinedSince: (date: string) => t('profile.joinedSince', { date }),
  alerts: {
    signInRequired: {
      title: t('profile.alert.signInRequired.title'),
      message: t('profile.alert.signInRequired.message'),
    },
    likeFailed: {
      title: t('profile.alert.likeFailed.title'),
    },
    savedFailed: {
      title: t('profile.alert.savedFailed.title'),
    },
  },
  testIds: {
    name: 'profile-name',
    joined: 'profile-joined',
    list: 'profile-post-list',
  },
};
