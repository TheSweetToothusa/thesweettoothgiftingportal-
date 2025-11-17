/**
 * Product catalog for 2025 Holiday Season
 * Source: SweetTooth_Dropdown_OneColumn.xlsx
 * 
 * IMPORTANT NOTES:
 * - Standard baskets contain DAIRY (white, milk, and dark chocolate mix)
 * - Vegan/Parve options are indented in dropdown and marked with "– Vegan/Parve"
 * - Sonny's Rugullach is ONLY available in Vegan/Parve
 */

export interface Product {
  name: string;
  price: number;
  sku: string;
  category: 'basket' | 'specialty' | 'logo_bar';
  isVegan?: boolean;
  numberOfTreats?: number;
  dimensions?: string;
  shape?: string;
  imageUrl: string;
}

/**
 * Full product list
 * Standard products are dairy by default
 * Vegan/Parve variants are marked with isVegan: true
 */
export const PRODUCTS: Product[] = [
  // BASKETS & TRAYS
  {
    name: "Holiday Chocolate-Dipped Pretzel & Oreo Tray - 10″ round - $39",
    price: 39.00,
    sku: "TST-25-SP-PRETZOREO",
    category: 'basket',
    imageUrl: "https://cdn.shopify.com/s/files/1/0559/8498/0141/files/corp_2025_pretzel_and_oreo_tray.jpg?v=1761590838"
  },
  {
    name: "Holiday Chocolate-Dipped Pretzel & Oreo Tray - 10″ round - $39 – Vegan/Parve",
    price: 39.00,
    sku: "TST-25-SP-PRETZOREO-V",
    category: 'basket',
    isVegan: true,
    imageUrl: "https://cdn.shopify.com/s/files/1/0559/8498/0141/files/corp_2025_pretzel_and_oreo_tray.jpg?v=1761590838"
  },
  
  {
    name: "Holiday Favorites Round Basket - 10″ round - $69",
    price: 69.00,
    sku: "ST-25-CB-SMROUND",
    category: 'basket',
    imageUrl: "https://cdn.shopify.com/s/files/1/0559/8498/0141/files/SMALLROUND-Corp_holidays.jpg?v=1761589268"
  },
  {
    name: "Holiday Favorites Round Basket - 10″ round - $69 – Vegan/Parve",
    price: 69.00,
    sku: "ST-25-CB-SMROUND-V",
    category: 'basket',
    isVegan: true,
    imageUrl: "https://cdn.shopify.com/s/files/1/0559/8498/0141/files/SMALLROUND-Corp_holidays.jpg?v=1761589268"
  },
  
  {
    name: "Classic Holiday Round Basket - 12″ round - $89",
    price: 89.00,
    sku: "ST-25-CB-MEDRECT",
    category: 'basket',
    numberOfTreats: 40,
    dimensions: "12 inches",
    shape: "Round",
    imageUrl: "https://cdn.shopify.com/s/files/1/0559/8498/0141/files/MediumRectangle.jpg?v=1761589581"
  },
  {
    name: "Classic Holiday Round Basket - 12″ round - $89 – Vegan/Parve",
    price: 89.00,
    sku: "ST-25-CB-MEDRECT-V",
    category: 'basket',
    isVegan: true,
    numberOfTreats: 40,
    dimensions: "12 inches",
    shape: "Round",
    imageUrl: "https://cdn.shopify.com/s/files/1/0559/8498/0141/files/MediumRectangle.jpg?v=1761589581"
  },
  
  {
    name: "Holiday Indulgence Wood Tray - $109",
    price: 109.00,
    sku: "TST-25-SP-INDULGTRAY",
    category: 'basket',
    imageUrl: "https://cdn.shopify.com/s/files/1/0559/8498/0141/files/Screenshot2025-10-27at8.11.31PM.png?v=1761610632"
  },
  {
    name: "Holiday Indulgence Wood Tray - $109 – Vegan/Parve",
    price: 109.00,
    sku: "TST-25-SP-INDULGTRAY-V",
    category: 'basket',
    isVegan: true,
    imageUrl: "https://cdn.shopify.com/s/files/1/0559/8498/0141/files/Screenshot2025-10-27at8.11.31PM.png?v=1761610632"
  },
  
  {
    name: "Grand Holiday Oval Basket - 15″ oval - $129",
    price: 129.00,
    sku: "HOL25-OVAL-L60",
    category: 'basket',
    numberOfTreats: 60,
    dimensions: "15 inches",
    shape: "Oval",
    imageUrl: "https://cdn.shopify.com/s/files/1/0559/8498/0141/files/LARGEOVAL-JustBecause1.jpg?v=1761589682"
  },
  {
    name: "Grand Holiday Oval Basket - 15″ oval - $129 – Vegan/Parve",
    price: 129.00,
    sku: "HOL25-OVAL-L60-V",
    category: 'basket',
    isVegan: true,
    numberOfTreats: 60,
    dimensions: "15 inches",
    shape: "Oval",
    imageUrl: "https://cdn.shopify.com/s/files/1/0559/8498/0141/files/LARGEOVAL-JustBecause1.jpg?v=1761589682"
  },
  
  {
    name: "Deluxe Holiday Round Basket - 18″ round - $179",
    price: 179.00,
    sku: "ST-25-CB-XLARGE",
    category: 'basket',
    numberOfTreats: 99,
    dimensions: "18 inches",
    shape: "Round",
    imageUrl: "https://cdn.shopify.com/s/files/1/0559/8498/0141/files/EXTRA_LARGE_-_Just_Because.jpg?v=1761589750"
  },
  {
    name: "Deluxe Holiday Round Basket - 18″ round - $179 – Vegan/Parve",
    price: 179.00,
    sku: "ST-25-CB-XLARGE-V",
    category: 'basket',
    isVegan: true,
    numberOfTreats: 99,
    dimensions: "18 inches",
    shape: "Round",
    imageUrl: "https://cdn.shopify.com/s/files/1/0559/8498/0141/files/EXTRA_LARGE_-_Just_Because.jpg?v=1761589750"
  },
  
  {
    name: "Prestige Holiday Oval Basket - 20″ oval - $209",
    price: 209.00,
    sku: "ST-25-CB-GIANTOVAL",
    category: 'basket',
    numberOfTreats: 126,
    dimensions: "20 inches",
    shape: "Oval",
    imageUrl: "https://cdn.shopify.com/s/files/1/0559/8498/0141/files/Thank_you_chocolate_gift_basket.png?v=1761690880"
  },
  {
    name: "Prestige Holiday Oval Basket - 20″ oval - $209 – Vegan/Parve",
    price: 209.00,
    sku: "ST-25-CB-GIANTOVAL-V",
    category: 'basket',
    isVegan: true,
    numberOfTreats: 126,
    dimensions: "20 inches",
    shape: "Oval",
    imageUrl: "https://cdn.shopify.com/s/files/1/0559/8498/0141/files/Thank_you_chocolate_gift_basket.png?v=1761690880"
  },
  
  {
    name: "Premier Holiday Rectangle Basket - 24.5″ rectangle - $279",
    price: 269.00,
    sku: "ST-25-CB-JUMBRECT",
    category: 'basket',
    numberOfTreats: 250,
    dimensions: "24.5 inches",
    shape: "Rectangular",
    imageUrl: "https://cdn.shopify.com/s/files/1/0559/8498/0141/files/JUMBORectangle-Congratulations.jpg?v=1761589949"
  },
  {
    name: "Premier Holiday Rectangle Basket - 24.5″ rectangle - $279 – Vegan/Parve",
    price: 269.00,
    sku: "ST-25-CB-JUMBRECT-V",
    category: 'basket',
    isVegan: true,
    numberOfTreats: 250,
    dimensions: "24.5 inches",
    shape: "Rectangular",
    imageUrl: "https://cdn.shopify.com/s/files/1/0559/8498/0141/files/JUMBORectangle-Congratulations.jpg?v=1761589949"
  },
  
  {
    name: "Majestic Holiday Round Basket - 24″ round - $399",
    price: 399.00,
    sku: "ST-25-CB-PENULT",
    category: 'basket',
    numberOfTreats: 330,
    dimensions: "24 inches",
    shape: "Round",
    imageUrl: "https://cdn.shopify.com/s/files/1/0559/8498/0141/files/PENULTIMATE-JustBecause.png?v=1761590010"
  },
  {
    name: "Majestic Holiday Round Basket - 24″ round - $399 – Vegan/Parve",
    price: 399.00,
    sku: "ST-25-CB-PENULT-V",
    category: 'basket',
    isVegan: true,
    numberOfTreats: 330,
    dimensions: "24 inches",
    shape: "Round",
    imageUrl: "https://cdn.shopify.com/s/files/1/0559/8498/0141/files/PENULTIMATE-JustBecause.png?v=1761590010"
  },
  
  {
    name: "Supreme Holiday Round Basket - 30″ round - $629",
    price: 629.00,
    sku: "ST-25-CB-SUPREME",
    category: 'basket',
    numberOfTreats: 400,
    dimensions: "30 inches",
    shape: "Round",
    imageUrl: "https://cdn.shopify.com/s/files/1/0559/8498/0141/files/SUPREME-JustBecause_79562473-d179-4021-9b18-4b50e5826097.jpg?v=1761590112"
  },
  {
    name: "Supreme Holiday Round Basket - 30″ round - $629 – Vegan/Parve",
    price: 629.00,
    sku: "ST-25-CB-SUPREME-V",
    category: 'basket',
    isVegan: true,
    numberOfTreats: 400,
    dimensions: "30 inches",
    shape: "Round",
    imageUrl: "https://cdn.shopify.com/s/files/1/0559/8498/0141/files/SUPREME-JustBecause_79562473-d179-4021-9b18-4b50e5826097.jpg?v=1761590112"
  },
  
  // SPECIALTY TREATS
  {
    name: "Branded Holiday Oreo Box - $54",
    price: 54.00,
    sku: "TST-25-SP-LOGOBOX",
    category: 'specialty',
    numberOfTreats: 12,
    imageUrl: "https://cdn.shopify.com/s/files/1/0559/8498/0141/files/Elite_Media_group_custom_oreos.png?v=1761590240"
  },
  {
    name: "Branded Holiday Oreo Box - $54 – Vegan/Parve",
    price: 54.00,
    sku: "TST-25-SP-LOGOBOX-V",
    category: 'specialty',
    isVegan: true,
    numberOfTreats: 12,
    imageUrl: "https://cdn.shopify.com/s/files/1/0559/8498/0141/files/Elite_Media_group_custom_oreos.png?v=1761590240"
  },
  
  {
    name: "Sonny's Famous Chocolate Rugullach - $59 – Vegan/Parve",
    price: 59.00,
    sku: "TST-25-SP-RUGELLACH",
    category: 'specialty',
    isVegan: true,
    imageUrl: "https://cdn.shopify.com/s/files/1/0559/8498/0141/files/rugellach_placeholder.jpg?v=1761590000"
  },
  
  {
    name: "Holiday Signature Truffle Box - $69",
    price: 59.00,
    sku: "ST-25-SP-TRUFFLE",
    category: 'specialty',
    numberOfTreats: 15,
    imageUrl: "https://cdn.shopify.com/s/files/1/0559/8498/0141/files/2025_Holiday_Truffle_box_Sweet_Tooth.jpg?v=1761591446"
  },
  {
    name: "Holiday Signature Truffle Box - $69 – Vegan/Parve",
    price: 59.00,
    sku: "ST-25-SP-TRUFFLE-V",
    category: 'specialty',
    isVegan: true,
    numberOfTreats: 15,
    imageUrl: "https://cdn.shopify.com/s/files/1/0559/8498/0141/files/2025_Holiday_Truffle_box_Sweet_Tooth.jpg?v=1761591446"
  },
  
  {
    name: "Ultimate Holiday Bakery Tray - $149",
    price: 149.00,
    sku: "ST-25-SP-BAKERY",
    category: 'specialty',
    numberOfTreats: 50,
    imageUrl: "https://cdn.shopify.com/s/files/1/0559/8498/0141/files/Brownie_Cookie_Sweet_Tooth_Tray.png?v=1761590177"
  },
  {
    name: "Ultimate Holiday Bakery Tray - $149 – Vegan/Parve",
    price: 149.00,
    sku: "ST-25-SP-BAKERY-V",
    category: 'specialty',
    isVegan: true,
    numberOfTreats: 50,
    imageUrl: "https://cdn.shopify.com/s/files/1/0559/8498/0141/files/Brownie_Cookie_Sweet_Tooth_Tray.png?v=1761590177"
  },
  
  // LOGO BARS
  {
    name: "Custom Logo Chocolate Bar – Holiday Edition (2025) SMALL",
    price: 8.00,
    sku: "ST-25-AD-LOGOBAR-SM",
    category: 'logo_bar',
    numberOfTreats: 1,
    imageUrl: "https://cdn.shopify.com/s/files/1/0559/8498/0141/files/CustomLogoDesignedChocolateBars_7.jpg?v=1761590604"
  },
  {
    name: "Custom Logo Chocolate Bar – Holiday Edition (2025) LARGE",
    price: 20.00,
    sku: "ST-25-AD-LOGOBAR-LG",
    category: 'logo_bar',
    numberOfTreats: 1,
    imageUrl: "https://cdn.shopify.com/s/files/1/0559/8498/0141/files/CustomLogoDesignedChocolateBars_7.jpg?v=1761590604"
  }
];

