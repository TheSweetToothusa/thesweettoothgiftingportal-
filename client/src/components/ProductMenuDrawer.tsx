import { X, Download } from "lucide-react";
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Product {
  id: string;
  name: string;
  price: string;
  treatCount: string;
  image: string;
  description: string;
}

// Real products from The Sweet Tooth Holiday Collection
// Source: https://thesweettooth.com/collections/holiday-collection-page
const PRODUCTS: Product[] = [
  {
    id: "holiday-chocolate-dipped-pretzel-oreo-tray",
    name: "Holiday Chocolate-Dipped Pretzel & Oreo Tray",
    price: "$39.00",
    treatCount: "18 treats",
    image: "https://cdn.shopify.com/s/files/1/0559/8498/0141/files/Chocolate_pretzel_oreo_wood_tray_for_the_holidays.jpg?v=1762564108",
    description: "A festive assortment of chocolate-dipped pretzels and Oreos"
  },
  {
    id: "branded-holiday-oreo-box",
    name: "Branded Holiday Oreo Box (12)",
    price: "$54.00",
    treatCount: "12 Oreos",
    image: "https://cdn.shopify.com/s/files/1/0559/8498/0141/files/Elite_Media_group_custom_oreos.png?v=1761590240",
    description: "Custom branded Oreos perfect for corporate gifting"
  },
  {
    id: "holiday-signature-truffle-box",
    name: "Holiday Signature Truffle Box",
    price: "$59.00",
    treatCount: "Assorted truffles",
    image: "https://cdn.shopify.com/s/files/1/0559/8498/0141/files/2025_Holiday_Truffle_box_Sweet_Tooth.jpg?v=1761591446",
    description: "Premium handcrafted truffles in festive flavors"
  },
  {
    id: "sonnys-world-famous-chocolate-rugellach",
    name: "Sonny's World-Famous Chocolate Rugellach",
    price: "$59.00",
    treatCount: "24 pieces",
    image: "https://cdn.shopify.com/s/files/1/0559/8498/0141/files/Sunny_s_Famous_Rugullach_on_a_tray.png?v=1762368196",
    description: "Traditional chocolate rugellach, freshly baked"
  },
  {
    id: "holiday-favorites-round-basket",
    name: "Holiday Favorites Round Basket",
    price: "$69.00",
    treatCount: "Assorted treats",
    image: "https://cdn.shopify.com/s/files/1/0559/8498/0141/files/Round_Chocolate_Gift_basket_happy_Holidays.png?v=1762315369",
    description: "A beautiful round basket filled with holiday favorites"
  },
  {
    id: "classic-holiday-round-basket",
    name: "Classic Holiday Round Basket",
    price: "$89.00",
    treatCount: "Assorted treats",
    image: "https://cdn.shopify.com/s/files/1/0559/8498/0141/files/Corporate_holiday_gift_basket_with_custom_logo.png?v=1762298102",
    description: "Classic holiday treats in an elegant round basket"
  },
  {
    id: "holiday-indulgence-tray",
    name: "Holiday Indulgence Tray",
    price: "$109.00",
    treatCount: "Assorted treats",
    image: "https://cdn.shopify.com/s/files/1/0559/8498/0141/files/Holiday_Chocolate_indulgence_tray.png?v=1762315686",
    description: "An indulgent tray of premium holiday chocolates"
  },
  {
    id: "grand-holiday-oval-basket",
    name: "Grand Holiday Oval Basket",
    price: "$129.00",
    treatCount: "Assorted treats",
    image: "https://cdn.shopify.com/s/files/1/0559/8498/0141/files/premium_chocolate_holiday_2025_oval_gift_basket.png?v=1762317962",
    description: "Grand oval basket overflowing with holiday treats"
  },
  {
    id: "ultimate-holiday-bakery-tray",
    name: "Ultimate Holiday Bakery Tray",
    price: "$149.00",
    treatCount: "Assorted baked goods",
    image: "https://cdn.shopify.com/s/files/1/0559/8498/0141/files/Brownie_Cookie_Sweet_Tooth_Tray.png?v=1761590177",
    description: "Ultimate selection of freshly baked holiday treats"
  },
  {
    id: "deluxe-holiday-round-basket",
    name: "Deluxe Holiday Round Basket",
    price: "$179.00",
    treatCount: "Assorted treats",
    image: "https://cdn.shopify.com/s/files/1/0559/8498/0141/files/Deluxe_Round_Chocolate_gift_basket_sweet_tooth.png?v=1762317197",
    description: "Deluxe round basket with premium holiday selections"
  },
  {
    id: "prestige-holiday-oval-basket",
    name: "Prestige Holiday Oval Basket",
    price: "$209.00",
    treatCount: "Assorted treats",
    image: "https://cdn.shopify.com/s/files/1/0559/8498/0141/files/Happy_Holidays_Tray_Sweet_Tooth_Chocolate.png?v=1762354937",
    description: "Prestige oval basket for the most discerning recipients"
  },
  {
    id: "premier-holiday-rectangle-basket",
    name: "Premier Holiday Rectangle Basket",
    price: "$269.00",
    treatCount: "Assorted treats",
    image: "https://cdn.shopify.com/s/files/1/0559/8498/0141/files/Giant_Rectangle_Holiday_Basket.png?v=1762317800",
    description: "Premier rectangle basket with executive-level treats"
  },
  {
    id: "executive-holiday-round-basket",
    name: "Executive Holiday Round Basket",
    price: "$399.00",
    treatCount: "Assorted treats",
    image: "https://cdn.shopify.com/s/files/1/0559/8498/0141/files/PENULTIMATE-JustBecause.png?v=1761590010",
    description: "Executive round basket for VIP corporate gifting"
  },
  {
    id: "supreme-holiday-basket",
    name: "Supreme Holiday Basket",
    price: "$629.00",
    treatCount: "Assorted treats",
    image: "https://cdn.shopify.com/s/files/1/0559/8498/0141/files/SUPREME-JustBecause_79562473-d179-4021-9b18-4b50e5826097.jpg?v=1761590112",
    description: "The ultimate supreme basket for the most important clients"
  }
];

