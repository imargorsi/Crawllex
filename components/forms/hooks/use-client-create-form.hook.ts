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

type UseClientCreateFormResult = ReturnType<typeof useClientCreateForm>;

const CLIENT_FORM_STEP_LABEL_KEYS = [
  "stepBasicInformation",
  "stepServiceInformation",
  "stepSeo",
] as const;

function fieldStepIndex(): Record<keyof TClientCreateFormValues, number> {
  return {
    businessName: 0,
    websiteUrl: 0,
    businessAddress: 0,
    pocContactNumber: 0,
    pocEmail: 0,
    servicesOffered: 1,
    primaryServiceToPromote: 1,
    idealCustomerProfile: 1,
    targetLocations: 1,
    seoGoals: 2,
    competitorUrls: 2,
  };
}

function stepFields(): Array<Array<keyof TClientCreateFormValues>> {
  return [
    ["businessName", "websiteUrl", "businessAddress", "pocContactNumber", "pocEmail"],
    ["servicesOffered", "primaryServiceToPromote", "idealCustomerProfile", "targetLocations"],
    ["seoGoals", "competitorUrls"],
  ];
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

  const { handleSubmit, setError, trigger, setFocus, watch, setValue, reset, formState: { errors }, clearErrors } =
    form;

  useEffect(() => {
    if (!initialValues) return;
    reset(initialValues);
  }, [initialValues, reset]);

  useEffect(() => {
    setLogoPreviewUrl(initialLogoUrl);
  }, [initialLogoUrl]);

  const isSubmitting = isEdit ? updateMutation.isPending : createMutation.isPending;
  const isLastStep = currentStep === steps.length - 1;
  const selectedSeoGoals = watch("seoGoals");

  function toggleSeoGoal(goal: TClientCreateFormValues["seoGoals"][number]) {
    const current = watch("seoGoals");
    const next = current.includes(goal) ? current.filter((item) => item !== goal) : [...current, goal];
    setValue("seoGoals", next, { shouldDirty: true, shouldValidate: true });
    if (next.length > 0) clearErrors("seoGoals");
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
        const fieldMap: Partial<Record<keyof TClientCreateFormValues, string | undefined>> = {
          businessName: error.errors.businessName?.[0],
          websiteUrl: error.errors.websiteUrl?.[0],
          pocContactNumber: error.errors.pocContactNumber?.[0],
          pocEmail: error.errors.pocEmail?.[0],
          competitorUrls: error.errors["competitorUrls.0"]?.[0] ?? error.errors.competitorUrls?.[0],
          seoGoals: error.errors["seoGoals.0"]?.[0] ?? error.errors.seoGoals?.[0],
        };

        (Object.keys(fieldMap) as Array<keyof TClientCreateFormValues>).forEach((key) => {
          const message = fieldMap[key];
          if (message) setError(key, { type: "server", message });
        });

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
    selectedSeoGoals,
    toggleSeoGoal,
    clientId,
  };
}

export type TUseClientCreateFormResult = UseClientCreateFormResult;
