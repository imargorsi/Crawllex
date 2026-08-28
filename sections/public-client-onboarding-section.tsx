"use client";

import type { ReactNode } from "react";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";

import { ClientIntakeSnapshot } from "@/components/clients/client-intake-snapshot";
import { AppLogo } from "@/components/layout/app-logo";
import { Heading } from "@/components/heading";
import { Paragraph } from "@/components/paragraph";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { UserAvatar } from "@/components/ui/user-avatar";
import { usePublicClientQuery } from "@/features/clients/clients.api";
import { ApiError } from "@/lib/frontend/api/errors";
import { Icons } from "@/lib/frontend/icons/app-icons";
import {
  elevatedCardBodyClass,
  elevatedCardSurfaceClass,
  elevatedCardTitleClass,
  typeIconTextClass,
  typeMetaRowClass,
  typeStackIdentityClass,
} from "@/lib/frontend/layout/dashboard-chrome";
import { displayDetailValue } from "@/lib/frontend/projects/project-detail-display.utils";
import { cn } from "@/lib/utils";

export function PublicClientOnboardingSection() {
  const params = useParams<{ shareToken: string }>();
  const shareToken = typeof params.shareToken === "string" ? params.shareToken : "";
  const { t } = useTranslation("translation", { keyPrefix: "modules.clients.public" });
  const { data: client, isPending, isError, error } = usePublicClientQuery(shareToken, {
    enabled: Boolean(shareToken),
  });

  if (!shareToken || isError) {
    const isNotFound = error instanceof ApiError && error.status === 404;
    return (
      <PublicOnboardingShell>
        <EmptyState
          title={isNotFound || !shareToken ? t("notFoundTitle") : t("loadErrorTitle")}
          description={isNotFound || !shareToken ? t("notFoundBody") : t("loadErrorBody")}
          icon={Icons.building}
        />
      </PublicOnboardingShell>
    );
  }

  if (isPending || !client) {
    return (
      <PublicOnboardingShell>
        <LoadingState skeletonVariant="detail" embedded />
      </PublicOnboardingShell>
    );
  }

  return (
    <PublicOnboardingShell>
      <header className="type-stack-md mb-6">
        <Heading pageTitle>{t("title")}</Heading>
        <Paragraph className="text-text-muted">{t("lead")}</Paragraph>
      </header>

      <section className={cn(elevatedCardSurfaceClass, "mb-4 rounded-3xl p-3 sm:p-4")}>
        <div className="flex items-start gap-4">
          <UserAvatar name={client.businessName} imageUrl={client.logoImage} size="lg" variant="logo" />
          <div className={cn("min-w-0 flex-1", typeStackIdentityClass)}>
            <Heading sectionTitle className={cn("min-w-0 truncate", elevatedCardTitleClass)}>
              {client.businessName}
            </Heading>
            <div className={cn(typeMetaRowClass, "sm:flex-nowrap")}>
              <span className={cn(typeIconTextClass, "type-caption", elevatedCardBodyClass)}>
                <Icons.file className="size-3.5 shrink-0 text-text-muted" aria-hidden />
                <span className="truncate">{displayDetailValue(client.projectName)}</span>
              </span>
              <span className={cn(typeIconTextClass, "type-caption", elevatedCardBodyClass)}>
                <Icons.call className="size-3.5 shrink-0 text-text-muted" aria-hidden />
                <span className="truncate">{displayDetailValue(client.pocContactNumber)}</span>
              </span>
              <span className={cn(typeIconTextClass, "type-caption", elevatedCardBodyClass)}>
                <Icons.mail className="size-3.5 shrink-0 text-text-muted" aria-hidden />
                <span className="truncate">{displayDetailValue(client.pocEmail)}</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      <ClientIntakeSnapshot client={client} />
    </PublicOnboardingShell>
  );
}

function PublicOnboardingShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation("translation", { keyPrefix: "layout" });

  return (
    <div className="min-h-svh bg-bg-main text-text-primary">
      <div className="mx-auto flex w-full max-w-3xl flex-col px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-8 flex justify-center">
          <AppLogo alt={t("appName")} width={180} priority />
        </div>
        {children}
      </div>
    </div>
  );
}
