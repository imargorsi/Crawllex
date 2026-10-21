"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";

import { Icons } from "@/lib/frontend/icons/app-icons";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  parseAssistantInline,
  parseAssistantMessage,
  type TAssistantBlock,
} from "@/lib/frontend/assistant/format-message";
import { cn } from "@/lib/utils";
import type { TAssistantQueryResult } from "@/types/assistant.types";

type TDashboardAssistantAnswerProps = {
  answer: TAssistantQueryResult;
};

function InlineText({ text }: { text: string }) {
  return (
    <>
      {parseAssistantInline(text).map((segment, index) =>
        segment.bold ? (
          <strong key={index} className="font-semibold text-text-primary">
            {segment.text}
          </strong>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </>
  );
}

function AssistantBlock({ block }: { block: TAssistantBlock }) {
  if (block.type === "heading") {
    return (
      <h3 className="pt-1 type-caption font-semibold tracking-wide text-brand">
        <InlineText text={block.text} />
      </h3>
    );
  }
  if (block.type === "bullet") {
    return (
      <li className="flex gap-2 type-body text-text-primary">
        <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />
        <span className="min-w-0 flex-1">
          <InlineText text={block.text} />
        </span>
      </li>
    );
  }
  return (
    <p className="type-body text-text-secondary">
      <InlineText text={block.text} />
    </p>
  );
}

function AssistantMessage({ message }: { message: string }) {
  const blocks = parseAssistantMessage(message);
  const groups: Array<{ key: string; node: React.ReactNode }> = [];
  let bullets: TAssistantBlock[] = [];
  const flushBullets = () => {
    if (bullets.length === 0) return;
    const items = bullets;
    bullets = [];
    groups.push({
      key: `ul-${groups.length}`,
      node: (
        <ul className="space-y-1.5">
          {items.map((item, index) => (
            <AssistantBlock key={index} block={item} />
          ))}
        </ul>
      ),
    });
  };

  blocks.forEach((block, index) => {
    if (block.type === "bullet") {
      bullets.push(block);
      return;
    }
    flushBullets();
    groups.push({ key: `b-${index}`, node: <AssistantBlock block={block} /> });
  });
  flushBullets();

  return (
    <div className="themed-scrollbar min-h-0 space-y-3 overflow-y-auto">
      {groups.map((group) => (
        <div key={group.key}>{group.node}</div>
      ))}
    </div>
  );
}

export function DashboardAssistantAnswer({ answer }: TDashboardAssistantAnswerProps) {
  const { t } = useTranslation("translation", { keyPrefix: "home.assistant" });
  const items = answer.items ?? [];

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col gap-2 rounded-xl border border-border/40 bg-bg-card/25 p-3",
        "shadow-sm backdrop-blur-md dark:border-text-primary/20 dark:bg-text-primary/5",
      )}
    >
      <div className="flex shrink-0 items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <p className="type-caption text-text-muted">{t("answerLabel")}</p>
          <Badge
            variant="outline"
            className="gap-1 whitespace-nowrap"
            data-source={answer.source}
          >
            {answer.source === "ai" ? (
              <Icons.sparkles className="size-3" aria-hidden />
            ) : null}
            {answer.source === "ai" ? t("sourceAi") : t("sourceNlp")}
          </Badge>
        </div>
        {answer.action ? (
          <Link
            href={answer.action.route}
            className={cn(
              buttonVariants({ variant: "ghost", size: "xs" }),
              "inline-flex gap-1 text-brand",
            )}
          >
            {answer.action.label}
            <Icons.arrowRight className="size-3.5" aria-hidden />
          </Link>
        ) : null}
      </div>
      <AssistantMessage message={answer.message} />
      {items.length > 0 ? (
        <ul className="themed-scrollbar min-h-0 space-y-1.5 overflow-y-auto">
          {items.map((item, index) => (
            <li
              key={`${index}-${item.label}`}
              className="flex items-start justify-between gap-3 rounded-lg border border-border/30 px-2.5 py-1.5 dark:border-text-primary/15"
            >
              <span className="min-w-0 flex-1 break-all type-caption text-text-primary">
                {item.label}
              </span>
              <span className="shrink-0 whitespace-nowrap type-caption text-text-secondary">
                {item.detail}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
