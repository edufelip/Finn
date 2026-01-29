import { parseStringArrayConfig } from '../src/config/featureConfig';

describe('parseStringArrayConfig', () => {
  it('returns empty for undefined', () => {
    expect(parseStringArrayConfig(undefined)).toEqual([]);
  });

  it('parses array values', () => {
    expect(parseStringArrayConfig(['Spam', '  scam '])).toEqual(['spam', 'scam']);
  });

  it('parses comma-separated strings', () => {
    expect(parseStringArrayConfig('spam, scam')).toEqual(['spam', 'scam']);
  });

  it('parses JSON arrays from strings', () => {
    expect(parseStringArrayConfig('["spam", "scam"]')).toEqual(['spam', 'scam']);
  });

  it('filters non-word terms', () => {
    expect(parseStringArrayConfig('spam!!, ok_word, 🔥')).toEqual(['ok_word']);
  });
});
