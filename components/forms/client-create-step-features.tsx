"use client";

import { Button } from "@/components/ui/button";
import { ClientIntakeChoiceChips } from "@/components/forms/client-intake-choice-chips";
import { Input } from "@/components/input";
import type { TUseClientCreateFormResult } from "@/components/forms/hooks/use-client-create-form.hook";
import { Icons } from "@/lib/frontend/icons/app-icons";
import {
  INTAKE_FEATURE_NAME_MAX,
  INTAKE_FEATURE_WHAT_MAX,
  INTAKE_FEATURE_WHAT_MIN,
  INTAKE_INTEGRATIONS,
  INTAKE_MAX_FEATURES,
  INTAKE_OTHER_MAX,
  type TIntakeIntegration,
} from "@/lib/frontend/clients/intake-ui.constants";
import { INTAKE_INTEGRATION_ICONS } from "@/lib/frontend/clients/intake-option-icons";
import { fieldStartIcons } from "@/lib/frontend/forms/input-start-icons";
import { intakeFillSurfaceClass, typeStackMdClass } from "@/lib/frontend/layout/dashboard-chrome";
import { cn } from "@/lib/utils";

type TClientCreateStepFeaturesProps = {
  hook: TUseClientCreateFormResult;
};

export function ClientCreateStepFeatures({ hook }: TClientCreateStepFeaturesProps) {
  const {
    t,
    form: {
      register,
      watch,
      formState: { errors },
    },
    featureArray,
    addFeature,
    toggleIntegration,
  } = hook;

  const integrations = watch("integrations");
  const integrationLabels = Object.fromEntries(
    INTAKE_INTEGRATIONS.map((value) => [value, t(`integrations.${value}`)]),
  ) as Record<TIntakeIntegration, string>;

  return (
    <div className="space-y-12">
      <div className="space-y-6">
        <div className={typeStackMdClass}>
          <span className="block type-label text-text-primary">
            {t("featuresLabel")}
            <span className="text-status-rejected" aria-hidden>
              {" "}
              *
            </span>
          </span>
          <p className="type-caption text-text-muted">{t("featuresHelp")}</p>
        </div>

        {featureArray.fields.map((field, index) => (
          <div key={field.id} className={cn(intakeFillSurfaceClass, "flex items-start gap-3 rounded-2xl p-5 sm:p-6")}>
            <div className="min-w-0 flex-1 space-y-5">
              <Input
                id={`features.${index}.name`}
                label={t("featureName")}
                placeholder={t("featureNamePh")}
                required
                maxLength={INTAKE_FEATURE_NAME_MAX}
                startIcon={fieldStartIcons.tag}
                error={errors.features?.[index]?.name?.message}
                {...register(`features.${index}.name` as const, {
                  required: t("valRequired"),
                  minLength: { value: 2, message: t("valMin") },
                })}
              />
              <Input
                id={`features.${index}.whatItDoes`}
                type="textarea"
                rows={3}
                label={t("featureWhat")}
                placeholder={t("featureWhatPh")}
                required
                maxLength={INTAKE_FEATURE_WHAT_MAX}
                error={errors.features?.[index]?.whatItDoes?.message}
                {...register(`features.${index}.whatItDoes` as const, {
                  required: t("valRequired"),
                  minLength: { value: INTAKE_FEATURE_WHAT_MIN, message: t("valFeatureWhat") },
                })}
              />
            </div>
            {featureArray.fields.length > 1 ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="mt-8 shrink-0"
                aria-label={t("removeFeature")}
                onClick={() => featureArray.remove(index)}
              >
                <Icons.delete className="size-4" />
              </Button>
            ) : null}
          </div>
        ))}
        {errors.features?.message ? (
          <p className="type-caption text-status-rejected">{errors.features.message}</p>
        ) : null}
        <Button
          type="button"
          variant="outlined"
          size="small"
          disabled={featureArray.fields.length >= INTAKE_MAX_FEATURES}
          onClick={addFeature}
        >
          <Icons.add className="size-4" />
          {t("addFeature")}
        </Button>
      </div>

      <div>
        <ClientIntakeChoiceChips
          legend={t("integrationsLabel")}
          legendPlacement="start"
          namePrefix="client-integration"
          options={INTAKE_INTEGRATIONS}
          selected={integrations}
          labels={integrationLabels}
          icons={INTAKE_INTEGRATION_ICONS}
          onToggle={toggleIntegration}
          afterOption="other_api"
          afterContent={
            integrations.includes("other_api") ? (
              <Input
                id="integrationOther"
                placeholder={t("pleaseSpecify")}
                required
                aria-label={t("pleaseSpecify")}
                maxLength={INTAKE_OTHER_MAX}
                startIcon={fieldStartIcons.text}
                error={errors.integrationOther?.message}
                {...register("integrationOther", {
                  validate: (value) => {
                    if (!integrations.includes("other_api")) return true;
                    return value.trim().length >= 2 || t("valSpecifyOther");
                  },
                })}
              />
            ) : null
          }
        />
      </div>
    </div>
  );
}
