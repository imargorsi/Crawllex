# Roadmap idea: automated, branded client reporting

**Status:** not started — parked for a future cycle (2026-09-24).

## The gap

Crawllex's own product manual (Section 2, "The Problem Crawllex Solves") names client
reporting as one of the core pains the platform is supposed to fix:

> **Client reporting** — "Manual copy/paste into decks or sheets every month"

But none of the currently built modules actually solve it. `analytics`, `seo-activities`, and
`leads` are three separate views a team member has to look at and manually assemble — there is
no module that combines them into something a client receives automatically. This is the single
feature category agency SEO tools are judged on (AgencyAnalytics, Whitespark, SEOptimer all live
or die on this), and it's the one piece of the pipeline still missing.

## The recommendation

Build a scheduled reporting agent — same pattern as the `content-dashboard` project's Hermes
`content` profile (scheduled jobs that call the app's own API, not direct DB access) — that,
per active project, on a schedule (weekly/monthly):

1. Pulls the cached GSC/GA4 metrics for the period (already cached internally — see
   "Performance Analytics" in the product manual, no new Google API load).
2. Pulls that period's logged SEO activities (blogs, backlinks, technical work) and new leads.
3. Generates a branded PDF/email report combining all three, sent automatically to the client
   and/or project owner.

**The differentiator**: don't stop at charts. Add a short AI-written narrative summary — "here's
what moved and why" — on top of the raw metrics. `wink-nlp` / `wink-eng-lite-web-model` are
already dependencies in `package.json`, suggesting text-analysis was already on the radar for
something. This is where that would land.

## Why this over other gaps

Other candidate features (ranking/traffic-drop alerts, deeper analytics drilldowns, etc.) are
smaller builds, but they improve a tool the *agency* already looks at. Automated reporting is
the one that changes what the *client* experiences — it's what turns Crawllex from "a dashboard
the agency checks" into something that visibly runs the client relationship, which is what
actually justifies the subscription.

## Main tradeoff

This is a genuinely bigger build than anything else on the current module list:

- PDF/email templating (branded, matching the existing theme-pack system)
- A scheduling layer (per-project cadence, likely project-level settings for frequency)
- The narrative-generation step (LLM call over the period's metrics + activity log)
- Delivery + audit trail (did the report send, did the client open it)

Smaller first step, if this ends up too large to take in one pass: ship the templated
PDF/email report without the AI narrative first (pure data assembly + scheduling), add the
narrative layer once the delivery mechanism is proven.

## Open questions for whenever this gets picked up

- Report cadence: fixed per-project, or configurable by the project owner?
- Delivery: email only, or also a client-facing "reports" tab inside the dashboard itself?
- Does the AI narrative need a human review/approve step before sending (like
  `content-dashboard`'s human-in-the-loop gate), or does it go out unreviewed once the template
  is trusted?
