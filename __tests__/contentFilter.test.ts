import { evaluateTextForModeration } from '../src/domain/moderation/contentFilter';

describe('evaluateTextForModeration', () => {
  it('defaults to allow when no terms are provided', () => {
    expect(evaluateTextForModeration('hello world')).toEqual({
      action: 'allow',
      matchedTerms: [],
    });
  });

  it('blocks when blocked terms match', () => {
    const result = evaluateTextForModeration('This contains scam content', {
      blockedTerms: ['scam'],
    });

    expect(result.action).toBe('block');
    expect(result.matchedTerms).toEqual(['scam']);
  });

  it('prioritizes block over review', () => {
    const result = evaluateTextForModeration('spam and violence', {
      blockedTerms: ['spam'],
      reviewTerms: ['violence'],
    });

    expect(result.action).toBe('block');
    expect(result.matchedTerms).toEqual(['spam']);
  });

  it('marks for review when review terms match', () => {
    const result = evaluateTextForModeration('This includes harassment', {
      reviewTerms: ['harassment'],
    });

    expect(result.action).toBe('review');
    expect(result.matchedTerms).toEqual(['harassment']);
  });

  it('ignores non-word terms', () => {
    const result = evaluateTextForModeration('spam!!', {
      blockedTerms: ['spam!!'],
    });

    expect(result.action).toBe('allow');
    expect(result.matchedTerms).toEqual([]);
  });
});
