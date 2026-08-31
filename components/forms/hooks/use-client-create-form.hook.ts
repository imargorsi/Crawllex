"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import type { TClientCreateFormValues } from "@/components/forms/client-create-form.types";
import type { TUseClientFormOptions } from "@/components/forms/client-form.types";
import type { TClientFilePublic } from "@/types/client.types";
import { useCreateClientMutation, useUpdateClientMutation } from "@/features/clients/clients.api";
import { ApiError } from "@/lib/frontend/api/errors";
import {
  EMPTY_CLIENT_FORM_VALUES,
  toCreateClientPayload,
  toUpdateClientPayload,
} from "@/lib/frontend/clients/client-form-payload.utils";
import {
  CLIENT_FORM_STEP_LABEL_KEYS,
  clientFormStepFields,
  earliestClientFormErrorStep,
} from "@/lib/frontend/clients/client-form-steps.utils";
import { CLIENT_ROUTES } from "@/lib/frontend/clients/client-routes.utils";
import { notify } from "@/lib/frontend/feedback/notify";
import {
  EMPTY_INTAKE_FEATURE,
  EMPTY_INTAKE_LINK,
  INTAKE_FEATURE_WHAT_MIN,
  INTAKE_MAX_FEATURES,
  INTAKE_MAX_LINKS,
  intakeNeedsMobilePlatforms,
  intakeNeedsProjectTypeOther,
  intakeNeedsWebAppTypes,
  intakeNeedsWebsiteFocus,
  type TIntakeBuildType,
  type TIntakeIntegration,
  type TIntakeMobilePlatform,
  type TIntakeWebAppType,
  type TIntakeWebsiteFocus,
} from "@/lib/frontend/clients/intake-ui.constants";
import { toggleListValue } from "@/lib/frontend/clients/intake-ui.utils";

export const EMPTY_CLIENT_FILES: TClientFilePublic[] = [];

type UseClientCreateFormResult = ReturnType<typeof useClientCreateForm>;

