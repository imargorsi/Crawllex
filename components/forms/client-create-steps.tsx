"use client";

import type { TUseClientCreateFormResult } from "@/components/forms/hooks/use-client-create-form.hook";
import { ClientCreateStepAssets } from "@/components/forms/client-create-step-assets";
import { ClientCreateStepBlueprint } from "@/components/forms/client-create-step-blueprint";
import { ClientCreateStepCompany } from "@/components/forms/client-create-step-company";
import { ClientCreateStepFeatures } from "@/components/forms/client-create-step-features";
import { ClientCreateStepLaunch } from "@/components/forms/client-create-step-launch";

type TStepProps = {
  hook: TUseClientCreateFormResult;
};

export function ClientCreateStepContent({ hook }: TStepProps) {
  const { currentStep } = hook;

  if (currentStep === 0) return <ClientCreateStepCompany hook={hook} />;
  if (currentStep === 1) return <ClientCreateStepBlueprint hook={hook} />;
  if (currentStep === 2) return <ClientCreateStepFeatures hook={hook} />;
  if (currentStep === 3) return <ClientCreateStepAssets hook={hook} />;
  if (currentStep === 4) return <ClientCreateStepLaunch hook={hook} />;

  return null;
}
