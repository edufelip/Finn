import { t } from '../i18n';

export const manageModeratorsCopy = {
  get title() { return t('manageModerators.title'); },
  get unknownUser() { return t('manageModerators.unknownUser'); },
  get owner() { return t('manageModerators.owner'); },
  emptyState: {
    get title() { return t('manageModerators.emptyState.title'); },
    get message() { return t('manageModerators.emptyState.message'); },
  },
  get addButton() { return t('manageModerators.addButton'); },
  get removeButton() { return t('manageModerators.removeButton'); },
  assignedBy: (userName: string) => t('manageModerators.assignedBy', { userName }),
  addModerator: {
    get title() { return t('manageModerators.addModerator.title'); },
    get prompt() { return t('manageModerators.addModerator.prompt'); },
    get placeholder() { return t('manageModerators.addModerator.placeholder'); },
    get searchPlaceholder() { return t('manageModerators.addModerator.searchPlaceholder'); },
    get confirm() { return t('manageModerators.addModerator.confirm'); },
    get cancel() { return t('manageModerators.addModerator.cancel'); },
  },
  confirmRemove: {
    get title() { return t('manageModerators.confirmRemove.title'); },
    message: (userName: string) => t('manageModerators.confirmRemove.message', { userName }),
    get confirm() { return t('manageModerators.confirmRemove.confirm'); },
    get cancel() { return t('manageModerators.confirmRemove.cancel'); },
  },
  alerts: {
    signInRequired: {
      get title() { return t('manageModerators.alert.signInRequired.title'); },
      get message() { return t('manageModerators.alert.signInRequired.message'); },
    },
    notAuthorized: {
      get title() { return t('manageModerators.alert.notAuthorized.title'); },
      get message() { return t('manageModerators.alert.notAuthorized.message'); },
    },
    onlyOwnerCanRemove: {
      get title() { return t('manageModerators.alert.onlyOwnerCanRemove.title'); },
      get message() { return t('manageModerators.alert.onlyOwnerCanRemove.message'); },
    },
    confirmRemove: {
      get title() { return t('manageModerators.alert.confirmRemove.title'); },
      get message() { return t('manageModerators.alert.confirmRemove.message'); },
      get confirm() { return t('manageModerators.alert.confirmRemove.confirm'); },
      get cancel() { return t('manageModerators.alert.confirmRemove.cancel'); },
    },
    offline: {
      get title() { return t('manageModerators.alert.offline.title'); },
      get message() { return t('manageModerators.alert.offline.message'); },
    },
    added: {
      get title() { return t('manageModerators.alert.added.title'); },
      message: (userName: string) => t('manageModerators.alert.added.message', { userName }),
    },
    removed: {
      get title() { return t('manageModerators.alert.removed.title'); },
      message: (userName: string) => t('manageModerators.alert.removed.message', { userName }),
    },
    alreadyModerator: {
      get title() { return t('manageModerators.alert.alreadyModerator.title'); },
      get message() { return t('manageModerators.alert.alreadyModerator.message'); },
    },
    failed: {
      get title() { return t('manageModerators.alert.failed.title'); },
    },
  },
  testIds: {
    addButton: 'manage-moderators-add-button',
    removeButton: 'manage-moderators-remove-button',
    searchInput: 'manage-moderators-search-input',
  },
};
