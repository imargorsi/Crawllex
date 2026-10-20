import { generateGeminiContent } from "@/lib/assistant/ai/gemini-client";
import { executeAssistantTool } from "@/lib/assistant/ai/tools";
import { tryAnswerWithAi } from "@/lib/assistant/ai/run-ai-query";
import type { AuthContext } from "@/lib/auth/guards";
import { permissionForAssistantParse } from "@/lib/assistant/detect-intent";
import {
  deniedAssistantAnswer,
  handleAssistantIntent,
  unknownAssistantAnswer,
} from "@/lib/assistant/handle-intent";
import { appendAssistantHistory } from "@/lib/assistant/history";
import { parseAssistantQuery } from "@/lib/assistant/nlp/parse-query";
import { getProjectAccessForUser } from "@/lib/projects/get-project-access";
import { hasPermission } from "@/lib/rbac/access";
import type { AssistantQueryInput } from "@/schemas/assistant";
import type { TAssistantQueryResult } from "@/types/assistant.types";

function denyModule(
  permission: "leads.view" | "analytics.view" | "seo_activities.view" | null,
): "leads" | "analytics" | "seo_activities" {
  if (permission?.startsWith("leads.")) return "leads";
  if (permission?.startsWith("seo_activities.")) return "seo_activities";
  return "analytics";
}

export function isAssistantAiEnabled(): boolean {
  return process.env.ASSISTANT_AI_ENABLED === "true" && Boolean(process.env.GEMINI_API_KEY);
}

async function tryAiAnswer(
  auth: AuthContext,
  projectId: string,
  query: string,
): Promise<string | null> {
  if (!isAssistantAiEnabled()) return null;
  const access = await getProjectAccessForUser(auth, projectId);
  if (!access) return null;
  const permissions = access.permissions;

  const answer = await tryAnswerWithAi(query, {
    generate: generateGeminiContent,
    execute: (name, args) => executeAssistantTool(name, args, projectId, permissions),
  });
  return answer?.message ?? null;
}

export async function runAssistantQuery(
  auth: AuthContext,
  projectId: string,
  input: AssistantQueryInput,
): Promise<TAssistantQueryResult> {
  const userId = auth.user._id.toString();

  const aiMessage = await tryAiAnswer(auth, projectId, input.query);
  if (aiMessage != null) {
    const history = await appendAssistantHistory({
      projectId,
      userId,
      query: input.query,
      intent: "ai_answer",
    });
    return { message: aiMessage, intent: "ai_answer", source: "ai", history };
  }

  const parsed = parseAssistantQuery(input.query);
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
    query: input.query,
    intent,
  });

  return {
    message,
    intent,
    source: "nlp",
    action,
    items,
    history,
  };
}
