"use client";

import {
  parseAssistantInline,
  parseAssistantMessage,
  type TAssistantBlock,
} from "@/lib/frontend/assistant/format-message";

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

export function AssistantMessage({ message }: { message: string }) {
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
