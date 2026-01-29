import { t } from '../i18n';

export const moderationLogsCopy = {
  get title() { return t('moderationLogs.title'); },
  get unknownModerator() { return t('moderationLogs.unknownModerator'); },
  emptyState: {
    get title() { return t('moderationLogs.emptyState.title'); },
    get message() { return t('moderationLogs.emptyState.message'); },
  },
  actions: {
    get post_approved() { return t('moderationLogs.actions.post_approved'); },
    get post_rejected() { return t('moderationLogs.actions.post_rejected'); },
    get post_deleted() { return t('moderationLogs.actions.post_deleted'); },
    get report_resolved_safe() { return t('moderationLogs.actions.report_resolved_safe'); },
    get report_resolved_deleted() { return t('moderationLogs.actions.report_resolved_deleted'); },
    get moderator_added() { return t('moderationLogs.actions.moderator_added'); },
    get moderator_removed() { return t('moderationLogs.actions.moderator_removed'); },
    get user_banned() { return t('moderationLogs.actions.user_banned'); },
  },
  by: (moderatorName: string) => t('moderationLogs.by', { moderatorName }),
  alerts: {
    signInRequired: {
      get title() { return t('moderationLogs.alert.signInRequired.title'); },
      get message() { return t('moderationLogs.alert.signInRequired.message'); },
    },
    notAuthorized: {
      get title() { return t('moderationLogs.alert.notAuthorized.title'); },
      get message() { return t('moderationLogs.alert.notAuthorized.message'); },
    },
    offline: {
      get title() { return t('moderationLogs.alert.offline.title'); },
      get message() { return t('moderationLogs.alert.offline.message'); },
    },
    failed: {
      get title() { return t('moderationLogs.alert.failed.title'); },
    },
  },
  testIds: {
    logItem: 'moderation-logs-item',
  },
};
