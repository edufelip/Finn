import { t } from '../i18n';

export const chatCopy = {
  inputPlaceholder: t('chat.input.placeholder'),
  loading: t('chat.loading'),
  loadingMore: t('chat.loadingMore'),
  paginationError: t('chat.paginationError'),
  empty: t('chat.empty'),
  emptyState: {
    title: t('chat.emptyState.title'),
    body: (name: string) => t('chat.emptyState.body').replaceAll('{name}', name),
    disclaimer: t('chat.emptyState.disclaimer'),
  },
  todayLabel: t('chat.todayLabel'),
  status: {
    online: t('chat.status.online'),
    offline: t('chat.status.offline'),
    sending: t('chat.status.sending'),
    failed: t('chat.status.failed'),
  },
  request: {
    disclaimer: t('chat.request.disclaimer'),
    accept: t('chat.request.accept'),
    refuse: t('chat.request.refuse'),
    cannotSend: t('chat.request.cannotSend'),
  },
};
