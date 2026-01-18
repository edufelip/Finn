import { t } from '../i18n';

export const postCommentsCopy = {
  title: t('postComments.title'),
  empty: t('postComments.empty'),
  inputPlaceholder: t('postComments.inputPlaceholder'),
  submit: t('postComments.submit'),
  submitLoading: t('postComments.submitLoading'),
  commentAuthorFallback: t('postComments.commentAuthorFallback'),
  currentUserFallback: t('postComments.currentUserFallback'),
  alerts: {
    loadFailed: {
      title: t('postComments.alert.loadFailed.title'),
    },
    signInRequired: {
      title: t('postComments.alert.signInRequired.title'),
      message: t('postComments.alert.signInRequired.message'),
    },
    contentRequired: {
      title: t('postComments.alert.contentRequired.title'),
      message: t('postComments.alert.contentRequired.message'),
    },
    offline: {
      title: t('postComments.alert.offline.title'),
      message: t('postComments.alert.offline.message'),
    },
    commentFailed: {
      title: t('postComments.alert.commentFailed.title'),
    },
  },
  testIds: {
    input: 'comment-input',
    submit: 'comment-submit',
    list: 'comment-list',
  },
};
