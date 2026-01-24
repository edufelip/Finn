import { t } from '../i18n';

export const imagePickerCopy = {
  get title() { return t('imagePicker.title'); },
  get camera() { return t('imagePicker.camera'); },
  get gallery() { return t('imagePicker.gallery'); },
  get cancel() { return t('imagePicker.cancel'); },
  alerts: {
    cameraPermission: {
      get title() { return t('imagePicker.alert.camera.title'); },
      get message() { return t('imagePicker.alert.camera.message'); },
    },
    galleryPermission: {
      get title() { return t('imagePicker.alert.gallery.title'); },
      get message() { return t('imagePicker.alert.gallery.message'); },
    },
    cameraUnavailable: {
      get title() { return t('imagePicker.alert.cameraUnavailable.title'); },
      get message() { return t('imagePicker.alert.cameraUnavailable.message'); },
    },
  },
  testIds: {
    camera: 'image-picker-camera',
    gallery: 'image-picker-gallery',
    cancel: 'image-picker-cancel',
  },
};
