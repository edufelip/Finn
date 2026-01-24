import { t } from '../i18n';

export const profileCopy = {
  get title() { return t('profile.title'); },
  tabs: {
    get posts() { return t('profile.tab.posts'); },
    get saved() { return t('profile.tab.saved'); },
    get communities() { return t('profile.tab.communities'); },
  },
  stats: {
    get posts() { return t('profile.stats.posts'); },
    get followers() { return t('profile.stats.followers'); },
    get following() { return t('profile.stats.following'); },
  },
  empty: {
    get title() { return t('profile.empty.title'); },
    get body() { return t('profile.empty.body'); },
    get cta() { return t('profile.empty.cta'); },
  },
  savedEmpty: {
    get title() { return t('profile.savedEmpty.title'); },
    get body() { return t('profile.savedEmpty.body'); },
  },
  communitiesEmpty: {
    get title() { return t('profile.communitiesEmpty.title'); },
    get body() { return t('profile.communitiesEmpty.body'); },
  },
  loading: {
    get title() { return t('profile.loading.title'); },
    get body() { return t('profile.loading.body'); },
  },
  get errorSignInRequired() { return t('profile.error.signInRequired'); },
  get errorFollowFailed() { return t('profile.error.failedFollow'); },
  get locationNotSpecified() { return t('profile.location.notSpecified'); },
  tabLabels: {
    get posts() { return t('profile.tabs.posts'); },
    get comments() { return t('profile.tabs.comments'); },
  },
  memberSince: (date: string) => t('profile.memberSince', { date }),
  alerts: {
    signInRequired: {
      get title() { return t('profile.alert.signInRequired.title'); },
      get message() { return t('profile.alert.signInRequired.message'); },
    },
    likeFailed: {
      get title() { return t('profile.alert.likeFailed.title'); },
    },
    savedFailed: {
      get title() { return t('profile.alert.savedFailed.title'); },
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
    tabCommunities: 'profile-tab-communities',
    emptyTitle: 'profile-empty-title',
    savedEmptyTitle: 'profile-saved-empty-title',
    communitiesEmptyTitle: 'profile-communities-empty-title',
    createPost: 'profile-create-post',
    manageCommunity: 'profile-manage-community',
    list: 'profile-post-list',
    communityList: 'profile-community-list',
    loadingTitle: 'profile-loading-title',
  },
};
