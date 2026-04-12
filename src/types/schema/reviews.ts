// Phase 3.1 — Reviews domain aliases

import type { Database } from "@/types/database";

type Tables = Database["public"]["Tables"];

export type DeliveryReview = Tables["delivery_reviews"]["Row"];
export type DeliveryReviewInsert = Tables["delivery_reviews"]["Insert"];
export type DeliveryReviewUpdate = Tables["delivery_reviews"]["Update"];

export type DeliveryPlatform = DeliveryReview["platform"];
export type ReplyStatus = DeliveryReview["reply_status"];
