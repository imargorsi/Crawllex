"use client";

import { Controller } from "react-hook-form";

import { ClientIntakeCheckboxGroup } from "@/components/forms/client-intake-checkbox-group";
import { Input } from "@/components/input";
import { Checkbox } from "@/components/ui/checkbox";
import type { TUseClientCreateFormResult } from "@/components/forms/hooks/use-client-create-form.hook";
import { CLIENT_CONTENT_READY, CLIENT_LANGUAGES, type TClientLanguage } from "@/lib/clients/intake-constants";

type TClientCreateStepDeliveryProps = {
  hook: TUseClientCreateFormResult;
};

export function ClientCreateStepDelivery({ hook }: TClientCreateStepDeliveryProps) {
  const {
    t,
    form: {
      register,
      control,
      watch,
      setValue,
      formState: { errors },
    },
    toggleLanguage,
  } = hook;

  const languages = watch("languages");
  const rtlRequired = watch("rtlRequired");
  const hasFixedDeadline = watch("hasFixedDeadline");
  const requirementsConfirmed = watch("requirementsConfirmed");
  const languageLabels = Object.fromEntries(
    CLIENT_LANGUAGES.map((language) => [language, t(`languages.${language}`)]),
  ) as Record<TClientLanguage, string>;

  return (
    <div className="space-y-8">
      <p className="type-body text-text-muted">{t("sectionDeliveryLead")}</p>
      <ClientIntakeCheckboxGroup
        legend={t("languagesLabel")}
        namePrefix="client-language"
        options={CLIENT_LANGUAGES}
        selected={languages}
        labels={languageLabels}
        onToggle={toggleLanguage}
        error={errors.languages?.message}
      />
      <label
        htmlFor="rtlRequired"
        className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-bg-input px-4 py-3"
      >
        <Checkbox
          id="rtlRequired"
          checked={rtlRequired}
          onChange={() => setValue("rtlRequired", !rtlRequired, { shouldDirty: true })}
        />
        <span className="type-body-strong text-text-primary">{t("rtlRequired")}</span>
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          id="expectedLaunchDate"
          type="date"
          label={t("expectedLaunchDate")}
          {...register("expectedLaunchDate")}
        />
        <label
          htmlFor="hasFixedDeadline"
          className="flex cursor-pointer items-center gap-3 self-end rounded-xl border border-border bg-bg-input px-4 py-3"
        >
          <Checkbox
            id="hasFixedDeadline"
            checked={hasFixedDeadline}
            onChange={() => setValue("hasFixedDeadline", !hasFixedDeadline, { shouldDirty: true })}
          />
          <span className="type-body-strong text-text-primary">{t("hasFixedDeadline")}</span>
        </label>
        <Controller
          control={control}
          name="contentReady"
          rules={{ required: t("valRequired") }}
          render={({ field }) => (
            <Input
              id="contentReady"
              type="select"
              label={t("contentReady")}
              placeholder={t("contentReadyPh")}
              required
              className="sm:col-span-2"
              options={CLIENT_CONTENT_READY.map((value) => ({
                value,
                label: t(`contentReadyOptions.${value}`),
              }))}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={errors.contentReady?.message}
            />
          )}
        />
      </div>
      <label
        htmlFor="requirementsConfirmed"
        className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-bg-input px-4 py-3"
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
