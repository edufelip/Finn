import { t } from '../i18n';

export const reportedContentCopy = {
  get title() { return t('reportedContent.title'); },
  emptyState: {
    get title() { return t('reportedContent.emptyState.title'); },
    get message() { return t('reportedContent.emptyState.message'); },
  },
  reportedBy: (userName: string) => t('reportedContent.reportedBy', { userName }),
  get reason() { return t('reportedContent.reason'); },
  get deleteButton() { return t('reportedContent.deleteButton'); },
  get markSafeButton() { return t('reportedContent.markSafeButton'); },
  confirmDelete: {
    get title() { return t('reportedContent.confirmDelete.title'); },
    get message() { return t('reportedContent.confirmDelete.message'); },
    get confirm() { return t('reportedContent.confirmDelete.confirm'); },
    get cancel() { return t('reportedContent.confirmDelete.cancel'); },
  },
  confirmMarkSafe: {
    get title() { return t('reportedContent.confirmMarkSafe.title'); },
    get message() { return t('reportedContent.confirmMarkSafe.message'); },
    get confirm() { return t('reportedContent.confirmMarkSafe.confirm'); },
    get cancel() { return t('reportedContent.confirmMarkSafe.cancel'); },
  },
  alerts: {
    signInRequired: {
      get title() { return t('reportedContent.alert.signInRequired.title'); },
      get message() { return t('reportedContent.alert.signInRequired.message'); },
    },
    notAuthorized: {
      get title() { return t('reportedContent.alert.notAuthorized.title'); },
      get message() { return t('reportedContent.alert.notAuthorized.message'); },
    },
    offline: {
      get title() { return t('reportedContent.alert.offline.title'); },
      get message() { return t('reportedContent.alert.offline.message'); },
    },
    deleted: {
      get title() { return t('reportedContent.alert.deleted.title'); },
      get message() { return t('reportedContent.alert.deleted.message'); },
    },
    markedSafe: {
      get title() { return t('reportedContent.alert.markedSafe.title'); },
      get message() { return t('reportedContent.alert.markedSafe.message'); },
    },
    failed: {
      get title() { return t('reportedContent.alert.failed.title'); },
    },
  },
  testIds: {
    deleteButton: 'reported-content-delete-button',
    markSafeButton: 'reported-content-mark-safe-button',
  },
};
