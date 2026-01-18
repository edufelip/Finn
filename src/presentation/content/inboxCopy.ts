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
  title: t('inbox.title'),
  searchPlaceholder: t('inbox.searchPlaceholder'),
  tabs: {
    primary: t('inbox.tabs.primary'),
    requests: t('inbox.tabs.requests'),
    archived: t('inbox.tabs.archived'),
  },
  sections: {
    unread: t('inbox.section.unread'),
    earlier: t('inbox.section.earlier'),
  },
  empty: {
    title: t('inbox.empty.title'),
    body: t('inbox.empty.body'),
  },
  actions: {
    compose: t('inbox.action.compose'),
  },
  testIds: {
    tabPrimary: 'inbox-tab-primary',
    tabRequests: 'inbox-tab-requests',
    tabArchived: 'inbox-tab-archived',
    searchInput: 'inbox-search-input',
  },
  messages: [] as InboxMessage[],
};
