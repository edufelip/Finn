import type { User } from './models/user';

export const ONLINE_THRESHOLD_MS = 2 * 60 * 1000;

export const isUserOnline = (user: Pick<User, 'onlineVisible' | 'lastSeenAt'>, now = Date.now()) => {
  if (!user.onlineVisible) {
    return false;
  }
  if (!user.lastSeenAt) {
    return false;
  }
  return now - new Date(user.lastSeenAt).getTime() <= ONLINE_THRESHOLD_MS;
};
