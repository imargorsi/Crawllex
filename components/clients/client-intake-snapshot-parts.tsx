"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Icons } from "@/lib/frontend/icons/app-icons";
import { ApiError } from "@/lib/frontend/api/errors";
import { canPreviewClientFile, openClientIntakeFile } from "@/lib/frontend/clients/client-file-open.utils";
import { displayDetailValue, toExternalHref } from "@/lib/frontend/projects/project-detail-display.utils";
import { formatFileSize } from "@/lib/frontend/clients/intake-ui.utils";
import { notify } from "@/lib/frontend/feedback/notify";
import {
  detailIconWellOutlineClass,
  elevatedCardMutedClass,
  elevatedCardTitleClass,
  intakeFloatedChipClass,
  intakeOutlineMarkClass,
  tableRowIconActionClass,
  typeStackMdClass,
} from "@/lib/frontend/layout/dashboard-chrome";
import type { TClientFeature, TClientFilePublic, TClientLink } from "@/types/client.types";
import { cn } from "@/lib/utils";

export function IntakeProse({ value, empty }: { value: string | null | undefined; empty: string }) {
  const trimmed = value?.trim();
  return (
    <p className={cn("type-body whitespace-pre-wrap leading-relaxed", trimmed ? elevatedCardTitleClass : elevatedCardMutedClass)}>
      {displayDetailValue(trimmed, empty)}
    </p>
  );
}

export function IntakeChip({
  icon,
  align = "center",
  action,
  children,
}: {
  icon: ReactNode;
  align?: "center" | "start";
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        intakeFloatedChipClass,
        "flex gap-3 rounded-2xl px-4 py-3.5",
        align === "start" ? "items-start" : "items-center",
      )}
    >
      <span
        className={cn(detailIconWellOutlineClass, "size-9 shrink-0", align === "start" && "mt-0.5")}
        aria-hidden
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
      {action ? <div className="flex shrink-0 items-center gap-1">{action}</div> : null}
    </div>
  );
}

export function IntakeOutlineMark({ n }: { n: number }) {
  return (
    <span className={intakeOutlineMarkClass} aria-hidden>
      {String(n).padStart(2, "0")}
    </span>
  );
}

export function IntakeOutlineGlyph({ children }: { children: ReactNode }) {
  return (
    <span className={cn(intakeOutlineMarkClass, "text-brand dark:text-text-primary")} aria-hidden>
      {children}
    </span>
  );
}

export function IntakeLabeledBlock({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className={typeStackMdClass}>
      <span className={cn("type-caption", elevatedCardMutedClass)}>{label}</span>
      {children}
    </div>
  );
}

export function IntakeOutlineField({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <IntakeOutlineGlyph>{icon}</IntakeOutlineGlyph>
      <div className={cn("min-w-0 flex-1", typeStackMdClass)}>
        <span className={cn("type-caption", elevatedCardMutedClass)}>{label}</span>
        {children}
      </div>
    </div>
  );
}

export function IntakeFeatureRows({
  features,
  empty,
}: {
  features: TClientFeature[];
  empty: string;
}) {
  const { t: tDetail } = useTranslation("translation", { keyPrefix: "modules.clients.detail" });

  if (features.length === 0) {
    return <p className={cn("type-body", elevatedCardMutedClass)}>{tDetail("noFeatures")}</p>;
  }

  return (
    <ul className="space-y-5">
      {features.map((feature, index) => (
        <li key={`${feature.name}-${index}`} className="flex items-start gap-3">
          <IntakeOutlineMark n={index + 1} />
          <div className={cn("min-w-0 flex-1", typeStackMdClass)}>
            <p className={cn("type-body-strong", elevatedCardTitleClass)}>{feature.name}</p>
            <p className={cn("type-body leading-relaxed", elevatedCardMutedClass)}>
              {displayDetailValue(feature.whatItDoes, empty)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function IntakeFileRows({
  files,
  clientId,
}: {
  files: TClientFilePublic[];
  clientId?: string;
}) {
  const { t: tDetail } = useTranslation("translation", { keyPrefix: "modules.clients.detail" });
  const { t: tForm } = useTranslation("translation", { keyPrefix: "modules.clients.createForm" });
  const [busyFileId, setBusyFileId] = useState<string | null>(null);

  if (files.length === 0) {
    return <p className={cn("type-body", elevatedCardMutedClass)}>{tDetail("noFiles")}</p>;
  }

  async function onOpenFile(file: TClientFilePublic, asDownload: boolean) {
    if (!clientId) return;
    setBusyFileId(file.id);
    try {
      await openClientIntakeFile(clientId, file, asDownload);
    } catch (error) {
      notify.error(ApiError.messageFrom(error, tDetail("fileOpenError")));
    } finally {
      setBusyFileId(null);
    }
  }

  return (
    <IntakeLabeledBlock label={tForm("filesLabel")}>
      <ul className="grid gap-3 sm:grid-cols-2">
        {files.map((file) => {
          const FileIcon = file.kind === "image" ? Icons.layout : Icons.file;
          const isBusy = busyFileId === file.id;
          return (
            <li key={file.id}>
              <IntakeChip
                icon={<FileIcon className="size-4" />}
                action={
                  clientId ? (
                    <>
                      {canPreviewClientFile(file) ? (
                        <button
                          type="button"
                          className={tableRowIconActionClass}
                          disabled={isBusy}
                          aria-label={tDetail("viewFile")}
                          onClick={() => void onOpenFile(file, false)}
                        >
                          <Icons.view className="size-4" />
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className={tableRowIconActionClass}
                        disabled={isBusy}
                        aria-label={tDetail("downloadFile")}
                        onClick={() => void onOpenFile(file, true)}
                      >
                        <Icons.cloudDownload className="size-4" />
                      </button>
                    </>
                  ) : null
                }
              >
                <div className={typeStackMdClass}>
                  <p className={cn("type-body-strong truncate", elevatedCardTitleClass)} title={file.originalName}>
                    {file.originalName}
                  </p>
                  <p className={cn("type-caption", elevatedCardMutedClass)}>
                    {tDetail(file.kind === "image" ? "fileKindImage" : "fileKindDocument")}
                    <span aria-hidden> · </span>
                    {formatFileSize(file.sizeBytes)}
                  </p>
                </div>
              </IntakeChip>
            </li>
          );
        })}
      </ul>
    </IntakeLabeledBlock>
  );
}

export function IntakeLinkRows({ links }: { links: TClientLink[] }) {
  const { t: tDetail } = useTranslation("translation", { keyPrefix: "modules.clients.detail" });
  const { t: tForm } = useTranslation("translation", { keyPrefix: "modules.clients.createForm" });

  if (links.length === 0) {
    return <p className={cn("type-body", elevatedCardMutedClass)}>{tDetail("noLinks")}</p>;
  }

  return (
    <IntakeLabeledBlock label={tForm("linksLabel")}>
      <ul className="space-y-5">
        {links.map((link, index) => (
          <li key={`${link.linkName}-${index}`} className="flex items-start gap-3">
            <IntakeOutlineMark n={index + 1} />
            <div className={cn("min-w-0 flex-1", typeStackMdClass)}>
              <p className={cn("type-body-strong", elevatedCardTitleClass)}>{link.linkName}</p>
              <a
                href={toExternalHref(link.url)}
                target="_blank"
                rel="noopener noreferrer"
                className="type-body break-all text-text-secondary underline-offset-2 hover:text-text-primary hover:underline"
              >
                {link.url}
              </a>
            </div>
          </li>
        ))}
      </ul>
    </IntakeLabeledBlock>
  );
}
