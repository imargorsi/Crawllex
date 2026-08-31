import { ApiError } from "@/lib/frontend/api/errors";
import { getAccessToken } from "@/lib/frontend/auth/session";
import type { TClientFilePublic } from "@/types/client.types";

export function canPreviewClientFile(file: TClientFilePublic): boolean {
  if (file.kind === "image") return true;
  return file.originalName.toLowerCase().endsWith(".pdf");
}

export async function openClientIntakeFile(
  clientId: string,
  file: TClientFilePublic,
  asDownload: boolean,
): Promise<void> {
  const token = getAccessToken();
  const query = asDownload ? "?download=1" : "";
  const response = await fetch(`/api/v1/clients/${clientId}/files/${file.id}${query}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(
      typeof body === "object" && body && "message" in body && typeof body.message === "string"
        ? body.message
        : "Could not open this file.",
      response.status,
    );
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);

  if (asDownload || !canPreviewClientFile(file)) {
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = file.originalName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
    return;
  }

  const opened = window.open(objectUrl, "_blank", "noopener,noreferrer");
  if (!opened) {
    URL.revokeObjectURL(objectUrl);
    throw new Error("Could not open this file.");
  }
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}
