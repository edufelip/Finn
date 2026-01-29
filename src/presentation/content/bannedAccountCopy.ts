import { t } from '../i18n';

export const bannedAccountCopy = {
  get title() { return t('banned.title'); },
  get message() { return t('banned.message'); },
  get action() { return t('banned.action'); },
  testIds: {
    action: 'banned-signout',
  },
};
