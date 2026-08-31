"use client";

import { Button } from "@/components/ui/button";
import { ClientIntakeFileDropzone } from "@/components/forms/client-intake-file-dropzone";
import { Input } from "@/components/input";
import type { TUseClientCreateFormResult } from "@/components/forms/hooks/use-client-create-form.hook";
import { Icons } from "@/lib/frontend/icons/app-icons";
import { INTAKE_MAX_LINKS, INTAKE_OTHER_MAX } from "@/lib/frontend/clients/intake-ui.constants";
import { fieldStartIcons } from "@/lib/frontend/forms/input-start-icons";
import { formatFileSize } from "@/lib/frontend/clients/intake-ui.utils";
import { intakeFillSurfaceClass, typeStackMdClass } from "@/lib/frontend/layout/dashboard-chrome";
import { WEBSITE_URL_PATTERN } from "@/lib/projects/website-url.utils";
import { cn } from "@/lib/utils";

type TClientCreateStepAssetsProps = {
  hook: TUseClientCreateFormResult;
};

export function ClientCreateStepAssets({ hook }: TClientCreateStepAssetsProps) {
  const {
    t,
    form: {
      register,
      formState: { errors },
    },
    assetFiles,
    setAssetFiles,
    storedFiles,
    setStoredFiles,
    linkArray,
    addLink,
  } = hook;

  return (
    <div className="space-y-12">
      <div className="space-y-4">
      <ClientIntakeFileDropzone
        files={assetFiles}
        onFilesChange={setAssetFiles}
        help={t("documentsHelp")}
        browseLabel={t("documentsBrowse")}
        removeLabel={t("removeFile")}
        typeError={t("valFileType")}
        imageSizeError={t("valFileSizeImage")}
        docSizeError={t("valFileSizeDoc")}
        maxCountError={t("valFileMax")}
        maxTotalError={t("valFileSizeClient")}
        occupiedCount={storedFiles.length}
        occupiedBytes={storedFiles.reduce((sum, file) => sum + file.sizeBytes, 0)}
      />
      {storedFiles.length > 0 ? (
        <ul className="space-y-3">
          {storedFiles.map((file) => (
            <li
              key={file.id}
              className={cn(intakeFillSurfaceClass, "flex items-center gap-3 rounded-xl px-4 py-3")}
            >
              <Icons.file className="size-4 shrink-0 text-text-muted" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="type-body-strong truncate text-text-primary">{file.originalName}</p>
                <p className="type-caption text-text-muted">{formatFileSize(file.sizeBytes)}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`${t("removeFile")} ${file.originalName}`}
                onClick={() => setStoredFiles(storedFiles.filter((item) => item.id !== file.id))}
              >
                <Icons.delete className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
      </div>

      <div className="space-y-6">
        <div className={typeStackMdClass}>
          <span className="block type-label text-text-primary">{t("linksLabel")}</span>
          <p className="type-caption text-text-muted">{t("linksHelp")}</p>
        </div>
        {linkArray.fields.map((field, index) => (
          <div
            key={field.id}
            className={cn(intakeFillSurfaceClass, "flex items-start gap-3 rounded-2xl p-5 sm:p-6")}
          >
            <div className="grid min-w-0 flex-1 gap-6 sm:grid-cols-2">
              <Input
                id={`links.${index}.linkName`}
                label={t("linkName")}
                placeholder={t("linkNamePh")}
                required
                maxLength={INTAKE_OTHER_MAX}
                startIcon={fieldStartIcons.tag}
                error={errors.links?.[index]?.linkName?.message}
                {...register(`links.${index}.linkName` as const, {
                  required: t("valRequired"),
                  minLength: { value: 2, message: t("valMin") },
                })}
              />
              <Input
                id={`links.${index}.url`}
                type="url"
                label={t("linkUrl")}
                placeholder={t("linkUrlPh")}
                required
                startIcon={fieldStartIcons.link}
                error={errors.links?.[index]?.url?.message}
                {...register(`links.${index}.url` as const, {
                  required: t("valRequired"),
                  validate: (value) => WEBSITE_URL_PATTERN.test(value.trim()) || t("valUrl"),
                })}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="mt-7 shrink-0"
              aria-label={t("removeLink")}
              onClick={() => linkArray.remove(index)}
            >
              <Icons.delete className="size-4" />
            </Button>
          </div>
        ))}
        {errors.links?.message ? (
          <p className="type-caption text-status-rejected">{errors.links.message}</p>
        ) : null}
        <Button
          type="button"
          variant="outlined"
          size="small"
          disabled={linkArray.fields.length >= INTAKE_MAX_LINKS}
          onClick={addLink}
        >
          <Icons.add className="size-4" />
          {t("addLink")}
        </Button>
      </div>
    </div>
  );
}
