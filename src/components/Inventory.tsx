import { apiFetch } from '../lib/api';
import React, { useState, useEffect, useRef } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { Html5Qrcode } from "html5-qrcode";
import { 
  Plus, 
  Smartphone, 
  Trash2, 
  Search, 
  AlertOctagon, 
  Hash, 
  CheckCircle, 
  Boxes, 
  Database,
  Layers,
  FileSpreadsheet,
  AlertTriangle,
  QrCode,
  Printer,
  Sparkles,
  Camera,
  X,
  Barcode,
  ArrowRightLeft,
  History,
  MapPin,
  ClipboardCheck,
  Save,
  Download,
  Copy,
  Check,
  Grid,
  Table,
  ExternalLink,
  TrendingUp,
  FileText,
  Calendar,
  DollarSign,
  Building2,
  Eye,
  Image,
  Loader2,
  Maximize2,
  ZoomIn,
  ChevronDown,
  Filter,
  Edit2,
  Wand2
} from "lucide-react";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import JsBarcode from "jsbarcode";
import { generateImeiInventoryPDF, generateProductAdhesiveLabelsPDF } from "../lib/pdfExporter";
import { Product, Supplier } from "../types";
import Tooltip from "./Tooltip";
import LazyProductImage from "./LazyProductImage";
import PriceHistoryModal from "./PriceHistoryModal";
import { SkuGeneratorModal } from "./SkuGeneratorModal";
import { generateProductSku } from "../lib/skuGenerator";
import { useLanguage } from "../contexts/LanguageContext";

// Component to render 1D Barcode with JsBarcode
const BarcodeSVG: React.FC<{
  value: string;
  format?: string;
  width?: number;
  height?: number;
  fontSize?: number;
  displayValue?: boolean;
}> = ({ value, format = "CODE128", width = 1.6, height = 40, fontSize = 11, displayValue = true }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format: format || "CODE128",
          width,
          height,
          displayValue,
          fontSize,
          font: "monospace",
          margin: 4,
          background: "#ffffff",
          lineColor: "#000000"
        });
      } catch (err) {
        console.warn("JsBarcode generation error:", err);
      }
    }
  }, [value, format, width, height, fontSize, displayValue]);

  return <svg ref={svgRef} className="max-w-full mx-auto" />;
};

// Helper function to validate standard 15-digit IMEI format
const isValidIMEI = (imei: string): boolean => {
  const clean = (imei || "").trim().replace(/[\s-]/g, "");
  return /^\d{15}$/.test(clean);
};

// Helper function to generate Code 128 1D Barcode PNG Data URL
function generateCode128DataUrl(text: string, width = 200, height = 50): string {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    const CODE128B_PATTERNS: { [key: number]: string } = {
      0: "212222", 1: "222122", 2: "222221", 3: "121223", 4: "121322", 5: "131222", 6: "122223", 7: "122322", 8: "132222", 9: "221213",
      10: "221312", 11: "231212", 12: "112232", 13: "122132", 14: "122231", 15: "113222", 16: "123122", 17: "123221", 18: "223211", 19: "221132",
      20: "221231", 21: "213212", 22: "223112", 23: "312131", 24: "311222", 25: "321122", 26: "321212", 27: "312212", 28: "322112", 29: "322211",
      30: "212123", 31: "212321", 32: "232121", 33: "111323", 34: "131123", 35: "131321", 36: "112313", 37: "132113", 38: "132311", 39: "211313",
      40: "231113", 41: "231311", 42: "112133", 43: "112331", 44: "132131", 45: "113123", 46: "113321", 47: "133112", 48: "313111", 49: "211331",
      50: "231131", 51: "213113", 52: "213311", 53: "213131", 54: "311123", 55: "311321", 56: "331121", 57: "312113", 58: "312311", 59: "332111",
      60: "314111", 61: "221411", 62: "431111", 63: "111224", 64: "111422", 65: "121124", 66: "121421", 67: "141122", 68: "141221", 69: "112214",
      70: "112412", 71: "122114", 72: "122411", 73: "142112", 74: "142211", 75: "241211", 76: "221114", 77: "413111", 78: "241112", 79: "134111",
      80: "111242", 81: "121142", 82: "121241", 83: "114212", 84: "124112", 85: "124211", 86: "411212", 87: "421112", 88: "421211", 89: "212141",
      90: "214121", 91: "412121", 92: "111143", 93: "111341", 94: "131141", 95: "114113", 96: "114311", 97: "411113", 98: "411311", 99: "113141",
      100: "114131", 101: "311141", 102: "411131", 103: "211412", 104: "211214", 105: "211232"
    };

    const STOP_PATTERN = "2331112";

    let checksum = 104; // Start B index
    const patternList: string[] = [CODE128B_PATTERNS[104]];

    const safeText = (text || "PRD-001").trim();
    for (let i = 0; i < safeText.length; i++) {
      const code = safeText.charCodeAt(i) - 32;
      const charCode = Math.max(0, Math.min(code, 95));
      checksum += charCode * (i + 1);
      patternList.push(CODE128B_PATTERNS[charCode] || CODE128B_PATTERNS[0]);
    }

    const checkIndex = checksum % 103;
    patternList.push(CODE128B_PATTERNS[checkIndex]);
    patternList.push(STOP_PATTERN);

    const fullPattern = patternList.join("");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    const totalUnits = fullPattern.split("").reduce((sum, char) => sum + parseInt(char, 10), 0);
    const unitWidth = (width - 16) / Math.max(totalUnits, 1);
    let currentX = 8;

    ctx.fillStyle = "#000000";
    for (let i = 0; i < fullPattern.length; i++) {
      const barWidth = parseInt(fullPattern[i], 10) * unitWidth;
      if (i % 2 === 0) {
        ctx.fillRect(currentX, 4, barWidth, height - 8);
      }
      currentX += barWidth;
    }

    return canvas.toDataURL("image/png");
  } catch (err) {
    console.error("Failed to generate Code128 barcode:", err);
    return "";
  }
}

interface InventoryProps {
  products: Product[];
  onProductsChange: () => void;
  userRole: string;
  currentUser?: any;
}

