import { env } from "@/lib/config/env";

export function buildClientShareUrl(shareToken: string): string {
  const origin = env.appUrl().replace(/\/$/, "");
  return `${origin}/onboarding/${shareToken}`;
}
