import {
  CLIENT_DOC_MAX_BYTES,
  CLIENT_IMAGE_MAX_BYTES,
  type TClientFileKind,
} from "@/lib/clients/intake-constants";

const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif"]);
const DOC_EXTENSIONS = new Set(["pdf", "docx"]);

function fileExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  if (dot < 0) return "";
  return name.slice(dot + 1).toLowerCase();
}

export function classifyClientFile(file: { name: string; type: string }): TClientFileKind | null {
  const ext = fileExtension(file.name);
  const mime = file.type.toLowerCase();

  if (mime.startsWith("image/") || IMAGE_EXTENSIONS.has(ext)) {
    if (mime === "image/svg+xml" || ext === "svg") return null;
    return "image";
  }

  if (
    mime === "application/pdf" ||
    mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    DOC_EXTENSIONS.has(ext)
  ) {
    return "document";
  }

  return null;
}

export function clientFileMaxBytes(kind: TClientFileKind): number {
  return kind === "image" ? CLIENT_IMAGE_MAX_BYTES : CLIENT_DOC_MAX_BYTES;
}

export function clientFileExtension(file: { name: string; type: string }): string | null {
  const ext = fileExtension(file.name);
  if (IMAGE_EXTENSIONS.has(ext)) return ext === "jpeg" ? "jpg" : ext;
  if (DOC_EXTENSIONS.has(ext)) return ext;
  if (file.type === "application/pdf") return "pdf";
  if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return "docx";
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/gif") return "gif";
  return null;
}
