import { t } from '../i18n';

export const postCommentsCopy = {
  get title() { return t('postComments.title'); },
  get empty() { return t('postComments.empty'); },
  get inputPlaceholder() { return t('postComments.inputPlaceholder'); },
  get submit() { return t('postComments.submit'); },
  get submitLoading() { return t('postComments.submitLoading'); },
  get commentAuthorFallback() { return t('postComments.commentAuthorFallback'); },
  get currentUserFallback() { return t('postComments.currentUserFallback'); },
  alerts: {
    loadFailed: {
      get title() { return t('postComments.alert.loadFailed.title'); },
    },
    signInRequired: {
      get title() { return t('postComments.alert.signInRequired.title'); },
      get message() { return t('postComments.alert.signInRequired.message'); },
    },
    contentRequired: {
      get title() { return t('postComments.alert.contentRequired.title'); },
      get message() { return t('postComments.alert.contentRequired.message'); },
    },
    offline: {
      get title() { return t('postComments.alert.offline.title'); },
      get message() { return t('postComments.alert.offline.message'); },
    },
    commentFailed: {
      get title() { return t('postComments.alert.commentFailed.title'); },
    },
  },
  testIds: {
    input: 'comment-input',
    submit: 'comment-submit',
    list: 'comment-list',
  },
};
