import { describe, expect, it } from "vitest";
import { Types } from "mongoose";

import { deleteAllAssistantThreads, deleteAssistantThread, listAssistantThreads } from "@/lib/assistant/history";
import { AssistantQueryHistory } from "@/models";

const THREAD_A = "7f3c2a9e-1b4d-4c8e-9f0a-aaaaaaaaaaaa";
const THREAD_B = "7f3c2a9e-1b4d-4c8e-9f0a-bbbbbbbbbbbb";

async function addMessage(projectId: string, userId: string, threadId: string, query: string) {
  await AssistantQueryHistory.create({ projectId, userId, threadId, query, answer: "ok", intent: "unknown" });
}

describe("assistant conversation delete", () => {
  it("deletes one conversation of the signed-in user and keeps the others", async () => {
    const projectId = new Types.ObjectId().toString();
    const userId = new Types.ObjectId().toString();
    await addMessage(projectId, userId, THREAD_A, "first");
    await addMessage(projectId, userId, THREAD_A, "second");
    await addMessage(projectId, userId, THREAD_B, "other");

    expect(await deleteAssistantThread(projectId, userId, THREAD_A)).toBe(2);
    const left = await listAssistantThreads(projectId, userId);
    expect(left.map((thread) => thread.threadId)).toEqual([THREAD_B]);
  });

  it("never deletes another user's conversation", async () => {
    const projectId = new Types.ObjectId().toString();
    const owner = new Types.ObjectId().toString();
    const other = new Types.ObjectId().toString();
    await addMessage(projectId, owner, THREAD_A, "mine");

    expect(await deleteAssistantThread(projectId, other, THREAD_A)).toBe(0);
    expect(await listAssistantThreads(projectId, owner)).toHaveLength(1);
  });

  it("returns 0 for an unknown conversation", async () => {
    const projectId = new Types.ObjectId().toString();
    const userId = new Types.ObjectId().toString();
    expect(await deleteAssistantThread(projectId, userId, THREAD_A)).toBe(0);
  });

  it("deletes all conversations of the user in one project only", async () => {
    const projectId = new Types.ObjectId().toString();
    const otherProject = new Types.ObjectId().toString();
    const userId = new Types.ObjectId().toString();
    await addMessage(projectId, userId, THREAD_A, "a");
    await addMessage(projectId, userId, THREAD_B, "b");
    await addMessage(otherProject, userId, THREAD_A, "elsewhere");

    expect(await deleteAllAssistantThreads(projectId, userId)).toBe(2);
    expect(await listAssistantThreads(projectId, userId)).toHaveLength(0);
    expect(await listAssistantThreads(otherProject, userId)).toHaveLength(1);
  });
});
