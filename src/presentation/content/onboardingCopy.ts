import { t } from '../i18n';

export const onboardingCopy = {
  skip: t('onboarding.skip'),
  slides: {
    discover: {
      title: t('onboarding.slides.discover.title'),
      description: t('onboarding.slides.discover.description'),
    },
    share: {
      title: t('onboarding.slides.share.title'),
      description: t('onboarding.slides.share.description'),
    },
    connect: {
      title: t('onboarding.slides.connect.title'),
      description: t('onboarding.slides.connect.description'),
    },
  },
  buttons: {
    next: t('onboarding.buttons.next'),
    previous: t('onboarding.buttons.previous'),
    getStarted: t('onboarding.buttons.getStarted'),
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
