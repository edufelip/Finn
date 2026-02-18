import * as brandColors from '../../../packages/brand/colors';

export type ColorRoles = {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  background: string;
  onBackground: string;
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  inverseSurface: string;
  inverseOnSurface: string;
  inversePrimary: string;
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;
  outline: string;
  outlineVariant: string;
  surfaceTint: string;
  scrim: string;
  shadow: string;
  onScrim: string;
};

export type ThemeColors = ColorRoles;
export const lightColors: ColorRoles = brandColors.lightColors;
export const darkColors: ColorRoles = brandColors.darkColors;
