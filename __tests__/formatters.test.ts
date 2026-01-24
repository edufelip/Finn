import { formatTimeAgo } from '../src/presentation/i18n/formatters';

describe('formatTimeAgo', () => {
  const originalIntl = global.Intl;

  afterEach(() => {
    global.Intl = originalIntl;
    jest.useRealTimers();
  });

  it('falls back to a simple string when Intl.RelativeTimeFormat is unavailable', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-01T12:00:00.000Z'));

    // @ts-expect-error - simulate environment without Intl.RelativeTimeFormat.
    global.Intl = undefined;

    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();

    expect(formatTimeAgo(twoMinutesAgo)).toBe('2 minutes ago');
  });
});
