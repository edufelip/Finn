import React from 'react';
import { render } from '@testing-library/react-native';
import TermsAcceptanceScreen from '../src/presentation/screens/TermsAcceptanceScreen';

let mockLocale: 'en' | 'es' = 'en';

const termsAcceptanceMockMap: Record<'en' | 'es', Record<string, string>> = {
  en: {
    'terms.title': 'Terms',
    'terms.description': 'Please accept the terms to continue.',
    'terms.linkLabel': 'Read Terms',
    'terms.checkboxLabel': 'I have read and agree',
    'terms.acceptButton': 'Accept',
    'terms.alert.failed.title': 'Error',
    'terms.alert.failed.message': 'Failed to accept terms',
    'terms.alert.offline.title': 'Offline',
    'terms.alert.offline.message': 'No internet connection',
  },
  es: {
    'terms.title': 'Términos',
    'terms.description': 'Acepta los términos para continuar.',
    'terms.linkLabel': 'Leer Términos',
    'terms.checkboxLabel': 'He leído y acepto',
    'terms.acceptButton': 'Aceptar',
    'terms.alert.failed.title': 'Error',
    'terms.alert.failed.message': 'Error al aceptar los términos',
    'terms.alert.offline.title': 'Sin conexión',
    'terms.alert.offline.message': 'Sin conexión a internet',
  },
};

jest.mock('../src/presentation/i18n', () => ({
  t: (key: string) => termsAcceptanceMockMap[mockLocale][key] ?? key,
  tList: () => [],
}));

jest.mock('../src/app/providers/AuthProvider', () => ({
  useAuth: () => ({
    session: { user: { id: 'user-1' } },
  }),
}));

jest.mock('../src/app/providers/RepositoryProvider', () => ({
  useRepositories: () => ({
    users: {
      acceptTerms: jest.fn().mockResolvedValue({}),
    },
  }),
}));

jest.mock('../src/app/store/featureConfigStore', () => ({
  useFeatureConfigStore: (selector: (state: any) => any) =>
    selector({
      values: {
        terms_version: 'v1',
        terms_url: 'https://example.com/terms',
      },
      error: null,
    }),
}));

jest.mock('../src/app/providers/ThemeProvider', () => ({
  useThemeColors: () => ({
    background: '#ffffff',
    primary: '#000000',
    onSurface: '#000000',
    surface: '#ffffff',
    outline: '#cccccc',
    onSurfaceVariant: '#666666',
    onPrimary: '#ffffff',
  }),
}));

const mockSetUser = jest.fn();

jest.mock('../src/app/store/userStore', () => ({
  useUserStore: {
    getState: () => ({ setUser: mockSetUser }),
  },
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));

jest.mock('../src/app/providers/LocalizationProvider', () => ({
  useLocalization: () => ({ locale: mockLocale }),
}));

describe('TermsAcceptanceScreen', () => {
  beforeEach(() => {
    mockLocale = 'en';
    mockSetUser.mockClear();
  });

  it('renders translated text and updates when locale changes', () => {
    const { getByText, rerender } = render(<TermsAcceptanceScreen />);

    expect(getByText('Terms')).toBeTruthy();
    expect(getByText('Please accept the terms to continue.')).toBeTruthy();
    expect(getByText('Read Terms')).toBeTruthy();

    mockLocale = 'es';
    rerender(<TermsAcceptanceScreen />);

    expect(getByText('Términos')).toBeTruthy();
    expect(getByText('Acepta los términos para continuar.')).toBeTruthy();
    expect(getByText('Leer Términos')).toBeTruthy();
  });
});
