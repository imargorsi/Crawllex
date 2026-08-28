import { ValidationError } from "@/lib/api/http-errors";
import type { AuthContext } from "@/lib/auth/guards";
import { storeClientLogoFile, validateClientLogoFile } from "@/lib/clients/client-logo-storage";
import { updateClientSchema, type UpdateClientInput } from "@/schemas/client";

export type UpdateClientRequest = {
  input: UpdateClientInput;
  presentFields: Set<string>;
  logoFile: File | null;
};

function parseUpdateClientBody(raw: unknown): { input: UpdateClientInput; presentFields: Set<string> } {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw ValidationError.fromFieldErrors({
      _: ["Client data must be a valid object."],
    });
  }

  const record = raw as Record<string, unknown>;
  const presentFields = new Set(Object.keys(record));
  const input = updateClientSchema.parse(record);

  return { input, presentFields };
}

export async function parseUpdateClientRequest(request: Request): Promise<UpdateClientRequest> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const dataField = formData.get("data");
    const logoField = formData.get("company_logo");
    const logoFile = logoField instanceof File && logoField.size > 0 ? logoField : null;

    if (dataField == null || (typeof dataField === "string" && !dataField.trim())) {
      if (!logoFile) {
        throw ValidationError.fromFieldErrors({
          _: ["At least one field must be provided."],
        });
      }

      return {
        input: {},
        presentFields: new Set<string>(),
        logoFile,
      };
    }

    if (typeof dataField !== "string") {
      throw ValidationError.fromFieldErrors({
        data: ["Client data must be valid JSON."],
      });
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(dataField);
    } catch {
      throw ValidationError.fromFieldErrors({
        data: ["Client data must be valid JSON."],
      });
    }

    const { input, presentFields } = parseUpdateClientBody(parsed);

    if (presentFields.size === 0 && !logoFile) {
      throw ValidationError.fromFieldErrors({
        _: ["At least one field must be provided."],
      });
    }

    return { input, presentFields, logoFile };
  }

  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    throw ValidationError.fromFieldErrors({
      _: ["Request body must be valid JSON."],
    });
  }

  const { input, presentFields } = parseUpdateClientBody(parsed);

  if (presentFields.size === 0) {
    throw ValidationError.fromFieldErrors({
      _: ["At least one field must be provided."],
    });
  }

  return { input, presentFields, logoFile: null };
}

export async function resolveClientLogoUpdate(
  auth: AuthContext,
  logoFile: File | null,
): Promise<string | null> {
  if (!logoFile) return null;

  const validationMessage = validateClientLogoFile(logoFile);
  if (validationMessage) {
    throw ValidationError.fromFieldErrors({
      company_logo: [validationMessage],
    });
  }

  try {
    return await storeClientLogoFile(auth.user._id.toString(), logoFile);
  } catch (error) {
    console.error("Client Logo Upload Failed", error);
    throw ValidationError.fromFieldErrors({
      company_logo: ["Client logo upload is currently unavailable on this deployment."],
    });
  }
}
