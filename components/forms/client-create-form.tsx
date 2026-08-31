"use client";

import Link from "next/link";

import type { TClientFormProps } from "@/components/forms/client-form.types";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ProjectCreateStepper } from "@/components/forms/project-create-stepper";
import { ClientCreateStepContent } from "@/components/forms/client-create-steps";
import { EMPTY_CLIENT_FILES, useClientCreateForm } from "@/components/forms/hooks/use-client-create-form.hook";
import { CLIENT_ROUTES } from "@/lib/frontend/clients/client-routes.utils";
import { intakeFillSurfaceClass } from "@/lib/frontend/layout/dashboard-chrome";
import { cn } from "@/lib/utils";

export function ClientCreateForm({
  isEdit = false,
  clientId,
  initialValues,
  initialLogoUrl = null,
  initialFiles = EMPTY_CLIENT_FILES,
}: TClientFormProps) {
  const hook = useClientCreateForm({
    isEdit,
    clientId,
    initialValues,
    initialLogoUrl,
    initialFiles,
  });
  const {
    t,
    onSubmit,
    currentStep,
    stepLabels,
    isLastStep,
    isSubmitting,
    goToNextStep,
    goToPreviousStep,
    isEdit: isEditMode,
    clientId: editClientId,
  } = hook;

  const backHref = isEditMode && editClientId ? CLIENT_ROUTES.view(editClientId) : CLIENT_ROUTES.list;
  const backLabel = isEditMode ? t("backToClient") : t("backToList");
  const submitLabel = isSubmitting
    ? isEditMode
      ? t("editSubmitting")
      : t("submitting")
    : isEditMode
      ? t("editSubmit")
      : t("submit");

  return (
    <form className="space-y-8" onSubmit={onSubmit} noValidate>
      <section className={cn(intakeFillSurfaceClass, "rounded-2xl p-8 sm:p-10")}>
        <div className="space-y-12">
          <ProjectCreateStepper labels={stepLabels} current={currentStep} ariaLabel={t("stepperAria")} />
          <ClientCreateStepContent hook={hook} />
        </div>
      </section>

      <div className="p-1">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full sm:w-auto"
            onClick={goToPreviousStep}
            disabled={currentStep === 0}
          >
            {t("previousStep")}
          </Button>

          <div className="flex w-full justify-end sm:w-auto">
            {isLastStep ? (
              <Button
                key="submit-step"
                type="submit"
                variant="gradient"
                size="lg"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
                className="w-full sm:min-w-52 sm:w-auto"
              >
                <span className="inline-flex items-center justify-center gap-2 px-1">
                  {isSubmitting ? <Spinner className="size-4 shrink-0" /> : null}
                  {submitLabel}
                </span>
              </Button>
            ) : (
              <Button
                key="next-step"
                type="button"
                variant="gradient"
                size="lg"
                className="w-full sm:min-w-52 sm:w-auto"
                onClick={goToNextStep}
              >
                {t("nextStep")}
              </Button>
            )}
          </div>
        </div>
        {currentStep === 0 ? (
          <div className="mt-3">
            <Link
              href={backHref}
              className="inline-flex type-body-strong text-text-secondary transition-colors hover:text-text-primary hover:underline"
            >
              {backLabel}
            </Link>
          </div>
        ) : null}
      </div>
    </form>
  );
}
