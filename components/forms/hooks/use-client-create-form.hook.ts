"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import type { TUseClientFormOptions } from "@/components/forms/client-form.types";
import type { TClientCreateFormValues } from "@/components/forms/client-create-form.types";
import { useCreateClientMutation, useUpdateClientMutation } from "@/features/clients/clients.api";
import { ApiError } from "@/lib/frontend/api/errors";
import {
  EMPTY_CLIENT_FORM_VALUES,
  toCreateClientPayload,
  toUpdateClientPayload,
} from "@/lib/frontend/clients/client-form-payload.utils";
import { CLIENT_ROUTES } from "@/lib/frontend/clients/client-routes.utils";
import { notify } from "@/lib/frontend/feedback/notify";
import {
  CLIENT_MOBILE_PLATFORMS,
  CLIENT_WEB_APP_PLATFORMS,
  CLIENT_WEBSITE_PLATFORMS,
  clientNeedsMobilePlatforms,
  clientNeedsWebAppPlatforms,
  clientNeedsWebsitePlatforms,
  type TClientLanguage,
  type TClientPlatform,
  type TClientProjectType,
  type TClientUserRole,
} from "@/lib/clients/intake-constants";

type UseClientCreateFormResult = ReturnType<typeof useClientCreateForm>;

const CLIENT_FORM_STEP_LABEL_KEYS = [
  "stepClient",
  "stepProject",
  "stepGoals",
  "stepScope",
  "stepDelivery",
] as const;

function fieldStepIndex(): Record<keyof TClientCreateFormValues, number> {
  return {
    businessName: 0,
    contactPerson: 0,
    pocEmail: 0,
    pocContactNumber: 0,
    businessSummary: 0,
    idealCustomerProfile: 0,
    projectTypes: 1,
    platforms: 1,
    projectName: 1,
    projectDescription: 1,
    successLooksLike: 2,
    existingSystem: 2,
    websiteUrl: 2,
    changeNotes: 2,
    launchMustHaves: 3,
    laterFeatures: 3,
    userRoles: 3,
    languages: 4,
    rtlRequired: 4,
    expectedLaunchDate: 4,
    hasFixedDeadline: 4,
    contentReady: 4,
    requirementsConfirmed: 4,
  };
}

function stepFields(): Array<Array<keyof TClientCreateFormValues>> {
  return [
    ["businessName", "contactPerson", "pocEmail", "pocContactNumber", "businessSummary", "idealCustomerProfile"],
    ["projectTypes", "platforms", "projectName", "projectDescription"],
    ["successLooksLike", "existingSystem", "websiteUrl", "changeNotes"],
    ["launchMustHaves", "laterFeatures", "userRoles"],
    ["languages", "rtlRequired", "expectedLaunchDate", "hasFixedDeadline", "contentReady", "requirementsConfirmed"],
  ];
}

function toggleValue<T>(current: T[], value: T): T[] {
  return current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
}

