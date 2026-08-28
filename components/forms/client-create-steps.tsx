"use client";

import type { TUseClientCreateFormResult } from "@/components/forms/hooks/use-client-create-form.hook";
import { ClientCreateStepClient } from "@/components/forms/client-create-step-client";
import { ClientCreateStepDelivery } from "@/components/forms/client-create-step-delivery";
import { ClientCreateStepGoals } from "@/components/forms/client-create-step-goals";
import { ClientCreateStepProject } from "@/components/forms/client-create-step-project";
import { ClientCreateStepScope } from "@/components/forms/client-create-step-scope";

type TStepProps = {
  hook: TUseClientCreateFormResult;
};

export function ClientCreateStepContent({ hook }: TStepProps) {
  const { currentStep } = hook;

  if (currentStep === 0) return <ClientCreateStepClient hook={hook} />;
  if (currentStep === 1) return <ClientCreateStepProject hook={hook} />;
  if (currentStep === 2) return <ClientCreateStepGoals hook={hook} />;
  if (currentStep === 3) return <ClientCreateStepScope hook={hook} />;
  if (currentStep === 4) return <ClientCreateStepDelivery hook={hook} />;

  return null;
}
