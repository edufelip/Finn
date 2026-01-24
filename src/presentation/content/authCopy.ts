import { t } from '../i18n';

export const authCopy = {
  get heading() { return t('auth.heading'); },
  get subheading() { return t('auth.subheading'); },
  get emailPlaceholder() { return t('auth.emailPlaceholder'); },
  get passwordPlaceholder() { return t('auth.passwordPlaceholder'); },
  get login() { return t('auth.login'); },
  get forgotPrompt() { return t('auth.forgotPrompt'); },
  get forgotAction() { return t('auth.forgotAction'); },
  get divider() { return t('auth.divider'); },
  get google() { return t('auth.google'); },
  get apple() { return t('auth.apple'); },
  get signupPrompt() { return t('auth.signupPrompt'); },
  get signupAction() { return t('auth.signupAction'); },
  get guestCta() { return t('auth.guestCta'); },
  get guestHint() { return t('auth.guestHint'); },
  alerts: {
    emailRequired: {
      get title() { return t('auth.alert.emailRequired.title'); },
      get message() { return t('auth.alert.emailRequired.message'); },
    },
    invalidEmail: {
      get title() { return t('auth.alert.invalidEmail.title'); },
      get message() { return t('auth.alert.invalidEmail.message'); },
    },
    passwordRequired: {
      get title() { return t('auth.alert.passwordRequired.title'); },
      get message() { return t('auth.alert.passwordRequired.message'); },
    },
    offline: {
      get title() { return t('auth.alert.offline.title'); },
      get message() { return t('auth.alert.offline.message'); },
    },
    signInFailed: {
      get title() { return t('auth.alert.signInFailed.title'); },
    },
    googleFailed: {
      get title() { return t('auth.alert.googleFailed.title'); },
      get missingToken() { return t('auth.alert.googleFailed.missingToken'); },
    },
    appleUnavailable: {
      get title() { return t('auth.alert.appleUnavailable.title'); },
      get message() { return t('auth.alert.appleUnavailable.message'); },
    },
    appleFailed: {
      get title() { return t('auth.alert.appleFailed.title'); },
      get missingToken() { return t('auth.alert.appleFailed.missingToken'); },
    },
  },
  testIds: {
    email: 'auth-email',
    password: 'auth-password',
    signin: 'auth-signin',
    forgot: 'auth-forgot',
    register: 'auth-register',
    togglePassword: 'toggle-password',
    guest: 'auth-guest',
  },
};
