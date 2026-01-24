import { t } from '../i18n';

export const editCommunityCopy = {
  get title() { return t('editCommunity.title'); },
  get coverImageLabel() { return t('editCommunity.coverImageLabel'); },
  get changeCoverImage() { return t('editCommunity.changeCoverImage'); },
  get postPermissionLabel() { return t('editCommunity.postPermissionLabel'); },
  postPermissionOptions: {
    anyone_follows: {
      get label() { return t('editCommunity.postPermission.anyone_follows.label'); },
      get description() { return t('editCommunity.postPermission.anyone_follows.description'); },
    },
    moderated: {
      get label() { return t('editCommunity.postPermission.moderated.label'); },
      get description() { return t('editCommunity.postPermission.moderated.description'); },
    },
    private: {
      get label() { return t('editCommunity.postPermission.private.label'); },
      get description() { return t('editCommunity.postPermission.private.description'); },
    },
  },
  get moderationSection() { return t('editCommunity.moderationSection'); },
  get pendingContentButton() { return t('editCommunity.pendingContentButton'); },
  get reportedContentButton() { return t('editCommunity.reportedContentButton'); },
  get moderationLogsButton() { return t('editCommunity.moderationLogsButton'); },
  get manageModeratorsButton() { return t('editCommunity.manageModeratorsButton'); },
  get saveButton() { return t('editCommunity.saveButton'); },
  get savingButton() { return t('editCommunity.savingButton'); },
  alerts: {
    signInRequired: {
      get title() { return t('editCommunity.alert.signInRequired.title'); },
      get message() { return t('editCommunity.alert.signInRequired.message'); },
    },
    notAuthorized: {
      get title() { return t('editCommunity.alert.notAuthorized.title'); },
      get message() { return t('editCommunity.alert.notAuthorized.message'); },
    },
    offline: {
      get title() { return t('editCommunity.alert.offline.title'); },
      get message() { return t('editCommunity.alert.offline.message'); },
    },
    saved: {
      get title() { return t('editCommunity.alert.saved.title'); },
      get message() { return t('editCommunity.alert.saved.message'); },
      get okButton() { return t('editCommunity.alert.saved.okButton'); },
    },
    unsavedChanges: {
      get title() { return t('editCommunity.alert.unsavedChanges.title'); },
      get message() { return t('editCommunity.alert.unsavedChanges.message'); },
      get keepEditing() { return t('editCommunity.alert.unsavedChanges.keepEditing'); },
      get discard() { return t('editCommunity.alert.unsavedChanges.discard'); },
    },
    failed: {
      get title() { return t('editCommunity.alert.failed.title'); },
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
