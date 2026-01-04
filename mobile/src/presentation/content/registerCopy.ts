import { t } from '../i18n';

export const registerCopy = {
  title: t('register.title'),
  placeholders: {
    name: t('register.placeholder.name'),
    email: t('register.placeholder.email'),
    password: t('register.placeholder.password'),
    confirm: t('register.placeholder.confirm'),
  },
  submit: t('register.submit'),
  submitLoading: t('register.submitLoading'),
  or: t('register.or'),
  google: t('register.google'),
  alerts: {
    nameRequired: {
      title: t('register.alert.nameRequired.title'),
      message: t('register.alert.nameRequired.message'),
    },
    emailRequired: {
      title: t('register.alert.emailRequired.title'),
      message: t('register.alert.emailRequired.message'),
    },
    invalidEmail: {
      title: t('register.alert.invalidEmail.title'),
      message: t('register.alert.invalidEmail.message'),
    },
    passwordRequired: {
      title: t('register.alert.passwordRequired.title'),
      message: t('register.alert.passwordRequired.message'),
    },
    confirmRequired: {
      title: t('register.alert.confirmRequired.title'),
      message: t('register.alert.confirmRequired.message'),
    },
    mismatch: {
      title: t('register.alert.mismatch.title'),
      message: t('register.alert.mismatch.message'),
    },
    offline: {
      title: t('register.alert.offline.title'),
      message: t('register.alert.offline.message'),
    },
    failed: {
      title: t('register.alert.failed.title'),
    },
    checkEmail: {
      title: t('register.alert.checkEmail.title'),
      message: t('register.alert.checkEmail.message'),
    },
  },
  testIds: {
    name: 'register-name',
    email: 'register-email',
    password: 'register-password',
    confirm: 'register-confirm',
    submit: 'register-submit',
  },
};
