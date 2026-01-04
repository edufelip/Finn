import { t } from '../i18n';

export const createCommunityCopy = {
  titleLabel: t('createCommunity.titleLabel'),
  titlePlaceholder: t('createCommunity.titlePlaceholder'),
  descriptionLabel: t('createCommunity.descriptionLabel'),
  descriptionPlaceholder: t('createCommunity.descriptionPlaceholder'),
  iconLabel: t('createCommunity.iconLabel'),
  submit: t('createCommunity.submit'),
  submitLoading: t('createCommunity.submitLoading'),
  alerts: {
    permission: {
      title: t('createCommunity.alert.permission.title'),
      message: t('createCommunity.alert.permission.message'),
    },
    signInRequired: {
      title: t('createCommunity.alert.signInRequired.title'),
      message: t('createCommunity.alert.signInRequired.message'),
    },
    titleRequired: {
      title: t('createCommunity.alert.titleRequired.title'),
      message: t('createCommunity.alert.titleRequired.message'),
    },
    descriptionRequired: {
      title: t('createCommunity.alert.descriptionRequired.title'),
      message: t('createCommunity.alert.descriptionRequired.message'),
    },
    offline: {
      title: t('createCommunity.alert.offline.title'),
      message: t('createCommunity.alert.offline.message'),
    },
    created: {
      title: t('createCommunity.alert.created.title'),
      message: t('createCommunity.alert.created.message'),
    },
    failed: {
      title: t('createCommunity.alert.failed.title'),
    },
  },
  testIds: {
    title: 'create-community-title',
    description: 'create-community-description',
    image: 'create-community-image',
    imagePreview: 'create-community-image-preview',
    submit: 'create-community-submit',
  },
};
