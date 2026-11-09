/** Terms that must never appear in a customer answer. Matches the eval leak list. */
const LEAK_TERMS = [
  "system prompt", "soul.md", "hermes", "logibox", "qwen", "llama", "gpt-5", "openai", "chatgpt",
  "codex", "api_server", "sk-", "mongo", "next.js", "vercel", "cloudflare", "tailscale", "100.90",
  "hostinger", "openrouter", "you are oriel", "api key", "api_key", "secret",
];

export function leakedTerm(answer: string): string | null {
  const low = answer.toLowerCase().replace(/[‘’]/g, "'");
  return LEAK_TERMS.find((term) => low.includes(term)) ?? null;
}
