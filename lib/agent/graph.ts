// lib/agent/graph.ts
import { StateGraph, START, END } from "@langchain/langgraph";
import { RefundState } from "./state";
import {
  parseRequestNode,
  loadContextNode,
  checkPolicyNode,
  decideRefundNode,
  generateReplyNode,
} from "./nodes";

const workflow = new StateGraph(RefundState)
  .addNode("parse_request", parseRequestNode)
  .addNode("load_context", loadContextNode)
  .addNode("check_policy", checkPolicyNode)
  .addNode("decide_refund", decideRefundNode)
  .addNode("generate_reply", generateReplyNode)
  .addEdge(START, "parse_request")
  .addEdge("parse_request", "load_context")
  .addEdge("load_context", "check_policy")
  .addEdge("check_policy", "decide_refund")
  .addEdge("decide_refund", "generate_reply")
  .addEdge("generate_reply", END);

export const compiledRefundGraph = workflow.compile();
