import { t } from '../i18n';

export const reportedContentCopy = {
  get title() { return t('reportedContent.title'); },
  emptyState: {
    get title() { return t('reportedContent.emptyState.title'); },
    get message() { return t('reportedContent.emptyState.message'); },
  },
  reportedBy: (userName: string) => t('reportedContent.reportedBy', { userName }),
  get reason() { return t('reportedContent.reason'); },
  get deleteAndBanButton() { return t('reportedContent.deleteAndBanButton'); },
  get markSafeButton() { return t('reportedContent.markSafeButton'); },
  confirmDeleteAndBan: {
    get title() { return t('reportedContent.confirmDeleteAndBan.title'); },
    get message() { return t('reportedContent.confirmDeleteAndBan.message'); },
    get confirmCommunity() { return t('reportedContent.confirmDeleteAndBan.confirmCommunity'); },
    get confirmGlobal() { return t('reportedContent.confirmDeleteAndBan.confirmGlobal'); },
    get cancel() { return t('reportedContent.confirmDeleteAndBan.cancel'); },
  },
  confirmMarkSafe: {
    get title() { return t('reportedContent.confirmMarkSafe.title'); },
    get message() { return t('reportedContent.confirmMarkSafe.message'); },
    get confirm() { return t('reportedContent.confirmMarkSafe.confirm'); },
    get cancel() { return t('reportedContent.confirmMarkSafe.cancel'); },
  },
  dueIn: (hours: number) => t('reportedContent.dueIn', { hours }),
  get overdue() { return t('reportedContent.overdue'); },
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
      get missingAuthor() { return t('reportedContent.alert.failed.missingAuthor'); },
    },
  },
  testIds: {
    deleteButton: 'reported-content-delete-button',
    markSafeButton: 'reported-content-mark-safe-button',
  },
};