export function useClientCreateForm(options: TUseClientFormOptions = {}) {
  const { isEdit = false, clientId, initialValues, initialLogoUrl = null } = options;

  const router = useRouter();
  const { t } = useTranslation("translation", { keyPrefix: "modules.clients.createForm" });
  const createMutation = useCreateClientMutation();
  const updateMutation = useUpdateClientMutation();
  const [currentStep, setCurrentStep] = useState(0);
  const logoFileRef = useRef<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(initialLogoUrl);
  const steps = useMemo(() => stepFields(), []);
  const stepLabels = useMemo(() => CLIENT_FORM_STEP_LABEL_KEYS.map((key) => t(key)), [t]);
  const indexMap = useMemo(() => fieldStepIndex(), []);

  const form = useForm<TClientCreateFormValues>({
    defaultValues: initialValues ?? EMPTY_CLIENT_FORM_VALUES,
    mode: "onSubmit",
  });

  const { handleSubmit, setError, trigger, setFocus, watch, setValue, reset, getValues, register, formState: { errors }, clearErrors } =
    form;

  useEffect(() => {
    register("projectTypes", {
      validate: (value) => value.length > 0 || t("valSelectProjectType"),
    });
    register("platforms", {
      validate: (value) => {
        const types = getValues("projectTypes");
        if (
          clientNeedsWebsitePlatforms(types) &&
          !value.some((platform) => (CLIENT_WEBSITE_PLATFORMS as readonly string[]).includes(platform))
        ) {
          return t("valWebsitePlatform");
        }
        if (
          clientNeedsMobilePlatforms(types) &&
          !value.some((platform) => (CLIENT_MOBILE_PLATFORMS as readonly string[]).includes(platform))
        ) {
          return t("valMobilePlatform");
        }
        return true;
      },
    });
    register("userRoles", {
      validate: (value) => value.length > 0 || t("valSelectUserRole"),
    });
    register("languages", {
      validate: (value) => value.length > 0 || t("valSelectLanguage"),
    });
    register("requirementsConfirmed", {
      validate: (value) => value || t("valConfirm"),
    });
  }, [getValues, register, t]);

  useEffect(() => {
    if (!initialValues) return;
    reset(initialValues);
  }, [initialValues, reset]);

  useEffect(() => {
    setLogoPreviewUrl(initialLogoUrl);
  }, [initialLogoUrl]);

  const isSubmitting = isEdit ? updateMutation.isPending : createMutation.isPending;
  const isLastStep = currentStep === steps.length - 1;

  function prunePlatforms(nextTypes: TClientProjectType[]) {
    const current = getValues("platforms");
    const allowed = new Set<string>();
    if (clientNeedsWebsitePlatforms(nextTypes)) {
      CLIENT_WEBSITE_PLATFORMS.forEach((platform) => allowed.add(platform));
    }
    if (clientNeedsMobilePlatforms(nextTypes)) {
      CLIENT_MOBILE_PLATFORMS.forEach((platform) => allowed.add(platform));
    }
    if (clientNeedsWebAppPlatforms(nextTypes)) {
      CLIENT_WEB_APP_PLATFORMS.forEach((platform) => allowed.add(platform));
    }
    const pruned = current.filter((platform) => allowed.has(platform));
    if (pruned.length !== current.length) {
      setValue("platforms", pruned, { shouldDirty: true });
    }
  }

  function toggleProjectType(type: TClientProjectType) {
    const next = toggleValue(getValues("projectTypes"), type);
    setValue("projectTypes", next, { shouldDirty: true, shouldValidate: true });
    prunePlatforms(next);
    if (next.length > 0) clearErrors("projectTypes");
  }

  function togglePlatform(platform: TClientPlatform) {
    const next = toggleValue(getValues("platforms"), platform);
    setValue("platforms", next, { shouldDirty: true, shouldValidate: true });
    if (next.length > 0) clearErrors("platforms");
  }

  function toggleUserRole(role: TClientUserRole) {
    const next = toggleValue(getValues("userRoles"), role);
    setValue("userRoles", next, { shouldDirty: true, shouldValidate: true });
    if (next.length > 0) clearErrors("userRoles");
  }

  function toggleLanguage(language: TClientLanguage) {
    const next = toggleValue(getValues("languages"), language);
    setValue("languages", next, { shouldDirty: true, shouldValidate: true });
    if (next.length > 0) clearErrors("languages");
  }

  async function goToNextStep() {
    const fields = steps[currentStep];
    const isValid = await trigger(fields);

    if (!isValid) {
      const firstInvalidField = fields.find((field) => Boolean(errors[field]));
      if (firstInvalidField) setFocus(firstInvalidField);
      notify.error(t("stepValidationError"));
      return;
    }

    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  }

  function goToPreviousStep() {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }

  function jumpToServerErrorStep(error: ApiError) {
    const keys = Object.keys(error.errors);
    const matched = keys.find((key) => {
      const flat = key.includes(".") ? (key.split(".").at(-1) ?? key) : key;
      return flat in indexMap;
    });
    if (!matched) return;
    const flat = matched.includes(".") ? (matched.split(".").at(-1) ?? matched) : matched;
    const step = indexMap[flat as keyof TClientCreateFormValues];
    if (step != null) setCurrentStep(step);
  }

  function onLogoPicked(file: File) {
    if (logoPreviewUrl?.startsWith("blob:")) URL.revokeObjectURL(logoPreviewUrl);
    logoFileRef.current = file;
    setLogoPreviewUrl(URL.createObjectURL(file));
  }

  async function onSubmit(values: TClientCreateFormValues) {
    if (!isLastStep) {
      await goToNextStep();
      return;
    }

    try {
      if (isEdit) {
        if (!clientId) {
          notify.error(t("editErrorFallback"));
          return;
        }

        await updateMutation.mutateAsync({
          clientId,
          payload: toUpdateClientPayload(values),
          companyLogoFile: logoFileRef.current,
        });
        notify.success(t("editSuccessFallback"));
        router.push(CLIENT_ROUTES.view(clientId));
        return;
      }

      const created = await createMutation.mutateAsync({
        payload: toCreateClientPayload(values),
        companyLogoFile: logoFileRef.current,
      });
      notify.success(t("successFallback"));
      router.push(CLIENT_ROUTES.view(created.id));
    } catch (error) {
      if (error instanceof ApiError) {
        jumpToServerErrorStep(error);
        notify.error(ApiError.messageFrom(error, isEdit ? t("editErrorFallback") : t("errorFallback")));
        return;
      }

      notify.error(isEdit ? t("editErrorFallback") : t("errorFallback"));
    }
  }

  return {
    t,
    form,
    currentStep,
    setCurrentStep,
    steps,
    stepLabels,
    isEdit,
    isSubmitting,
    isLastStep,
    onSubmit: handleSubmit(onSubmit),
    goToNextStep,
    goToPreviousStep,
    logoPreviewUrl,
    onLogoPicked,
    businessName: form.watch("businessName"),
    toggleProjectType,
    togglePlatform,
    toggleUserRole,
    toggleLanguage,
    clientId,
  };
}

export type TUseClientCreateFormResult = UseClientCreateFormResult;
