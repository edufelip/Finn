import { t } from '../i18n';

export const createBottomSheetCopy = {
  get title() { return t('createSheet.title'); },
  get communityLabel() { return t('createSheet.community'); },
  get communityDescription() { return t('createSheet.communityDescription'); },
  get postLabel() { return t('createSheet.post'); },
  get postDescription() { return t('createSheet.postDescription'); },
  get closeLabel() { return t('createSheet.close'); },
  testIds: {
    community: 'create-community-action',
    post: 'create-post-action',
  },
};
