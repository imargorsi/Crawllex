"use client";

import { ClientCreateBlueprintTypeFollowUps } from "@/components/forms/client-create-step-blueprint-types";
import { ClientIntakeChoiceChips } from "@/components/forms/client-intake-choice-chips";
import { Input } from "@/components/input";
import type { TUseClientCreateFormResult } from "@/components/forms/hooks/use-client-create-form.hook";
import {
  INTAKE_BUILD_TYPES,
  INTAKE_OTHER_MAX,
  INTAKE_TEXTAREA_MAX,
  type TIntakeBuildType,
} from "@/lib/frontend/clients/intake-ui.constants";
import { INTAKE_BUILD_TYPE_ICONS } from "@/lib/frontend/clients/intake-option-icons";
import { fieldStartIcons } from "@/lib/frontend/forms/input-start-icons";

type TClientCreateStepBlueprintProps = {
  hook: TUseClientCreateFormResult;
};

export function ClientCreateStepBlueprint({ hook }: TClientCreateStepBlueprintProps) {
  const {
    t,
    form: {
      register,
      watch,
      formState: { errors },
    },
    toggleProjectType,
  } = hook;

  const projectTypes = watch("projectTypes");
  const buildLabels = Object.fromEntries(
    INTAKE_BUILD_TYPES.map((type) => [type, t(`projectTypes.${type}`)]),
  ) as Record<TIntakeBuildType, string>;

  return (
    <div className="space-y-12">
      <Input
        id="projectDescription"
        type="textarea"
        rows={4}
        label={t("projectDescription")}
        placeholder={t("projectDescriptionPh")}
        required
        maxLength={INTAKE_TEXTAREA_MAX}
        error={errors.projectDescription?.message}
        {...register("projectDescription", { required: t("valRequired") })}
      />

      <div className="space-y-6">
        <ClientIntakeChoiceChips
          legend={t("buildingLabel")}
          required
          layout="grid"
          namePrefix="client-build-type"
          options={INTAKE_BUILD_TYPES}
          selected={projectTypes}
          labels={buildLabels}
          icons={INTAKE_BUILD_TYPE_ICONS}
          onToggle={toggleProjectType}
          error={errors.projectTypes?.message}
        />
        {projectTypes.includes("other") ? (
          <Input
            id="projectTypeOther"
            label={t("pleaseSpecify")}
            placeholder={t("projectTypeOtherPh")}
            required
            maxLength={INTAKE_OTHER_MAX}
            startIcon={fieldStartIcons.text}
            error={errors.projectTypeOther?.message}
            {...register("projectTypeOther", {
              validate: (value) => {
                if (!projectTypes.includes("other")) return true;
                return value.trim().length >= 2 || t("valSpecifyOther");
              },
            })}
          />
        ) : null}
      </div>

      <ClientCreateBlueprintTypeFollowUps hook={hook} />
    </div>
  );
}
