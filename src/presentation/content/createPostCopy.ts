import { t } from '../i18n';

export const createPostCopy = {
  title: t('createPost.title'),
  communityPlaceholder: t('createPost.communityPlaceholder'),
  contentPlaceholder: t('createPost.contentPlaceholder'),
  contentCount: (count: number, max: number) => t('createPost.contentCount', { count, max }),
  mediaLabel: t('createPost.mediaLabel'),
  mediaHelper: t('createPost.mediaHelper'),
  modalTitle: t('createPost.modalTitle'),
  submit: t('createPost.submit'),
  submitLoading: t('createPost.submitLoading'),
  alerts: {
    loadCommunitiesFailed: {
      title: t('createPost.alert.loadCommunitiesFailed.title'),
    },
    permission: {
      title: t('createPost.alert.permission.title'),
      message: t('createPost.alert.permission.message'),
    },
    signInRequired: {
      title: t('createPost.alert.signInRequired.title'),
      message: t('createPost.alert.signInRequired.message'),
    },
    contentRequired: {
      title: t('createPost.alert.contentRequired.title'),
      message: t('createPost.alert.contentRequired.message'),
    },
    communityRequired: {
      title: t('createPost.alert.communityRequired.title'),
      message: t('createPost.alert.communityRequired.message'),
    },
    offline: {
      title: t('createPost.alert.offline.title'),
      message: t('createPost.alert.offline.message'),
    },
    posted: {
      title: t('createPost.alert.posted.title'),
      message: t('createPost.alert.posted.message'),
    },
    failed: {
      title: t('createPost.alert.failed.title'),
    },
    communityNotFound: t('createPost.alert.communityNotFound'),
    pendingModeration: {
      title: t('createPost.alert.pendingModeration.title'),
      message: t('createPost.alert.pendingModeration.message'),
    },
  },
  moderationNotice: t('createPost.moderationNotice'),
  testIds: {
    content: 'create-post-content',
    image: 'create-post-image',
    imagePreview: 'create-post-image-preview',
    submit: 'create-post-submit',
    communityPicker: 'create-post-community-picker',
  },
};
