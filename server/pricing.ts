import { PRODUCTS, BASE_PRODUCTS } from "../shared/products";

/**
 * Server-side product pricing.
 *
 * The price charged comes ONLY from the catalog in shared/products.ts, never
 * from text the browser sends. A recipient's product is matched by SKU
 * (productVariantId) or by its exact catalog name. Anything else is rejected.
 *
 * The unit price is the dollar amount in the official catalog name (for
 * example "... - $69"), which is what the portal has always billed for
 * real catalog products. Where a catalog entry has no "$" in its name, its
 * `price` field is used.
 */

export interface CatalogEntry {
  name: string;
  sku: string;
  price: number;
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[–—]/g, "-") // en/em dash -> hyphen
    .replace(/\s+/g, " ")
    .trim();
}

function priceFromName(name: string, fallback: number): number {
  const match = name.match(/\$(\d+(?:\.\d{1,2})?)/);
  return match ? Number(match[1]) : fallback;
}

const CATALOG: CatalogEntry[] = [];

for (const p of PRODUCTS) {
  if (p.category === "logo_bar") continue;
  CATALOG.push({ name: p.name, sku: p.sku, price: priceFromName(p.name, p.price) });
}

for (const b of BASE_PRODUCTS) {
  const price = priceFromName(b.displayName, b.price);
  if (b.hasVariants) {
    CATALOG.push({ name: b.displayName, sku: b.dairySku, price });
    CATALOG.push({ name: `${b.displayName} - Vegan/Parve`, sku: b.parveSku, price });
  } else {
    CATALOG.push({ name: b.displayName, sku: b.parveSku || b.dairySku, price });
  }
}

const BY_NAME = new Map<string, CatalogEntry>();
const BY_SKU = new Map<string, CatalogEntry>();
for (const entry of CATALOG) {
  const nameKey = normalize(entry.name);
  if (!BY_NAME.has(nameKey)) BY_NAME.set(nameKey, entry);
  if (entry.sku) {
    const skuKey = normalize(entry.sku);
    if (!BY_SKU.has(skuKey)) BY_SKU.set(skuKey, entry);
  }
}

/** Find the catalog product for a recipient, or null if it isn't a real product. */
export function resolveCatalogProduct(
  productName?: string | null,
  productVariantId?: string | null,
): CatalogEntry | null {
  const bySku = productVariantId ? BY_SKU.get(normalize(productVariantId)) : undefined;
  const byName = productName
    ? BY_NAME.get(normalize(productName)) ?? BY_SKU.get(normalize(productName))
    : undefined;

  // If both point at real products, they must agree on SKU and price.
  if (bySku && byName && (bySku.sku !== byName.sku || bySku.price !== byName.price)) {
    return null;
  }
  return bySku ?? byName ?? null;
}
