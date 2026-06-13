// lib/agent/state.ts
import { Annotation } from "@langchain/langgraph";
import type { BaseMessage } from "@langchain/core/messages";

export const RefundState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (curr, update) => [...curr, ...update],
    default: () => [],
  }),
  context: Annotation<{
    customer: any | null;
    order: any | null;
  }>({
    default: () => ({ customer: null, order: null }),
  }),
  policyResult: Annotation<any | null>({
    default: () => null,
  }),
  decision: Annotation<any | null>({
    default: () => null,
  }),
  logs: Annotation<
    { timestamp: string; node: string; type: string; summary: string; raw?: any }[]
  >({
    reducer: (curr, update) => [...curr, ...update],
    default: () => [],
  }),
});
export type RefundStateValues = typeof RefundState.State;
