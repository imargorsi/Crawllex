"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

import { ClientCreateForm } from "@/components/forms/client-create-form";
import { DashboardModuleBreadcrumbSection } from "@/components/layout/dashboard-module-breadcrumb-section";
import { Heading } from "@/components/heading";
import { Paragraph } from "@/components/paragraph";
import { LoadingState } from "@/components/ui/loading-state";
import { useAuthUserQuery } from "@/features/auth/auth.api";
import { clientCanCreate } from "@/lib/frontend/clients/acl";
import { CLIENT_ROUTES } from "@/lib/frontend/clients/client-routes.utils";

export function ClientsCreateSection() {
  const router = useRouter();
  const { t } = useTranslation("translation", { keyPrefix: "modules.clients" });
  const { data: authUser, isLoading } = useAuthUserQuery();
  const canCreate = clientCanCreate(authUser?.permissions);
  const breadcrumbItems = useMemo(
    () => [
      { id: "clients", label: t("title"), href: CLIENT_ROUTES.list },
      { id: "clients-create", label: t("addClient") },
    ],
    [t],
  );

  useEffect(() => {
    if (!isLoading && authUser && !canCreate) {
      router.replace(CLIENT_ROUTES.list);
    }
  }, [authUser, canCreate, isLoading, router]);

  if (isLoading || !authUser) {
    return <LoadingState skeletonVariant="form" />;
  }

  if (!canCreate) return null;

  return (
    <div className="w-full min-w-0">
      <DashboardModuleBreadcrumbSection items={breadcrumbItems} />
      <div className="space-y-5 px-4 py-6 sm:px-6">
        <div className="type-stack-md">
          <Heading id="clients-create-title" pageTitle>
            {t("createTitle")}
          </Heading>
          <Paragraph className="text-text-muted">{t("createLead")}</Paragraph>
        </div>
        <ClientCreateForm authUser={authUser} />
      </div>
    </div>
  );
}
