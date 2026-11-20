/**
 * Display helpers for page addresses in Lens screens. Percent-encoded paths (Arabic slugs) are decoded so people can
 * read them; anything that cannot be decoded is shown as is. Components truncate the text to one line and keep the
 * full value in a tooltip, so long addresses never stretch the layout.
 */

function decode(value: string): string {
  try {
    return decodeURI(value);
  } catch {
    return value;
  }
}

export function readableUrl(url: string): string {
  return decode(url);
}

/** Path and query only, decoded. "/" for the site root. The input as is when it is not a URL. */
export function readablePath(url: string): string {
  try {
    const u = new URL(url);
    return decode(`${u.pathname}${u.search}`) || "/";
  } catch {
    return url;
  }
}

/** First `limit` items, plus how many more are hidden. */
export function visibleItems<T>(items: T[], limit: number): { shown: T[]; more: number } {
  return { shown: items.slice(0, limit), more: Math.max(0, items.length - limit) };
}
