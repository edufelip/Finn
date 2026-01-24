import { t } from '../i18n';

export const postCardCopy = {
  get optionsTitle() { return t('post.optionsTitle'); },
  get save() { return t('post.save'); },
  get unsave() { return t('post.unsave'); },
  get markForReview() { return t('post.options.markForReview'); },
  get reportAction() { return t('post.options.report'); },
  get cancel() { return t('post.cancel'); },
  get share() { return t('post.share'); },
  get communityFallback() { return t('post.communityFallback'); },
  get authorFallback() { return t('post.authorFallback'); },
  postedBy: (name: string) => t('post.postedBy', { name }),
  report: {
    error: {
      get title() { return t('post.report.error.title'); },
      get notLoggedIn() { return t('post.report.error.notLoggedIn'); },
    },
    success: {
      get title() { return t('post.report.success.title'); },
      get message() { return t('post.report.success.message'); },
    },
    failed: {
      get title() { return t('post.report.failed.title'); },
      get message() { return t('post.report.failed.message'); },
    },
  },
};
