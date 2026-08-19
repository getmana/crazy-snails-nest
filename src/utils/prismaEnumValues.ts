export function prismaEnumValues<T extends Record<string, string>>(e: T) {
  return Object.values(e) as unknown as [T[keyof T], ...T[keyof T][]];
}
