"use client";

import type { TUseClientCreateFormResult } from "@/components/forms/hooks/use-client-create-form.hook";
import { ClientCreateStepBusiness } from "@/components/forms/client-create-step-business";
import { ClientCreateStepDetails } from "@/components/forms/client-create-step-details";
import { ClientCreateStepSeo } from "@/components/forms/client-create-step-seo";

type StepProps = {
  hook: TUseClientCreateFormResult;
};

export function ClientCreateStepContent({ hook }: StepProps) {
  const { currentStep } = hook;

  if (currentStep === 0) return <ClientCreateStepBusiness hook={hook} />;
  if (currentStep === 1) return <ClientCreateStepDetails hook={hook} />;
  if (currentStep === 2) return <ClientCreateStepSeo hook={hook} />;

  return null;
}
