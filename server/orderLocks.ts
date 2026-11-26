import { TRPCError } from "@trpc/server";
import { and, eq, isNull } from "drizzle-orm";
import * as db from "./db";
import { giftingOrders, recipients } from "../drizzle/schema";

/**
 * Atomic "claims" so two requests running at the same time (double-click,
 * client retry, timeout + retry) can't both create Shopify orders.
 *
 * Each claim is a single conditional UPDATE: it only succeeds if the field is
 * still empty, so exactly one request wins.
 */

export const SUBMITTING = "SUBMITTING";
export const RELEASING = "RELEASING";

async function database() {
  const d = await db.getDb();
  if (!d) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  }
  return d;
}

function affectedRows(result: unknown): number {
  // drizzle mysql2 returns [ResultSetHeader, ...]
  const header = Array.isArray(result) ? result[0] : result;
  return Number((header as { affectedRows?: number })?.affectedRows ?? 0);
}

/** Claim an order for submit. Returns false if it was already submitted or is being submitted. */
export async function claimOrderForSubmit(orderId: number): Promise<boolean> {
  const d = await database();
  const result = await d
    .update(giftingOrders)
    .set({ shopifyParentDraftOrderId: SUBMITTING })
    .where(and(eq(giftingOrders.id, orderId), isNull(giftingOrders.shopifyParentDraftOrderId)));
  return affectedRows(result) === 1;
}

/** Undo a submit claim after a failure, so the customer can try again. */
export async function releaseSubmitClaim(orderId: number): Promise<void> {
  const d = await database();
  await d
    .update(giftingOrders)
    .set({ shopifyParentDraftOrderId: null })
    .where(and(eq(giftingOrders.id, orderId), eq(giftingOrders.shopifyParentDraftOrderId, SUBMITTING)));
}

/** Claim one recipient for fulfillment. Returns false if another request already has it. */
export async function claimRecipientForRelease(recipientId: number): Promise<boolean> {
  const d = await database();
  const result = await d
    .update(recipients)
    .set({ shopifyChildOrderId: RELEASING })
    .where(and(eq(recipients.id, recipientId), isNull(recipients.shopifyChildOrderId)));
  return affectedRows(result) === 1;
}

/** Undo a recipient claim after Shopify refused the order, so it can be retried. */
export async function releaseRecipientClaim(recipientId: number): Promise<void> {
  const d = await database();
  await d
    .update(recipients)
    .set({ shopifyChildOrderId: null })
    .where(and(eq(recipients.id, recipientId), eq(recipients.shopifyChildOrderId, RELEASING)));
}
