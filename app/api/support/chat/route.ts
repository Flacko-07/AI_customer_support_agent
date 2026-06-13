import { NextRequest } from "next/server";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { compiledRefundGraph } from "@/lib/agent/graph";
import { v4 as uuidv4 } from "uuid";

// In-memory log store (for demo)
const logStore = new Map<string, any[]>();

export async function POST(req: NextRequest) {
  try {
    const { messages, conversationId: inputConvId } = await req.json();
    const conversationId = inputConvId || uuidv4();

    const langgraphInput = {
      messages: messages.map((m: any) =>
        m.role === "user" ? new HumanMessage(m.content) : new AIMessage(m.content)
      ),
    };

    const result = await compiledRefundGraph.invoke(langgraphInput, {
      configurable: { conversationId },
    });

    const reply = result.messages.at(-1);
    const decision = result.decision;
    const logs = result.logs;

    // Store logs for this conversation
    const existing = logStore.get(conversationId) || [];
    logStore.set(conversationId, [...existing, ...logs]);

    return Response.json({
      conversationId,
      reply: { role: "assistant", content: reply?.content },
      decision,
      logs,
    });
  } catch (error) {
    console.error("API error:", error);
    return Response.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

// Helper to retrieve logs (used by SSE endpoint)
export function getLogs(conversationId: string) {
  return logStore.get(conversationId) || [];
}