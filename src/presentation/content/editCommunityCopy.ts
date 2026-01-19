import { t } from '../i18n';

export const editCommunityCopy = {
  title: t('editCommunity.title'),
  coverImageLabel: t('editCommunity.coverImageLabel'),
  changeCoverImage: t('editCommunity.changeCoverImage'),
  postPermissionLabel: t('editCommunity.postPermissionLabel'),
  postPermissionOptions: {
    anyone_follows: {
      label: t('editCommunity.postPermission.anyone_follows.label'),
      description: t('editCommunity.postPermission.anyone_follows.description'),
    },
    moderated: {
      label: t('editCommunity.postPermission.moderated.label'),
      description: t('editCommunity.postPermission.moderated.description'),
    },
    private: {
      label: t('editCommunity.postPermission.private.label'),
      description: t('editCommunity.postPermission.private.description'),
    },
  },
  moderationSection: t('editCommunity.moderationSection'),
  pendingContentButton: t('editCommunity.pendingContentButton'),
  reportedContentButton: t('editCommunity.reportedContentButton'),
  moderationLogsButton: t('editCommunity.moderationLogsButton'),
  manageModeratorsButton: t('editCommunity.manageModeratorsButton'),
  saveButton: t('editCommunity.saveButton'),
  savingButton: t('editCommunity.savingButton'),
  alerts: {
    signInRequired: {
      title: t('editCommunity.alert.signInRequired.title'),
      message: t('editCommunity.alert.signInRequired.message'),
    },
    notAuthorized: {
      title: t('editCommunity.alert.notAuthorized.title'),
      message: t('editCommunity.alert.notAuthorized.message'),
    },
    offline: {
      title: t('editCommunity.alert.offline.title'),
      message: t('editCommunity.alert.offline.message'),
    },
    saved: {
      title: t('editCommunity.alert.saved.title'),
      message: t('editCommunity.alert.saved.message'),
    },
    failed: {
      title: t('editCommunity.alert.failed.title'),
    },
  },
  testIds: {
    coverImageButton: 'edit-community-cover-image-button',
    postPermissionAnyoneFollows: 'edit-community-post-permission-anyone-follows',
    postPermissionModerated: 'edit-community-post-permission-moderated',
    postPermissionPrivate: 'edit-community-post-permission-private',
    pendingContentButton: 'edit-community-pending-content-button',
    reportedContentButton: 'edit-community-reported-content-button',
    moderationLogsButton: 'edit-community-moderation-logs-button',
    manageModeratorsButton: 'edit-community-manage-moderators-button',
    saveButton: 'edit-community-save-button',
  },
};
