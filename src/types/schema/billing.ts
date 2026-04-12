// Phase 3.1 — Billing domain aliases

import type { Database } from "@/types/database";

type Tables = Database["public"]["Tables"];

export type Subscription = Tables["subscriptions"]["Row"];
export type SubscriptionInsert = Tables["subscriptions"]["Insert"];
export type SubscriptionUpdate = Tables["subscriptions"]["Update"];

export type SubscriptionStatus = Subscription["status"];
export type SubscriptionPlan = Subscription["plan"];
