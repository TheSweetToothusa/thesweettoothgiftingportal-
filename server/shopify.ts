import { ENV } from "./_core/env";
import { getDeliveryFee } from "../shared/localDeliveryPricing";

const SHOPIFY_STORE_URL = process.env.SHOPIFY_STORE_URL || "";
const SHOPIFY_API_TOKEN = process.env.SHOPIFY_API_TOKEN || "";
const SHOPIFY_API_VERSION = "2024-10";

interface ShopifyLineItem {
  title: string;
  quantity: number;
  price: string;
}

interface ShopifyAddress {
  first_name?: string;
  last_name?: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  province: string;
  zip: string;
  country: string;
  phone?: string;
}

interface DraftOrderInput {
  line_items: ShopifyLineItem[];
  customer?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
  shipping_address?: ShopifyAddress;
  billing_address?: ShopifyAddress;
  note?: string;
  tags?: string;
}

interface OrderInput {
  line_items: ShopifyLineItem[];
  customer?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
  shipping_address?: ShopifyAddress;
  shipping_line?: {
    code: string;
    title: string;
    price: string;
  };
  note?: string;
  note_attributes?: Array<{ name: string; value: string }>;
  tags?: string;
  financial_status?: string;
  send_receipt?: boolean;
  send_fulfillment_receipt?: boolean;
}

/**
 * Make a request to Shopify Admin API
 */
async function shopifyRequest(endpoint: string, method: string = "GET", body?: any) {
  const url = `https://${SHOPIFY_STORE_URL}/admin/api/${SHOPIFY_API_VERSION}/${endpoint}`;
  
  const headers: Record<string, string> = {
    "X-Shopify-Access-Token": SHOPIFY_API_TOKEN,
    "Content-Type": "application/json",
  };

  const options: RequestInit = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Shopify API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return await response.json();
}

/**
 * Create a parent draft order (for payment collection)
 * This is NOT submitted - it stays as a draft so you can send payment link
 */
export async function createParentDraftOrder(data: {
  senderName: string;
  senderEmail: string;
  senderPhone: string;
  senderCompany?: string;
  senderAddress?: string;
  giftFrom?: string;
  giftMessage?: string;
  deliveryDate?: string;
  recipients: Array<{
    recipientName: string;
    productName?: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zip: string;
    deliveryMethod?: string;
  }>;
}): Promise<{ draftOrderId: string; draftOrderNumber: string }> {
  // Calculate line items from recipients (products)
  const lineItems: ShopifyLineItem[] = data.recipients.map((recipient) => {
    // Extract price from product name (e.g., "Holiday Basket ($69.00)")
    const priceMatch = recipient.productName?.match(/\$(\d+\.?\d*)/);
    const price = priceMatch ? priceMatch[1] : "69.00";

    return {
      title: recipient.productName || "Gift Basket",
      quantity: 1,
      price: price,
    };
  });

  // Calculate delivery method summary and add delivery fees
  const deliverySummary = {
    local_delivery: 0,
    shipping: 0,
    store_pickup: 0,
    totalDeliveryFees: 0
  };
  
  data.recipients.forEach((recipient) => {
    const method = recipient.deliveryMethod || 'shipping';
    if (method === 'local_delivery') {
      deliverySummary.local_delivery++;
      const deliveryFee = getDeliveryFee(recipient.zip);
      if (deliveryFee) {
        deliverySummary.totalDeliveryFees += deliveryFee;
        lineItems.push({
          title: `Local Delivery - ${recipient.zip}`,
          quantity: 1,
          price: deliveryFee.toFixed(2),
        });
      }
    } else if (method === 'shipping') {
      deliverySummary.shipping++;
    } else if (method === 'store_pickup') {
      deliverySummary.store_pickup++;
    }
  });

  // Parse sender name
  const nameParts = data.senderName.split(" ");
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  const draftOrderInput: DraftOrderInput = {
    line_items: lineItems,
    customer: {
      first_name: firstName,
      last_name: lastName,
      email: data.senderEmail,
    },
    billing_address: data.senderAddress ? {
      first_name: firstName,
      last_name: lastName,
      company: data.senderCompany || undefined,
      address1: data.senderAddress,
      city: "Miami",
      province: "FL",
      zip: "33101",
      country: "US",
      phone: data.senderPhone,
    } : undefined,
    note: `Corporate Gift Order\nCompany: ${data.senderCompany || "N/A"}\nPhone: ${data.senderPhone}\nBilling Address: ${data.senderAddress || "N/A"}\n\nORDER SUMMARY:\nTotal Recipients: ${data.recipients.length}\n- Local Delivery: ${deliverySummary.local_delivery}\n- Shipping (UPS): ${deliverySummary.shipping}\n- Store Pickup: ${deliverySummary.store_pickup}\nTotal Delivery Fees: $${deliverySummary.totalDeliveryFees.toFixed(2)}${data.deliveryDate ? `\n\n📅 Delivery Date: ${data.deliveryDate}` : ''}${data.giftMessage ? `\n\n🎁 Gift Message: ${data.giftMessage}` : ''}${data.giftFrom ? `\n\nGift From: ${data.giftFrom}` : ''}\n\nThis is a parent draft order for payment collection.`,
    tags: "corporate-gift,parent-order",
  };

  const response = await shopifyRequest("draft_orders.json", "POST", {
    draft_order: draftOrderInput,
  });

  return {
    draftOrderId: response.draft_order.id.toString(),
    draftOrderNumber: response.draft_order.name || response.draft_order.id.toString(),
  };
}

