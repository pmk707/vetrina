export function withBaseUrl(path: string | null | undefined): string {
  const value = typeof path === 'string' ? path.trim() : '';

  if (value.length === 0) {
    return import.meta.env.BASE_URL;
  }

  if (/^(?:https?:)?\/\//i.test(value) || value.startsWith('data:')) {
    return value;
  }

  const base = import.meta.env.BASE_URL;
  const normalized = value.startsWith('/') ? value.slice(1) : value;
  return `${base}${normalized}`;
}
