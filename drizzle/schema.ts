import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Gifting orders - represents a batch of gifts from one sender to multiple recipients
 */
export const giftingOrders = mysqlTable("giftingOrders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"), // Who created this order (null for guest checkout)
  
  // Parent/Sender information (the gift giver)
  senderName: varchar("senderName", { length: 255 }).notNull(),
  senderEmail: varchar("senderEmail", { length: 320 }).notNull(),
  senderPhone: varchar("senderPhone", { length: 50 }).notNull(),
  senderCompany: varchar("senderCompany", { length: 255 }),
  senderAddress: text("senderAddress"),
  
  // Global settings for this batch
  globalGiftMessage: text("globalGiftMessage"),
  globalDeliveryDate: timestamp("globalDeliveryDate"),
  giftMessageFont: varchar("giftMessageFont", { length: 100 }).default("Arial"),
  giftMessageFontSize: varchar("giftMessageFontSize", { length: 10 }).default("16"),
  
  // Logo bar settings (applied to all recipients)
  wantsLogoBar: mysqlEnum("wantsLogoBar", ["yes", "no"]).default("no"),
  logoBarSize: mysqlEnum("logoBarSize", ["small", "large"]).default("small"),
  logoBarChocolateType: mysqlEnum("logoBarChocolateType", ["milk", "white", "dark", "vegan_parve"]).default("white"),
  
  // Shopify integration
  shopifyParentDraftOrderId: varchar("shopifyParentDraftOrderId", { length: 100 }),
  
  // Status tracking
  status: mysqlEnum("status", ["draft", "validated", "submitted", "completed"]).default("draft").notNull(),
  
  // Progress tracking (which steps have been completed)
  completedStep1: boolean("completedStep1").default(false).notNull(), // Gift Sender Info
  completedStep2: boolean("completedStep2").default(false).notNull(), // Schedule & Fulfill
  completedStep3: boolean("completedStep3").default(false).notNull(), // Add Recipients
  completedStep4: boolean("completedStep4").default(false).notNull(), // Select Products
  completedStep5: boolean("completedStep5").default(false).notNull(), // Review & Finalize
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GiftingOrder = typeof giftingOrders.$inferSelect;
export type InsertGiftingOrder = typeof giftingOrders.$inferInsert;

/**
 * Recipients - individual gift recipients within a gifting order
 */
export const recipients = mysqlTable("recipients", {
  id: int("id").autoincrement().primaryKey(),
  giftingOrderId: int("giftingOrderId").notNull(), // Links to parent order
  
  // Recipient information
  recipientName: varchar("recipientName", { length: 255 }).notNull(),
  recipientEmail: varchar("recipientEmail", { length: 320 }),
  recipientPhone: varchar("recipientPhone", { length: 50 }),
  recipientCompany: varchar("recipientCompany", { length: 255 }),
  
  // Address (required)
  address1: varchar("address1", { length: 255 }).notNull(),
  address2: varchar("address2", { length: 255 }),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 50 }).notNull(),
  zip: varchar("zip", { length: 20 }).notNull(),
  country: varchar("country", { length: 2 }).default("US").notNull(),
  
  // Product and delivery
  productVariantId: varchar("productVariantId", { length: 100 }),
  productName: varchar("productName", { length: 255 }),
  deliveryDate: timestamp("deliveryDate").notNull(),
  deliveryMethod: mysqlEnum("deliveryMethod", ["local_delivery", "shipping", "store_pickup"]).default("local_delivery"),
  deliveryInstructions: text("deliveryInstructions"),
  
  // Gift message (can override global)
  customGiftMessage: text("customGiftMessage"),
  
  // Logo chocolate bar option
  logoBar: mysqlEnum("logoBar", ["none", "small", "large"]).default("none"),
  logoBarChocolateType: mysqlEnum("logoBarChocolateType", ["milk", "white", "dark", "vegan_parve"]).default("white"),
  
  // Validation status
  validationStatus: mysqlEnum("validationStatus", ["valid", "warning", "error"]).default("valid"),
  validationErrors: text("validationErrors"), // JSON array of error messages
  
  // Shopify integration
  shopifyChildOrderId: varchar("shopifyChildOrderId", { length: 100 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Recipient = typeof recipients.$inferSelect;
export type InsertRecipient = typeof recipients.$inferInsert;

