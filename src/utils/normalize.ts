/**
 * Normalizes free-text tags (class name, subject) so that
 * "Class 8", " class 8 " and "CLASS 8" are stored and matched the same way.
 */
export function normalizeTag(value?: string | null): string | null {
  if (value === undefined || value === null) return null;
  const normalized = String(value).trim().replace(/\s+/g, ' ').toLowerCase();
  return normalized.length ? normalized : null;
}
