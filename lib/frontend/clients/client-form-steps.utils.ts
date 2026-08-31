import type { TClientCreateFormValues } from "@/components/forms/client-create-form.types";

export const CLIENT_FORM_STEP_LABEL_KEYS = [
  "stepCompany",
  "stepBlueprint",
  "stepFeatures",
  "stepAssets",
  "stepLaunch",
] as const;

export function clientFormFieldStepIndex(): Record<keyof TClientCreateFormValues, number> {
  return {
    businessName: 0,
    contactPerson: 0,
    pocEmail: 0,
    pocContactNumber: 0,
    businessSummary: 0,
    idealCustomerProfile: 0,
    projectDescription: 1,
    projectTypes: 1,
    projectTypeOther: 1,
    websiteFocus: 1,
    mobilePlatforms: 1,
    webAppTypes: 1,
    webAppTypeOther: 1,
    features: 2,
    integrations: 2,
    integrationOther: 2,
    links: 3,
    expectedLaunchDate: 4,
    launchMustHaves: 4,
    notes: 4,
    requirementsConfirmed: 4,
  };
}

/** Multipart keys that are not React Hook Form fields. */
const CLIENT_FORM_MULTIPART_ERROR_STEP: Record<string, number> = {
  company_logo: 0,
  assets: 3,
};

export function clientFormErrorStep(fieldKey: string): number | undefined {
  const flat = fieldKey.includes(".") ? (fieldKey.split(".").at(-1) ?? fieldKey) : fieldKey;
  if (flat in CLIENT_FORM_MULTIPART_ERROR_STEP) {
    return CLIENT_FORM_MULTIPART_ERROR_STEP[flat];
  }
  const indexMap = clientFormFieldStepIndex();
  if (flat in indexMap) {
    return indexMap[flat as keyof TClientCreateFormValues];
  }
  return undefined;
}

export function earliestClientFormErrorStep(fieldKeys: string[]): number | undefined {
  let earliest: number | undefined;
  for (const key of fieldKeys) {
    const step = clientFormErrorStep(key);
    if (step == null) continue;
    earliest = earliest == null ? step : Math.min(earliest, step);
  }
  return earliest;
}

export function clientFormStepFields(): Array<Array<keyof TClientCreateFormValues>> {
  return [
    ["businessName", "contactPerson", "pocEmail", "pocContactNumber", "businessSummary", "idealCustomerProfile"],
    [
      "projectDescription",
      "projectTypes",
      "projectTypeOther",
      "websiteFocus",
      "mobilePlatforms",
      "webAppTypes",
      "webAppTypeOther",
    ],
    ["features", "integrations", "integrationOther"],
    ["links"],
    ["expectedLaunchDate", "launchMustHaves", "notes", "requirementsConfirmed"],
  ];
}
