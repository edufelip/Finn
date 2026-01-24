/**
 * Date formatting utilities with locale support
 * 
 * Provides localized date formatting using date-fns
 */

import { format, formatDistanceToNow, formatDistance, isToday, isYesterday } from 'date-fns';
import { enUS, pt, es, fr, de, ja, ar } from 'date-fns/locale';
import type { Locale } from './strings';

// Map our locale codes to date-fns locales
const dateLocales: Record<Locale, typeof enUS> = {
  en: enUS,
  pt,
  es,
  fr,
  de,
  ja,
  ar,
};

/**
 * Format a date according to the current locale
 * 
 * @param date - The date to format
 * @param formatString - The format string (see date-fns documentation)
 * @param locale - The locale to use (defaults to 'en')
 * @returns Formatted date string
 * 
 * @example
 * formatDate(new Date(), 'PPP', 'en') // 'January 24th, 2026'
 * formatDate(new Date(), 'PPP', 'ja') // '2026年1月24日'
 * formatDate(new Date(), 'PPP', 'ar') // '٢٤ يناير ٢٠٢٦'
 */
export function formatDate(date: Date | number, formatString: string, locale: Locale = 'en'): string {
  try {
    return format(date, formatString, { locale: dateLocales[locale] || enUS });
  } catch (error) {
    console.warn('Date formatting error:', error);
    return '';
  }
}

/**
 * Format a date as a relative time string (e.g., "2 hours ago")
 * 
 * @param date - The date to format
 * @param locale - The locale to use (defaults to 'en')
 * @returns Relative time string
 * 
 * @example
 * formatRelativeTime(new Date(Date.now() - 3600000), 'en') // '1 hour ago'
 * formatRelativeTime(new Date(Date.now() - 3600000), 'ja') // '約1時間前'
 * formatRelativeTime(new Date(Date.now() - 3600000), 'ar') // 'منذ ساعة واحدة تقريباً'
 */
export function formatRelativeTime(date: Date | number, locale: Locale = 'en'): string {
  try {
    return formatDistanceToNow(date, {
      addSuffix: true,
      locale: dateLocales[locale] || enUS,
    });
  } catch (error) {
    console.warn('Relative time formatting error:', error);
    return '';
  }
}

/**
 * Format the distance between two dates
 * 
 * @param dateLeft - The first date
 * @param dateRight - The second date  
 * @param locale - The locale to use (defaults to 'en')
 * @returns Distance string
 * 
 * @example
 * formatDateDistance(new Date(2026, 0, 24), new Date(2026, 0, 26), 'en') // '2 days'
 * formatDateDistance(new Date(2026, 0, 24), new Date(2026, 0, 26), 'ja') // '2日'
 */
export function formatDateDistance(
  dateLeft: Date | number,
  dateRight: Date | number,
  locale: Locale = 'en'
): string {
  try {
    return formatDistance(dateLeft, dateRight, { locale: dateLocales[locale] || enUS });
  } catch (error) {
    console.warn('Date distance formatting error:', error);
    return '';
  }
}

/**
 * Format a date for post timestamps (smart formatting)
 * 
 * - "Just now" for < 1 minute
 * - "5 min ago" for < 1 hour
 * - "2 hours ago" for today
 * - "Yesterday at 3:45 PM" for yesterday
 * - "Jan 24, 2026" for older dates
 * 
 * @param date - The date to format
 * @param locale - The locale to use (defaults to 'en')
 * @returns Smart formatted date string
 */
export function formatPostTimestamp(date: Date | number, locale: Locale = 'en'): string {
  try {
    const dateObj = typeof date === 'number' ? new Date(date) : date;
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - dateObj.getTime()) / 60000);

    // Just now (< 1 minute)
    if (diffInMinutes < 1) {
      return locale === 'ja' ? 'たった今' : 
             locale === 'ar' ? 'الآن' :
             locale === 'pt' ? 'Agora mesmo' :
             locale === 'es' ? 'Justo ahora' :
             locale === 'fr' ? 'À l\'instant' :
             locale === 'de' ? 'Gerade eben' :
             'Just now';
    }

    // Minutes ago (< 1 hour)
    if (diffInMinutes < 60) {
      return formatRelativeTime(dateObj, locale);
    }

    // Today (show hours ago)
    if (isToday(dateObj)) {
      return formatRelativeTime(dateObj, locale);
    }

    // Yesterday
    if (isYesterday(dateObj)) {
      const timeStr = format(dateObj, 'p', { locale: dateLocales[locale] });
      return locale === 'ja' ? `昨日 ${timeStr}` :
             locale === 'ar' ? `أمس ${timeStr}` :
             locale === 'pt' ? `Ontem às ${timeStr}` :
             locale === 'es' ? `Ayer a las ${timeStr}` :
             locale === 'fr' ? `Hier à ${timeStr}` :
             locale === 'de' ? `Gestern um ${timeStr}` :
             `Yesterday at ${timeStr}`;
    }

    // Older dates - show abbreviated date
    return format(dateObj, 'PP', { locale: dateLocales[locale] });
  } catch (error) {
    console.warn('Post timestamp formatting error:', error);
    return '';
  }
}

/**
 * Format a chat message timestamp (smart formatting)
 * 
 * - "3:45 PM" for today
 * - "Yesterday" for yesterday
 * - "Mon" for this week
 * - "Jan 24" for this year
 * - "1/24/26" for older
 * 
 * @param date - The date to format
 * @param locale - The locale to use (defaults to 'en')
 * @returns Smart formatted date string
 */
export function formatChatTimestamp(date: Date | number, locale: Locale = 'en'): string {
  try {
    const dateObj = typeof date === 'number' ? new Date(date) : date;

    // Today - show time
    if (isToday(dateObj)) {
      return format(dateObj, 'p', { locale: dateLocales[locale] });
    }

    // Yesterday
    if (isYesterday(dateObj)) {
      return locale === 'ja' ? '昨日' :
             locale === 'ar' ? 'أمس' :
             locale === 'pt' ? 'Ontem' :
             locale === 'es' ? 'Ayer' :
             locale === 'fr' ? 'Hier' :
             locale === 'de' ? 'Gestern' :
             'Yesterday';
    }

    // This week - show day name
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - dateObj.getTime()) / 86400000);
    if (diffInDays < 7) {
      return format(dateObj, 'EEE', { locale: dateLocales[locale] });
    }

    // This year - show month and day
    if (now.getFullYear() === dateObj.getFullYear()) {
      return format(dateObj, 'MMM d', { locale: dateLocales[locale] });
    }

    // Older - show short date
    return format(dateObj, 'P', { locale: dateLocales[locale] });
  } catch (error) {
    console.warn('Chat timestamp formatting error:', error);
    return '';
  }
}
