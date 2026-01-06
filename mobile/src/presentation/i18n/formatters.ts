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
  const rtf = new Intl.RelativeTimeFormat(getLocale(), { numeric: 'auto' });

  if (absSeconds < 60) return rtf.format(diffSeconds, 'second');
  const diffMinutes = Math.round(diffSeconds / 60);
  if (Math.abs(diffMinutes) < 60) return rtf.format(diffMinutes, 'minute');
  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, 'hour');
  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 7) return rtf.format(diffDays, 'day');
  const diffWeeks = Math.round(diffDays / 7);
  if (Math.abs(diffWeeks) < 4) return rtf.format(diffWeeks, 'week');
  const diffMonths = Math.round(diffDays / 30);
  if (Math.abs(diffMonths) < 12) return rtf.format(diffMonths, 'month');
  const diffYears = Math.round(diffDays / 365);
  return rtf.format(diffYears, 'year');
};
