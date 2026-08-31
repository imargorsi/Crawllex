"use client";

import type { ReactNode } from "react";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";

import { ClientIntakeHero } from "@/components/clients/client-intake-hero";
import { ClientIntakeSnapshot } from "@/components/clients/client-intake-snapshot";
import { AppLogo } from "@/components/layout/app-logo";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { usePublicClientQuery } from "@/features/clients/clients.api";
import { ApiError } from "@/lib/frontend/api/errors";
import { Icons } from "@/lib/frontend/icons/app-icons";

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
      <div className="space-y-5">
        <ClientIntakeHero
          businessName={client.businessName}
          logoImage={client.logoImage}
          contactPerson={client.contactPerson}
          pocEmail={client.pocEmail}
          pocContactNumber={client.pocContactNumber}
        />
        <ClientIntakeSnapshot client={client} />
      </div>
    </PublicOnboardingShell>
  );
}

function PublicOnboardingShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation("translation", { keyPrefix: "layout" });

  return (
    <div className="min-h-svh bg-bg-main text-text-primary">
      <header className="border-b border-border/50">
        <div className="mx-auto flex w-full max-w-screen-2xl items-center px-4 py-4 sm:px-6 lg:px-8">
          <AppLogo alt={t("appName")} width={168} priority />
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-screen-2xl flex-col px-4 py-6 sm:px-6 lg:px-8">{children}</div>
    </div>
  );
}
