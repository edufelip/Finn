import { getLocale } from './index';

export const formatMonthYear = (value: string | number | Date) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(getLocale(), { month: 'long', year: 'numeric' }).format(date);
};
