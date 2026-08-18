/**
 * Receipt Formatter & Thermal Printing Utilities for 58mm / 80mm ESC/POS.
 */

export interface ReceiptItem {
  name: string;
  qty: number;
  price: number;
  imei?: string;
  discount?: number;
}

export interface ReceiptData {
  storeName: string;
  storeAddress?: string;
  storePhone?: string;
  invoiceNumber: string;
  cashierName: string;
  customerName?: string;
  date: string;
  items: ReceiptItem[];
  subtotal: number;
  discountTotal?: number;
  taxTotal?: number;
  grandTotal: number;
  paymentMethod: string;
  cashReceived?: number;
  change?: number;
  footerNote?: string;
  warrantyNote?: string;
}

/**
 * Formats lines for 58mm (approx 32 chars) or 80mm (approx 48 chars) thermal receipt.
 */
export function formatReceiptText(data: ReceiptData, paperWidth: "58mm" | "80mm" = "58mm"): string {
  const lineLength = paperWidth === "80mm" ? 48 : 32;
  const divider = "-".repeat(lineLength);
  const doubleDivider = "=".repeat(lineLength);

  const center = (text: string): string => {
    const space = Math.max(0, Math.floor((lineLength - text.length) / 2));
    return " ".repeat(space) + text;
  };

  const justify = (left: string, right: string): string => {
    const space = Math.max(1, lineLength - left.length - right.length);
    return left + " ".repeat(space) + right;
  };

  const lines: string[] = [];

  // Header
  lines.push(center(data.storeName.toUpperCase()));
  if (data.storeAddress) lines.push(center(data.storeAddress));
  if (data.storePhone) lines.push(center(`Telp: ${data.storePhone}`));
  lines.push(doubleDivider);

  // Meta
  lines.push(justify("No. Nota:", data.invoiceNumber));
  lines.push(justify("Tanggal :", data.date));
  lines.push(justify("Kasir   :", data.cashierName));
  if (data.customerName) {
    lines.push(justify("Pelanggan:", data.customerName));
  }
  lines.push(divider);

  // Items
  for (const item of data.items) {
    lines.push(item.name);
    const itemDetail = `${item.qty} x ${item.price.toLocaleString("id-ID")}`;
    const itemTotal = (item.qty * item.price).toLocaleString("id-ID");
    lines.push(justify(`  ${itemDetail}`, itemTotal));

    if (item.imei) {
      lines.push(`  IMEI: ${item.imei}`);
    }
    if (item.discount && item.discount > 0) {
      lines.push(justify(`  Diskon Item`, `-${item.discount.toLocaleString("id-ID")}`));
    }
  }

  lines.push(divider);

  // Totals
  lines.push(justify("Subtotal:", data.subtotal.toLocaleString("id-ID")));
  if (data.discountTotal && data.discountTotal > 0) {
    lines.push(justify("Total Diskon:", `-${data.discountTotal.toLocaleString("id-ID")}`));
  }
  if (data.taxTotal && data.taxTotal > 0) {
    lines.push(justify("PPN:", data.taxTotal.toLocaleString("id-ID")));
  }
  lines.push(doubleDivider);
  lines.push(justify("TOTAL:", `Rp ${data.grandTotal.toLocaleString("id-ID")}`));
  lines.push(justify("Metode Bayar:", data.paymentMethod));

  if (data.cashReceived !== undefined) {
    lines.push(justify("Tunai:", `Rp ${data.cashReceived.toLocaleString("id-ID")}`));
    lines.push(justify("Kembali:", `Rp ${(data.change || 0).toLocaleString("id-ID")}`));
  }

  lines.push(divider);

  // Footer & Warranty
  if (data.warrantyNote) {
    lines.push(center("--- INFO GARANSI ---"));
    lines.push(center(data.warrantyNote));
    lines.push(divider);
  }

  lines.push(center(data.footerNote || "Terima Kasih Atas Kunjungan Anda"));
  lines.push(center("Barang yg dibeli tdk dpt ditukar"));

  return lines.join("\n");
}
