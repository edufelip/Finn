import { t } from '../i18n';

export const editProfileCopy = {
  get title() { return t('editProfile.title'); },
  get photoLabel() { return t('editProfile.photoLabel'); },
  get changePhoto() { return t('editProfile.changePhoto'); },
  get nameLabel() { return t('editProfile.nameLabel'); },
  get namePlaceholder() { return t('editProfile.namePlaceholder'); },
  get bioLabel() { return t('editProfile.bioLabel'); },
  get bioPlaceholder() { return t('editProfile.bioPlaceholder'); },
  bioCount: (count: number, max: number) => t('editProfile.bioCount', { count, max }),
  get locationLabel() { return t('editProfile.locationLabel'); },
  get locationPlaceholder() { return t('editProfile.locationPlaceholder'); },
  get saveButton() { return t('editProfile.saveButton'); },
  get savingButton() { return t('editProfile.savingButton'); },
  alerts: {
    nameRequired: {
      get title() { return t('editProfile.alert.nameRequired.title'); },
      get message() { return t('editProfile.alert.nameRequired.message'); },
    },
    bioTooLong: {
      get title() { return t('editProfile.alert.bioTooLong.title'); },
      get message() { return t('editProfile.alert.bioTooLong.message'); },
    },
    signInRequired: {
      get title() { return t('editProfile.alert.signInRequired.title'); },
      get message() { return t('editProfile.alert.signInRequired.message'); },
    },
    offline: {
      get title() { return t('editProfile.alert.offline.title'); },
      get message() { return t('editProfile.alert.offline.message'); },
    },
    saved: {
      get title() { return t('editProfile.alert.saved.title'); },
      get message() { return t('editProfile.alert.saved.message'); },
    },
    failed: {
      get title() { return t('editProfile.alert.failed.title'); },
    },
  },
  unsavedChanges: {
    get title() { return t('editProfile.unsavedChanges.title'); },
    get message() { return t('editProfile.unsavedChanges.message'); },
    get keep() { return t('editProfile.unsavedChanges.keep'); },
    get discard() { return t('editProfile.unsavedChanges.discard'); },
  },
  testIds: {
    photoButton: 'edit-profile-photo-button',
    nameInput: 'edit-profile-name-input',
    bioInput: 'edit-profile-bio-input',
    locationInput: 'edit-profile-location-input',
    saveButton: 'edit-profile-save-button',
  },
};
