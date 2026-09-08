function toCamel(s: string): string {
  return s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

export function camelcaseKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(camelcaseKeys);
  if (obj !== null && obj?.constructor === Object) {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [
        toCamel(k),
        camelcaseKeys(v),
      ]),
    );
  }
  return obj;
}
