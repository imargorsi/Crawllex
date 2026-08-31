"use client";

import type { ReactNode } from "react";

import type { TAppIconComponent } from "@/components/ui/app-icon";
import {
  intakeChoiceIdleClass,
  intakeChoiceSelectedClass,
} from "@/lib/frontend/layout/dashboard-chrome";
import { cn } from "@/lib/utils";

type TClientIntakeChoiceChipsProps<T extends string> = {
  legend: string;
  required?: boolean;
  error?: string;
  options: readonly T[];
  selected: readonly T[];
  labels: Record<T, string>;
  icons?: Partial<Record<T, TAppIconComponent>>;
  onToggle: (value: T) => void;
  namePrefix: string;
  legendPlacement?: "above" | "start";
  afterOption?: T;
  afterContent?: ReactNode;
  layout?: "wrap" | "grid";
};

function ChoiceButton<T extends string>({
  option,
  checked,
  isGrid,
  buttonId,
  label,
  Icon,
  onToggle,
}: {
  option: T;
  checked: boolean;
  isGrid: boolean;
  buttonId: string;
  label: string;
  Icon?: TAppIconComponent;
  onToggle: (value: T) => void;
}) {
  return (
    <button
      id={buttonId}
      type="button"
      aria-pressed={checked}
      onClick={() => onToggle(option)}
      className={cn(
        "inline-flex items-center transition-[color,background-color,border-color,box-shadow] duration-200",
        isGrid
          ? "min-h-24 w-full flex-col justify-center gap-2.5 rounded-2xl px-3 py-4 text-center"
          : "min-h-12 shrink-0 gap-2.5 rounded-full px-5 py-2.5 type-label leading-none",
        checked ? intakeChoiceSelectedClass : intakeChoiceIdleClass,
      )}
    >
      {Icon ? (
        isGrid ? (
          <span
            className="inline-flex size-8 items-center justify-center rounded-full bg-text-primary/10 text-text-primary"
            aria-hidden
          >
            <Icon className="size-4" />
          </span>
        ) : (
          <Icon className="size-4 shrink-0" aria-hidden />
        )
      ) : null}
      <span className={cn(isGrid ? "type-label leading-snug" : null)}>{label}</span>
    </button>
  );
}

export function ClientIntakeChoiceChips<T extends string>({
  legend,
  required,
  error,
  options,
  selected,
  labels,
  icons,
  onToggle,
  namePrefix,
  legendPlacement = "above",
  afterOption,
  afterContent,
  layout = "wrap",
}: TClientIntakeChoiceChipsProps<T>) {
  const isGrid = layout === "grid";
  const isLegendStart = legendPlacement === "start";

  return (
    <fieldset>
      <legend className="sr-only">{legend}</legend>
      <div className={cn(isLegendStart && "flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8")}>
        <span className={cn("block type-label text-text-primary", isLegendStart ? "shrink-0 sm:w-44" : null)} aria-hidden>
          {legend}
          {required ? (
            <span className="text-status-rejected">
              {" "}
              *
            </span>
          ) : null}
        </span>
        <div
          className={cn(
            isGrid
              ? "grid min-w-0 flex-1 grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6"
              : "flex min-w-0 flex-1 flex-wrap items-center gap-3",
            !isLegendStart && "mt-6",
          )}
          role="group"
          aria-label={legend}
        >
          {options.map((option) => {
            const checked = selected.includes(option);
            const showAfter = Boolean(afterOption === option && afterContent);
            if (!showAfter) {
              return (
                <ChoiceButton
                  key={option}
                  option={option}
                  checked={checked}
                  isGrid={isGrid}
                  buttonId={`${namePrefix}-${option}`}
                  label={labels[option]}
                  Icon={icons?.[option]}
                  onToggle={onToggle}
                />
              );
            }

            return (
              <div
                key={option}
                className={cn(
                  "flex min-w-0 items-center gap-3",
                  isGrid ? "col-span-2" : "min-w-64 flex-1",
                )}
              >
                <ChoiceButton
                  option={option}
                  checked={checked}
                  isGrid={isGrid}
                  buttonId={`${namePrefix}-${option}`}
                  label={labels[option]}
                  Icon={icons?.[option]}
                  onToggle={onToggle}
                />
                <div className="min-w-48 flex-1">{afterContent}</div>
              </div>
            );
          })}
        </div>
      </div>
      {error ? <p className="mt-4 type-caption text-status-rejected">{error}</p> : null}
    </fieldset>
  );
}
