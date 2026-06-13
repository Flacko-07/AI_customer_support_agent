// lib/data/policy.ts
import { Customer, Order } from "./crm";

export const refundPolicyText = `
1. Eligibility Window
- Physical goods: refundable within 30 days of delivery.
- Digital goods: non-refundable once delivered.

2. Order Status
- Only "delivered" orders are refundable.
- "Processing" or "shipped" orders should be redirected to "cancel order" flow.

3. High-Value Orders
- If amount > 5000, refund must be escalated to a human manager.

4. Discounted Items
- Items with heavy discounts (isDiscounted = true) are only refundable as store credit.

5. VIP Overrides
- VIP customers (isVip = true) can get store credit refunds up to 7 days beyond the normal window.

6. Risk Flags
- Customers with riskFlag are not refundable without human approval.
`;

export type PolicyResult = {
  eligible: boolean;
  decision: "approve" | "deny" | "escalate";
  reasonCode: string;
  refundAmount: number;
  refundType: "cash" | "store_credit" | null;
};

export function evaluateRefundPolicy(input: {
  order: Order | null;
  customer: Customer | null;
  now?: Date;
}): PolicyResult {
  const now = input.now ?? new Date();
  if (!input.order || !input.customer) {
    return {
      eligible: false,
      decision: "deny",
      reasonCode: "missing_context",
      refundAmount: 0,
      refundType: null,
    };
  }
  const { order, customer } = input;
  if (order.status === "refunded") {
    return {
      eligible: false,
      decision: "deny",
      reasonCode: "already_refunded",
      refundAmount: 0,
      refundType: null,
    };
  }
  if (order.status !== "delivered") {
    return {
      eligible: false,
      decision: "deny",
      reasonCode: "not_delivered",
      refundAmount: 0,
      refundType: null,
    };
  }

  const refundableUntil = new Date(order.refundableUntil);
  const isInWindow = now <= refundableUntil;
  const daysLate = Math.ceil(
    (now.getTime() - refundableUntil.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (!isInWindow) {
    if (customer.isVip && daysLate <= 7) {
      return {
        eligible: true,
        decision: "approve",
        reasonCode: "vip_out_of_window_store_credit",
        refundAmount: order.amount,
        refundType: "store_credit",
      };
    }
    return {
      eligible: false,
      decision: "deny",
      reasonCode: "out_of_window",
      refundAmount: 0,
      refundType: null,
    };
  }

  if (customer.riskFlag) {
    return {
      eligible: false,
      decision: "escalate",
      reasonCode: "risk_flag",
      refundAmount: 0,
      refundType: null,
    };
  }

  if (order.amount > 5000) {
    return {
      eligible: true,
      decision: "escalate",
      reasonCode: "high_value_escalation",
      refundAmount: order.amount,
      refundType: order.isDiscounted ? "store_credit" : "cash",
    };
  }

  return {
    eligible: true,
    decision: "approve",
    reasonCode: order.isDiscounted ? "discount_store_credit" : "standard_refund",
    refundAmount: order.amount,
    refundType: order.isDiscounted ? "store_credit" : "cash",
  };
}
