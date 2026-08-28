"use client";

import { ClientIntakeCheckboxGroup } from "@/components/forms/client-intake-checkbox-group";
import { Input } from "@/components/input";
import type { TUseClientCreateFormResult } from "@/components/forms/hooks/use-client-create-form.hook";
import {
  CLIENT_MOBILE_PLATFORMS,
  CLIENT_PLATFORMS,
  CLIENT_PROJECT_TYPES,
  CLIENT_WEB_APP_PLATFORMS,
  CLIENT_WEBSITE_PLATFORMS,
  clientNeedsMobilePlatforms,
  clientNeedsWebAppPlatforms,
  clientNeedsWebsitePlatforms,
  type TClientPlatform,
  type TClientProjectType,
} from "@/lib/clients/intake-constants";
import { DISPLAY_NAME_MAX_LENGTH } from "@/lib/validation/display-name";

type TClientCreateStepProjectProps = {
  hook: TUseClientCreateFormResult;
};

export function ClientCreateStepProject({ hook }: TClientCreateStepProjectProps) {
  const {
    t,
    form: {
      register,
      watch,
      formState: { errors },
    },
    toggleProjectType,
    togglePlatform,
  } = hook;

  const projectTypes = watch("projectTypes");
  const platforms = watch("platforms");
  const projectTypeLabels = Object.fromEntries(
    CLIENT_PROJECT_TYPES.map((type) => [type, t(`projectTypes.${type}`)]),
  ) as Record<TClientProjectType, string>;
  const platformLabels = Object.fromEntries(
    CLIENT_PLATFORMS.map((platform) => [platform, t(`platforms.${platform}`)]),
  ) as Record<TClientPlatform, string>;

  return (
    <div className="space-y-8">
      <p className="type-body text-text-muted">{t("sectionProjectLead")}</p>
      <ClientIntakeCheckboxGroup
        legend={t("projectTypesLabel")}
        namePrefix="client-project-type"
        options={CLIENT_PROJECT_TYPES}
        selected={projectTypes}
        labels={projectTypeLabels}
        onToggle={toggleProjectType}
        error={errors.projectTypes?.message}
      />

      {clientNeedsWebsitePlatforms(projectTypes) ? (
        <ClientIntakeCheckboxGroup
          legend={t("platformsWebsiteLabel")}
          namePrefix="client-platform-web"
          options={CLIENT_WEBSITE_PLATFORMS}
          selected={platforms}
          labels={platformLabels}
          onToggle={togglePlatform}
          error={errors.platforms?.message}
        />
      ) : null}

      {clientNeedsMobilePlatforms(projectTypes) ? (
        <ClientIntakeCheckboxGroup
          legend={t("platformsMobileLabel")}
          namePrefix="client-platform-mobile"
          options={CLIENT_MOBILE_PLATFORMS}
          selected={platforms}
          labels={platformLabels}
          onToggle={togglePlatform}
          error={errors.platforms?.message}
        />
      ) : null}

      {clientNeedsWebAppPlatforms(projectTypes) ? (
        <ClientIntakeCheckboxGroup
          legend={t("platformsWebAppLabel")}
          namePrefix="client-platform-app"
          options={CLIENT_WEB_APP_PLATFORMS}
          selected={platforms}
          labels={platformLabels}
          onToggle={togglePlatform}
        />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          id="projectName"
          label={t("projectName")}
          placeholder={t("projectNamePh")}
          required
          maxLength={DISPLAY_NAME_MAX_LENGTH}
          error={errors.projectName?.message}
          {...register("projectName", {
            required: t("valRequired"),
            minLength: { value: 2, message: t("valMin") },
            maxLength: { value: DISPLAY_NAME_MAX_LENGTH, message: t("valMax") },
          })}
        />
        <Input
          id="projectDescription"
          type="textarea"
          rows={4}
          label={t("projectDescription")}
          placeholder={t("projectDescriptionPh")}
          required
          className="sm:col-span-2"
          error={errors.projectDescription?.message}
          {...register("projectDescription", { required: t("valRequired") })}
        />
      </div>
    </div>
  );
}
