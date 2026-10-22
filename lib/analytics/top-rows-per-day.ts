/**
 * Keeps the top `limit` rows per date. Rows matching `isPinned` are always kept.
 * Input order does not matter.
 */
export function topRowsPerDay<T extends { date: string }>(
  rows: T[],
  limit: number,
  compare: (a: T, b: T) => number,
  isPinned: (row: T) => boolean = () => false,
): T[] {
  const byDate = new Map<string, T[]>();
  for (const row of rows) {
    const list = byDate.get(row.date) ?? [];
    list.push(row);
    byDate.set(row.date, list);
  }

  const kept: T[] = [];
  for (const list of byDate.values()) {
    const pinned = list.filter(isPinned);
    const rest = list
      .filter((row) => !isPinned(row))
      .sort(compare)
      .slice(0, limit);
    kept.push(...pinned, ...rest);
  }
  return kept;
}