export function useClientCreateForm(options: TUseClientFormOptions = {}) {
  const { isEdit = false, clientId, initialValues, initialLogoUrl = null, initialFiles = EMPTY_CLIENT_FILES } = options;

  const router = useRouter();
  const { t } = useTranslation("translation", { keyPrefix: "modules.clients.createForm" });
  const createMutation = useCreateClientMutation();
  const updateMutation = useUpdateClientMutation();
  const [currentStep, setCurrentStep] = useState(0);
  const logoFileRef = useRef<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(initialLogoUrl);
  const [assetFiles, setAssetFiles] = useState<File[]>([]);
  const [storedFiles, setStoredFiles] = useState<TClientFilePublic[]>(initialFiles);
  const steps = useMemo(() => clientFormStepFields(), []);
  const stepLabels = useMemo(() => CLIENT_FORM_STEP_LABEL_KEYS.map((key) => t(key)), [t]);

  const form = useForm<TClientCreateFormValues>({
    defaultValues: initialValues ?? EMPTY_CLIENT_FORM_VALUES,
    mode: "onSubmit",
  });

  const { handleSubmit, trigger, setFocus, setValue, reset, getValues, register, formState: { errors }, clearErrors } =
    form;

  const featureArray = useFieldArray({ control: form.control, name: "features" });
  const linkArray = useFieldArray({ control: form.control, name: "links" });

  useEffect(() => {
    register("projectTypes", {
      validate: (value) => value.length > 0 || t("valSelectProjectType"),
    });
    register("projectTypeOther", {
      validate: (value) => {
        if (!intakeNeedsProjectTypeOther(getValues("projectTypes"))) return true;
        return value.trim().length >= 2 || t("valSpecifyOther");
      },
    });
    register("websiteFocus", {
      validate: (value) => {
        if (!intakeNeedsWebsiteFocus(getValues("projectTypes"))) return true;
        return value.length > 0 || t("valWebsiteFocus");
      },
    });
    register("mobilePlatforms", {
      validate: (value) => {
        if (!intakeNeedsMobilePlatforms(getValues("projectTypes"))) return true;
        return value.length > 0 || t("valMobilePlatform");
      },
    });
    register("webAppTypes", {
      validate: (value) => {
        if (!intakeNeedsWebAppTypes(getValues("projectTypes"))) return true;
        return value.length > 0 || t("valWebAppType");
      },
    });
    register("webAppTypeOther", {
      validate: (value) => {
        if (!getValues("webAppTypes").includes("other")) return true;
        return value.trim().length >= 2 || t("valSpecifyOther");
      },
    });
    register("features", {
      validate: (rows) => {
        if (rows.length < 1) return t("valFeatures");
        const incomplete = rows.some(
          (row) => row.name.trim().length < 2 || row.whatItDoes.trim().length < INTAKE_FEATURE_WHAT_MIN,
        );
        return incomplete ? t("valFeatureRow") : true;
      },
    });
    register("integrationOther", {
      validate: (value) => {
        if (!getValues("integrations").includes("other_api")) return true;
        return value.trim().length >= 2 || t("valSpecifyOther");
      },
    });
    register("links", {
      validate: (rows) => {
        const incomplete = rows.some((row) => !row.linkName.trim() || !row.url.trim());
        return incomplete ? t("valLinkRow") : true;
      },
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

  const storedFileKey = initialFiles.map((file) => file.id).join("|");
  const initialFilesRef = useRef(initialFiles);
  initialFilesRef.current = initialFiles;

  useEffect(() => {
    setStoredFiles(initialFilesRef.current);
  }, [storedFileKey]);

  const isSubmitting = isEdit ? updateMutation.isPending : createMutation.isPending;
  const isLastStep = currentStep === steps.length - 1;

  function toggleProjectType(type: TIntakeBuildType) {
    const next = toggleListValue(getValues("projectTypes"), type);
    setValue("projectTypes", next, { shouldDirty: true, shouldValidate: true });
    if (!intakeNeedsWebsiteFocus(next)) {
      setValue("websiteFocus", []);
    }
    if (!intakeNeedsMobilePlatforms(next)) {
      setValue("mobilePlatforms", []);
    }
    if (!intakeNeedsWebAppTypes(next)) {
      setValue("webAppTypes", []);
      setValue("webAppTypeOther", "");
    }
    if (!intakeNeedsProjectTypeOther(next)) {
      setValue("projectTypeOther", "");
    }
    if (next.length > 0) clearErrors("projectTypes");
  }

  function toggleWebsiteFocus(value: TIntakeWebsiteFocus) {
    const next = toggleListValue(getValues("websiteFocus"), value);
    setValue("websiteFocus", next, { shouldDirty: true, shouldValidate: true });
    if (next.length > 0) clearErrors("websiteFocus");
  }

  function toggleMobilePlatform(value: TIntakeMobilePlatform) {
    const next = toggleListValue(getValues("mobilePlatforms"), value);
    setValue("mobilePlatforms", next, { shouldDirty: true, shouldValidate: true });
    if (next.length > 0) clearErrors("mobilePlatforms");
  }

  function toggleWebAppType(value: TIntakeWebAppType) {
    const next = toggleListValue(getValues("webAppTypes"), value);
    setValue("webAppTypes", next, { shouldDirty: true, shouldValidate: true });
    if (!next.includes("other")) setValue("webAppTypeOther", "");
    if (next.length > 0) clearErrors("webAppTypes");
  }

  function toggleIntegration(value: TIntakeIntegration) {
    const next = toggleListValue(getValues("integrations"), value);
    setValue("integrations", next, { shouldDirty: true, shouldValidate: true });
    if (!next.includes("other_api")) setValue("integrationOther", "");
  }

  function addFeature() {
    if (getValues("features").length >= INTAKE_MAX_FEATURES) return;
    featureArray.append({ ...EMPTY_INTAKE_FEATURE });
  }

  function addLink() {
    if (getValues("links").length >= INTAKE_MAX_LINKS) return;
    linkArray.append({ ...EMPTY_INTAKE_LINK });
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
    const step = earliestClientFormErrorStep(Object.keys(error.errors));
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
          payload: toUpdateClientPayload(
            values,
            storedFiles.map((file) => file.id),
          ),
          companyLogoFile: logoFileRef.current,
          assetFiles,
        });
        notify.success(t("editSuccessFallback"));
        router.push(CLIENT_ROUTES.view(clientId));
        return;
      }

      const created = await createMutation.mutateAsync({
        payload: toCreateClientPayload(values),
        companyLogoFile: logoFileRef.current,
        assetFiles,
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
    assetFiles,
    setAssetFiles,
    storedFiles,
    setStoredFiles,
    featureArray,
    linkArray,
    addFeature,
    addLink,
    toggleProjectType,
    toggleWebsiteFocus,
    toggleMobilePlatform,
    toggleWebAppType,
    toggleIntegration,
    clientId,
  };
}

export type TUseClientCreateFormResult = UseClientCreateFormResult;
