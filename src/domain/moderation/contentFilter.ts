import { normalizeTerms } from './termUtils';

export type ContentModerationResult = {
  action: 'allow' | 'review' | 'block';
  matchedTerms: string[];
};

export type ContentModerationTerms = {
  blockedTerms?: string[];
  reviewTerms?: string[];
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const findMatches = (text: string, terms: string[]) => {
  if (!text.trim()) return [] as string[];
  const normalized = text.toLowerCase();
  return terms.filter((term) => {
    const pattern = new RegExp(`\\b${escapeRegExp(term)}\\b`, 'i');
    return pattern.test(normalized);
  });
};

export const evaluateTextForModeration = (
  text: string,
  terms?: ContentModerationTerms
): ContentModerationResult => {
  const blockedTerms = normalizeTerms(terms?.blockedTerms);
  const reviewTerms = normalizeTerms(terms?.reviewTerms);
  const blockedMatches = findMatches(text, blockedTerms);
  if (blockedMatches.length > 0) {
    return { action: 'block', matchedTerms: blockedMatches };
  }

  const reviewMatches = findMatches(text, reviewTerms);
  if (reviewMatches.length > 0) {
    return { action: 'review', matchedTerms: reviewMatches };
  }

  return { action: 'allow', matchedTerms: [] };
};