export default function Inventory({ products: initialProducts, onProductsChange, userRole, currentUser }: InventoryProps) {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const selectedCategoryFilter = selectedCategories.length === 1 ? selectedCategories[0] : selectedCategories.length > 1 ? selectedCategories.join(", ") : "Semua";
  const [selectedStockStatusFilter, setSelectedStockStatusFilter] = useState("Semua");
  const [selectedBrandFilter, setSelectedBrandFilter] = useState("Semua");
  const [selectedConditionFilter, setSelectedConditionFilter] = useState("Semua");
  const [minPriceFilter, setMinPriceFilter] = useState("");
  const [maxPriceFilter, setMaxPriceFilter] = useState("");
  const [selectedPriceHistoryProduct, setSelectedPriceHistoryProduct] = useState<Product | null>(null);
  const [inventoryViewMode, setInventoryViewMode] = useState<"table" | "grid" | "grouped">("grouped");

  // Inline Editing Table States
  const [inlineEdit, setInlineEdit] = useState<{ id: string; field: 'stock' | 'priceSell' | 'priceBuy'; value: string } | null>(null);
  const [isSavingInline, setIsSavingInline] = useState(false);
  const [inlineSavedId, setInlineSavedId] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategoryFilter, selectedStockStatusFilter, selectedBrandFilter, selectedConditionFilter, minPriceFilter, maxPriceFilter, inventoryViewMode]);

  const handleOpenAddModalWithCategory = (catName: string) => {
    setIsEditMode(false);
    setEditingProductId("");
    setName("");
    setBrand("");
    setModel("");
    setColor("");
    setCondition("-");
    setPriceBuy("");
    setPriceSell("");
    setMinStockAlert("2");
    setSpecifications("");
    setImageUrl("");
    setBulkImeiInput("");
    setCategory(catName);
    if (catName === "Smartphone Bekas") {
      setType("BEKAS");
    } else {
      setType("BARU");
    }
    setShowAddModal(true);
  };
  
  const [isScanning, setIsScanning] = useState(false);
  const barcodeScannerRef = useRef<Html5Qrcode | null>(null);

  const startScanner = async () => {
    setIsScanning(true);
    barcodeScannerRef.current = new Html5Qrcode("reader");
    await barcodeScannerRef.current.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        setSearchQuery(decodedText);
        stopScanner();
      }
    );
  };

  const stopScanner = async () => {
    if (barcodeScannerRef.current?.isScanning) {
      await barcodeScannerRef.current.stop();
    }
    setIsScanning(false);
  };

  // Create / Edit modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingProductId, setEditingProductId] = useState("");
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [labelCodeMode, setLabelCodeMode] = useState<"BARCODE" | "QR" | "DUAL">("BARCODE");

  // SKU Generator Modal State
  const [showSkuGeneratorModal, setShowSkuGeneratorModal] = useState(false);
  const [skuGenPrefill, setSkuGenPrefill] = useState<{
    category?: string;
    brand?: string;
    model?: string;
    color?: string;
    type?: "BARU" | "BEKAS";
    condition?: string;
  }>({});

  // Delete product confirmation modal state
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Bulk Barcode Selection & Modal State
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [showBulkBarcodeModal, setShowBulkBarcodeModal] = useState(false);
  
  // Customization Options for Bulk Barcode
  const [bulkCopiesOption, setBulkCopiesOption] = useState<"per_stock" | "fixed_1" | "fixed_2" | "fixed_3" | "fixed_5">("per_stock");
  const [bulkLayoutFormat, setBulkLayoutFormat] = useState<"grid_a4" | "thermal_roll">("grid_a4");
  const [showStoreHeader, setShowStoreHeader] = useState(true);
  const [showProductPrice, setShowProductPrice] = useState(true);
  const [showBarcodeText, setShowBarcodeText] = useState(true);

  // Bulk Import state
  const [showImportValidationModal, setShowImportValidationModal] = useState(false);
  const [pendingImportProducts, setPendingImportProducts] = useState<Product[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Batch Adjustment state
  const [showBatchAdjustmentModal, setShowBatchAdjustmentModal] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<"ADD" | "SUBTRACT">("ADD");
  const [adjustmentAmount, setAdjustmentAmount] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState<string>("");

  // Monthly Opname PDF Report State
  const [showMonthlyOpnamePdfModal, setShowMonthlyOpnamePdfModal] = useState(false);
  const [opnameReportMonth, setOpnameReportMonth] = useState(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    return `${yyyy}-${mm}`;
  });

  const toggleSelectProduct = (productId: string) => {
    setSelectedProductIds(prev => 
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

      const validatedProducts: Product[] = jsonData.map(row => ({
        id: crypto.randomUUID(),
        tenantId: row.tenantId || "default-tenant",
        name: row.name || "Produk Baru",
        brand: row.brand || "Umum",
        model: row.model || "Umum",
        type: row.type || "BARU",
        priceBuy: Number(row.priceBuy || row.price) || 0,
        priceSell: Number(row.priceSell || row.price) || 0,
        stock: Number(row.stock) || 0,
        minStockAlert: Number(row.minStockAlert) || 5,
        imeis: row.imei ? String(row.imei).split(',') : [],
        category: row.category || "Umum",
        condition: row.condition || "BARU",
        description: row.description || "",
        warehouseLocation: row.warehouseLocation || "Gudang Utama",
      }));

      setPendingImportProducts(validatedProducts);
      setShowImportValidationModal(true);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDownloadStockReport = () => {
    const doc = new jsPDF();
    doc.text("Laporan Stok Kritis", 14, 15);
    
    const criticalStocks = products.filter(p => p.stock <= (p.minStockAlert || 5));
    const totalAssetValue = products.reduce((sum, p) => sum + (p.priceSell * p.stock), 0);

    autoTable(doc, {
      head: [['Produk', 'Stok', 'Lokasi', 'Harga Jual']],
      body: criticalStocks.map(p => [p.name, p.stock, p.location || '-', `Rp ${p.priceSell.toLocaleString()}`]),
      startY: 20
    });

    doc.text(`Total Nilai Aset Inventaris: Rp ${totalAssetValue.toLocaleString()}`, 14, (doc as any).lastAutoTable.finalY + 10);
    doc.save("Laporan_Stok_Kritis.pdf");
  };

  const handleGenerateMonthlyOpnamePDF = (targetMonthStr?: string) => {
    const monthVal = targetMonthStr || opnameReportMonth || "2026-08";
    const [yearStr, monthNumStr] = monthVal.split("-");
    const monthNames = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const monthIdx = parseInt(monthNumStr, 10) - 1;
    const monthNameLabel = `${monthNames[monthIdx] || "Agustus"} ${yearStr || "2026"}`;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const storeName = currentUser?.storeName || "SMARTPHONE POS & INVENTORY";
    const auditorName = currentUser?.name || "Manager Operasional";

    // Calculations
    let totalSystemUnits = 0;
    let totalPhysicalUnits = 0;
    let totalValuationBuy = 0;
    let totalValuationSell = 0;
    let totalVarianceUnits = 0;
    let totalVarianceLossValue = 0;
    let totalVarianceSurplusValue = 0;
    let matchCount = 0;
    let discrepancyCount = 0;

    const tableBody = products.map((p, idx) => {
      const opItem = opnameItems.find(item => item.productId === p.id);
      const systemStock = p.stock || 0;
      const physicalStock = opItem ? opItem.physicalStock : p.stock;
      const variance = physicalStock - systemStock;

      const buyPrice = p.priceBuy || 0;
      const sellPrice = p.priceSell || 0;
      const assetValBuy = systemStock * buyPrice;
      const assetValSell = systemStock * sellPrice;
      const varValue = Math.abs(variance) * buyPrice;

      totalSystemUnits += systemStock;
      totalPhysicalUnits += physicalStock;
      totalValuationBuy += assetValBuy;
      totalValuationSell += assetValSell;

      if (variance === 0) {
        matchCount++;
      } else {
        discrepancyCount++;
        totalVarianceUnits += variance;
        if (variance < 0) {
          totalVarianceLossValue += varValue;
        } else {
          totalVarianceSurplusValue += varValue;
        }
      }

      let statusLabel = "Sesuai";
      if (variance < 0) statusLabel = `Kurang (${variance})`;
      else if (variance > 0) statusLabel = `Lebih (+${variance})`;

      return [
        (idx + 1).toString(),
        p.name,
        p.brand || p.category || "HP",
        systemStock.toString(),
        physicalStock.toString(),
        variance > 0 ? `+${variance}` : variance.toString(),
        `Rp ${buyPrice.toLocaleString("id-ID")}`,
        `Rp ${assetValBuy.toLocaleString("id-ID")}`,
        `Rp ${varValue.toLocaleString("id-ID")}`,
        statusLabel
      ];
    });

    const potentialMargin = totalValuationSell - totalValuationBuy;

    // Header Banner
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 30, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("LAPORAN BULANAN STOK OPNAME & VALUASI INVENTARIS", 14, 12);

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.text(`Outlet: ${storeName}   |   Periode Audit: ${monthNameLabel}`, 14, 19);
    doc.text(`Penanggung Jawab: ${auditorName}   |   Waktu Cetak: ${new Date().toLocaleString("id-ID")}`, 14, 25);

    // Executive Summary
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("RINGKASAN VALUASI ASET INVENTARIS & SELISIH AUDIT STOK", 14, 38);

    // Card 1: Valuasi Inventaris
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, 42, 88, 30, 2, 2, "FD");

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(71, 85, 105);
    doc.text("TOTAL NILAI ASET INVENTARIS (HARGA MODAL)", 18, 48);

    doc.setFontSize(11);
    doc.setTextColor(79, 70, 229); // Indigo
    doc.text(`Rp ${totalValuationBuy.toLocaleString("id-ID")}`, 18, 55);

    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "normal");
    doc.text(`Potensi Omzet Penjualan: Rp ${totalValuationSell.toLocaleString("id-ID")}`, 18, 61);
    doc.text(`Estimasi Marjin Keuntungan: Rp ${potentialMargin.toLocaleString("id-ID")}`, 18, 67);

    // Card 2: Ringkasan Selisih
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(108, 42, 88, 30, 2, 2, "FD");

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(71, 85, 105);
    doc.text("RINGKASAN FISIK & SELISIH STOK OPNAME", 112, 48);

    doc.setFontSize(11);
    if (totalVarianceLossValue > 0) {
      doc.setTextColor(225, 29, 72); // Rose red
    } else {
      doc.setTextColor(16, 185, 129); // Emerald
    }
    doc.text(`Net Selisih Stok: ${totalVarianceUnits >= 0 ? "+" : ""}${totalVarianceUnits} Unit`, 112, 55);

    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "normal");
    doc.text(`Pencocokan: ${matchCount} Sesuai, ${discrepancyCount} SKU Selisih`, 112, 61);
    doc.text(`Estimasi Kerugian Selisih Modal: Rp ${totalVarianceLossValue.toLocaleString("id-ID")}`, 112, 67);

    // AutoTable
    autoTable(doc, {
      head: [["No", "Nama Produk", "Brand", "Sistem", "Fisik", "Selisih", "Harga Modal", "Nilai Aset Modal", "Nilai Selisih", "Status"]],
      body: tableBody,
      startY: 78,
      styles: { fontSize: 7, cellPadding: 2, overflow: "linebreak" },
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: "bold" },
      columnStyles: {
        0: { cellWidth: 8, halign: "center" },
        1: { cellWidth: 42 },
        2: { cellWidth: 16 },
        3: { halign: "center", cellWidth: 13 },
        4: { halign: "center", cellWidth: 13 },
        5: { halign: "center", cellWidth: 13 },
        6: { halign: "right", cellWidth: 22 },
        7: { halign: "right", cellWidth: 24 },
        8: { halign: "right", cellWidth: 20 },
        9: { cellWidth: 19 }
      },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 5) {
          const val = data.cell.raw as string;
          if (val.startsWith("-")) {
            data.cell.styles.textColor = [225, 29, 72];
            data.cell.styles.fontStyle = "bold";
          } else if (val.startsWith("+")) {
            data.cell.styles.textColor = [16, 185, 129];
            data.cell.styles.fontStyle = "bold";
          }
        }
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 180;
    const pageHeight = doc.internal.pageSize.getHeight();

    let signY = finalY + 15;
    if (signY > pageHeight - 35) {
      doc.addPage();
      signY = 30;
    }

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);

    doc.text("Petugas Audit Stok / Gudang,", 20, signY);
    doc.line(20, signY + 18, 75, signY + 18);
    doc.text(`(${auditorName})`, 20, signY + 23);

    doc.text("Mengetahui, Manager Operasional / Owner", 125, signY);
    doc.line(125, signY + 18, 185, signY + 18);
    doc.text("(                                                  )", 125, signY + 23);

    doc.save(`Laporan_Stok_Opname_Bulanan_${monthNumStr}_${yearStr}.pdf`);
  };

  const toggleSelectAllFiltered = (filteredList: Product[]) => {
    const filteredIds = filteredList.map(p => p.id);
    const allSelected = filteredIds.length > 0 && filteredIds.every(id => selectedProductIds.includes(id));
    
    if (allSelected) {
      setSelectedProductIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      setSelectedProductIds(prev => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const getSelectedProducts = () => {
    return products.filter(p => selectedProductIds.includes(p.id));
  };

  const getCalculatedLabelList = () => {
    const activeProducts = getSelectedProducts();
    const labelItems: { product: Product; code: string }[] = [];

    activeProducts.forEach(p => {
      let copies = 1;
      if (bulkCopiesOption === "per_stock") {
        copies = Math.max(p.stock, 1);
      } else if (bulkCopiesOption === "fixed_1") {
        copies = 1;
      } else if (bulkCopiesOption === "fixed_2") {
        copies = 2;
      } else if (bulkCopiesOption === "fixed_3") {
        copies = 3;
      } else if (bulkCopiesOption === "fixed_5") {
        copies = 5;
      }

      for (let c = 0; c < copies; c++) {
        const codeVal = (p.imeis && p.imeis.length > 0) ? p.imeis[c % p.imeis.length] : (p.id || "PRD-001");
        labelItems.push({ product: p, code: codeVal });
      }
    });

    return labelItems;
  };

  const handleDownloadBulkBarcodePDF = () => {
    const labelItems = getCalculatedLabelList();
    if (labelItems.length === 0) {
      alert("Pilih minimal 1 produk untuk mencetak barcode.");
      return;
    }

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const storeName = currentUser?.storeName || "SMARTPHONE POS & INVENTORY";

    if (bulkLayoutFormat === "grid_a4") {
      const cols = 3;
      const rows = 7;
      const labelW = 60;
      const labelH = 36;
      const startX = 10;
      const startY = 10;
      const gapX = 3;
      const gapY = 3;

      let colIndex = 0;
      let rowIndex = 0;

      labelItems.forEach((item, index) => {
        if (index > 0 && index % (cols * rows) === 0) {
          doc.addPage();
          colIndex = 0;
          rowIndex = 0;
        }

        const x = startX + colIndex * (labelW + gapX);
        const y = startY + rowIndex * (labelH + gapY);

        doc.setDrawColor(210, 220, 230);
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(x, y, labelW, labelH, 1.5, 1.5, "FD");

        let currentY = y + 4;

        if (showStoreHeader) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(6.5);
          doc.setTextColor(30, 41, 59);
          doc.text(storeName.toUpperCase(), x + labelW / 2, currentY, { align: "center" });
          currentY += 3.5;
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(15, 23, 42);
        const nameText = `${item.product.brand} ${item.product.name}`;
        const truncName = doc.splitTextToSize(nameText, labelW - 4);
        doc.text(truncName[0] || "", x + labelW / 2, currentY, { align: "center" });
        currentY += 4;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(6);
        doc.setTextColor(100, 116, 139);
        const condText = item.product.type === "BARU" ? "BARU (BNIB)" : `BEKAS Grade ${item.product.condition}`;
        doc.text(`${item.product.category || "HP"} • ${condText}`, x + labelW / 2, currentY, { align: "center" });
        currentY += 3.5;

        if (showProductPrice) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9.5);
          doc.setTextColor(5, 150, 105);
          doc.text(`Rp ${(item.product.priceSell || 0).toLocaleString("id-ID")}`, x + labelW / 2, currentY, { align: "center" });
          currentY += 4.5;
        }

        const barcodeDataUrl = generateCode128DataUrl(item.code, 200, 45);
        if (barcodeDataUrl) {
          doc.addImage(barcodeDataUrl, "PNG", x + 5, currentY, labelW - 10, 7.5);
          currentY += 8.5;
        }

        if (showBarcodeText) {
          doc.setFont("courier", "bold");
          doc.setFontSize(6);
          doc.setTextColor(51, 65, 85);
          doc.text(item.code, x + labelW / 2, currentY, { align: "center" });
        }

        colIndex++;
        if (colIndex >= cols) {
          colIndex = 0;
          rowIndex++;
        }
      });
    } else {
      labelItems.forEach((item, index) => {
        if (index > 0) {
          doc.addPage([58, 40], "portrait");
        }
        
        const labelW = 58;
        let currentY = 5;

        if (showStoreHeader) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(7);
          doc.setTextColor(30, 41, 59);
          doc.text(storeName.toUpperCase(), labelW / 2, currentY, { align: "center" });
          currentY += 4;
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(15, 23, 42);
        const nameText = `${item.product.brand} ${item.product.name}`;
        const truncName = doc.splitTextToSize(nameText, labelW - 4);
        doc.text(truncName[0] || "", labelW / 2, currentY, { align: "center" });
        currentY += 4.5;

        if (showProductPrice) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(5, 150, 105);
          doc.text(`Rp ${(item.product.priceSell || 0).toLocaleString("id-ID")}`, labelW / 2, currentY, { align: "center" });
          currentY += 5;
        }

        const barcodeDataUrl = generateCode128DataUrl(item.code, 200, 45);
        if (barcodeDataUrl) {
          doc.addImage(barcodeDataUrl, "PNG", 4, currentY, labelW - 8, 9);
          currentY += 10;
        }

        if (showBarcodeText) {
          doc.setFont("courier", "bold");
          doc.setFontSize(6.5);
          doc.setTextColor(51, 65, 85);
          doc.text(item.code, labelW / 2, currentY, { align: "center" });
        }
      });
    }

    doc.save(`Label-Barcode-Massal-${Date.now()}.pdf`);
  };

  const handlePrintBulkBarcodeDirect = () => {
    const labelItems = getCalculatedLabelList();
    if (labelItems.length === 0) return;

    const win = window.open("", "_blank");
    if (!win) return;

    const storeName = currentUser?.storeName || "SMARTPHONE POS & INVENTORY";

    const labelHtml = labelItems.map(lbl => `
      <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px; text-align: center; background: #fff; box-sizing: border-box; page-break-inside: avoid; display: flex; flex-direction: column; align-items: center; justify-content: space-between;">
        ${showStoreHeader ? `<div style="font-size: 8pt; font-weight: 800; color: #334155; text-transform: uppercase; border-bottom: 1px solid #f1f5f9; padding-bottom: 2px; margin-bottom: 4px; width: 100%;">${storeName}</div>` : ''}
        <div style="font-size: 9.5pt; font-weight: 800; color: #0f172a; line-height: 1.2;">
          ${lbl.product.brand} ${lbl.product.name}
        </div>
        <div style="font-size: 7.5pt; color: #64748b; margin-top: 2px;">
          ${lbl.product.category || "HP"} • ${lbl.product.type === "BARU" ? "BARU" : `Bekas ${lbl.product.condition}`}
        </div>
        ${showProductPrice ? `<div style="font-size: 11pt; font-weight: 800; color: #059669; margin: 4px 0;">Rp ${(lbl.product.priceSell || 0).toLocaleString("id-ID")}</div>` : ''}
        <img src="${generateCode128DataUrl(lbl.code, 220, 50)}" style="height: 32px; max-width: 90%; margin: 4px 0;" />
        ${showBarcodeText ? `<div style="font-family: monospace; font-size: 7pt; font-weight: bold; color: #334155;">${lbl.code}</div>` : ''}
      </div>
    `).join("");

    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cetak Massal Barcode Label</title>

          <style>
            @page {
              size: A4;
              margin: 8mm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              margin: 0;
              padding: 0;
              background: #ffffff;
            }
            .grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 4mm;
            }
          </style>
        </head>
        <body onload="setTimeout(() => { window.print(); window.close(); }, 300);">
          <div class="grid">
            ${labelHtml}
          </div>
        </body>
      </html>
    `);
    win.document.close();
  };

  const [showMutationModal, setShowMutationModal] = useState(false);
  const [mutationProduct, setMutationProduct] = useState<Product | null>(null);
  const [mutationImeis, setMutationImeis] = useState<string[]>([]);
  const [mutationTargetLocation, setMutationTargetLocation] = useState("");
  const [mutationNotes, setMutationNotes] = useState("");

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyImei, setHistoryImei] = useState("");
  const [historyData, setHistoryData] = useState<any>(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  const [showOpnameModal, setShowOpnameModal] = useState(false);
  
  const handleBulkImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const csvData = event.target?.result as string;
      if (!csvData) return;

      const lines = csvData.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      if (lines.length < 2) {
        alert("File CSV kosong atau format tidak valid.");
        return;
      }

      // header: brand,model,name,type,condition,priceBuy,priceSell,minStockAlert,imeis
      // imeis can be semicolon separated
      
      const newProducts: Product[] = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        // simple parsing
        const cols = line.split(',');
        if (cols.length >= 8) {
          const brand = cols[0].trim();
          const model = cols[1].trim();
          const name = cols[2].trim();
          const type = cols[3].trim().toUpperCase() as "BARU" | "BEKAS";
          const condition = cols[4].trim() as "A" | "B" | "C" | "D" | "-";
          const priceBuy = parseInt(cols[5].trim()) || 0;
          const priceSell = parseInt(cols[6].trim()) || 0;
          const minStockAlert = parseInt(cols[7].trim()) || 5;
          let imeis: string[] = [];
          if (cols.length > 8 && cols[8]) {
             imeis = cols[8].split(';').map(i => i.trim()).filter(i => i.length > 0);
          }
          
          if (!brand || !name || priceBuy === 0 || priceSell === 0) continue;

          newProducts.push({
            id: `PRD-${Date.now()}-${i}`,
            tenantId: currentUser?.tenantId || "tenant_demo_1",
            name,
            brand,
            model,
            type,
            condition,
            priceBuy,
            priceSell,
            stock: imeis.length,
            minStockAlert,
            imeis,
            specifications: ""
          });
        }
      }

      if (newProducts.length > 0) {
        // Validate duplicates across all new products and existing products
        const allNewImeis = newProducts.flatMap(p => p.imeis);
        const selfDuplicates = allNewImeis.filter((imei, idx) => allNewImeis.indexOf(imei) !== idx);
        
        if (selfDuplicates.length > 0) {
           alert("Terdapat duplikasi IMEI di dalam file CSV:\n" + Array.from(new Set(selfDuplicates)).slice(0,5).join(", "));
           return;
        }

        const dbDuplicates: string[] = [];
        allNewImeis.forEach(imei => {
           if (products.some(p => p.imeis.includes(imei))) {
             dbDuplicates.push(imei);
           }
        });

        if (dbDuplicates.length > 0) {
           alert("Terdapat IMEI di CSV yang sudah terdaftar di sistem:\n" + dbDuplicates.slice(0,5).join(", "));
           return;
        }

        setPendingImportProducts(newProducts);
        setShowImportValidationModal(true);
      } else {
        alert("Tidak ada data produk yang valid untuk diimpor.");
      }
      
      if (fileInputRef.current) {
         fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const [opnameItems, setOpnameItems] = useState<any[]>([]);
  const [isSubmittingOpname, setIsSubmittingOpname] = useState(false);


  const [selectedLabelProduct, setSelectedLabelProduct] = useState<Product | null>(null);
  const [selectedLabelImei, setSelectedLabelImei] = useState<string>("");

  // QR Code Customization & Export States
  const [qrPayloadType, setQrPayloadType] = useState<"IMEI" | "SUMMARY_TEXT" | "JSON_PAYLOAD" | "POS_LINK">("SUMMARY_TEXT");
  const [qrSize, setQrSize] = useState<number>(140);
  const [copiedQrPayload, setCopiedQrPayload] = useState(false);
  const [showBatchQrModal, setShowBatchQrModal] = useState(false);
  const [batchQrCategory, setBatchQrCategory] = useState("Semua");
  const [batchQrSearch, setBatchQrSearch] = useState("");

  // Printable Barcode & QR Adhesive Label Generator state
  const [showAdhesiveLabelModal, setShowAdhesiveLabelModal] = useState(false);
  const [adhesiveLayout, setAdhesiveLayout] = useState<"A4_3COL" | "A4_2COL" | "THERMAL_ROLL">("A4_3COL");
  const [adhesiveCodeType, setAdhesiveCodeType] = useState<"BARCODE" | "QR" | "DUAL">("DUAL");
  const [adhesiveCopiesMode, setAdhesiveCopiesMode] = useState<"PER_IMEI_STOCK" | "ONE_PER_PRODUCT" | "CUSTOM">("PER_IMEI_STOCK");
  const [adhesiveCustomCopies, setAdhesiveCustomCopies] = useState<number>(1);
  const [adhesiveIncludePrice, setAdhesiveIncludePrice] = useState<boolean>(true);
  const [adhesiveCategoryFilter, setAdhesiveCategoryFilter] = useState<string>("Semua");
  const [adhesiveSearchQuery, setAdhesiveSearchQuery] = useState<string>("");
  // New configuration state
  const [adhesiveLabelWidth, setAdhesiveLabelWidth] = useState<number>(48);
  const [adhesiveLabelHeight, setAdhesiveLabelHeight] = useState<number>(38);
  const [adhesiveFontSize, setAdhesiveFontSize] = useState<number>(7);
  const [adhesiveBarcodeWidth, setAdhesiveBarcodeWidth] = useState<number>(40);
  const [adhesiveBarcodeHeight, setAdhesiveBarcodeHeight] = useState<number>(10);
  const [adhesiveQrSize, setAdhesiveQrSize] = useState<number>(12);
  const [adhesiveAutoPrint, setAdhesiveAutoPrint] = useState<boolean>(false);

  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Helper to construct QR code payload value with model, color, price and brand details
  const getQrValue = (product: Product | null, imei: string) => {
    if (!product) return imei || "FONEPOS";
    const prodModel = product.model || product.name;
    const prodColor = product.color || "Standar";
    const prodPrice = `Rp ${(product.priceSell || 0).toLocaleString("id-ID")}`;

    if (qrPayloadType === "SUMMARY_TEXT") {
      return `MODEL: ${prodModel} | WARNA: ${prodColor} | HARGA: ${prodPrice} | BRAND: ${product.brand} | SKU/IMEI: ${imei || product.id}`;
    }
    if (qrPayloadType === "JSON_PAYLOAD") {
      return JSON.stringify({
        id: product.id,
        brand: product.brand,
        model: prodModel,
        color: prodColor,
        priceSell: product.priceSell,
        formattedPrice: prodPrice,
        imei: imei || product.imeis[0] || product.id
      });
    }
    if (qrPayloadType === "POS_LINK") {
      return `${window.location.origin}/#pos?sku=${product.id}&model=${encodeURIComponent(prodModel)}&color=${encodeURIComponent(prodColor)}&price=${product.priceSell}&imei=${imei || product.imeis[0] || ""}`;
    }
    return imei || product.imeis[0] || product.id;
  };

  // Helper to download QR Code as PNG image
  const handleDownloadQrPng = () => {
    if (!qrCanvasRef.current) return;
    const canvas = qrCanvasRef.current;
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    const fileName = selectedLabelProduct 
      ? `QR_${selectedLabelProduct.brand}_${selectedLabelProduct.name.replace(/\s+/g, '_')}_${selectedLabelImei || 'unit'}.png`
      : "QR_Code_Product.png";
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to copy payload to clipboard
  const handleCopyQrPayload = (val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedQrPayload(true);
    setTimeout(() => setCopiedQrPayload(false), 2000);
  };

  // Helper to export inventory products to Excel (.xlsx) format using SheetJS
  const handleExportExcel = () => {
    const listToExport = filtered.length > 0 ? filtered : products;
    if (listToExport.length === 0) {
      alert("Tidak ada data produk untuk diekspor!");
      return;
    }

    // Sheet 1: Ringkasan Katalog Stok
    const headersSummary = [
      "ID SKU",
      "Nama Produk",
      "Merek",
      "Model",
      "Tipe",
      "Kategori",
      "Kondisi",
      "Harga Beli / HPP (Rp)",
      "Harga Jual (Rp)",
      "Margin Satuan (Rp)",
      "Margin %",
      "Stok Fisik Tersedia",
      "Batas Minimal Alert",
      "Total Nilai HPP Stok (Rp)",
      "Total Potensi Omset (Rp)",
      "Status Stok",
      "Pemasok / Supplier",
      "Jumlah Unit Serial IMEI",
      "Daftar Serial IMEI"
    ];

    const rowsSummary = listToExport.map((p) => {
      const margin = (p.priceSell || 0) - (p.priceBuy || 0);
      const marginPct = p.priceSell > 0 ? `${((margin / p.priceSell) * 100).toFixed(1)}%` : "0%";
      const stockStatus = p.stock === 0 ? "Habis (0)" : p.stock <= p.minStockAlert ? "Menipis (Low)" : "Stok Aman";
      
      return [
        p.id || "",
        p.name || "",
        p.brand || "",
        p.model || "",
        p.type || "BARU",
        p.category || "Smartphone",
        p.condition || "-",
        p.priceBuy || 0,
        p.priceSell || 0,
        margin,
        marginPct,
        p.stock || 0,
        p.minStockAlert || 2,
        (p.priceBuy || 0) * (p.stock || 0),
        (p.priceSell || 0) * (p.stock || 0),
        stockStatus,
        p.supplier || (p as any).supplierName || "PT Erajaya Swasembada",
        p.imeis ? p.imeis.length : 0,
        (p.imeis || []).join(", ")
      ];
    });

    // Sheet 2: Detail Unit Serial IMEI
    const headersImei = [
      "SKU ID",
      "Nama Smartphone",
      "Merek",
      "Model",
      "Tipe",
      "Kategori",
      "Nomor Serial IMEI",
      "Harga Beli HPP (Rp)",
      "Harga Jual (Rp)",
      "Pemasok / Supplier",
      "Status Unit"
    ];

    const rowsImei: any[][] = [];
    listToExport.forEach(p => {
      if (p.imeis && Array.isArray(p.imeis)) {
        p.imeis.forEach((imei) => {
          rowsImei.push([
            p.id || "",
            p.name || "",
            p.brand || "",
            p.model || "",
            p.type || "BARU",
            p.category || "Smartphone",
            imei,
            p.priceBuy || 0,
            p.priceSell || 0,
            p.supplier || (p as any).supplierName || "PT Erajaya Swasembada",
            "Ready Stock"
          ]);
        });
      }
    });

    const wb = XLSX.utils.book_new();

    // Sheet 1 setup
    const wsSummary = XLSX.utils.aoa_to_sheet([headersSummary, ...rowsSummary]);
    wsSummary['!cols'] = [
      { wch: 12 }, { wch: 30 }, { wch: 14 }, { wch: 14 }, { wch: 10 },
      { wch: 14 }, { wch: 10 }, { wch: 18 }, { wch: 18 }, { wch: 18 },
      { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 20 }, { wch: 20 },
      { wch: 16 }, { wch: 24 }, { wch: 14 }, { wch: 45 }
    ];
    XLSX.utils.book_append_sheet(wb, wsSummary, "Ringkasan Stok");

    // Sheet 2 setup
    if (rowsImei.length > 0) {
      const wsImei = XLSX.utils.aoa_to_sheet([headersImei, ...rowsImei]);
      wsImei['!cols'] = [
        { wch: 12 }, { wch: 28 }, { wch: 14 }, { wch: 14 }, { wch: 10 },
        { wch: 14 }, { wch: 20 }, { wch: 16 }, { wch: 16 }, { wch: 24 }, { wch: 14 }
      ];
      XLSX.utils.book_append_sheet(wb, wsImei, "Detail Serial IMEI");
    }

    const filename = `Data_Stok_Inventaris_FonePOS_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  // Helper to export inventory products to CSV format using SheetJS
  const handleExportCSV = () => {
    const listToExport = filtered.length > 0 ? filtered : products;
    if (listToExport.length === 0) {
      alert("Tidak ada data produk untuk diekspor!");
      return;
    }

    const headers = [
      "ID SKU",
      "Nama Produk",
      "Merek",
      "Model",
      "Kategori",
      "Tipe",
      "Harga Beli (Rp)",
      "Harga Jual (Rp)",
      "Stok Total",
      "Batas Minimal Stok",
      "Pemasok/Supplier",
      "Jumlah IMEI",
      "Daftar IMEI"
    ];

    const rows = listToExport.map((p) => [
      p.id || "",
      p.name || "",
      p.brand || "",
      p.model || "",
      p.category || "Smartphone",
      p.type || "BARU",
      p.priceBuy || 0,
      p.priceSell || 0,
      p.stock || 0,
      p.minStockAlert || 2,
      p.supplier || (p as any).supplierName || "PT Erajaya Swasembada",
      p.imeis ? p.imeis.length : 0,
      (p.imeis || []).join("; ")
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const csvContent = "\uFEFF" + XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Data_Inventaris_Stok_FonePOS_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Helper to export currently filtered inventory products to PDF format
  const handleExportPDF = () => {
    const listToExport = filtered.length > 0 ? filtered : products;
    if (listToExport.length === 0) {
      alert("Tidak ada data produk untuk diekspor!");
      return;
    }

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4"
    });

    const shopTitle = localStorage.getItem("print_shop_title") || "FONEPOS & SMARTPHONE STORE";
    const shopAddress = localStorage.getItem("print_shop_address") || "Roxy Mas Square Blok C2, Jakarta Pusat";

    // Calculate valuation totals
    const totalValuation = listToExport.reduce((sum, p) => sum + ((p.priceSell || 0) * (p.stock || 0)), 0);
    const totalCostValue = listToExport.reduce((sum, p) => sum + ((p.priceBuy || 0) * (p.stock || 0)), 0);

    // Header Banner
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, 297, 30, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(`${shopTitle} - LAPORAN EKSPOR STOK INVENTARIS`, 14, 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225);
    doc.text(`${shopAddress} | Dicetak Pada: ${new Date().toLocaleDateString("id-ID")} ${new Date().toLocaleTimeString("id-ID")}`, 14, 18);
    
    // Valuation Info
    doc.text(`Kategori: ${selectedCategoryFilter} | Total Aset Jual: Rp ${totalValuation.toLocaleString("id-ID")} | Total Aset Modal: Rp ${totalCostValue.toLocaleString("id-ID")}`, 14, 24);

    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`Filter Terpasang: Kategori (${selectedCategoryFilter}), Merek (${selectedBrandFilter}), Status (${selectedStockStatusFilter}), Pencarian ("${searchQuery || "Semua"}") — Total ${listToExport.length} Produk`, 14, 35);

    const tableBody = listToExport.map((p, idx) => [
      idx + 1,
      p.id || "-",
      p.name || "-",
      p.brand || "-",
      p.model || "-",
      p.category || "Smartphone",
      p.type || "BARU",
      `Rp ${(p.priceBuy || 0).toLocaleString("id-ID")}`,
      `Rp ${(p.priceSell || 0).toLocaleString("id-ID")}`,
      p.stock || 0,
      p.minStockAlert || 2,
      p.stock === 0 ? "HABIS" : p.stock <= p.minStockAlert ? "MENIPIS" : "AMAN",
      p.supplier || (p as any).supplierName || "Distributor Resmi"
    ]);

    autoTable(doc, {
      startY: 36,
      head: [["No", "SKU ID", "Nama Produk", "Brand", "Model", "Kategori", "Tipe", "HPP (Rp)", "Harga Jual (Rp)", "Stok", "Min", "Status", "Pemasok/Supplier"]],
      body: tableBody,
      theme: "grid",
      headStyles: { fillColor: [30, 41, 59], textColor: 255, fontSize: 8, fontStyle: "bold" },
      bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59], cellPadding: 2 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14 }
    });

    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`Halaman ${i} dari ${totalPages} - Laporan Inventaris Resmi FonePOS`, 148, 202, { align: "center" });
    }

    doc.save(`Export_Inventaris_Stok_FonePOS_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  // Form Fields
  const [sku, setSku] = useState("");
  const [skuSuccessMsg, setSkuSuccessMsg] = useState<string | null>(null);
  const [skuError, setSkuError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [color, setColor] = useState("");
  const [type, setType] = useState<"BARU" | "BEKAS">("BARU");
  const [category, setCategory] = useState("Smartphone");
  const [condition, setCondition] = useState<"A" | "B" | "C" | "D" | "-">("-");
  const [priceBuy, setPriceBuy] = useState("");
  const [priceSell, setPriceSell] = useState("");
  const [minStockAlert, setMinStockAlert] = useState("2");
  const [specifications, setSpecifications] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  // Helper: Auto-Generate SKU with duplicate check based on Device Category, Brand, and Model
  const generateAutoSku = () => {
    const existingSkusList = products
      .map(p => (p.id !== editingProductId ? (p.sku || p.id) : null))
      .filter(Boolean);

    const gen = generateProductSku({
      category: category || (type === "BEKAS" ? "Smartphone Bekas" : "Smartphone Baru"),
      brand: brand || name.split(" ")[0] || "Apple",
      model: model || name.split(" ").slice(1).join(" ") || "Device",
      color,
      type,
      condition: type === "BEKAS" ? condition : "-",
      storage: specifications || name,
      existingSkus: existingSkusList
    });

    if (gen && gen.fullSku) {
      setSku(gen.fullSku);
      setSkuError(null);
      setSkuSuccessMsg(`SKU Unik Dihasilkan: ${gen.fullSku} (${gen.categoryCode}-${gen.brandCode}-${gen.modelCode})`);
      setTimeout(() => setSkuSuccessMsg(null), 4000);
    }
  };

  // Helper: Batch Update Product SKUs
  const handleBatchUpdateProductSkus = async (updates: { productId: string; newSku: string }[]) => {
    const userHeaders: Record<string, string> = currentUser ? {
      "X-User-Id": currentUser.id,
      "X-User-Name": encodeURIComponent(currentUser.name),
      "X-User-Role": currentUser.role
    } : {};

    for (const update of updates) {
      const prod = products.find(p => p.id === update.productId);
      if (prod) {
        try {
          await apiFetch(`/api/products/${prod.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", ...userHeaders },
            body: JSON.stringify({ ...prod, sku: update.newSku })
          });
        } catch (err) {
          console.warn("Gagal update SKU individual:", err);
        }
      }
    }
    onProductsChange();
  };

  // Helper: Inline Edit Save Handler
  const handleSaveInlineEdit = async (product: Product) => {
    if (!inlineEdit || inlineEdit.id !== product.id) return;
    const numVal = Number(inlineEdit.value);
    if (isNaN(numVal) || numVal < 0) {
      alert("Nilai tidak valid! Harus berupa angka 0 atau lebih.");
      return;
    }

    const updatedProduct = {
      ...product,
      [inlineEdit.field]: numVal,
      ...(inlineEdit.field === "stock" ? { stock: numVal } : {})
    };

    setIsSavingInline(true);
    const userHeaders: Record<string, string> = currentUser ? {
      "X-User-Id": currentUser.id,
      "X-User-Name": encodeURIComponent(currentUser.name),
      "X-User-Role": currentUser.role
    } : {};

    try {
      const response = await apiFetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          ...userHeaders
        },
        body: JSON.stringify(updatedProduct)
      });

      if (response.ok) {
        setProducts(prev => prev.map(p => p.id === product.id ? updatedProduct : p));
        setInlineSavedId(`${product.id}-${inlineEdit.field}`);
        setTimeout(() => setInlineSavedId(null), 2500);
        onProductsChange();
      } else {
        const errData = await response.json().catch(() => ({}));
        alert(errData.message || "Gagal memperbarui data produk secara inline.");
      }
    } catch (err) {
      console.error("Gagal update inline produk:", err);
      alert("Terjadi kesalahan jaringan saat menyimpan perubahan.");
    } finally {
      setIsSavingInline(false);
      setInlineEdit(null);
    }
  };

  // Product Photo Gallery & Camera Capture States
  const [imagesList, setImagesList] = useState<string[]>([]);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(0);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState<boolean>(false);
  const [newlyAddedImageIndex, setNewlyAddedImageIndex] = useState<number | null>(null);

  // Photo Deletion Confirmation Dialog States
  const [photoToDeleteIndex, setPhotoToDeleteIndex] = useState<number | null>(null);
  const [showPhotoDeleteConfirmModal, setShowPhotoDeleteConfirmModal] = useState<boolean>(false);

  // Product Detail View Modal States
  const [showProductDetailModal, setShowProductDetailModal] = useState<boolean>(false);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [fullScreenPhotoUrl, setFullScreenPhotoUrl] = useState<string | null>(null);

  // Product Photo Camera Capture States
  const [isPhotoCameraOpen, setIsPhotoCameraOpen] = useState(false);
  const [photoCameraFacingMode, setPhotoCameraFacingMode] = useState<"environment" | "user">("environment");
  const [photoCameraStream, setPhotoCameraStream] = useState<MediaStream | null>(null);
  const [photoCameraError, setPhotoCameraError] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);

  const photoFileInputRef = useRef<HTMLInputElement | null>(null);
  const photoVideoRef = useRef<HTMLVideoElement | null>(null);

  const addPhotoToGallery = (photoDataUrl: string) => {
    setIsProcessingPhoto(true);

    setTimeout(() => {
      setImagesList((prev) => {
        const updated = [...prev, photoDataUrl];
        const newIdx = updated.length - 1;
        setNewlyAddedImageIndex(newIdx);
        setSelectedPhotoIndex(newIdx);
        if (updated.length === 1 || !imageUrl) {
          setImageUrl(photoDataUrl);
        }

        if (viewingProduct) {
          const updatedProd = {
            ...viewingProduct,
            images: updated,
            imageUrl: updated[0] || photoDataUrl
          };
          setViewingProduct(updatedProd);

          setProducts((prodList) =>
            prodList.map((p) => (p.id === viewingProduct.id ? updatedProd : p))
          );

          apiFetch(`/api/products/${viewingProduct.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedProd)
          }).catch((err) => console.warn("Failed to persist new photo to server:", err));
        }

        return updated;
      });

      setIsProcessingPhoto(false);
      setTimeout(() => setNewlyAddedImageIndex(null), 1000);
    }, 450);
  };

  const requestDeletePhoto = (index: number) => {
    setPhotoToDeleteIndex(index);
    setShowPhotoDeleteConfirmModal(true);
  };

  const confirmDeletePhoto = () => {
    if (photoToDeleteIndex === null) return;
    const targetIdx = photoToDeleteIndex;

    setImagesList((prev) => {
      const updated = prev.filter((_, idx) => idx !== targetIdx);
      setSelectedPhotoIndex((curr) => Math.max(0, Math.min(curr, updated.length - 1)));
      const nextMainUrl = updated[0] || "";
      setImageUrl(nextMainUrl);

      if (viewingProduct) {
        const updatedProd = {
          ...viewingProduct,
          images: updated,
          imageUrl: nextMainUrl
        };
        setViewingProduct(updatedProd);

        setProducts((prodList) =>
          prodList.map((p) => (p.id === viewingProduct.id ? updatedProd : p))
        );

        apiFetch(`/api/products/${viewingProduct.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedProd)
        }).catch((err) => console.warn("Failed to persist deleted photo to server:", err));
      }

      return updated;
    });

    setShowPhotoDeleteConfirmModal(false);
    setPhotoToDeleteIndex(null);
  };

  const handleOpenProductDetailModal = (p: Product) => {
    setViewingProduct(p);
    const prodImages = p.images && p.images.length > 0 ? p.images : (p.imageUrl ? [p.imageUrl] : []);
    setImagesList(prodImages);
    setSelectedPhotoIndex(0);
    setShowProductDetailModal(true);
  };

  const startPhotoCamera = async (facing: "environment" | "user" = photoCameraFacingMode) => {
    setPhotoCameraError(null);
    setIsPhotoCameraOpen(true);
    if (photoCameraStream) {
      photoCameraStream.getTracks().forEach((t) => t.stop());
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      setPhotoCameraStream(stream);
      if (photoVideoRef.current) {
        photoVideoRef.current.srcObject = stream;
        photoVideoRef.current.play().catch((e) => console.warn("Video play error:", e));
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setPhotoCameraError("Gagal mengakses kamera. Mohon pastikan izin kamera aktif atau gunakan tombol Unggah File.");
    }
  };

  const stopPhotoCamera = () => {
    if (photoCameraStream) {
      photoCameraStream.getTracks().forEach((t) => t.stop());
      setPhotoCameraStream(null);
    }
    setIsPhotoCameraOpen(false);
    setPhotoCameraError(null);
  };

  const switchPhotoCameraFacingMode = () => {
    const nextFacing = photoCameraFacingMode === "environment" ? "user" : "environment";
    setPhotoCameraFacingMode(nextFacing);
    startPhotoCamera(nextFacing);
  };

  const capturePhotoFromCamera = () => {
    if (!photoVideoRef.current) return;
    const video = photoVideoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 800;
    canvas.height = video.videoHeight || 600;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      if (photoCameraFacingMode === "user") {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      playScanBeep();
      stopPhotoCamera();
      addPhotoToGallery(dataUrl);
    } else {
      stopPhotoCamera();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        alert("Ukuran berkas terlalu besar. Maksimal 8MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          addPhotoToGallery(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    return () => {
      if (photoCameraStream) {
        photoCameraStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [photoCameraStream]);

  // Batch Operations State
  const [showBatchPriceModal, setShowBatchPriceModal] = useState(false);
  const [priceUpdateTarget, setPriceUpdateTarget] = useState<"SELL" | "BUY" | "BOTH">("SELL");
  const [priceUpdateMode, setPriceUpdateMode] = useState<"FIXED" | "ADJUST_NOMINAL" | "ADJUST_PERCENT">("ADJUST_PERCENT");
  const [priceUpdateValue, setPriceUpdateValue] = useState<string>("-5");
  const [priceUpdateReason, setPriceUpdateReason] = useState<string>("Penyesuaian Harga Massal");
  const [isBatchUpdatingPrice, setIsBatchUpdatingPrice] = useState(false);

  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState(false);
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);
  
  // Bulk IMEI Input Area
  const [bulkImeiInput, setBulkImeiInput] = useState("");
  
  // Camera Scanner States
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerTargetMode, setScannerTargetMode] = useState<"SEARCH" | "BULK_IMEI">("SEARCH");
  const [cameras, setCameras] = useState<any[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [scannerFeedback, setScannerFeedback] = useState<string>("");
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const playScanBeep = () => {
    try {
      const audioCtx = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.value = 1300;
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
    } catch (e) {
      console.warn("Audio Context beep failed:", e);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await apiFetch("/api/suppliers");
      const data = await res.json();
      setSuppliers(data);
      if (data.length > 0) {
        setSupplierName(data[0].name);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Camera Listing Effect
  useEffect(() => {
    if (isScannerOpen) {
      Html5Qrcode.getCameras().then(devices => {
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Try to select rear camera automatically with autofocus if possible
          const backCam = devices.find(d => d.label.toLowerCase().includes("back") || d.label.toLowerCase().includes("rear") || d.label.toLowerCase().includes("environment"));
          setSelectedCameraId(backCam ? backCam.id : devices[0].id);
        } else {
          setCameras([]);
          setSelectedCameraId("");
        }
      }).catch(err => {
        console.warn("Error getting cameras:", err);
        setCameras([]);
        setSelectedCameraId("");
      });
    } else {
      setCameras([]);
      setSelectedCameraId("");
    }
  }, [isScannerOpen]);

  // Scanner Instance Effect
  useEffect(() => {
    let isMounted = true;

    if (isScannerOpen) {
      const timer = setTimeout(() => {
        if (!isMounted) return;
        const container = document.getElementById("qr-reader-inventory");
        if (!container) return;

        try {
          if (!scannerRef.current) {
            scannerRef.current = new Html5Qrcode("qr-reader-inventory");
          }
          
          const cameraConfig = selectedCameraId ? selectedCameraId : { facingMode: "environment" };

          scannerRef.current.start(
            cameraConfig,
            {
              fps: 15,
              qrbox: (width, height) => {
                const minEdgePercentage = 0.7; // 70% of min edge
                const minEdgeSize = Math.min(width, height);
                const qrboxSize = Math.floor(minEdgeSize * minEdgePercentage);
                return {
                  width: qrboxSize,
                  height: Math.floor(qrboxSize * 0.6) // Wide aspect ratio for barcodes
                };
              }
            },
            (decodedText) => {
              handleCameraScanSuccess(decodedText);
            },
            () => {
              // quiet error
            }
          ).catch((err) => {
            console.warn("Kamera tidak dapat diakses atau diblokir:", err);
          });
        } catch (err) {
          console.error("Gagal inisialisasi Html5Qrcode:", err);
        }
      }, 350);

      return () => {
        isMounted = false;
        clearTimeout(timer);
        if (scannerRef.current) {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop().then(() => {
              try { scannerRef.current?.clear(); } catch (e) {}
            }).catch(console.error);
          }
        }
      };
    }
  }, [isScannerOpen, selectedCameraId]);

  const handleCameraScanSuccess = (decodedText: string) => {
    const cleanText = decodedText.trim();
    if (!cleanText) return;
    
    playScanBeep();

    if (scannerTargetMode === "SEARCH") {
      setSearchQuery(cleanText);
      const matched = products.find(
        (p) => p.id === cleanText || p.imeis.includes(cleanText) || p.name.toLowerCase().includes(cleanText.toLowerCase())
      );
      if (matched) {
        setScannerFeedback(`✅ Ditemukan: ${matched.name} (Stok: ${matched.stock} unit)`);
      } else {
        setScannerFeedback(`🔍 Barcode/IMEI "${cleanText}" diterapkan ke filter pencarian.`);
      }
    } else {
      // BULK_IMEI mode inside Add/Edit modal
      setBulkImeiInput((prev) => {
        const existingImeis = prev.split(/[\n,]+/).map((i) => i.trim()).filter((i) => i.length > 0);
        if (existingImeis.includes(cleanText)) {
          setScannerFeedback(`⚠️ IMEI "${cleanText}" sudah ada di daftar input.`);
          return prev;
        }
        
        setScannerFeedback(`✅ Berhasil Scan IMEI: ${cleanText}`);
        return prev.trim() ? `${prev.trim()}\n${cleanText}` : cleanText;
      });
    }

    setTimeout(() => setScannerFeedback(""), 3500);
  };

  useEffect(() => {
    setProducts(initialProducts);
    fetchSuppliers();
  }, [initialProducts]);

  const [isFillingSpecs, setIsFillingSpecs] = useState(false);

  const handleAiAutoFillSpecs = async () => {
    if (!name.trim()) {
      alert("Harap masukkan nama lengkap produk terlebih dahulu agar AI dapat menganalisis.");
      return;
    }
    setIsFillingSpecs(true);
    
    let customConfig = null;
    try {
      const saved = localStorage.getItem("fonepos_ai_config");
      if (saved) {
        customConfig = JSON.parse(saved);
      }
    } catch (e) {
      console.error(e);
    }

    try {
      const res = await apiFetch("/api/ai/suggest-specs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName: name, customConfig }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        if (data.data.brand) setBrand(data.data.brand);
        if (data.data.model) setModel(data.data.model);
        if (data.data.specifications) setSpecifications(data.data.specifications);
      } else {
        alert("Gagal memanggil asisten spesifikasi AI.");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan koneksi ke asisten spesifikasi AI.");
    } finally {
      setIsFillingSpecs(false);
    }
  };

  const handleOpenAddModal = () => {
    setIsEditMode(false);
    setSku("");
    setSkuSuccessMsg(null);
    setSkuError(null);
    setName("");
    setBrand("");
    setModel("");
    setColor("");
    setType("BARU");
    setCondition("-");
    setPriceBuy("");
    setPriceSell("");
    setMinStockAlert("2");
    setSpecifications("");
    setImageUrl("");
    setImagesList([]);
    setSelectedPhotoIndex(0);
    setNewlyAddedImageIndex(null);
    setBulkImeiInput("");
    setShowAddModal(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setIsEditMode(true);
    setEditingProductId(p.id);
    setSku(p.sku || p.id || "");
    setSkuSuccessMsg(null);
    setSkuError(null);
    setName(p.name);
    setBrand(p.brand);
    setModel(p.model);
    setColor(p.color || "");
    setType(p.type);
    setCondition(p.condition || "-");
    setPriceBuy((p?.priceBuy ?? 0).toString());
    setPriceSell((p?.priceSell ?? 0).toString());
    setMinStockAlert((p?.minStockAlert ?? 2).toString());
    setSpecifications(p?.specifications || "");
    setImageUrl(p?.imageUrl || "");
    const prodImages = p.images && p.images.length > 0 ? p.images : (p.imageUrl ? [p.imageUrl] : []);
    setImagesList(prodImages);
    setSelectedPhotoIndex(0);
    setNewlyAddedImageIndex(null);
    setBulkImeiInput((p?.imeis || []).join("\n"));
    setShowAddModal(true);
  };

  // Batch Operations Handlers
  const handleBatchUpdatePrices = async () => {
    const selectedProds = products.filter(p => selectedProductIds.includes(p.id));
    if (selectedProds.length === 0) return;

    const numVal = Number(priceUpdateValue) || 0;
    if (priceUpdateMode === "FIXED" && numVal <= 0) {
      alert("Harga nominal baru harus lebih besar dari Rp 0.");
      return;
    }

    setIsBatchUpdatingPrice(true);
    const userHeaders: Record<string, string> = currentUser ? {
      "X-User-Id": currentUser.id,
      "X-User-Name": encodeURIComponent(currentUser.name),
      "X-User-Role": currentUser.role
    } : {};

    let successCount = 0;
    let failCount = 0;

    for (const prod of selectedProds) {
      let newSell = prod.priceSell;
      let newBuy = prod.priceBuy;

      if (priceUpdateTarget === "SELL" || priceUpdateTarget === "BOTH") {
        if (priceUpdateMode === "FIXED") {
          newSell = numVal;
        } else if (priceUpdateMode === "ADJUST_NOMINAL") {
          newSell = Math.max(1000, prod.priceSell + numVal);
        } else if (priceUpdateMode === "ADJUST_PERCENT") {
          newSell = Math.max(1000, Math.round(prod.priceSell * (1 + numVal / 100)));
        }
      }

      if (priceUpdateTarget === "BUY" || priceUpdateTarget === "BOTH") {
        if (priceUpdateMode === "FIXED") {
          newBuy = numVal;
        } else if (priceUpdateMode === "ADJUST_NOMINAL") {
          newBuy = Math.max(1000, prod.priceBuy + numVal);
        } else if (priceUpdateMode === "ADJUST_PERCENT") {
          newBuy = Math.max(1000, Math.round(prod.priceBuy * (1 + numVal / 100)));
        }
      }

      const priceHistoryEntry = {
        date: new Date().toISOString(),
        priceSell: newSell,
        priceBuy: newBuy,
        changeReason: priceUpdateReason || "Penyesuaian Harga Massal (Batch Update)"
      };

      const updatedHistory = [...(prod.priceHistory || []), priceHistoryEntry];

      try {
        const res = await apiFetch(`/api/products/${prod.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...userHeaders },
          body: JSON.stringify({
            priceSell: newSell,
            priceBuy: newBuy,
            priceHistory: updatedHistory
          })
        });
        if (res.ok) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (err) {
        console.error(err);
        failCount++;
      }
    }

    setIsBatchUpdatingPrice(false);
    setShowBatchPriceModal(false);
    setSelectedProductIds([]);
    onProductsChange();

    alert(`🎉 Pembaruan harga massal berhasil dilaksanakan!\n\n• Berhasil diperbarui: ${successCount} produk\n` + (failCount > 0 ? `• Gagal: ${failCount} produk` : ""));
  };

  const handleConfirmBatchDelete = async () => {
    const selectedProds = products.filter(p => selectedProductIds.includes(p.id));
    if (selectedProds.length === 0) return;

    setIsBatchDeleting(true);
    const userHeaders: Record<string, string> = currentUser ? {
      "X-User-Id": currentUser.id,
      "X-User-Name": encodeURIComponent(currentUser.name),
      "X-User-Role": currentUser.role
    } : {};

    let successCount = 0;
    let failCount = 0;

    for (const prod of selectedProds) {
      try {
        const res = await apiFetch(`/api/products/${prod.id}`, {
          method: "DELETE",
          headers: userHeaders
        });
        if (res.ok) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (err) {
        console.error(err);
        failCount++;
      }
    }

    setIsBatchDeleting(false);
    setShowBatchDeleteModal(false);
    setSelectedProductIds([]);
    onProductsChange();

    alert(`🗑️ Penghapusan massal selesai!\n\n• Berhasil dihapus: ${successCount} produk dari inventaris.\n` + (failCount > 0 ? `• Gagal: ${failCount} produk` : ""));
  };

  const handleBatchAdjustment = async () => {
    const selectedProds = products.filter(p => selectedProductIds.includes(p.id));
    if (selectedProds.length === 0 || adjustmentAmount === 0) return;

    const userHeaders: Record<string, string> = currentUser ? {
      "X-User-Id": currentUser.id,
      "X-User-Name": encodeURIComponent(currentUser.name),
      "X-User-Role": currentUser.role
    } : {};

    let successCount = 0;
    let failCount = 0;

    for (const prod of selectedProds) {
      const newStock = adjustmentType === "ADD" ? prod.stock + adjustmentAmount : Math.max(0, prod.stock - adjustmentAmount);
      
      try {
        const res = await apiFetch(`/api/products/${prod.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...userHeaders },
          body: JSON.stringify({
            stock: newStock
          })
        });
        if (res.ok) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (err) {
        console.error(err);
        failCount++;
      }
    }

    setShowBatchAdjustmentModal(false);
    setAdjustmentAmount(0);
    setAdjustmentReason("");
    setSelectedProductIds([]);
    onProductsChange();

    alert(`📦 Penyesuaian stok massal selesai!\n\n• Berhasil diperbarui: ${successCount} produk.\n` + (failCount > 0 ? `• Gagal: ${failCount} produk` : ""));
  };

  
  const handleAnalyzeData = async () => {
    try {
      const res = await apiFetch("/api/inventory/estimate-size");
      const data = await res.json();
      alert(`Estimasi ukuran file JSON untuk 3 tahun data: ${data.estimatedMB} MB`);
    } catch (err) {
      console.error(err);
      alert("Gagal melakukan analisis data.");
    }
  };

  const handleArchiveTransactions = async () => {
    const cutoffDate = prompt("Masukkan tanggal batas arsip (YYYY-MM-DD):", new Date().toISOString().split("T")[0]);
    if (!cutoffDate) return;
    
    try {
      const res = await apiFetch("/api/transactions/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cutoffDate })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Berhasil mengarsipkan ${data.archivedCount} transaksi.`);
        onProductsChange();
      }
    } catch (err) {
      console.error(err);
      alert("Gagal mengarsipkan data.");
    }
  };

  const handleExportInventoryPDF = () => {
    handleExportPDF(); 
  };

  const handleOpenMutationModal = (p: Product) => {

    setMutationProduct(p);
    setMutationImeis([]);
    setMutationTargetLocation("Cabang Sudirman"); // Default target
    setMutationNotes("");
    setShowMutationModal(true);
  };

  
  const handleOpenOpnameModal = () => {
    // Initialize opname items based on current products
    const initialItems = products.map(p => ({
      productId: p.id,
      productName: p.name,
      systemStock: p.stock,
      physicalStock: p.stock,
      shrinkage: 0,
      missingImeis: []
    }));
    setOpnameItems(initialItems);
    setShowOpnameModal(true);
  };

  const handleOpnameChange = (productId: string, field: string, value: any) => {
    setOpnameItems(prev => prev.map(item => {
      if (item.productId === productId) {
        const updated = { ...item, [field]: value };
        if (field === 'physicalStock') {
          updated.shrinkage = updated.systemStock - value;
        }
        return updated;
      }
      return item;
    }));
  };

  const handleSubmitOpname = async () => {
    if (!confirm("Apakah Anda yakin ingin menyimpan hasil opname ini? Stok akan disesuaikan otomatis.")) return;
    
    setIsSubmittingOpname(true);
    try {
      const payload = {
        employeeId: currentUser?.id || "EMP001",
        employeeName: currentUser?.name || "Admin",
        items: opnameItems.filter(i => i.shrinkage !== 0) // Only send items with discrepancy
      };

      const res = await apiFetch("/api/opnames", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        alert("Opname berhasil disimpan dan stok disesuaikan.");
        setShowOpnameModal(false);
        onProductsChange();
      } else {
        alert("Gagal menyimpan opname: " + data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan sistem.");
    } finally {
      setIsSubmittingOpname(false);
    }
  };

  const handleSubmitMutation = async () => {
    if (!mutationProduct || mutationImeis.length === 0 || !mutationTargetLocation) {
      alert("Harap lengkapi IMEI yang dipindah dan lokasi tujuan.");
      return;
    }

    try {
      const payload = {
        productId: mutationProduct.id,
        imeis: mutationImeis,
        sourceLocation: mutationProduct.location || "Toko Utama",
        targetLocation: mutationTargetLocation,
        notes: mutationNotes,
        employeeId: currentUser?.id || "EMP001",
        employeeName: currentUser?.name || "Admin"
      };

      const response = await apiFetch("/api/mutations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data.success) {
        alert("Berhasil memindahkan " + mutationImeis.length + " IMEI ke " + mutationTargetLocation + ".");
        setShowMutationModal(false);
        onProductsChange();
      } else {
        alert("Gagal mutasi: " + data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan jaringan.");
    }
  };

  const handleOpenHistoryModal = () => {
    setHistoryImei("");
    setHistoryData(null);
    setShowHistoryModal(true);
  };

  const handleTrackImei = async (imei: string) => {
    if (!imei.trim()) return;
    setHistoryImei(imei);
    setIsHistoryLoading(true);
    try {
      const response = await apiFetch("/api/imei/history/" + imei.trim());
      const data = await response.json();
      if (data.success) {
        setHistoryData(data);
        setShowHistoryModal(true);
      } else {
        alert("Gagal melacak IMEI.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Parse bulk IMEIs from textarea
    const imeis = bulkImeiInput
      .split(/[\n,]+/)
      .map(i => i.trim())
      .filter(i => i.length > 0);

    if (imeis.length === 0) {
      alert("Harap masukkan setidaknya satu nomor IMEI untuk persediaan smartphone.");
      return;
    }

    const invalidImeis = imeis.filter(i => !isValidIMEI(i));
    if (invalidImeis.length > 0) {
      alert(`⚠️ Gagal Menyimpan!\nTerdapat ${invalidImeis.length} IMEI tidak valid (salah format / gagal checksum Luhn):\n\n${invalidImeis.slice(0, 5).join("\n")}${invalidImeis.length > 5 ? "\n... dan lainnya" : ""}\n\nHarap perbaiki format IMEI (harus 15 digit angka) atau verifikasi kesalahan ketik.`);
      return;
    }

    // Check for duplicates inside the input itself (self duplicates)
    const selfDuplicates = imeis.filter((imei, idx) => imeis.indexOf(imei) !== idx);
    if (selfDuplicates.length > 0) {
      alert(`⚠️ Gagal Menyimpan!\nTerdapat duplikasi nomor IMEI dalam daftar input Anda (dimasukkan lebih dari sekali):\n\n${Array.from(new Set(selfDuplicates)).slice(0, 5).join("\n")}${selfDuplicates.length > 5 ? "\n... dan lainnya" : ""}\n\nHarap hapus nomor IMEI yang ganda.`);
      return;
    }

    // Check for duplicates against existing products in database
    const dbDuplicates: { imei: string; productName: string }[] = [];
    imeis.forEach(imei => {
      const dup = products.find(p => (!isEditMode || p.id !== editingProductId) && p.imeis.includes(imei));
      if (dup && !dbDuplicates.some(d => d.imei === imei)) {
        dbDuplicates.push({ imei, productName: dup.name });
      }
    });

    if (dbDuplicates.length > 0) {
      alert(`⚠️ Gagal Menyimpan! Deteksi Duplikasi Database!\nTerdapat ${dbDuplicates.length} nomor IMEI yang sudah terdaftar pada produk lain di sistem:\n\n${dbDuplicates.slice(0, 3).map(d => `- ${d.imei} (di produk: ${d.productName})`).join("\n")}${dbDuplicates.length > 3 ? "\n... dan lainnya" : ""}\n\nSatu nomor IMEI bersifat unik dan tidak boleh digunakan ganda.`);
      return;
    }

    // Validation: Prices must be greater than zero
    if (Number(priceSell) <= 0 || Number(priceBuy) <= 0) {
      alert("⚠️ Validasi Harga Gagal!\nHarga Jual dan Harga Modal/Beli produk harus lebih besar dari Rp 0.");
      return;
    }

    if (Number(priceSell) < Number(priceBuy)) {
      const confirmLoss = confirm(
        `⚠️ Peringatan Margin Rugi!\nHarga Jual (Rp ${Number(priceSell).toLocaleString("id-ID")}) lebih kecil dari Harga Beli Modal (Rp ${Number(priceBuy).toLocaleString("id-ID")}).\n\nPenjualan produk ini akan berdampak margin minus/rugi. Apakah Anda yakin ingin melanjutkan dan menyimpan perubahan?`
      );
      if (!confirmLoss) return;
    }

    // Validation: Transaction History Consistency Check in Edit Mode
    if (isEditMode) {
      const currentProduct = products.find(p => p.id === editingProductId);
      if (currentProduct) {
        const oldImeis = currentProduct.imeis || [];
        const removedImeis = oldImeis.filter(i => !imeis.includes(i));
        
        if (removedImeis.length > 0) {
          try {
            const txRes = await apiFetch("/api/transactions");
            if (txRes.ok) {
              const transactions = await txRes.json();
              const soldMap = new Map<string, string>();
              (transactions || []).forEach((tx: any) => {
                if (tx.items && Array.isArray(tx.items)) {
                  tx.items.forEach((item: any) => {
                    if (item.productId === editingProductId || item.id === editingProductId || item.name === currentProduct.name) {
                      const itemImeis = item.imeis || (item.imei ? [item.imei] : []);
                      itemImeis.forEach((im: string) => {
                        if (im) soldMap.set(im, tx.id || tx.receiptNumber || "TRX-HIST");
                      });
                    }
                  });
                }
              });

              const soldAndRemoved = removedImeis.filter(im => soldMap.has(im));
              if (soldAndRemoved.length > 0) {
                const problemImei = soldAndRemoved[0];
                const txRef = soldMap.get(problemImei);
                alert(`⚠️ Validasi Riwayat Transaksi Gagal!\n\nNomor IMEI (${problemImei}) sudah pernah TERJUAL dalam transaksi (${txRef}).\n\nAnda tidak dapat menghapus nomor IMEI yang sudah memiliki riwayat penjualan aktif untuk mencegah inkonsistensi laporan keuangan dan garansi produk.`);
                return;
              }
            }
          } catch (txErr) {
            console.warn("Validasi riwayat transaksi error:", txErr);
          }
        }
      }
    }

    const payload = {
      sku: sku.trim() || undefined,
      name,
      brand,
      model,
      color,
      type,
      category,
      condition: type === "BEKAS" ? condition : "-",
      priceBuy: Number(priceBuy),
      priceSell: Number(priceSell),
      minStockAlert: Number(minStockAlert),
      specifications,
      imageUrl: imagesList[0] || imageUrl || "",
      images: imagesList,
      imeis,
      supplierName: supplierName || "PT Erajaya Swasembada"
    };

    const userHeaders: Record<string, string> = currentUser ? {
      "X-User-Id": currentUser.id,
      "X-User-Name": encodeURIComponent(currentUser.name),
      "X-User-Role": currentUser.role
    } : {};

    try {
      let response;
      if (isEditMode) {
        response = await apiFetch(`/api/products/${editingProductId}`, {
          method: "PUT",
          headers: { 
            "Content-Type": "application/json",
            ...userHeaders
          },
          body: JSON.stringify(payload)
        });
      } else {
        response = await apiFetch("/api/products", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            ...userHeaders
          },
          body: JSON.stringify(payload)
        });
      }

      if (response.ok) {
        const resultData = await response.json();
        setShowAddModal(false);
        onProductsChange();

        // Auto open label printing modal for newly input inventory items
        if (!isEditMode) {
          const newProduct = resultData.product || resultData;
          if (newProduct && (newProduct.id || newProduct.name)) {
            setSelectedLabelProduct(newProduct);
            setSelectedLabelImei(newProduct.imeis?.[0] || "");
            setShowLabelModal(true);
          }
        }
      } else {
        const errData = await response.json().catch(() => ({}));
        alert(errData.message || "Gagal menyimpan produk.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProduct = (idOrProduct: string | Product) => {
    if (typeof idOrProduct === "string") {
      const found = products.find(p => p.id === idOrProduct);
      if (found) setProductToDelete(found);
    } else {
      setProductToDelete(idOrProduct);
    }
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    const userHeaders: Record<string, string> = currentUser ? {
      "X-User-Id": currentUser.id,
      "X-User-Name": encodeURIComponent(currentUser.name),
      "X-User-Role": currentUser.role
    } : {};
    try {
      const response = await apiFetch(`/api/products/${productToDelete.id}`, { 
        method: "DELETE",
        headers: userHeaders
      });
      if (response.ok) {
        setProductToDelete(null);
        onProductsChange();
      } else {
        const errData = await response.json().catch(() => ({}));
        alert(errData.message || "Gagal menghapus produk dari inventaris.");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan koneksi saat menghapus produk.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenPrintLabelModal = (product: Product) => {
    setSelectedLabelProduct(product);
    setSelectedLabelImei(product.imeis[0] || "");
    setShowLabelModal(true);
  };

  const handlePrintLabel = () => {
    const labelElement = document.getElementById("thermal-label-print-area");
    if (!labelElement) return;

    const printArea = document.createElement("div");
    printArea.id = "label-print-root";
    printArea.innerHTML = labelElement.innerHTML;

    const style = document.createElement("style");
    style.innerHTML = `
      @media print {
        #root, .fixed, .modal, [role="dialog"], .backdrop-blur-xs {
          display: none !important;
          visibility: hidden !important;
        }
        html, body {
          background: #ffffff !important;
          color: #000000 !important;
          margin: 0 !important;
          padding: 0 !important;
          width: 50mm !important;
          height: 40mm !important;
        }
        #label-print-root {
          display: block !important;
          visibility: visible !important;
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 50mm !important;
          height: 40mm !important;
          font-family: 'JetBrains Mono', monospace, Courier, monospace !important;
          color: #000000 !important;
          background: #ffffff !important;
          padding: 2mm !important;
          box-sizing: border-box !important;
          text-align: center !important;
        }
        #label-print-root svg {
          display: block !important;
          margin: 1mm auto !important;
          max-width: 22mm !important;
          max-height: 22mm !important;
        }
      }
    `;

    document.body.appendChild(style);
    document.body.appendChild(printArea);

    setTimeout(() => {
      window.print();
      try {
        document.body.removeChild(printArea);
        document.body.removeChild(style);
      } catch (e) {
        console.warn("Print clean up failed:", e);
      }
    }, 50);
  };

  const filtered = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.imeis.some(imei => imei.includes(searchQuery));
    const cat = p.category || "Smartphone";
    const matchesCategory = 
      selectedCategories.length === 0 || 
      selectedCategories.includes("Semua") || 
      selectedCategories.includes(cat) ||
      selectedCategories.some(c => cat.toLowerCase().includes(c.toLowerCase()));
    const matchesBrand = selectedBrandFilter === "Semua" || p.brand.toLowerCase() === selectedBrandFilter.toLowerCase();
    const matchesCondition = selectedConditionFilter === "Semua" ||
      (selectedConditionFilter === "BARU" && p.type === "BARU") ||
      (selectedConditionFilter === "BEKAS" && p.type === "BEKAS");

    let matchesStockStatus = true;
    if (selectedStockStatusFilter === "Aman") {
      matchesStockStatus = p.stock > p.minStockAlert;
    } else if (selectedStockStatusFilter === "Menipis") {
      matchesStockStatus = p.stock > 0 && p.stock <= p.minStockAlert;
    } else if (selectedStockStatusFilter === "Habis") {
      matchesStockStatus = p.stock === 0;
    }

    const matchesMinPrice = !minPriceFilter || p.priceSell >= Number(minPriceFilter);
    const matchesMaxPrice = !maxPriceFilter || p.priceSell <= Number(maxPriceFilter);

    return matchesSearch && matchesCategory && matchesBrand && matchesCondition && matchesStockStatus && matchesMinPrice && matchesMaxPrice;
  });

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedProducts = filtered.slice(startIndex, endIndex);

  const renderPhotoGalleryGrid = () => (
    <div className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
              Galeri Dokumentasi Foto Fisik ({imagesList.length} Foto)
            </h4>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Potret beberapa sudut fisik, dusbook, kelengkapan, atau goresan unit
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => startPhotoCamera("environment")}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-all"
          >
            <Camera className="h-3.5 w-3.5" />
            <span>Kamera Direct</span>
          </button>

          <button
            type="button"
            onClick={() => photoFileInputRef.current?.click()}
            className="px-3 py-1.5 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Unggah Berkas</span>
          </button>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={photoFileInputRef}
        accept="image/*"
        capture="environment"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Main Preview Banner if images exist */}
      {imagesList.length > 0 && (
        <div className="relative w-full h-56 sm:h-64 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900 group shadow-inner">
          <LazyProductImage
            src={imagesList[selectedPhotoIndex] || imagesList[0]}
            alt="Foto Fisik Utama"
            category={category}
            className="w-full h-full object-contain bg-slate-950/80"
          />

          <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-white text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border border-white/20 flex items-center gap-1.5 shadow-md">
            <Camera className="h-3 w-3 text-emerald-400" />
            <span>Foto #{selectedPhotoIndex + 1} dari {imagesList.length}</span>
            {selectedPhotoIndex === 0 && (
              <span className="bg-emerald-500 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-md ml-1">
                Sampul Utama
              </span>
            )}
          </div>

          <div className="absolute top-3 right-3 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFullScreenPhotoUrl(imagesList[selectedPhotoIndex] || imagesList[0])}
              className="p-2 bg-black/60 hover:bg-black/80 text-white rounded-xl backdrop-blur-md border border-white/20 transition-transform active:scale-90 cursor-pointer"
              title="Perbesar Foto Fullscreen"
            >
              <Maximize2 className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => requestDeletePhoto(selectedPhotoIndex)}
              className="p-2 bg-rose-600/90 hover:bg-rose-600 text-white rounded-xl backdrop-blur-md border border-rose-400/40 transition-transform active:scale-90 cursor-pointer shadow-md"
              title="Hapus Foto Ini"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Photo Thumbnails Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5 pt-1">
        {imagesList.map((imgSrc, idx) => {
          const isSelected = idx === selectedPhotoIndex;
          const isNewlyAdded = idx === newlyAddedImageIndex;

          return (
            <div
              key={idx}
              onClick={() => setSelectedPhotoIndex(idx)}
              className={`relative group aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all bg-slate-100 dark:bg-slate-900 ${
                isSelected
                  ? "border-emerald-500 ring-2 ring-emerald-500/40 scale-[1.02] shadow-md"
                  : "border-slate-200 dark:border-slate-700 hover:border-slate-400"
              } ${isNewlyAdded ? "animate-pop-in ring-4 ring-emerald-400/60" : ""}`}
            >
              <LazyProductImage
                src={imgSrc}
                alt={`Foto Unit #${idx + 1}`}
                category={category}
                className="w-full h-full object-cover"
              />

              <div className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md backdrop-blur-xs">
                #{idx + 1}
              </div>

              {/* Delete button on thumbnail */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  requestDeletePhoto(idx);
                }}
                className="absolute top-1 right-1 p-1 bg-rose-600/90 hover:bg-rose-700 text-white rounded-lg shadow-md opacity-80 group-hover:opacity-100 transition-all transform hover:scale-110 cursor-pointer"
                title="Hapus foto dari rekam data"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}

        {/* Loading Skeleton Card */}
        {isProcessingPhoto && (
          <div className="aspect-square rounded-xl border-2 border-dashed border-emerald-500/80 bg-emerald-500/10 dark:bg-emerald-950/40 p-2 flex flex-col items-center justify-center text-center space-y-1.5 animate-pop-in animate-pulse">
            <Loader2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 animate-spin" />
            <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300">
              Mengompres Foto...
            </span>
          </div>
        )}

        {/* Add New Photo Card */}
        <button
          type="button"
          onClick={() => startPhotoCamera("environment")}
          className="aspect-square rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 bg-white dark:bg-slate-900 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 p-2 flex flex-col items-center justify-center text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition-all cursor-pointer group"
        >
          <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/60 transition-colors">
            <Plus className="h-4 w-4" />
          </div>
          <span className="text-[10px] font-extrabold mt-1 text-center">Tambah Foto</span>
        </button>
      </div>

      {/* URL fallback option */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-[11px] font-bold text-slate-500 hover:text-emerald-600 dark:text-slate-400 underline cursor-pointer"
        >
          {showUrlInput ? "Sembunyikan Input URL Link" : "Atau Input Link URL Gambar Internet"}
        </button>

        {showUrlInput && (
          <div className="mt-2 flex gap-2 animate-fadeIn">
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500"
              placeholder="https://images.unsplash.com/... (Link gambar)"
            />
            <button
              type="button"
              onClick={() => {
                if (imageUrl.trim()) {
                  addPhotoToGallery(imageUrl.trim());
                }
              }}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              Tambahkan
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      
      {/* Header operations */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-md font-bold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <Boxes className="h-5.5 w-5.5 text-primary-600" />
            {t("Manajemen Inventaris & Pelacakan IMEI Bulk")}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {t("Rekonsiliasi stok hp, kelola data IMEI serial, dan monitor batas aman stok smartphone.")}
          </p>
        </div>
        
        <button
          onClick={() => {
            setScannerTargetMode("SEARCH");
            setIsScannerOpen(true);
          }}
          className="px-4.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 active:scale-[0.97] transition-all cursor-pointer shadow-md shadow-emerald-600/10"
        >
          <Camera className="h-4 w-4" />
          <span>{t("Scan Barcode Kamera")}</span>
        </button>

        {/* Batch QR Catalog Sheet Button */}
        {/* Printable Adhesive Label Generator Button */}
        <button
          onClick={() => setShowAdhesiveLabelModal(true)}
          className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold rounded-xl text-xs flex items-center gap-1.5 active:scale-[0.97] transition-all cursor-pointer shadow-xs"
          title="Cetak stiker label barcode / QR code presisi pada kertas stiker A4 atau roll thermal"
        >
          <Barcode className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span>{t("Cetak Label Stiker Barcode")}</span>
        </button>

        <button
          onClick={() => setShowBatchQrModal(true)}
          className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold rounded-xl text-xs flex items-center gap-1.5 active:scale-[0.97] transition-all cursor-pointer shadow-xs"
          title="Cetak lembaran QR code untuk seluruh katalog produk / rak toko"
        >
          <Grid className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <span>{t("Cetak Sheet QR Katalog")}</span>
        </button>

        {/* Bulk Barcode Printing Button */}
        <button
          onClick={() => setShowBulkBarcodeModal(true)}
          className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-bold rounded-xl text-xs flex items-center gap-1.5 active:scale-[0.97] transition-all cursor-pointer shadow-xs"
          title="Cetak massal label harga & barcode scan POS untuk beberapa produk sekaligus"
        >
          <Barcode className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <span>{t("Cetak Massal Barcode")} {selectedProductIds.length > 0 ? `(${selectedProductIds.length})` : ''}</span>
        </button>

        <button
          onClick={handleOpenOpnameModal}
          className="px-4.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1.5 active:scale-[0.97] transition-all cursor-pointer shadow-xs"
        >
          <ClipboardCheck className="h-4 w-4" />
          <span>{t("Stok Opname")}</span>
        </button>
        {/* Track IMEI Button */}
        <button
          onClick={handleOpenHistoryModal}
          className="px-4.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1.5 active:scale-[0.97] transition-all cursor-pointer shadow-xs"
        >
          <History className="h-4 w-4" />
          <span>{t("Lacak IMEI")}</span>
        </button>

        {/* Export IMEI Report Button */}
        <button
          id="btn-export-imei-pdf"
          onClick={() =>
            generateImeiInventoryPDF(products, {
              shopTitle: "FonePOS - Laporan Stok IMEI & Perangkat",
              printedBy: currentUser?.name || "Administrator",
            })
          }
          className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold rounded-xl text-xs flex items-center gap-1.5 active:scale-[0.97] transition-all cursor-pointer shadow-xs"
          title="Ekspor Laporan PDF Seluruh Unit Device & Nomor IMEI dalam Stok"
        >
          <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <span>{t("Export IMEI Report (PDF)")}</span>
        </button>

        {userRole !== "CASHIER" && (
          <>
            <input 
              type="file" 
              accept=".csv" 
              ref={fileInputRef} 
              onChange={handleBulkImport}
              className="hidden" 
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1.5 active:scale-[0.97] transition-all cursor-pointer shadow-xs"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              <span>{t("Bulk Import CSV")}</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="px-4.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 active:scale-[0.97] transition-all cursor-pointer shadow-md shadow-emerald-600/10"
              title="Unduh data inventaris stok ke file Excel (.xlsx) SheetJS"
            >
              <FileSpreadsheet className="h-4 w-4 text-white" />
              <span>{t("Ekspor Excel (.xlsx)")}</span>
            </button>

            <button
              onClick={handleDownloadStockReport}
              className="px-4.5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 active:scale-[0.97] transition-all cursor-pointer shadow-md shadow-rose-600/10"
              title="Unduh laporan stok kritis ke PDF"
            >
              <FileSpreadsheet className="h-4 w-4 text-white" />
              <span>{t("Unduh Laporan Stok")}</span>
            </button>

            <button
              onClick={() => setShowMonthlyOpnamePdfModal(true)}
              className="px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 active:scale-[0.97] transition-all cursor-pointer shadow-md shadow-indigo-600/20"
              title="Buat laporan stok opname bulanan otomatis PDF mencakup ringkasan selisih stok & nilai inventaris"
            >
              <FileText className="h-4 w-4 text-white" />
              <span>{t("Laporan Opname Bulanan (PDF)")}</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-4.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-semibold rounded-xl text-xs flex items-center gap-1.5 active:scale-[0.97] transition-all cursor-pointer shadow-xs"
              title="Unduh data inventaris stok terfilter ke file CSV"
            >
              <Download className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>{t("Ekspor CSV")}</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="px-4.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-semibold rounded-xl text-xs flex items-center gap-1.5 active:scale-[0.97] transition-all cursor-pointer shadow-xs"
              title="Unduh data inventaris stok terfilter ke file PDF"
            >
              <FileText className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              <span>{t("Ekspor PDF")}</span>
            </button>
            <button
              onClick={() => {
                setSkuGenPrefill({
                  category,
                  brand,
                  model,
                  color,
                  type,
                  condition
                });
                setShowSkuGeneratorModal(true);
              }}
              className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 dark:hover:bg-amber-900/60 border border-amber-300 dark:border-amber-700 font-bold rounded-xl text-xs flex items-center gap-1.5 active:scale-[0.97] transition-all cursor-pointer shadow-xs"
              title="Buka Generator SKU Otomatis berbasis Kategori, Brand & Model"
            >
              <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span>{t("Generator SKU")}</span>
            </button>
            <button
              id="btn-add-inventory-modal"
              onClick={handleOpenAddModal}
              className="px-4.5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 active:scale-[0.97] transition-all cursor-pointer shadow-md shadow-primary-600/10"
            >
              <Plus className="h-4 w-4" />
              <span>{t("Tambah Stok HP Baru")}</span>
            </button>
          </>
        )}
      </div>

      {/* Filter and search */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
        <div className="relative flex-1 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 text-slate-400 h-4.5 w-4.5" />
            <input
              type="text"
              placeholder="Cari berdasarkan nama, brand, model, barcode, atau nomor IMEI spesifik..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setScannerTargetMode("SEARCH");
              setIsScannerOpen(true);
            }}
            className="px-3.5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-primary-600/10 active:scale-95 transition-all shrink-0"
            title="Pindai Barcode / IMEI dengan Kamera Perangkat"
          >
            <Camera className="h-4 w-4" />
            <span className="hidden sm:inline">Scan Kamera</span>
          </button>
        </div>
        
        {/* Multi-Select Category Filter */}
        <div className="relative w-full lg:w-48">
          <button
            type="button"
            onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs rounded-xl p-2.5 font-bold cursor-pointer flex items-center justify-between gap-1 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
          >
            <div className="flex items-center gap-1.5 truncate">
              <Filter className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span className="truncate">
                {selectedCategories.length === 0 || selectedCategories.includes("Semua")
                  ? "Kategori: Semua"
                  : selectedCategories.length === 1
                  ? `Kategori: ${selectedCategories[0]}`
                  : `Kategori (${selectedCategories.length} Terpilih)`}
              </span>
            </div>
            <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${isCategoryDropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {isCategoryDropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-30" 
                onClick={() => setIsCategoryDropdownOpen(false)} 
              />
              <div className="absolute left-0 mt-1.5 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-40 p-2.5 space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2 px-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Filter Multi-Kategori
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedCategories([])}
                    className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    Reset Semua
                  </button>
                </div>

                <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
                  <label className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700/60 rounded-lg cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={selectedCategories.length === 0 || selectedCategories.includes("Semua")}
                      onChange={() => setSelectedCategories([])}
                      className="h-3.5 w-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                    />
                    <span>Semua Kategori</span>
                  </label>

                  {Array.from(new Set(["Smartphone Baru", "Smartphone Bekas", "Smartphone", "Aksesori", "Sparepart", "Tablet", "Lainnya", ...products.map(p => p.category || "Smartphone")])).map((categoryItem) => {
                    const isChecked = selectedCategories.includes(categoryItem);
                    const prodCount = products.filter(p => (p.category || "Smartphone") === categoryItem).length;
                    return (
                      <label
                        key={categoryItem}
                        className="flex items-center justify-between px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700/60 rounded-lg cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setSelectedCategories(prev => prev.filter(c => c !== categoryItem && c !== "Semua"));
                              } else {
                                setSelectedCategories(prev => [...prev.filter(c => c !== "Semua"), categoryItem]);
                              }
                            }}
                            className="h-3.5 w-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer shrink-0"
                          />
                          <span className="truncate">{categoryItem}</span>
                        </div>
                        <span className="text-[9px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-500 px-1.5 py-0.5 rounded-full shrink-0">
                          {prodCount}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Stock Status Filter */}
        <div className="w-full lg:w-40">
          <select
            value={selectedStockStatusFilter}
            onChange={(e) => setSelectedStockStatusFilter(e.target.value)}
            className="w-full bg-white border border-slate-200 text-slate-700 text-xs rounded-xl focus:ring-primary-500 focus:border-primary-500 block p-2.5 font-medium cursor-pointer"
          >
            <option value="Semua">Status Stok: Semua</option>
            <option value="Aman">🟢 Stok Aman (&gt; Batas Minimal)</option>
            <option value="Menipis">🟡 Stok Menipis (⚠️ Low)</option>
            <option value="Habis">🔴 Stok Habis (0)</option>
          </select>
        </div>

        {/* Brand Filter */}
        <div className="w-full lg:w-36">
          <select
            value={selectedBrandFilter}
            onChange={(e) => setSelectedBrandFilter(e.target.value)}
            className="w-full bg-white border border-slate-200 text-slate-700 text-xs rounded-xl focus:ring-primary-500 focus:border-primary-500 block p-2.5 font-medium cursor-pointer"
          >
            <option value="Semua">Merek: Semua</option>
            <option value="Apple">Apple</option>
            <option value="Samsung">Samsung</option>
            <option value="Xiaomi">Xiaomi</option>
            <option value="Oppo">Oppo</option>
            <option value="Vivo">Vivo</option>
            <option value="Realme">Realme</option>
            <option value="Infinix">Infinix</option>
          </select>
        </div>

        {/* Condition Filter */}
        <div className="w-full lg:w-36">
          <select
            value={selectedConditionFilter}
            onChange={(e) => setSelectedConditionFilter(e.target.value)}
            className="w-full bg-white border border-slate-200 text-slate-700 text-xs rounded-xl focus:ring-primary-500 focus:border-primary-500 block p-2.5 font-medium cursor-pointer"
          >
            <option value="Semua">Kondisi: Semua</option>
            <option value="BARU">Baru (BNIB)</option>
            <option value="BEKAS">Bekas (Second)</option>
          </select>
        </div>

        {/* Rentang Harga Filter */}
        <div className="flex items-center gap-1.5 w-full lg:w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">Rp:</span>
          <input
            type="number"
            value={minPriceFilter}
            onChange={(e) => setMinPriceFilter(e.target.value)}
            placeholder="Min"
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <span className="text-slate-400 text-xs font-bold">-</span>
          <input
            type="number"
            value={maxPriceFilter}
            onChange={(e) => setMaxPriceFilter(e.target.value)}
            placeholder="Max"
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500"
          />
          {(minPriceFilter || maxPriceFilter) && (
            <button
              type="button"
              onClick={() => { setMinPriceFilter(""); setMaxPriceFilter(""); }}
              className="text-slate-400 hover:text-rose-500 font-bold text-xs p-0.5 cursor-pointer"
              title="Reset Rentang Harga"
            >
              ×
            </button>
          )}
        </div>

        {/* View Switcher (Grouped / Table / Grid) */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
          <button
            type="button"
            onClick={() => setInventoryViewMode("grouped")}
            className={`p-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              inventoryViewMode === "grouped"
                ? "bg-white text-primary-600 shadow-xs ring-1 ring-primary-500/20"
                : "text-slate-500 hover:text-slate-700"
            }`}
            title="Tampilan Pengelompokan Kategori"
          >
            <Layers className="h-4 w-4" />
            <span className="hidden sm:inline">Grup Kategori</span>
          </button>
          <button
            type="button"
            onClick={() => setInventoryViewMode("table")}
            className={`p-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              inventoryViewMode === "table"
                ? "bg-white text-primary-600 shadow-xs"
                : "text-slate-500 hover:text-slate-700"
            }`}
            title="Tampilan Tabel (Klik Baris Untuk Edit)"
          >
            <Table className="h-4 w-4" />
            <span className="hidden sm:inline">Tabel</span>
          </button>
          <button
            type="button"
            onClick={() => setInventoryViewMode("grid")}
            className={`p-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              inventoryViewMode === "grid"
                ? "bg-white text-primary-600 shadow-xs"
                : "text-slate-500 hover:text-slate-700"
            }`}
            title="Tampilan Kartu Grid"
          >
            <Grid className="h-4 w-4" />
            <span className="hidden sm:inline">Grid</span>
          </button>
        </div>
      </div>

      {/* Bulk Selection Bar */}
      {filtered.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-700">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => toggleSelectAllFiltered(filtered)}
              className="px-3 py-1.5 bg-white dark:bg-slate-700 hover:bg-slate-100 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer shadow-2xs"
            >
              <input 
                type="checkbox" 
                checked={filtered.length > 0 && filtered.every(p => selectedProductIds.includes(p.id))}
                onChange={() => {}} 
                className="w-3.5 h-3.5 rounded text-indigo-600 cursor-pointer pointer-events-none"
              />
              <span>Pilih Semua ({filtered.length} Produk)</span>
            </button>

            {selectedProductIds.length > 0 && (
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg">
                {selectedProductIds.length} Terpilih
              </span>
            )}
          </div>

          {selectedProductIds.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setSelectedProductIds([])}
                className="px-3 py-1.5 bg-white dark:bg-slate-700 hover:bg-slate-100 text-slate-500 dark:text-slate-300 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-600 cursor-pointer transition-all"
              >
                Batal
              </button>

              <button
                onClick={() => setShowBatchPriceModal(true)}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
              >
                <DollarSign className="h-3.5 w-3.5" />
                Ubah Harga Massal
              </button>

              <button
                onClick={() => setShowBatchAdjustmentModal(true)}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
              >
                <Boxes className="h-3.5 w-3.5" />
                Penyesuaian Stok Massal
              </button>

              <button
                onClick={handleAnalyzeData}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
              >
                <Database className="h-3.5 w-3.5" />
                Analisis Data
              </button>

              <button
                onClick={handleArchiveTransactions}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-600/20 active:scale-95 transition-all"
              >
                <History className="h-3.5 w-3.5" />
                Arsip Data Tahunan
              </button>

              <button
                onClick={() => setShowBatchDeleteModal(true)}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-rose-600/20 active:scale-95 transition-all"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Hapus Massal ({selectedProductIds.length})
              </button>

              <button
                onClick={() => setShowBulkBarcodeModal(true)}
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20 active:scale-95 transition-all"
              >
                <Barcode className="h-4 w-4" />
                Cetak Barcode ({selectedProductIds.length})
              </button>
            </div>
          )}
        </div>
      )}

      {/* Product List Display */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
          <Smartphone className="h-12 w-12 mx-auto mb-2.5 opacity-40" />
          <p className="text-sm font-semibold">Tidak ada produk dalam persediaan.</p>
          <p className="text-xs text-slate-400 mt-1">Gunakan tombol tambah stok atau cek filter pencarian/status stok.</p>
        </div>
      ) : inventoryViewMode === "grouped" ? (
        /* GROUPED BY CATEGORY VIEW */
        <div className="space-y-6">
          {(() => {
            const categoriesOrder = [
              "Smartphone Baru",
              "Smartphone Bekas",
              "Aksesori",
              "Sparepart",
              "Tablet",
              "Lainnya"
            ];

            const groupedMap: Record<string, Product[]> = {};
            
            // Initialize default categories
            categoriesOrder.forEach(cat => {
              groupedMap[cat] = [];
            });

            // Group products
            filtered.forEach(p => {
              let catName = p.category;
              if (!catName || catName === "Smartphone") {
                catName = p.type === "BEKAS" ? "Smartphone Bekas" : "Smartphone Baru";
              } else if (catName === "Aksesoris") {
                catName = "Aksesori";
              }
              
              if (!groupedMap[catName]) {
                groupedMap[catName] = [];
              }
              groupedMap[catName].push(p);
            });

            const activeCategories = Object.keys(groupedMap).filter(
              cat => groupedMap[cat].length > 0 || (selectedCategoryFilter === cat)
            );

            if (activeCategories.length === 0) {
              return (
                <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400">
                  <p className="text-sm font-semibold">Tidak ada produk dalam kategori ini.</p>
                </div>
              );
            }

            return activeCategories.map((catName) => {
              const catProducts = groupedMap[catName] || [];
              if (catProducts.length === 0) return null;

              const totalStock = catProducts.reduce((acc, p) => acc + (p.stock || 0), 0);
              const totalVal = catProducts.reduce((acc, p) => acc + ((p.stock || 0) * (p.priceSell || 0)), 0);

              return (
                <div key={catName} className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
                  {/* Category Header */}
                  <div className="bg-gradient-to-r from-slate-50 via-indigo-50/30 to-slate-50 dark:from-slate-800 dark:to-slate-800/80 p-4 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-xs shrink-0">
                        {catName.includes("Aksesori") ? (
                          <Boxes className="h-5 w-5" />
                        ) : catName.includes("Sparepart") ? (
                          <ArrowRightLeft className="h-5 w-5" />
                        ) : (
                          <Smartphone className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{catName}</h3>
                          <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-extrabold px-2.5 py-0.5 rounded-full border border-indigo-200/80">
                            {catProducts.length} Jenis Produk
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-2">
                          <span>Total Stok: <strong className="text-slate-800 dark:text-slate-200">{totalStock} Unit</strong></span>
                          <span>•</span>
                          <span>Nilai Jual Stok: <strong className="text-emerald-600 font-bold">Rp {totalVal.toLocaleString("id-ID")}</strong></span>
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenAddModalWithCategory(catName)}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-all"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Tambah {catName}</span>
                    </button>
                  </div>

                  {/* Category Products Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/60 dark:bg-slate-800/40 border-b border-slate-200/80 dark:border-slate-700 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                          <th className="p-3 w-10 text-center">
                            <input
                              type="checkbox"
                              checked={catProducts.length > 0 && catProducts.every(p => selectedProductIds.includes(p.id))}
                              onChange={() => toggleSelectAllFiltered(catProducts)}
                              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                            />
                          </th>
                          <th className="p-3">Produk & Spesifikasi</th>
                          <th className="p-3">Merek / Tipe</th>
                          <th className="p-3 text-right">Harga Modal</th>
                          <th className="p-3 text-right">Harga Jual</th>
                          <th className="p-3 text-center">Stok</th>
                          <th className="p-3">IMEI Aktif</th>
                          <th className="p-3 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                        {catProducts.map((p) => {
                          const isLowStock = p.stock <= p.minStockAlert && p.stock > 0;
                          const isOutOfStock = p.stock === 0;
                          const isSelected = selectedProductIds.includes(p.id);

                          return (
                            <tr
                              key={p.id}
                              onClick={() => handleOpenEditModal(p)}
                              className={`group hover:bg-indigo-50/20 cursor-pointer transition-colors ${
                                isSelected ? "bg-indigo-50/40" : ""
                              }`}
                            >
                              <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSelectProduct(p.id)}
                                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                                />
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-9 h-9 shrink-0 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 relative">
                                    <LazyProductImage
                                      src={p.imageUrl}
                                      alt={p.name}
                                      category={p.category}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-bold text-slate-800 dark:text-slate-100 text-xs truncate">
                                      {p.name}
                                    </div>
                                    <div className="text-[10px] text-slate-400 truncate">
                                      {p.specifications || `${p.brand} ${p.model}`}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-3 font-medium text-slate-600">
                                <div>{p.brand}</div>
                                <div className="text-[10px] text-slate-400">{p.type === "BARU" ? "BNIB" : `Bekas Grade ${p.condition}`}</div>
                              </td>
                              <td className="p-3 text-right font-medium text-slate-500">
                                Rp {(p.priceBuy ?? 0).toLocaleString("id-ID")}
                              </td>
                              <td className="p-3 text-right font-bold text-slate-800 dark:text-slate-100">
                                Rp {(p.priceSell ?? 0).toLocaleString("id-ID")}
                              </td>
                              <td className="p-3 text-center">
                                {isOutOfStock ? (
                                  <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-extrabold bg-red-100 text-red-700">Habis</span>
                                ) : isLowStock ? (
                                  <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-800">Low ({p.stock})</span>
                                ) : (
                                  <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800">{p.stock} Unit</span>
                                )}
                              </td>
                              <td className="p-3" onClick={(e) => e.stopPropagation()}>
                                <span className="font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-600 font-bold select-all">
                                  {p.imeis && p.imeis.length > 0 ? p.imeis[0] : "-"}
                                </span>
                                {p.imeis && p.imeis.length > 1 && (
                                  <span className="ml-1 text-[9px] font-bold text-indigo-600">+{p.imeis.length - 1}</span>
                                )}
                              </td>
                              <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenProductDetailModal(p)}
                                    className="p-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded cursor-pointer border border-emerald-200"
                                    title="Detail Produk & Galeri Foto"
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenPrintLabelModal(p)}
                                    className="p-1 bg-primary-50 text-primary-600 rounded cursor-pointer border border-primary-200"
                                    title="Cetak Label QR Code"
                                  >
                                    <Printer className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditModal(p)}
                                    className="px-2 py-1 bg-slate-100 text-slate-700 text-[10px] font-bold rounded cursor-pointer border border-slate-200"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteProduct(p.id)}
                                    className="p-1 bg-red-50 text-red-600 rounded cursor-pointer border border-red-200"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      ) : inventoryViewMode === "table" ? (
        /* TABLE VIEW (Interactive & Clickable Rows) */
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="p-3.5 w-10 text-center">
                    <input 
                      type="checkbox"
                      checked={filtered.length > 0 && filtered.every(p => selectedProductIds.includes(p.id))}
                      onChange={() => toggleSelectAllFiltered(filtered)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                    />
                  </th>
                  <th className="p-3.5">Produk & Merek</th>
                  <th className="p-3.5">Kategori & Kondisi</th>
                  <th className="p-3.5 text-right">Harga Modal</th>
                  <th className="p-3.5 text-right">Harga Jual</th>
                  <th className="p-3.5 text-center">Status Stok</th>
                  <th className="p-3.5">IMEI / Serial Active</th>
                  <th className="p-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-200">
                {paginatedProducts.map((p) => {
                  const isLowStock = p.stock <= p.minStockAlert && p.stock > 0;
                  const isOutOfStock = p.stock === 0;
                  const isSelected = selectedProductIds.includes(p.id);

                  return (
                    <tr
                      key={p.id}
                      onClick={() => handleOpenEditModal(p)}
                      className={`group hover:bg-primary-50/30 dark:hover:bg-slate-800/60 cursor-pointer transition-colors ${
                        isSelected ? "bg-indigo-50/40 dark:bg-indigo-950/20" : ""
                      }`}
                      title="Klik baris ini untuk membuka modal edit produk"
                    >
                      {/* Bulk Checkbox */}
                      <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectProduct(p.id)}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                        />
                      </td>

                      {/* Product Thumbnail & Details */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 shrink-0 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 relative">
                            <LazyProductImage
                              src={p.imageUrl}
                              alt={p.name}
                              category={p.category}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-800 dark:text-slate-100 text-xs group-hover:text-primary-600 transition-colors flex items-center gap-1.5">
                              <span className="truncate">{p.name}</span>
                              <span className="text-[9px] font-bold text-primary-600 bg-primary-50 border border-primary-200 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                ✏️ Edit
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <span>{p.brand}</span> • <span>{p.model}</span>
                              <span className="text-[9px] font-medium bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 ml-1">
                                <MapPin className="h-2.5 w-2.5 inline mr-0.5" />{p.location || "Toko Utama"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category & Condition */}
                      <td className="p-3.5">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-2 py-0.5 rounded-md text-[10px] font-bold border border-slate-200 dark:border-slate-700">
                            {p.category || "Smartphone"}
                          </span>
                          <span className="bg-primary-50 text-primary-700 dark:bg-primary-950/50 dark:text-primary-300 px-2 py-0.5 rounded-md text-[9px] font-bold border border-primary-200/80">
                            {p.type === "BARU" ? "BNIB Baru" : `Bekas ${p.condition}`}
                          </span>
                        </div>
                      </td>

                      {/* Buy Price Inline Edit */}
                      <td className="p-3.5 text-right font-medium text-slate-600 dark:text-slate-400" onClick={(e) => e.stopPropagation()}>
                        {inlineEdit?.id === p.id && inlineEdit.field === 'priceBuy' ? (
                          <div className="flex items-center justify-end gap-1">
                            <input
                              type="number"
                              value={inlineEdit.value}
                              onChange={(e) => setInlineEdit({ ...inlineEdit, value: e.target.value })}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveInlineEdit(p);
                                if (e.key === "Escape") setInlineEdit(null);
                              }}
                              autoFocus
                              className="w-24 bg-white dark:bg-slate-900 border border-emerald-500 rounded-lg px-2 py-1 text-xs text-right font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            <button
                              type="button"
                              disabled={isSavingInline}
                              onClick={() => handleSaveInlineEdit(p)}
                              className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-2xs transition-transform active:scale-90 cursor-pointer"
                              title="Simpan (Enter)"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setInlineEdit(null)}
                              className="p-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-600 dark:text-slate-300 rounded-lg cursor-pointer"
                              title="Batal (Esc)"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5 group/edit">
                            <span>Rp {(p.priceBuy ?? 0).toLocaleString("id-ID")}</span>
                            {userRole !== "CASHIER" && (
                              <button
                                type="button"
                                onClick={() => setInlineEdit({ id: p.id, field: "priceBuy", value: (p.priceBuy ?? 0).toString() })}
                                className="opacity-0 group-hover/edit:opacity-100 p-1 text-slate-400 hover:text-emerald-600 rounded transition-opacity cursor-pointer"
                                title="Edit Harga Modal Inline"
                              >
                                <Edit2 className="h-3 w-3" />
                              </button>
                            )}
                            {inlineSavedId === `${p.id}-priceBuy` && (
                              <span className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-0.5 animate-fadeIn">
                                <Check className="h-3 w-3" /> OK
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Sell Price Inline Edit */}
                      <td className="p-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        {inlineEdit?.id === p.id && inlineEdit.field === 'priceSell' ? (
                          <div className="flex items-center justify-end gap-1">
                            <input
                              type="number"
                              value={inlineEdit.value}
                              onChange={(e) => setInlineEdit({ ...inlineEdit, value: e.target.value })}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveInlineEdit(p);
                                if (e.key === "Escape") setInlineEdit(null);
                              }}
                              autoFocus
                              className="w-28 bg-white dark:bg-slate-900 border border-emerald-500 rounded-lg px-2 py-1 text-xs text-right font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            <button
                              type="button"
                              disabled={isSavingInline}
                              onClick={() => handleSaveInlineEdit(p)}
                              className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-2xs transition-transform active:scale-90 cursor-pointer"
                              title="Simpan (Enter)"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setInlineEdit(null)}
                              className="p-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-600 dark:text-slate-300 rounded-lg cursor-pointer"
                              title="Batal (Esc)"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-end group/edit">
                            <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                              <span>Rp {(p.priceSell ?? 0).toLocaleString("id-ID")}</span>
                              {userRole !== "CASHIER" && (
                                <button
                                  type="button"
                                  onClick={() => setInlineEdit({ id: p.id, field: "priceSell", value: (p.priceSell ?? 0).toString() })}
                                  className="opacity-0 group-hover/edit:opacity-100 p-1 text-slate-400 hover:text-emerald-600 rounded transition-opacity cursor-pointer"
                                  title="Edit Harga Jual Inline"
                                >
                                  <Edit2 className="h-3 w-3" />
                                </button>
                              )}
                              {inlineSavedId === `${p.id}-priceSell` && (
                                <span className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-0.5 animate-fadeIn">
                                  <Check className="h-3 w-3" /> OK
                                </span>
                              )}
                            </div>
                            {p.priceSell > p.priceBuy && p.priceBuy > 0 && (
                              <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">
                                Margin +{Math.round(((p.priceSell - p.priceBuy) / p.priceBuy) * 100)}%
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Stock Quantity Inline Edit */}
                      <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        {inlineEdit?.id === p.id && inlineEdit.field === 'stock' ? (
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              value={inlineEdit.value}
                              onChange={(e) => setInlineEdit({ ...inlineEdit, value: e.target.value })}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveInlineEdit(p);
                                if (e.key === "Escape") setInlineEdit(null);
                              }}
                              autoFocus
                              className="w-20 bg-white dark:bg-slate-900 border border-emerald-500 rounded-lg px-2 py-1 text-xs text-center font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            <button
                              type="button"
                              disabled={isSavingInline}
                              onClick={() => handleSaveInlineEdit(p)}
                              className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-2xs transition-transform active:scale-90 cursor-pointer"
                              title="Simpan (Enter)"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setInlineEdit(null)}
                              className="p-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-600 dark:text-slate-300 rounded-lg cursor-pointer"
                              title="Batal (Esc)"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 group/edit">
                            {isOutOfStock ? (
                              <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300 px-2.5 py-1 rounded-full text-[10px] font-extrabold border border-red-200">
                                <AlertOctagon className="h-3 w-3" /> Habis (0)
                              </span>
                            ) : isLowStock ? (
                              <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 px-2.5 py-1 rounded-full text-[10px] font-extrabold border border-amber-200">
                                <AlertTriangle className="h-3 w-3" /> Menipis ({p.stock})
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 px-2.5 py-1 rounded-full text-[10px] font-extrabold border border-emerald-200">
                                <CheckCircle className="h-3 w-3" /> Aman ({p.stock})
                              </span>
                            )}
                            {userRole !== "CASHIER" && (
                              <button
                                type="button"
                                onClick={() => setInlineEdit({ id: p.id, field: "stock", value: p.stock.toString() })}
                                className="opacity-0 group-hover/edit:opacity-100 p-1 text-slate-400 hover:text-emerald-600 rounded transition-opacity cursor-pointer"
                                title="Edit Jumlah Stok Inline"
                              >
                                <Edit2 className="h-3 w-3" />
                              </button>
                            )}
                            {inlineSavedId === `${p.id}-stock` && (
                              <span className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-0.5 animate-fadeIn">
                                <Check className="h-3 w-3" /> OK
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* IMEI List */}
                      <td className="p-3.5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5 max-w-xs overflow-hidden">
                          <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 font-bold select-all">
                            {p.imeis && p.imeis.length > 0 ? p.imeis[0] : "Tanpa IMEI"}
                          </span>
                          {p.imeis && p.imeis.length > 1 && (
                            <span 
                              className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded cursor-pointer"
                              title={`Seluruh IMEI: ${p.imeis.join(", ")}`}
                            >
                              +{p.imeis.length - 1} IMEI
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Operations */}
                      <td className="p-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenProductDetailModal(p)}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg cursor-pointer transition-all active:scale-95"
                            title="Detail Produk & Galeri Foto"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenPrintLabelModal(p)}
                            className="p-1.5 bg-primary-50 hover:bg-primary-100 text-primary-700 border border-primary-200 rounded-lg cursor-pointer transition-all active:scale-95"
                            title="Cetak Label QR Code"
                          >
                            <QrCode className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedPriceHistoryProduct(p)}
                            className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg cursor-pointer transition-all active:scale-95"
                            title="Tren Harga"
                          >
                            <TrendingUp className="h-3.5 w-3.5" />
                          </button>
                          {userRole !== "CASHIER" && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(p)}
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg border border-slate-200 cursor-pointer text-[11px] transition-all active:scale-95"
                                title="Edit Produk"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(p.id)}
                                className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg cursor-pointer transition-all active:scale-95"
                                title="Hapus Produk"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls Footer for Table View */}
          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <span>Tampilkan</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1 font-semibold text-xs focus:ring-2 focus:ring-indigo-500"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>produk per halaman</span>
            </div>

            <div className="font-medium text-slate-500 dark:text-slate-400">
              Menampilkan <strong className="text-slate-800 dark:text-slate-200">{totalItems === 0 ? 0 : startIndex + 1}</strong> - <strong className="text-slate-800 dark:text-slate-200">{endIndex}</strong> dari <strong className="text-slate-800 dark:text-slate-200">{totalItems}</strong> produk
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-600 transition"
                title="Halaman Pertama"
              >
                «
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-600 transition"
              >
                ‹
              </button>
              <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg font-extrabold">
                Hal {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-2.5 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-600 transition"
              >
                ›
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-600 transition"
                title="Halaman Terakhir"
              >
                »
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* GRID VIEW */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {paginatedProducts.map((p) => {
            const isLowStock = p.stock <= p.minStockAlert;
            const isSelected = selectedProductIds.includes(p.id);
            return (
              <div 
                key={p.id} 
                className={`bg-white border rounded-2xl p-5 shadow-xs space-y-4 transition-all ${
                  isSelected 
                    ? "border-indigo-400 bg-indigo-50/20 ring-2 ring-indigo-500/20" 
                    : isLowStock 
                    ? "border-amber-300 bg-amber-50/20" 
                    : "border-slate-200"
                }`}
              >
                <div className="flex gap-3.5 items-start">
                  {/* Select Checkbox for Bulk Barcode */}
                  <div className="pt-1.5 shrink-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectProduct(p.id)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                      title="Pilih produk ini untuk cetak barcode massal"
                    />
                  </div>

                  {/* Lazy Loaded Product Image Thumbnail */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shadow-xs relative">
                    <LazyProductImage
                      src={p.imageUrl}
                      alt={p.name}
                      category={p.category}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 leading-snug">
                      <span className="truncate">{p.name}</span>
                      <span className="text-[9px] font-medium bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 flex items-center gap-1 shrink-0">
                        <MapPin className="h-2.5 w-2.5"/>{p.location || "Toko Utama"}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500">{p.brand} • {p.model}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-[10px] font-bold border border-slate-200">
                        {p.category || "Smartphone"}
                      </span>
                      <span className="bg-primary-50 text-primary-700 px-2 py-0.5 rounded-md text-[10px] font-bold border border-primary-200">
                        {p.type === "BARU" ? "BARU (BNIB)" : `BEKAS (Grade ${p.condition})`}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold text-slate-800">
                      Rp {(p.priceSell ?? 0).toLocaleString("id-ID")}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Modal: Rp {(p.priceBuy ?? 0).toLocaleString("id-ID")}
                    </div>
                    <div className="mt-2 text-right">
                      {isLowStock ? (
                        <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md text-[10px] font-bold border border-amber-200">
                          <AlertTriangle className="h-3 w-3" />
                          Stok: {p.stock}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md text-[10px] font-bold border border-emerald-200">
                          Stok: {p.stock}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expand IMEI serial numbers list */}
                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Hash className="h-3.5 w-3.5" />
                    Pelacakan Nomor IMEI Aktif ({p.imeis.length})
                  </h4>
                  {p.imeis.length === 0 ? (
                    <div className="text-[10px] text-red-600 bg-red-50 border border-red-200 p-2.5 rounded-xl font-bold flex items-center justify-between">
                      <span>Semua unit terjual habis / Kosong.</span>
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-[9px] font-extrabold uppercase">Terjual (Sold)</span>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto bg-slate-50 p-2 rounded-xl border border-slate-100 pr-1">
                      {p.imeis.map(imei => (
                        <div 
                          key={imei}
                          onClick={() => handleTrackImei(imei)}
                          className="bg-white hover:bg-slate-100 text-slate-700 font-mono text-[9.5px] font-bold px-2 py-1 rounded-lg border border-slate-200 hover:border-indigo-300 flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs select-all"
                          title="Klik untuk melihat timeline lengkap IMEI"
                        >
                          <span>{imei}</span>
                          <span className="inline-flex items-center px-1.5 py-0.2 text-[8.5px] font-extrabold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase">
                            In Stock
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Operations buttons */}
                <div className="pt-4 border-t border-slate-100 flex justify-between items-center gap-2 text-xs">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenProductDetailModal(p)}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold rounded-lg cursor-pointer flex items-center gap-1.5 transition-all active:scale-[0.98]"
                      title="Lihat Detail Produk & Galeri Foto"
                    >
                      <Eye className="h-3.5 w-3.5 text-emerald-600" />
                      Detail
                    </button>
                    {/* Public: print label */}
                    <button
                      onClick={() => handleOpenPrintLabelModal(p)}
                      className="px-3 py-1.5 bg-primary-50 hover:bg-primary-100 text-primary-700 border border-primary-200 font-bold rounded-lg cursor-pointer flex items-center gap-1.5 transition-all active:scale-[0.98]"
                      title="Cetak Label QR Code untuk scan cepat di POS"
                    >
                      <QrCode className="h-3.5 w-3.5" />
                      Cetak Label QR
                    </button>

                    {/* Price History / Trend Button */}
                    <button
                      onClick={() => setSelectedPriceHistoryProduct(p)}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold rounded-lg cursor-pointer flex items-center gap-1.5 transition-all active:scale-[0.98]"
                      title="Lihat grafik histori perubahan harga jual & tren pasar"
                    >
                      <TrendingUp className="h-3.5 w-3.5 text-indigo-600" />
                      Tren Harga
                    </button>
                  </div>

                  {/* Private: Edit / Delete for Admin/Manager */}
                  {userRole !== "CASHIER" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenMutationModal(p)}
                        className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 font-bold rounded-lg cursor-pointer transition-all active:scale-[0.98]"
                        title="Mutasi Stok Cabang"
                      >
                        <ArrowRightLeft className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(p)}
                        className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 font-bold rounded-lg cursor-pointer transition-all active:scale-[0.98]"
                      >
                        Ubah Stok
                      </button>
                      <Tooltip text="Hapus Produk" position="top">
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="p-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-lg cursor-pointer transition-all active:scale-[0.98]"
                          title="Hapus Produk"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </Tooltip>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          </div>

          {/* Pagination Controls Footer for Grid View */}
          <div className="px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <span>Tampilkan</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1 font-semibold text-xs focus:ring-2 focus:ring-indigo-500"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>produk per halaman</span>
            </div>

            <div className="font-medium text-slate-500 dark:text-slate-400">
              Menampilkan <strong className="text-slate-800 dark:text-slate-200">{totalItems === 0 ? 0 : startIndex + 1}</strong> - <strong className="text-slate-800 dark:text-slate-200">{endIndex}</strong> dari <strong className="text-slate-800 dark:text-slate-200">{totalItems}</strong> produk
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-600 transition"
                title="Halaman Pertama"
              >
                «
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-600 transition"
              >
                ‹
              </button>
              <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg font-extrabold">
                Hal {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-2.5 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-600 transition"
              >
                ›
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-600 transition"
                title="Halaman Terakhir"
              >
                »
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Inventory Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl p-6 overflow-y-auto max-h-[90vh] space-y-6 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="text-md font-bold text-slate-800">
                {isEditMode ? "Ubah Informasi Stok Smartphone" : "Tambah Inventaris Smartphone Baru"}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm bg-slate-50 border border-slate-200 p-2 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Field 1: Name */}
                <div className="space-y-1.5 col-span-1 sm:col-span-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Nama Lengkap Produk</label>
                    <button
                      type="button"
                      onClick={handleAiAutoFillSpecs}
                      disabled={isFillingSpecs}
                      className="px-2.5 py-1 bg-primary-50 hover:bg-primary-100 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400 dark:hover:bg-primary-950 text-[10px] font-bold rounded-lg border border-primary-100 dark:border-primary-900/50 flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className={`h-3 w-3 ${isFillingSpecs ? "animate-spin" : ""}`} />
                      <span>{isFillingSpecs ? "Mengisi..." : "Auto-Fill Spesifikasi (AI)"}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none"
                    placeholder="Contoh: iPhone 15 Pro Max 256GB Black Titanium"
                  />
                </div>

                {/* SKU Field with Auto-Generate Button & Customizer */}
                <div className="space-y-1.5 col-span-1 sm:col-span-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">SKU Produk / Kode Unik Stok</label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setSkuGenPrefill({
                            category,
                            brand,
                            model,
                            color,
                            type,
                            condition
                          });
                          setShowSkuGeneratorModal(true);
                        }}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 text-[10px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition-all cursor-pointer"
                        title="Buka Wizard Generator SKU Lengkap"
                      >
                        <Wand2 className="h-3 w-3 text-amber-500" />
                        <span>Kustomisasi SKU</span>
                      </button>
                      <button
                        type="button"
                        onClick={generateAutoSku}
                        className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-950 text-[10px] font-extrabold rounded-lg border border-amber-200 dark:border-amber-800 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95"
                        title="Buat SKU unik otomatis berdasarkan Kategori, Brand, Model, dan Kapasitas Memori"
                      >
                        <Sparkles className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                        <span>Auto-Generate SKU</span>
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setSku(val);
                      if (products.some(p => p.id !== editingProductId && ((p.sku && p.sku.toUpperCase() === val) || p.id.toUpperCase() === val))) {
                        setSkuError("⚠️ Warning: SKU ini sudah terdaftar pada produk lain!");
                      } else {
                        setSkuError(null);
                      }
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-white focus:bg-white focus:outline-none font-mono font-bold uppercase tracking-wide"
                    placeholder="Contoh: APL-IPH15PM-256G-8921"
                  />
                  {skuSuccessMsg && (
                    <p className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-fadeIn">
                      <CheckCircle className="h-3 w-3 shrink-0" />
                      <span>{skuSuccessMsg}</span>
                    </p>
                  )}
                  {skuError && (
                    <p className="text-[10px] font-extrabold text-rose-600 dark:text-rose-400 flex items-center gap-1 animate-fadeIn">
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                      <span>{skuError}</span>
                    </p>
                  )}
                </div>

                {/* Field 2: Brand */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Brand / Pabrikan</label>
                  <input
                    type="text"
                    required
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none"
                    placeholder="Contoh: Apple, Samsung, Xiaomi"
                  />
                </div>

                {/* Field 3: Model */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Model Perangkat</label>
                  <input
                    type="text"
                    required
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none"
                    placeholder="Contoh: iPhone 15 Pro Max"
                  />
                </div>

                {/* Field 3b: Warna / Color */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Warna / Color</label>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none"
                    placeholder="Contoh: Titanium Gray, Midnight, Space Black"
                  />
                </div>

                {/* Field 4: Type (Baru / Bekas) */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tipe Kondisi</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setType("BARU")}
                      className={`py-2 px-3 border rounded-xl text-xs font-bold cursor-pointer ${type === "BARU" ? "bg-primary-600 border-primary-600 text-white" : "bg-slate-50 border-slate-200 text-slate-600"}`}
                    >
                      Baru
                    </button>
                    <button
                      type="button"
                      onClick={() => setType("BEKAS")}
                      className={`py-2 px-3 border rounded-xl text-xs font-bold cursor-pointer ${type === "BEKAS" ? "bg-emerald-600 border-emerald-600 text-white" : "bg-slate-50 border-slate-200 text-slate-600"}`}
                    >
                      Bekas (Buyback)
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Kategori Produk</label>
                  <select
                    value={category}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCategory(val);
                      if (val === "Smartphone Bekas") {
                        setType("BEKAS");
                      } else if (val === "Smartphone Baru") {
                        setType("BARU");
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none cursor-pointer font-medium"
                  >
                    <option value="Smartphone Baru">📱 Smartphone Baru</option>
                    <option value="Smartphone Bekas">📱 Smartphone Bekas</option>
                    <option value="Aksesori">🎧 Aksesori</option>
                    <option value="Sparepart">🛠️ Sparepart</option>
                    <option value="Tablet">📱 Tablet</option>
                    <option value="Lainnya">📦 Lainnya / Umum</option>
                  </select>
                </div>

                {type === "BEKAS" && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Grade Kondisi Fisik</label>
                    <select
                      value={condition}
                      onChange={(e) => setCondition(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white"
                    >
                      <option value="A">Grade A (Sempurna / Mulus 98%)</option>
                      <option value="B">Grade B (Normal / Lecet Halus)</option>
                      <option value="C">Grade C (Ada Jamur / Lecet Sedang)</option>
                      <option value="D">Grade D (Fungsi Minus / Lecet Parah)</option>
                    </select>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Harga Beli Supplier (HPP)</label>
                  <input
                    type="text"
                    required
                    value={priceBuy || priceBuy === 0 || priceBuy === "0" ? Number(priceBuy).toLocaleString("id-ID") : ""}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      setPriceBuy(val);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none"
                    placeholder="Harga Pokok Pembelian"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Harga Jual Konsumen</label>
                  <input
                    type="text"
                    required
                    value={priceSell || priceSell === 0 || priceSell === "0" ? Number(priceSell).toLocaleString("id-ID") : ""}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      setPriceSell(val);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none"
                    placeholder="Harga Eceran Retail"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Batas Alarm Stok Rendah</label>
                  <input
                    type="number"
                    required
                    value={minStockAlert}
                    onChange={(e) => setMinStockAlert(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Supplier</label>
                  <select
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white"
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* Multi-Photo Gallery Grid */}
                <div className="sm:col-span-2">
                  {renderPhotoGalleryGrid()}
                </div>
              </div>

              {/* Specifications Area */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Spesifikasi Tambahan</label>
                <textarea
                  value={specifications}
                  onChange={(e) => setSpecifications(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 h-20 focus:outline-none focus:bg-white"
                  placeholder="Detail chipset, baterai, layar, kelengkapan..."
                />
              </div>

              {/* BULK IMEI SERIAL ENTRY AREA (SUPER POWERFUL IN CELLULAR RETAILS!) */}
              <div className="space-y-1.5 bg-primary-50/50 border border-primary-100 p-4 rounded-xl">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-3">
                    <label className="text-[11px] font-bold text-primary-600 uppercase tracking-wider block">Input Nomor IMEI Massal (Bulk)</label>
                    <button
                      type="button"
                      onClick={() => {
                        setScannerTargetMode("BULK_IMEI");
                        setIsScannerOpen(true);
                      }}
                      className="px-2.5 py-1 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                    >
                      <Camera className="h-3 w-3" />
                      Scan Kamera
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Stok Bertambah sesuai total IMEI</span>
                </div>
                <textarea
                  required
                  value={bulkImeiInput}
                  onChange={(e) => setBulkImeiInput(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-mono h-28 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="Masukkan IMEI satu per satu. Pisahkan dengan ENTER atau KOMA.&#10;Contoh:&#10;352147108924351&#10;352147108924352&#10;352147108924353"
                />

                {/* Real-time IMEI Validation Widget */}
                {(() => {
                  const currentImeis = bulkImeiInput
                    .split(/[\n,]+/)
                    .map(i => i.trim())
                    .filter(i => i.length > 0);

                  const invalidImeis = currentImeis.filter(i => !isValidIMEI(i));
                  const selfDuplicates = currentImeis.filter((imei, idx) => currentImeis.indexOf(imei) !== idx);
                  const dbDuplicates: { imei: string; productName: string }[] = [];
                  currentImeis.forEach(imei => {
                    const dup = products.find(p => (!isEditMode || p.id !== editingProductId) && p.imeis.includes(imei));
                    if (dup && !dbDuplicates.some(d => d.imei === imei)) {
                      dbDuplicates.push({ imei, productName: dup.name });
                    }
                  });

                  if (currentImeis.length === 0) return null;

                  const hasError = invalidImeis.length > 0 || selfDuplicates.length > 0 || dbDuplicates.length > 0;

                  return (
                    <div className="mt-2 p-3 rounded-xl border text-xs space-y-1.5 transition-all bg-white border-slate-200 shadow-xs">
                      <div className="flex justify-between items-center text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        <span>Analisis Validasi IMEI (Luhn Checksum & Keunikan)</span>
                        <span>Total: {currentImeis.length} Unit</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          {currentImeis.length - invalidImeis.length - Array.from(new Set(selfDuplicates)).length} Unik & Valid
                        </div>
                        {hasError ? (
                          <div className="flex items-center gap-1.5 text-red-600 font-bold animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-red-500"></span>
                            Masalah Terdeteksi
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-primary-600 font-bold">
                            <span className="w-2 h-2 rounded-full bg-primary-500"></span>
                            Semua Lolos Verifikasi
                          </div>
                        )}
                      </div>
                      
                      {/* Format/Luhn errors */}
                      {invalidImeis.length > 0 && (
                        <div className="pt-1.5 border-t border-slate-100 text-[11px] text-red-500 font-semibold space-y-1">
                          <p className="font-extrabold text-[10px] uppercase tracking-wider text-red-400">IMEI Tidak Valid (Mohon Diperbaiki):</p>
                          <div className="bg-red-50/50 p-2 rounded-lg border border-red-100 max-h-24 overflow-y-auto font-mono text-[10px] divide-y divide-red-50">
                            {invalidImeis.map((imei, idx) => (
                              <div key={idx} className="py-1 flex justify-between items-center">
                                <span>{imei}</span>
                                <span className="text-[8px] bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded tracking-wider uppercase">
                                  {!/^\d{15}$/.test(imei) ? "Bukan 15 Digit" : "Luhn Check Gagal"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Self duplicate warning */}
                      {selfDuplicates.length > 0 && (
                        <div className="pt-1.5 border-t border-slate-100 text-[11px] text-amber-600 font-semibold space-y-1">
                          <p className="font-extrabold text-[10px] uppercase tracking-wider text-amber-500 flex items-center gap-1">
                            <AlertTriangle className="h-3.5 w-3.5" /> Duplikasi Internal (Input Ganda):
                          </p>
                          <div className="bg-amber-50/50 p-2 rounded-lg border border-amber-100 max-h-24 overflow-y-auto font-mono text-[10px] divide-y divide-amber-50 text-amber-700">
                            {Array.from(new Set(selfDuplicates)).map((imei, idx) => (
                              <div key={idx} className="py-1 flex justify-between items-center">
                                <span>{imei}</span>
                                <span className="text-[8px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded tracking-wider uppercase">
                                  Duplikat di Input
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* DB duplicate warning */}
                      {dbDuplicates.length > 0 && (
                        <div className="pt-1.5 border-t border-slate-100 text-[11px] text-red-600 font-semibold space-y-1">
                          <p className="font-extrabold text-[10px] uppercase tracking-wider text-red-500 flex items-center gap-1">
                            <AlertOctagon className="h-3.5 w-3.5" /> Duplikasi Database (Sudah Terdaftar):
                          </p>
                          <div className="bg-red-50/50 p-2 rounded-lg border border-red-100 max-h-24 overflow-y-auto font-mono text-[10px] divide-y divide-red-50 text-red-700">
                            {dbDuplicates.map((dup, idx) => (
                              <div key={idx} className="py-1 flex flex-col sm:flex-row sm:justify-between sm:items-center">
                                <span className="font-bold">{dup.imei}</span>
                                <span className="text-[9px] text-red-500 italic mt-0.5 sm:mt-0">
                                  Milik produk: {dup.productName}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                <span className="text-[10px] text-slate-400 block mt-1.5">Sistem akan otomatis merekonsiliasi IMEI ini dan menyesuaikan total unit persediaan di gudang.</span>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 text-xs">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-lg font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-extrabold rounded-lg cursor-pointer shadow-md shadow-primary-600/10"
                >
                  Simpan Stok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      
      
      {/* Stok Opname Modal */}
      {showOpnameModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-4xl p-6 shadow-xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 shrink-0">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-indigo-500" />
                Stok Opname (Pencocokan Fisik)
              </h2>
              <button onClick={() => setShowOpnameModal(false)} className="text-slate-400 hover:text-red-500 cursor-pointer p-1">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto min-h-[300px] py-4">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <th className="py-3 px-4 font-bold">Produk</th>
                    <th className="py-3 px-4 font-bold text-center">Stok Sistem</th>
                    <th className="py-3 px-4 font-bold text-center">Stok Fisik</th>
                    <th className="py-3 px-4 font-bold text-center">Selisih</th>
                    <th className="py-3 px-4 font-bold">Keterangan / IMEI Hilang</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {opnameItems.map((item) => (
                    <tr key={item.productId} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-medium text-slate-800">{item.productName}</td>
                      <td className="py-3 px-4 text-center font-mono">{item.systemStock}</td>
                      <td className="py-3 px-4 text-center">
                        <input
                          type="number"
                          min="0"
                          value={item.physicalStock}
                          onChange={(e) => handleOpnameChange(item.productId, "physicalStock", parseInt(e.target.value) || 0)}
                          className="w-20 border border-slate-200 rounded p-1 text-center font-mono focus:border-indigo-500"
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={"font-bold " + (item.shrinkage > 0 ? "text-red-500" : item.shrinkage < 0 ? "text-primary-500" : "text-emerald-500")}>
                          {item.shrinkage > 0 ? `-${item.shrinkage}` : item.shrinkage === 0 ? "0" : `+${Math.abs(item.shrinkage)}`}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {item.shrinkage > 0 ? (
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-red-500">Barang hilang/kurang. Sebutkan IMEI yang tidak ada:</span>
                            <input
                              type="text"
                              placeholder="Pisahkan dengan koma"
                              className="border border-slate-200 rounded px-2 py-1 text-xs w-full"
                              onChange={(e) => handleOpnameChange(item.productId, "missingImeis", e.target.value.split(',').map(s=>s.trim()))}
                            />
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400">Sesuai / Lebih</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-between items-center gap-3 shrink-0">
              <button
                onClick={() => handleGenerateMonthlyOpnamePDF(opnameReportMonth)}
                className="px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-all border border-emerald-200"
              >
                <FileText className="h-4 w-4 text-emerald-600" />
                Cetak Laporan PDF Opname
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowOpnameModal(false)}
                  className="px-4 py-2 font-bold text-slate-500 hover:text-slate-700 cursor-pointer text-xs"
                >
                  Batal
                </button>
                <button
                  onClick={handleSubmitOpname}
                  disabled={isSubmittingOpname}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Simpan & Sesuaikan Stok
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Stock Opname PDF Report Modal */}
      {showMonthlyOpnamePdfModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-2xl p-6 shadow-2xl space-y-5 border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-start pb-4 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-100 dark:border-indigo-900">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Laporan Stok Opname & Valuasi Bulanan
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Ekspor otomatis laporan rekapitulasi audit fisik, selisih stok, dan nilai aset inventaris ke PDF
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowMonthlyOpnamePdfModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Selector & Options */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-indigo-600" />
                  Pilih Periode Bulan & Tahun Audit
                </label>
                <input
                  type="month"
                  value={opnameReportMonth}
                  onChange={(e) => setOpnameReportMonth(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
                />
              </div>

              {/* Quick Summary Cards Preview */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-2xl">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Total Nilai Modal Inventaris</span>
                  <p className="text-base font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
                    Rp {products.reduce((acc, p) => acc + ((p.priceBuy || 0) * (p.stock || 0)), 0).toLocaleString("id-ID")}
                  </p>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    {products.length} SKU ({products.reduce((acc, p) => acc + (p.stock || 0), 0)} Unit Stock)
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-2xl">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Potensi Omzet Penjualan</span>
                  <p className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                    Rp {products.reduce((acc, p) => acc + ((p.priceSell || 0) * (p.stock || 0)), 0).toLocaleString("id-ID")}
                  </p>
                  <span className="text-[10px] text-emerald-600/80 font-bold mt-0.5 block">
                    Marjin: Rp {products.reduce((acc, p) => acc + (((p.priceSell || 0) - (p.priceBuy || 0)) * (p.stock || 0)), 0).toLocaleString("id-ID")}
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-2xl text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <p>
                  Laporan PDF yang dihasilkan mencakup header resmi outlet, ringkasan eksekutif valuasi modal, analisis selisih unit fisik vs sistem, serta blok pengesahan tanda tangan manajer & petugas gudang.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
              <button
                onClick={() => setShowMonthlyOpnamePdfModal(false)}
                className="px-4 py-2.5 font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-xs cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  handleGenerateMonthlyOpnamePDF(opnameReportMonth);
                  setShowMonthlyOpnamePdfModal(false);
                }}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-2 active:scale-95 transition-all"
              >
                <Download className="h-4 w-4" />
                Download PDF Laporan Opname
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mutasi Modal */}
      {showMutationModal && mutationProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-xl p-6 shadow-xl space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5 text-amber-500" />
                Pemindahan Stok (Mutasi)
              </h2>
              <button onClick={() => setShowMutationModal(false)} className="text-slate-400 hover:text-red-500 cursor-pointer p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center">
              <div>
                <p className="font-bold text-slate-800 text-sm">{mutationProduct.name}</p>
                <p className="text-xs text-slate-500 mt-1">Stok saat ini: {mutationProduct.stock} unit (di {mutationProduct.location || "Toko Utama"})</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Pilih IMEI yang Dipindahkan</label>
                <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-xl p-2 flex flex-wrap gap-2">
                  {mutationProduct.imeis.map(imei => {
                    const isSelected = mutationImeis.includes(imei);
                    return (
                      <button
                        key={imei}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setMutationImeis(prev => prev.filter(i => i !== imei));
                          } else {
                            setMutationImeis(prev => [...prev, imei]);
                          }
                        }}
                        className={"px-2 py-1 text-[10px] font-mono border rounded cursor-pointer transition-colors " + (isSelected ? "bg-amber-100 border-amber-400 text-amber-800 font-bold" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50")}
                      >
                        {imei}
                      </button>
                    )
                  })}
                  {mutationProduct.imeis.length === 0 && <span className="text-xs text-slate-400 p-2">Tidak ada IMEI tersedia</span>}
                </div>
                <p className="text-[10px] text-amber-600 font-bold">Terpilih: {mutationImeis.length} unit</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Lokasi Tujuan / Cabang</label>
                <select
                  value={mutationTargetLocation}
                  onChange={e => setMutationTargetLocation(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
                >
                  <option value="Toko Utama">Toko Utama</option>
                  <option value="Cabang Sudirman">Cabang Sudirman</option>
                  <option value="Gudang A">Gudang A</option>
                  <option value="Servis Center">Servis Center</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Catatan Mutasi (Opsional)</label>
                <input
                  type="text"
                  value={mutationNotes}
                  onChange={e => setMutationNotes(e.target.value)}
                  placeholder="Misal: Permintaan restock cabang"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setShowMutationModal(false)}
                className="px-4 py-2 font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleSubmitMutation}
                disabled={mutationImeis.length === 0}
                className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                Proses Mutasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-xl space-y-6 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 shrink-0">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <History className="h-5 w-5 text-primary-500" />
                Lacak Riwayat Pergerakan IMEI
              </h2>
              <button onClick={() => setShowHistoryModal(false)} className="text-slate-400 hover:text-red-500 cursor-pointer p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="shrink-0 flex gap-2">
              <input 
                type="text" 
                placeholder="Masukkan / Scan 15-digit IMEI..." 
                value={historyImei}
                onChange={e => setHistoryImei(e.target.value)}
                className="flex-1 border border-slate-200 rounded-xl px-4 py-2 font-mono text-sm focus:outline-none focus:border-primary-500"
                onKeyDown={e => e.key === "Enter" && handleTrackImei(historyImei)}
              />
              <button 
                onClick={() => handleTrackImei(historyImei)}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-sm cursor-pointer"
              >
                Cari Histori
              </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-[300px] border border-slate-100 rounded-xl p-4 bg-slate-50">
              {isHistoryLoading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                </div>
              ) : historyData ? (
                <div className="space-y-6">
                  {/* Device Header Detail View */}
                  <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Detail Perangkat & IMEI</p>
                          <span className={"text-[10px] font-extrabold px-2 py-0.5 rounded-full border uppercase tracking-wider " + (
                            historyData.currentStatus === "In Stock" || historyData.currentStatus === "Tersedia"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                              : historyData.currentStatus === "Terjual"
                              ? "bg-slate-100 text-slate-700 border-slate-300"
                              : historyData.currentStatus === "In Repair"
                              ? "bg-amber-100 text-amber-800 border-amber-300"
                              : "bg-indigo-100 text-indigo-800 border-indigo-300"
                          )}>
                            {historyData.currentStatus}
                          </span>
                        </div>
                        <p className="font-mono font-bold text-slate-900 text-xl mt-1 tracking-tight flex items-center gap-2">
                          <Smartphone className="h-5 w-5 text-indigo-600" />
                          {historyData.imei}
                        </p>
                      </div>
                      <div className="text-left md:text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lokasi Unit Saat Ini</p>
                        <div className="mt-1 flex items-center md:justify-end gap-1.5 text-xs font-extrabold text-slate-700">
                          <MapPin className="h-4 w-4 text-rose-500" />
                          {historyData.currentLocation}
                        </div>
                      </div>
                    </div>

                    {/* Product Specs Card */}
                    {historyData.productInfo ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1 text-xs">
                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                          <p className="text-[10px] text-slate-400 font-medium">Nama Produk</p>
                          <p className="font-bold text-slate-800 mt-0.5 truncate">{historyData.productInfo.name}</p>
                        </div>
                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                          <p className="text-[10px] text-slate-400 font-medium">Brand & Model</p>
                          <p className="font-bold text-slate-800 mt-0.5">{historyData.productInfo.brand} {historyData.productInfo.model}</p>
                        </div>
                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                          <p className="text-[10px] text-slate-400 font-medium">Harga Modal (HPP)</p>
                          <p className="font-bold text-emerald-700 mt-0.5">Rp {(historyData.productInfo.priceBuy || 0).toLocaleString("id-ID")}</p>
                        </div>
                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                          <p className="text-[10px] text-slate-400 font-medium">Supplier & Pembelian</p>
                          <p className="font-bold text-slate-800 mt-0.5 truncate">{historyData.productInfo.supplier}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">Data spesifikasi produk primer tidak tertaut langsung.</p>
                    )}
                  </div>

                  {/* Chronological Timeline */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <History className="h-4 w-4 text-indigo-600" />
                      Timeline Kronologis Perjalanan Perangkat
                    </h3>

                    <div className="relative pl-6 space-y-6 before:absolute before:inset-0 before:ml-8 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-indigo-500 before:via-emerald-400 before:to-amber-500">
                      {historyData.history.length === 0 ? (
                        <p className="text-center text-slate-500 font-medium py-8 relative z-10 bg-slate-50">Belum ada riwayat pergerakan terdaftar untuk IMEI ini.</p>
                      ) : (
                        historyData.history.map((event: any, idx: number) => {
                          const isOut = event.type === 'OUT_SALE';
                          const isMutation = event.type === 'MUTATION';
                          const isRepair = event.type === 'REPAIR_SERVICE';
                          
                          return (
                            <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                              <div className={"flex items-center justify-center w-8 h-8 rounded-full border-4 border-slate-50 text-white shadow-md shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 absolute left-0 md:left-1/2 -ml-4 md:ml-0 " + (
                                isOut ? 'bg-purple-600' : isRepair ? 'bg-amber-500' : isMutation ? 'bg-blue-500' : 'bg-emerald-500'
                              )}>
                                {isOut ? <Smartphone className="h-3.5 w-3.5" /> : isRepair ? <AlertTriangle className="h-3.5 w-3.5" /> : isMutation ? <ArrowRightLeft className="h-3.5 w-3.5" /> : <Boxes className="h-3.5 w-3.5" />}
                              </div>
                              
                              <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] p-4 rounded-2xl border border-slate-200 bg-white shadow-xs ml-auto md:ml-0">
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className={"text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border " + (
                                    isOut ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                    isRepair ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                    isMutation ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                    'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  )}>
                                    {isOut ? 'PENJUALAN (SALES)' : isRepair ? 'SERVIS & PERBAIKAN' : isMutation ? 'MUTASI STOK' : 'PENGADAAN / MASUK'}
                                  </span>
                                  <time className="text-[10px] font-mono font-bold text-slate-400">
                                    {new Date(event.date).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}
                                  </time>
                                </div>
                                <p className="text-xs font-semibold text-slate-800 mt-1">{event.description}</p>
                                <div className="mt-2 text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                                  <MapPin className="h-3 w-3 text-rose-500" /> Lokasi Event: <span className="font-bold text-slate-700">{event.location}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <History className="h-12 w-12 mb-3 opacity-20" />
                  <p className="text-sm">Masukkan nomor IMEI untuk melihat perjalanan hidup unit dari masuk hingga terjual.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Label & Interactive QR Generator Modal */}
      {showLabelModal && selectedLabelProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-2xl my-8">
            
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-100 dark:border-indigo-900">
                  <QrCode className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                    Generator & Label QR Code Produk
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {selectedLabelProduct.brand} • {selectedLabelProduct.name}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowLabelModal(false);
                  setSelectedLabelProduct(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold text-sm bg-slate-50 dark:bg-slate-700 p-2 rounded-xl cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              
              {/* Unit IMEI Selector */}
              <div>
                <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Nomor Seri / IMEI Unit HP
                </label>
                {selectedLabelProduct.imeis.length === 0 ? (
                  <p className="text-xs text-rose-600 font-semibold bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-xl border border-rose-200 dark:border-rose-800">
                    Tidak ada IMEI unit tersedia (Stok Habis). QR akan diproduksi dari ID SKU Produk ({selectedLabelProduct.id}).
                  </p>
                ) : (
                  <select
                    value={selectedLabelImei}
                    onChange={(e) => setSelectedLabelImei(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {selectedLabelProduct.imeis.map((imei) => (
                      <option key={imei} value={imei}>
                        IMEI: {imei}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Mode Barcode vs QR Code Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Tipe Label Barcode (JsBarcode)
                </label>
                <div className="grid grid-cols-3 gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => setLabelCodeMode("BARCODE")}
                    className={`py-1.5 px-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      labelCodeMode === "BARCODE"
                        ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    <Barcode className="h-3 w-3" />
                    <span>1D Barcode</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLabelCodeMode("QR")}
                    className={`py-1.5 px-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      labelCodeMode === "QR"
                        ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    <QrCode className="h-3 w-3" />
                    <span>2D QR Code</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLabelCodeMode("DUAL")}
                    className={`py-1.5 px-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      labelCodeMode === "DUAL"
                        ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>Dual (Ganda)</span>
                  </button>
                </div>
              </div>

              {/* QR Payload Type Selector (Only if QR is included) */}
              {(labelCodeMode === "QR" || labelCodeMode === "DUAL") && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Format Isi Payload QR Code
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setQrPayloadType("SUMMARY_TEXT")}
                      className={`py-1.5 px-2 rounded-lg transition-all cursor-pointer ${
                        qrPayloadType === "SUMMARY_TEXT"
                          ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
                          : "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      Detail Produk
                    </button>
                    <button
                      type="button"
                      onClick={() => setQrPayloadType("IMEI")}
                      className={`py-1.5 px-2 rounded-lg transition-all cursor-pointer ${
                        qrPayloadType === "IMEI"
                          ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
                          : "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      Hanya IMEI
                    </button>
                    <button
                      type="button"
                      onClick={() => setQrPayloadType("JSON_PAYLOAD")}
                      className={`py-1.5 px-2 rounded-lg transition-all cursor-pointer ${
                        qrPayloadType === "JSON_PAYLOAD"
                          ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
                          : "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      JSON Detail
                    </button>
                    <button
                      type="button"
                      onClick={() => setQrPayloadType("POS_LINK")}
                      className={`py-1.5 px-2 rounded-lg transition-all cursor-pointer ${
                        qrPayloadType === "POS_LINK"
                          ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
                          : "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      Tautan POS
                    </button>
                  </div>
                </div>
              )}

              {/* Size Selector for QR */}
              {(labelCodeMode === "QR" || labelCodeMode === "DUAL") && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Ukuran QR Preview
                  </span>
                  <div className="flex gap-2">
                    {[100, 140, 180].map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setQrSize(sz)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold cursor-pointer border ${
                          qrSize === sz
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        {sz === 100 ? "Kecil" : sz === 140 ? "Sedang" : "Besar"}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Thermal Label Display Box */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-center">
                  Label Thermal Preview (50x40mm Stiker Fisik)
                </span>
                
                <div 
                  id="thermal-label-print-area"
                  className="bg-white border-2 border-slate-300 dark:border-slate-600 p-4 rounded-2xl max-w-[280px] mx-auto text-slate-950 font-mono text-center shadow-lg space-y-2 select-none"
                >
                  <div className="border-b border-dashed border-slate-300 pb-1.5 space-y-0.5">
                    <span className="text-[9px] font-extrabold uppercase bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-sans tracking-wider block w-max mx-auto mb-1">
                      {selectedLabelProduct.brand} • {selectedLabelProduct.type}
                    </span>
                    <h4 className="text-[12px] font-black uppercase text-slate-900 leading-tight">
                      {selectedLabelProduct.name}
                    </h4>
                    <div className="flex items-center justify-center gap-1.5 text-[9px] font-sans font-bold text-slate-600 pt-0.5">
                      <span>Model: <strong className="text-slate-900">{selectedLabelProduct.model || selectedLabelProduct.name}</strong></span>
                      <span>•</span>
                      <span>Warna: <strong className="text-indigo-700">{selectedLabelProduct.color || "Standar"}</strong></span>
                    </div>
                  </div>

                  {/* 1D Barcode Rendering with JsBarcode */}
                  {(labelCodeMode === "BARCODE" || labelCodeMode === "DUAL") && (
                    <div className="py-1 flex flex-col justify-center items-center overflow-hidden">
                      <BarcodeSVG 
                        value={selectedLabelImei || selectedLabelProduct.id} 
                        format="CODE128"
                        width={1.6}
                        height={45}
                        fontSize={11}
                        displayValue={false}
                      />
                    </div>
                  )}

                  {/* 2D QR Code Rendering */}
                  {(labelCodeMode === "QR" || labelCodeMode === "DUAL") && (
                    <div className="py-1 flex justify-center items-center">
                      <QRCodeSVG 
                        value={getQrValue(selectedLabelProduct, selectedLabelImei)} 
                        size={labelCodeMode === "DUAL" ? 80 : qrSize} 
                        level="H"
                        includeMargin={true}
                      />
                    </div>
                  )}

                  {/* Hidden Canvas element for downloading PNG */}
                  <div className="hidden">
                    <QRCodeCanvas
                      ref={qrCanvasRef}
                      value={getQrValue(selectedLabelProduct, selectedLabelImei)}
                      size={300}
                      level="H"
                      includeMargin={true}
                    />
                  </div>

                  <div className="pt-2 border-t border-dashed border-slate-300 space-y-0.5">
                    <span className="text-[8px] text-slate-400 block uppercase font-sans font-bold">
                      SKU / BARCODE / IMEI
                    </span>
                    <span className="text-[10px] font-black text-slate-900 block font-mono tracking-tight">
                      {selectedLabelImei || selectedLabelProduct.id}
                    </span>
                    <span className="text-[11px] font-extrabold text-indigo-700 block font-sans mt-0.5">
                      Rp {(selectedLabelProduct?.priceSell ?? 0).toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Utility actions: Copy & Download */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleCopyQrPayload(getQrValue(selectedLabelProduct, selectedLabelImei))}
                  className="px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  {copiedQrPayload ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedQrPayload ? "Tersalin!" : "Salin Data QR"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadQrPng}
                  className="px-3 py-2 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Unduh PNG</span>
                </button>
              </div>

            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 text-xs pt-3 border-t border-slate-100 dark:border-slate-700">
              <button
                onClick={() => {
                  setShowLabelModal(false);
                  setSelectedLabelProduct(null);
                }}
                className="py-2.5 px-4 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-xl font-bold cursor-pointer transition-all"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={() => {
                  if (selectedLabelProduct) {
                    generateProductAdhesiveLabelsPDF([selectedLabelProduct], {
                      labelLayout: "THERMAL_ROLL",
                      codeType: labelCodeMode,
                      targetImei: selectedLabelImei || selectedLabelProduct.id,
                      shopTitle: "FonePOS",
                      includePrice: true
                    });
                  }
                }}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-600/20 transition-all"
              >
                <Download className="h-4 w-4" />
                Cetak PDF Label Thermal (50x40mm)
              </button>

              <button
                onClick={handlePrintLabel}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-600/20 transition-all"
              >
                <Printer className="h-4 w-4" />
                Print Langsung
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Barcode & QR Adhesive Label Generator Modal */}
      {showAdhesiveLabelModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-3xl w-full max-w-4xl p-6 space-y-5 shadow-2xl my-8 max-h-[92vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-4 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-100 dark:border-emerald-900">
                  <Barcode className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white">
                    Generator Stiker Label Barcode & QR Code Stok (PDF Print)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Cetak stiker barcode/QR presisi untuk ditempel pada unit smartphone/aksesoris untuk pemindaian instan di POS.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowAdhesiveLabelModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold text-sm bg-slate-50 dark:bg-slate-700 p-2 rounded-xl cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Options Configuration Form */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0 bg-slate-50 dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
              
              {/* Option 1: Paper Format */}
              <div className="space-y-1.5 col-span-2 md:col-span-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                  Format Ukuran Kertas Stiker:
                </label>
                <select
                  value={adhesiveLayout}
                  onChange={(e) => setAdhesiveLayout(e.target.value as any)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold text-slate-800 dark:text-white focus:outline-none"
                >
                  <option value="A4_3COL">A4 Sticker Sheet (3 Kolom • 24 Stiker/Lembar)</option>
                  <option value="A4_2COL">A4 Sticker Sheet (2 Kolom • 14 Stiker/Lembar)</option>
                  <option value="THERMAL_ROLL">Roll Stiker Thermal (50 x 40 mm)</option>
                </select>
              </div>

              {/* Option 2: Code Type */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                  Format Simbol Barcode / QR:
                </label>
                <select
                  value={adhesiveCodeType}
                  onChange={(e) => setAdhesiveCodeType(e.target.value as any)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold text-slate-800 dark:text-white focus:outline-none"
                >
                  <option value="DUAL">DUAL (1D Barcode + 2D QR Code)</option>
                  <option value="BARCODE">1D Barcode (Code128 Standard)</option>
                  <option value="QR">2D QR Code Standard</option>
                </select>
              </div>

              {/* Dimensions */}
              <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 block">Label W x H (mm):</label>
                  <div className="flex gap-1">
                    <input type="number" value={adhesiveLabelWidth} onChange={(e) => setAdhesiveLabelWidth(Number(e.target.value))} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-[10px] font-black text-slate-800 dark:text-white"/>
                    <input type="number" value={adhesiveLabelHeight} onChange={(e) => setAdhesiveLabelHeight(Number(e.target.value))} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-[10px] font-black text-slate-800 dark:text-white"/>
                  </div>
              </div>

              <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 block">Font / QR Size:</label>
                  <div className="flex gap-1">
                    <input type="number" title="Font Size" value={adhesiveFontSize} onChange={(e) => setAdhesiveFontSize(Number(e.target.value))} className="w-1/2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-[10px] font-black text-slate-800 dark:text-white"/>
                    <input type="number" title="QR Size" value={adhesiveQrSize} onChange={(e) => setAdhesiveQrSize(Number(e.target.value))} className="w-1/2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-[10px] font-black text-slate-800 dark:text-white"/>
                  </div>
              </div>

              {/* Copies Mode */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                  Jumlah Cetak Stiker per Item:
                </label>
                <select
                  value={adhesiveCopiesMode}
                  onChange={(e) => setAdhesiveCopiesMode(e.target.value as any)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold text-slate-800 dark:text-white focus:outline-none"
                >
                  <option value="PER_IMEI_STOCK">1 Stiker per Unit IMEI Aktif dalam Stok</option>
                  <option value="ONE_PER_PRODUCT">1 Stiker per Model SKU Produk</option>
                  <option value="CUSTOM">Jumlah Kustom per Produk</option>
                </select>
              </div>

              {/* Custom Quantity Input if selected */}
              {adhesiveCopiesMode === "CUSTOM" && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 block">
                    Jumlah Copy per Produk:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={adhesiveCustomCopies}
                    onChange={(e) => setAdhesiveCustomCopies(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs font-black text-slate-800 dark:text-white"
                  />
                </div>
              )}

              {/* Toggles */}
              <div className="flex flex-col gap-2 pt-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={adhesiveIncludePrice}
                    onChange={(e) => setAdhesiveIncludePrice(e.target.checked)}
                    className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                  />
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer">Harga</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={adhesiveAutoPrint}
                    onChange={(e) => setAdhesiveAutoPrint(e.target.checked)}
                    className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                  />
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer">Auto-Print</span>
                </label>
              </div>
            </div>

            {/* Filter Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 text-slate-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Cari produk / merk / IMEI untuk dicetak stiker..."
                  value={adhesiveSearchQuery}
                  onChange={(e) => setAdhesiveSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 dark:text-white outline-none"
                />
              </div>

              <select
                value={adhesiveCategoryFilter}
                onChange={(e) => setAdhesiveCategoryFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl px-3 py-2 text-slate-800 dark:text-white outline-none"
              >
                <option value="Semua">Semua Kategori</option>
                <option value="Smartphone">Smartphone</option>
                <option value="Aksesoris">Aksesoris</option>
                <option value="Sparepart">Sparepart</option>
              </select>
            </div>

            {/* Product Summary Preview */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              {(() => {
                const filteredList = products.filter(p => {
                  const matchesSearch = p.name.toLowerCase().includes(adhesiveSearchQuery.toLowerCase()) ||
                    p.brand.toLowerCase().includes(adhesiveSearchQuery.toLowerCase()) ||
                    p.imeis.some(i => i.includes(adhesiveSearchQuery));
                  const matchesCat = adhesiveCategoryFilter === "Semua" || (p.category || "Smartphone") === adhesiveCategoryFilter;
                  return matchesSearch && matchesCat;
                });

                let totalStickersCount = 0;
                filteredList.forEach(p => {
                  if (adhesiveCopiesMode === "PER_IMEI_STOCK") {
                    totalStickersCount += p.imeis && p.imeis.length > 0 ? p.imeis.length : 1;
                  } else if (adhesiveCopiesMode === "CUSTOM") {
                    totalStickersCount += adhesiveCustomCopies;
                  } else {
                    totalStickersCount += 1;
                  }
                });

                if (filteredList.length === 0) {
                  return (
                    <div className="py-12 text-center text-slate-400">
                      <Barcode className="h-10 w-10 mx-auto mb-2 opacity-30" />
                      <p className="text-xs font-bold">Tidak ada produk yang cocok dengan pencarian.</p>
                    </div>
                  );
                }

                return (
                  <div>
                    <div className="flex items-center justify-between pb-3 text-xs font-bold text-slate-600 dark:text-slate-300">
                      <span>Daftar Produk Terpilih: {filteredList.length} Produk</span>
                      <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-full font-black text-xs">
                        Siap Mencetak: {totalStickersCount} Stiker Label
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {filteredList.map((p) => {
                        const countForThisProd = adhesiveCopiesMode === "PER_IMEI_STOCK"
                          ? (p.imeis && p.imeis.length > 0 ? p.imeis.length : 1)
                          : adhesiveCopiesMode === "CUSTOM"
                          ? adhesiveCustomCopies
                          : 1;

                        const sampleCode = (p.imeis && p.imeis[0]) || p.id;

                        return (
                          <div
                            key={p.id}
                            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl space-y-2 flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-1.5 py-0.5 rounded">
                                  {p.brand}
                                </span>
                                <span className="text-[10px] font-bold text-slate-500">
                                  {countForThisProd} Stiker
                                </span>
                              </div>
                              <h5 className="text-xs font-bold text-slate-900 dark:text-white mt-1 line-clamp-1">
                                {p.name}
                              </h5>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                                Sample Code: {sampleCode}
                              </p>
                            </div>

                            <div className="border-t border-slate-100 dark:border-slate-700 pt-1.5 flex items-center justify-between text-xs">
                              <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                                Rp {(p.priceSell || 0).toLocaleString("id-ID")}
                              </span>
                              <span className="text-[9px] text-slate-400">
                                {p.type}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer Controls */}
            <div className="flex justify-between items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-700 shrink-0">
              <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
                Format PDF siap dicetak langsung ke Printer Stiker / Thermal Roll.
              </span>

              <div className="flex gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => setShowAdhesiveLabelModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  onClick={() => {
                    const filteredList = products.filter(p => {
                      const matchesSearch = p.name.toLowerCase().includes(adhesiveSearchQuery.toLowerCase()) ||
                        p.brand.toLowerCase().includes(adhesiveSearchQuery.toLowerCase()) ||
                        p.imeis.some(i => i.includes(adhesiveSearchQuery));
                      const matchesCat = adhesiveCategoryFilter === "Semua" || (p.category || "Smartphone") === adhesiveCategoryFilter;
                      return matchesSearch && matchesCat;
                    });

                    generateProductAdhesiveLabelsPDF(filteredList, {
                      labelLayout: adhesiveLayout,
                      codeType: adhesiveCodeType,
                      copiesMode: adhesiveCopiesMode,
                      customCopies: adhesiveCustomCopies,
                      includePrice: adhesiveIncludePrice,
                      shopTitle: "FonePOS",
                      labelWidth: adhesiveLabelWidth,
                      labelHeight: adhesiveLabelHeight,
                      fontSize: adhesiveFontSize,
                      barcodeWidth: adhesiveBarcodeWidth,
                      barcodeHeight: adhesiveBarcodeHeight,
                      qrSize: adhesiveQrSize,
                      autoPrint: adhesiveAutoPrint
                    });
                  }}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20"
                >
                  <Printer className="h-4 w-4" />
                  Generate PDF Label Stiker Sekarang
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Batch Catalog QR Code Sheet Modal */}
      {showBatchQrModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-3xl w-full max-w-4xl p-6 space-y-5 shadow-2xl my-8 max-h-[90vh] flex flex-col">
            
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-4 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-100 dark:border-indigo-900">
                  <Grid className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white">
                    Lembaran QR Code Katalog Stok (Batch Printing)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Cetak stiker QR code massal untuk ditempel di rak display toko atau kotak produk.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowBatchQrModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold text-sm bg-slate-50 dark:bg-slate-700 p-2 rounded-xl cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Controls bar */}
            <div className="flex flex-col sm:flex-row gap-3 shrink-0 no-print">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 text-slate-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Filter produk dalam lembaran..."
                  value={batchQrSearch}
                  onChange={(e) => setBatchQrSearch(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 dark:text-white outline-none"
                />
              </div>

              <select
                value={batchQrCategory}
                onChange={(e) => setBatchQrCategory(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl px-3 py-2 text-slate-800 dark:text-white outline-none"
              >
                <option value="Semua">Semua Kategori</option>
                <option value="Smartphone">Smartphone</option>
                <option value="Aksesoris">Aksesoris</option>
                <option value="Sparepart">Sparepart</option>
              </select>
            </div>

            {/* Printable Grid Sheet Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div 
                id="batch-qr-print-area"
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-slate-950 font-sans"
              >
                {(() => {
                  const filteredList = products.filter(p => {
                    const matchesSearch = p.name.toLowerCase().includes(batchQrSearch.toLowerCase()) ||
                      p.brand.toLowerCase().includes(batchQrSearch.toLowerCase()) ||
                      p.imeis.some(i => i.includes(batchQrSearch));
                    const matchesCat = batchQrCategory === "Semua" || (p.category || "Smartphone") === batchQrCategory;
                    return matchesSearch && matchesCat;
                  });

                  if (filteredList.length === 0) {
                    return (
                      <div className="col-span-full py-12 text-center text-slate-400">
                        <QrCode className="h-10 w-10 mx-auto mb-2 opacity-30" />
                        <p className="text-xs font-bold">Tidak ada produk ditemukan untuk cetak sheet QR.</p>
                      </div>
                    );
                  }

                  return filteredList.map((p) => {
                    const primaryKey = p.imeis[0] || p.id;
                    return (
                      <div 
                        key={p.id} 
                        className="border border-slate-300 p-3 rounded-xl text-center space-y-1.5 bg-white select-none flex flex-col justify-between"
                      >
                        <div>
                          <span className="text-[8px] font-black uppercase tracking-wider text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded block w-max mx-auto mb-1">
                            {p.brand}
                          </span>
                          <h5 className="text-[10px] font-extrabold uppercase text-slate-900 leading-tight line-clamp-2">
                            {p.name}
                          </h5>
                        </div>

                        <div className="py-1 flex justify-center items-center">
                          <QRCodeSVG 
                            value={primaryKey} 
                            size={80} 
                            level="M" 
                            includeMargin={false}
                          />
                        </div>

                        <div className="border-t border-dashed border-slate-200 pt-1">
                          <p className="text-[8px] font-mono text-slate-500 truncate">
                            {primaryKey}
                          </p>
                          <p className="text-[10px] font-black text-indigo-700">
                            Rp {(p?.priceSell ?? 0).toLocaleString("id-ID")}
                          </p>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            <div className="flex justify-between items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-700 shrink-0">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Format siap cetak untuk Kertas Stiker A4 / Label Rak
              </span>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowBatchQrModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20"
                >
                  <Printer className="h-4 w-4" />
                  Cetak Sheet QR Sekarang
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* CAMERA SCANNER MODAL */}
      {isScannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <Barcode className="h-4 w-4 text-primary-600" />
                <h3 className="font-extrabold text-slate-800 text-sm">
                  Scan Barcode / IMEI Kamera
                </h3>
              </div>
              <button
                onClick={() => setIsScannerOpen(false)}
                className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-3 overflow-y-auto">
              <div className="flex items-center justify-between bg-slate-100 p-2 rounded-xl text-xs">
                <span className="text-[11px] font-bold text-slate-600">Target Scanner:</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-primary-100 text-primary-800 uppercase tracking-wider">
                  {scannerTargetMode === "SEARCH" ? "🔍 Filter Stok Inventaris" : "📱 Input IMEI Massal"}
                </span>
              </div>

              <p className="text-[11px] text-slate-500 text-center">
                Arahkan kamera ke barcode SKU, EAN, atau 15-digit IMEI. Hasil scan akan diproses otomatis secara kontinyu.
              </p>

              {cameras.length > 1 && (
                <select
                  value={selectedCameraId}
                  onChange={(e) => setSelectedCameraId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none focus:border-primary-500 font-medium cursor-pointer"
                >
                  {cameras.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label || `Kamera ${c.id}`}
                    </option>
                  ))}
                </select>
              )}

              <div className="relative rounded-2xl overflow-hidden bg-slate-900 border-2 border-slate-200 shadow-inner">
                <div id="qr-reader-inventory" className="w-full h-60 object-cover"></div>
                {scannerFeedback && (
                  <div className="absolute inset-x-0 bottom-3 mx-3 p-2.5 bg-slate-900/90 backdrop-blur rounded-xl border border-slate-700 text-white text-[11px] font-bold text-center animate-fade-in shadow-xl">
                    {scannerFeedback}
                  </div>
                )}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-52 h-24 border-2 border-primary-400/60 rounded-xl pointer-events-none z-10">
                  <div className="absolute top-1/2 left-0 w-full h-[1.5px] bg-red-500/80 shadow-[0_0_10px_rgba(239,68,68,1)] animate-pulse"></div>
                </div>
              </div>

              {/* Manual Input Fallback inside Modal */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const input = form.elements.namedItem("manualCode") as HTMLInputElement;
                  if (input && input.value.trim()) {
                    handleCameraScanSuccess(input.value.trim());
                    input.value = "";
                  }
                }}
                className="flex gap-2 pt-1"
              >
                <input
                  name="manualCode"
                  type="text"
                  placeholder="Ketik / Tempel Kode Barcode / IMEI..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono focus:outline-none focus:bg-white focus:ring-1 focus:ring-primary-500"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Proses
                </button>
              </form>
            </div>
            
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => setIsScannerOpen(false)}
                className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-primary-600/10 transition-all"
              >
                Selesai & Tutup Scanner
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK BARCODE PRINTING MODAL */}
      {showBulkBarcodeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-3xl w-full max-w-4xl p-6 space-y-6 shadow-2xl my-8">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-100 dark:border-indigo-900">
                  <Barcode className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white">
                    Cetak Massal Barcode & Label Harga Produk
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Cetak stiker label harga & barcode scan POS untuk {getSelectedProducts().length > 0 ? getSelectedProducts().length : filtered.length} produk terpilih dalam satu halaman PDF.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowBulkBarcodeModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold text-sm bg-slate-100 dark:bg-slate-700 p-2 rounded-xl cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Config & Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700">
              
              {/* Option 1: Quantity Copies */}
              <div>
                <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                  Jumlah Cetak per Produk
                </label>
                <select
                  value={bulkCopiesOption}
                  onChange={(e) => setBulkCopiesOption(e.target.value as any)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white outline-none"
                >
                  <option value="per_stock">Sesuai Jumlah Stok (1 Label / Unit)</option>
                  <option value="fixed_1">1 Label per Produk</option>
                  <option value="fixed_2">2 Label per Produk</option>
                  <option value="fixed_3">3 Label per Produk</option>
                  <option value="fixed_5">5 Label per Produk</option>
                </select>
              </div>

              {/* Option 2: Format Layout */}
              <div>
                <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                  Format Layout Kertas / Printer
                </label>
                <select
                  value={bulkLayoutFormat}
                  onChange={(e) => setBulkLayoutFormat(e.target.value as any)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white outline-none"
                >
                  <option value="grid_a4">Grid Stiker Sheet A4 (3 Kolom x 7 Baris)</option>
                  <option value="thermal_roll">Roll Printer Thermal (58mm Label Stiker)</option>
                </select>
              </div>

              {/* Option 3: Elements Toggles */}
              <div>
                <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                  Elemen Label Harga
                </label>
                <div className="flex flex-wrap gap-2 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300 font-medium">
                    <input type="checkbox" checked={showStoreHeader} onChange={(e) => setShowStoreHeader(e.target.checked)} className="rounded" />
                    Nama Toko
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300 font-medium">
                    <input type="checkbox" checked={showProductPrice} onChange={(e) => setShowProductPrice(e.target.checked)} className="rounded" />
                    Harga Jual
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300 font-medium">
                    <input type="checkbox" checked={showBarcodeText} onChange={(e) => setShowBarcodeText(e.target.checked)} className="rounded" />
                    Teks Barcode
                  </label>
                </div>
              </div>

            </div>

            {/* Label Live Preview Area */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>Pratinjau Stiker Barcode ({getCalculatedLabelList().length} Label Dihasilkan)</span>
                <span className="text-[11px] font-semibold text-slate-500">
                  {bulkLayoutFormat === "grid_a4" ? "A4 Grid: 60mm x 36mm per label" : "Roll Stiker: 58mm x 40mm"}
                </span>
              </div>

              <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {getCalculatedLabelList().slice(0, 30).map((lbl, idx) => (
                    <div 
                      key={idx}
                      className="bg-white text-slate-900 border border-slate-300 rounded-xl p-3 shadow-xs flex flex-col items-center justify-between text-center min-h-[140px] relative overflow-hidden"
                    >
                      {showStoreHeader && (
                        <div className="text-[9px] font-black tracking-wider text-slate-700 uppercase border-b border-slate-100 pb-0.5 w-full">
                          {currentUser?.storeName || "SMARTPHONE POS & INVENTORY"}
                        </div>
                      )}

                      <div className="mt-1">
                        <div className="text-[11px] font-black text-slate-900 leading-tight">
                          {lbl.product.brand} {lbl.product.name}
                        </div>
                        <div className="text-[9px] font-semibold text-slate-500 mt-0.5">
                          {lbl.product.category || "Smartphone"} • {lbl.product.type === "BARU" ? "BNIB" : `Bekas ${lbl.product.condition}`}
                        </div>
                      </div>

                      {showProductPrice && (
                        <div className="text-sm font-black text-emerald-600 my-1">
                          Rp {(lbl.product.priceSell || 0).toLocaleString("id-ID")}
                        </div>
                      )}

                      <div className="my-1 w-full flex justify-center">
                        <img 
                          src={generateCode128DataUrl(lbl.code, 200, 45)} 
                          alt="Barcode" 
                          className="h-8 max-w-full object-contain"
                        />
                      </div>

                      {showBarcodeText && (
                        <div className="text-[9px] font-mono font-bold text-slate-700">
                          {lbl.code}
                        </div>
                      )}
                    </div>
                  ))}
                  {getCalculatedLabelList().length > 30 && (
                    <div className="col-span-full text-center py-2 text-xs font-semibold text-slate-500">
                      ... dan {getCalculatedLabelList().length - 30} label lainnya yang akan disertakan dalam file PDF / cetakan.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setShowBulkBarcodeModal(false)}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs cursor-pointer"
              >
                Tutup / Batal
              </button>

              <div className="flex w-full sm:w-auto gap-2">
                <button
                  type="button"
                  onClick={handlePrintBulkBarcodeDirect}
                  className="flex-1 sm:flex-initial px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all shadow-md"
                >
                  <Printer className="h-4 w-4 text-amber-400" />
                  Cetak Langsung
                </button>

                <button
                  type="button"
                  onClick={handleDownloadBulkBarcodePDF}
                  className="flex-1 sm:flex-initial px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all shadow-md shadow-indigo-600/20"
                >
                  <Download className="h-4 w-4" />
                  Unduh PDF Barcode Massal
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* PRICE TREND & HISTORY MODAL */}
      {selectedPriceHistoryProduct && (
        <PriceHistoryModal
          product={selectedPriceHistoryProduct}
          onClose={() => setSelectedPriceHistoryProduct(null)}
        />
      )}

      {showImportValidationModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4">
            <h3 className="font-bold text-lg">Konfirmasi Impor Produk</h3>
            <p className="text-sm">Anda akan mengimpor {pendingImportProducts.length} produk baru.</p>
            <div className="flex gap-2">
              <button className="flex-1 py-2 bg-zinc-100 rounded-lg text-sm" onClick={() => setShowImportValidationModal(false)}>Batal</button>
              <button 
                className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-sm"
                onClick={() => {
                  apiFetch("/api/products/bulk", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ products: pendingImportProducts })
                  })
                  .then(res => res.json())
                  .then(data => {
                    if (data.success) {
                      alert(`Berhasil mengimpor ${data.count} produk!`);
                      onProductsChange();
                      setShowImportValidationModal(false);
                    } else {
                      alert("Gagal mengimpor produk: " + data.message);
                    }
                  });
                }}
              >
                Konfirmasi Impor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS PRODUK INVENTARIS */}
      {productToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 transform transition-all">
            {/* Modal Header Icon & Title */}
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-900/50">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                  Konfirmasi Hapus Produk
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Verifikasi keamanan sebelum menghapus data inventaris.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                disabled={isDeleting}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Product Summary Card */}
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shrink-0 relative">
                  <LazyProductImage
                    src={productToDelete.imageUrl}
                    alt={productToDelete.name}
                    category={productToDelete.category}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                    {productToDelete.name}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {productToDelete.brand} • {productToDelete.model}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2.5 border-t border-slate-200/80 dark:border-slate-700/80">
                <div>
                  <span className="text-slate-400 block text-[10px]">Kategori & Tipe:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    {productToDelete.category || "Smartphone"} ({productToDelete.type === "BARU" ? "Baru BNIB" : `Bekas ${productToDelete.condition}`})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Stok & Unit IMEI:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    {productToDelete.stock} Unit ({productToDelete.imeis?.length || 0} IMEI)
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Harga Beli (Modal):</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    Rp {(productToDelete.priceBuy || 0).toLocaleString("id-ID")}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Harga Jual:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    Rp {(productToDelete.priceSell || 0).toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
            </div>

            {/* Danger Warning Banner */}
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-2xl text-xs text-rose-800 dark:text-rose-300 space-y-1">
              <p className="font-extrabold flex items-center gap-1.5 text-rose-700 dark:text-rose-400">
                <span>⚠️</span> Peringatan Penghapusan Permanen
              </p>
              <p className="text-[11px] leading-relaxed text-rose-900 dark:text-rose-200 opacity-90">
                Apakah Anda yakin ingin menghapus produk ini dari katalog inventaris toko? Tindakan ini tidak dapat dibatalkan, dan seluruh nomor IMEI terkait akan dihapus dari stok aktif.
              </p>
            </div>

            {/* Modal Buttons */}
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                disabled={isDeleting}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl text-xs transition-all cursor-pointer text-center disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDeleteProduct}
                disabled={isDeleting}
                className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white font-bold rounded-2xl text-xs transition-all cursor-pointer shadow-md shadow-rose-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Menghapus...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Ya, Hapus Produk
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal Update Harga Massal */}
      {showBatchPriceModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-3xl w-full max-w-xl p-6 space-y-5 shadow-2xl my-8">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-100 dark:border-indigo-900">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                    Pembaruan Harga Massal (Batch Price Update)
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {selectedProductIds.length} produk terpilih dari daftar inventaris
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowBatchPriceModal(false)}
                disabled={isBatchUpdatingPrice}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold text-sm bg-slate-50 dark:bg-slate-700 p-2 rounded-xl cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Target Price */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Target Harga Yang Diubah
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPriceUpdateTarget("SELL")}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                      priceUpdateTarget === "SELL"
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-xs"
                        : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    Harga Jual Saja
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriceUpdateTarget("BUY")}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                      priceUpdateTarget === "BUY"
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-xs"
                        : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    Harga Beli (Modal)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriceUpdateTarget("BOTH")}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                      priceUpdateTarget === "BOTH"
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-xs"
                        : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    Keduanya (Jual & Beli)
                  </button>
                </div>
              </div>

              {/* Update Mode */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Metode Penyesuaian
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPriceUpdateMode("ADJUST_PERCENT");
                      setPriceUpdateValue("-5");
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                      priceUpdateMode === "ADJUST_PERCENT"
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-xs"
                        : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    Persentase (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPriceUpdateMode("ADJUST_NOMINAL");
                      setPriceUpdateValue("-100000");
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                      priceUpdateMode === "ADJUST_NOMINAL"
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-xs"
                        : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    Nominal (+/- Rp)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPriceUpdateMode("FIXED");
                      setPriceUpdateValue("15000000");
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                      priceUpdateMode === "FIXED"
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-xs"
                        : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    Harga Tetap Baru
                  </button>
                </div>
              </div>

              {/* Value Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  {priceUpdateMode === "ADJUST_PERCENT"
                    ? "Nilai Persentase (Gunakan '-' untuk diskon/penurunan, contoh: -5 atau 10)"
                    : priceUpdateMode === "ADJUST_NOMINAL"
                    ? "Nilai Penyesuaian Nominal (Gunakan '-' untuk penurunan, contoh: -100000 atau 200000)"
                    : "Nominal Harga Baru (Sama untuk semua produk terpilih)"}
                </label>
                <input
                  type="number"
                  value={priceUpdateValue}
                  onChange={(e) => setPriceUpdateValue(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder={priceUpdateMode === "ADJUST_PERCENT" ? "Contoh: -5" : priceUpdateMode === "ADJUST_NOMINAL" ? "Contoh: -100000" : "Contoh: 15000000"}
                />
              </div>

              {/* Reason Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Catatan / Alasan Perubahan Harga
                </label>
                <input
                  type="text"
                  value={priceUpdateReason}
                  onChange={(e) => setPriceUpdateReason(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Contoh: Diskon Flash Sale Akhir Bulan"
                />
              </div>

              {/* Live Preview List */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Simulasi / Preview Hasil Perubahan ({selectedProductIds.length} Produk)
                </label>
                <div className="max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 p-2 divide-y divide-slate-200 dark:divide-slate-800">
                  {products
                    .filter((p) => selectedProductIds.includes(p.id))
                    .map((p) => {
                      const numVal = Number(priceUpdateValue) || 0;
                      let estSell = p.priceSell;
                      if (priceUpdateTarget === "SELL" || priceUpdateTarget === "BOTH") {
                        if (priceUpdateMode === "FIXED") estSell = numVal;
                        else if (priceUpdateMode === "ADJUST_NOMINAL") estSell = Math.max(1000, p.priceSell + numVal);
                        else if (priceUpdateMode === "ADJUST_PERCENT") estSell = Math.max(1000, Math.round(p.priceSell * (1 + numVal / 100)));
                      }

                      return (
                        <div key={p.id} className="py-2 px-2 flex items-center justify-between text-[11px]">
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200 block">{p.brand} {p.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">Model: {p.model || p.name} • Stok: {p.stock}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-slate-400 line-through text-[10px] block">
                              Rp {p.priceSell.toLocaleString("id-ID")}
                            </span>
                            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-xs">
                              Rp {estSell.toLocaleString("id-ID")}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowBatchPriceModal(false)}
                disabled={isBatchUpdatingPrice}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-2xl text-xs transition-all cursor-pointer text-center disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleBatchUpdatePrices}
                disabled={isBatchUpdatingPrice}
                className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold rounded-2xl text-xs transition-all cursor-pointer shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isBatchUpdatingPrice ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Memproses Perubahan...
                  </>
                ) : (
                  <>
                    <DollarSign className="h-4 w-4" />
                    Terapkan Perubahan Harga Massal
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Hapus Produk Massal */}
      {showBatchDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="p-3 bg-rose-100 dark:bg-rose-950/60 rounded-2xl border border-rose-200 dark:border-rose-900">
                <AlertOctagon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Konfirmasi Hapus Produk Massal
                </h3>
                <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                  {selectedProductIds.length} produk terpilih akan dihapus
                </p>
              </div>
            </div>

            <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 p-3.5 rounded-2xl text-xs text-rose-800 dark:text-rose-300 leading-relaxed">
              ⚠️ <strong>Peringatan Penting:</strong> Tindakan ini akan menghapus <strong>{selectedProductIds.length} produk</strong> secara permanen beserta seluruh daftar IMEI yang melekat darinya.
            </div>

            {/* List of products to be deleted */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Daftar Produk Terpilih:
              </label>
              <div className="max-h-36 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-900 p-2 divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                {products
                  .filter((p) => selectedProductIds.includes(p.id))
                  .map((p) => (
                    <div key={p.id} className="py-1.5 px-2 flex items-center justify-between">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{p.brand} {p.name}</span>
                      <span className="text-[10px] font-mono text-slate-400">Stok: {p.stock}</span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowBatchDeleteModal(false)}
                disabled={isBatchDeleting}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-2xl text-xs transition-all cursor-pointer text-center disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmBatchDelete}
                disabled={isBatchDeleting}
                className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white font-bold rounded-2xl text-xs transition-all cursor-pointer shadow-md shadow-rose-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isBatchDeleting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Menghapus...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Ya, Hapus {selectedProductIds.length} Produk
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Penyesuaian Stok Massal */}
      {showBatchAdjustmentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-950/60 rounded-2xl border border-emerald-200 dark:border-emerald-900">
                <Boxes className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Penyesuaian Stok Massal
                </h3>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  {selectedProductIds.length} produk terpilih akan disesuaikan
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1.5">Jenis Penyesuaian</label>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setAdjustmentType("ADD")}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl border ${adjustmentType === "ADD" ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-700 border-slate-200"}`}
                  >Tambah Stok</button>
                  <button 
                    onClick={() => setAdjustmentType("SUBTRACT")}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl border ${adjustmentType === "SUBTRACT" ? "bg-rose-600 text-white border-rose-600" : "bg-white text-slate-700 border-slate-200"}`}
                  >Kurangi Stok</button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1.5">Jumlah Penyesuaian</label>
                <input 
                  type="number"
                  value={adjustmentAmount}
                  onChange={(e) => setAdjustmentAmount(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1.5">Alasan Penyesuaian</label>
                <input 
                  type="text"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="Contoh: Stok opname, barang rusak, dll"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowBatchAdjustmentModal(false)}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition-all cursor-pointer text-center"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleBatchAdjustment}
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs transition-all cursor-pointer text-center shadow-md shadow-emerald-600/20"
              >
                Terapkan Penyesuaian
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Camera Capture Modal for Product Documentation */}
      {isPhotoCameraOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-60 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                <span className="text-xs font-extrabold text-white uppercase tracking-wider">
                  Kamera Dokumentasi Produk HP
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={switchPhotoCameraFacingMode}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors border border-slate-700"
                  title="Balik Kamera (Depan/Belakang)"
                >
                  <ArrowRightLeft className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Balik Kamera</span>
                </button>
                <button
                  type="button"
                  onClick={stopPhotoCamera}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl cursor-pointer transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Live Camera Viewfinder */}
            <div className="relative bg-black min-h-[300px] sm:min-h-[380px] flex items-center justify-center overflow-hidden">
              {photoCameraError ? (
                <div className="p-6 text-center space-y-3">
                  <AlertTriangle className="h-10 w-10 text-rose-500 mx-auto" />
                  <p className="text-xs font-bold text-slate-200 max-w-xs">{photoCameraError}</p>
                  <button
                    type="button"
                    onClick={() => {
                      stopPhotoCamera();
                      photoFileInputRef.current?.click();
                    }}
                    className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Pilih Foto dari Galeri / File
                  </button>
                </div>
              ) : (
                <>
                  <video
                    ref={photoVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover max-h-[420px] ${
                      photoCameraFacingMode === "user" ? "scale-x-[-1]" : ""
                    }`}
                  />
                  {/* Frame Viewfinder Overlay */}
                  <div className="absolute inset-0 pointer-events-none border-2 border-emerald-500/40 rounded-2xl m-6 flex flex-col justify-between p-3">
                    <div className="flex justify-between">
                      <div className="w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
                      <div className="w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
                    </div>
                    <div className="text-center bg-black/60 backdrop-blur-xs text-emerald-300 text-[10px] font-mono px-3 py-1 rounded-full self-center border border-emerald-500/30 shadow-md">
                      Posisikan unit HP / Bukti fisik di dalam bingkai
                    </div>
                    <div className="flex justify-between">
                      <div className="w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
                      <div className="w-4 h-4 border-b-2 border-r-2 border-emerald-400" />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer Shutter Controls */}
            <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-around">
              <button
                type="button"
                onClick={stopPhotoCamera}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
              >
                Batal
              </button>

              {!photoCameraError && (
                <button
                  type="button"
                  onClick={capturePhotoFromCamera}
                  className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 border-4 border-white dark:border-slate-800 shadow-lg shadow-emerald-500/30 flex items-center justify-center text-white cursor-pointer transition-transform active:scale-90"
                  title="Jepret Foto Sekarang"
                >
                  <div className="w-6 h-6 rounded-full bg-white/20 border-2 border-white" />
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  stopPhotoCamera();
                  photoFileInputRef.current?.click();
                }}
                className="px-3 py-2 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 rounded-xl flex items-center gap-1 cursor-pointer border border-slate-700"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Upload File</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. Product Detail & Photo Gallery Modal */}
      {showProductDetailModal && viewingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                    {viewingProduct.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {viewingProduct.brand} • {viewingProduct.model} • {viewingProduct.category || "Smartphone"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowProductDetailModal(false);
                  setViewingProduct(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Photo Gallery Grid View */}
              <div>
                <h4 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Camera className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Galeri Dokumentasi Foto Fisik Unit ({(viewingProduct.images?.length || (viewingProduct.imageUrl ? 1 : 0))} Foto)</span>
                </h4>

                {((viewingProduct.images && viewingProduct.images.length > 0) || viewingProduct.imageUrl) ? (
                  <div className="space-y-3">
                    {/* Selected Active Main Photo */}
                    <div className="relative w-full h-64 sm:h-72 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-950 group shadow-inner">
                      <LazyProductImage
                        src={
                          (viewingProduct.images && viewingProduct.images[selectedPhotoIndex]) ||
                          viewingProduct.imageUrl ||
                          ""
                        }
                        alt={viewingProduct.name}
                        category={viewingProduct.category}
                        className="w-full h-full object-contain"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setFullScreenPhotoUrl(
                            (viewingProduct.images && viewingProduct.images[selectedPhotoIndex]) ||
                              viewingProduct.imageUrl ||
                              ""
                          )
                        }
                        className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/80 text-white rounded-xl backdrop-blur-md border border-white/20 transition-transform active:scale-90 cursor-pointer"
                        title="Lihat Fullscreen"
                      >
                        <Maximize2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Gallery Thumbnails */}
                    {viewingProduct.images && viewingProduct.images.length > 0 && (
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                        {viewingProduct.images.map((imgSrc, idx) => (
                          <div
                            key={idx}
                            onClick={() => setSelectedPhotoIndex(idx)}
                            className={`aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                              selectedPhotoIndex === idx
                                ? "border-emerald-500 ring-2 ring-emerald-500/30 scale-105"
                                : "border-slate-200 dark:border-slate-700 hover:border-slate-400"
                            }`}
                          >
                            <LazyProductImage
                              src={imgSrc}
                              alt={`Thumbnail ${idx + 1}`}
                              category={viewingProduct.category}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-400">
                    <Camera className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-semibold">Belum ada foto fisik terpasang</p>
                  </div>
                )}
              </div>

              {/* Product Specifications & Pricing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Harga Jual & Modal</span>
                  <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                    Rp {(viewingProduct.priceSell ?? 0).toLocaleString("id-ID")}
                  </div>
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Harga Modal: Rp {(viewingProduct.priceBuy ?? 0).toLocaleString("id-ID")}
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status Stok & Tipe</span>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 rounded-lg text-xs font-bold border border-emerald-200 dark:border-emerald-800">
                      Stok: {viewingProduct.stock} Unit
                    </span>
                    <span className="px-2.5 py-1 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 rounded-lg text-xs font-bold border border-indigo-200 dark:border-indigo-800">
                      {viewingProduct.type === "BARU" ? "BARU (BNIB)" : `BEKAS (Grade ${viewingProduct.condition})`}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Lokasi: {viewingProduct.location || "Toko Utama"}
                  </div>
                </div>
              </div>

              {/* IMEI Serial Numbers */}
              {viewingProduct.imeis && viewingProduct.imeis.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Hash className="h-4 w-4" />
                    <span>Daftar IMEI Serial Active ({viewingProduct.imeis.length} Unit)</span>
                  </h4>
                  <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                    {viewingProduct.imeis.map((imei) => (
                      <span
                        key={imei}
                        className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-mono text-xs font-bold px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs select-all"
                      >
                        {imei}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2">
              {userRole !== "CASHIER" && (
                <button
                  type="button"
                  onClick={() => {
                    const prod = viewingProduct;
                    setShowProductDetailModal(false);
                    setViewingProduct(null);
                    handleOpenEditModal(prod);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/20"
                >
                  <Camera className="h-3.5 w-3.5" />
                  <span>Edit Produk & Tambah Foto Kamera</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setShowProductDetailModal(false);
                  setViewingProduct(null);
                }}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-600"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Confirmation Dialog for Permanently Deleting a Photo */}
      {showPhotoDeleteConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 space-y-4 text-center shadow-2xl border border-slate-200 dark:border-slate-800 animate-pop-in">
            <div className="w-14 h-14 mx-auto rounded-full bg-rose-100 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <Trash2 className="h-7 w-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                Hapus Foto Dokumentasi Ini?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Foto akan dihapus secara permanen dari rekam galeri fisik produk ini. Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowPhotoDeleteConfirmModal(false);
                  setPhotoToDeleteIndex(null);
                }}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDeletePhoto}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl cursor-pointer shadow-md shadow-rose-600/20 transition-all active:scale-95"
              >
                Ya, Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Fullscreen Lightbox Modal */}
      {fullScreenPhotoUrl && (
        <div
          onClick={() => setFullScreenPhotoUrl("")}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out animate-fadeIn"
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full flex items-center justify-center">
            <LazyProductImage
              src={fullScreenPhotoUrl}
              alt="Foto Fisik Fullscreen"
              category="Smartphone"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/10"
            />
            <button
              type="button"
              onClick={() => setFullScreenPhotoUrl("")}
              className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black text-white rounded-full border border-white/20 cursor-pointer"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}

      {/* Auto SKU Generator Modal */}
      <SkuGeneratorModal
        isOpen={showSkuGeneratorModal}
        onClose={() => setShowSkuGeneratorModal(false)}
        products={products}
        initialValues={skuGenPrefill}
        onApplyToNewProduct={(skuData) => {
          setIsEditMode(false);
          setEditingProductId("");
          setSku(skuData.sku);
          setName(`${skuData.brand} ${skuData.model}${skuData.color ? ` ${skuData.color}` : ""}`.trim());
          setBrand(skuData.brand);
          setModel(skuData.model);
          setCategory(skuData.category);
          setColor(skuData.color || "");
          setType(skuData.type);
          setCondition((skuData.condition as any) || "-");
          setSpecifications(skuData.specifications || "");
          setPriceBuy("");
          setPriceSell("");
          setMinStockAlert("2");
          setImageUrl("");
          setImagesList([]);
          setBulkImeiInput("");
          setSkuSuccessMsg(`SKU ${skuData.sku} Diterapkan dari Generator`);
          setShowAddModal(true);
        }}
        onBatchUpdateProductSkus={handleBatchUpdateProductSkus}
      />
    </div>
  );
}
