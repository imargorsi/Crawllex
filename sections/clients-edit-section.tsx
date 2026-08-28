"use client";

import { Icons } from "@/lib/frontend/icons/app-icons";

import { useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

import { ClientCreateForm } from "@/components/forms/client-create-form";
import { DashboardModuleBreadcrumbSection } from "@/components/layout/dashboard-module-breadcrumb-section";
import { Heading } from "@/components/heading";
import { Paragraph } from "@/components/paragraph";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { useAuthUserQuery } from "@/features/auth/auth.api";
import { useClientQuery } from "@/features/clients/clients.api";
import { ApiError } from "@/lib/frontend/api/errors";
import { clientCanUpdate } from "@/lib/frontend/clients/acl";
import { mapClientDetailToFormValues } from "@/lib/frontend/clients/client-form-payload.utils";
import { CLIENT_ROUTES } from "@/lib/frontend/clients/client-routes.utils";

export function ClientsEditSection() {
  const params = useParams<{ id: string }>();
  const clientId = typeof params.id === "string" ? params.id : "";
  const router = useRouter();
  const { t } = useTranslation("translation", { keyPrefix: "modules.clients" });
  const { t: tDetail } = useTranslation("translation", { keyPrefix: "modules.clients.detail" });
  const { data: authUser, isLoading: isAuthLoading } = useAuthUserQuery();
  const canUpdate = clientCanUpdate(authUser?.permissions);
  const { data: client, isPending, isError, error } = useClientQuery(clientId, {
    enabled: Boolean(authUser && clientId && canUpdate),
  });

  const initialValues = useMemo(
    () => (client ? mapClientDetailToFormValues(client) : undefined),
    [client],
  );
  const breadcrumbItems = useMemo(
    () => [
      { id: "clients", label: t("title"), href: CLIENT_ROUTES.list },
      { id: "clients-edit", label: client?.businessName ?? t("editClient") },
    ],
    [client?.businessName, t],
  );

  useEffect(() => {
    if (!isAuthLoading && authUser && !canUpdate) {
      router.replace(CLIENT_ROUTES.list);
    }
  }, [authUser, canUpdate, isAuthLoading, router]);

  if (!clientId) {
    return (
      <div className="px-4 py-6 sm:px-6">
        <EmptyState title={tDetail("notFoundTitle")} description={tDetail("notFoundBody")} icon={Icons.folderOpen} />
      </div>
    );
  }

  if (isAuthLoading || isPending || !authUser) {
    return <LoadingState skeletonVariant="form" />;
  }

  if (!canUpdate) return null;

  if (isError) {
    const isNotFound = error instanceof ApiError && error.status === 404;
    return (
      <div className="px-4 py-6 sm:px-6">
        <EmptyState
          title={isNotFound ? tDetail("notFoundTitle") : tDetail("loadErrorTitle")}
          description={isNotFound ? tDetail("notFoundBody") : tDetail("loadErrorBody")}
          icon={Icons.folderOpen}
        />
      </div>
    );
  }

  if (!client) return null;

  return (
    <div className="w-full min-w-0">
      <DashboardModuleBreadcrumbSection items={breadcrumbItems} />
      <div className="space-y-5 px-4 py-6 sm:px-6">
        <div className="type-stack-md">
          <Heading id="clients-edit-title" pageTitle>
            {t("editTitle")}
          </Heading>
          <Paragraph className="text-text-muted">{t("editLead")}</Paragraph>
        </div>
        <ClientCreateForm
          authUser={authUser}
          isEdit
          clientId={client.id}
          initialValues={initialValues}
          initialLogoUrl={client.logoImage}
        />
      </div>
    </div>
  );
}
