import crypto from "crypto";

import { ValidationError } from "@/lib/api/http-errors";
import {
  classifyClientFile,
  clientFileExtension,
  clientFileMaxBytes,
} from "@/lib/clients/client-file.utils";
import {
  CLIENT_FILES_MAX_BYTES,
  CLIENT_MAX_FILES,
  type TClientFileKind,
} from "@/lib/clients/intake-constants";
import { assertR2Configured, deleteR2Object, getR2Object, putR2Object } from "@/lib/storage/r2-client";
import type { ClientDocument } from "@/models/Client";

export type TClientStoredFile = {
  id: string;
  originalName: string;
  mime: string;
  sizeBytes: number;
  kind: TClientFileKind;
  blob: string;
  uploadedAt: Date;
};

function toStoredFile(file: TClientStoredFile): TClientStoredFile {
  return {
    id: file.id,
    originalName: file.originalName,
    mime: file.mime,
    sizeBytes: file.sizeBytes,
    kind: file.kind,
    blob: file.blob,
    uploadedAt: file.uploadedAt,
  };
}

export function clientFileBlobPathname(blob: string | null | undefined): string | null {
  if (!blob?.startsWith("blob:")) return null;
  return blob.slice("blob:".length);
}

export function clientFilePrefix(clientId: string, kind: TClientFileKind): string {
  return kind === "image" ? `client-gallery/${clientId}` : `client-docs/${clientId}`;
}

export function validateClientIntakeFile(file: File): string | null {
  if (file.size <= 0) {
    return "The file did not upload.";
  }

  const kind = classifyClientFile(file);
  if (!kind) {
    return "Use a JPG, PNG, WEBP, GIF, PDF, or DOCX file.";
  }

  if (file.size > clientFileMaxBytes(kind)) {
    return kind === "image"
      ? "Images must be 5 MB or smaller."
      : "Documents must be 15 MB or smaller.";
  }

  return null;
}

export function assertClientFileQuota(existing: TClientStoredFile[], incoming: File[]): void {
  if (existing.length + incoming.length > CLIENT_MAX_FILES) {
    throw ValidationError.fromFieldErrors({
      assets: ["You can upload up to 10 files."],
    });
  }

  const existingBytes = existing.reduce((sum, file) => sum + file.sizeBytes, 0);
  const incomingBytes = incoming.reduce((sum, file) => sum + file.size, 0);
  if (existingBytes + incomingBytes > CLIENT_FILES_MAX_BYTES) {
    throw ValidationError.fromFieldErrors({
      assets: ["This client has reached the 100 MB storage limit."],
    });
  }
}

export async function storeClientIntakeFile(
  clientId: string,
  file: File,
  kind: TClientFileKind,
): Promise<TClientStoredFile> {
  assertR2Configured();

  const extension = clientFileExtension(file);
  if (!extension) {
    throw new Error("Unsupported file type.");
  }

  const filename = `${crypto.randomUUID()}.${extension}`;
  const pathname = `${clientFilePrefix(clientId, kind)}/${filename}`;
  await putR2Object(pathname, file, file.type || "application/octet-stream");

  return {
    id: crypto.randomUUID(),
    originalName: file.name,
    mime: file.type || "application/octet-stream",
    sizeBytes: file.size,
    kind,
    blob: `blob:${pathname}`,
    uploadedAt: new Date(),
  };
}

export async function deleteStoredClientFile(blob: string | null | undefined): Promise<void> {
  const pathname = clientFileBlobPathname(blob);
  if (!pathname) return;
  await deleteR2Object(pathname).catch(() => undefined);
}

export async function deleteStoredClientFiles(files: TClientStoredFile[]): Promise<void> {
  await Promise.all(files.map((file) => deleteStoredClientFile(file.blob)));
}

export function retainedClientFiles(
  current: TClientStoredFile[],
  retainedFileIds?: string[],
): TClientStoredFile[] {
  if (retainedFileIds === undefined) return [...current];
  return current.filter((file) => retainedFileIds.includes(file.id));
}

export function assertClientIntakeFilesReady(
  current: TClientStoredFile[],
  incoming: File[],
  retainedFileIds?: string[],
): TClientStoredFile[] {
  const retained = retainedClientFiles(current, retainedFileIds);
  for (const file of incoming) {
    const message = validateClientIntakeFile(file);
    if (message) {
      throw ValidationError.fromFieldErrors({ assets: [message] });
    }
  }
  assertClientFileQuota(retained, incoming);
  return retained;
}

export async function persistClientIntakeFiles(
  client: ClientDocument,
  incoming: File[],
  retainedFileIds?: string[],
): Promise<void> {
  const current = [...(client.files ?? [])];
  const retained = assertClientIntakeFilesReady(current, incoming, retainedFileIds);
  const removed = current.filter((file) => !retained.some((item) => item.id === file.id));

  const stored: TClientStoredFile[] = [];
  try {
    for (const file of incoming) {
      const kind = classifyClientFile(file);
      if (!kind) continue;
      stored.push(await storeClientIntakeFile(client._id.toString(), file, kind));
    }

    client.set(
      "files",
      [...retained, ...stored].map((file) => toStoredFile(file)),
    );
    await client.save();
  } catch (error) {
    await deleteStoredClientFiles(stored).catch(() => undefined);
    throw error;
  }

  await deleteStoredClientFiles(removed);
}

function contentDispositionFilename(originalName: string): string {
  return originalName.replace(/[\r\n"]/g, "_");
}

export function canPreviewClientFile(file: { originalName: string; mime?: string; kind: TClientFileKind }): boolean {
  if (file.kind === "image") return true;
  const name = file.originalName.toLowerCase();
  const mime = file.mime?.toLowerCase() ?? "";
  return mime === "application/pdf" || name.endsWith(".pdf");
}

export async function readClientIntakeFile(
  client: ClientDocument,
  fileId: string,
): Promise<{
  originalName: string;
  mime: string;
  kind: TClientFileKind;
  stream: ReadableStream;
  contentType: string;
} | null> {
  const file = (client.files ?? []).find((item) => item.id === fileId);
  if (!file) return null;

  const pathname = clientFileBlobPathname(file.blob);
  if (!pathname) return null;

  const object = await getR2Object(pathname);
  if (!object) return null;

  return {
    originalName: file.originalName,
    mime: file.mime,
    kind: file.kind,
    stream: object.stream,
    contentType: object.contentType || file.mime || "application/octet-stream",
  };
}

export function clientFileContentDisposition(originalName: string, asDownload: boolean): string {
  const filename = contentDispositionFilename(originalName);
  const type = asDownload ? "attachment" : "inline";
  return `${type}; filename="${filename}"`;
}
