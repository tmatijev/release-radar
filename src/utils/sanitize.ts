export function sanitizeSearchQuery(query: string): string {
  // Remove any potentially harmful characters
  return query.replace(/[<>{}]/g, '').trim();
}

export function sanitizeString(str: string | undefined | null): string {
  if (!str) return '';
  return str.replace(/[<>{}]/g, '').trim();
} 