import { getLocale } from './index';

export const formatMonthYear = (value: string | number | Date) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(getLocale(), { month: 'long', year: 'numeric' }).format(date);
};

export const formatCompactNumber = (value: number) => {
  if (!Number.isFinite(value)) return '';
  return new Intl.NumberFormat(getLocale(), { notation: 'compact', maximumFractionDigits: 1 }).format(value);
};

export const maskEmail = (value: string) => {
  if (!value) return '';
  const [local, domain] = value.split('@');
  if (!domain) return value;
  const first = local?.[0] ?? '';
  const maskedLocal = `${first}***`;
  return `${maskedLocal}@${domain}`;
};

export const formatTimeAgo = (value: string | number | Date) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffSeconds = Math.round(diffMs / 1000);
  const absSeconds = Math.abs(diffSeconds);
  const rtf = createRelativeTimeFormatter();
  const formatRelative = (valueToFormat: number, unit: RelativeTimeUnit) => {
    if (rtf) {
      return rtf.format(valueToFormat, unit);
    }
    return formatRelativeFallback(valueToFormat, unit);
  };

  if (absSeconds < 60) return formatRelative(diffSeconds, 'second');
  const diffMinutes = Math.round(diffSeconds / 60);
  if (Math.abs(diffMinutes) < 60) return formatRelative(diffMinutes, 'minute');
  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) return formatRelative(diffHours, 'hour');
  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 7) return formatRelative(diffDays, 'day');
  const diffWeeks = Math.round(diffDays / 7);
  if (Math.abs(diffWeeks) < 4) return formatRelative(diffWeeks, 'week');
  const diffMonths = Math.round(diffDays / 30);
  if (Math.abs(diffMonths) < 12) return formatRelative(diffMonths, 'month');
  const diffYears = Math.round(diffDays / 365);
  return formatRelative(diffYears, 'year');
};

export const getHoursRemainingUntil = (value: string | number | Date) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const diffMs = date.getTime() - Date.now();
  return Math.ceil(diffMs / (60 * 60 * 1000));
};

type RelativeTimeUnit = 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year';

const createRelativeTimeFormatter = () => {
  if (typeof Intl === 'undefined' || typeof Intl.RelativeTimeFormat !== 'function') {
    return null;
  }
  try {
    return new Intl.RelativeTimeFormat(getLocale(), { numeric: 'auto' });
  } catch {
    return null;
  }
};

const formatRelativeFallback = (value: number, unit: RelativeTimeUnit) => {
  if (value === 0) return 'just now';
  const abs = Math.abs(value);
  const label = abs === 1 ? unit : `${unit}s`;
  return value < 0 ? `${abs} ${label} ago` : `in ${abs} ${label}`;
};
