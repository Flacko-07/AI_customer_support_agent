// lib/data/crm.ts

export type Customer = {
  id: string;
  name: string;
  email: string;
  loyaltyTier: "bronze" | "silver" | "gold";
  isVip: boolean;
  lifetimeValue: number;
  riskFlag: "chargeback_risk" | "fraud_suspected" | null;
};

export type Order = {
  id: string;
  customerId: string;
  orderNumber: string;
  orderDate: string; // ISO
  amount: number;
  status: "delivered" | "shipped" | "processing" | "refunded";
  paymentMethod: "card" | "upi" | "cod";
  isDiscounted: boolean;
  refundableUntil: string; // ISO
};

export const customers: Customer[] = [
  {
    id: "c1",
    name: "Aditi Sharma",
    email: "aditi@example.com",
    loyaltyTier: "gold",
    isVip: true,
    lifetimeValue: 120000,
    riskFlag: null,
  },
  {
    id: "c2",
    name: "Rahul Mehta",
    email: "rahul@example.com",
    loyaltyTier: "silver",
    isVip: false,
    lifetimeValue: 25000,
    riskFlag: null,
  },
  {
    id: "c3",
    name: "Priya Singh",
    email: "priya@example.com",
    loyaltyTier: "bronze",
    isVip: false,
    lifetimeValue: 5000,
    riskFlag: "chargeback_risk",
  },
  {
    id: "c4",
    name: "Amit Patel",
    email: "amit@example.com",
    loyaltyTier: "gold",
    isVip: true,
    lifetimeValue: 95000,
    riskFlag: null,
  },
  {
    id: "c5",
    name: "Neha Gupta",
    email: "neha@example.com",
    loyaltyTier: "silver",
    isVip: false,
    lifetimeValue: 32000,
    riskFlag: null,
  },
  // Add more customers as needed for other orders...
];

export const orders: Order[] = [
  // Standard approval
  {
    id: "o1",
    customerId: "c1",
    orderNumber: "ORD-1001",
    orderDate: "2026-05-15",
    amount: 2499,
    status: "delivered",
    paymentMethod: "card",
    isDiscounted: false,
    refundableUntil: "2026-06-15",
  },
  // VIP – late refund (out of window)
  {
    id: "o5",
    customerId: "c1",
    orderNumber: "ORD-1005",
    orderDate: "2026-05-10",
    amount: 1899,
    status: "delivered",
    paymentMethod: "card",
    isDiscounted: false,
    refundableUntil: "2026-06-08", // window closed yesterday
  },
  // High value (>5000)
  {
    id: "o8",
    customerId: "c2",
    orderNumber: "ORD-1008",
    orderDate: "2026-05-20",
    amount: 7500,
    status: "delivered",
    paymentMethod: "card",
    isDiscounted: false,
    refundableUntil: "2026-06-20",
  },
  // Not delivered (processing)
  {
    id: "o12",
    customerId: "c2",
    orderNumber: "ORD-1012",
    orderDate: "2026-06-01",
    amount: 3499,
    status: "processing", // not delivered
    paymentMethod: "card",
    isDiscounted: false,
    refundableUntil: "2026-07-01",
  },
  // Risk flag customer
  {
    id: "o15",
    customerId: "c3", // Priya has riskFlag "chargeback_risk"
    orderNumber: "ORD-1015",
    orderDate: "2026-05-25",
    amount: 1299,
    status: "delivered",
    paymentMethod: "card",
    isDiscounted: false,
    refundableUntil: "2026-06-25",
  },
  // Discounted item
  {
    id: "o18",
    customerId: "c4",
    orderNumber: "ORD-1018",
    orderDate: "2026-05-28",
    amount: 3999,
    status: "delivered",
    paymentMethod: "card",
    isDiscounted: true,
    refundableUntil: "2026-06-28",
  },
  // Already refunded
  {
    id: "o20",
    customerId: "c5",
    orderNumber: "ORD-1020",
    orderDate: "2026-05-10",
    amount: 549,
    status: "refunded",
    paymentMethod: "upi",
    isDiscounted: false,
    refundableUntil: "2026-06-10",
  },
  // Normal customer, within window (cash)
  {
    id: "o22",
    customerId: "c5",
    orderNumber: "ORD-1022",
    orderDate: "2026-05-30",
    amount: 2199,
    status: "delivered",
    paymentMethod: "card",
    isDiscounted: false,
    refundableUntil: "2026-06-30",
  },
  // Normal customer, out of window (deny)
  {
    id: "o24",
    customerId: "c2",
    orderNumber: "ORD-1024",
    orderDate: "2026-04-15",
    amount: 1599,
    status: "delivered",
    paymentMethod: "card",
    isDiscounted: false,
    refundableUntil: "2026-05-15", // expired
  },
];

export function findCustomerByEmailOrOrder(params: {
  email?: string;
  orderNumber?: string;
}) {
  if (params.orderNumber) {
    const order = orders.find(o => o.orderNumber === params.orderNumber);
    if (!order) return { customer: null, order: null };
    const customer = customers.find(c => c.id === order.customerId) ?? null;
    return { customer, order };
  }
  if (params.email) {
    const customer = customers.find(c => c.email === params.email) ?? null;
    const order = orders.find(o => o.customerId === customer?.id) ?? null;
    return { customer, order };
  }
  return { customer: null, order: null };
}