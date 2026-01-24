import { t } from '../i18n';

export const chatCopy = {
  get inputPlaceholder() { return t('chat.input.placeholder'); },
  get loading() { return t('chat.loading'); },
  get loadingMore() { return t('chat.loadingMore'); },
  get paginationError() { return t('chat.paginationError'); },
  get empty() { return t('chat.empty'); },
  emptyState: {
    get title() { return t('chat.emptyState.title'); },
    body: (name: string) => t('chat.emptyState.body').replaceAll('{name}', name),
    get disclaimer() { return t('chat.emptyState.disclaimer'); },
  },
  get todayLabel() { return t('chat.todayLabel'); },
  status: {
    get online() { return t('chat.status.online'); },
    get offline() { return t('chat.status.offline'); },
    get sending() { return t('chat.status.sending'); },
    get failed() { return t('chat.status.failed'); },
  },
  request: {
    get disclaimer() { return t('chat.request.disclaimer'); },
    get accept() { return t('chat.request.accept'); },
    get refuse() { return t('chat.request.refuse'); },
    get cannotSend() { return t('chat.request.cannotSend'); },
  },
};
