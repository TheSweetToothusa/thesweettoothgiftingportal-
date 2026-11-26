import crypto from "crypto";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import type { TrpcContext } from "./_core/context";
import { getSessionCookieOptions } from "./_core/cookies";
import * as db from "./db";
import { recipients } from "../drizzle/schema";

/**
 * Order access control.
 *
 * Who may read or change a gifting order:
 * - an admin
 * - the logged-in user who created it (order.userId)
 * - for guest orders (userId is null): the browser that created it, which
 *   holds a signed per-order cookie set by giftingOrders.create
 *
 * The cookie is an HMAC of the order id, so it can't be guessed from the
 * (sequential) order id. No database column is needed.
 */

const COOKIE_PREFIX = "st_gift_order_";
const NINETY_DAYS_MS = 1000 * 60 * 60 * 24 * 90;

function accessSecret(): string {
  const secret = process.env.ORDER_ACCESS_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    // Fail closed: without a secret nobody but owners/admins gets in.
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Order access is not configured (set ORDER_ACCESS_SECRET).",
    });
  }
  return secret;
}

/** Throws if guest order access can't work (no secret configured). */
export function assertOrderAccessConfigured() {
  accessSecret();
}

function orderToken(orderId: number): string {
  return crypto
    .createHmac("sha256", accessSecret())
    .update(`gifting-order:${orderId}`)
    .digest("base64url");
}

function readCookie(ctx: TrpcContext, name: string): string | undefined {
  const header = ctx.req.headers.cookie;
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const eqIndex = part.indexOf("=");
    if (eqIndex < 0) continue;
    if (part.slice(0, eqIndex).trim() === name) {
      try {
        return decodeURIComponent(part.slice(eqIndex + 1).trim());
      } catch {
        return undefined;
      }
    }
  }
  return undefined;
}

function tokensMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

/** Give this browser access to a newly created order. */
export function grantOrderAccess(ctx: TrpcContext, orderId: number) {
  ctx.res.cookie(COOKIE_PREFIX + orderId, orderToken(orderId), {
    ...getSessionCookieOptions(ctx.req),
    maxAge: NINETY_DAYS_MS,
  });
}

/** Load an order, or throw NOT_FOUND / FORBIDDEN if the caller may not use it. */
export async function requireOrderAccess(ctx: TrpcContext, orderId: number) {
  const order = await db.getGiftingOrderById(orderId);
  if (!order) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
  }

  if (ctx.user?.role === "admin") return order;

  if (order.userId != null) {
    if (ctx.user?.id === order.userId) return order;
  } else {
    const token = readCookie(ctx, COOKIE_PREFIX + orderId);
    if (token && tokensMatch(token, orderToken(orderId))) return order;
  }

  // Same message as "not found" so order ids can't be probed.
  throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
}

/** Load a recipient's order and check access to it. Returns the order id. */
export async function requireRecipientAccess(ctx: TrpcContext, recipientId: number) {
  const database = await db.getDb();
  if (!database) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  }
  const rows = await database
    .select({ giftingOrderId: recipients.giftingOrderId })
    .from(recipients)
    .where(eq(recipients.id, recipientId))
    .limit(1);
  if (rows.length === 0) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Recipient not found" });
  }
  const order = await requireOrderAccess(ctx, rows[0].giftingOrderId);
  return order;
}
