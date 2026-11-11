"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";

import { ProjectDetailInfoCard } from "@/components/projects/detail/project-detail-info-card";
import { Icons } from "@/lib/frontend/icons/app-icons";
import { useAuthUserQuery } from "@/features/auth/auth.api";
import { useEnrollProjectInLensMutation } from "@/features/projects/projects.api";
import { isSuperAdmin } from "@/lib/rbac/access";
import type { TProjectDetail } from "@/types/project.types";

/**
 * Lens enrollment for a project. Super admin only: the card is not rendered for anyone else.
 * Enrolling runs the first audit in the background. Once enrolled, the Lens page appears for the project.
 */
export function ProjectDetailLensCard({ project }: { project: TProjectDetail }) {
  const { t } = useTranslation("translation", { keyPrefix: "modules.projects.detail" });
  const { data: authUser } = useAuthUserQuery();
  const enroll = useEnrollProjectInLensMutation();
  const [message, setMessage] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  if (!isSuperAdmin(authUser?.roles)) return null;

  const canEnroll = !project.lensEnrolled && project.status === "active";

  const onEnroll = () => {
    setMessage(null);
    setFailed(false);
    enroll.mutate(project.id, {
      onSuccess: (result) => setMessage(result.alreadyEnrolled ? t("lensEnrollAlready") : t("lensEnrollQueued")),
      onError: () => setFailed(true),
    });
  };

  return (
    <ProjectDetailInfoCard
      title={t("lensCardTitle")}
      lead={t("lensCardLead")}
      icon={<Icons.search className="size-4 shrink-0" aria-hidden />}
    >
      <div className="flex flex-col gap-3">
        <p className="type-body-strong">{project.lensEnrolled ? t("lensStatusEnrolled") : t("lensStatusNotEnrolled")}</p>
        {project.status !== "active" && !project.lensEnrolled ? (
          <p className="type-caption text-text-muted">{t("lensNeedsActive")}</p>
        ) : null}
        {canEnroll ? (
          <button
            type="button"
            onClick={onEnroll}
            disabled={enroll.isPending}
            className="type-caption inline-flex h-9 w-fit items-center gap-1.5 rounded-xl border border-brand/50 px-4 font-medium text-brand transition-colors hover:bg-brand/10 disabled:opacity-40"
          >
            {enroll.isPending ? t("lensEnrollBusy") : t("lensEnrollButton")}
          </button>
        ) : null}
        {message ? <p className="type-caption text-success">{message}</p> : null}
        {failed ? <p className="type-caption text-destructive">{t("lensEnrollFailed")}</p> : null}
      </div>
    </ProjectDetailInfoCard>
  );
}
