import { classifyClientFile, clientFileMaxBytes } from "@/lib/clients/client-file.utils";
import type { TClientFileKind } from "@/lib/clients/intake-constants";

export function toggleListValue<T>(current: readonly T[], value: T): T[] {
  return current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
}

export type TIntakeAssetKind = TClientFileKind;

export function classifyIntakeAsset(file: File): TIntakeAssetKind | null {
  return classifyClientFile(file);
}

export function intakeAssetMaxBytes(kind: TIntakeAssetKind): number {
  return clientFileMaxBytes(kind);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Calendar dates (`YYYY-MM-DD`) without UTC day-shift. */
export function formatIntakeDate(
  value: string | null | undefined,
  locale = "en",
  emptyLabel = "—",
): string {
  const trimmed = value?.trim();
  if (!trimmed) return emptyLabel;

  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (dateOnly) {
    const year = Number(dateOnly[1]);
    const month = Number(dateOnly[2]);
    const day = Number(dateOnly[3]);
    return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: "numeric" }).format(
      new Date(year, month - 1, day),
    );
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return emptyLabel;
  return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: "numeric" }).format(parsed);
}
