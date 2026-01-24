import { t } from '../i18n';

export type InboxTabKey = 'primary' | 'requests' | 'archived';

export type InboxMessage = {
  id: string;
  name: string;
  role: string;
  message: string;
  time: string;
  unread: boolean;
  online: boolean;
  category: InboxTabKey;
};

export const inboxCopy = {
  get title() { return t('inbox.title'); },
  get searchPlaceholder() { return t('inbox.searchPlaceholder'); },
  tabs: {
    get primary() { return t('inbox.tabs.primary'); },
    get requests() { return t('inbox.tabs.requests'); },
    get archived() { return t('inbox.tabs.archived'); },
  },
  sections: {
    get unread() { return t('inbox.section.unread'); },
    get earlier() { return t('inbox.section.earlier'); },
  },
  empty: {
    get title() { return t('inbox.empty.title'); },
    get body() { return t('inbox.empty.body'); },
  },
  actions: {
    get compose() { return t('inbox.action.compose'); },
  },
  testIds: {
    tabPrimary: 'inbox-tab-primary',
    tabRequests: 'inbox-tab-requests',
    tabArchived: 'inbox-tab-archived',
    searchInput: 'inbox-search-input',
  },
  messages: [] as InboxMessage[],
};
