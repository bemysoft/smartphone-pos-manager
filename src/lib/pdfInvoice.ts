import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Transaction } from "../types";

export const generateInvoicePDF = (tx: Transaction, storeConfig?: {
  storeName?: string;
  storeAddress?: string;
  storePhone?: string;
}) => {
  const doc = new jsPDF();

  const storeName = storeConfig?.storeName || "FONEPOS SMARTPHONE STORE";
  const storeAddress = storeConfig?.storeAddress || "Jl. Malioboro No. 88, Yogyakarta";
  const storePhone = storeConfig?.storePhone || "+62 812-3456-7890";

  // Header Color Bar
  doc.setFillColor(30, 41, 59); // slate-900
  doc.rect(0, 0, 210, 36, "F");

  // Store Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  doc.text(storeName, 14, 15);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(`${storeAddress} | Telp/WA: ${storePhone}`, 14, 23);

  // Document Title Right Aligned
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("STRUK / INVOICE TRANSAKSI", 196, 15, { align: "right" });

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(203, 213, 225);
  doc.text(`No: ${tx.id}`, 196, 23, { align: "right" });

  // Metadata Box (Customer & Order Info)
  const txDate = tx.date ? new Date(tx.date).toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }) : "-";

  // Box background for metadata
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 40, 182, 32, 2, 2, "FD");

  // Customer Info (Left)
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.text("PELANGGAN & MEMBER:", 18, 47);
  doc.setFont("helvetica", "normal");
  doc.text(`Nama    : ${tx.customerName || "Pelanggan Umum"}`, 18, 53);
  doc.text(`Telepon : ${tx.customerPhone || "-"}`, 18, 59);

  const ptsEarned = tx.pointsEarned ?? Math.floor((tx.totalAmount || 0) / 1000);
  const ptsUsed = tx.pointsUsed ?? (tx.pointsDiscount ? tx.pointsDiscount : 0);
  const ptsBefore = (tx as any).customerPointsBefore ?? ((tx as any).customerPointsAfter !== undefined ? Math.max(0, (tx as any).customerPointsAfter + ptsUsed - ptsEarned) : 0);
  const ptsAfter = (tx as any).customerPointsAfter ?? (ptsBefore - ptsUsed + ptsEarned);
  const loyaltyTier = tx.loyaltyTier || (ptsAfter >= 1000 ? "VIP Platinum" : ptsAfter >= 500 ? "Gold Member" : ptsAfter >= 100 ? "Silver Member" : "Regular Member");

  doc.setFont("helvetica", "bold");
  doc.setTextColor(99, 102, 241); // indigo-600
  doc.text(`Tier Member : ${loyaltyTier}`, 18, 65);

  // Transaction Info (Right)
  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "bold");
  doc.text("DETAIL TRANSAKSI:", 110, 47);
  doc.setFont("helvetica", "normal");
  doc.text(`Tanggal  : ${txDate}`, 110, 53);
  doc.text(`Kasir    : ${tx.cashierName || tx.employeeName || "Siti Rahma"}`, 110, 59);
  doc.text(`Pembayaran : ${tx.paymentMethod || "TUNAI"} (${tx.paymentStatus || "LUNAS"})`, 110, 65);

  // Table Items
  const tableData = (tx.items || []).map((item: any, index: number) => {
    const qty = item.quantity || 1;
    const price = item.priceSell || item.price || 0;
    const total = qty * price;
    const details = [];
    if (item.brand || item.type) details.push(`[${item.brand || ""} - ${item.type || "BARU"}]`);
    if (item.imei) details.push(`IMEI/SN: ${item.imei}`);

    const detailStr = details.length > 0 ? `\n${details.join(" | ")}` : "";

    return [
      (index + 1).toString(),
      `${item.name || item.productName || "Produk"}${detailStr}`,
      qty.toString(),
      `Rp ${price.toLocaleString("id-ID")}`,
      `Rp ${total.toLocaleString("id-ID")}`
    ];
  });

  autoTable(doc, {
    startY: 76,
    head: [["No", "Nama Produk / Deskripsi Item & IMEI", "Qty", "Harga Satuan", "Total"]],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: [79, 70, 229], // Indigo 600
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8.5
    },
    styles: {
      fontSize: 8,
      cellPadding: 3.5
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 97 },
      2: { cellWidth: 15, halign: "center" },
      3: { cellWidth: 35, halign: "right" },
      4: { cellWidth: 35, halign: "right" }
    }
  });

  // Calculate position for Totals
  const finalY = (doc as any).lastAutoTable?.finalY || 130;

  // Subtotal & Financial Calculations
  const rawSubtotal = (tx as any).subtotalAmount || (tx.items || []).reduce((sum: number, item: any) => sum + (item.priceSell || item.price || 0) * (item.quantity || 1), 0);
  const taxPct = (tx as any).taxPpnPercentage !== undefined ? (tx as any).taxPpnPercentage : 11;
  const taxAmt = (tx as any).taxPpnAmount !== undefined ? (tx as any).taxPpnAmount : Math.round((rawSubtotal * taxPct) / 100);
  const promoDisc = tx.promoDiscount || tx.discountAmount || 0;
  const loyaltyDisc = tx.loyaltyDiscount || 0;
  const pointsDisc = tx.pointsDiscount || (tx.pointsUsed ? tx.pointsUsed : 0);
  const manualDisc = tx.manualDiscount || 0;
  const tradeInVal = tx.tradeInValue || tx.tradeInAllowance || 0;
  const grandTotal = tx.totalAmount || Math.max(0, rawSubtotal + taxAmt - promoDisc - loyaltyDisc - pointsDisc - manualDisc - tradeInVal);

  // Draw Loyalty Points Box (Left)
  doc.setFillColor(238, 242, 255); // indigo-50
  doc.setDrawColor(199, 210, 254); // indigo-200
  doc.roundedRect(14, finalY + 8, 92, 42, 2, 2, "FD");

  doc.setTextColor(49, 46, 129); // indigo-900
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.text("⭐ POIN LOYALITAS PELANGGAN", 18, finalY + 15);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(67, 56, 202);

  doc.text(`• Saldo Poin Awal          : ${ptsBefore.toLocaleString("id-ID")} Poin`, 18, finalY + 22);
  doc.text(`• Poin Digunakan (Diskon)  : ${ptsUsed.toLocaleString("id-ID")} Poin (-Rp ${ptsUsed.toLocaleString("id-ID")})`, 18, finalY + 28);
  doc.text(`• Bonus Poin Diperoleh     : +${ptsEarned.toLocaleString("id-ID")} Poin`, 18, finalY + 34);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 27, 75);
  doc.text(`• TOTAL SALDO POIN AKHIR : ${ptsAfter.toLocaleString("id-ID")} Poin`, 18, finalY + 42);

  // Financial Summary Breakdown (Right)
  let currentY = finalY + 10;
  const rightLabelX = 115;
  const rightValX = 196;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);

  // Subtotal
  doc.text("Subtotal Belanja:", rightLabelX, currentY);
  doc.text(`Rp ${rawSubtotal.toLocaleString("id-ID")}`, rightValX, currentY, { align: "right" });
  currentY += 5;

  // Pajak PPN
  doc.text(`Pajak PPN (${taxPct}%):`, rightLabelX, currentY);
  doc.text(`+Rp ${taxAmt.toLocaleString("id-ID")}`, rightValX, currentY, { align: "right" });
  currentY += 5;

  if (promoDisc > 0) {
    doc.setTextColor(194, 65, 12);
    doc.text(`Diskon Promo (${tx.promoDescription || "Spesial"}):`, rightLabelX, currentY);
    doc.text(`-Rp ${promoDisc.toLocaleString("id-ID")}`, rightValX, currentY, { align: "right" });
    currentY += 5;
  }

  if (loyaltyDisc > 0) {
    doc.setTextColor(126, 34, 206);
    doc.text(`Diskon Tier Member (${loyaltyTier}):`, rightLabelX, currentY);
    doc.text(`-Rp ${loyaltyDisc.toLocaleString("id-ID")}`, rightValX, currentY, { align: "right" });
    currentY += 5;
  }

  if (pointsDisc > 0) {
    doc.setTextColor(180, 83, 9);
    doc.text("Potongan Penukaran Poin:", rightLabelX, currentY);
    doc.text(`-Rp ${pointsDisc.toLocaleString("id-ID")}`, rightValX, currentY, { align: "right" });
    currentY += 5;
  }

  if (manualDisc > 0) {
    doc.setTextColor(71, 85, 105);
    doc.text("Diskon Khusus Kasir:", rightLabelX, currentY);
    doc.text(`-Rp ${manualDisc.toLocaleString("id-ID")}`, rightValX, currentY, { align: "right" });
    currentY += 5;
  }

  if (tradeInVal > 0) {
    doc.setTextColor(225, 29, 72);
    doc.text(`Tukar Tambah (${tx.tradeInBrandModel || "Perangkat"}):`, rightLabelX, currentY);
    doc.text(`-Rp ${tradeInVal.toLocaleString("id-ID")}`, rightValX, currentY, { align: "right" });
    currentY += 5;
  }

  // Draw Grand Total Box
  currentY += 2;
  doc.setFillColor(243, 244, 246);
  doc.setDrawColor(79, 70, 229);
  doc.setLineWidth(0.6);
  doc.roundedRect(112, currentY - 4, 84, 12, 1.5, 1.5, "FD");

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text("TOTAL BELANJA:", 115, currentY + 3);

  doc.setTextColor(79, 70, 229);
  doc.setFontSize(10.5);
  doc.text(`Rp ${grandTotal.toLocaleString("id-ID")}`, rightValX - 2, currentY + 3, { align: "right" });

  currentY += 18;

  // Terms & Conditions / Garansi Box
  const boxBottomY = Math.max(finalY + 54, currentY);

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, boxBottomY, 182, 28, 2, 2, "FD");

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("SYARAT & KETENTUAN GARANSI TOKO:", 18, boxBottomY + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text("1. Garansi toko berlaku sesuai ketentuan serial IMEI terdaftar pada sistem database kami.", 18, boxBottomY + 11);
  doc.text("2. Garansi batal/hangus apabila terjadi kerusakan fisik, akibat cairan, atau segel garansi toko rusak.", 18, boxBottomY + 16);
  doc.text("3. Simpan lembar PDF struk resmi ini untuk klaim garansi atau layanan purna jual.", 18, boxBottomY + 21);
  doc.text(" Terima kasih telah berbelanja di store kami!", 18, boxBottomY + 25);

  // Signatures
  const sigY = boxBottomY + 35;
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text("Tanda Tangan Pelanggan,", 25, sigY);
  doc.text("Hormat Kami (Kasir / Store),", 145, sigY);

  doc.line(25, sigY + 16, 75, sigY + 16);
  doc.line(145, sigY + 16, 195, sigY + 16);

  doc.text(`( ${tx.customerName || "Pelanggan"} )`, 25, sigY + 21);
  doc.text(`( ${tx.cashierName || tx.employeeName || "Kasir Toko"} )`, 145, sigY + 21);

  doc.save(`Invoice_${tx.id}.pdf`);
};

