import { describe, expect, it } from "vitest";

import { answerWindowFor } from "@/lib/assistant/run-query";
import type { TThreadTurn } from "@/lib/assistant/ai/run-ai-query";

const SO_FAR: TThreadTurn[] = [{ query: "what is my website performance so far", answer: "x" }];

describe("assistant answer period", () => {
  it("uses the question's own period when it has one", () => {
    const range = answerWindowFor("how many clicks last week", []);
    expect(range).toBeDefined();
    expect(range!.from < range!.to).toBe(true);
  });

  it("carries the thread's period into a follow-up with no period", () => {
    const carried = answerWindowFor("is it up or down?", SO_FAR);
    const direct = answerWindowFor("what is my website performance so far", []);
    expect(carried).toEqual(direct);
    expect(carried).toBeDefined();
  });

  it("uses the default period (undefined) when nothing in the thread has one", () => {
    expect(answerWindowFor("is it up or down?", [{ query: "hello", answer: "Hey" }])).toBeUndefined();
    expect(answerWindowFor("is it up or down?", [])).toBeUndefined();
  });
});
