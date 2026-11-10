import { beforeEach, describe, expect, it } from "vitest";

import {
  ANSWER_CACHE_TTL_MS,
  answerCacheKey,
  getCachedAnswer,
  resetAnswerCacheForTests,
  setCachedAnswer,
} from "@/lib/assistant/ai/answer-cache";

describe("assistant answer cache", () => {
  beforeEach(() => resetAnswerCacheForTests());

  it("normalizes case and spacing in the key", () => {
    expect(answerCacheKey("p1", "u1", "  Leads   THIS month ")).toBe(answerCacheKey("p1", "u1", "leads this month"));
  });

  it("separates users and projects", () => {
    expect(answerCacheKey("p1", "u1", "q")).not.toBe(answerCacheKey("p1", "u2", "q"));
    expect(answerCacheKey("p1", "u1", "q")).not.toBe(answerCacheKey("p2", "u1", "q"));
  });

  it("returns a stored answer until the TTL ends", () => {
    const key = answerCacheKey("p1", "u1", "q");
    setCachedAnswer(key, "answer", 1_000);
    expect(getCachedAnswer(key, 1_000 + ANSWER_CACHE_TTL_MS - 1)).toBe("answer");
    expect(getCachedAnswer(key, 1_000 + ANSWER_CACHE_TTL_MS)).toBeNull();
  });
});
