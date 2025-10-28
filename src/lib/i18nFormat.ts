// Simple interpolation helper for dictionary templates containing {placeholders}
export function i18nFormat(template: string | undefined, values: Record<string, string | number>): string {
  if (!template) return '';
  return Object.entries(values).reduce((acc, [key, val]) => acc.replaceAll(`{${key}}`, String(val)), template);
}
