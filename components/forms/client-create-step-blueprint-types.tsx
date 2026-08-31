"use client";

import { ClientIntakeChoiceChips } from "@/components/forms/client-intake-choice-chips";
import { Input } from "@/components/input";
import type { TUseClientCreateFormResult } from "@/components/forms/hooks/use-client-create-form.hook";
import {
  INTAKE_MOBILE_PLATFORMS,
  INTAKE_OTHER_MAX,
  INTAKE_WEB_APP_TYPES,
  INTAKE_WEBSITE_FOCUS,
  intakeNeedsMobilePlatforms,
  intakeNeedsWebAppTypes,
  intakeNeedsWebsiteFocus,
  type TIntakeMobilePlatform,
  type TIntakeWebAppType,
  type TIntakeWebsiteFocus,
} from "@/lib/frontend/clients/intake-ui.constants";
import {
  INTAKE_MOBILE_PLATFORM_ICONS,
  INTAKE_WEB_APP_TYPE_ICONS,
  INTAKE_WEBSITE_FOCUS_ICONS,
} from "@/lib/frontend/clients/intake-option-icons";
import { fieldStartIcons } from "@/lib/frontend/forms/input-start-icons";

type TBlueprintTypeFollowUpsProps = {
  hook: TUseClientCreateFormResult;
};

export function ClientCreateBlueprintTypeFollowUps({ hook }: TBlueprintTypeFollowUpsProps) {
  const {
    t,
    form: {
      register,
      watch,
      formState: { errors },
    },
    toggleWebsiteFocus,
    toggleMobilePlatform,
    toggleWebAppType,
  } = hook;

  const projectTypes = watch("projectTypes");
  const websiteFocus = watch("websiteFocus");
  const mobilePlatforms = watch("mobilePlatforms");
  const webAppTypes = watch("webAppTypes");

  const websiteFocusLabels = Object.fromEntries(
    INTAKE_WEBSITE_FOCUS.map((value) => [value, t(`websiteFocus.${value}`)]),
  ) as Record<TIntakeWebsiteFocus, string>;
  const mobileLabels = Object.fromEntries(
    INTAKE_MOBILE_PLATFORMS.map((value) => [value, t(`mobilePlatforms.${value}`)]),
  ) as Record<TIntakeMobilePlatform, string>;
  const webAppLabels = Object.fromEntries(
    INTAKE_WEB_APP_TYPES.map((value) => [value, t(`webAppTypes.${value}`)]),
  ) as Record<TIntakeWebAppType, string>;

  if (
    !intakeNeedsWebsiteFocus(projectTypes) &&
    !intakeNeedsMobilePlatforms(projectTypes) &&
    !intakeNeedsWebAppTypes(projectTypes)
  ) {
    return null;
  }

  return (
    <div className="space-y-8 pt-4">
      {intakeNeedsWebsiteFocus(projectTypes) ? (
        <ClientIntakeChoiceChips
          legend={t("websiteFocusLabel")}
          required
          legendPlacement="start"
          namePrefix="client-website-focus"
          options={INTAKE_WEBSITE_FOCUS}
          selected={websiteFocus}
          labels={websiteFocusLabels}
          icons={INTAKE_WEBSITE_FOCUS_ICONS}
          onToggle={toggleWebsiteFocus}
          error={errors.websiteFocus?.message}
        />
      ) : null}

      {intakeNeedsMobilePlatforms(projectTypes) ? (
        <ClientIntakeChoiceChips
          legend={t("platformsMobileLabel")}
          required
          legendPlacement="start"
          namePrefix="client-mobile-platform"
          options={INTAKE_MOBILE_PLATFORMS}
          selected={mobilePlatforms}
          labels={mobileLabels}
          icons={INTAKE_MOBILE_PLATFORM_ICONS}
          onToggle={toggleMobilePlatform}
          error={errors.mobilePlatforms?.message}
        />
      ) : null}

      {intakeNeedsWebAppTypes(projectTypes) ? (
        <ClientIntakeChoiceChips
          legend={t("webAppTypeLabel")}
          required
          legendPlacement="start"
          namePrefix="client-web-app-type"
          options={INTAKE_WEB_APP_TYPES}
          selected={webAppTypes}
          labels={webAppLabels}
          icons={INTAKE_WEB_APP_TYPE_ICONS}
          onToggle={toggleWebAppType}
          error={errors.webAppTypes?.message}
          afterOption="other"
          afterContent={
            webAppTypes.includes("other") ? (
              <Input
                id="webAppTypeOther"
                placeholder={t("pleaseSpecify")}
                required
                aria-label={t("pleaseSpecify")}
                maxLength={INTAKE_OTHER_MAX}
                startIcon={fieldStartIcons.text}
                error={errors.webAppTypeOther?.message}
                {...register("webAppTypeOther", {
                  validate: (value) => {
                    if (!webAppTypes.includes("other")) return true;
                    return value.trim().length >= 2 || t("valSpecifyOther");
                  },
                })}
              />
            ) : null
          }
        />
      ) : null}
    </div>
  );
}
