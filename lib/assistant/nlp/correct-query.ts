const STOPWORDS = new Set([
  "a",
  "an",
  "about",
  "and",
  "are",
  "did",
  "do",
  "eight",
  "eleven",
  "fifteen",
  "five",
  "for",
  "four",
  "fourteen",
  "got",
  "has",
  "have",
  "how",
  "i",
  "in",
  "is",
  "it",
  "just",
  "last",
  "many",
  "me",
  "my",
  "nine",
  "ninety",
  "of",
  "on",
  "one",
  "our",
  "past",
  "please",
  "previous",
  "seven",
  "show",
  "six",
  "sixteen",
  "sixty",
  "tell",
  "ten",
  "that",
  "the",
  "thirteen",
  "thirty",
  "this",
  "three",
  "to",
  "twelve",
  "twenty",
  "two",
  "was",
  "we",
  "were",
  "what",
  "with",
  "you",
]);

function damerauLevenshtein(a: string, b: string): number {
  const aLen = a.length;
  const bLen = b.length;
  const dp: number[][] = Array.from({ length: aLen + 1 }, () =>
    Array.from({ length: bLen + 1 }, () => 0),
  );

  for (let i = 0; i <= aLen; i += 1) dp[i]![0] = i;
  for (let j = 0; j <= bLen; j += 1) dp[0]![j] = j;

  for (let i = 1; i <= aLen; i += 1) {
    for (let j = 1; j <= bLen; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i]![j] = Math.min(
        dp[i - 1]![j]! + 1,
        dp[i]![j - 1]! + 1,
        dp[i - 1]![j - 1]! + cost,
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        dp[i]![j] = Math.min(dp[i]![j]!, dp[i - 2]![j - 2]! + 1);
      }
    }
  }

  return dp[aLen]![bLen]!;
}

function maxDistance(tokenLength: number): number {
  if (tokenLength < 4) return 0;
  if (tokenLength <= 6) return 1;
  return 2;
}

export function correctAssistantToken(
  token: string,
  vocabulary: ReadonlySet<string> | readonly string[],
): string {
  const normalized = token.toLowerCase();
  if (STOPWORDS.has(normalized) || /^\d+$/.test(normalized)) return token;
  const terms = vocabulary instanceof Set ? vocabulary : new Set(vocabulary);
  if (terms.has(normalized)) return token;

  const allowed = maxDistance(normalized.length);
  if (allowed === 0) return token;

  let best: string | null = null;
  let bestDistance = allowed + 1;

  for (const term of terms) {
    if (Math.abs(term.length - normalized.length) > allowed) continue;
    if (term[0] !== normalized[0]) continue;

    const distance = damerauLevenshtein(normalized, term);
    if (distance === 0) return token;
    if (distance > allowed) continue;
    if (distance < bestDistance) {
      best = term;
      bestDistance = distance;
    } else if (distance === bestDistance && best !== term) {
      best = null;
    }
  }

  return best ?? token;
}

export function correctAssistantQuery(
  query: string,
  vocabulary: ReadonlySet<string> | readonly string[],
): string {
  return query
    .split(/(\s+)/)
    .map((part) => {
      if (/^\s+$/.test(part)) return part;
      const match = part.match(/^([^a-zA-Z]*)([a-zA-Z][a-zA-Z-]*)([^a-zA-Z]*)$/);
      if (!match) return part;
      const [, prefix, word, suffix] = match;
      return `${prefix}${correctAssistantToken(word!, vocabulary)}${suffix}`;
    })
    .join("");
}
