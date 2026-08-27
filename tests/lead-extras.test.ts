import { describe, expect, it } from "vitest";

import { leadExtrasForDisplay, sanitizeLeadExtras } from "@/lib/leads/extras.utils";

const core = {
  firstName: "Muhammad Arsalan",
  lastName: "",
  email: "argorsi707@gmail.com",
  phone: "03094713379",
  message: "test mail",
};

describe("sanitizeLeadExtras", () => {
  it("drops Elementor field ids and values already stored on core fields", () => {
    expect(
      sanitizeLeadExtras(
        {
          "Full Name": "Muhammad Arsalan",
          field_e068e2d: "03094713379",
          field_de539ae: "Civil Consultancy",
          field_unique1: "Need a site audit",
          "Project Type": "Civil Consultancy",
          Subject: "Pricing",
        },
        core,
      ),
    ).toEqual({
      "Project Type": "Civil Consultancy",
      Subject: "Pricing",
      field_unique1: "Need a site audit",
    });
  });
});

describe("leadExtrasForDisplay", () => {
  it("moves services into additional fields and hides generated ids", () => {
    expect(
      Object.fromEntries(
        leadExtrasForDisplay(
          {
            ...core,
            servicesInterestedIn: "Local SEO",
            extras: {
              field_abc123: "03094713379",
              Company: "Acme",
            },
          },
          "Services Interested In",
        ),
      ),
    ).toEqual({
      Company: "Acme",
      "Services Interested In": "Local SEO",
    });
  });

  it("does not add a services extra when that value is already present", () => {
    expect(
      Object.fromEntries(
        leadExtrasForDisplay(
          {
            ...core,
            servicesInterestedIn: "Civil Consultancy",
            extras: { "Project Type": "Civil Consultancy" },
          },
          "Services Interested In",
        ),
      ),
    ).toEqual({
      "Project Type": "Civil Consultancy",
    });
  });

  it("keeps core services when an extra uses the same label with a different value", () => {
    expect(
      Object.fromEntries(
        leadExtrasForDisplay(
          {
            ...core,
            servicesInterestedIn: "Local SEO",
            extras: { "Services Interested In": "PPC" },
          },
          "Services Interested In",
        ),
      ),
    ).toEqual({
      "Services Interested In": "Local SEO",
    });
  });
});
