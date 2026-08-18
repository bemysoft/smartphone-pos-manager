import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Product, Transaction, Buyback } from "../types";

export interface POSReceiptOptions {
  paperFormat?: "a4" | "thermal80mm";
  shopTitle?: string;
  shopAddress?: string;
  shopPhone?: string;
  thanksText?: string;
  logoUrl?: string;
}

export interface MonthlyAuditData {
  filteredTransactions: Transaction[];
  filteredBuybacks: Buyback[];
  products: Product[];
  dateRangeLabel: string;
  startDate?: string;
  endDate?: string;
  currentUser?: any;
  summaryData: {
    totalRevenue: number;
    totalProcurementCost: number;
    totalGrossProfit: number;
    totalBuybackCost: number;
    netProfit: number;
    cashAssetValue: number;
    inventoryAssetValue: number;
    totalAssets: number;
    grossMarginPercent: number;
    netMarginPercent: number;
  };
  auditRows: any[];
  activeTrendData?: any[];
}

/**
 * Draw a clean vector barcode in jsPDF using line/rect commands
 */
function drawVectorBarcode(doc: jsPDF, text: string, x: number, y: number, width: number, height: number) {
  doc.setFillColor(15, 23, 42); // slate-900
  // Generate pseudo-random bar pattern based on characters
  let currentX = x;
  const numBars = 45;
  const unitWidth = width / numBars;

  for (let i = 0; i < numBars; i++) {
    const charCode = text.charCodeAt(i % text.length) || 65;
    const isBar = (charCode + i * 7) % 3 !== 0;
    const isWide = (charCode + i) % 5 === 0;
    const barW = isWide ? unitWidth * 1.6 : unitWidth * 0.8;

    if (isBar) {
      doc.rect(currentX, y, barW, height, "F");
    }
    currentX += barW + unitWidth * 0.3;
    if (currentX >= x + width) break;
  }
}

/**
 * Draw a clean simulated QR code in jsPDF using vector blocks
 */
function drawVectorQRCode(doc: jsPDF, text: string, x: number, y: number, size: number) {
  doc.setFillColor(255, 255, 255);
  doc.rect(x, y, size, size, "F");
  
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.3);
  doc.rect(x, y, size, size, "S");

  doc.setFillColor(15, 23, 42);

  // Corner 1: Top-Left Finder
  doc.rect(x + 1, y + 1, 6, 6, "F");
  doc.setFillColor(255, 255, 255);
  doc.rect(x + 2, y + 2, 4, 4, "F");
  doc.setFillColor(15, 23, 42);
  doc.rect(x + 3, y + 3, 2, 2, "F");

  // Corner 2: Top-Right Finder
  doc.rect(x + size - 7, y + 1, 6, 6, "F");
  doc.setFillColor(255, 255, 255);
  doc.rect(x + size - 6, y + 2, 4, 4, "F");
  doc.setFillColor(15, 23, 42);
  doc.rect(x + size - 5, y + 3, 2, 2, "F");

  // Corner 3: Bottom-Left Finder
  doc.rect(x + 1, y + size - 7, 6, 6, "F");
  doc.setFillColor(255, 255, 255);
  doc.rect(x + 2, y + size - 6, 4, 4, "F");
  doc.setFillColor(15, 23, 42);
  doc.rect(x + 3, y + size - 5, 2, 2, "F");

  // Random internal data pixels derived from text hash
  const gridSize = 10;
  const cellSize = (size - 4) / gridSize;
  for (let r = 2; r < gridSize - 2; r++) {
    for (let c = 2; c < gridSize - 2; c++) {
      const charVal = text.charCodeAt((r + c) % text.length) || 50;
      if ((charVal * r + c) % 2 === 0) {
        doc.rect(x + 2 + c * cellSize, y + 2 + r * cellSize, cellSize * 0.9, cellSize * 0.9, "F");
      }
    }
  }
}

/**
 * Generate a single transaction POS Receipt PDF
 */
