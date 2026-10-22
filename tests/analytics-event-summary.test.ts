import { describe, expect, it } from "vitest";

import { classifyEvent, humanizeEventName, summarizeEvents } from "@/lib/analytics/event-summary";

describe("classifyEvent", () => {
  it("maps contact clicks regardless of word order", () => {
    expect(classifyEvent("click_tel")).toBe("call");
    expect(classifyEvent("tel_click")).toBe("call");
    expect(classifyEvent("mailto_click")).toBe("email");
    expect(classifyEvent("whatsapp_click")).toBe("whatsapp");
  });

  it("maps standard GA4 events", () => {
    expect(classifyEvent("first_visit")).toBe("firstVisit");
    expect(classifyEvent("page_view")).toBe("pageView");
    expect(classifyEvent("session_start")).toBe("sessionStart");
    expect(classifyEvent("user_engagement")).toBe("engagement");
    expect(classifyEvent("file_download")).toBe("download");
    expect(classifyEvent("generate_lead")).toBe("lead");
  });

  it("does not match inherited object keys", () => {
    expect(classifyEvent("constructor")).toBe("other");
    expect(classifyEvent("__proto__")).toBe("other");
  });

  it("falls back to other for unknown names", () => {
    expect(classifyEvent("add_to_cart")).toBe("other");
    expect(humanizeEventName("add_to_cart")).toBe("Add To Cart");
  });
});

describe("summarizeEvents", () => {
  it("sums contact clicks and keeps them out of highlights", () => {
    const summary = summarizeEvents([
      { dimensionValue: "click_tel", eventCount: 15 },
      { dimensionValue: "tel_click", eventCount: 8 },
      { dimensionValue: "mailto_click", eventCount: 4 },
      { dimensionValue: "page_view", eventCount: 68 },
    ]);
    expect(summary.contacts).toEqual({ call: 23, email: 4, whatsapp: 0 });
    expect(summary.highlights.map((h) => h.kind)).toEqual(["pageView"]);
  });

  it("orders lead and visit highlights before engagement and other", () => {
    const summary = summarizeEvents([
      { dimensionValue: "scroll", eventCount: 90 },
      { dimensionValue: "add_to_cart", eventCount: 5 },
      { dimensionValue: "first_visit", eventCount: 22 },
      { dimensionValue: "generate_lead", eventCount: 3 },
    ]);
    expect(summary.highlights.map((h) => h.kind)).toEqual(["lead", "firstVisit", "engagement", "other"]);
  });

  it("ignores empty and zero rows", () => {
    const summary = summarizeEvents([
      { dimensionValue: "", eventCount: 5 },
      { dimensionValue: "page_view", eventCount: 0 },
      { dimensionValue: "page_view", eventCount: null },
    ]);
    expect(summary.highlights).toEqual([]);
  });
});
