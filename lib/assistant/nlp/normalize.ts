/** Spoken filler that should not affect slot parsing. Longest first. */
const FILLER_PHRASES = [
  "i would like to know",
  "i want to know",
  "i need to know",
  "can you please tell me",
  "could you please tell me",
  "can you tell me",
  "could you tell me",
  "please tell me",
  "can you please",
  "could you please",
  "would you please",
  "do i have",
  "did we get",
  "did i get",
  "can you",
  "could you",
  "would you",
  "tell me",
  "please",
] as const;

function stripFillerPhrases(query: string): string {
  let next = ` ${query} `;
  for (const phrase of FILLER_PHRASES) {
    next = next.replaceAll(` ${phrase} `, " ");
  }
  return next.replace(/\s+/g, " ").trim();
}

/** Strip question/quote punctuation, filler phrases, and collapse whitespace. */
export function normalizeAssistantQuery(query: string): string {
  const stripped = query.replace(/[?!.,;:"'`]+/g, " ").replace(/\s+/g, " ").trim();
  return stripFillerPhrases(stripped.toLowerCase());
}
