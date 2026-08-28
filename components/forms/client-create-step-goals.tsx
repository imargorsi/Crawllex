"use client";

import { Controller } from "react-hook-form";

import { Input } from "@/components/input";
import type { TUseClientCreateFormResult } from "@/components/forms/hooks/use-client-create-form.hook";
import { CLIENT_EXISTING_SYSTEMS, clientHasExistingSystem } from "@/lib/clients/intake-constants";
import { WEBSITE_URL_PATTERN } from "@/lib/projects/website-url.utils";

type TClientCreateStepGoalsProps = {
  hook: TUseClientCreateFormResult;
};

export function ClientCreateStepGoals({ hook }: TClientCreateStepGoalsProps) {
  const {
    t,
    form: {
      register,
      control,
      watch,
      formState: { errors },
    },
  } = hook;

  const existingSystem = watch("existingSystem");
  const showExisting = existingSystem !== "" && clientHasExistingSystem(existingSystem);

  return (
    <div className="space-y-6">
      <p className="type-body text-text-muted">{t("sectionGoalsLead")}</p>
      <Input
        id="successLooksLike"
        type="textarea"
        rows={4}
        label={t("successLooksLike")}
        placeholder={t("successLooksLikePh")}
        required
        error={errors.successLooksLike?.message}
        {...register("successLooksLike", { required: t("valRequired") })}
      />
      <Controller
        control={control}
        name="existingSystem"
        rules={{ required: t("valRequired") }}
        render={({ field }) => (
          <Input
            id="existingSystem"
            type="select"
            label={t("existingSystem")}
            placeholder={t("existingSystemPh")}
            required
            options={CLIENT_EXISTING_SYSTEMS.map((value) => ({
              value,
              label: t(`existingSystems.${value}`),
            }))}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            error={errors.existingSystem?.message}
          />
        )}
      />
      {showExisting ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="websiteUrl"
            type="url"
            label={t("websiteUrl")}
            placeholder={t("websiteUrlPh")}
            error={errors.websiteUrl?.message}
            {...register("websiteUrl", {
              validate: (value) => {
                const trimmed = value.trim();
                if (!trimmed) return true;
                return WEBSITE_URL_PATTERN.test(trimmed) || t("valUrl");
              },
            })}
          />
          <Input
            id="changeNotes"
            type="textarea"
            rows={3}
            label={t("changeNotes")}
            placeholder={t("changeNotesPh")}
            className="sm:col-span-2"
            {...register("changeNotes")}
          />
        </div>
      ) : null}
    </div>
  );
}
