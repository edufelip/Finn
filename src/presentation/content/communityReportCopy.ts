import { t } from '../i18n';

export const communityReportCopy = {
  report: {
    error: {
      get title() { return t('community.report.error.title'); },
      get notLoggedIn() { return t('community.report.error.notLoggedIn'); },
    },
    success: {
      get title() { return t('community.report.success.title'); },
      get message() { return t('community.report.success.message'); },
    },
    failed: {
      get title() { return t('community.report.failed.title'); },
      get message() { return t('community.report.failed.message'); },
    },
  },
};
