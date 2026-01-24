import { t } from '../i18n';
import { commonCopy } from './commonCopy';

export const communityDetailCopy = {
  subscribe: t('communityDetail.subscribe'),
  unsubscribe: t('communityDetail.unsubscribe'),
  subscribers: (count: number) => t('communityDetail.subscribers', { count }),
  since: (date: string) => t('communityDetail.since', { date }),
  emptyDash: commonCopy.emptyDash,
  empty: t('communityDetail.empty'),
  feedTitle: t('communityDetail.feed.title'),
  feedSort: (label: string) => t('communityDetail.feed.sort', { label }),
  sortTitle: t('communityDetail.sort.title'),
  sortOptions: {
    newest: t('communityDetail.sort.newest'),
    oldest: t('communityDetail.sort.oldest'),
    mostLiked: t('communityDetail.sort.mostLiked'),
    mostCommented: t('communityDetail.sort.mostCommented'),
  },
  emptyTitle: t('communityDetail.empty.title'),
  emptyDescription: t('communityDetail.empty.description'),
  emptyButton: t('communityDetail.empty.button'),
  errorNotFound: t('communityDetail.error.notFound'),
  markForReview: {
    signInRequired: t('communityDetail.markForReview.signInRequired'),
    notAuthorized: {
      title: t('communityDetail.markForReview.notAuthorized.title'),
      message: t('communityDetail.markForReview.notAuthorized.message'),
    },
    confirm: {
      title: t('communityDetail.markForReview.confirm.title'),
      message: t('communityDetail.markForReview.confirm.message'),
      mark: t('communityDetail.markForReview.confirm.mark'),
    },
    offline: t('communityDetail.markForReview.offline'),
    success: {
      title: t('communityDetail.markForReview.success.title'),
      message: t('communityDetail.markForReview.success.message'),
    },
    failed: t('communityDetail.markForReview.failed'),
  },
  alerts: {
    signInRequired: {
      title: t('communityDetail.alert.signInRequired.title'),
      message: t('communityDetail.alert.signInRequired.message'),
    },
    offline: {
      title: t('communityDetail.alert.offline.title'),
      message: t('communityDetail.alert.offline.message'),
    },
    likeFailed: {
      title: t('communityDetail.alert.likeFailed.title'),
    },
    savedFailed: {
      title: t('communityDetail.alert.savedFailed.title'),
    },
    subscriptionFailed: {
      title: t('communityDetail.alert.subscriptionFailed.title'),
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
