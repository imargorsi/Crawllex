"use client";

import { useRef, useState, type DragEvent } from "react";

import { Button } from "@/components/ui/button";
import { Icons } from "@/lib/frontend/icons/app-icons";
import {
  INTAKE_FILE_ACCEPT,
  INTAKE_MAX_FILES,
  INTAKE_CLIENT_MAX_BYTES,
} from "@/lib/frontend/clients/intake-ui.constants";
import {
  classifyIntakeAsset,
  formatFileSize,
  intakeAssetMaxBytes,
} from "@/lib/frontend/clients/intake-ui.utils";
import { intakeFillSurfaceClass } from "@/lib/frontend/layout/dashboard-chrome";
import { notify } from "@/lib/frontend/feedback/notify";
import { cn } from "@/lib/utils";

type TClientIntakeFileDropzoneProps = {
  files: File[];
  onFilesChange: (files: File[]) => void;
  help: string;
  browseLabel: string;
  removeLabel: string;
  typeError: string;
  imageSizeError: string;
  docSizeError: string;
  maxCountError: string;
  maxTotalError: string;
  occupiedCount?: number;
  occupiedBytes?: number;
};

export function ClientIntakeFileDropzone({
  files,
  onFilesChange,
  help,
  browseLabel,
  removeLabel,
  typeError,
  imageSizeError,
  docSizeError,
  maxCountError,
  maxTotalError,
  occupiedCount = 0,
  occupiedBytes = 0,
}: TClientIntakeFileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function addFiles(incoming: File[]) {
    if (incoming.length === 0) return;

    const remaining = INTAKE_MAX_FILES - files.length - occupiedCount;
    if (remaining <= 0) {
      notify.error(maxCountError);
      return;
    }

    const currentTotal = occupiedBytes + files.reduce((sum, file) => sum + file.size, 0);

    const accepted: File[] = [];
    for (const file of incoming.slice(0, remaining)) {
      const kind = classifyIntakeAsset(file);
      if (!kind) {
        notify.error(typeError);
        continue;
      }
      if (file.size > intakeAssetMaxBytes(kind)) {
        notify.error(kind === "image" ? imageSizeError : docSizeError);
        continue;
      }
      const nextTotal = currentTotal + accepted.reduce((sum, item) => sum + item.size, 0) + file.size;
      if (nextTotal > INTAKE_CLIENT_MAX_BYTES) {
        notify.error(maxTotalError);
        continue;
      }
      accepted.push(file);
    }

    if (incoming.length > remaining) {
      notify.error(maxCountError);
    }

    if (accepted.length === 0) return;
    onFilesChange([...files, ...accepted]);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    addFiles(Array.from(event.dataTransfer.files));
  }

  function removeAt(index: number) {
    onFilesChange(files.filter((_, fileIndex) => fileIndex !== index));
  }

  return (
    <div>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        role="group"
        aria-label={help}
        className={cn(
          "rounded-2xl border border-border bg-transparent p-6 text-center transition-colors",
          isDragging && "border-brand bg-bg-selected",
        )}
      >
        <div className="flex flex-col items-center gap-3">
          <span className="inline-flex size-11 items-center justify-center rounded-full bg-text-primary/10 text-text-primary" aria-hidden>
            <Icons.cloudUpload className="size-5" />
          </span>
          <p className="type-caption text-text-muted">{help}</p>
          <Button type="button" variant="outlined" size="small" onClick={() => inputRef.current?.click()}>
            {browseLabel}
          </Button>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={INTAKE_FILE_ACCEPT}
          className="sr-only"
          tabIndex={-1}
          onChange={(event) => {
            addFiles(Array.from(event.target.files ?? []));
            event.target.value = "";
          }}
        />
      </div>
      {files.length > 0 ? (
        <ul className="mt-4 space-y-3">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${file.size}-${index}`}
              className={cn(intakeFillSurfaceClass, "flex items-center gap-3 rounded-xl px-4 py-3")}
            >
              <Icons.file className="size-4 shrink-0 text-text-muted" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="type-body-strong truncate text-text-primary">{file.name}</p>
                <p className="type-caption text-text-muted">{formatFileSize(file.size)}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`${removeLabel} ${file.name}`}
                onClick={() => removeAt(index)}
              >
                <Icons.delete className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
