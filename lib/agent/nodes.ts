import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { findCustomerByEmailOrOrder } from "../data/crm";
import { evaluateRefundPolicy, refundPolicyText } from "../data/policy";
import type { RefundStateValues } from "./state";
import { llm } from "../llm";

function log(state: RefundStateValues, node: string, type: string, summary: string, raw?: any) {
  const event = {
    timestamp: new Date().toISOString(),
    node,
    type,
    summary,
    raw,
  };
  return { logs: [event] };
}

export async function parseRequestNode(
  state: RefundStateValues,
): Promise<Partial<RefundStateValues>> {
  const lastUser = state.messages.at(-1) as HumanMessage | undefined;
  return log(
    state,
    "parse_request",
    "system",
    `Parsed user request: ${lastUser?.content ?? ""}`,
  );
}

export async function loadContextNode(
  state: RefundStateValues,
): Promise<Partial<RefundStateValues>> {
  const lastUser = state.messages.at(-1) as HumanMessage | undefined;
  const text = (lastUser?.content ?? "") as string;

  // More robust regex: matches order 1001, ORD-1001, #1001, 1001 (if alone)
  let orderNumber: string | null = null;
  const patterns = [
    /ORD[-\s]?(\d{4,5})/i,
    /order\s*#?\s*(\d{4,5})/i,
    /#(\d{4,5})/,
    /\b(\d{4,5})\b/   // just a 4-5 digit number
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      orderNumber = `ORD-${match[1]}`;
      break;
    }
  }

  const emailMatch = text.match(/[^\s]+@[^\s]+/);
  const { customer, order } = findCustomerByEmailOrOrder({
    orderNumber: orderNumber || undefined,
    email: emailMatch?.[0],
  });

  console.log("Extracted order number:", orderNumber);
  console.log("Found order:", order);
  console.log("Found customer:", customer);

  return {
    ...log(state, "load_context", "tool", `Loaded context for order=${order?.orderNumber ?? "n/a"}`),
    context: { customer, order },
  };
}

export async function checkPolicyNode(
  state: RefundStateValues,
): Promise<Partial<RefundStateValues>> {
  const result = evaluateRefundPolicy({
    order: state.context.order,
    customer: state.context.customer,
  });
  return {
    ...log(state, "check_policy", "tool", `Policy check result: ${result.reasonCode}`, result),
    policyResult: result,
  };
}

export async function decideRefundNode(
  state: RefundStateValues,
): Promise<Partial<RefundStateValues>> {
  const pr = state.policyResult;
  const decision = {
    decision: pr?.decision ?? "deny",
    refundAmount: pr?.refundAmount ?? 0,
    refundType: pr?.refundType ?? null,
    reasonCode: pr?.reasonCode ?? "unknown",
  };
  return {
    ...log(state, "decide_refund", "system", `Decision: ${decision.decision}`, decision),
    decision,
  };
}

export async function generateReplyNode(
  state: RefundStateValues,
): Promise<Partial<RefundStateValues>> {
  const decision = state.decision;
  const userMsg = state.messages.at(-1) as HumanMessage | undefined;
  const order = state.context.order;
  const customer = state.context.customer;

  // Build a clear, factual instruction
  let verdict = "";
  if (decision.decision === "approve") {
    const refundTypeText = decision.refundType === "cash" ? "full cash refund" : "store credit";
    verdict = `APPROVED: Customer will receive a ${refundTypeText} of $${decision.refundAmount}.`;
  } else if (decision.decision === "deny") {
    verdict = `DENIED: ${decision.reasonCode}.`;
  } else if (decision.decision === "escalate") {
    verdict = `ESCALATED: A human agent will review this case (reason: ${decision.reasonCode}).`;
  }

  const system = new SystemMessage(
    `You are an e-commerce support agent. You must follow the refund policy strictly. 
     Do NOT invent policy rules. Do NOT mention VIP overrides unless the decision reason explicitly says 'vip_out_of_window_store_credit'.
     Use the verdict below exactly as given. Be polite and empathetic.`
  );

  const prompt = [
    system,
    new HumanMessage({
      role: "user",
      content: `User request: ${userMsg?.content ?? ""}
  Order number: ${order?.orderNumber ?? "unknown"}
  Customer name: ${customer?.name ?? "customer"}
  Verdict from policy engine: ${verdict}
  Write a short, friendly reply to the customer explaining the verdict. Keep it to 2-3 sentences.
  Always sign off as "Amazing e-commerce team" (never use "[Your Name]").`
    }),
  ];

  const completion = await llm.invoke(prompt);
  return {
    messages: [completion as AIMessage],
    ...log(state, "generate_reply", "llm", "Generated customer reply", completion),
  };
}