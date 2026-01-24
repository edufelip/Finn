import { t } from '../i18n';

export const guestCopy = {
  banner: {
    get title() { return t('home.guestBanner.title'); },
    get body() { return t('home.guestBanner.body'); },
    get cta() { return t('home.guestBanner.cta'); },
  },
  action: {
    get title() { return t('guest.action.title'); },
    get body() { return t('guest.action.body'); },
    get signIn() { return t('guest.action.signIn'); },
    get cancel() { return t('guest.action.cancel'); },
  },
  profile: {
    get title() { return t('guest.profile.title'); },
    get body() { return t('guest.profile.body'); },
    get cta() { return t('guest.profile.cta'); },
  },
  restricted: {
    title: (feature: string) => t('guest.restricted.title', { feature }),
    body: (feature: string) => t('guest.restricted.body', { feature }),
    get cta() { return t('guest.restricted.cta'); },
  },
  features: {
    get inbox() { return t('guest.feature.inbox'); },
    get notifications() { return t('guest.feature.notifications'); },
    get settings() { return t('guest.feature.settings'); },
    get savedPosts() { return t('guest.feature.savedPosts'); },
    get profile() { return t('guest.feature.profile'); },
    get createPost() { return t('guest.feature.createPost'); },
    get createCommunity() { return t('guest.feature.createCommunity'); },
  },
  get userLabel() { return t('guest.userLabel'); },
  testIds: {
    bannerCta: 'guest-banner-cta',
    gateCta: 'guest-gate-cta',
  },
};