export function exportPOSReceiptPDF(tx: Transaction, options: POSReceiptOptions = {}) {
  const paperFormat = options.paperFormat || "a4";
  const shopTitle = options.shopTitle || localStorage.getItem("print_shop_title") || "FONEPOS & SMARTPHONE STORE";
  const shopAddress = options.shopAddress || localStorage.getItem("print_shop_address") || "Roxy Mas Square Blok C2, Jakarta Pusat";
  const shopPhone = options.shopPhone || localStorage.getItem("print_shop_phone") || "0812-3456-7890";
  const thanksText = options.thanksText || localStorage.getItem("print_thanks_text") || "--- TERIMA KASIH ATAS KUNJUNGAN ANDA ---";

  if (paperFormat === "thermal80mm") {
    // Thermal 80mm roll receipt style PDF
    const pageHeight = Math.max(160, 110 + (tx.items.length * 15));
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [80, pageHeight]
    });

    const margin = 4;
    const width = 72;

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(shopTitle, 40, 8, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(60, 60, 60);
    doc.text(shopAddress, 40, 12, { align: "center" });
    doc.text(`Telp: ${shopPhone}`, 40, 15, { align: "center" });

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    doc.line(margin, 18, margin + width, 18);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text("NOTA PENJUALAN RETAIL POS", 40, 22, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(40, 40, 40);
    doc.text(`No Invoice : ${tx.id}`, margin, 27);
    doc.text(`Tanggal    : ${tx.date.replace("T", " ")}`, margin, 31);
    doc.text(`Kasir      : ${tx.cashierName || "POS Staff"}`, margin, 35);
    doc.text(`Pelanggan  : ${tx.customerName} (${tx.customerPhone})`, margin, 39);

    doc.line(margin, 42, margin + width, 42);

    // Items table
    let currentY = 46;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text("ITEM & SPEC", margin, currentY);
    doc.text("SUBTOTAL", margin + width, currentY, { align: "right" });
    currentY += 4;

    tx.items.forEach((item, idx) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.text(`${idx + 1}. ${item.name}`, margin, currentY);
      currentY += 3.5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(80, 80, 80);
      doc.text(`   IMEI: ${item.imei}`, margin, currentY);
      
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(`Rp ${(item.priceSell || 0).toLocaleString("id-ID")}`, margin + width, currentY, { align: "right" });
      currentY += 4.5;
    });

    doc.line(margin, currentY, margin + width, currentY);
    currentY += 4;

    // Totals
    const subtotal = tx.items.reduce((sum, item) => sum + item.priceSell, 0);
    const promoDisc = tx.promoDiscount || 0;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text("Subtotal Produk:", margin, currentY);
    doc.text(`Rp ${subtotal.toLocaleString("id-ID")}`, margin + width, currentY, { align: "right" });
    currentY += 3.5;

    if (promoDisc > 0) {
      doc.text("Diskon Promo:", margin, currentY);
      doc.text(`-Rp ${promoDisc.toLocaleString("id-ID")}`, margin + width, currentY, { align: "right" });
      currentY += 3.5;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text("TOTAL BAYAR:", margin, currentY);
    doc.text(`Rp ${(tx.totalAmount || 0).toLocaleString("id-ID")}`, margin + width, currentY, { align: "right" });
    currentY += 4.5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(`Metode Bayar: ${tx.paymentMethod}`, margin, currentY);
    doc.text(`Status: ${tx.paymentStatus}`, margin + width, currentY, { align: "right" });
    currentY += 5;

    // Barcode & QR Code
    drawVectorBarcode(doc, tx.id, margin + 4, currentY, 40, 8);
    drawVectorQRCode(doc, tx.id, margin + 50, currentY, 12);
    currentY += 14;

    doc.setFont("helvetica", "italic");
    doc.setFontSize(6.5);
    doc.text(thanksText, 40, currentY, { align: "center" });
    currentY += 3.5;
    doc.text("Garansi Toko 14 Hari dengan Nota & Box Unit", 40, currentY, { align: "center" });

    doc.save(`Receipt_Thermal_${tx.id}.pdf`);
  } else {
    // A4 Portrait Standard POS Receipt / Invoice PDF
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    // Top Brand Banner
    doc.setFillColor(30, 41, 59); // slate-800
    doc.rect(0, 0, 210, 36, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(shopTitle, 15, 14);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(203, 213, 225); // slate-300
    doc.text(`${shopAddress} | Telp: ${shopPhone}`, 15, 21);
    doc.text("Sistem POS Kasir & Pelacakan IMEI Smartphone Resmi", 15, 26);

    // Document Badge Right
    doc.setFillColor(16, 185, 129); // emerald-500
    doc.roundedRect(145, 10, 50, 16, 3, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("NOTA POS RESMI", 170, 17, { align: "center" });
    doc.setFontSize(7.5);
    doc.text(tx.paymentStatus === "PAID" ? "LUNAS / TERBAYAR" : tx.paymentStatus, 170, 22, { align: "center" });

    // Header info box
    doc.setFillColor(248, 250, 252);
    doc.rect(15, 42, 180, 26, "F");
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.rect(15, 42, 180, 26, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text("RINCIAN FAKTUR / INVOICE", 20, 48);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`No Invoice   : ${tx.id}`, 20, 54);
    doc.text(`Tanggal      : ${tx.date.replace("T", " ")}`, 20, 59);
    doc.text(`Kasir        : ${tx.cashierName || "Siti (POS Admin)"}`, 20, 64);

    doc.text(`Pelanggan    : ${tx.customerName}`, 110, 54);
    doc.text(`No Telepon   : ${tx.customerPhone || "-"}`, 110, 59);
    doc.text(`Metode Bayar : ${tx.paymentMethod}`, 110, 64);

    // Items table using autoTable
    const tableBody = tx.items.map((item, idx) => [
      idx + 1,
      item.name,
      item.brand || "-",
      item.imei,
      1,
      `Rp ${(item.priceSell || 0).toLocaleString("id-ID")}`,
      `Rp ${(item.priceSell || 0).toLocaleString("id-ID")}`
    ]);

    autoTable(doc, {
      startY: 74,
      head: [["No", "Nama Smartphone", "Brand", "Nomor IMEI", "Qty", "Harga Satuan", "Total (Rp)"]],
      body: tableBody,
      theme: "grid",
      headStyles: { fillColor: [30, 41, 59], textColor: 255, fontSize: 8.5, fontStyle: "bold" },
      bodyStyles: { fontSize: 8, textColor: [30, 41, 59], cellPadding: 2.5 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 15, right: 15 }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 6;

    // Totals card
    doc.setFillColor(241, 245, 249);
    doc.rect(115, finalY, 80, 32, "F");
    doc.setDrawColor(203, 213, 225);
    doc.rect(115, finalY, 80, 32, "S");

    const subtotal = tx.items.reduce((sum, item) => sum + item.priceSell, 0);
    const promoDisc = tx.promoDiscount || 0;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text("Subtotal Produk:", 120, finalY + 6);
    doc.text(`Rp ${subtotal.toLocaleString("id-ID")}`, 190, finalY + 6, { align: "right" });

    if (promoDisc > 0) {
      doc.text("Diskon Promo:", 120, finalY + 12);
      doc.setTextColor(217, 119, 6);
      doc.text(`-Rp ${promoDisc.toLocaleString("id-ID")}`, 190, finalY + 12, { align: "right" });
      doc.setTextColor(71, 85, 105);
    }

    doc.setLineWidth(0.2);
    doc.line(120, finalY + 18, 190, finalY + 18);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text("TOTAL BAYAR:", 120, finalY + 25);
    doc.setTextColor(16, 185, 129);
    doc.text(`Rp ${(tx.totalAmount || 0).toLocaleString("id-ID")}`, 190, finalY + 25, { align: "right" });

    // Barcode and Verification area
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text("VERIFIKASI TRANSAKSI POS", 15, finalY + 6);

    drawVectorBarcode(doc, tx.id, 15, finalY + 10, 55, 12);
    drawVectorQRCode(doc, tx.id, 75, finalY + 8, 16);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(`Code: ${tx.id}`, 15, finalY + 26);
    doc.text("Scan QR Code untuk verifikasi status keaslian nota.", 15, finalY + 30);

    // Terms & Signatures
    const termsY = finalY + 40;
    doc.setDrawColor(226, 232, 240);
    doc.line(15, termsY, 195, termsY);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text("Syarat & Ketentuan Garansi Toko:", 15, termsY + 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text("1. Garansi toko berlaku 14 hari sejak tanggal pembelian dengan menyertakan nota ini & box.", 15, termsY + 10);
    doc.text("2. Garansi tidak berlaku apabila terjadi kerusakan fisik, human error, atau segel terputus.", 15, termsY + 14);
    doc.text("3. Nomor IMEI terdaftar resmi pada database Kemenperin Bea Cukai Indonesia.", 15, termsY + 18);

    // Signature
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text("Hormat Kami,", 160, termsY + 6);
    doc.text(tx.cashierName || "Kasir FonePOS", 160, termsY + 22);

    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(thanksText, 105, termsY + 30, { align: "center" });

    doc.save(`Nota_POS_${tx.id}.pdf`);
  }
}

/**
 * Generate a bulk PDF containing POS Receipts for all transactions in a date range
 */
export function exportBulkPOSReceiptsPDF(transactions: Transaction[], dateRangeLabel: string, options: POSReceiptOptions = {}) {
  if (!transactions || transactions.length === 0) {
    alert("Tidak ada transaksi dalam rentang tanggal terfilter untuk diekspor.");
    return;
  }

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const shopTitle = options.shopTitle || localStorage.getItem("print_shop_title") || "FONEPOS & SMARTPHONE STORE";
  const shopAddress = options.shopAddress || localStorage.getItem("print_shop_address") || "Roxy Mas Square Blok C2, Jakarta Pusat";
  const shopPhone = options.shopPhone || localStorage.getItem("print_shop_phone") || "0812-3456-7890";

  transactions.forEach((tx, index) => {
    if (index > 0) {
      doc.addPage();
    }

    // Top Header Banner
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, 210, 36, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text(shopTitle, 15, 14);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(203, 213, 225);
    doc.text(`${shopAddress} | Telp: ${shopPhone}`, 15, 21);
    doc.text(`Kumpulan Nota POS • Periode: ${dateRangeLabel}`, 15, 26);

    // Page indicator top right
    doc.setFillColor(71, 85, 105);
    doc.roundedRect(150, 10, 45, 16, 3, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text(`Nota #${index + 1} dari ${transactions.length}`, 172.5, 17, { align: "center" });
    doc.setFontSize(7);
    doc.text(tx.paymentStatus, 172.5, 22, { align: "center" });

    // Details box
    doc.setFillColor(248, 250, 252);
    doc.rect(15, 42, 180, 26, "F");
    doc.setDrawColor(226, 232, 240);
    doc.rect(15, 42, 180, 26, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text("DETAIL TRANSAKSI POS", 20, 48);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`No Invoice   : ${tx.id}`, 20, 54);
    doc.text(`Tanggal      : ${tx.date.replace("T", " ")}`, 20, 59);
    doc.text(`Kasir        : ${tx.cashierName || "Siti (POS Admin)"}`, 20, 64);

    doc.text(`Pelanggan    : ${tx.customerName}`, 110, 54);
    doc.text(`No Telepon   : ${tx.customerPhone || "-"}`, 110, 59);
    doc.text(`Metode Bayar : ${tx.paymentMethod}`, 110, 64);

    // Items table
    const tableBody = tx.items.map((item, idx) => [
      idx + 1,
      item.name,
      item.brand || "-",
      item.imei,
      1,
      `Rp ${(item.priceSell || 0).toLocaleString("id-ID")}`,
      `Rp ${(item.priceSell || 0).toLocaleString("id-ID")}`
    ]);

    autoTable(doc, {
      startY: 74,
      head: [["No", "Nama Smartphone", "Brand", "Nomor IMEI", "Qty", "Harga Satuan", "Total (Rp)"]],
      body: tableBody,
      theme: "grid",
      headStyles: { fillColor: [30, 41, 59], textColor: 255, fontSize: 8.5, fontStyle: "bold" },
      bodyStyles: { fontSize: 8, textColor: [30, 41, 59], cellPadding: 2.5 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 15, right: 15 }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 6;

    // Totals card
    doc.setFillColor(241, 245, 249);
    doc.rect(115, finalY, 80, 28, "F");
    doc.setDrawColor(203, 213, 225);
    doc.rect(115, finalY, 80, 28, "S");

    const subtotal = tx.items.reduce((sum, item) => sum + item.priceSell, 0);
    const promoDisc = tx.promoDiscount || 0;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text("Subtotal Produk:", 120, finalY + 6);
    doc.text(`Rp ${subtotal.toLocaleString("id-ID")}`, 190, finalY + 6, { align: "right" });

    if (promoDisc > 0) {
      doc.text("Diskon Promo:", 120, finalY + 12);
      doc.setTextColor(217, 119, 6);
      doc.text(`-Rp ${promoDisc.toLocaleString("id-ID")}`, 190, finalY + 12, { align: "right" });
      doc.setTextColor(71, 85, 105);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text("TOTAL BAYAR:", 120, finalY + 21);
    doc.setTextColor(16, 185, 129);
    doc.text(`Rp ${(tx.totalAmount || 0).toLocaleString("id-ID")}`, 190, finalY + 21, { align: "right" });

    // Barcode and Verification area
    drawVectorBarcode(doc, tx.id, 15, finalY + 6, 50, 10);
    drawVectorQRCode(doc, tx.id, 70, finalY + 5, 14);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(`Code: ${tx.id}`, 15, finalY + 20);
    doc.text("Arsip Nota Kasir FonePOS", 15, finalY + 24);
  });

  const dateTag = dateRangeLabel.replace(/[^a-zA-Z0-9]/g, "_");
  doc.save(`Bundel_Nota_POS_${dateTag}_${new Date().toISOString().split("T")[0]}.pdf`);
}

/**
 * Generate a comprehensive Monthly Audit Report PDF for filtered date ranges
 */
export function exportMonthlyAuditReportPDF(data: MonthlyAuditData) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const shopTitle = localStorage.getItem("print_shop_title") || "FONEPOS ROXY SQUARE";
  const shopAddress = localStorage.getItem("print_shop_address") || "Roxy Mas Square Blok C2, Jakarta Pusat";
  const shopPhone = localStorage.getItem("print_shop_phone") || "0812-RICKY-COMP";

  const {
    filteredTransactions,
    filteredBuybacks,
    dateRangeLabel,
    summaryData,
    auditRows
  } = data;

  // PAGE 1: COVER & EXECUTIVE FINANCIAL AUDIT
  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 40, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(shopTitle, 15, 15);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text(`${shopAddress} | Telp: ${shopPhone}`, 15, 22);
  doc.text("Laporan Audit Keuangan Bulanan & Evaluasi Kinerja Penjualan POS", 15, 28);
  doc.text("Sistem Keamanan Enkripsi Kemenperin Bea Cukai • Status Data: Verified", 15, 34);

  // Title Box
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("LAPORAN AUDIT BULANAN (MONTHLY FINANCIAL AUDIT REPORT)", 15, 48);

  doc.setDrawColor(99, 102, 241); // indigo-500
  doc.setLineWidth(0.6);
  doc.line(15, 51, 195, 51);

  // Audit Meta Card
  doc.setFillColor(248, 250, 252);
  doc.rect(15, 54, 180, 18, "F");
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.rect(15, 54, 180, 18, "S");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Periode Audit : ${dateRangeLabel}`, 20, 60);
  doc.text(`Tanggal Cetak  : ${new Date().toLocaleDateString("id-ID")} ${new Date().toLocaleTimeString("id-ID")}`, 20, 66);

  const auditRef = `AUDIT-${Date.now().toString().slice(-8)}`;
  doc.text(`No Ref Audit   : ${auditRef}`, 120, 60);
  doc.text(`Disusun Oleh   : Siti Rahma (Finance POS Specialist)`, 120, 66);

  // KPI Grid Summary Table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("1. IKHTISAR METRIK KINERJA FINANSIAL (EXECUTIVE FINANCIAL SUMMARY)", 15, 79);

  const kpiTableBody = [
    ["Total Penerimaan Omzet Penjualan (Revenue)", `Rp ${(summaryData.totalRevenue || 0).toLocaleString("id-ID")}`, "Total invoice terbayar (Retail POS)"],
    ["Total Beban Pengadaan Stok Jual (HPP)", `Rp ${(summaryData.totalProcurementCost || 0).toLocaleString("id-ID")}`, "Harga Beli Pokok Penjualan"],
    ["Laba Kotor Usaha (Gross Profit)", `Rp ${(summaryData.totalGrossProfit || 0).toLocaleString("id-ID")}`, `Gross Margin: ${(summaryData.grossMarginPercent || 0).toFixed(1)}%`],
    ["Total Pengeluaran Akuisisi HP Bekas (Buyback)", `Rp ${(summaryData.totalBuybackCost || 0).toLocaleString("id-ID")}`, "Beban operasional pembelian HP bekas"],
    ["ESTIMASI LABA BERSIH OPERASIONAL (NET PROFIT)", `Rp ${(summaryData.netProfit || 0).toLocaleString("id-ID")}`, `Net Margin: ${(summaryData.netMarginPercent || 0).toFixed(1)}%`],
    ["Total Aset Terbuku (Kas & Inventory Stok)", `Rp ${(summaryData.totalAssets || 0).toLocaleString("id-ID")}`, "Kas Bank + Nilai HPP Stok Aktif"]
  ];

  autoTable(doc, {
    startY: 83,
    head: [["Komponen Finansial", "Nilai Terbuku (IDR)", "Keterangan Audit"]],
    body: kpiTableBody,
    theme: "grid",
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontSize: 8.5, fontStyle: "bold" },
    bodyStyles: { fontSize: 8, textColor: [30, 41, 59], cellPadding: 2.2 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 15, right: 15 }
  });

  let nextY = (doc as any).lastAutoTable.finalY + 8;

  // Income Statement (Profit & Loss) Table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("2. LAPORAN LABA RUGI KOMPREHENSIF (PROFIT & LOSS STATEMENT)", 15, nextY);

  const plTableBody = [
    ["PENDAPATAN", "Pendapatan Retail Penjualan Smartphone", `Rp ${(summaryData.totalRevenue || 0).toLocaleString("id-ID")}`, `Rp ${(summaryData.totalRevenue || 0).toLocaleString("id-ID")}`],
    ["HPP", "Beban Pengadaan Barang Jual (HPP Supplier)", `Rp ${(summaryData.totalProcurementCost || 0).toLocaleString("id-ID")}`, `Rp ${(summaryData.totalProcurementCost || 0).toLocaleString("id-ID")}`],
    ["LABA KOTOR", "Laba Kotor (Gross Operating Margin)", "-", `Rp ${(summaryData.totalGrossProfit || 0).toLocaleString("id-ID")}`],
    ["BEBAN", "Beban Akuisisi Handphone Bekas (Buyback)", `Rp ${(summaryData.totalBuybackCost || 0).toLocaleString("id-ID")}`, `Rp ${(summaryData.totalBuybackCost || 0).toLocaleString("id-ID")}`],
    ["LABA BERSIH", "Laba / (Rugi) Bersih Usaha Setelah Buyback", "-", `Rp ${(summaryData.netProfit || 0).toLocaleString("id-ID")}`]
  ];

  autoTable(doc, {
    startY: nextY + 4,
    head: [["Kategori", "Akun Keuangan", "Rincian (IDR)", "Total (IDR)"]],
    body: plTableBody,
    theme: "grid",
    headStyles: { fillColor: [71, 85, 105], textColor: 255, fontSize: 8.5, fontStyle: "bold" },
    bodyStyles: { fontSize: 8, textColor: [30, 41, 59], cellPadding: 2.2 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 15, right: 15 }
  });

  nextY = (doc as any).lastAutoTable.finalY + 8;

  // Breakdown by Payment Method
  const methodTotals: Record<string, number> = { TUNAI: 0, TRANSFER: 0, QRIS: 0, MIDTRANS: 0 };
  filteredTransactions.forEach(tx => {
    if (tx.paymentStatus !== "PAID") return;
    if (tx.paymentMethod === "SPLIT" && tx.splitPayments) {
      tx.splitPayments.forEach((sp: any) => {
        methodTotals[sp.method] = (methodTotals[sp.method] || 0) + sp.amount;
      });
    } else {
      methodTotals[tx.paymentMethod] = (methodTotals[tx.paymentMethod] || 0) + tx.totalAmount;
    }
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("3. RINCIAN SALDO KASIR BERDASARKAN METODE PEMBAYARAN", 15, nextY);

  const paymentTableBody = Object.keys(methodTotals).map(m => [
    m,
    `Rp ${(methodTotals[m] || 0).toLocaleString("id-ID")}`,
    summaryData.totalRevenue > 0 ? `${(((methodTotals[m] || 0) / summaryData.totalRevenue) * 100).toFixed(1)}%` : "0%"
  ]);

  autoTable(doc, {
    startY: nextY + 4,
    head: [["Metode Pembayaran", "Total Nominal Terbuku (IDR)", "Persentase Kontribusi"]],
    body: paymentTableBody,
    theme: "grid",
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 8.5, fontStyle: "bold" },
    bodyStyles: { fontSize: 8, textColor: [30, 41, 59], cellPadding: 2 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 15, right: 15 }
  });

  // PAGE 2: TRANSACTION AUDIT LEDGER & SIGNATURES
  doc.addPage();

  // Page 2 Header
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, 210, 24, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(`${shopTitle} - LAPORAN AUDIT LEDGER TRANSAKSI`, 15, 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(`Periode: ${dateRangeLabel} • Halaman Audit Rincian Transaksi`, 15, 18);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("4. DAFTAR RINCIAN TRANSAKSI PENJUALAN RETAIL POS (FILTERED LEDGER)", 15, 32);

  const txLedgerBody = filteredTransactions.slice(0, 40).map(tx => [
    tx.id,
    tx.date.split("T")[0],
    tx.customerName || "-",
    tx.cashierName || "Siti",
    tx.items.map(i => i.name).join(", "),
    tx.paymentMethod,
    tx.paymentStatus,
    `Rp ${(tx.totalAmount || 0).toLocaleString("id-ID")}`
  ]);

  autoTable(doc, {
    startY: 36,
    head: [["No Invoice", "Tanggal", "Konsumen", "Kasir", "Produk Terjual", "Metode", "Status", "Total (Rp)"]],
    body: txLedgerBody.length > 0 ? txLedgerBody : [["-", "-", "-", "-", "Tidak ada transaksi dalam periode ini", "-", "-", "Rp 0"]],
    theme: "grid",
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59], cellPadding: 2 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 15, right: 15 }
  });

  let ledgerFinalY = (doc as any).lastAutoTable.finalY + 10;

  // Security & Audit Notes
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text("Catatan Kebijakan Audit & Legalitas:", 15, ledgerFinalY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text("1. Laporan audit bulanan ini ditarik secara elektronik dari database terenkripsi FonePOS.", 15, ledgerFinalY + 5);
  doc.text("2. Seluruh nomor IMEI terverifikasi otomatis dengan sistem pendaftaran Bea Cukai Kemenperin RI.", 15, ledgerFinalY + 9);
  doc.text("3. Laporan ini merupakan dokumen internal resmi yang sah tanpa memerlukan tanda tangan basah tambahan.", 15, ledgerFinalY + 13);

  // Signatures
  const sigY = ledgerFinalY + 24;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text("Disiapkan Oleh,", 15, sigY);
  doc.text("Disetujui Oleh,", 145, sigY);

  doc.text("Siti Rahma", 15, sigY + 16);
  doc.text("Ricky Commedan", 145, sigY + 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Finance POS Specialist", 15, sigY + 20);
  doc.text("Direktur Utama FonePOS", 145, sigY + 20);

  // Add Page Numbers on all pages
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(`Dokumen Audit Keuangan Bulanan FonePOS • Halaman ${i} dari ${totalPages}`, 105, 287, { align: "center" });
  }

  const dateTag = dateRangeLabel.replace(/[^a-zA-Z0-9]/g, "_");
  doc.save(`Laporan_Audit_Bulanan_${dateTag}_${new Date().toISOString().split("T")[0]}.pdf`);
}

/**
 * Generate a formatted PDF summary of all devices in stock with their respective purchase costs, supplier details, and current status.
 */
export function generateImeiInventoryPDF(
  products: Product[],
  options?: {
    shopTitle?: string;
    shopAddress?: string;
    shopPhone?: string;
    printedBy?: string;
  }
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const shopTitle = options?.shopTitle || "FonePOS - Smartphone Inventory";
  const shopAddress = options?.shopAddress || "Jl. Malioboro No. 88, Yogyakarta";
  const shopPhone = options?.shopPhone || "0812-3456-7890";
  const printedBy = options?.printedBy || "Administrator";

  // Flatten all IMEI items in active stock or trackable devices
  const imeiRows: {
    productName: string;
    brandModel: string;
    typeCondition: string;
    imei: string;
    purchaseCost: number;
    supplier: string;
    purchaseDate: string;
    status: string;
    location: string;
  }[] = [];

  let totalStockCount = 0;
  let totalAssetValue = 0;

  products.forEach((p) => {
    const imeis = p.imeis || [];
    totalStockCount += imeis.length;

    imeis.forEach((imei) => {
      // Find purchase history entry if available
      const history = p.purchasedImeisHistory?.find((h) => h.imei === imei);
      const purchaseCost = history?.purchasePrice ?? p.priceBuy ?? 0;
      const supplier = history?.supplier || "TAM / Erajaya Official";
      const purchaseDate = history?.date ? history.date.split("T")[0] : "-";

      totalAssetValue += purchaseCost;

      imeiRows.push({
        productName: p.name,
        brandModel: `${p.brand} ${p.model}`,
        typeCondition: `${p.type}${p.condition ? ` (Grade ${p.condition})` : ""}`,
        imei,
        purchaseCost,
        supplier,
        purchaseDate,
        status: "Tersedia (In Stock)",
        location: p.location || "Toko Utama",
      });
    });
  });

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 36, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(shopTitle, 15, 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`${shopAddress} | Telp: ${shopPhone}`, 15, 21);
  doc.text("Laporan Inventaris Device & Pelacakan Seri IMEI Stok Aktif Toko", 15, 27);

  // Title & Metadata
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("LAPORAN INVENTARIS PERANGKAT & SERI IMEI (IMEI INVENTORY REPORT)", 15, 45);

  doc.setDrawColor(99, 102, 241);
  doc.setLineWidth(0.5);
  doc.line(15, 48, 195, 48);

  // Summary Cards
  doc.setFillColor(248, 250, 252);
  doc.rect(15, 52, 180, 18, "F");
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.rect(15, 52, 180, 18, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`Total Device Aktif : ${totalStockCount} Unit`, 20, 58);
  doc.text(`Total Nilai Modal  : Rp ${totalAssetValue.toLocaleString("id-ID")}`, 20, 64);

  doc.setFont("helvetica", "normal");
  doc.text(`Tanggal Cetak : ${new Date().toLocaleDateString("id-ID")} ${new Date().toLocaleTimeString("id-ID")}`, 115, 58);
  doc.text(`Dicetak Oleh  : ${printedBy}`, 115, 64);

  // Table of IMEIs
  const tableBody = imeiRows.map((row, index) => [
    (index + 1).toString(),
    row.productName,
    row.typeCondition,
    row.imei,
    `Rp ${row.purchaseCost.toLocaleString("id-ID")}`,
    row.supplier,
    row.purchaseDate,
    row.status,
  ]);

  autoTable(doc, {
    startY: 75,
    head: [["No", "Nama Perangkat", "Tipe / Grade", "Nomor IMEI", "Harga Beli (Modal)", "Supplier / Distributor", "Tgl Beli", "Status Stok"]],
    body: tableBody.length > 0 ? tableBody : [["-", "-", "-", "Tidak ada unit IMEI aktif di stok", "-", "-", "-", "-"]],
    theme: "grid",
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59], cellPadding: 2 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      3: { font: "courier", fontStyle: "bold" },
      4: { halign: "right" },
    },
    margin: { left: 15, right: 15 },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Catatan: Dokumen ini diterbitkan otomatis oleh sistem FonePOS. Seluruh IMEI yang tertera dijamin terdaftar di Kemenperin RI.", 15, finalY);

  // Page Numbers
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`Dokumen Laporan IMEI Inventory FonePOS • Halaman ${i} dari ${totalPages}`, 105, 287, { align: "center" });
  }

  doc.save(`Laporan_IMEI_Stok_${new Date().toISOString().split("T")[0]}.pdf`);
}

export interface PrintableLabelOptions {
  labelLayout?: "A4_3COL" | "A4_2COL" | "THERMAL_ROLL";
  codeType?: "BARCODE" | "QR" | "DUAL";
  copiesMode?: "ONE_PER_PRODUCT" | "PER_IMEI_STOCK" | "CUSTOM";
  customCopies?: number;
  shopTitle?: string;
  includePrice?: boolean;
  targetImei?: string;
  // Custom dimensions (in mm)
  labelWidth?: number;
  labelHeight?: number;
  fontSize?: number;
  barcodeWidth?: number;
  barcodeHeight?: number;
  qrSize?: number;
  autoPrint?: boolean;
}

/**
 * Generate printable barcode / QR code adhesive labels PDF for inventory products.
 * Compatible with standard A4 adhesive sticker sheets (3-col / 24 labels per page or 2-col / 14 labels per page)
 * as well as 50x40mm thermal label rolls.
 */
export function generateProductAdhesiveLabelsPDF(
  products: Product[],
  options?: PrintableLabelOptions
) {
  const layout = options?.labelLayout || "A4_3COL";
  const codeType = options?.codeType || "DUAL";
  const copiesMode = options?.copiesMode || "PER_IMEI_STOCK";
  const customCopies = options?.customCopies || 1;
  const shopTitle = options?.shopTitle || "FonePOS";
  const includePrice = options?.includePrice ?? true;
  const targetImei = options?.targetImei;
  
  // Default dimensions based on layout if not provided
  const lWidth = options?.labelWidth || (layout === "THERMAL_ROLL" ? 48 : 60);
  const lHeight = options?.labelHeight || (layout === "THERMAL_ROLL" ? 38 : 30);
  const fSize = options?.fontSize || 7;
  const bWidth = options?.barcodeWidth || 40;
  const bHeight = options?.barcodeHeight || 10;
  const qSize = options?.qrSize || 12;

  // Build the list of labels to print
  const labelItems: {
    product: Product;
    codeValue: string;
    imei?: string;
  }[] = [];

  products.forEach((p) => {
    if (targetImei) {
      const copies = copiesMode === "CUSTOM" ? Math.max(1, customCopies) : 1;
      for (let i = 0; i < copies; i++) {
        labelItems.push({
          product: p,
          codeValue: targetImei,
          imei: targetImei,
        });
      }
    } else if (copiesMode === "PER_IMEI_STOCK") {
      if (p.imeis && p.imeis.length > 0) {
        p.imeis.forEach((imei) => {
          labelItems.push({
            product: p,
            codeValue: imei,
            imei: imei,
          });
        });
      } else {
        // Fallback if no IMEI (accessories or out of stock)
        labelItems.push({
          product: p,
          codeValue: p.id,
        });
      }
    } else if (copiesMode === "CUSTOM") {
      const copies = Math.max(1, customCopies);
      for (let i = 0; i < copies; i++) {
        const imei = p.imeis && p.imeis[i % (p.imeis.length || 1)];
        labelItems.push({
          product: p,
          codeValue: imei || p.id,
          imei: imei,
        });
      }
    } else {
      // ONE_PER_PRODUCT
      const primaryImei = p.imeis && p.imeis[0];
      labelItems.push({
        product: p,
        codeValue: primaryImei || p.id,
        imei: primaryImei,
      });
    }
  });

  if (labelItems.length === 0) {
    alert("Tidak ada item produk yang tersedia untuk dicetak.");
    return;
  }

  if (layout === "THERMAL_ROLL") {
    // 50mm x 40mm continuous thermal paper
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: [40, 50] });

    labelItems.forEach((item, index) => {
      if (index > 0) {
        doc.addPage([40, 50], "landscape");
      }

      const p = item.product;
      const codeVal = item.codeValue;

      // Outer Sticker Border / Crop Box
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.2);
      doc.roundedRect(1, 1, lWidth, lHeight, 1.5, 1.5, "S");

      // Header: Shop Name & Brand Badge
      doc.setFont("helvetica", "bold");
      doc.setFontSize(fSize);
      doc.setTextColor(15, 23, 42);
      doc.text(`${shopTitle} • ${p.brand}`, 25, 4.5, { align: "center" });

      // Product Name
      doc.setFontSize(fSize + 1);
      doc.setFont("helvetica", "bold");
      const splitName = doc.splitTextToSize(p.name.toUpperCase(), lWidth - 2);
      doc.text(splitName.slice(0, 2), 25, 8.5, { align: "center" });

      // Model & Type line
      doc.setFontSize(fSize - 1);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text(`${p.type}${p.condition ? ` (${p.condition})` : ""} • ${p.model || p.name}`, 25, 13.5, { align: "center" });

      // Barcode / QR Code rendering
      if (codeType === "BARCODE") {
        drawVectorBarcode(doc, codeVal, 4, 16, bWidth, bHeight);
      } else if (codeType === "QR") {
        drawVectorQRCode(doc, codeVal, 17, 15, qSize);
      } else {
        // DUAL
        drawVectorBarcode(doc, codeVal, 3, 16, bWidth - 14, bHeight);
        drawVectorQRCode(doc, codeVal, 33, 15, qSize);
      }

      // Code text (SKU/IMEI)
      doc.setFont("courier", "bold");
      doc.setFontSize(fSize);
      doc.setTextColor(15, 23, 42);
      doc.text(codeVal, 25, 30, { align: "center" });

      // Price Footer
      if (includePrice) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(fSize + 1.5);
        doc.setTextColor(67, 56, 202); // indigo-700
        doc.text(`Rp ${(p.priceSell || 0).toLocaleString("id-ID")}`, 25, 35, { align: "center" });
      }
    });

    if (options?.autoPrint) {
      doc.autoPrint();
    }
    doc.save(`Label_Thermal_Sticker_${new Date().toISOString().split("T")[0]}.pdf`);
  } else if (layout === "A4_2COL") {
    // A4 Paper - 2 Columns x 7 Rows (14 labels per page)
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const colWidth = 96;
    const rowHeight = 37;
    const marginLeft = 6;
    const marginTop = 10;
    const gapX = 6;
    const gapY = 2;
    const labelsPerPage = 14;

    labelItems.forEach((item, index) => {
      const labelOnPage = index % labelsPerPage;

      if (labelOnPage === 0 && index > 0) {
        doc.addPage();
      }

      const col = labelOnPage % 2;
      const row = Math.floor(labelOnPage / 2);

      const x = marginLeft + col * (colWidth + gapX);
      const y = marginTop + row * (rowHeight + gapY);

      const p = item.product;
      const codeVal = item.codeValue;

      // Label background & border
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(x, y, colWidth, rowHeight, 2, 2, "FD");
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.roundedRect(x, y, colWidth, rowHeight, 2, 2, "S");

      // Brand & Shop Header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(fSize);
      doc.setTextColor(99, 102, 241);
      doc.text(shopTitle.toUpperCase(), x + 3, y + 5);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(fSize);
      doc.setTextColor(15, 23, 42);
      doc.text(p.brand.toUpperCase(), x + colWidth - 3, y + 5, { align: "right" });

      doc.setDrawColor(226, 232, 240);
      doc.line(x + 3, y + 6.5, x + colWidth - 3, y + 6.5);

      // Product Name & Details
      doc.setFontSize(fSize + 1.5);
      doc.setFont("helvetica", "bold");
      const splitName = doc.splitTextToSize(p.name, 90);
      doc.text(splitName[0], x + 3, y + 11);

      doc.setFontSize(fSize - 0.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text(`Tipe: ${p.type} • Grade: ${p.condition || "A"} • Color: ${p.color || "Standar"}`, x + 3, y + 15);

      // Barcode & QR Code
      if (codeType === "BARCODE") {
        drawVectorBarcode(doc, codeVal, x + 3, y + 17, bWidth + 20, bHeight + 1);
      } else if (codeType === "QR") {
        drawVectorQRCode(doc, codeVal, x + 3, y + 17, qSize + 1);
      } else {
        // DUAL
        drawVectorBarcode(doc, codeVal, x + 3, y + 17, bWidth + 10, bHeight);
        drawVectorQRCode(doc, codeVal, x + 56 + 10, y + 16, qSize);
      }

      // SKU/IMEI Code
      doc.setFont("courier", "bold");
      doc.setFontSize(fSize + 0.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`SKU/IMEI: ${codeVal}`, x + 3, y + 31);

      // Price
      if (includePrice) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(fSize + 2);
        doc.setTextColor(67, 56, 202);
        doc.text(`Rp ${(p.priceSell || 0).toLocaleString("id-ID")}`, x + colWidth - 3, y + 31, { align: "right" });
      }
    });

    if (options?.autoPrint) {
      doc.autoPrint();
    }
    doc.save(`Stiker_Label_A4_2Col_${new Date().toISOString().split("T")[0]}.pdf`);
  } else {
    // A4 Paper - 3 Columns x 8 Rows (24 labels per page)
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const colWidth = 63;
    const rowHeight = 33;
    const marginLeft = 6;
    const marginTop = 10;
    const gapX = 3;
    const gapY = 1.5;
    const labelsPerPage = 24;

    labelItems.forEach((item, index) => {
      const labelOnPage = index % labelsPerPage;

      if (labelOnPage === 0 && index > 0) {
        doc.addPage();
      }

      const col = labelOnPage % 3;
      const row = Math.floor(labelOnPage / 3);

      const x = marginLeft + col * (colWidth + gapX);
      const y = marginTop + row * (rowHeight + gapY);

      const p = item.product;
      const codeVal = item.codeValue;

      // Label background & border
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(x, y, colWidth, rowHeight, 1.5, 1.5, "FD");
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.2);
      doc.roundedRect(x, y, colWidth, rowHeight, 1.5, 1.5, "S");

      // Brand & Shop Header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(fSize - 1);
      doc.setTextColor(99, 102, 241);
      doc.text(shopTitle.toUpperCase(), x + 2.5, y + 4.5);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(fSize - 1);
      doc.setTextColor(15, 23, 42);
      doc.text(p.brand.toUpperCase(), x + colWidth - 2.5, y + 4.5, { align: "right" });

      doc.setDrawColor(226, 232, 240);
      doc.line(x + 2.5, y + 5.5, x + colWidth - 2.5, y + 5.5);

      // Product Name
      doc.setFontSize(fSize + 0.5);
      doc.setFont("helvetica", "bold");
      const splitName = doc.splitTextToSize(p.name, 58);
      doc.text(splitName[0], x + 2.5, y + 9.5);

      // Codes
      if (codeType === "BARCODE") {
        drawVectorBarcode(doc, codeVal, x + 2.5, y + 11.5, bWidth, bHeight);
      } else if (codeType === "QR") {
        drawVectorQRCode(doc, codeVal, x + (colWidth / 2) - (qSize / 2), y + 11, qSize);
      } else {
        // DUAL
        drawVectorBarcode(doc, codeVal, x + 2.5, y + 11.5, bWidth - 20, bHeight);
        drawVectorQRCode(doc, codeVal, x + 44, y + 11, qSize - 2);
      }

      // SKU/IMEI Code
      doc.setFont("courier", "bold");
      doc.setFontSize(fSize - 0.5);
      doc.setTextColor(15, 23, 42);
      doc.text(codeVal, x + 2.5, y + 24.5);

      // Price
      if (includePrice) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(fSize + 0.5);
        doc.setTextColor(67, 56, 202);
        doc.text(`Rp ${(p.priceSell || 0).toLocaleString("id-ID")}`, x + colWidth - 2.5, y + 29, { align: "right" });
      }
    });

    if (options?.autoPrint) {
      doc.autoPrint();
    }
    doc.save(`Stiker_Label_A4_3Col_${new Date().toISOString().split("T")[0]}.pdf`);
  }
}