/**
 * Get product names for dropdown (excluding logo bars)
 * Returns list WITHOUT "dairy" label (standard products are dairy by default)
 */
export function getProductNames(): string[] {
  return PRODUCTS
    .filter(p => p.category !== 'logo_bar')
    .map(p => p.name);
}

/**
 * Get product names WITHOUT logo bars (for template dropdown)
 * This is the function used by templateGenerator.ts
 */
export function getProductNamesWithoutLogoBar(): string[] {
  return getProductNames();
}

/**
 * Get product names formatted for dropdown with indentation
 * Vegan/Parve items are indented
 */
export function getProductNamesForDropdown(): string[] {
  const names: string[] = [];
  
  names.push('BASKETS & TRAYS'); // Header
  
  PRODUCTS
    .filter(p => p.category === 'basket')
    .forEach(p => {
      if (p.isVegan) {
        names.push(`    ${p.name}`); // Indent vegan options
      } else {
        names.push(p.name);
      }
    });
  
  names.push(''); // Blank row
  names.push('SPECIALTY TREATS'); // Header
  
  PRODUCTS
    .filter(p => p.category === 'specialty')
    .forEach(p => {
      if (p.isVegan) {
        names.push(`    ${p.name}`); // Indent vegan options
      } else {
        names.push(p.name);
      }
    });
  
  return names;
}

