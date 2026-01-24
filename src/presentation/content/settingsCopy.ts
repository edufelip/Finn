import { t } from '../i18n';

export const settingsCopy = {
  get title() { return t('settings.title'); },
  sections: {
    get preferences() { return t('settings.section.preferences'); },
    get preferencesNote() { return t('settings.section.preferences.note'); },
    get account() { return t('settings.section.account'); },
    get accountNote() { return t('settings.section.account.note'); },
  },
  options: {
    get darkMode() { return t('settings.option.darkMode'); },
    get language() { return t('settings.option.language'); },
    get notifications() { return t('settings.option.notifications'); },
    get onlineStatus() { return t('settings.option.onlineStatus'); },
    get editProfile() { return t('settings.option.editProfile'); },
    get logout() { return t('settings.option.logout'); },
    get deleteAccount() { return t('settings.option.deleteAccount'); },
  },
  footer: {
    version: (version: string) => t('settings.footer.version', { version }),
    get privacy() { return t('settings.footer.privacy'); },
    get terms() { return t('settings.footer.terms'); },
    get help() { return t('settings.footer.help'); },
  },
  alerts: {
    unavailable: {
      get title() { return t('settings.alert.unavailable.title'); },
      get message() { return t('settings.alert.unavailable.message'); },
    },
    onlineStatusFailed: {
      get title() { return t('settings.alert.onlineStatusFailed.title'); },
      get message() { return t('settings.alert.onlineStatusFailed.message'); },
    },
    logout: {
      get title() { return t('settings.alert.logout.title'); },
      get message() { return t('settings.alert.logout.message'); },
      get confirm() { return t('settings.alert.logout.confirm'); },
      get cancel() { return t('settings.alert.logout.cancel'); },
    },
    notificationsPermission: {
      get title() { return t('settings.alert.notificationsPermission.title'); },
      get message() { return t('settings.alert.notificationsPermission.message'); },
      get confirm() { return t('settings.alert.notificationsPermission.confirm'); },
      get cancel() { return t('settings.alert.notificationsPermission.cancel'); },
    },
    notificationsFailed: {
      get title() { return t('settings.alert.notificationsFailed.title'); },
      get message() { return t('settings.alert.notificationsFailed.message'); },
    },
    deleteConfirm: {
      get title() { return t('settings.alert.deleteConfirm.title'); },
      get message() { return t('settings.alert.deleteConfirm.message'); },
      get cancel() { return t('settings.alert.deleteConfirm.cancel'); },
      get confirm() { return t('settings.alert.deleteConfirm.confirm'); },
    },
    signInRequired: {
      get title() { return t('settings.alert.signInRequired.title'); },
      get message() { return t('settings.alert.signInRequired.message'); },
    },
    offline: {
      get title() { return t('settings.alert.offline.title'); },
      get message() { return t('settings.alert.offline.message'); },
    },
    deleted: {
      get title() { return t('settings.alert.deleted.title'); },
      get message() { return t('settings.alert.deleted.message'); },
    },
    failed: {
      get title() { return t('settings.alert.failed.title'); },
    },
  },
  deleteModal: {
    get title() { return t('settings.deleteModal.title'); },
    get body() { return t('settings.deleteModal.body'); },
    hint: (email: string) => t('settings.deleteModal.hint', { email }),
    get placeholder() { return t('settings.deleteModal.placeholder'); },
    get mismatch() { return t('settings.deleteModal.mismatch'); },
    get cancel() { return t('settings.deleteModal.cancel'); },
    get confirm() { return t('settings.deleteModal.confirm'); },
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
