export function parseMultiValue(value?: string) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function serializeMultiValue(values: string[]) {
  return values.join(",");
}

export function uniqueValues<T>(
  items: T[],
  selector: (item: T) => string | undefined
) {
  return Array.from(
    new Set(items.map(selector).filter((value): value is string => Boolean(value)))
  ).sort((a, b) => a.localeCompare(b, "ko"));
}

export function countUniqueBy<T>(items: T[], selector: (item: T) => string) {
  return new Set(items.map(selector)).size;
}

export function normalizeSearchText(value: string) {
  return value.trim().toLowerCase();
}
