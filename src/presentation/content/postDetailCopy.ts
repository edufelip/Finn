import { t } from '../i18n';

export const postDetailCopy = {
  get commentsTitle() { return t('postDetail.commentsTitle'); },
  get inputPlaceholder() { return t('postDetail.inputPlaceholder'); },
  get empty() { return t('postDetail.empty'); },
  get commentAge() { return t('postDetail.commentAge'); },
  get commentAuthorFallback() { return t('postDetail.commentAuthorFallback'); },
  get currentUserFallback() { return t('postDetail.currentUserFallback'); },
  alerts: {
    loadFailed: {
      get title() { return t('postDetail.alert.loadFailed.title'); },
    },
    signInRequired: {
      get title() { return t('postDetail.alert.signInRequired.title'); },
      get message() { return t('postDetail.alert.signInRequired.message'); },
    },
    likeFailed: {
      get title() { return t('postDetail.alert.likeFailed.title'); },
    },
    savedFailed: {
      get title() { return t('postDetail.alert.savedFailed.title'); },
    },
    shareUnavailable: {
      get title() { return t('postDetail.alert.shareUnavailable.title'); },
      get message() { return t('postDetail.alert.shareUnavailable.message'); },
    },
    contentRequired: {
      get title() { return t('postDetail.alert.contentRequired.title'); },
      get message() { return t('postDetail.alert.contentRequired.message'); },
    },
    offline: {
      get title() { return t('postDetail.alert.offline.title'); },
      get message() { return t('postDetail.alert.offline.message'); },
    },
    commentFailed: {
      get title() { return t('postDetail.alert.commentFailed.title'); },
    },
  },
  testIds: {
    list: 'post-detail-comments',
    input: 'post-detail-comment-input',
    submit: 'post-detail-comment-submit',
  },
};