/**
 * Create a child order at $0 (for fulfillment tracking in ShipStation)
 * These are REAL orders but at $0 so they flow through to ShipStation
 */
export async function createChildOrder(data: {
  recipientName: string;
  recipientEmail?: string;
  recipientPhone?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  productName?: string;
  customGiftMessage?: string;
  giftFrom?: string;
  deliveryMethod?: string;
  deliveryDate?: string;
  logoBar?: "none" | "small" | "large";
  parentDraftOrderId: string;
  senderCompany?: string;
}): Promise<{ orderId: string; orderNumber: string }> {
  // Parse recipient name
  const nameParts = data.recipientName.split(" ");
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  // DEBUG: Log what data we received
  console.log(`[createChildOrder] Recipient: ${data.recipientName}`);
  console.log(`[createChildOrder] deliveryDate: "${data.deliveryDate}"`);
  console.log(`[createChildOrder] customGiftMessage: "${data.customGiftMessage}"`);
  console.log(`[createChildOrder] giftFrom: "${data.giftFrom}"`);
  console.log(`[createChildOrder] deliveryMethod: "${data.deliveryMethod}"`);

  // Build note_attributes for gift card printing and delivery tracking
  // Format MUST match screenshot exactly for LionWheel integration
  const noteAttributes: Array<{ name: string; value: string }> = [];

  // 👤 Recipient Name
  noteAttributes.push({ name: "👤 Recipient Name", value: data.recipientName });

  // 📍 Delivery Address
  const fullAddress = `${data.address1}${data.address2 ? ', ' + data.address2 : ''}, ${data.city}, ${data.state} ${data.zip}`;
  noteAttributes.push({ name: "📍 Delivery Address", value: fullAddress });

  // 📞 Phone Number
  if (data.recipientPhone) {
    noteAttributes.push({ name: "📞 Phone Number", value: data.recipientPhone });
  }

  // 🏢 Company (if applicable)
  if (data.senderCompany) {
    noteAttributes.push({ name: "🏢 Company", value: data.senderCompany });
  }

  // 📅 Delivery Date (format: Nov 15, 2025)
  if (data.deliveryDate) {
    // data.deliveryDate is in format "YYYY-MM-DD" from formatDateLocal
    // Parse it as a local date, not UTC
    const [year, month, day] = data.deliveryDate.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed
    const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    noteAttributes.push({ name: "📅 Delivery Date", value: formattedDate });
    console.log(`[createChildOrder] Added Delivery Date: ${formattedDate} (from ${data.deliveryDate})`);
    
    // Delivery Day (format: Saturday)
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    noteAttributes.push({ name: "Delivery Day", value: dayName });
    console.log(`[createChildOrder] Added Delivery Day: ${dayName}`);
  } else {
    console.log(`[createChildOrder] NO DELIVERY DATE PROVIDED`);
  }

  // 📦 Delivery Method (format: local_delivery, shipping, store_pickup)
  if (data.deliveryMethod) {
    noteAttributes.push({ name: "📦 Delivery method", value: data.deliveryMethod });
  }

  // Gift Wrap (always yes for corporate gifts)
  noteAttributes.push({ name: "Gift Wrap", value: "yes" });

  // 🎁 Gift Message (the actual message content)
  if (data.customGiftMessage) {
    noteAttributes.push({ name: "🎁 Gift message", value: data.customGiftMessage });
    console.log(`[createChildOrder] Added Gift Message: ${data.customGiftMessage}`);
  } else {
    console.log(`[createChildOrder] NO GIFT MESSAGE PROVIDED`);
  }

  // Gift Sender (who sent the gift)
  if (data.giftFrom) {
    noteAttributes.push({ name: "Gift Sender", value: data.giftFrom });
  }

  // Gift Receiver (recipient name)
  noteAttributes.push({ name: "Gift Receiver", value: data.recipientName });
  
  // Parent order reference for tracking
  noteAttributes.push({ name: "Parent Draft Order", value: data.parentDraftOrderId });

  // Build line items - product at $0 + delivery fee if applicable
  const lineItems: Array<{ title: string; quantity: number; price: string }> = [
    {
      title: data.productName || "Gift Basket",
      quantity: 1,
      price: "0.00", // $0 so it goes to ShipStation but doesn't charge
    },
  ];

  // 🎨 Logo Bar Type (if selected)
  if (data.logoBar && data.logoBar !== "none") {
    const logoBarSize = data.logoBar === "small" ? "Small (+$8)" : "Large (+$20)";
    noteAttributes.push({ name: "🎨 Logo Bar", value: logoBarSize });
    
    const logoBarPrice = data.logoBar === "small" ? "8.00" : "20.00";
    const logoBarTitle = data.logoBar === "small" ? "Logo Chocolate Bar - Small" : "Logo Chocolate Bar - Large";
    lineItems.push({
      title: logoBarTitle,
      quantity: 1,
      price: logoBarPrice,
    });
    console.log(`[createChildOrder] Added Logo Bar: ${logoBarTitle} ($${logoBarPrice})`);
  }

  // 💵 Product Name
  if (data.productName) {
    noteAttributes.push({ name: "💵 Product", value: data.productName });
  }

  // Add delivery fee line item for local delivery with ACTUAL AMOUNT for LionWheel
  if (data.deliveryMethod === 'local_delivery') {
    const deliveryFee = getDeliveryFee(data.zip);
    if (deliveryFee) {
      lineItems.push({
        title: `Local Delivery Fee - ${data.zip}`,
        quantity: 1,
        price: deliveryFee.toFixed(2), // ACTUAL fee amount for LionWheel integration
      });
    }
  }

  // Determine shipping_line based on delivery method
  let shippingLine: { code: string; title: string; price: string } | undefined;
  
  if (data.deliveryMethod === 'local_delivery') {
    shippingLine = {
      code: "LOCAL_DELIVERY",
      title: "Local delivery",
      price: "0.00"
    };
  } else if (data.deliveryMethod === 'store_pickup') {
    shippingLine = {
      code: "PICKUP",
      title: "In-Store Pickup",
      price: "0.00"
    };
  } else {
    // Default to shipping (UPS)
    shippingLine = {
      code: "SHIPPING",
      title: "Shipping",
      price: "0.00"
    };
  }

  const orderInput: OrderInput = {
    line_items: lineItems,
    customer: {
      first_name: firstName,
      last_name: lastName,
      email: data.recipientEmail || "",
    },
    shipping_address: {
      first_name: firstName,
      last_name: lastName,
      company: data.senderCompany || undefined,
      address1: data.address1,
      address2: data.address2,
      city: data.city,
      province: data.state,
      zip: data.zip,
      country: "US",
      phone: data.recipientPhone,
    },
    shipping_line: shippingLine,
    note: data.customGiftMessage || "",
    note_attributes: noteAttributes,
    tags: `corporate-gift,child-order,parent-draft-${data.parentDraftOrderId},delivery:${data.deliveryMethod || 'shipping'}`,
    financial_status: "paid", // Mark as paid since it's $0
    send_receipt: false,
    send_fulfillment_receipt: false,
  };

  const response = await shopifyRequest("orders.json", "POST", {
    order: orderInput,
  });

  return {
    orderId: response.order.id.toString(),
    orderNumber: response.order.name || response.order.order_number.toString(),
  };
}

