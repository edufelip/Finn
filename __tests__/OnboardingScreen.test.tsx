import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import OnboardingScreen from '../src/presentation/screens/OnboardingScreen';
import { onboardingCopy } from '../src/presentation/content/onboardingCopy';

let mockLocale: 'en' | 'es' = 'en';
const tMockMap: Record<'en' | 'es', Record<string, string>> = {
  en: {
    'onboarding.skip': 'Skip',
    'onboarding.slides.discover.title': 'Discover',
    'onboarding.slides.discover.description': 'Discover description',
    'onboarding.slides.share.title': 'Share',
    'onboarding.slides.share.description': 'Share description',
    'onboarding.slides.connect.title': 'Connect',
    'onboarding.slides.connect.description': 'Connect description',
    'onboarding.buttons.next': 'Next',
    'onboarding.buttons.previous': 'Previous',
    'onboarding.buttons.getStarted': 'Get Started',
  },
  es: {
    'onboarding.skip': 'Saltar',
    'onboarding.slides.discover.title': 'Descubrir',
    'onboarding.slides.discover.description': 'Descubre descripción',
    'onboarding.slides.share.title': 'Compartir',
    'onboarding.slides.share.description': 'Comparte descripción',
    'onboarding.slides.connect.title': 'Conectar',
    'onboarding.slides.connect.description': 'Conectar descripción',
    'onboarding.buttons.next': 'Siguiente',
    'onboarding.buttons.previous': 'Anterior',
    'onboarding.buttons.getStarted': 'Comenzar',
  },
};

jest.mock('../src/presentation/i18n', () => ({
  t: (key: string) => tMockMap[mockLocale][key] ?? key,
  tList: () => [],
}));

// Mock dependencies
const mockCompleteOnboarding = jest.fn();

jest.mock('../src/app/store/appStore', () => ({
  useAppStore: () => ({
    completeOnboarding: mockCompleteOnboarding,
  }),
}));

jest.mock('@assets/images', () => ({
  Images: {
    onboardingFirst: 1,
    onboardingSecond: 2,
    onboardingThird: 3,
  },
}), { virtual: true });

jest.mock('../src/app/providers/ThemeProvider', () => ({
  useThemeColors: () => ({
    background: '#ffffff',
    primary: '#000000',
    onPrimary: '#ffffff',
    surfaceVariant: '#eeeeee',
    onSurfaceVariant: '#666666',
    onBackground: '#000000',
    outline: '#cccccc',
    onSurface: '#000000',
  }),
}));

jest.mock('../src/app/providers/LocalizationProvider', () => ({
  useLocalization: () => ({ locale: mockLocale }),
}));

describe('OnboardingScreen', () => {
  beforeEach(() => {
    mockLocale = 'en';
    mockCompleteOnboarding.mockClear();
  });

  it('renders the first slide correctly', () => {
    const { getByTestId } = render(<OnboardingScreen />);

    expect(getByTestId(onboardingCopy.testIds.container)).toBeTruthy();
    expect(getByTestId(onboardingCopy.testIds.slideImage(0))).toBeTruthy();
    expect(getByTestId(onboardingCopy.testIds.slideTitle(0))).toBeTruthy();
    expect(getByTestId(onboardingCopy.testIds.slideDescription(0))).toBeTruthy();
    expect(getByTestId(onboardingCopy.testIds.nextButton)).toBeTruthy();
  });

  it('updates text when locale changes', () => {
    const { getByText, queryByText, rerender } = render(<OnboardingScreen />);

    expect(getByText('Skip')).toBeTruthy();
    expect(getByText('Discover')).toBeTruthy();
    expect(getByText('Discover description')).toBeTruthy();

    mockLocale = 'es';
    rerender(<OnboardingScreen />);

    expect(getByText('Saltar')).toBeTruthy();
    expect(getByText('Descubrir')).toBeTruthy();
    expect(getByText('Descubre descripción')).toBeTruthy();
    expect(queryByText('Discover')).toBeNull();

    mockLocale = 'en';
  });

  it('navigates to the next slide on next button press', () => {
    const { getByTestId } = render(<OnboardingScreen />);

    // Initial state: slide 0
    expect(getByTestId(onboardingCopy.testIds.slideTitle(0))).toBeTruthy();

    // Press next
    fireEvent.press(getByTestId(onboardingCopy.testIds.nextButton));

    // Note: Since we can't easily test ScrollView scrolling in unit tests without extensive mocking of layout,
    // we primarily check if the state update logic for buttons works or if the function to scroll is called.
    // However, the component updates `currentIndex` based on `onMomentumScrollEnd` or button press.
    // In this component, `handleNext` calls `scrollTo` AND `setCurrentIndex(currentIndex + 1)`.
    // So the UI should update to show the next slide's controls or the scroll position updates.
    
    // We can check if "previous" button appears (which only appears on index 1 and 2)
    // After 1st press (index 0 -> 1), "previous" button should be visible.
    expect(getByTestId(onboardingCopy.testIds.previousButton)).toBeTruthy();
  });

  it('calls completeOnboarding when skip is pressed', () => {
    const { getByTestId } = render(<OnboardingScreen />);
    
    fireEvent.press(getByTestId(onboardingCopy.testIds.skipButton));
    
    expect(mockCompleteOnboarding).toHaveBeenCalled();
  });

  it('renders all slides images', () => {
    const { getByTestId } = render(<OnboardingScreen />);
    
    // ScrollView renders all children usually
    expect(getByTestId(onboardingCopy.testIds.slideImage(0))).toBeTruthy();
    expect(getByTestId(onboardingCopy.testIds.slideImage(1))).toBeTruthy();
    expect(getByTestId(onboardingCopy.testIds.slideImage(2))).toBeTruthy();
  });
});
