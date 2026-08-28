"use client";

import { ClientIntakeCheckboxGroup } from "@/components/forms/client-intake-checkbox-group";
import { Input } from "@/components/input";
import type { TUseClientCreateFormResult } from "@/components/forms/hooks/use-client-create-form.hook";
import { CLIENT_USER_ROLES, type TClientUserRole } from "@/lib/clients/intake-constants";

type TClientCreateStepScopeProps = {
  hook: TUseClientCreateFormResult;
};

export function ClientCreateStepScope({ hook }: TClientCreateStepScopeProps) {
  const {
    t,
    form: {
      register,
      watch,
      formState: { errors },
    },
    toggleUserRole,
  } = hook;

  const userRoles = watch("userRoles");
  const roleLabels = Object.fromEntries(
    CLIENT_USER_ROLES.map((role) => [role, t(`userRoles.${role}`)]),
  ) as Record<TClientUserRole, string>;

  return (
    <div className="space-y-8">
      <p className="type-body text-text-muted">{t("sectionScopeLead")}</p>
      <Input
        id="launchMustHaves"
        type="textarea"
        rows={4}
        label={t("launchMustHaves")}
        placeholder={t("launchMustHavesPh")}
        required
        error={errors.launchMustHaves?.message}
        {...register("launchMustHaves", { required: t("valRequired") })}
      />
      <Input
        id="laterFeatures"
        type="textarea"
        rows={3}
        label={t("laterFeatures")}
        placeholder={t("laterFeaturesPh")}
        {...register("laterFeatures")}
      />
      <ClientIntakeCheckboxGroup
        legend={t("userRolesLabel")}
        namePrefix="client-user-role"
        options={CLIENT_USER_ROLES}
        selected={userRoles}
        labels={roleLabels}
        onToggle={toggleUserRole}
        error={errors.userRoles?.message}
      />
    </div>
  );
}
