import { t } from '../i18n';

export const createPostCopy = {
  get title() { return t('createPost.title'); },
  get communityPlaceholder() { return t('createPost.communityPlaceholder'); },
  get contentPlaceholder() { return t('createPost.contentPlaceholder'); },
  contentCount: (count: number, max: number) => t('createPost.contentCount', { count, max }),
  get mediaLabel() { return t('createPost.mediaLabel'); },
  get mediaHelper() { return t('createPost.mediaHelper'); },
  get modalTitle() { return t('createPost.modalTitle'); },
  get submit() { return t('createPost.submit'); },
  get submitLoading() { return t('createPost.submitLoading'); },
  alerts: {
    loadCommunitiesFailed: {
      get title() { return t('createPost.alert.loadCommunitiesFailed.title'); },
    },
    permission: {
      get title() { return t('createPost.alert.permission.title'); },
      get message() { return t('createPost.alert.permission.message'); },
    },
    signInRequired: {
      get title() { return t('createPost.alert.signInRequired.title'); },
      get message() { return t('createPost.alert.signInRequired.message'); },
    },
    contentRequired: {
      get title() { return t('createPost.alert.contentRequired.title'); },
      get message() { return t('createPost.alert.contentRequired.message'); },
    },
    communityRequired: {
      get title() { return t('createPost.alert.communityRequired.title'); },
      get message() { return t('createPost.alert.communityRequired.message'); },
    },
    offline: {
      get title() { return t('createPost.alert.offline.title'); },
      get message() { return t('createPost.alert.offline.message'); },
    },
    posted: {
      get title() { return t('createPost.alert.posted.title'); },
      get message() { return t('createPost.alert.posted.message'); },
    },
    failed: {
      get title() { return t('createPost.alert.failed.title'); },
    },
    get communityNotFound() { return t('createPost.alert.communityNotFound'); },
    pendingModeration: {
      get title() { return t('createPost.alert.pendingModeration.title'); },
      get message() { return t('createPost.alert.pendingModeration.message'); },
    },
  },
  get moderationNotice() { return t('createPost.moderationNotice'); },
  testIds: {
    content: 'create-post-content',
    image: 'create-post-image',
    imagePreview: 'create-post-image-preview',
    submit: 'create-post-submit',
    communityPicker: 'create-post-community-picker',
  },
};
