import { ValidationError } from "@/lib/api/http-errors";
import type { AuthContext } from "@/lib/auth/guards";
import { assertClientFileQuota, validateClientIntakeFile } from "@/lib/clients/client-file-storage";
import { storeClientLogoFile, validateClientLogoFile } from "@/lib/clients/client-logo-storage";
import { createClientSchema, type CreateClientInput } from "@/schemas/client";

export type CreateClientRequest = {
  input: CreateClientInput;
  logoFile: File | null;
  assetFiles: File[];
};

function collectAssetFiles(formData: FormData): File[] {
  return formData
    .getAll("assets")
    .filter((value): value is File => value instanceof File && value.size > 0);
}

function assertAssetFiles(files: File[]): void {
  for (const file of files) {
    const message = validateClientIntakeFile(file);
    if (message) {
      throw ValidationError.fromFieldErrors({ assets: [message] });
    }
  }
  assertClientFileQuota([], files);
}

export async function parseCreateClientRequest(request: Request): Promise<CreateClientRequest> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const dataField = formData.get("data");
    const logoField = formData.get("company_logo");
    const assetFiles = collectAssetFiles(formData);

    if (typeof dataField !== "string" || !dataField.trim()) {
      throw ValidationError.fromFieldErrors({
        data: ["Client data is required."],
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

    const input = createClientSchema.parse(parsed);
    const logoFile = logoField instanceof File && logoField.size > 0 ? logoField : null;
    assertAssetFiles(assetFiles);

    return { input, logoFile, assetFiles };
  }

  const body = createClientSchema.parse(await request.json());
  return { input: body, logoFile: null, assetFiles: [] };
}

export async function resolveClientLogo(
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
