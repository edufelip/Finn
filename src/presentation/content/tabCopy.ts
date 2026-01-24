import { t } from '../i18n';

export const tabCopy = {
  get home() { return t('tabs.home'); },
  get add() { return t('tabs.add'); },
  get explore() { return t('tabs.explore'); },
  get inbox() { return t('tabs.inbox'); },
  get profile() { return t('tabs.profile'); },
  testIds: {
    home: 'tab-home',
    add: 'tab-add',
    explore: 'tab-explore',
    inbox: 'tab-inbox',
    profile: 'tab-profile',
  },
};