/**
 * Get logo bar options for dropdown
 */
export function getLogoBarOptions(): string[] {
  return [
    'None',
    'Small ($8)',
    'Large ($20)'
  ];
}

/**
 * Find product by name or SKU
 */
export function findProduct(nameOrSku: string): Product | undefined {
  const search = nameOrSku.toLowerCase().trim();
  return PRODUCTS.find(p => 
    p.name.toLowerCase() === search || 
    p.sku.toLowerCase() === search ||
    p.name.toLowerCase().includes(search)
  );
}

/**
 * Base products (no variants) for cleaner dropdown UX
 * Each base product can have Dairy or PARVE variant
 */
export interface BaseProduct {
  id: string;
  displayName: string; // Short name for dropdown
  price: number;
  category: 'basket' | 'specialty';
  hasVariants: boolean; // false for PARVE-only products
  dairySku: string;
  parveSku: string;
  imageUrl: string;
}

export const BASE_PRODUCTS: BaseProduct[] = [
  {
    id: 'pretzel-oreo-39',
    displayName: '$39 Holiday Pretzel & Oreo Tray',
    price: 39.00,
    category: 'basket',
    hasVariants: true,
    dairySku: 'TST-25-SP-PRETZOREO',
    parveSku: 'TST-25-SP-PRETZOREO-V',
    imageUrl: "https://cdn.shopify.com/s/files/1/0559/8498/0141/files/corp_2025_pretzel_and_oreo_tray.jpg?v=1761590838"
  },
  {
    id: 'favorites-69',
    displayName: '$69 Holiday Favorites Round Basket',
    price: 69.00,
    category: 'basket',
    hasVariants: true,
    dairySku: 'ST-25-CB-SMROUND',
    parveSku: 'ST-25-CB-SMROUND-V',
    imageUrl: "https://cdn.shopify.com/s/files/1/0559/8498/0141/files/SMALLROUND-Corp_holidays.jpg?v=1761589268"
  },
  {
    id: 'classic-89',
    displayName: '$89 Classic Holiday Round Basket',
    price: 89.00,
    category: 'basket',
    hasVariants: true,
    dairySku: 'ST-25-CB-MEDRECT',
    parveSku: 'ST-25-CB-MEDRECT-V',
    imageUrl: "https://cdn.shopify.com/s/files/1/0559/8498/0141/files/MediumRectangle.jpg?v=1761589581"
  },
  {
    id: 'indulgence-109',
    displayName: '$109 Holiday Indulgence Wood Tray',
    price: 109.00,
    category: 'basket',
    hasVariants: true,
    dairySku: 'TST-25-SP-INDULGTRAY',
    parveSku: 'TST-25-SP-INDULGTRAY-V',
    imageUrl: "https://cdn.shopify.com/s/files/1/0559/8498/0141/files/Screenshot2025-10-27at8.11.31PM.png?v=1761610632"
  },
  {
    id: 'grand-129',
    displayName: '$129 Grand Holiday Oval Basket',
    price: 129.00,
    category: 'basket',
    hasVariants: true,
    dairySku: 'HOL25-OVAL-L60',
    parveSku: 'HOL25-OVAL-L60-V',
    imageUrl: "https://cdn.shopify.com/s/files/1/0559/8498/0141/files/LARGEOVAL-JustBecause1.jpg?v=1761589682"
  },
  {
    id: 'deluxe-179',
    displayName: '$179 Deluxe Holiday Round Basket',
    price: 179.00,
    category: 'basket',
    hasVariants: true,
    dairySku: 'ST-25-CB-XLARGE',
    parveSku: 'ST-25-CB-XLARGE-V',
    imageUrl: "https://cdn.shopify.com/s/files/1/0559/8498/0141/files/EXTRA_LARGE_-_Just_Because.jpg?v=1761589750"
  },
  {
    id: 'prestige-209',
    displayName: '$209 Prestige Holiday Oval Basket',
    price: 209.00,
    category: 'basket',
    hasVariants: true,
    dairySku: 'ST-25-CB-GIANTOVAL',
    parveSku: 'ST-25-CB-GIANTOVAL-V',
    imageUrl: "https://cdn.shopify.com/s/files/1/0559/8498/0141/files/Thank_you_chocolate_gift_basket.png?v=1761690880"
  },
  {
    id: 'premier-279',
    displayName: '$279 Premier Holiday Rectangle Basket',
    price: 269.00,
    category: 'basket',
    hasVariants: true,
    dairySku: 'ST-25-CB-JUMBRECT',
    parveSku: 'ST-25-CB-JUMBRECT-V',
    imageUrl: "https://cdn.shopify.com/s/files/1/0559/8498/0141/files/JUMBORectangle-Congratulations.jpg?v=1761589949"
  },
  {
    id: 'majestic-399',
    displayName: '$399 Majestic Holiday Round Basket',
    price: 399.00,
    category: 'basket',
    hasVariants: true,
    dairySku: 'ST-25-CB-PENULT',
    parveSku: 'ST-25-CB-PENULT-V',
    imageUrl: "https://cdn.shopify.com/s/files/1/0559/8498/0141/files/PENULTIMATE-JustBecause.png?v=1761590010"
  },
  {
    id: 'supreme-629',
    displayName: '$629 Supreme Holiday Round Basket',
    price: 629.00,
    category: 'basket',
    hasVariants: true,
    dairySku: 'ST-25-CB-SUPREME',
    parveSku: 'ST-25-CB-SUPREME-V',
    imageUrl: "https://cdn.shopify.com/s/files/1/0559/8498/0141/files/SUPREME-JustBecause_79562473-d179-4021-9b18-4b50e5826097.jpg?v=1761590112"
  },
  {
    id: 'oreo-box-54',
    displayName: '$54 Branded Holiday Oreo Box',
    price: 54.00,
    category: 'specialty',
    hasVariants: true,
    dairySku: 'TST-25-SP-LOGOBOX',
    parveSku: 'TST-25-SP-LOGOBOX-V',
    imageUrl: "https://cdn.shopify.com/s/files/1/0559/8498/0141/files/Elite_Media_group_custom_oreos.png?v=1761590240"
  },
  {
    id: 'rugellach-59',
    displayName: "$59 Sonny's Famous Chocolate Rugellach",
    price: 59.00,
    category: 'specialty',
    hasVariants: false, // PARVE-only product
    dairySku: '', // No dairy version
    parveSku: 'TST-25-SP-RUGELLACH',
    imageUrl: "https://cdn.shopify.com/s/files/1/0559/8498/0141/files/rugellach_placeholder.jpg?v=1761590000"
  },
  {
    id: 'truffle-69',
    displayName: '$69 Holiday Signature Truffle Box',
    price: 59.00,
    category: 'specialty',
    hasVariants: true,
    dairySku: 'ST-25-SP-TRUFFLE',
    parveSku: 'ST-25-SP-TRUFFLE-V',
    imageUrl: "https://cdn.shopify.com/s/files/1/0559/8498/0141/files/2025_Holiday_Truffle_box_Sweet_Tooth.jpg?v=1761591446"
  },
  {
    id: 'bakery-149',
    displayName: '$149 Ultimate Holiday Bakery Tray',
    price: 149.00,
    category: 'specialty',
    hasVariants: true,
    dairySku: 'ST-25-SP-BAKERY',
    parveSku: 'ST-25-SP-BAKERY-V',
    imageUrl: "https://cdn.shopify.com/s/files/1/0559/8498/0141/files/Brownie_Cookie_Sweet_Tooth_Tray.png?v=1761590177"
  },
];

