import { t } from '../i18n';

export const reportedContentCopy = {
  title: t('reportedContent.title'),
  emptyState: {
    title: t('reportedContent.emptyState.title'),
    message: t('reportedContent.emptyState.message'),
  },
  reportedBy: (userName: string) => t('reportedContent.reportedBy', { userName }),
  reason: t('reportedContent.reason'),
  deleteButton: t('reportedContent.deleteButton'),
  markSafeButton: t('reportedContent.markSafeButton'),
  confirmDelete: {
    title: t('reportedContent.confirmDelete.title'),
    message: t('reportedContent.confirmDelete.message'),
    confirm: t('reportedContent.confirmDelete.confirm'),
    cancel: t('reportedContent.confirmDelete.cancel'),
  },
  confirmMarkSafe: {
    title: t('reportedContent.confirmMarkSafe.title'),
    message: t('reportedContent.confirmMarkSafe.message'),
    confirm: t('reportedContent.confirmMarkSafe.confirm'),
    cancel: t('reportedContent.confirmMarkSafe.cancel'),
  },
  alerts: {
    signInRequired: {
      title: t('reportedContent.alert.signInRequired.title'),
      message: t('reportedContent.alert.signInRequired.message'),
    },
    notAuthorized: {
      title: t('reportedContent.alert.notAuthorized.title'),
      message: t('reportedContent.alert.notAuthorized.message'),
    },
    offline: {
      title: t('reportedContent.alert.offline.title'),
      message: t('reportedContent.alert.offline.message'),
    },
    deleted: {
      title: t('reportedContent.alert.deleted.title'),
      message: t('reportedContent.alert.deleted.message'),
    },
    markedSafe: {
      title: t('reportedContent.alert.markedSafe.title'),
      message: t('reportedContent.alert.markedSafe.message'),
    },
    failed: {
      title: t('reportedContent.alert.failed.title'),
    },
  },
  testIds: {
    deleteButton: 'reported-content-delete-button',
    markSafeButton: 'reported-content-mark-safe-button',
  },
};
