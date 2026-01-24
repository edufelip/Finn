import { t } from '../i18n';

export const postDetailCopy = {
  commentsTitle: t('postDetail.commentsTitle'),
  inputPlaceholder: t('postDetail.inputPlaceholder'),
  empty: t('postDetail.empty'),
  commentAge: t('postDetail.commentAge'),
  commentAuthorFallback: t('postDetail.commentAuthorFallback'),
  currentUserFallback: t('postDetail.currentUserFallback'),
  alerts: {
    loadFailed: {
      title: t('postDetail.alert.loadFailed.title'),
    },
    signInRequired: {
      title: t('postDetail.alert.signInRequired.title'),
      message: t('postDetail.alert.signInRequired.message'),
    },
    likeFailed: {
      title: t('postDetail.alert.likeFailed.title'),
    },
    savedFailed: {
      title: t('postDetail.alert.savedFailed.title'),
    },
    shareUnavailable: {
      title: t('postDetail.alert.shareUnavailable.title'),
      message: t('postDetail.alert.shareUnavailable.message'),
    },
    contentRequired: {
      title: t('postDetail.alert.contentRequired.title'),
      message: t('postDetail.alert.contentRequired.message'),
    },
    offline: {
      title: t('postDetail.alert.offline.title'),
      message: t('postDetail.alert.offline.message'),
    },
    commentFailed: {
      title: t('postDetail.alert.commentFailed.title'),
    },
  },
  testIds: {
    list: 'post-detail-comments',
    input: 'post-detail-comment-input',
    submit: 'post-detail-comment-submit',
  },
};
