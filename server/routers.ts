import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { assertOrderAccessConfigured, grantOrderAccess, requireOrderAccess, requireRecipientAccess } from "./orderAccess";
import { claimOrderForSubmit, releaseSubmitClaim, claimRecipientForRelease, releaseRecipientClaim } from "./orderLocks";
import { resolveCatalogProduct } from "./pricing";
import * as db from "./db";
import * as shopify from "./shopify";
import { validateAddress } from "./_core/addressValidation";
import { addressValidationRouter } from "./routers/addressValidation";

/**
 * Format date to YYYY-MM-DD using local timezone (not UTC)
 * Prevents date shifting when converting to ISO string
 */
function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const formatted = `${year}-${month}-${day}`;
  console.log(`[formatDateLocal] Input: ${date.toISOString()} → Output: ${formatted}`);
  return formatted;
}

/** Block recipient changes once the order has been sent to Shopify. */
function assertOrderEditable(order: { shopifyParentDraftOrderId: string | null }) {
  if (order.shopifyParentDraftOrderId) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "This order was already submitted. Contact The Sweet Tooth to make changes.",
    });
  }
}

export const appRouter = router({
  system: systemRouter,
  addressValidation: addressValidationRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  giftingOrders: router({
    // Create a new gifting order with sender info
    create: publicProcedure
      .input(z.object({
        senderName: z.string().min(1),
        senderEmail: z.string().email(),
        senderPhone: z.string().min(1),
        senderCompany: z.string().optional(),
        senderAddress: z.string().optional(),
        globalGiftMessage: z.string().optional(),
        globalDeliveryDate: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Check config first so a missing secret doesn't leave an orphan order.
        assertOrderAccessConfigured();
        const orderId = await db.createGiftingOrder({
          userId: ctx.user?.id || null,
          senderName: input.senderName,
          senderEmail: input.senderEmail,
          senderPhone: input.senderPhone,
          senderCompany: input.senderCompany,
          senderAddress: input.senderAddress,
          globalGiftMessage: input.globalGiftMessage,
          globalDeliveryDate: input.globalDeliveryDate ? new Date(input.globalDeliveryDate) : undefined,
          status: "draft",
          // Logo bar defaults (user can change later)
          wantsLogoBar: "no",
          logoBarSize: "small",
          logoBarChocolateType: "white",
          // Mark Step 1 as complete
          completedStep1: true,
        } as any);

        // Let this browser keep working on its own order (guest checkout).
        grantOrderAccess(ctx, orderId);

        return { orderId };
      }),

    // Get user's gifting orders
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserGiftingOrders(ctx.user.id);
    }),

    // Get a specific order with recipients
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const order = await requireOrderAccess(ctx, input.id);
        
        const recipientList = await db.getRecipientsByOrderId(input.id);
        
        return {
          ...order,
          recipients: recipientList,
        };
      }),

    // Update order settings
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        globalGiftMessage: z.string().optional(),
        globalDeliveryDate: z.string().optional(),
        giftMessageFont: z.string().optional(),
        giftMessageFontSize: z.string().optional(),
        status: z.enum(["draft", "validated", "submitted", "completed"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const order = await requireOrderAccess(ctx, input.id);
        // After submit, the message, date and font are what's been invoiced and
        // will be printed/shipped, so they can't change here any more.
        if (
          input.globalGiftMessage !== undefined ||
          input.globalDeliveryDate !== undefined ||
          input.giftMessageFont !== undefined ||
          input.giftMessageFontSize !== undefined
        ) {
          assertOrderEditable(order);
        }
        const updates: any = {};
        if (input.globalGiftMessage !== undefined) updates.globalGiftMessage = input.globalGiftMessage;
        if (input.globalDeliveryDate !== undefined) updates.globalDeliveryDate = new Date(input.globalDeliveryDate);
        if (input.giftMessageFont !== undefined) updates.giftMessageFont = input.giftMessageFont;
        if (input.giftMessageFontSize !== undefined) updates.giftMessageFontSize = input.giftMessageFontSize;
        if (input.status !== undefined) {
          updates.status = input.status;
          // Mark Step 5 complete when status is validated
          if (input.status === "validated") {
            updates.completedStep5 = true;
          }
        }
        
        await db.updateGiftingOrder(input.id, updates);
        return { success: true };
      }),

    // Update delivery date
    updateDeliveryDate: publicProcedure
      .input(z.object({
        orderId: z.number(),
        deliveryDate: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const order = await requireOrderAccess(ctx, input.orderId);
        assertOrderEditable(order);
        await db.updateGiftingOrder(input.orderId, {
          globalDeliveryDate: new Date(input.deliveryDate),
          completedStep2: true,
        } as any);
        return { success: true };
      }),

    // Update logo bar selection
    updateLogoBarSelection: publicProcedure
      .input(z.object({
        orderId: z.number(),
        wantsLogoBar: z.enum(["yes", "no"]),
        logoBarSize: z.enum(["small", "large"]).optional(),
        logoBarChocolateType: z.enum(["milk", "white", "dark", "vegan_parve"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const order = await requireOrderAccess(ctx, input.orderId);
        assertOrderEditable(order);
        const updates: any = {
          wantsLogoBar: input.wantsLogoBar,
          completedStep4: true, // Mark Step 4 complete when logo bar selection is made
        };
        if (input.logoBarSize) updates.logoBarSize = input.logoBarSize;
        if (input.logoBarChocolateType) updates.logoBarChocolateType = input.logoBarChocolateType;
        
        await db.updateGiftingOrder(input.orderId, updates);
        return { success: true };
      }),

    // Step 1 of checkout: create the Shopify parent draft order (the invoice).
    // No fulfillment orders are created here. They are created by
    // releaseFulfillment only after the invoice is paid.
    createDraftOrders: publicProcedure
      .input(z.object({ orderId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const order = await requireOrderAccess(ctx, input.orderId);

        // Never create a second invoice for the same order (double-click, retry).
        if (order.shopifyParentDraftOrderId) {
          throw new TRPCError({ code: "CONFLICT", message: "This order was already submitted." });
        }

        const recipients = await db.getRecipientsByOrderId(input.orderId);
        if (recipients.length === 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "No recipients found for this order" });
        }

        // Price every gift from the catalog on the server. Reject unknown products.
        const unknown: string[] = [];
        const priced = recipients.map(r => {
          const product = resolveCatalogProduct(r.productName, r.productVariantId);
          if (!product) unknown.push(`${r.recipientName} (${r.productName || "no product"})`);
          return { r, product };
        });
        if (unknown.length > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `These recipients don't have a valid product: ${unknown.join("; ")}`,
          });
        }

        // Atomic claim: if two submits run at once, only one gets past here.
        if (!(await claimOrderForSubmit(input.orderId))) {
          throw new TRPCError({ code: "CONFLICT", message: "This order was already submitted." });
        }

        let parentDraft: { draftOrderId: string; draftOrderNumber: string };
        try {
          // Store the catalog name so fulfillment orders show the real product.
          for (const { r, product } of priced) {
            if (r.productName !== product!.name) {
              await db.updateRecipient(r.id, { productName: product!.name });
            }
          }

          parentDraft = await shopify.createParentDraftOrder({
          senderName: order.senderName,
          senderEmail: order.senderEmail,
          senderPhone: order.senderPhone,
          senderCompany: order.senderCompany || undefined,
          senderAddress: order.senderAddress || undefined,
          giftMessage: order.globalGiftMessage || undefined,
          deliveryDate: order.globalDeliveryDate ? formatDateLocal(order.globalDeliveryDate) : undefined,
          recipients: priced.map(({ r, product }) => ({
            recipientName: r.recipientName,
            address1: r.address1,
            address2: r.address2 || undefined,
            city: r.city,
            state: r.state,
            zip: r.zip,
            deliveryMethod: r.deliveryMethod || undefined,
            productName: product!.name,
            unitPrice: product!.price,
          })),
          });
        } catch (error) {
          // Nothing was created in Shopify, so let the customer try again.
          await releaseSubmitClaim(input.orderId);
          throw error;
        }

        await db.updateGiftingOrder(input.orderId, {
          shopifyParentDraftOrderId: parentDraft.draftOrderId,
          status: "submitted",
        });

        return {
          success: true,
          parentDraftOrder: { id: parentDraft.draftOrderId, number: parentDraft.draftOrderNumber },
          childOrderCount: 0,
        };
      }),

    // Step 2 of checkout: once the invoice is PAID in Shopify, create the
    // $0 fulfillment orders that go to ShipStation / local delivery.
    // Safe to call again: recipients that already have an order are skipped.
    // Admins can pass overridePayment for customers on payment terms.
    releaseFulfillment: publicProcedure
      .input(z.object({ orderId: z.number(), overridePayment: z.boolean().optional() }))
      .mutation(async ({ ctx, input }) => {
        const order = await requireOrderAccess(ctx, input.orderId);
        const parentDraftOrderId = order.shopifyParentDraftOrderId;
        if (!parentDraftOrderId || parentDraftOrderId === "SUBMITTING") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "This order hasn't been submitted yet." });
        }

        const isAdmin = ctx.user?.role === "admin";
        if (input.overridePayment && !isAdmin) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only staff can release unpaid orders." });
        }

        const payment = await shopify.getDraftOrderPaymentStatus(parentDraftOrderId);
        if (!payment.paid && !input.overridePayment) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: `The invoice isn't paid yet (draft: ${payment.draftStatus}, payment: ${payment.financialStatus ?? "none"}).`,
          });
        }

        const allRecipients = await db.getRecipientsByOrderId(input.orderId);

        // Atomic claim per recipient: if two releases run at once, each gift
        // is created by only one of them.
        const pending: typeof allRecipients = [];
        for (const r of allRecipients) {
          if (!r.shopifyChildOrderId && (await claimRecipientForRelease(r.id))) {
            pending.push(r);
          }
        }

        const result = await shopify.createFulfillmentOrders({
          parentDraftOrderId,
          senderCompany: order.senderCompany || undefined,
          recipients: pending.map(r => ({
            id: r.id,
            recipientName: r.recipientName,
            recipientEmail: r.recipientEmail || undefined,
            recipientPhone: r.recipientPhone || undefined,
            address1: r.address1,
            address2: r.address2 || undefined,
            city: r.city,
            state: r.state,
            zip: r.zip,
            productName: r.productName || undefined,
            customGiftMessage: r.customGiftMessage || order.globalGiftMessage || undefined,
            deliveryMethod: r.deliveryMethod || undefined,
            deliveryDate: order.globalDeliveryDate ? formatDateLocal(order.globalDeliveryDate) : undefined,
          })),
        });

        for (const childOrder of result.childOrders) {
          await db.updateRecipient(childOrder.recipientId, {
            shopifyChildOrderId: childOrder.orderId,
          });
        }
        // Shopify refused these, so free them up for a retry.
        for (const failedId of result.failedRecipientIds) {
          await releaseRecipientClaim(failedId);
        }

        return {
          success: result.failedRecipientIds.length === 0,
          createdCount: result.childOrders.length,
          alreadyReleasedCount: allRecipients.length - pending.length,
          paymentOverridden: !payment.paid,
          failedRecipientIds: result.failedRecipientIds,
        };
      }),
  }),

  recipients: router({
    // Add a single recipient (for manual entry)
    create: publicProcedure
      .input(z.object({
        giftingOrderId: z.number(),
        recipientName: z.string().min(1),
        recipientEmail: z.string().email().optional(),
        recipientPhone: z.string().optional(),
        address1: z.string().min(1),
        address2: z.string().optional(),
        city: z.string().min(1),
        state: z.string().min(1),
        zip: z.string().min(1),
        deliveryDate: z.string(),
        deliveryMethod: z.enum(["local_delivery", "shipping", "store_pickup"]).optional(),
        deliveryInstructions: z.string().optional(),
        customGiftMessage: z.string().optional(),
        productVariantId: z.string().optional(),
        productName: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const order = await requireOrderAccess(ctx, input.giftingOrderId);
        assertOrderEditable(order);
        const recipientData = {
          giftingOrderId: input.giftingOrderId,
          recipientName: input.recipientName,
          recipientEmail: input.recipientEmail,
          recipientPhone: input.recipientPhone,
          address1: input.address1,
          address2: input.address2,
          city: input.city,
          state: input.state,
          zip: input.zip,
          deliveryDate: new Date(input.deliveryDate),
          deliveryMethod: input.deliveryMethod || "shipping",
          deliveryInstructions: input.deliveryInstructions,
          customGiftMessage: input.customGiftMessage,
          productVariantId: input.productVariantId,
          productName: input.productName,
          validationStatus: "valid" as const,
        };
        
        await db.createRecipients([recipientData]);
        
        // Mark Step 3 complete (at least one recipient added)
        await db.updateGiftingOrder(input.giftingOrderId, {
          completedStep3: true,
        } as any);
        
        return { success: true };
      }),

    // Add recipients to an order
    addBatch: publicProcedure
      .input(z.object({
        giftingOrderId: z.number(),
        recipients: z.array(z.object({
          recipientName: z.string().min(1),
          recipientEmail: z.string().email().optional(),
          recipientPhone: z.string().optional(),
          address1: z.string().min(1),
          address2: z.string().optional(),
          city: z.string().min(1),
          state: z.string().min(1),
          zip: z.string().min(1),
          deliveryDate: z.string(),
          deliveryMethod: z.enum(["local_delivery", "shipping", "store_pickup"]).optional(),
          deliveryInstructions: z.string().optional(),
          customGiftMessage: z.string().optional(),
          productVariantId: z.string().optional(),
          productName: z.string().optional(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        const order = await requireOrderAccess(ctx, input.giftingOrderId);
        assertOrderEditable(order);
        const recipientData = input.recipients.map(r => ({
          giftingOrderId: input.giftingOrderId,
          recipientName: r.recipientName,
          recipientEmail: r.recipientEmail,
          recipientPhone: r.recipientPhone,
          address1: r.address1,
          address2: r.address2,
          city: r.city,
          state: r.state,
          zip: r.zip,
          deliveryDate: new Date(r.deliveryDate),
          deliveryMethod: r.deliveryMethod,
          deliveryInstructions: r.deliveryInstructions,
          customGiftMessage: r.customGiftMessage,
          productVariantId: r.productVariantId,
          productName: r.productName,
        }));
        
        await db.createRecipients(recipientData);
        
        // Mark Step 3 complete (at least one recipient added)
        await db.updateGiftingOrder(input.giftingOrderId, {
          completedStep3: true,
        } as any);
        
        return { success: true, count: recipientData.length };
      }),

    // Update a recipient
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        recipientName: z.string().optional(),
        address1: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zip: z.string().optional(),
        deliveryDate: z.string().optional(),
        customGiftMessage: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const order = await requireRecipientAccess(ctx, input.id);
        assertOrderEditable(order);
        const { id, ...updates } = input;
        const dbUpdates: any = {};
        
        Object.entries(updates).forEach(([key, value]) => {
          if (value !== undefined) {
            if (key === 'deliveryDate') {
              dbUpdates[key] = new Date(value);
            } else {
              dbUpdates[key] = value;
            }
          }
        });
        
        await db.updateRecipient(id, dbUpdates);
        return { success: true };
      }),

    // Delete a recipient
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const order = await requireRecipientAccess(ctx, input.id);
        assertOrderEditable(order);
        await db.deleteRecipient(input.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;

