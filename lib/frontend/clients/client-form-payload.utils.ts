import type { TCreateClientPayload, TUpdateClientPayload } from "@/features/clients/clients.api";
import type { TClientCreateFormValues } from "@/components/forms/client-create-form.types";
import { optionalText } from "@/lib/frontend/projects/project-form-payload.utils";
import {
  CLIENT_CONTENT_READY,
  CLIENT_EXISTING_SYSTEMS,
  clientHasExistingSystem,
  type TClientContentReady,
  type TClientExistingSystem,
} from "@/lib/clients/intake-constants";
import type { TClientDetail } from "@/types/client.types";

function isExistingSystem(value: string): value is TClientExistingSystem {
  return (CLIENT_EXISTING_SYSTEMS as readonly string[]).includes(value);
}

function isContentReady(value: string): value is TClientContentReady {
  return (CLIENT_CONTENT_READY as readonly string[]).includes(value);
}

export const EMPTY_CLIENT_FORM_VALUES: TClientCreateFormValues = {
  businessName: "",
  contactPerson: "",
  pocEmail: "",
  pocContactNumber: "",
  businessSummary: "",
  idealCustomerProfile: "",
  projectTypes: [],
  platforms: [],
  projectName: "",
  projectDescription: "",
  successLooksLike: "",
  existingSystem: "",
  websiteUrl: "",
  changeNotes: "",
  launchMustHaves: "",
  laterFeatures: "",
  userRoles: [],
  languages: [],
  rtlRequired: false,
  expectedLaunchDate: "",
  hasFixedDeadline: false,
  contentReady: "",
  requirementsConfirmed: false,
};

export function mapClientDetailToFormValues(client: TClientDetail): TClientCreateFormValues {
  return {
    businessName: client.businessName,
    contactPerson: client.contactPerson,
    pocEmail: client.pocEmail,
    pocContactNumber: client.pocContactNumber,
    businessSummary: client.businessSummary,
    idealCustomerProfile: client.idealCustomerProfile,
    projectTypes: [...client.projectTypes],
    platforms: [...client.platforms],
    projectName: client.projectName,
    projectDescription: client.projectDescription,
    successLooksLike: client.successLooksLike,
    existingSystem: client.existingSystem,
    websiteUrl: client.websiteUrl ?? "",
    changeNotes: client.changeNotes ?? "",
    launchMustHaves: client.launchMustHaves,
    laterFeatures: client.laterFeatures ?? "",
    userRoles: [...client.userRoles],
    languages: [...client.languages],
    rtlRequired: client.rtlRequired,
    expectedLaunchDate: client.expectedLaunchDate ?? "",
    hasFixedDeadline: client.hasFixedDeadline,
    contentReady: client.contentReady,
    requirementsConfirmed: client.requirementsConfirmed,
  };
}

export function toCreateClientPayload(values: TClientCreateFormValues): TCreateClientPayload {
  if (!isExistingSystem(values.existingSystem)) {
    throw new Error("Existing system is required.");
  }
  if (!isContentReady(values.contentReady)) {
    throw new Error("Content readiness is required.");
  }

  const existingSystem = values.existingSystem;
  const hasExisting = clientHasExistingSystem(existingSystem);

  return {
    businessName: values.businessName.trim(),
    contactPerson: values.contactPerson.trim(),
    pocEmail: values.pocEmail.trim(),
    pocContactNumber: values.pocContactNumber.trim(),
    businessSummary: values.businessSummary.trim(),
    idealCustomerProfile: values.idealCustomerProfile.trim(),
    projectTypes: values.projectTypes,
    platforms: values.platforms,
    projectName: values.projectName.trim(),
    projectDescription: values.projectDescription.trim(),
    successLooksLike: values.successLooksLike.trim(),
    existingSystem,
    websiteUrl: hasExisting ? optionalText(values.websiteUrl) : null,
    changeNotes: hasExisting ? optionalText(values.changeNotes) : null,
    launchMustHaves: values.launchMustHaves.trim(),
    laterFeatures: optionalText(values.laterFeatures),
    userRoles: values.userRoles,
    languages: values.languages,
    rtlRequired: values.rtlRequired,
    expectedLaunchDate: optionalText(values.expectedLaunchDate),
    hasFixedDeadline: values.hasFixedDeadline,
    contentReady: values.contentReady,
    requirementsConfirmed: values.requirementsConfirmed,
  };
}

export function toUpdateClientPayload(values: TClientCreateFormValues): TUpdateClientPayload {
  return toCreateClientPayload(values);
}
