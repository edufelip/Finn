import { t } from '../i18n';

export const forgotPasswordCopy = {
  title: t('forgot.title'),
  subtitle: t('forgot.subtitle'),
  emailPlaceholder: t('forgot.emailPlaceholder'),
  submit: t('forgot.submit'),
  submitLoading: t('forgot.submitLoading'),
  alerts: {
    emailRequired: {
      title: t('forgot.alert.emailRequired.title'),
      message: t('forgot.alert.emailRequired.message'),
    },
    invalidEmail: {
      title: t('forgot.alert.invalidEmail.title'),
      message: t('forgot.alert.invalidEmail.message'),
    },
    offline: {
      title: t('forgot.alert.offline.title'),
      message: t('forgot.alert.offline.message'),
    },
    failed: {
      title: t('forgot.alert.failed.title'),
    },
    success: {
      title: t('forgot.alert.success.title'),
      message: t('forgot.alert.success.message'),
    },
  },
  testIds: {
    email: 'forgot-email',
    submit: 'forgot-submit',
  },
};
