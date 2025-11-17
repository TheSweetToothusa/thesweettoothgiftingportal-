import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
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
        
        return { orderId };
      }),

    // Get user's gifting orders
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserGiftingOrders(ctx.user.id);
    }),

    // Get a specific order with recipients
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const order = await db.getGiftingOrderById(input.id);
        if (!order) return null;
        
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
      .mutation(async ({ input }) => {
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
      .mutation(async ({ input }) => {
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
      .mutation(async ({ input }) => {
        const updates: any = {
          wantsLogoBar: input.wantsLogoBar,
          completedStep4: true, // Mark Step 4 complete when logo bar selection is made
        };
        if (input.logoBarSize) updates.logoBarSize = input.logoBarSize;
        if (input.logoBarChocolateType) updates.logoBarChocolateType = input.logoBarChocolateType;
        
        await db.updateGiftingOrder(input.orderId, updates);
        return { success: true };
      }),

    // Create Shopify draft orders
    createDraftOrders: publicProcedure
      .input(z.object({ orderId: z.number() }))
      .mutation(async ({ input }) => {
        // Get order and recipients
        const order = await db.getGiftingOrderById(input.orderId);
        if (!order) {
          throw new Error("Order not found");
        }

        const recipients = await db.getRecipientsByOrderId(input.orderId);
        if (recipients.length === 0) {
          throw new Error("No recipients found for this order");
        }

        // Create Shopify orders
        const result = await shopify.createGiftingOrders({
          senderName: order.senderName,
          senderEmail: order.senderEmail,
          senderPhone: order.senderPhone,
          senderCompany: order.senderCompany || undefined,
          senderAddress: order.senderAddress || undefined,
          giftMessage: order.globalGiftMessage || undefined,
          deliveryDate: order.globalDeliveryDate ? formatDateLocal(order.globalDeliveryDate) : undefined,
          recipients: recipients.map(r => ({
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

        // Update order with parent draft order ID
        await db.updateGiftingOrder(input.orderId, {
          shopifyParentDraftOrderId: result.parentDraftOrder.id,
          status: "submitted",
        });

        // Update recipients with child order IDs
        for (const childOrder of result.childOrders) {
          await db.updateRecipient(childOrder.recipientId, {
            shopifyChildOrderId: childOrder.orderId,
          });
        }

        return {
          success: true,
          parentDraftOrder: result.parentDraftOrder,
          childOrderCount: result.childOrders.length,
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
      .mutation(async ({ input }) => {
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
      .mutation(async ({ input }) => {
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
      .mutation(async ({ input }) => {
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
      .mutation(async ({ input }) => {
        await db.deleteRecipient(input.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;

