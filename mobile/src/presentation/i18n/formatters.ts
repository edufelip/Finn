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
