import { t } from '../i18n';

export const chatCopy = {
  inputPlaceholder: t('chat.input.placeholder'),
  loading: t('chat.loading'),
  empty: t('chat.empty'),
  emptyState: {
    title: t('chat.emptyState.title'),
    body: (name: string) => t('chat.emptyState.body').replaceAll('{name}', name),
    disclaimer: t('chat.emptyState.disclaimer'),
  },
  todayLabel: t('chat.todayLabel'),
  status: {
    sending: t('chat.status.sending'),
    failed: t('chat.status.failed'),
  },
};
