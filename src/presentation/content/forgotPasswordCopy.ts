import { t } from '../i18n';

export const forgotPasswordCopy = {
  get title() { return t('forgot.title'); },
  get subtitle() { return t('forgot.subtitle'); },
  get emailPlaceholder() { return t('forgot.emailPlaceholder'); },
  get submit() { return t('forgot.submit'); },
  get submitLoading() { return t('forgot.submitLoading'); },
  alerts: {
    emailRequired: {
      get title() { return t('forgot.alert.emailRequired.title'); },
      get message() { return t('forgot.alert.emailRequired.message'); },
    },
    invalidEmail: {
      get title() { return t('forgot.alert.invalidEmail.title'); },
      get message() { return t('forgot.alert.invalidEmail.message'); },
    },
    offline: {
      get title() { return t('forgot.alert.offline.title'); },
      get message() { return t('forgot.alert.offline.message'); },
    },
    failed: {
      get title() { return t('forgot.alert.failed.title'); },
    },
    success: {
      get title() { return t('forgot.alert.success.title'); },
      get message() { return t('forgot.alert.success.message'); },
    },
  },
  testIds: {
    email: 'forgot-email',
    submit: 'forgot-submit',
  },
};
