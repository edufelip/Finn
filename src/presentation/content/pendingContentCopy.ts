import { t } from '../i18n';

export const pendingContentCopy = {
  title: t('pendingContent.title'),
  emptyState: {
    title: t('pendingContent.emptyState.title'),
    message: t('pendingContent.emptyState.message'),
  },
  approveButton: t('pendingContent.approveButton'),
  rejectButton: t('pendingContent.rejectButton'),
  confirmApprove: {
    title: t('pendingContent.confirmApprove.title'),
    message: t('pendingContent.confirmApprove.message'),
    confirm: t('pendingContent.confirmApprove.confirm'),
    cancel: t('pendingContent.confirmApprove.cancel'),
  },
  confirmReject: {
    title: t('pendingContent.confirmReject.title'),
    message: t('pendingContent.confirmReject.message'),
    confirm: t('pendingContent.confirmReject.confirm'),
    cancel: t('pendingContent.confirmReject.cancel'),
  },
  alerts: {
    signInRequired: {
      title: t('pendingContent.alert.signInRequired.title'),
      message: t('pendingContent.alert.signInRequired.message'),
    },
    notAuthorized: {
      title: t('pendingContent.alert.notAuthorized.title'),
      message: t('pendingContent.alert.notAuthorized.message'),
    },
    offline: {
      title: t('pendingContent.alert.offline.title'),
      message: t('pendingContent.alert.offline.message'),
    },
    approved: {
      title: t('pendingContent.alert.approved.title'),
      message: t('pendingContent.alert.approved.message'),
    },
    rejected: {
      title: t('pendingContent.alert.rejected.title'),
      message: t('pendingContent.alert.rejected.message'),
    },
    failed: {
      title: t('pendingContent.alert.failed.title'),
    },
  },
  testIds: {
    approveButton: 'pending-content-approve-button',
    rejectButton: 'pending-content-reject-button',
  },
};
