"use client";

import { Input } from "@/components/input";
import { ImageUploadAvatar } from "@/components/ui/image-upload-avatar";
import { PhoneNumberInput } from "@/components/ui/phone-number-input";
import { Controller } from "react-hook-form";
import type { TUseClientCreateFormResult } from "@/components/forms/hooks/use-client-create-form.hook";
import { fieldStartIcons } from "@/lib/frontend/forms/input-start-icons";
import { INTAKE_TEXTAREA_MAX } from "@/lib/frontend/clients/intake-ui.constants";
import { DISPLAY_NAME_MAX_LENGTH } from "@/lib/validation/display-name";

type TClientCreateStepCompanyProps = {
  hook: TUseClientCreateFormResult;
};

export function ClientCreateStepCompany({ hook }: TClientCreateStepCompanyProps) {
  const {
    t,
    form: {
      register,
      control,
      formState: { errors },
    },
    logoPreviewUrl,
    onLogoPicked,
    businessName,
  } = hook;

  return (
    <div className="space-y-12">
      <ImageUploadAvatar
        name={businessName || t("businessName")}
        imageUrl={logoPreviewUrl}
        onFilePicked={onLogoPicked}
        hint={t("companyLogoHint")}
        pickLabel={t("companyLogoUploadLabel")}
        accept="image/jpeg,image/png,image/webp,image/gif"
        maxSizeMb={5}
        variant="logo"
      />
      <div className="grid gap-8 sm:grid-cols-2">
        <Input
          id="businessName"
          label={t("businessName")}
          placeholder={t("businessNamePh")}
          required
          maxLength={DISPLAY_NAME_MAX_LENGTH}
          startIcon={fieldStartIcons.business}
          error={errors.businessName?.message}
          {...register("businessName", {
            required: t("valRequired"),
            minLength: { value: 2, message: t("valMin") },
            maxLength: { value: DISPLAY_NAME_MAX_LENGTH, message: t("valMax") },
          })}
        />
        <Input
          id="contactPerson"
          label={t("contactPerson")}
          placeholder={t("contactPersonPh")}
          required
          maxLength={DISPLAY_NAME_MAX_LENGTH}
          startIcon={fieldStartIcons.person}
          error={errors.contactPerson?.message}
          {...register("contactPerson", {
            required: t("valRequired"),
            minLength: { value: 2, message: t("valMin") },
            maxLength: { value: DISPLAY_NAME_MAX_LENGTH, message: t("valMax") },
          })}
        />
        <Input
          id="pocEmail"
          type="email"
          label={t("pocEmail")}
          placeholder={t("pocEmailPh")}
          required
          startIcon={fieldStartIcons.mail}
          error={errors.pocEmail?.message}
          {...register("pocEmail", {
            required: t("valRequired"),
            validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) || t("valEmail"),
          })}
        />
        <Controller
          control={control}
          name="pocContactNumber"
          rules={{ required: t("valRequired") }}
          render={({ field }) => (
            <PhoneNumberInput
              id="pocContactNumber"
              label={t("pocContactNumber")}
              placeholder={t("pocContactNumberPh")}
              required
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={errors.pocContactNumber?.message}
            />
          )}
        />
        <Input
          id="businessSummary"
          type="textarea"
          rows={4}
          label={t("businessSummary")}
          placeholder={t("businessSummaryPh")}
          required
          maxLength={INTAKE_TEXTAREA_MAX}
          className="sm:col-span-2"
          error={errors.businessSummary?.message}
          {...register("businessSummary", { required: t("valRequired") })}
        />
        <Input
          id="idealCustomerProfile"
          type="textarea"
          rows={3}
          label={t("idealCustomerProfile")}
          placeholder={t("idealCustomerProfilePh")}
          required
          maxLength={INTAKE_TEXTAREA_MAX}
          className="sm:col-span-2"
          error={errors.idealCustomerProfile?.message}
          {...register("idealCustomerProfile", { required: t("valRequired") })}
        />
      </div>
    </div>
  );
}
