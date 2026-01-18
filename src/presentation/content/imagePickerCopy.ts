import { t } from '../i18n';

export const imagePickerCopy = {
  title: t('imagePicker.title'),
  camera: t('imagePicker.camera'),
  gallery: t('imagePicker.gallery'),
  cancel: t('imagePicker.cancel'),
  alerts: {
    cameraPermission: {
      title: t('imagePicker.alert.camera.title'),
      message: t('imagePicker.alert.camera.message'),
    },
    galleryPermission: {
      title: t('imagePicker.alert.gallery.title'),
      message: t('imagePicker.alert.gallery.message'),
    },
    cameraUnavailable: {
      title: t('imagePicker.alert.cameraUnavailable.title'),
      message: t('imagePicker.alert.cameraUnavailable.message'),
    },
  },
  testIds: {
    camera: 'image-picker-camera',
    gallery: 'image-picker-gallery',
    cancel: 'image-picker-cancel',
  },
};
