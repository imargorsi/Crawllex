import { env } from "@/lib/config/env";
import { mailBodyHtml, mailStrong, renderMailLayout } from "@/lib/mail/templates/layout";
import { escapeHtml } from "@/lib/mail/templates/escape";
import type { TMailContent } from "@/lib/mail/templates/types";

/** Sent to each report recipient after a monthly report is created. The PDF is attached. */
export function reportReadyMailContent(input: {
  clientName: string;
  periodLabel: string;
  dashboardUrl: string;
}): TMailContent {
  const app = env.appName();
  const intro = `The monthly SEO report for ${input.clientName} (${input.periodLabel}) is ready.`;

  return {
    subject: `SEO Report For ${input.clientName}: ${input.periodLabel}`,
    text: [
      "Hello!",
      "",
      intro,
      "",
      "The PDF is attached. You can also open the live report on Crawllex:",
      input.dashboardUrl,
      "",
      "You received this email because you were chosen as a recipient of this report.",
    ].join("\n"),
    html: renderMailLayout({
      title: "Monthly SEO Report",
      previewText: intro,
      bodyHtml: mailBodyHtml(
        "Hello!",
        `The monthly SEO report for ${mailStrong(input.clientName)} (${escapeHtml(input.periodLabel)}) is ready.`,
        `The PDF is attached. You can also open the live report on ${escapeHtml(app)}.`,
      ),
      cta: { label: "Open Report", url: input.dashboardUrl },
      footerNote: "You received this email because you were chosen as a recipient of this report.",
    }),
  };
}
