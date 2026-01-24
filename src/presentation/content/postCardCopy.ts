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
  report: {
    error: {
      title: t('post.report.error.title'),
      notLoggedIn: t('post.report.error.notLoggedIn'),
    },
    success: {
      title: t('post.report.success.title'),
      message: t('post.report.success.message'),
    },
    failed: {
      title: t('post.report.failed.title'),
      message: t('post.report.failed.message'),
    },
  },
};
