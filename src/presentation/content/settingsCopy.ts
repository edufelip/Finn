import { t } from '../i18n';

export const settingsCopy = {
  title: t('settings.title'),
  sections: {
    preferences: t('settings.section.preferences'),
    preferencesNote: t('settings.section.preferences.note'),
    account: t('settings.section.account'),
    accountNote: t('settings.section.account.note'),
  },
  options: {
    darkMode: t('settings.option.darkMode'),
    language: t('settings.option.language'),
    notifications: t('settings.option.notifications'),
    onlineStatus: t('settings.option.onlineStatus'),
    editProfile: t('settings.option.editProfile'),
    logout: t('settings.option.logout'),
    deleteAccount: t('settings.option.deleteAccount'),
  },
  footer: {
    version: (version: string) => t('settings.footer.version', { version }),
    privacy: t('settings.footer.privacy'),
    terms: t('settings.footer.terms'),
    help: t('settings.footer.help'),
  },
  alerts: {
    unavailable: {
      title: t('settings.alert.unavailable.title'),
      message: t('settings.alert.unavailable.message'),
    },
    onlineStatusFailed: {
      title: t('settings.alert.onlineStatusFailed.title'),
      message: t('settings.alert.onlineStatusFailed.message'),
    },
    logout: {
      title: t('settings.alert.logout.title'),
      message: t('settings.alert.logout.message'),
      confirm: t('settings.alert.logout.confirm'),
      cancel: t('settings.alert.logout.cancel'),
    },
    notificationsPermission: {
      title: t('settings.alert.notificationsPermission.title'),
      message: t('settings.alert.notificationsPermission.message'),
      confirm: t('settings.alert.notificationsPermission.confirm'),
      cancel: t('settings.alert.notificationsPermission.cancel'),
    },
    notificationsFailed: {
      title: t('settings.alert.notificationsFailed.title'),
      message: t('settings.alert.notificationsFailed.message'),
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
  deleteModal: {
    title: t('settings.deleteModal.title'),
    body: t('settings.deleteModal.body'),
    hint: (email: string) => t('settings.deleteModal.hint', { email }),
    placeholder: t('settings.deleteModal.placeholder'),
    mismatch: t('settings.deleteModal.mismatch'),
    cancel: t('settings.deleteModal.cancel'),
    confirm: t('settings.deleteModal.confirm'),
  },
  testIds: {
    darkMode: 'settings-dark-toggle',
    notifications: 'settings-notifications-toggle',
    onlineStatus: 'settings-online-status-toggle',
    logout: 'settings-logout',
    delete: 'settings-delete',
    deleteModal: 'settings-delete-modal',
    deleteEmail: 'settings-delete-email-input',
    deleteConfirm: 'settings-delete-confirm',
    deleteCancel: 'settings-delete-cancel',
    privacy: 'settings-privacy',
    terms: 'settings-terms',
    help: 'settings-help',
  },
};
