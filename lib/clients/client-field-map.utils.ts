import type { CreateClientInput, UpdateClientInput } from "@/schemas/client";
import { clientHasExistingSystem } from "@/lib/clients/intake-constants";

function emptyToNull(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export function mapCreateClientFields(input: CreateClientInput) {
  const websiteUrl = clientHasExistingSystem(input.existingSystem) ? (input.websiteUrl ?? null) : null;

  return {
    businessName: input.businessName.trim(),
    contactPerson: input.contactPerson.trim(),
    pocEmail: input.pocEmail.toLowerCase(),
    pocContactNumber: input.pocContactNumber.trim(),
    businessSummary: input.businessSummary.trim(),
    idealCustomerProfile: input.idealCustomerProfile.trim(),
    projectTypes: input.projectTypes,
    platforms: input.platforms ?? [],
    projectName: input.projectName.trim(),
    projectDescription: input.projectDescription.trim(),
    successLooksLike: input.successLooksLike.trim(),
    existingSystem: input.existingSystem,
    websiteUrl,
    changeNotes: clientHasExistingSystem(input.existingSystem) ? emptyToNull(input.changeNotes) : null,
    launchMustHaves: input.launchMustHaves.trim(),
    laterFeatures: emptyToNull(input.laterFeatures),
    userRoles: input.userRoles,
    languages: input.languages,
    rtlRequired: input.rtlRequired,
    expectedLaunchDate: emptyToNull(input.expectedLaunchDate),
    hasFixedDeadline: input.hasFixedDeadline,
    contentReady: input.contentReady,
    requirementsConfirmed: input.requirementsConfirmed,
  };
}

export function mapUpdateClientFields(
  input: UpdateClientInput,
  presentFields: ReadonlySet<string>,
): Record<string, unknown> {
  const update: Record<string, unknown> = {};

  if (presentFields.has("businessName") && input.businessName !== undefined) {
    update.businessName = input.businessName.trim();
  }
  if (presentFields.has("contactPerson") && input.contactPerson !== undefined) {
    update.contactPerson = input.contactPerson.trim();
  }
  if (presentFields.has("pocEmail") && input.pocEmail !== undefined) {
    update.pocEmail = input.pocEmail.toLowerCase();
  }
  if (presentFields.has("pocContactNumber") && input.pocContactNumber !== undefined) {
    update.pocContactNumber = input.pocContactNumber.trim();
  }
  if (presentFields.has("businessSummary") && input.businessSummary !== undefined) {
    update.businessSummary = input.businessSummary.trim();
  }
  if (presentFields.has("idealCustomerProfile") && input.idealCustomerProfile !== undefined) {
    update.idealCustomerProfile = input.idealCustomerProfile.trim();
  }
  if (presentFields.has("projectTypes") && input.projectTypes !== undefined) {
    update.projectTypes = input.projectTypes;
  }
  if (presentFields.has("platforms") && input.platforms !== undefined) {
    update.platforms = input.platforms;
  }
  if (presentFields.has("projectName") && input.projectName !== undefined) {
    update.projectName = input.projectName.trim();
  }
  if (presentFields.has("projectDescription") && input.projectDescription !== undefined) {
    update.projectDescription = input.projectDescription.trim();
  }
  if (presentFields.has("successLooksLike") && input.successLooksLike !== undefined) {
    update.successLooksLike = input.successLooksLike.trim();
  }
  if (presentFields.has("existingSystem") && input.existingSystem !== undefined) {
    update.existingSystem = input.existingSystem;
    if (!clientHasExistingSystem(input.existingSystem)) {
      update.websiteUrl = null;
      update.changeNotes = null;
    }
  }
  if (presentFields.has("websiteUrl") && !("websiteUrl" in update)) {
    update.websiteUrl = emptyToNull(input.websiteUrl);
  }
  if (presentFields.has("changeNotes") && !("changeNotes" in update)) {
    update.changeNotes = emptyToNull(input.changeNotes);
  }
  if (presentFields.has("launchMustHaves") && input.launchMustHaves !== undefined) {
    update.launchMustHaves = input.launchMustHaves.trim();
  }
  if (presentFields.has("laterFeatures")) {
    update.laterFeatures = emptyToNull(input.laterFeatures);
  }
  if (presentFields.has("userRoles") && input.userRoles !== undefined) {
    update.userRoles = input.userRoles;
  }
  if (presentFields.has("languages") && input.languages !== undefined) {
    update.languages = input.languages;
  }
  if (presentFields.has("rtlRequired") && input.rtlRequired !== undefined) {
    update.rtlRequired = input.rtlRequired;
  }
  if (presentFields.has("expectedLaunchDate")) {
    update.expectedLaunchDate = emptyToNull(input.expectedLaunchDate);
  }
  if (presentFields.has("hasFixedDeadline") && input.hasFixedDeadline !== undefined) {
    update.hasFixedDeadline = input.hasFixedDeadline;
  }
  if (presentFields.has("contentReady") && input.contentReady !== undefined) {
    update.contentReady = input.contentReady;
  }
  if (presentFields.has("requirementsConfirmed") && input.requirementsConfirmed !== undefined) {
    update.requirementsConfirmed = input.requirementsConfirmed;
  }

  return update;
}
