import { Types } from "mongoose";

import { AssistantQueryHistory } from "@/models";
import type { TAssistantHistoryItem, TAssistantThreadMessage, TAssistantThreadSummary } from "@/types/assistant.types";

/** Recent queries returned with each answer (compact list, kept for existing clients). */
export const ASSISTANT_HISTORY_LIMIT = 5;
/** Messages kept per user and project. Older rows are deleted on each write. */
export const ASSISTANT_RETENTION_LIMIT = 500;
export const ASSISTANT_THREAD_LIST_LIMIT = 30;
export const ASSISTANT_THREAD_MESSAGE_LIMIT = 100;
export const ASSISTANT_TITLE_MAX_CHARS = 60;

function serializeHistoryItem(doc: {
  _id: { toString(): string };
  query: string;
  intent: string;
  createdAt?: Date;
}): TAssistantHistoryItem {
  return {
    id: doc._id.toString(),
    query: doc.query,
    intent: doc.intent,
    createdAt: (doc.createdAt ?? new Date()).toISOString(),
  };
}

export async function listAssistantHistory(projectId: string, userId: string): Promise<TAssistantHistoryItem[]> {
  const docs = await AssistantQueryHistory.find({ projectId, userId })
    .sort({ createdAt: -1 })
    .limit(ASSISTANT_HISTORY_LIMIT)
    .select("query intent createdAt")
    .lean();

  return docs.map((doc) =>
    serializeHistoryItem({
      _id: doc._id as { toString(): string },
      query: doc.query,
      intent: doc.intent,
      createdAt: doc.createdAt as Date | undefined,
    })
  );
}

/** Title from the first question of a thread, cut to a short label. */
export function threadTitle(firstQuery: string): string {
  const clean = firstQuery.replace(/\s+/g, " ").trim();
  if (clean.length <= ASSISTANT_TITLE_MAX_CHARS) return clean;
  return `${clean.slice(0, ASSISTANT_TITLE_MAX_CHARS - 1).trimEnd()}…`;
}

export async function listAssistantThreads(projectId: string, userId: string): Promise<TAssistantThreadSummary[]> {
  const rows = await AssistantQueryHistory.aggregate<{
    _id: string;
    title: string;
    updatedAt: Date;
    messageCount: number;
  }>([
    { $match: { projectId: new Types.ObjectId(projectId), userId: new Types.ObjectId(userId) } },
    { $sort: { createdAt: 1 } },
    {
      $group: {
        _id: { $ifNull: ["$threadId", { $toString: "$_id" }] },
        title: { $first: "$query" },
        updatedAt: { $max: "$createdAt" },
        messageCount: { $sum: 1 },
      },
    },
    { $sort: { updatedAt: -1 } },
    { $limit: ASSISTANT_THREAD_LIST_LIMIT },
  ]);

  return rows.map((row) => ({
    threadId: row._id,
    title: threadTitle(row.title),
    updatedAt: row.updatedAt.toISOString(),
    messageCount: row.messageCount,
  }));
}

/** Messages of one thread for this user only. Legacy rows match by their own id. */
export async function getAssistantThreadMessages(
  projectId: string,
  userId: string,
  threadId: string
): Promise<TAssistantThreadMessage[]> {
  const threadMatch = Types.ObjectId.isValid(threadId)
    ? { $or: [{ threadId }, { threadId: null, _id: new Types.ObjectId(threadId) }] }
    : { threadId };

  const docs = await AssistantQueryHistory.find({
    projectId,
    userId,
    ...threadMatch,
  })
    .sort({ createdAt: 1 })
    .limit(ASSISTANT_THREAD_MESSAGE_LIMIT)
    .select("query answer intent createdAt")
    .lean();

  return docs.map((doc) => ({
    id: (doc._id as Types.ObjectId).toString(),
    query: doc.query,
    answer: doc.answer ?? "",
    intent: doc.intent,
    createdAt: (doc.createdAt as Date).toISOString(),
  }));
}

export async function appendAssistantHistory(input: {
  projectId: string;
  userId: string;
  threadId: string;
  query: string;
  answer: string;
  intent: string;
}): Promise<TAssistantHistoryItem[]> {
  await AssistantQueryHistory.create({
    projectId: input.projectId,
    userId: input.userId,
    threadId: input.threadId,
    query: input.query,
    answer: input.answer.slice(0, 4000),
    intent: input.intent,
  });

  const stale = await AssistantQueryHistory.find({
    projectId: input.projectId,
    userId: input.userId,
  })
    .sort({ createdAt: -1 })
    .skip(ASSISTANT_RETENTION_LIMIT)
    .select("_id");

  if (stale.length > 0) {
    await AssistantQueryHistory.deleteMany({
      _id: { $in: stale.map((doc) => doc._id) },
    });
  }

  return listAssistantHistory(input.projectId, input.userId);
}

/**
 * Deletes one conversation of the signed-in user. Returns the number of messages removed
 * (0 when the conversation does not exist or belongs to someone else).
 */
export async function deleteAssistantThread(projectId: string, userId: string, threadId: string): Promise<number> {
  const threadMatch = Types.ObjectId.isValid(threadId)
    ? { $or: [{ threadId }, { threadId: null, _id: new Types.ObjectId(threadId) }] }
    : { threadId };
  const result = await AssistantQueryHistory.deleteMany({ projectId, userId, ...threadMatch });
  return result.deletedCount ?? 0;
}

/** Deletes every conversation of the signed-in user in one project. Returns the number of messages removed. */
export async function deleteAllAssistantThreads(projectId: string, userId: string): Promise<number> {
  const result = await AssistantQueryHistory.deleteMany({ projectId, userId });
  return result.deletedCount ?? 0;
}
