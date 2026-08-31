"use client";

import { Input } from "@/components/input";
import { Checkbox } from "@/components/ui/checkbox";
import type { TUseClientCreateFormResult } from "@/components/forms/hooks/use-client-create-form.hook";
import { INTAKE_TEXTAREA_MAX } from "@/lib/frontend/clients/intake-ui.constants";
import { fieldStartIcons } from "@/lib/frontend/forms/input-start-icons";
import { intakeFillSurfaceClass } from "@/lib/frontend/layout/dashboard-chrome";
import { cn } from "@/lib/utils";

type TClientCreateStepLaunchProps = {
  hook: TUseClientCreateFormResult;
};

export function ClientCreateStepLaunch({ hook }: TClientCreateStepLaunchProps) {
  const {
    t,
    form: {
      register,
      watch,
      setValue,
      formState: { errors },
    },
  } = hook;

  const requirementsConfirmed = watch("requirementsConfirmed");

  return (
    <div className="space-y-12">
      <Input
        id="expectedLaunchDate"
        type="date"
        label={t("expectedLaunchDate")}
        startIcon={fieldStartIcons.calendar}
        {...register("expectedLaunchDate")}
      />

      <Input
        id="launchMustHaves"
        type="textarea"
        rows={4}
        label={t("launchMustHaves")}
        placeholder={t("launchMustHavesPh")}
        required
        maxLength={INTAKE_TEXTAREA_MAX}
        error={errors.launchMustHaves?.message}
        {...register("launchMustHaves", { required: t("valRequired") })}
      />

      <Input
        id="notes"
        type="textarea"
        rows={4}
        label={t("notes")}
        placeholder={t("notesPh")}
        maxLength={INTAKE_TEXTAREA_MAX}
        error={errors.notes?.message}
        {...register("notes")}
      />

      <label
        htmlFor="requirementsConfirmed"
        className={cn(intakeFillSurfaceClass, "flex cursor-pointer items-start gap-3 rounded-2xl px-5 py-5")}
      >
        <Checkbox
          id="requirementsConfirmed"
          checked={requirementsConfirmed}
          onChange={() =>
            setValue("requirementsConfirmed", !requirementsConfirmed, { shouldDirty: true, shouldValidate: true })
          }
          className="mt-0.5 shrink-0"
        />
        <span className="type-body text-text-primary">{t("requirementsConfirmed")}</span>
      </label>
      {errors.requirementsConfirmed?.message ? (
        <p className="type-caption text-status-rejected">{errors.requirementsConfirmed.message}</p>
      ) : null}
    </div>
  );
}
