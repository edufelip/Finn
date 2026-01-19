import { t } from '../i18n';

export const manageModeratorsCopy = {
  title: t('manageModerators.title'),
  unknownUser: t('manageModerators.unknownUser'),
  owner: t('manageModerators.owner'),
  emptyState: {
    title: t('manageModerators.emptyState.title'),
    message: t('manageModerators.emptyState.message'),
  },
  addButton: t('manageModerators.addButton'),
  removeButton: t('manageModerators.removeButton'),
  assignedBy: (userName: string) => t('manageModerators.assignedBy', { userName }),
  addModerator: {
    title: t('manageModerators.addModerator.title'),
    prompt: t('manageModerators.addModerator.prompt'),
    placeholder: t('manageModerators.addModerator.placeholder'),
    searchPlaceholder: t('manageModerators.addModerator.searchPlaceholder'),
    confirm: t('manageModerators.addModerator.confirm'),
    cancel: t('manageModerators.addModerator.cancel'),
  },
  confirmRemove: {
    title: t('manageModerators.confirmRemove.title'),
    message: (userName: string) => t('manageModerators.confirmRemove.message', { userName }),
    confirm: t('manageModerators.confirmRemove.confirm'),
    cancel: t('manageModerators.confirmRemove.cancel'),
  },
  alerts: {
    signInRequired: {
      title: t('manageModerators.alert.signInRequired.title'),
      message: t('manageModerators.alert.signInRequired.message'),
    },
    notAuthorized: {
      title: t('manageModerators.alert.notAuthorized.title'),
      message: t('manageModerators.alert.notAuthorized.message'),
    },
    onlyOwnerCanRemove: {
      title: t('manageModerators.alert.onlyOwnerCanRemove.title'),
      message: t('manageModerators.alert.onlyOwnerCanRemove.message'),
    },
    confirmRemove: {
      title: t('manageModerators.alert.confirmRemove.title'),
      message: t('manageModerators.alert.confirmRemove.message'),
      confirm: t('manageModerators.alert.confirmRemove.confirm'),
      cancel: t('manageModerators.alert.confirmRemove.cancel'),
    },
    offline: {
      title: t('manageModerators.alert.offline.title'),
      message: t('manageModerators.alert.offline.message'),
    },
    added: {
      title: t('manageModerators.alert.added.title'),
      message: (userName: string) => t('manageModerators.alert.added.message', { userName }),
    },
    removed: {
      title: t('manageModerators.alert.removed.title'),
      message: (userName: string) => t('manageModerators.alert.removed.message', { userName }),
    },
    alreadyModerator: {
      title: t('manageModerators.alert.alreadyModerator.title'),
      message: t('manageModerators.alert.alreadyModerator.message'),
    },
    failed: {
      title: t('manageModerators.alert.failed.title'),
    },
  },
  testIds: {
    addButton: 'manage-moderators-add-button',
    removeButton: 'manage-moderators-remove-button',
    searchInput: 'manage-moderators-search-input',
  },
};
