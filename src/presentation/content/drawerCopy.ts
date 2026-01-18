import { t } from '../i18n';

export const drawerCopy = {
  sections: {
    main: t('drawer.section.main'),
    system: t('drawer.section.system'),
  },
  profile: t('drawer.profile'),
  saved: t('drawer.saved'),
  posts: t('drawer.posts'),
  settings: t('drawer.settings'),
  privacyPolicy: t('drawer.privacyPolicy'),
  darkMode: t('drawer.darkMode'),
  logout: t('drawer.logout'),
  versionLabel: (version: string) => t('drawer.version', { version }),
  alerts: {
    unavailable: {
      title: t('drawer.alert.unavailable.title'),
      message: t('drawer.alert.unavailable.message'),
    },
    logout: {
      title: t('drawer.alert.logout.title'),
      message: t('drawer.alert.logout.message'),
      confirm: t('drawer.alert.logout.confirm'),
      cancel: t('drawer.alert.logout.cancel'),
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
