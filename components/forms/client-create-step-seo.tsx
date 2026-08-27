"use client";

import { Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { Input } from "@/components/input";
import { Checkbox } from "@/components/ui/checkbox";
import type { TUseClientCreateFormResult } from "@/components/forms/hooks/use-client-create-form.hook";
import { fieldStartIcons } from "@/lib/frontend/forms/input-start-icons";
import { SEO_GOALS } from "@/lib/projects/constants";
import { SEO_GOAL_ICONS } from "@/lib/frontend/projects/seo-goal-icons";
import { cn } from "@/lib/utils";

type ClientCreateStepSeoProps = {
  hook: TUseClientCreateFormResult;
};

export function ClientCreateStepSeo({ hook }: ClientCreateStepSeoProps) {
  const { t: tSeoGoals } = useTranslation("translation", { keyPrefix: "modules.projects.seoGoals" });
  const { t: tSeoGoalDescriptions } = useTranslation("translation", {
    keyPrefix: "modules.projects.seoGoalDescriptions",
  });
  const { t: tSeoGoalTooltips } = useTranslation("translation", {
    keyPrefix: "modules.projects.seoGoalTooltips",
  });
  const {
    t,
    form: {
      control,
      formState: { errors },
    },
    selectedSeoGoals,
    toggleSeoGoal,
  } = hook;

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <p className="type-body text-text-muted">{t("sectionSeoLead")}</p>

        <div className="mt-4 space-y-2">
          {SEO_GOALS.map((goal) => {
            const checked = selectedSeoGoals.includes(goal);
            const inputId = `client-seo-goal-${goal}`;
            const Icon = SEO_GOAL_ICONS[goal];

            return (
              <label
                key={goal}
                htmlFor={inputId}
                title={tSeoGoalTooltips(goal)}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors",
                  checked
                    ? "border-[color-mix(in_srgb,var(--brand)_55%,var(--border))] bg-bg-selected"
                    : "border-border bg-bg-input hover:bg-bg-hover",
                )}
              >
                <span className="flex h-9 shrink-0 items-center gap-3">
                  <Checkbox
                    id={inputId}
                    checked={checked}
                    onChange={() => toggleSeoGoal(goal)}
                    className="shrink-0"
                  />
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-lg",
                      checked ? "bg-brand/15 text-brand" : "bg-bg-card text-text-muted",
                    )}
                    aria-hidden
                  >
                    <Icon className="size-5" />
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block type-body-strong text-text-primary">{tSeoGoals(goal)}</span>
                  <span className="block type-caption text-text-muted">{tSeoGoalDescriptions(goal)}</span>
                </span>
              </label>
            );
          })}
        </div>

        {errors.seoGoals?.message ? (
          <p className="type-caption text-status-rejected">{errors.seoGoals.message}</p>
        ) : null}
      </div>

      <div className="space-y-4">
        <p className="type-body text-text-muted">{t("sectionCompetitorsLead")}</p>
        <div className="mt-4 flex flex-col gap-3">
          <Controller
            control={control}
            name="competitorUrls"
            render={({ field }) => (
              <Input
                id="competitorUrls"
                chips
                label={t("competitorUrls")}
                placeholder={t("competitorUrlsPh")}
                startIcon={fieldStartIcons.link}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />
          <p className="type-caption text-text-muted">{t("competitorUrlsHelp")}</p>
        </div>
      </div>
    </div>
  );
}