/**
 * Get base products grouped by category for dropdown
 */
export function getBaseProductsForDropdown(): { category: string; products: BaseProduct[] }[] {
  return [
    {
      category: 'BASKETS & TRAYS',
      products: BASE_PRODUCTS.filter(p => p.category === 'basket')
    },
    {
      category: 'SPECIALTY TREATS',
      products: BASE_PRODUCTS.filter(p => p.category === 'specialty')
    }
  ];
}

/**
 * Get full product name with variant
 */
export function getFullProductName(baseProductId: string, variant: 'dairy' | 'parve'): string {
  const base = BASE_PRODUCTS.find(p => p.id === baseProductId);
  if (!base) return '';
  
  // For PARVE-only products, don't add variant suffix
  if (!base.hasVariants) {
    return base.displayName;
  }
  
  return variant === 'parve' ? `${base.displayName} - Vegan/Parve` : base.displayName;
}

/**
 * Get SKU for base product + variant
 */
export function getSku(baseProductId: string, variant: 'dairy' | 'parve'): string {
  const base = BASE_PRODUCTS.find(p => p.id === baseProductId);
  if (!base) return '';
  
  return variant === 'parve' ? base.parveSku : base.dairySku;
}

/**
 * Delivery method options
 */
export const DELIVERY_METHODS = [
  { value: 'local_delivery', label: 'Local Delivery' },
  { value: 'shipping', label: 'Shipping' },
  { value: 'store_pickup', label: 'Store Pickup' },
] as const;
