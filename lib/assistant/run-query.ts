import { answerCacheKey, getCachedAnswer, setCachedAnswer } from "@/lib/assistant/ai/answer-cache";
import { generateChatCompletion, llmConfig } from "@/lib/assistant/ai/llm-client";
import { executeAssistantTool } from "@/lib/assistant/ai/tools";
import { randomUUID } from "node:crypto";
import { tryAnswerWithAi, type TThreadTurn } from "@/lib/assistant/ai/run-ai-query";
import type { AuthContext } from "@/lib/auth/guards";
import { permissionForAssistantParse } from "@/lib/assistant/detect-intent";
import {
  deniedAssistantAnswer,
  handleAssistantIntent,
  unknownAssistantAnswer,
} from "@/lib/assistant/handle-intent";
import { appendAssistantHistory, getAssistantThreadMessages } from "@/lib/assistant/history";
import { parseAssistantQuery } from "@/lib/assistant/nlp/parse-query";
import { getProjectAccessForUser } from "@/lib/projects/get-project-access";
import { hasPermission } from "@/lib/rbac/access";
import type { AssistantQueryInput } from "@/schemas/assistant";
import type { TAssistantQueryResult } from "@/types/assistant.types";

/** Earlier exchanges sent with a follow-up question. */
const CONVERSATION_TURNS = 4;

/**
 * Questions that ask for an explanation or advice. The rule parser can match a keyword in them
 * ("impressions") and answer a different question, so these always go to the model.
 */
const EXPLANATORY = /\b(why|how come|explain|reason|because|what should|next steps?|what can i do|recommend|suggest|improve|help me)\b/i;

/** Reply to a bare greeting. Fixed text: no data read, no model call. */
export const ASSISTANT_GREETING = "Hey, I am Oriel. What can I help you with?";

/** Short greetings only. Anything longer goes through the parser and the model. */
const GREETING = /^(hi|hey|hello|hiya|yo|good (morning|afternoon|evening))( there)?( oriel)?[\s!.?,]*$/i;

function denyModule(
  permission: "leads.view" | "analytics.view" | "seo_activities.view" | null,
): "leads" | "analytics" | "seo_activities" {
  if (permission?.startsWith("leads.")) return "leads";
  if (permission?.startsWith("seo_activities.")) return "seo_activities";
  return "analytics";
}

export function isAssistantAiEnabled(): boolean {
  return process.env.ASSISTANT_AI_ENABLED === "true" && llmConfig() !== null;
}

/**
 * AI answer for questions the rule parser could not read. Cached per user and question for five minutes.
 * `onToken` receives the text as it is generated (a cached answer arrives as one piece).
 */
/** The last few exchanges of a conversation, oldest first. Only the signed-in user's own thread. */
async function recentTurns(projectId: string, userId: string, threadId: string | undefined): Promise<TThreadTurn[]> {
  if (!threadId) return [];
  const messages = await getAssistantThreadMessages(projectId, userId, threadId);
  return messages
    .filter((message) => message.answer)
    .slice(-CONVERSATION_TURNS)
    .map((message) => ({ query: message.query, answer: message.answer }));
}

async function tryAiAnswer(
  auth: AuthContext,
  projectId: string,
  query: string,
  history: TThreadTurn[],
  onToken?: (text: string) => void,
): Promise<string | null> {
  if (!isAssistantAiEnabled()) return null;
  const access = await getProjectAccessForUser(auth, projectId);
  if (!access) return null;
  const permissions = access.permissions;

  // Answers depend on the conversation, so the cache is used only for first questions.
  const key = answerCacheKey(projectId, auth.user._id.toString(), query);
  const cached = history.length === 0 ? getCachedAnswer(key) : null;
  if (cached != null) {
    onToken?.(cached);
    return cached;
  }

  const answer = await tryAnswerWithAi(
    query,
    {
      generate: generateChatCompletion,
      execute: (name, args) => executeAssistantTool(name, args, projectId, permissions),
    },
    Date.now(),
    onToken,
    history,
  );
  if (answer?.message && history.length === 0) setCachedAnswer(key, answer.message);
  return answer?.message ?? null;
}

/**
 * Answers one question. Rule parser first: a recognized question is answered at once, without the model.
 * The model runs only when the parser does not understand the question. `onToken` streams AI text.
 */
export async function runAssistantQuery(
  auth: AuthContext,
  projectId: string,
  input: AssistantQueryInput,
  onToken?: (text: string) => void,
): Promise<TAssistantQueryResult> {
  const userId = auth.user._id.toString();
  const threadId = input.threadId ?? randomUUID();

  if (GREETING.test(input.query.trim())) {
    const history = await appendAssistantHistory({
      projectId,
      userId,
      threadId,
      query: input.query,
      answer: ASSISTANT_GREETING,
      intent: "greeting",
    });
    return { threadId, message: ASSISTANT_GREETING, intent: "greeting", source: "nlp", history };
  }

  const parsed = parseAssistantQuery(input.query);

  if (parsed.kind === "unknown" || EXPLANATORY.test(input.query)) {
    const history = await recentTurns(projectId, userId, input.threadId);
    const aiMessage = await tryAiAnswer(auth, projectId, input.query, history, onToken);
    if (aiMessage != null) {
      const history = await appendAssistantHistory({
        projectId,
        userId,
        threadId,
        query: input.query,
        answer: aiMessage,
        intent: "ai_answer",
      });
      return { threadId, message: aiMessage, intent: "ai_answer", source: "ai", history };
    }
  }

  const intent = parsed.kind;

  let message: string;
  let action: TAssistantQueryResult["action"];
  let items: TAssistantQueryResult["items"];

  if (parsed.kind === "unknown") {
    const answer = unknownAssistantAnswer();
    message = answer.message;
    action = answer.action;
    items = answer.items;
  } else {
    const requiredPermission = permissionForAssistantParse(parsed);
    const access = await getProjectAccessForUser(auth, projectId);
    const allowed =
      requiredPermission != null &&
      access != null &&
      hasPermission(access.permissions, requiredPermission);

    if (!allowed) {
      const answer = deniedAssistantAnswer(denyModule(requiredPermission));
      message = answer.message;
      action = answer.action;
      items = answer.items;
    } else {
      const answer = await handleAssistantIntent(projectId, parsed);
      message = answer.message;
      action = answer.action;
      items = answer.items;
    }
  }

  const history = await appendAssistantHistory({
    projectId,
    userId,
    threadId,
    query: input.query,
    answer: message,
    intent,
  });

  return {
    threadId,
    message,
    intent,
    source: "nlp",
    action,
    items,
    history,
  };
}
