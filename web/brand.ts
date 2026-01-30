import type { CSSProperties } from 'react';

const brandTokens = require('../packages/brand/colors') as {
  lightColors: Record<string, string>;
  brand: {
    name: string;
    domain: string;
    colors: {
      primary: string;
      secondary: string;
      accent: string;
      background: string;
      surface: string;
    };
  };
};

export const brand = brandTokens.brand;
export const lightColors = brandTokens.lightColors;

export const brandCssVars = {
  '--brand-primary': lightColors.primary,
  '--brand-secondary': lightColors.secondary,
  '--brand-accent': lightColors.tertiary,
  '--brand-background': lightColors.background,
  '--brand-surface': lightColors.surface,
  '--brand-on-surface': lightColors.onSurface,
  '--brand-muted': lightColors.onSurfaceVariant,
  '--brand-outline': lightColors.outline,
} as CSSProperties;
