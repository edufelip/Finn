import { t } from '../i18n';

export const settingsCopy = {
  title: t('settings.title'),
  sections: {
    preferences: t('settings.section.preferences'),
    account: t('settings.section.account'),
  },
  options: {
    darkMode: t('settings.option.darkMode'),
    notifications: t('settings.option.notifications'),
    onlineStatus: t('settings.option.onlineStatus'),
    deleteAccount: t('settings.option.deleteAccount'),
  },
  deleteButton: t('settings.deleteButton'),
  deleteButtonLoading: t('settings.deleteButtonLoading'),
  alerts: {
    unavailable: {
      title: t('settings.alert.unavailable.title'),
      message: t('settings.alert.unavailable.message'),
    },
    onlineStatusFailed: {
      title: t('settings.alert.onlineStatusFailed.title'),
      message: t('settings.alert.onlineStatusFailed.message'),
    },
    deleteConfirm: {
      title: t('settings.alert.deleteConfirm.title'),
      message: t('settings.alert.deleteConfirm.message'),
      cancel: t('settings.alert.deleteConfirm.cancel'),
      confirm: t('settings.alert.deleteConfirm.confirm'),
    },
    signInRequired: {
      title: t('settings.alert.signInRequired.title'),
      message: t('settings.alert.signInRequired.message'),
    },
    offline: {
      title: t('settings.alert.offline.title'),
      message: t('settings.alert.offline.message'),
    },
    deleted: {
      title: t('settings.alert.deleted.title'),
      message: t('settings.alert.deleted.message'),
    },
    failed: {
      title: t('settings.alert.failed.title'),
    },
  },
  testIds: {
    darkMode: 'settings-dark-toggle',
    notifications: 'settings-notifications-toggle',
    onlineStatus: 'settings-online-status-toggle',
    delete: 'settings-delete',
  },
};
