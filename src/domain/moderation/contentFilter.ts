export type ContentModerationResult = {
  action: 'allow' | 'review' | 'block';
  matchedTerms: string[];
};

const BLOCK_TERMS: string[] = [
  // Add severe terms here that should block posting outright.
];

const REVIEW_TERMS: string[] = [
  'abuse',
  'harassment',
  'hate',
  'threat',
  'violence',
  'porn',
  'nsfw',
  'spam',
  'scam',
];

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const findMatches = (text: string, terms: string[]) => {
  if (!text.trim()) return [] as string[];
  const normalized = text.toLowerCase();
  return terms.filter((term) => {
    const pattern = new RegExp(`\\b${escapeRegExp(term)}\\b`, 'i');
    return pattern.test(normalized);
  });
};

export const evaluateTextForModeration = (text: string): ContentModerationResult => {
  const blockedMatches = findMatches(text, BLOCK_TERMS);
  if (blockedMatches.length > 0) {
    return { action: 'block', matchedTerms: blockedMatches };
  }

  const reviewMatches = findMatches(text, REVIEW_TERMS);
  if (reviewMatches.length > 0) {
    return { action: 'review', matchedTerms: reviewMatches };
  }

  return { action: 'allow', matchedTerms: [] };
};
