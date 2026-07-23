export function compareLatestFirst(
  a: { date?: string; createdTime?: string; id: string },
  b: { date?: string; createdTime?: string; id: string }
) {
  const primary = compareOptionalDatesDesc(a.date, b.date);
  if (primary !== 0) return primary;

  const created = compareOptionalDatesDesc(a.createdTime, b.createdTime);
  if (created !== 0) return created;

  return b.id.localeCompare(a.id);
}

function compareOptionalDatesDesc(a?: string, b?: string) {
  const aTime = toTimestamp(a);
  const bTime = toTimestamp(b);
  if (aTime !== undefined && bTime !== undefined) return bTime - aTime;
  if (aTime !== undefined) return -1;
  if (bTime !== undefined) return 1;
  return 0;
}

function toTimestamp(value?: string) {
  if (!value) return undefined;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : undefined;
}
