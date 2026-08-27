"use client";

import { Controller } from "react-hook-form";

import { Input } from "@/components/input";
import { ImageUploadAvatar } from "@/components/ui/image-upload-avatar";
import { PhoneNumberInput } from "@/components/ui/phone-number-input";
import type { TUseClientCreateFormResult } from "@/components/forms/hooks/use-client-create-form.hook";
import { fieldStartIcons } from "@/lib/frontend/forms/input-start-icons";
import { WEBSITE_URL_PATTERN } from "@/lib/projects/website-url.utils";
import { DISPLAY_NAME_MAX_LENGTH } from "@/lib/validation/display-name";

type ClientCreateStepBusinessProps = {
  hook: TUseClientCreateFormResult;
};

export function ClientCreateStepBusiness({ hook }: ClientCreateStepBusinessProps) {
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
    <div className="space-y-6">
      <p className="type-body text-text-muted">{t("sectionBusinessLead")}</p>
      <ImageUploadAvatar
        name={businessName || t("businessName")}
        imageUrl={logoPreviewUrl}
        onFilePicked={onLogoPicked}
        hint={t("companyLogoHint")}
        pickLabel={t("companyLogoUploadLabel")}
        accept="image/jpeg,image/png,image/webp,image/gif"
        maxSizeMb={5}
        variant="logo"
        className="sm:col-span-2 mt-4"
      />
      <div className="grid gap-4 sm:grid-cols-2">
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
          id="websiteUrl"
          type="url"
          label={t("websiteUrl")}
          placeholder={t("websiteUrlPh")}
          required
          error={errors.websiteUrl?.message}
          {...register("websiteUrl", {
            required: t("valRequired"),
            validate: (value) => WEBSITE_URL_PATTERN.test(value.trim()) || t("valUrl"),
          })}
        />
        <Input
          id="businessAddress"
          label={t("businessAddress")}
          placeholder={t("businessAddressPh")}
          startIcon={fieldStartIcons.location}
          className="sm:col-span-2"
          {...register("businessAddress")}
        />
        <Controller
          control={control}
          name="pocContactNumber"
          render={({ field }) => (
            <PhoneNumberInput
              id="pocContactNumber"
              label={t("pocContactNumber")}
              placeholder={t("pocContactNumberPh")}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
            />
          )}
        />
        <Input
          id="pocEmail"
          type="email"
          label={t("pocEmail")}
          placeholder={t("pocEmailPh")}
          error={errors.pocEmail?.message}
          {...register("pocEmail", {
            validate: (value) => {
              const trimmed = value.trim();
              if (!trimmed) return true;
              return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) || t("valEmail");
            },
          })}
        />
      </div>
    </div>
  );
}
