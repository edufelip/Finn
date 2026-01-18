import { t } from '../i18n';

export const editProfileCopy = {
  title: t('editProfile.title'),
  photoLabel: t('editProfile.photoLabel'),
  changePhoto: t('editProfile.changePhoto'),
  nameLabel: t('editProfile.nameLabel'),
  namePlaceholder: t('editProfile.namePlaceholder'),
  bioLabel: t('editProfile.bioLabel'),
  bioPlaceholder: t('editProfile.bioPlaceholder'),
  bioCount: (count: number, max: number) => t('editProfile.bioCount', { count, max }),
  locationLabel: t('editProfile.locationLabel'),
  locationPlaceholder: t('editProfile.locationPlaceholder'),
  saveButton: t('editProfile.saveButton'),
  savingButton: t('editProfile.savingButton'),
  alerts: {
    nameRequired: {
      title: t('editProfile.alert.nameRequired.title'),
      message: t('editProfile.alert.nameRequired.message'),
    },
    bioTooLong: {
      title: t('editProfile.alert.bioTooLong.title'),
      message: t('editProfile.alert.bioTooLong.message'),
    },
    signInRequired: {
      title: t('editProfile.alert.signInRequired.title'),
      message: t('editProfile.alert.signInRequired.message'),
    },
    offline: {
      title: t('editProfile.alert.offline.title'),
      message: t('editProfile.alert.offline.message'),
    },
    saved: {
      title: t('editProfile.alert.saved.title'),
      message: t('editProfile.alert.saved.message'),
    },
    failed: {
      title: t('editProfile.alert.failed.title'),
    },
  },
  unsavedChanges: {
    title: t('editProfile.unsavedChanges.title'),
    message: t('editProfile.unsavedChanges.message'),
    keep: t('editProfile.unsavedChanges.keep'),
    discard: t('editProfile.unsavedChanges.discard'),
  },
  testIds: {
    photoButton: 'edit-profile-photo-button',
    nameInput: 'edit-profile-name-input',
    bioInput: 'edit-profile-bio-input',
    locationInput: 'edit-profile-location-input',
    saveButton: 'edit-profile-save-button',
  },
};
