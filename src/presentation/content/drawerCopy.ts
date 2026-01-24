import { t } from '../i18n';

export const drawerCopy = {
  sections: {
    get main() { return t('drawer.section.main'); },
    get system() { return t('drawer.section.system'); },
  },
  get profile() { return t('drawer.profile'); },
  get saved() { return t('drawer.saved'); },
  get posts() { return t('drawer.posts'); },
  get settings() { return t('drawer.settings'); },
  get privacyPolicy() { return t('drawer.privacyPolicy'); },
  get darkMode() { return t('drawer.darkMode'); },
  get logout() { return t('drawer.logout'); },
  versionLabel: (version: string) => t('drawer.version', { version }),
  alerts: {
    unavailable: {
      get title() { return t('drawer.alert.unavailable.title'); },
      get message() { return t('drawer.alert.unavailable.message'); },
    },
    logout: {
      get title() { return t('drawer.alert.logout.title'); },
      get message() { return t('drawer.alert.logout.message'); },
      get confirm() { return t('drawer.alert.logout.confirm'); },
      get cancel() { return t('drawer.alert.logout.cancel'); },
    },
  },
  testIds: {
    profile: 'drawer-profile',
    saved: 'drawer-saved',
    posts: 'drawer-posts',
    settings: 'drawer-settings',
    privacy: 'drawer-privacy',
    darkMode: 'drawer-dark-mode',
    logout: 'drawer-logout',
  },
};
