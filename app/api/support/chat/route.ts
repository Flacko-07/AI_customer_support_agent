import { NextRequest } from "next/server";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { compiledRefundGraph } from "@/lib/agent/graph";
import { addLogs } from "@/lib/logs"; // <-- import from the shared utility

export async function POST(req: NextRequest) {
  try {
    const { messages, conversationId: inputConvId } = await req.json();
    // Use a fixed demo ID for simplicity
    const conversationId = "demo-1";

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
    const logs = result.logs || [];

    // Store logs using the shared utility
    addLogs(conversationId, logs);

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