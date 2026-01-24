import { t } from '../i18n';
import { commonCopy } from './commonCopy';

export const communityDetailCopy = {
  get subscribe() { return t('communityDetail.subscribe'); },
  get unsubscribe() { return t('communityDetail.unsubscribe'); },
  subscribers: (count: number) => t('communityDetail.subscribers', { count }),
  since: (date: string) => t('communityDetail.since', { date }),
  emptyDash: commonCopy.emptyDash,
  get empty() { return t('communityDetail.empty'); },
  get feedTitle() { return t('communityDetail.feed.title'); },
  feedSort: (label: string) => t('communityDetail.feed.sort', { label }),
  get sortTitle() { return t('communityDetail.sort.title'); },
  sortOptions: {
    get newest() { return t('communityDetail.sort.newest'); },
    get oldest() { return t('communityDetail.sort.oldest'); },
    get mostLiked() { return t('communityDetail.sort.mostLiked'); },
    get mostCommented() { return t('communityDetail.sort.mostCommented'); },
  },
  get emptyTitle() { return t('communityDetail.empty.title'); },
  get emptyDescription() { return t('communityDetail.empty.description'); },
  get emptyButton() { return t('communityDetail.empty.button'); },
  get errorNotFound() { return t('communityDetail.error.notFound'); },
  markForReview: {
    get signInRequired() { return t('communityDetail.markForReview.signInRequired'); },
    notAuthorized: {
      get title() { return t('communityDetail.markForReview.notAuthorized.title'); },
      get message() { return t('communityDetail.markForReview.notAuthorized.message'); },
    },
    confirm: {
      get title() { return t('communityDetail.markForReview.confirm.title'); },
      get message() { return t('communityDetail.markForReview.confirm.message'); },
      get mark() { return t('communityDetail.markForReview.confirm.mark'); },
    },
    get offline() { return t('communityDetail.markForReview.offline'); },
    success: {
      get title() { return t('communityDetail.markForReview.success.title'); },
      get message() { return t('communityDetail.markForReview.success.message'); },
    },
    get failed() { return t('communityDetail.markForReview.failed'); },
  },
  alerts: {
    signInRequired: {
      get title() { return t('communityDetail.alert.signInRequired.title'); },
      get message() { return t('communityDetail.alert.signInRequired.message'); },
    },
    offline: {
      get title() { return t('communityDetail.alert.offline.title'); },
      get message() { return t('communityDetail.alert.offline.message'); },
    },
    likeFailed: {
      get title() { return t('communityDetail.alert.likeFailed.title'); },
    },
    savedFailed: {
      get title() { return t('communityDetail.alert.savedFailed.title'); },
    },
    subscriptionFailed: {
      get title() { return t('communityDetail.alert.subscriptionFailed.title'); },
    },
  },
  testIds: {
    image: 'community-detail-image',
    subscribe: 'community-detail-subscribe',
    list: 'community-post-list',
    title: 'community-detail-title',
    description: 'community-detail-description',
  },
};
