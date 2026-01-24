import { t } from '../i18n';

export const createCommunityCopy = {
  get headerTitle() { return t('createCommunity.headerTitle'); },
  get titleLabel() { return t('createCommunity.titleLabel'); },
  get titlePlaceholder() { return t('createCommunity.titlePlaceholder'); },
  get descriptionLabel() { return t('createCommunity.descriptionLabel'); },
  get descriptionPlaceholder() { return t('createCommunity.descriptionPlaceholder'); },
  descriptionCount: (count: number, max: number) =>
    t('createCommunity.descriptionCount', { count, max }),
  get topicLabel() { return t('createCommunity.topicLabel'); },
  get topicPlaceholder() { return t('createCommunity.topicPlaceholder'); },
  get iconLabel() { return t('createCommunity.iconLabel'); },
  get iconHelper() { return t('createCommunity.iconHelper'); },
  get submit() { return t('createCommunity.submit'); },
  get submitLoading() { return t('createCommunity.submitLoading'); },
  alerts: {
    permission: {
      get title() { return t('createCommunity.alert.permission.title'); },
      get message() { return t('createCommunity.alert.permission.message'); },
    },
    signInRequired: {
      get title() { return t('createCommunity.alert.signInRequired.title'); },
      get message() { return t('createCommunity.alert.signInRequired.message'); },
    },
    titleRequired: {
      get title() { return t('createCommunity.alert.titleRequired.title'); },
      get message() { return t('createCommunity.alert.titleRequired.message'); },
    },
    descriptionRequired: {
      get title() { return t('createCommunity.alert.descriptionRequired.title'); },
      get message() { return t('createCommunity.alert.descriptionRequired.message'); },
    },
    imageRequired: {
      get title() { return t('createCommunity.alert.imageRequired.title'); },
      get message() { return t('createCommunity.alert.imageRequired.message'); },
    },
    offline: {
      get title() { return t('createCommunity.alert.offline.title'); },
      get message() { return t('createCommunity.alert.offline.message'); },
    },
    created: {
      get title() { return t('createCommunity.alert.created.title'); },
      get message() { return t('createCommunity.alert.created.message'); },
    },
    failed: {
      get title() { return t('createCommunity.alert.failed.title'); },
    },
  },
  testIds: {
    title: 'create-community-title',
    description: 'create-community-description',
    image: 'create-community-image',
    imagePreview: 'create-community-image-preview',
    imageError: 'create-community-image-error',
    submit: 'create-community-submit',
  },
};
