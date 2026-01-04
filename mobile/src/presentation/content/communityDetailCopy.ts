import { t } from '../i18n';
import { commonCopy } from './commonCopy';

export const communityDetailCopy = {
  subscribe: t('communityDetail.subscribe'),
  unsubscribe: t('communityDetail.unsubscribe'),
  subscribers: (count: number) => t('communityDetail.subscribers', { count }),
  since: (date: string) => t('communityDetail.since', { date }),
  emptyDash: commonCopy.emptyDash,
  empty: t('communityDetail.empty'),
  errorNotFound: t('communityDetail.error.notFound'),
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
