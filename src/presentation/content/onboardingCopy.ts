import { t } from '../i18n';

export const onboardingCopy = {
  get skip() { return t('onboarding.skip'); },
  slides: {
    discover: {
      get title() { return t('onboarding.slides.discover.title'); },
      get description() { return t('onboarding.slides.discover.description'); },
    },
    share: {
      get title() { return t('onboarding.slides.share.title'); },
      get description() { return t('onboarding.slides.share.description'); },
    },
    connect: {
      get title() { return t('onboarding.slides.connect.title'); },
      get description() { return t('onboarding.slides.connect.description'); },
    },
  },
  buttons: {
    get next() { return t('onboarding.buttons.next'); },
    get previous() { return t('onboarding.buttons.previous'); },
    get getStarted() { return t('onboarding.buttons.getStarted'); },
  },
  testIds: {
    container: 'onboarding-container',
    skipButton: 'onboarding-skip-button',
    scrollView: 'onboarding-scroll-view',
    slide: (index: number) => `onboarding-slide-${index}`,
    slideImage: (index: number) => `onboarding-slide-image-${index}`,
    slideTitle: (index: number) => `onboarding-slide-title-${index}`,
    slideDescription: (index: number) => `onboarding-slide-description-${index}`,
    dot: (index: number) => `onboarding-pagination-dot-${index}`,
    nextButton: 'onboarding-next-button',
    previousButton: 'onboarding-previous-button',
    getStartedButton: 'onboarding-get-started-button',
  },
};
