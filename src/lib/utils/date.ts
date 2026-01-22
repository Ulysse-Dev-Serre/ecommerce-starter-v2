/**
 * Formate une date de manière localisée.
 * @param date - La date à formater (objet Date ou string ISO)
 * @param locale - La langue (défaut: 'en')
 * @param options - Options de formatage Intl (optionnel)
 */
export function formatDate(
  date: Date | string | number,
  locale: string,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }
): string {
  if (!date) return '';

  const d =
    typeof date === 'string' || typeof date === 'number'
      ? new Date(date)
      : date;

  // Sécurité si la date est invalide
  if (isNaN(d.getTime())) return '';

  return new Intl.DateTimeFormat(locale, options).format(d);
}

/**
 * Formate une date avec l'heure (utile pour l'admin et les suivis).
 */
export function formatDateTime(
  date: Date | string | number,
  locale: string
): string {
  return formatDate(date, locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
