import type { Locale } from './i18n/config';

export function normalizeDateValue(value?: string): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.toLowerCase() === 'sin fecha') {
    return null;
  }

  return trimmed;
}

export function formatDateRange(
  startDate?: string,
  endDate?: string,
  current?: boolean,
  locale: Locale = 'es',
): string | null {
  const start = normalizeDateValue(startDate);
  const end = normalizeDateValue(endDate);
  const present = locale === 'en' ? 'Present' : 'Presente';

  if (!start && !end && !current) {
    return null;
  }

  if (current) {
    if (start) {
      return `${start} - ${present}`;
    }
    return present;
  }

  if (start && end) {
    return `${start} - ${end}`;
  }

  if (start) {
    return start;
  }

  if (end) {
    return end;
  }

  return null;
}
