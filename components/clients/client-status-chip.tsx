"use client";

import { useTranslation } from "react-i18next";

import { StatusChip } from "@/components/ui/status-chip";
import type { TClientStatus } from "@/lib/clients/constants";

type TClientStatusChipProps = {
  status: TClientStatus;
  className?: string;
};

export function ClientStatusChip({ status, className }: TClientStatusChipProps) {
  const { t } = useTranslation("translation", { keyPrefix: "modules.clients.statusFilter" });
  return <StatusChip colorKey={status} label={t(status)} className={className} />;
}
