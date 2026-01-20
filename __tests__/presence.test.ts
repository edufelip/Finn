import { isUserOnline, ONLINE_THRESHOLD_MS } from '../src/domain/presence';

describe('presence', () => {
  it('returns false when onlineVisible is false', () => {
    expect(isUserOnline({ onlineVisible: false, lastSeenAt: new Date().toISOString() })).toBe(false);
  });

  it('returns false when lastSeenAt is missing', () => {
    expect(isUserOnline({ onlineVisible: true, lastSeenAt: null })).toBe(false);
  });

  it('returns true when lastSeenAt is within threshold', () => {
    const now = Date.now();
    const lastSeenAt = new Date(now - ONLINE_THRESHOLD_MS + 5000).toISOString();
    expect(isUserOnline({ onlineVisible: true, lastSeenAt }, now)).toBe(true);
  });

  it('returns false when lastSeenAt exceeds threshold', () => {
    const now = Date.now();
    const lastSeenAt = new Date(now - ONLINE_THRESHOLD_MS - 5000).toISOString();
    expect(isUserOnline({ onlineVisible: true, lastSeenAt }, now)).toBe(false);
  });
});
