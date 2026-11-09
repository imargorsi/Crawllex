import { describe, expect, it } from "vitest";

import { isGroundedReply } from "@/lib/assistant/answer/grounding";

const DATA = { gsc: { clicks: 557, impressions: 41491, ctr: 0.013 }, ga4: { sessions: 1320 } };

describe("grounding check for follow-up replies", () => {
  it("accepts figures that appear in the data", () => {
    expect(isGroundedReply("Impressions were **41,491** and clicks **557**.", DATA, [])).toBe(true);
  });

  it("accepts a ratio written as a percentage", () => {
    expect(isGroundedReply("The click-through rate is **1.3%**.", DATA, [])).toBe(true);
  });

  it("accepts figures from the earlier answers of the conversation", () => {
    expect(isGroundedReply("Impressions were 3 last time.", DATA, ["Your site had 3 impressions."])).toBe(true);
  });

  it("rejects a figure that is not in the data", () => {
    expect(isGroundedReply("Impressions fell from 9000 to 41491.", DATA, [])).toBe(false);
  });

  it("rejects replies that print format labels", () => {
    expect(isGroundedReply("Metric: clicks - 557.", DATA, [])).toBe(false);
  });
});
