import { t } from '../i18n';

export const postCardCopy = {
  optionsTitle: t('post.optionsTitle'),
  save: t('post.save'),
  unsave: t('post.unsave'),
  cancel: t('post.cancel'),
  share: t('post.share'),
  communityFallback: t('post.communityFallback'),
  authorFallback: t('post.authorFallback'),
  postedBy: (name: string) => t('post.postedBy', { name }),
};
