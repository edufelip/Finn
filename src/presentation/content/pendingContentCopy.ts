import { t } from '../i18n';

export const pendingContentCopy = {
  get title() { return t('pendingContent.title'); },
  emptyState: {
    get title() { return t('pendingContent.emptyState.title'); },
    get message() { return t('pendingContent.emptyState.message'); },
  },
  get approveButton() { return t('pendingContent.approveButton'); },
  get rejectButton() { return t('pendingContent.rejectButton'); },
  confirmApprove: {
    get title() { return t('pendingContent.confirmApprove.title'); },
    get message() { return t('pendingContent.confirmApprove.message'); },
    get confirm() { return t('pendingContent.confirmApprove.confirm'); },
    get cancel() { return t('pendingContent.confirmApprove.cancel'); },
  },
  confirmReject: {
    get title() { return t('pendingContent.confirmReject.title'); },
    get message() { return t('pendingContent.confirmReject.message'); },
    get confirm() { return t('pendingContent.confirmReject.confirm'); },
    get cancel() { return t('pendingContent.confirmReject.cancel'); },
  },
  alerts: {
    signInRequired: {
      get title() { return t('pendingContent.alert.signInRequired.title'); },
      get message() { return t('pendingContent.alert.signInRequired.message'); },
    },
    notAuthorized: {
      get title() { return t('pendingContent.alert.notAuthorized.title'); },
      get message() { return t('pendingContent.alert.notAuthorized.message'); },
    },
    offline: {
      get title() { return t('pendingContent.alert.offline.title'); },
      get message() { return t('pendingContent.alert.offline.message'); },
    },
    approved: {
      get title() { return t('pendingContent.alert.approved.title'); },
      get message() { return t('pendingContent.alert.approved.message'); },
    },
    rejected: {
      get title() { return t('pendingContent.alert.rejected.title'); },
      get message() { return t('pendingContent.alert.rejected.message'); },
    },
    failed: {
      get title() { return t('pendingContent.alert.failed.title'); },
    },
  },
  testIds: {
    approveButton: 'pending-content-approve-button',
    rejectButton: 'pending-content-reject-button',
  },
};
