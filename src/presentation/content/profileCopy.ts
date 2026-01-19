import { t } from '../i18n';

export const profileCopy = {
  title: t('profile.title'),
  tabs: {
    posts: t('profile.tab.posts'),
    saved: t('profile.tab.saved'),
  },
  stats: {
    posts: t('profile.stats.posts'),
    followers: t('profile.stats.followers'),
    following: t('profile.stats.following'),
  },
  empty: {
    title: t('profile.empty.title'),
    body: t('profile.empty.body'),
    cta: t('profile.empty.cta'),
  },
  savedEmpty: {
    title: t('profile.savedEmpty.title'),
    body: t('profile.savedEmpty.body'),
  },
  loading: {
    title: t('profile.loading.title'),
    body: t('profile.loading.body'),
  },
  errorSignInRequired: t('profile.error.signInRequired'),
  memberSince: (date: string) => t('profile.memberSince', { date }),
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
    title: 'profile-title',
    name: 'profile-name',
    bio: 'profile-bio',
    memberSince: 'profile-member-since',
    statsPosts: 'profile-stats-posts',
    statsFollowers: 'profile-stats-followers',
    statsFollowing: 'profile-stats-following',
    tabPosts: 'profile-tab-posts',
    tabSaved: 'profile-tab-saved',
    emptyTitle: 'profile-empty-title',
    savedEmptyTitle: 'profile-saved-empty-title',
    createPost: 'profile-create-post',
    list: 'profile-post-list',
    loadingTitle: 'profile-loading-title',
  },
};
