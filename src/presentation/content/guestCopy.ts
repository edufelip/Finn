import { t } from '../i18n';

export const guestCopy = {
  banner: {
    title: t('home.guestBanner.title'),
    body: t('home.guestBanner.body'),
    cta: t('home.guestBanner.cta'),
  },
  action: {
    title: t('guest.action.title'),
    body: t('guest.action.body'),
    signIn: t('guest.action.signIn'),
    cancel: t('guest.action.cancel'),
  },
  profile: {
    title: t('guest.profile.title'),
    body: t('guest.profile.body'),
    cta: t('guest.profile.cta'),
  },
  restricted: {
    title: (feature: string) => t('guest.restricted.title', { feature }),
    body: (feature: string) => t('guest.restricted.body', { feature }),
    cta: t('guest.restricted.cta'),
  },
  features: {
    inbox: t('guest.feature.inbox'),
    notifications: t('guest.feature.notifications'),
    settings: t('guest.feature.settings'),
    savedPosts: t('guest.feature.savedPosts'),
    profile: t('guest.feature.profile'),
    createPost: t('guest.feature.createPost'),
    createCommunity: t('guest.feature.createCommunity'),
  },
  userLabel: t('guest.userLabel'),
  testIds: {
    bannerCta: 'guest-banner-cta',
    gateCta: 'guest-gate-cta',
  },
};
