/** Lens audit frequencies offered in Settings > Agents & AI. Monthly is the default Lens sets on enrollment. */
export const LENS_FREQUENCIES = ["weekly", "twice_monthly", "monthly"] as const;
export type TLensFrequency = (typeof LENS_FREQUENCIES)[number];

/** Interval in minutes per frequency, as stored by Lens. Twice a month = every 15 days, monthly = every 30 days. */
export const LENS_FREQUENCY_MINUTES: Record<TLensFrequency, number> = {
  weekly: 10080,
  twice_monthly: 21600,
  monthly: 43200,
};

export function frequencyFromMinutes(minutes: number | null | undefined): TLensFrequency | null {
  const match = LENS_FREQUENCIES.find((f) => LENS_FREQUENCY_MINUTES[f] === minutes);
  return match ?? null;
}

export function isLensFrequency(value: unknown): value is TLensFrequency {
  return typeof value === "string" && (LENS_FREQUENCIES as readonly string[]).includes(value);
}

export type TLensSchedule = { frequency: TLensFrequency | null; enabled: boolean; nextRunAt: string | null };
