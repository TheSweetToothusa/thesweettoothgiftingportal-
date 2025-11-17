import { jsPDF } from "jspdf";

interface Product {
  name: string;
  price: number;
  treatCount: string;
  description: string;
}

const PRODUCTS: Product[] = [
  {
    name: "Holiday Chocolate-Dipped Pretzel & Oreo Tray",
    price: 65,
    treatCount: "18 treats",
    description: "A festive assortment of chocolate-dipped pretzels and Oreos"
  },
  {
    name: "Holiday Chocolate Covered Oreo Box (12)",
    price: 45,
    treatCount: "12 Oreos",
    description: "Twelve premium Oreos hand-dipped in Belgian chocolate"
  },
  {
    name: "Branded Holiday Oreo Box",
    price: 50,
    treatCount: "12 Oreos",
    description: "Custom branded Oreos perfect for corporate gifting"
  },
  {
    name: "Holiday Chocolate-Dipped Pretzel Box (12)",
    price: 40,
    treatCount: "12 pretzels",
    description: "Hand-dipped pretzels in festive holiday designs"
  },
  {
    name: "Holiday Chocolate-Dipped Strawberry Box (12)",
    price: 55,
    treatCount: "12 strawberries",
    description: "Fresh strawberries dipped in premium Belgian chocolate"
  }
];

export async function generateProductMenuPDF(): Promise<Buffer> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "letter"
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = margin;

  // Header
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("The Sweet Tooth", pageWidth / 2, yPos, { align: "center" });
  yPos += 8;

  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text("Corporate Gifting Portal", pageWidth / 2, yPos, { align: "center" });
  yPos += 12;

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("2025 Holiday Collection", pageWidth / 2, yPos, { align: "center" });
  yPos += 10;

  // Divider line
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // Products
  doc.setFontSize(10);
  PRODUCTS.forEach((product, index) => {
    // Check if we need a new page
    if (yPos > 250) {
      doc.addPage();
      yPos = margin;
    }

    // Product name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    const splitName = doc.splitTextToSize(product.name, pageWidth - 2 * margin - 40);
    doc.text(splitName, margin, yPos);
    yPos += splitName.length * 5;

    // Price and treat count
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(`$${product.price}`, pageWidth - margin, yPos - (splitName.length * 5) + 5, { align: "right" });
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(product.treatCount, pageWidth - margin, yPos - (splitName.length * 5) + 10, { align: "right" });
    doc.setTextColor(0, 0, 0);

    // Description
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    const splitDesc = doc.splitTextToSize(product.description, pageWidth - 2 * margin);
    doc.text(splitDesc, margin, yPos + 2);
    yPos += splitDesc.length * 5 + 10;

    // Divider line (except after last product)
    if (index < PRODUCTS.length - 1) {
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 8;
    }
  });

  // Footer section
  yPos += 15;
  if (yPos > 240) {
    doc.addPage();
    yPos = margin;
  }

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Contact Us", pageWidth / 2, yPos, { align: "center" });
  yPos += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Email: orders@thesweettooth.com", pageWidth / 2, yPos, { align: "center" });
  yPos += 6;
  doc.text("Order online at our Corporate Gifting Portal", pageWidth / 2, yPos, { align: "center" });
  yPos += 10;

  // QR Code placeholder (text-based for now)
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text("Scan QR code to order:", pageWidth / 2, yPos, { align: "center" });
  yPos += 6;
  
  // Simple QR code representation (box with text)
  const qrSize = 30;
  const qrX = (pageWidth - qrSize) / 2;
  doc.setDrawColor(0, 0, 0);
  doc.rect(qrX, yPos, qrSize, qrSize);
  doc.setFontSize(8);
  doc.text("QR CODE", pageWidth / 2, yPos + qrSize / 2 + 1, { align: "center" });

  return Buffer.from(doc.output("arraybuffer"));
}
