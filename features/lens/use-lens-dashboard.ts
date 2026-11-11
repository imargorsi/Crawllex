"use client";

import { LENS_DEMO, type TLensDemoDashboard } from "@/features/lens/lens.demo";

/**
 * Lens dashboard data for the UI. Phase 1: returns demo data only.
 * Phase 3 replaces the body with the Lens API queries (see features/lens/lens.api.ts).
 */
export function useLensDashboard(): { data: TLensDemoDashboard; isDemo: true } {
  return { data: LENS_DEMO, isDemo: true };
}
