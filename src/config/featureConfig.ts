import type { FeatureConfigValue } from '../domain/models/featureConfig';
import { normalizeTerms } from '../domain/moderation/termUtils';

export const FEATURE_CONFIG_KEYS = {
  blockedTerms: 'moderation_blocked_terms',
  reviewTerms: 'moderation_review_terms',
  termsVersion: 'terms_version',
  termsUrl: 'terms_url',
} as const;

export const FEATURE_CONFIG_DESCRIPTIONS = {
  blockedTerms: 'Terms that block content immediately.',
  reviewTerms: 'Terms that place content into review.',
  termsVersion: 'Current Terms of Service version required for acceptance.',
  termsUrl: 'Public Terms of Service URL.',
} as const;

export const parseStringArrayConfig = (value: FeatureConfigValue | undefined | null): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return normalizeTerms(value.map((term) => String(term)));
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return normalizeTerms(parsed.map((term) => String(term)));
        }
      } catch {
        // fall back to delimiter parsing
      }
    }
    return normalizeTerms(trimmed.split(/[\n,]+/));
  }
  return [];
};

export const formatStringArrayConfig = (terms: string[]) => terms.join(', ');

export const parseStringConfig = (value: FeatureConfigValue | undefined | null): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};
