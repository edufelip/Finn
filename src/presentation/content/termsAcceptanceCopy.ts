import { t } from '../i18n';

export const termsAcceptanceCopy = {
  get title() { return t('terms.title'); },
  get description() { return t('terms.description'); },
  get linkLabel() { return t('terms.linkLabel'); },
  get checkboxLabel() { return t('terms.checkboxLabel'); },
  get acceptButton() { return t('terms.acceptButton'); },
  alerts: {
    failed: {
      get title() { return t('terms.alert.failed.title'); },
      get message() { return t('terms.alert.failed.message'); },
    },
  },
  testIds: {
    checkbox: 'terms-checkbox',
    accept: 'terms-accept',
    link: 'terms-link',
  },
};
