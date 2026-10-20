/** Returns the document id for a public docs.google.com/document/d/<id> link, or null. */
export function parseGoogleDocId(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.hostname !== "docs.google.com") return null;
  const match = url.pathname.match(/^\/document\/d\/([A-Za-z0-9_-]+)/);
  return match ? match[1]! : null;
}