/**
 * Create all orders for a gifting batch:
 * 1. One parent draft order (for payment)
 * 2. Multiple child orders at $0 (for fulfillment)
 */
export async function createGiftingOrders(data: {
  senderName: string;
  senderEmail: string;
  senderPhone: string;
  senderCompany?: string;
  senderAddress?: string;
  giftFrom?: string;
  giftMessage?: string;
  deliveryDate?: string;
  recipients: Array<{
    id: number;
    recipientName: string;
    recipientEmail?: string;
    recipientPhone?: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zip: string;
    productName?: string;
    customGiftMessage?: string;
    deliveryMethod?: string;
    deliveryDate?: string;
    logoBar?: "none" | "small" | "large";
  }>;
}): Promise<{
  parentDraftOrder: { id: string; number: string };
  childOrders: Array<{ recipientId: number; orderId: string; orderNumber: string }>;
}> {
  // Step 1: Create parent draft order
  const parentDraft = await createParentDraftOrder({
    senderName: data.senderName,
    senderEmail: data.senderEmail,
    senderPhone: data.senderPhone,
    senderCompany: data.senderCompany,
    senderAddress: data.senderAddress,
    giftFrom: data.giftFrom,
    giftMessage: data.giftMessage,
    deliveryDate: data.deliveryDate,
    recipients: data.recipients,
  });

  // Step 2: Create child orders for each recipient
  const childOrders: Array<{ recipientId: number; orderId: string; orderNumber: string }> = [];
  
  for (const recipient of data.recipients) {
    try {
      const childOrder = await createChildOrder({
        recipientName: recipient.recipientName,
        recipientEmail: recipient.recipientEmail,
        recipientPhone: recipient.recipientPhone,
        address1: recipient.address1,
        address2: recipient.address2,
        city: recipient.city,
        state: recipient.state,
        zip: recipient.zip,
        productName: recipient.productName,
        customGiftMessage: recipient.customGiftMessage,
        giftFrom: data.giftFrom,
        deliveryMethod: recipient.deliveryMethod,
        deliveryDate: recipient.deliveryDate,
        logoBar: recipient.logoBar,
        parentDraftOrderId: parentDraft.draftOrderId,
        senderCompany: data.senderCompany,
      });

      childOrders.push({
        recipientId: recipient.id,
        orderId: childOrder.orderId,
        orderNumber: childOrder.orderNumber,
      });
    } catch (error) {
      console.error(`Failed to create child order for recipient ${recipient.id}:`, error);
      // Continue with other recipients even if one fails
    }
  }

  return {
    parentDraftOrder: {
      id: parentDraft.draftOrderId,
      number: parentDraft.draftOrderNumber,
    },
    childOrders,
  };
}
