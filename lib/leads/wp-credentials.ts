import { LeadSource, type LeadSourceDocument } from "@/models";
import { decryptLeadSourceKey, encryptLeadSourceKey } from "@/lib/leads/lead-source-key";

export type TWpCredentialsInput = {
  username: string;
  applicationPassword: string;
  applicationPasswordUuid: string;
};

/** Store the plugin-created WordPress application password, encrypted. Replaces any previous one. */
export async function storeLeadSourceWpCredentials(
  source: LeadSourceDocument,
  input: TWpCredentialsInput,
): Promise<void> {
  const now = new Date();
  await LeadSource.updateOne(
    { _id: source._id },
    {
      $set: {
        wpUsername: input.username,
        wpAppPasswordUuid: input.applicationPasswordUuid,
        wpAppPasswordCiphertext: encryptLeadSourceKey(input.applicationPassword),
        wpCredentialsUpdatedAt: now,
      },
    },
  );
}

/** Decrypt the stored WordPress application password. Server-only; never send to clients. */
export function readLeadSourceWpPassword(source: LeadSourceDocument): string | null {
  return source.wpAppPasswordCiphertext ? decryptLeadSourceKey(source.wpAppPasswordCiphertext) : null;
}
