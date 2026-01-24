import { t } from '../i18n';

export const registerCopy = {
  get title() { return t('register.title'); },
  placeholders: {
    get name() { return t('register.placeholder.name'); },
    get email() { return t('register.placeholder.email'); },
    get password() { return t('register.placeholder.password'); },
    get confirm() { return t('register.placeholder.confirm'); },
  },
  get submit() { return t('register.submit'); },
  get submitLoading() { return t('register.submitLoading'); },
  get or() { return t('register.or'); },
  get google() { return t('register.google'); },
  alerts: {
    nameRequired: {
      get title() { return t('register.alert.nameRequired.title'); },
      get message() { return t('register.alert.nameRequired.message'); },
    },
    emailRequired: {
      get title() { return t('register.alert.emailRequired.title'); },
      get message() { return t('register.alert.emailRequired.message'); },
    },
    invalidEmail: {
      get title() { return t('register.alert.invalidEmail.title'); },
      get message() { return t('register.alert.invalidEmail.message'); },
    },
    passwordRequired: {
      get title() { return t('register.alert.passwordRequired.title'); },
      get message() { return t('register.alert.passwordRequired.message'); },
    },
    confirmRequired: {
      get title() { return t('register.alert.confirmRequired.title'); },
      get message() { return t('register.alert.confirmRequired.message'); },
    },
    mismatch: {
      get title() { return t('register.alert.mismatch.title'); },
      get message() { return t('register.alert.mismatch.message'); },
    },
    offline: {
      get title() { return t('register.alert.offline.title'); },
      get message() { return t('register.alert.offline.message'); },
    },
    failed: {
      get title() { return t('register.alert.failed.title'); },
    },
    checkEmail: {
      get title() { return t('register.alert.checkEmail.title'); },
      get message() { return t('register.alert.checkEmail.message'); },
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
