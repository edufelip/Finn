import { t } from '../i18n';

export const moderationLogsCopy = {
  title: t('moderationLogs.title'),
  emptyState: {
    title: t('moderationLogs.emptyState.title'),
    message: t('moderationLogs.emptyState.message'),
  },
  actions: {
    post_approved: t('moderationLogs.actions.post_approved'),
    post_rejected: t('moderationLogs.actions.post_rejected'),
    post_deleted: t('moderationLogs.actions.post_deleted'),
    report_resolved_safe: t('moderationLogs.actions.report_resolved_safe'),
    report_resolved_deleted: t('moderationLogs.actions.report_resolved_deleted'),
    moderator_added: t('moderationLogs.actions.moderator_added'),
    moderator_removed: t('moderationLogs.actions.moderator_removed'),
  },
  by: (moderatorName: string) => t('moderationLogs.by', { moderatorName }),
  alerts: {
    signInRequired: {
      title: t('moderationLogs.alert.signInRequired.title'),
      message: t('moderationLogs.alert.signInRequired.message'),
    },
    notAuthorized: {
      title: t('moderationLogs.alert.notAuthorized.title'),
      message: t('moderationLogs.alert.notAuthorized.message'),
    },
    offline: {
      title: t('moderationLogs.alert.offline.title'),
      message: t('moderationLogs.alert.offline.message'),
    },
    failed: {
      title: t('moderationLogs.alert.failed.title'),
    },
  },
  testIds: {
    logItem: 'moderation-logs-item',
  },
};
