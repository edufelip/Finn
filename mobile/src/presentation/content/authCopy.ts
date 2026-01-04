import { t } from '../i18n';

export const authCopy = {
  heading: t('auth.heading'),
  subheading: t('auth.subheading'),
  emailPlaceholder: t('auth.emailPlaceholder'),
  passwordPlaceholder: t('auth.passwordPlaceholder'),
  login: t('auth.login'),
  forgotPrompt: t('auth.forgotPrompt'),
  forgotAction: t('auth.forgotAction'),
  divider: t('auth.divider'),
  google: t('auth.google'),
  apple: t('auth.apple'),
  signupPrompt: t('auth.signupPrompt'),
  signupAction: t('auth.signupAction'),
  alerts: {
    emailRequired: {
      title: t('auth.alert.emailRequired.title'),
      message: t('auth.alert.emailRequired.message'),
    },
    invalidEmail: {
      title: t('auth.alert.invalidEmail.title'),
      message: t('auth.alert.invalidEmail.message'),
    },
    passwordRequired: {
      title: t('auth.alert.passwordRequired.title'),
      message: t('auth.alert.passwordRequired.message'),
    },
    offline: {
      title: t('auth.alert.offline.title'),
      message: t('auth.alert.offline.message'),
    },
    signInFailed: {
      title: t('auth.alert.signInFailed.title'),
    },
    googleFailed: {
      title: t('auth.alert.googleFailed.title'),
      missingToken: t('auth.alert.googleFailed.missingToken'),
    },
    appleUnavailable: {
      title: t('auth.alert.appleUnavailable.title'),
      message: t('auth.alert.appleUnavailable.message'),
    },
    appleFailed: {
      title: t('auth.alert.appleFailed.title'),
      missingToken: t('auth.alert.appleFailed.missingToken'),
    },
  },
  testIds: {
    email: 'auth-email',
    password: 'auth-password',
    signin: 'auth-signin',
    forgot: 'auth-forgot',
    register: 'auth-register',
    togglePassword: 'toggle-password',
  },
};
