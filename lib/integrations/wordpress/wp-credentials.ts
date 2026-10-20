import { decryptSecret, encryptSecret } from "@/lib/crypto/secret-box";
import { LeadSource, type LeadSourceDocument } from "@/models";

export type TWpCredentialsInput = {
  username: string;
  applicationPassword: string;
  applicationPasswordUuid: string;
};

/** Store the plugin-created WordPress application password, encrypted. Replaces any previous one. */
export async function storeLeadSourceWpCredentials(
  source: LeadSourceDocument,
  input: TWpCredentialsInput
): Promise<void> {
  await LeadSource.updateOne(
    { _id: source._id },
    {
      $set: {
        wpUsername: input.username,
        wpAppPasswordUuid: input.applicationPasswordUuid,
        wpAppPasswordCiphertext: encryptSecret(input.applicationPassword),
        wpCredentialsUpdatedAt: new Date(),
      },
    }
  );
}

/** Decrypt the stored WordPress application password. Server-only; never send to clients. */
export function readLeadSourceWpPassword(source: LeadSourceDocument): string | null {
  return source.wpAppPasswordCiphertext ? decryptSecret(source.wpAppPasswordCiphertext) : null;
}

/** True when Crawllex can push drafts to this source: connected, with a site URL and stored credentials. */
export function canPushWpDrafts(source: LeadSourceDocument): boolean {
  return (
    source.status === "connected" &&
    Boolean(source.siteUrl && source.wpUsername && source.wpAppPasswordCiphertext)
  );
}