interface ProductMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductMenuDrawer({ isOpen, onClose }: ProductMenuDrawerProps) {
  const [selectedProduct, setSelectedProduct] = React.useState<typeof PRODUCTS[0] | null>(null);

  if (!isOpen) return null;

  const handleDownloadPDF = () => {
    window.open('/api/download-product-menu-pdf', '_blank');
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white shadow-2xl z-50 transform transition-transform overflow-y-auto">
        {/* Header - Close button only */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-end z-10">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Download PDF Link - Temporarily Hidden */}
        {/* <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            <Download className="h-4 w-4" />
            Download Printable Menu (PDF)
          </button>
        </div> */}

        {/* Product List */}
        <div className="px-6 py-6 space-y-4">
          {PRODUCTS.map((product) => (
            <Card key={product.id} className="border-gray-200 hover:border-gray-400 transition-colors">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* Product Image */}
                  <div className="flex-shrink-0">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1">
                      {product.name}
                    </h3>
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                      {product.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-bold text-gray-900">{product.price}</p>
                        <p className="text-xs text-gray-500">{product.treatCount}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setSelectedProduct(product)}
                        className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 text-xs px-3 py-1 h-auto"
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 text-center">
          <p className="text-sm text-gray-600">
            Questions? Contact us at{" "}
            <a href="mailto:orders@thesweettooth.com" className="text-gray-900 hover:underline font-medium">
              orders@thesweettooth.com
            </a>
          </p>
        </div>
      </div>

      {/* Product Details Modal */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-2xl">
          {selectedProduct && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedProduct.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-6">
                  <img
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
                    className="w-48 h-48 object-cover rounded-lg"
                  />
                  <div className="flex-1 space-y-3">
                    <div>
                      <p className="text-3xl font-bold text-gray-900">{selectedProduct.price}</p>
                      <p className="text-sm text-gray-600 mt-1">{selectedProduct.treatCount}</p>
                    </div>
                    <p className="text-gray-700 leading-relaxed">{selectedProduct.description}</p>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600">
                    Complete your order in the gifting portal, or contact our team at{" "}
                    <a href="mailto:orders@thesweettooth.com" className="text-gray-900 hover:underline font-medium">
                      orders@thesweettooth.com
                    </a>.
                  </p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
