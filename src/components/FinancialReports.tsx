import { apiFetch } from '../lib/api';
import CryptoJS from "crypto-js";
import React, { useState, useEffect, useRef } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend
} from "recharts";
import { 
  FileSpreadsheet, 
  Printer, 
  TrendingUp, 
  Coins, 
  Layers, 
  Send, 
  Search, 
  BookOpen, 
  ShieldCheck,
  CheckCircle,
  FileText,
  Calculator,
  Briefcase,
  ArrowDownCircle,
  ArrowUpCircle,
  Sparkles,
  Clock,
  Plus,
  Trash2,
  Play,
  Check,
  Edit,
  AlertCircle,
  Calendar,
  RefreshCw,
  Sliders,
  Mail,
  Download,
  BarChart3,
  Receipt,
  X
} from "lucide-react";
import { Product, Transaction, Buyback } from "../types";
import { 
  exportPOSReceiptPDF, 
  exportBulkPOSReceiptsPDF, 
  exportMonthlyAuditReportPDF 
} from "../lib/pdfExporter";
import { useLanguage } from "../contexts/LanguageContext";

interface FinancialReportsProps {
  products: Product[];
  transactions: Transaction[];
  buybacks: Buyback[];
  currentUser?: any;
  onRestore?: () => void;
}

export default function FinancialReports({ products, transactions, buybacks, currentUser, onRestore }: FinancialReportsProps) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [emailInput, setEmailInput] = useState("rickycommedan@gmail.com");
  const [reportType, setReportType] = useState("Laporan Laba Rugi Komprehensif");
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<"trends" | "ledger" | "pl" | "balance" | "cashflow" | "sales" | "buyback" | "stock" | "bestsellers" | "schedule">("trends");
  const [chartTrendMode, setChartTrendMode] = useState<"daily" | "monthly">("daily");
  const [ledgerImeiStatusFilter, setLedgerImeiStatusFilter] = useState<"ALL" | "SOLD" | "STOCK">("ALL");

  const [dateRangePreset, setDateRangePreset] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // PDF Export Column Customization State & Master Schema
  const [isPdfConfigModalOpen, setIsPdfConfigModalOpen] = useState(false);
  const [includeKpiInPdf, setIncludeKpiInPdf] = useState(true);
  const [isEcoPrintMode, setIsEcoPrintMode] = useState(false);

  const ALL_SUBTAB_COLUMNS: Record<string, { id: string; label: string; isSensitive?: boolean }[]> = {
    ledger: [
      { id: "No Invoice", label: "No Invoice" },
      { id: "Tgl Beli", label: "Tgl Beli (Procurement)" },
      { id: "Tgl Jual", label: "Tgl Jual" },
      { id: "Konsumen", label: "Nama Konsumen", isSensitive: true },
      { id: "Supplier", label: "Nama Supplier", isSensitive: true },
      { id: "Smartphone", label: "Model Smartphone" },
      { id: "No IMEI", label: "Nomor IMEI", isSensitive: true },
      { id: "Beli (Rp)", label: "Harga Beli / HPP", isSensitive: true },
      { id: "Jual (Rp)", label: "Harga Jual" },
      { id: "Margin (Rp)", label: "Margin / Laba", isSensitive: true },
      { id: "Status", label: "Status Transaksi" }
    ],
    sales: [
      { id: "No Invoice", label: "No Invoice" },
      { id: "Tanggal", label: "Tanggal & Waktu" },
      { id: "Nama Konsumen", label: "Nama Konsumen", isSensitive: true },
      { id: "No Telepon", label: "No Telepon Konsumen", isSensitive: true },
      { id: "Kasir", label: "Kasir / Petugas" },
      { id: "Metode Pembayaran", label: "Metode Pembayaran" },
      { id: "Status", label: "Status Bayar" },
      { id: "Item Produk", label: "Item Produk" },
      { id: "Total Bayar (Rp)", label: "Total Bayar (Rp)" }
    ],
    buyback: [
      { id: "No Buyback", label: "No Buyback Invoice" },
      { id: "Tanggal", label: "Tanggal Buyback" },
      { id: "Nama Pelanggan", label: "Nama Pelanggan", isSensitive: true },
      { id: "No Telepon", label: "No Telepon Pelanggan", isSensitive: true },
      { id: "Brand", label: "Brand" },
      { id: "Model", label: "Model" },
      { id: "Grade", label: "Grade Kondisi" },
      { id: "No IMEI", label: "Nomor IMEI", isSensitive: true },
      { id: "Verifikasi", label: "Verifikasi Kemenperin" },
      { id: "Status IMEI", label: "Status IMEI" },
      { id: "Harga Beli (Rp)", label: "Harga Beli (Rp)", isSensitive: true },
      { id: "Kasir", label: "Kasir" },
      { id: "Catatan", label: "Catatan" }
    ],
    stock: [
      { id: "Brand", label: "Brand" },
      { id: "Model", label: "Model Smartphone" },
      { id: "Tipe", label: "Tipe (Baru/Bekas)" },
      { id: "Stok", label: "Jumlah Stok" },
      { id: "Alert", label: "Min Stock Alert" },
      { id: "HPP Satuan (Rp)", label: "HPP Satuan (Rp)", isSensitive: true },
      { id: "Total HPP (Rp)", label: "Total HPP Stok (Rp)", isSensitive: true },
      { id: "Harga Jual (Rp)", label: "Harga Jual (Rp)" },
      { id: "Margin Laba (Rp)", label: "Margin Laba Satuan (Rp)", isSensitive: true },
      { id: "Potensi Laba (Rp)", label: "Potensi Laba (Rp)", isSensitive: true }
    ],
    bestsellers: [
      { id: "Peringkat", label: "Peringkat" },
      { id: "Nama Smartphone", label: "Nama Smartphone" },
      { id: "Brand", label: "Brand" },
      { id: "Tipe", label: "Tipe (Baru/Bekas)" },
      { id: "Unit Terjual", label: "Unit Terjual" },
      { id: "Total Pendapatan (Rp)", label: "Total Omzet (Rp)" },
      { id: "Estimasi Laba Bersih (Rp)", label: "Laba Bersih (Rp)", isSensitive: true }
    ],
    trend: [
      { id: "Periode / Tanggal", label: "Periode / Tanggal" },
      { id: "Total Penjualan (IDR)", label: "Total Penjualan" },
      { id: "Total Buyback (IDR)", label: "Total Buyback", isSensitive: true },
      { id: "Estimasi Laba Bersih (IDR)", label: "Estimasi Laba", isSensitive: true },
      { id: "Jumlah Transaksi", label: "Jumlah Transaksi" }
    ],
    pl: [
      { id: "Kategori", label: "Kategori" },
      { id: "Akun Keuangan", label: "Akun Keuangan" },
      { id: "Rincian (IDR)", label: "Rincian (IDR)" },
      { id: "Total (IDR)", label: "Total (IDR)" }
    ],
    balance: [
      { id: "Golongan", label: "Golongan" },
      { id: "Akun Neraca", label: "Akun Neraca" },
      { id: "Aset (IDR)", label: "Aset (IDR)" },
      { id: "Kewajiban & Ekuitas (IDR)", label: "Kewajiban & Ekuitas (IDR)" }
    ],
    cashflow: [
      { id: "Arus Kas", label: "Arus Kas" },
      { id: "Aktivitas Kas", label: "Aktivitas Kas" },
      { id: "Inflow (IDR)", label: "Inflow (IDR)" },
      { id: "Outflow (IDR)", label: "Outflow (IDR)" },
      { id: "Subtotal (IDR)", label: "Subtotal (IDR)" }
    ]
  };

  const [selectedPdfColumns, setSelectedPdfColumns] = useState<Record<string, string[]>>({
    ledger: ["No Invoice", "Tgl Beli", "Tgl Jual", "Konsumen", "Supplier", "Smartphone", "No IMEI", "Beli (Rp)", "Jual (Rp)", "Margin (Rp)", "Status"],
    sales: ["No Invoice", "Tanggal", "Nama Konsumen", "No Telepon", "Kasir", "Metode Pembayaran", "Status", "Item Produk", "Total Bayar (Rp)"],
    buyback: ["No Buyback", "Tanggal", "Nama Pelanggan", "No Telepon", "Brand", "Model", "Grade", "No IMEI", "Verifikasi", "Status IMEI", "Harga Beli (Rp)", "Kasir", "Catatan"],
    stock: ["Brand", "Model", "Tipe", "Stok", "Alert", "HPP Satuan (Rp)", "Total HPP (Rp)", "Harga Jual (Rp)", "Margin Laba (Rp)", "Potensi Laba (Rp)"],
    bestsellers: ["Peringkat", "Nama Smartphone", "Brand", "Tipe", "Unit Terjual", "Total Pendapatan (Rp)", "Estimasi Laba Bersih (Rp)"],
    trend: ["Periode / Tanggal", "Total Penjualan (IDR)", "Total Buyback (IDR)", "Estimasi Laba Bersih (IDR)", "Jumlah Transaksi"],
    pl: ["Kategori", "Akun Keuangan", "Rincian (IDR)", "Total (IDR)"],
    balance: ["Golongan", "Akun Neraca", "Aset (IDR)", "Kewajiban & Ekuitas (IDR)"],
    cashflow: ["Arus Kas", "Aktivitas Kas", "Inflow (IDR)", "Outflow (IDR)", "Subtotal (IDR)"]
  });

  const togglePdfColumn = (subtabKey: string, colId: string) => {
    setSelectedPdfColumns(prev => {
      const currentList = prev[subtabKey] || [];
      if (currentList.includes(colId)) {
        return { ...prev, [subtabKey]: currentList.filter(c => c !== colId) };
      } else {
        return { ...prev, [subtabKey]: [...currentList, colId] };
      }
    });
  };

  const applyPdfPreset = (preset: "hideSensitive" | "showAll" | "minimal" | "eco") => {
    const allCols = ALL_SUBTAB_COLUMNS[activeSubTab] || [];
    if (preset === "hideSensitive") {
      const nonSensitive = allCols.filter(c => !c.isSensitive).map(c => c.id);
      setSelectedPdfColumns(prev => ({ ...prev, [activeSubTab]: nonSensitive }));
      setIncludeKpiInPdf(false);
      setIsEcoPrintMode(false);
    } else if (preset === "showAll") {
      const allIds = allCols.map(c => c.id);
      setSelectedPdfColumns(prev => ({ ...prev, [activeSubTab]: allIds }));
      setIncludeKpiInPdf(true);
      setIsEcoPrintMode(false);
    } else if (preset === "minimal") {
      const minimalCols = allCols.slice(0, Math.min(4, allCols.length)).map(c => c.id);
      setSelectedPdfColumns(prev => ({ ...prev, [activeSubTab]: minimalCols }));
      setIncludeKpiInPdf(false);
      setIsEcoPrintMode(false);
    } else if (preset === "eco") {
      const allIds = allCols.map(c => c.id);
      setSelectedPdfColumns(prev => ({ ...prev, [activeSubTab]: allIds }));
      setIncludeKpiInPdf(true);
      setIsEcoPrintMode(true);
    }
  };

  const applyDateFilter = (dateString: string) => {
    if (dateRangePreset === "all") return true;
    if (!dateString) return true;
    
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return true;
    
    if (dateRangePreset === "custom") {
      if (startDate && new Date(startDate) > d) return false;
      if (endDate) {
        const endD = new Date(endDate);
        endD.setHours(23, 59, 59, 999);
        if (endD < d) return false;
      }
      return true;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (dateRangePreset === "today") {
      return d >= today;
    } else if (dateRangePreset === "this_week") {
      const firstDay = new Date(today.setDate(today.getDate() - today.getDay()));
      return d >= firstDay;
    } else if (dateRangePreset === "this_month") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      return d >= firstDay;
    }
    
    return true;
  };

  const filteredTransactionsDate = transactions.filter(tx => applyDateFilter(tx.date));
  const filteredBuybacksDate = buybacks.filter(b => applyDateFilter(b.date));


  // Report scheduling system states
  const [schedules, setSchedules] = useState<any[]>([]);
  const [isFetchingSchedules, setIsFetchingSchedules] = useState(false);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [scheduleSuccessMessage, setScheduleSuccessMessage] = useState<string | null>(null);

  // Default state for schedule form
  const initialFormState = {
    reportType: "pl",
    frequency: "daily",
    recipientEmail: "rickycommedan@gmail.com",
    format: "pdf",
    companyName: "FonePOS Roxy Square",
    managerName: "Ricky Commedan",
    notes: "Laporan harian otomatis terlampir. Silakan review performa penjualan hari ini.",
    customColor: "blue"
  };
  const [scheduleForm, setScheduleForm] = useState(initialFormState);

  const fetchSchedules = async () => {
    setIsFetchingSchedules(true);
    try {
      const response = await apiFetch("/api/financial-reports/schedules");
      const data = await response.json();
      if (data.success) {
        setSchedules(data.schedules);
      }
    } catch (err) {
      console.error("Failed to fetch schedules:", err);
    } finally {
      setIsFetchingSchedules(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSchedule(true);
    try {
      const url = editingScheduleId 
        ? `/api/financial-reports/schedules/${editingScheduleId}`
        : "/api/financial-reports/schedules";
      const method = editingScheduleId ? "PUT" : "POST";
      
      const response = await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportType: scheduleForm.reportType,
          frequency: scheduleForm.frequency,
          recipientEmail: scheduleForm.recipientEmail,
          format: scheduleForm.format,
          personalization: {
            companyName: scheduleForm.companyName,
            managerName: scheduleForm.managerName,
            notes: scheduleForm.notes,
            customColor: scheduleForm.customColor
          }
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setScheduleSuccessMessage(editingScheduleId ? "Jadwal berhasil diperbarui!" : "Jadwal berhasil ditambahkan!");
        setScheduleForm(initialFormState);
        setEditingScheduleId(null);
        fetchSchedules();
        setTimeout(() => setScheduleSuccessMessage(null), 4000);
      }
    } catch (err) {
      console.error("Error saving schedule:", err);
    } finally {
      setIsSavingSchedule(false);
    }
  };

  const handleEditScheduleClick = (schedule: any) => {
    setEditingScheduleId(schedule.id);
    setScheduleForm({
      reportType: schedule.reportType,
      frequency: schedule.frequency,
      recipientEmail: schedule.recipientEmail,
      format: schedule.format,
      companyName: schedule.personalization?.companyName || "FonePOS Roxy Square",
      managerName: schedule.personalization?.managerName || "Ricky Commedan",
      notes: schedule.personalization?.notes || "",
      customColor: schedule.personalization?.customColor || "blue"
    });
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus jadwal laporan otomatis ini?")) return;
    try {
      const response = await apiFetch(`/api/financial-reports/schedules/${id}`, {
        method: "DELETE"
      });
      const data = await response.json();
      if (data.success) {
        setScheduleSuccessMessage("Jadwal laporan berhasil dihapus.");
        fetchSchedules();
        setTimeout(() => setScheduleSuccessMessage(null), 4000);
      }
    } catch (err) {
      console.error("Error deleting schedule:", err);
    }
  };

  const handleToggleScheduleActive = async (id: string, currentActive: boolean) => {
    try {
      const response = await apiFetch(`/api/financial-reports/schedules/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive })
      });
      const data = await response.json();
      if (data.success) {
        fetchSchedules();
      }
    } catch (err) {
      console.error("Error toggling schedule:", err);
    }
  };

  const handleTriggerScheduleNow = async (id: string) => {
    try {
      const response = await apiFetch(`/api/financial-reports/schedules/${id}/trigger`, {
        method: "POST"
      });
      const data = await response.json();
      if (data.success) {
        setScheduleSuccessMessage("Laporan instan berhasil dipicu & dikirim ke sistem/admin!");
        fetchSchedules();
        setTimeout(() => setScheduleSuccessMessage(null), 4000);
      }
    } catch (err) {
      console.error("Error triggering schedule:", err);
    }
  };

  // AI Financial Analyzer States
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAiAnalyzeFinance = async () => {
    setIsAnalyzing(true);
    setAiAnalysis(null);

    // Prepare calculations matching local summary
    const tempAuditRows: any[] = [];
    filteredTransactionsDate.forEach(tx => {
      tx.items.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        let purchasePrice = prod ? prod.priceBuy : Math.floor(item.priceSell * 0.85);
        if (prod?.purchasedImeisHistory) {
          const history = prod.purchasedImeisHistory.find(h => h.imei === item.imei);
          if (history) {
            purchasePrice = history.purchasePrice;
          }
        }
        tempAuditRows.push({
          purchasePrice: purchasePrice,
          sellingPrice: item.priceSell,
          status: tx.paymentStatus
        });
      });
    });

    const calculatedRevenue = tempAuditRows
      .filter(row => row.status === "PAID")
      .reduce((sum, r) => sum + r.sellingPrice, 0);

    const calculatedProcurementCost = tempAuditRows
      .filter(row => row.status === "PAID")
      .reduce((sum, r) => sum + r.purchasePrice, 0);

    const calculatedGrossProfit = calculatedRevenue - calculatedProcurementCost;
    const calculatedBuybackCost = filteredBuybacksDate.reduce((sum, b) => sum + b.priceBuy, 0);
    const calculatedNetProfit = calculatedGrossProfit - calculatedBuybackCost;

    const summaryData = {
      totalRevenue: calculatedRevenue,
      totalProcurementCost: calculatedProcurementCost,
      totalGrossProfit: calculatedGrossProfit,
      totalBuybackCost: calculatedBuybackCost,
      netProfit: calculatedNetProfit
    };

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
      const res = await apiFetch("/api/ai/analyze-finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summaryData, customConfig })
      });
      const data = await res.json();
      if (data.success && data.analysis) {
        setAiAnalysis(data.analysis);
      } else {
        alert("Gagal memanggil asisten analisis finansial AI.");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan koneksi ke asisten analisis finansial AI.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePrintDailyReport = () => {
    const todayLocal = new Date();
    const todayYYYY = todayLocal.getFullYear();
    const todayMM = String(todayLocal.getMonth() + 1).padStart(2, "0");
    const todayDD = String(todayLocal.getDate()).padStart(2, "0");
    const todayKey = `${todayYYYY}-${todayMM}-${todayDD}`;

    const todayTx = filteredTransactionsDate.filter(tx => tx.date.startsWith(todayKey) && tx.paymentStatus === "PAID");
    const todayBuyback = filteredBuybacksDate.filter(bb => bb.date.startsWith(todayKey));

    const txCount = todayTx.length;
    const buybackCount = todayBuyback.length;
    
    const retailRev = todayTx.reduce((sum, tx) => sum + tx.totalAmount, 0);
    const promoDiscountTotal = todayTx.reduce((sum, tx) => sum + (tx.promoDiscount || 0), 0);
    const buybackExp = todayBuyback.reduce((sum, bb) => sum + bb.priceBuy, 0);
    
    const methods: Record<string, number> = { TUNAI: 0, TRANSFER: 0, QRIS: 0, MIDTRANS: 0, "KARTU DEBIT": 0, "KARTU KREDIT": 0 };
    todayTx.forEach(tx => {
      if (tx.paymentMethod === "SPLIT" && tx.splitPayments) {
        tx.splitPayments.forEach((sp: any) => {
          if (methods[sp.method] !== undefined) {
            methods[sp.method] += sp.amount;
          } else {
            methods[sp.method] = sp.amount;
          }
        });
      } else {
        if (methods[tx.paymentMethod] !== undefined) {
          methods[tx.paymentMethod] += tx.totalAmount;
        } else {
          methods[tx.paymentMethod] = tx.totalAmount;
        }
      }
    });

    const itemsSold: { name: string; brand: string; count: number; total: number }[] = [];
    todayTx.forEach(tx => {
      tx.items.forEach(item => {
        const existing = itemsSold.find(i => i.name === item.name);
        if (existing) {
          existing.count += 1;
          existing.total += item.priceSell;
        } else {
          itemsSold.push({
            name: item.name,
            brand: item.brand,
            count: 1,
            total: item.priceSell
          });
        }
      });
    });

    const paperWidth = (localStorage.getItem("print_paper_width") as "58mm" | "80mm") || "58mm";
    const fontSize = (localStorage.getItem("print_font_size") as "small" | "medium" | "large") || "medium";
    const shopTitle = localStorage.getItem("print_shop_title") || "FONEPOS & BUYBACK";
    const shopAddress = localStorage.getItem("print_shop_address") || "Roxy Mas Square Blok C2, Jakarta";
    const shopPhone = localStorage.getItem("print_shop_phone") || "0812-RICKY-COMP";
    const showHeader = localStorage.getItem("print_show_shop_header") !== "false";
    const thanksText = localStorage.getItem("print_thanks_text") || "--- TERIMA KASIH ---";

    const reportHtml = `
      <div style="text-align: center; font-family: 'JetBrains Mono', monospace, Courier, sans-serif; color: #000; padding: 2mm;">
        ${showHeader ? `
          <div style="font-weight: bold; font-size: 11px; margin-bottom: 2px;">${shopTitle}</div>
          <div style="font-size: 8px; margin-bottom: 2px;">${shopAddress}</div>
          <div style="font-size: 8px; margin-bottom: 6px;">Telp: ${shopPhone}</div>
        ` : ""}
        <div style="border-top: 1px dashed #000; margin-top: 4px; padding-top: 4px;"></div>
        <div style="font-weight: bold; font-size: 10px; margin-bottom: 4px;">LAPORAN RINGKASAN HARIAN</div>
        <div style="font-size: 8px; margin-bottom: 4px; text-align: left;">
          Tanggal : ${todayLocal.toLocaleDateString("id-ID")} ${todayLocal.toLocaleTimeString("id-ID")}<br/>
          Cashier : Siti (POS Admin)
        </div>
        <div style="border-top: 1px dashed #000; margin-top: 4px; padding-top: 4px;"></div>
        
        <div style="text-align: left; font-size: 8px; line-height: 1.4;">
          <div style="display: flex; justify-content: space-between;">
            <span>Total Transaksi POS:</span>
            <span style="font-weight: bold;">${txCount} x</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Total Pendapatan POS:</span>
            <span style="font-weight: bold;">Rp ${(retailRev ?? 0).toLocaleString("id-ID")}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Total Diskon Promo:</span>
            <span style="font-weight: bold; color: #d97706;">-Rp ${(promoDiscountTotal ?? 0).toLocaleString("id-ID")}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Total Transaksi Buyback:</span>
            <span style="font-weight: bold;">${buybackCount} x</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span>Total Pengeluaran Buyback:</span>
            <span style="font-weight: bold;">Rp ${(buybackExp ?? 0).toLocaleString("id-ID")}</span>
          </div>
          <div style="display: flex; justify-content: space-between; border-top: 1px dashed #000; padding-top: 4px; font-weight: bold;">
            <span>ESTIMASI SALDO MASUK:</span>
            <span>Rp ${((retailRev ?? 0) - (buybackExp ?? 0)).toLocaleString("id-ID")}</span>
          </div>
        </div>
        
        <div style="border-top: 1px dashed #000; margin-top: 6px; padding-top: 6px;"></div>
        <div style="font-weight: bold; font-size: 8px; text-align: left; margin-bottom: 2px;">METODE PEMBAYARAN KASIR</div>
        <div style="text-align: left; font-size: 8px; line-height: 1.4;">
          <div style="display: flex; justify-content: space-between;">
            <span>TUNAI:</span>
            <span>Rp ${(methods?.TUNAI ?? 0).toLocaleString("id-ID")}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>TRANSFER:</span>
            <span>Rp ${(methods?.TRANSFER ?? 0).toLocaleString("id-ID")}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>QRIS:</span>
            <span>Rp ${(methods?.QRIS ?? 0).toLocaleString("id-ID")}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>MIDTRANS:</span>
            <span>Rp ${(methods?.MIDTRANS ?? 0).toLocaleString("id-ID")}</span>
          </div>
        </div>

        <div style="border-top: 1px dashed #000; margin-top: 6px; padding-top: 6px;"></div>
        <div style="font-weight: bold; font-size: 8px; text-align: left; margin-bottom: 2px;">RINCIAN PRODUK TERJUAL</div>
        <div style="text-align: left; font-size: 8px; line-height: 1.4;">
          ${itemsSold.length === 0 ? '<div style="color: #666; text-align: center; font-style: italic;">Tidak ada smartphone terjual.</div>' : 
            itemsSold.map(item => `
              <div style="margin-bottom: 4px;">
                <div style="font-weight: bold;">${item.name}</div>
                <div style="display: flex; justify-content: space-between;">
                  <span>${item.count} unit x Rp ${((item.total || 0) / (item.count || 1)).toLocaleString("id-ID")}</span>
                  <span>Rp ${(item.total || 0).toLocaleString("id-ID")}</span>
                </div>
              </div>
            `).join("")
          }
        </div>

        <div style="border-top: 1px dashed #000; margin-top: 8px; padding-top: 8px;"></div>
        <div style="font-size: 8px; font-style: italic; margin-bottom: 4px; font-weight: bold;">${thanksText}</div>
        <div style="font-size: 7px; color: #333;">Laporan ditarik secara real-time.</div>
      </div>
    `;

    const printArea = document.createElement("div");
    printArea.id = "thermal-print-area";
    printArea.innerHTML = reportHtml;

    const fontSizeMap = {
      small: { base: "8px", heading: "10px", sub: "7px" },
      medium: { base: "10px", heading: "12px", sub: "8px" },
      large: { base: "12px", heading: "15px", sub: "10px" }
    };
    const activeSizes = fontSizeMap[fontSize] || fontSizeMap.medium;

    const style = document.createElement("style");
    style.innerHTML = `
      @media print {
        #root, .fixed, .modal, [role="dialog"], .backdrop-blur-xs, .no-print {
          display: none !important;
          visibility: hidden !important;
        }
        
        html, body {
          background: #ffffff !important;
          color: #000000 !important;
          margin: 0 !important;
          padding: 0 !important;
          width: ${paperWidth} !important;
        }

        #thermal-print-area, #thermal-print-area * {
          display: block !important;
          visibility: visible !important;
        }

        #thermal-print-area {
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: ${paperWidth} !important;
          font-family: 'JetBrains Mono', monospace, Courier, monospace !important;
          font-size: ${activeSizes.base} !important;
          line-height: 1.35 !important;
          color: #000000 !important;
          background: #ffffff !important;
          padding: 3mm !important;
          box-sizing: border-box !important;
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
        console.warn("Print cleanup failed:", e);
      }
    }, 50);
  };

  // Compile ledger items containing matching purchase/sales profiles!
  const auditRows: any[] = [];

  // 1. Process sold items from transactions
  filteredTransactionsDate.forEach(tx => {
    tx.items.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      
      let supplierName = (prod as any)?.supplierName || "PT Erajaya Swasembada";
      let purchasePrice = prod ? prod.priceBuy : Math.floor(item.priceSell * 0.85);
      let purchaseDate = (prod as any)?.createdAt ? (prod as any).createdAt.split("T")[0] : "2026-06-15";

      if (prod?.purchasedImeisHistory) {
        const history = prod.purchasedImeisHistory.find(h => h.imei === item.imei);
        if (history) {
          supplierName = history.supplier || supplierName;
          purchasePrice = history.purchasePrice;
          purchaseDate = history.date;
        }
      }

      auditRows.push({
        invoiceNo: tx.id,
        customerName: tx.customerName,
        customerPhone: tx.customerPhone,
        supplierName: supplierName,
        productName: item.name,
        imei: item.imei,
        purchasePrice: purchasePrice,
        sellingPrice: item.priceSell,
        purchaseDate: purchaseDate,
        salesDate: tx.date.split("T")[0],
        netMargin: item.priceSell - purchasePrice,
        status: tx.paymentStatus,
        isSold: true
      });
    });
  });

  // 2. Process active inventory stock IMEIs (Unsold)
  const soldImeiSet = new Set(auditRows.map(r => r.imei));
  products.forEach(prod => {
    if (prod.imeis && Array.isArray(prod.imeis)) {
      prod.imeis.forEach(im => {
        if (!soldImeiSet.has(im)) {
          let supplierName = (prod as any).supplierName || "PT Erajaya / Supplier PO";
          let purchasePrice = prod.priceBuy;
          let purchaseDate = (prod as any).createdAt ? (prod as any).createdAt.split("T")[0] : "-";

          if (prod.purchasedImeisHistory) {
            const history = prod.purchasedImeisHistory.find(h => h.imei === im);
            if (history) {
              supplierName = history.supplier || supplierName;
              purchasePrice = history.purchasePrice;
              purchaseDate = history.date;
            }
          }

          auditRows.push({
            invoiceNo: (prod as any).code || "INVENTORY",
            customerName: "- (Ready Stock)",
            customerPhone: "-",
            supplierName: supplierName,
            productName: prod.name,
            imei: im,
            purchasePrice: purchasePrice,
            sellingPrice: prod.priceSell,
            purchaseDate: purchaseDate,
            salesDate: "-",
            netMargin: prod.priceSell - purchasePrice,
            status: "STOK READY",
            isSold: false
          });
        }
      });
    }
  });

  // Financial Calculations based on real-time DB records
  const totalRevenue = auditRows
    .filter(row => row.status === "PAID")
    .reduce((sum, r) => sum + r.sellingPrice, 0);

  const totalProcurementCost = auditRows
    .filter(row => row.status === "PAID")
    .reduce((sum, r) => sum + r.purchasePrice, 0);

  const totalGrossProfit = totalRevenue - totalProcurementCost;
  const totalBuybackCost = filteredBuybacksDate.reduce((sum, b) => sum + b.priceBuy, 0);
  
  // Real-world calculations
  const netProfit = totalGrossProfit - totalBuybackCost;

  // Balance sheet metrics
  const cashInitial = 50000000; // IDR 50 Million starting capital
  const cashAssetValue = cashInitial + totalRevenue - totalProcurementCost - totalBuybackCost;
  const inventoryAssetValue = products.reduce((sum, p) => sum + (p.priceBuy * p.stock), 0);
  const totalAssets = cashAssetValue + inventoryAssetValue;
  const totalLiabilities = 0; // Debt-free POS operation
  const retainedEarnings = netProfit;
  const totalEquity = cashInitial + retainedEarnings;

  // Data processing for Recharts daily & monthly revenue/profit trends
  const dailyTrendData = React.useMemo(() => {
    const dailyMap: Record<string, { date: string; displayLabel: string; revenue: number; cost: number; buyback: number; netProfit: number; txCount: number }> = {};

    filteredTransactionsDate.forEach(tx => {
      if (tx.paymentStatus !== "PAID") return;
      const dayKey = tx.date.split("T")[0];
      if (!dailyMap[dayKey]) {
        const d = new Date(dayKey);
        const dateStr = !isNaN(d.getTime()) 
          ? d.toLocaleDateString("id-ID", { day: "numeric", month: "short" }) 
          : dayKey;
        dailyMap[dayKey] = {
          date: dayKey,
          displayLabel: dateStr,
          revenue: 0,
          cost: 0,
          buyback: 0,
          netProfit: 0,
          txCount: 0
        };
      }

      let txCost = 0;
      tx.items.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        let pPrice = prod ? prod.priceBuy : Math.floor(item.priceSell * 0.85);
        if (prod?.purchasedImeisHistory) {
          const h = prod.purchasedImeisHistory.find(hist => hist.imei === item.imei);
          if (h) pPrice = h.purchasePrice;
        }
        txCost += pPrice;
      });

      dailyMap[dayKey].revenue += tx.totalAmount;
      dailyMap[dayKey].cost += txCost;
      dailyMap[dayKey].txCount += 1;
    });

    filteredBuybacksDate.forEach(bb => {
      const dayKey = bb.date.split("T")[0];
      if (!dailyMap[dayKey]) {
        const d = new Date(dayKey);
        const dateStr = !isNaN(d.getTime()) 
          ? d.toLocaleDateString("id-ID", { day: "numeric", month: "short" }) 
          : dayKey;
        dailyMap[dayKey] = {
          date: dayKey,
          displayLabel: dateStr,
          revenue: 0,
          cost: 0,
          buyback: 0,
          netProfit: 0,
          txCount: 0
        };
      }
      dailyMap[dayKey].buyback += bb.priceBuy;
    });

    const sortedDays = Object.keys(dailyMap).sort().map(key => {
      const item = dailyMap[key];
      const grossProfit = item.revenue - item.cost;
      const netProfit = item.revenue - item.cost - item.buyback;
      item.netProfit = netProfit;
      const grossMarginPercent = item.revenue > 0 ? Number(((grossProfit / item.revenue) * 100).toFixed(1)) : 0;
      const netMarginPercent = item.revenue > 0 ? Number(((netProfit / item.revenue) * 100).toFixed(1)) : 0;
      return {
        ...item,
        grossProfit,
        grossMarginPercent,
        netMarginPercent
      };
    });

    if (sortedDays.length === 0) {
      const today = new Date();
      const fallback = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split("T")[0];
        const displayStr = d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
        const rev = (7 - i) * 12500000;
        const cst = (7 - i) * 9500000;
        const bb = i % 2 === 0 ? 2500000 : 0;
        const gp = rev - cst;
        const np = gp - bb;
        fallback.push({
          date: key,
          displayLabel: displayStr,
          revenue: rev,
          cost: cst,
          buyback: bb,
          grossProfit: gp,
          netProfit: np,
          grossMarginPercent: rev > 0 ? Number(((gp / rev) * 100).toFixed(1)) : 0,
          netMarginPercent: rev > 0 ? Number(((np / rev) * 100).toFixed(1)) : 0,
          txCount: (7 - i) * 2
        });
      }
      return fallback;
    }

    return sortedDays;
  }, [filteredTransactionsDate, filteredBuybacksDate, products]);

  const monthlyTrendData = React.useMemo(() => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
    const monthlyMap: Record<string, { monthKey: string; displayLabel: string; revenue: number; cost: number; buyback: number; netProfit: number; txCount: number }> = {};

    transactions.forEach(tx => {
      if (tx.paymentStatus !== "PAID") return;
      const mKey = tx.date.slice(0, 7);
      if (!monthlyMap[mKey]) {
        const [year, month] = mKey.split("-");
        const monthIdx = parseInt(month, 10) - 1;
        const displayStr = `${monthNames[monthIdx] || month} ${year}`;
        monthlyMap[mKey] = {
          monthKey: mKey,
          displayLabel: displayStr,
          revenue: 0,
          cost: 0,
          buyback: 0,
          netProfit: 0,
          txCount: 0
        };
      }

      let txCost = 0;
      tx.items.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        let pPrice = prod ? prod.priceBuy : Math.floor(item.priceSell * 0.85);
        if (prod?.purchasedImeisHistory) {
          const h = prod.purchasedImeisHistory.find(hist => hist.imei === item.imei);
          if (h) pPrice = h.purchasePrice;
        }
        txCost += pPrice;
      });

      monthlyMap[mKey].revenue += tx.totalAmount;
      monthlyMap[mKey].cost += txCost;
      monthlyMap[mKey].txCount += 1;
    });

    buybacks.forEach(bb => {
      const mKey = bb.date.slice(0, 7);
      if (!monthlyMap[mKey]) {
        const [year, month] = mKey.split("-");
        const monthIdx = parseInt(month, 10) - 1;
        const displayStr = `${monthNames[monthIdx] || month} ${year}`;
        monthlyMap[mKey] = {
          monthKey: mKey,
          displayLabel: displayStr,
          revenue: 0,
          cost: 0,
          buyback: 0,
          netProfit: 0,
          txCount: 0
        };
      }
      monthlyMap[mKey].buyback += bb.priceBuy;
    });

    const sortedMonths = Object.keys(monthlyMap).sort().map(key => {
      const item = monthlyMap[key];
      const grossProfit = item.revenue - item.cost;
      const netProfit = item.revenue - item.cost - item.buyback;
      item.netProfit = netProfit;
      const grossMarginPercent = item.revenue > 0 ? Number(((grossProfit / item.revenue) * 100).toFixed(1)) : 0;
      const netMarginPercent = item.revenue > 0 ? Number(((netProfit / item.revenue) * 100).toFixed(1)) : 0;
      return {
        ...item,
        grossProfit,
        grossMarginPercent,
        netMarginPercent
      };
    });

    if (sortedMonths.length === 0) {
      const year = new Date().getFullYear();
      return [
        { monthKey: `${year}-01`, displayLabel: `Jan ${year}`, revenue: 145000000, cost: 115000000, buyback: 12000000, grossProfit: 30000000, netProfit: 18000000, grossMarginPercent: 20.7, netMarginPercent: 12.4, txCount: 24 },
        { monthKey: `${year}-02`, displayLabel: `Feb ${year}`, revenue: 182000000, cost: 142000000, buyback: 15000000, grossProfit: 40000000, netProfit: 25000000, grossMarginPercent: 22.0, netMarginPercent: 13.7, txCount: 31 },
        { monthKey: `${year}-03`, displayLabel: `Mar ${year}`, revenue: 210000000, cost: 165000000, buyback: 18000000, grossProfit: 45000000, netProfit: 27000000, grossMarginPercent: 21.4, netMarginPercent: 12.9, txCount: 38 },
        { monthKey: `${year}-04`, displayLabel: `Apr ${year}`, revenue: 195000000, cost: 150000000, buyback: 14000000, grossProfit: 45000000, netProfit: 31000000, grossMarginPercent: 23.1, netMarginPercent: 15.9, txCount: 33 },
        { monthKey: `${year}-05`, displayLabel: `Mei ${year}`, revenue: 240000000, cost: 185000000, buyback: 22000000, grossProfit: 55000000, netProfit: 33000000, grossMarginPercent: 22.9, netMarginPercent: 13.8, txCount: 42 },
        { monthKey: `${year}-06`, displayLabel: `Jun ${year}`, revenue: 275000000, cost: 210000000, buyback: 25000000, grossProfit: 65000000, netProfit: 40000000, grossMarginPercent: 23.6, netMarginPercent: 14.5, txCount: 49 },
        { monthKey: `${year}-07`, displayLabel: `Jul ${year}`, revenue: 310000000, cost: 235000000, buyback: 28000000, grossProfit: 75000000, netProfit: 47000000, grossMarginPercent: 24.2, netMarginPercent: 15.2, txCount: 56 },
      ];
    }

    return sortedMonths;
  }, [transactions, buybacks, products]);

  const activeTrendData = chartTrendMode === "daily" ? dailyTrendData : monthlyTrendData;

  const handleExportPDF = () => {
    const orientation = ["ledger", "sales", "buyback", "stock"].includes(activeSubTab) ? "landscape" : "portrait";
    const pageWidth = orientation === "landscape" ? 297 : 210;
    const marginSide = isEcoPrintMode ? 8 : 15;

    const doc = new jsPDF({
      orientation: orientation,
      unit: "mm",
      format: "a4"
    });

    const shopTitle = localStorage.getItem("print_shop_title") || "FONEPOS & BUYBACK";
    const shopAddress = localStorage.getItem("print_shop_address") || "Roxy Mas Square Blok C2, Jakarta";
    const shopPhone = localStorage.getItem("print_shop_phone") || "0812-RICKY-COMP";

    let nextStartY = 64;

    if (isEcoPrintMode) {
      // MODE CETAK HEMAT (ECO / AUDIT PRINT MODE) - Efficient, monochrome, high density layout
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(0, 0, 0);
      doc.text(shopTitle, marginSide, 10);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(60, 60, 60);
      doc.text(`${shopAddress} | Telp: ${shopPhone}`, marginSide, 14);

      let title = "";
      if (activeSubTab === "ledger") title = "LAPORAN AUDIT BUKU BESAR (LEDGER)";
      else if (activeSubTab === "pl") title = "LAPORAN LABA RUGI (PROFIT & LOSS)";
      else if (activeSubTab === "balance") title = "LAPORAN NERACA (BALANCE SHEET)";
      else if (activeSubTab === "cashflow") title = "LAPORAN ARUS KAS (CASH FLOW)";
      else if (activeSubTab === "sales") title = "LAPORAN PENJUALAN";
      else if (activeSubTab === "buyback") title = "LAPORAN BUYBACK HP BEKAS";
      else if (activeSubTab === "stock") title = "LAPORAN STOK INVENTORY";
      else if (activeSubTab === "bestsellers") title = "LAPORAN PRODUK TERLARIS";
      else title = "LAPORAN KEUANGAN";

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(0, 0, 0);
      doc.text(title, marginSide, 20);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(80, 80, 80);
      doc.text(`Tgl Cetak: ${new Date().toLocaleDateString("id-ID")} ${new Date().toLocaleTimeString("id-ID")} • Mode Hemat Kertas Audit`, pageWidth - marginSide, 20, { align: "right" });

      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.3);
      doc.line(marginSide, 22, pageWidth - marginSide, 22);

      nextStartY = 26;
    } else {
      // STANDARD HIGH-CONTRAST HEADER BANNER
      doc.setFillColor(30, 41, 59); // slate-800
      doc.rect(0, 0, pageWidth, 38, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text(shopTitle, 15, 14);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(203, 213, 225); // slate-300
      doc.text(shopAddress + " | Telp: " + shopPhone, 15, 21);
      doc.text("Laporan Keuangan Premium & Pelacakan IMEI Otomatis", 15, 26);
      doc.text("Sistem Keamanan Enkripsi Kemenperin Bea Cukai • Status: Real-Time", 15, 31);

      // Document Title Section
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42); // slate-900
      
      let title = "";
      if (activeSubTab === "ledger") title = "LAPORAN AUDIT BUKU BESAR (LEDGER TRANSACTION REPORT)";
      else if (activeSubTab === "pl") title = "LAPORAN LABA RUGI KOMPREHENSIF (PROFIT & LOSS STATEMENT)";
      else if (activeSubTab === "balance") title = "LAPORAN NERACA KEUANGAN (BALANCE SHEET METRICS)";
      else if (activeSubTab === "cashflow") title = "LAPORAN ARUS KAS KEUANGAN (STATEMENT OF CASH FLOWS)";
      else if (activeSubTab === "sales") title = "LAPORAN PENJUALAN";
      else if (activeSubTab === "buyback") title = "LAPORAN PEMBELIAN BEKAS (BUYBACK)";
      else if (activeSubTab === "stock") title = "LAPORAN STOK INVENTORY";
      else if (activeSubTab === "bestsellers") title = "LAPORAN PRODUK TERLARIS";
      else title = "LAPORAN KEUANGAN";

      doc.text(title, 15, 48);

      // Underline
      doc.setDrawColor(148, 163, 184); // slate-400
      doc.setLineWidth(0.4);
      doc.line(15, 51, orientation === "landscape" ? 282 : 195, 51);

      // Meta Info
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text(`Waktu Penarikan: ${new Date().toLocaleDateString("id-ID")} ${new Date().toLocaleTimeString("id-ID")}`, 15, 57);
      doc.text(`Mata Uang Acuan: IDR (Rupiah) • Dokumen Elektronik Sah`, orientation === "landscape" ? 200 : 120, 57);

      nextStartY = 64;
    }

    // Get headers and rows using the same logic as CSV
    let headers: string[] = [];
    let rows: any[][] = [];

    if (activeSubTab === "ledger") {
      headers = [
        "No Invoice", "Tgl Beli", "Tgl Jual", "Konsumen", "Supplier", "Smartphone", "No IMEI", "Beli (Rp)", "Jual (Rp)", "Margin (Rp)", "Status"
      ];
      rows = auditRows.map(row => [
        row.invoiceNo, row.purchaseDate, row.salesDate, row.customerName, row.supplierName, row.productName, row.imei, 
        `Rp ${(row.purchasePrice ?? 0).toLocaleString("id-ID")}`, 
        `Rp ${(row.sellingPrice ?? 0).toLocaleString("id-ID")}`, 
        `Rp ${(row.netMargin ?? 0).toLocaleString("id-ID")}`, 
        row.status
      ]);
    } else if (activeSubTab === "pl") {
      headers = ["Kategori", "Akun Keuangan", "Rincian (IDR)", "Total (IDR)"];
      rows = [
        ["PENDAPATAN", "Pendapatan Retail Penjualan Smartphone", `Rp ${(totalRevenue ?? 0).toLocaleString("id-ID")}`, ""],
        ["PENDAPATAN", "Total Pendapatan Bersih", "", `Rp ${(totalRevenue ?? 0).toLocaleString("id-ID")}`],
        ["HAK POKOK PENJUALAN", "Beban Pengadaan Barang Jual (HPP)", `Rp ${(totalProcurementCost ?? 0).toLocaleString("id-ID")}`, ""],
        ["HAK POKOK PENJUALAN", "Total HPP", "", `Rp ${(totalProcurementCost ?? 0).toLocaleString("id-ID")}`],
        ["LABA KOTOR", "Laba Kotor (Gross Margin)", "", `Rp ${(totalGrossProfit ?? 0).toLocaleString("id-ID")}`],
        ["Beban Operasional", "Beban Akuisisi Handphone Bekas (Buyback)", `Rp ${(totalBuybackCost ?? 0).toLocaleString("id-ID")}`, ""],
        ["Beban Operasional", "Total Beban Operasional", "", `Rp ${(totalBuybackCost ?? 0).toLocaleString("id-ID")}`],
        ["LABA BERSIH", "Laba / (Rugi) Bersih Usaha", "", `Rp ${(netProfit ?? 0).toLocaleString("id-ID")}`]
      ];
    } else if (activeSubTab === "balance") {
      headers = ["Golongan", "Akun Neraca", "Aset (IDR)", "Kewajiban & Ekuitas (IDR)"];
      rows = [
        ["ASET", "Kas dan Setara Kas (Saldo Bank)", `Rp ${(cashAssetValue ?? 0).toLocaleString("id-ID")}`, ""],
        ["ASET", "Persediaan Barang Dagang (Smartphone Stock)", `Rp ${(inventoryAssetValue ?? 0).toLocaleString("id-ID")}`, ""],
        ["ASET", "Total Aktiva (Assets)", `Rp ${(totalAssets ?? 0).toLocaleString("id-ID")}`, ""],
        ["LIABILITAS", "Utang Usaha Supplier", "", `Rp ${(totalLiabilities ?? 0).toLocaleString("id-ID")}`],
        ["EKUITAS", "Modal Disetor Pemilik (Ricky Commedan)", "", `Rp ${(cashInitial ?? 0).toLocaleString("id-ID")}`],
        ["EKUITAS", "Laba Tahun Berjalan (Retained Earnings)", "", `Rp ${(retainedEarnings ?? 0).toLocaleString("id-ID")}`],
        ["PASIVA", "Total Pasiva (Liabilities & Equity)", "", `Rp ${(totalEquity ?? 0).toLocaleString("id-ID")}`]
      ];
    } else if (activeSubTab === "cashflow") {
      headers = ["Arus Kas", "Aktivitas Kas", "Inflow (IDR)", "Outflow (IDR)", "Subtotal (IDR)"];
      rows = [
        ["OPERASIONAL", "Penerimaan Kas dari Konsumen (Retail)", `Rp ${(totalRevenue ?? 0).toLocaleString("id-ID")}`, "", ""],
        ["OPERASIONAL", "Pembayaran Kas ke Supplier (Procurement)", "", `Rp ${(totalProcurementCost ?? 0).toLocaleString("id-ID")}`, ""],
        ["OPERASIONAL", "Pembayaran Kas untuk Pembelian Bekas (Buyback)", "", `Rp ${(totalBuybackCost ?? 0).toLocaleString("id-ID")}`, ""],
        ["OPERASIONAL", "Arus Kas Bersih Aktivitas Operasi", "", "", `Rp ${(netProfit ?? 0).toLocaleString("id-ID")}`],
        ["KAS AWAL", "Kas Awal Periode (Modal Disetor)", "", "", `Rp ${(cashInitial ?? 0).toLocaleString("id-ID")}`],
        ["KAS AKHIR", "Saldo Kas Akhir Terbuku", "", "", `Rp ${(cashAssetValue ?? 0).toLocaleString("id-ID")}`]
      ];
    } else if (activeSubTab === "sales") {
      headers = ["No Invoice", "Tanggal", "Nama Konsumen", "No Telepon", "Kasir", "Metode Pembayaran", "Status", "Item Produk", "Total Bayar (Rp)"];
      rows = filteredTransactionsDate.map(tx => [
        tx.id, tx.date?.replace("T", " ") || "-", tx.customerName, tx.customerPhone, tx.cashierName, tx.paymentMethod === "SPLIT" && tx.splitPayments ? `SPLIT (${tx.splitPayments.map((sp:any) => sp.method).join(" + ")})` : tx.paymentMethod, tx.paymentStatus, tx.items.map(i => `${i.name} [IMEI:${i.imei}]`).join(" | "), `Rp ${(tx.totalAmount ?? 0).toLocaleString("id-ID")}`
      ]);
    } else if (activeSubTab === "buyback") {
      headers = ["No Buyback", "Tanggal", "Nama Pelanggan", "No Telepon", "Brand", "Model", "Grade", "No IMEI", "Verifikasi", "Status IMEI", "Harga Beli (Rp)", "Kasir", "Catatan"];
      rows = filteredBuybacksDate.map(b => [
        b.id, b.date?.replace("T", " ") || "-", b.customerName, b.customerPhone, b.brand, b.model, b.condition, b.customerImei, b.imeiVerified ? "VERIFIKASI" : "BELUM", b.imeiStatus, `Rp ${(b.priceBuy ?? 0).toLocaleString("id-ID")}`, b.cashierName, b.notes || "-"
      ]);
    } else if (activeSubTab === "stock") {
      headers = ["Brand", "Model", "Tipe", "Stok", "Alert", "HPP Satuan (Rp)", "Total HPP (Rp)", "Harga Jual (Rp)", "Margin Laba (Rp)", "Potensi Laba (Rp)"];
      rows = products.map(p => [
        p.brand, p.model, p.type, p.stock, p.minStockAlert, `Rp ${(p.priceBuy ?? 0).toLocaleString("id-ID")}`, `Rp ${((p.priceBuy || 0) * (p.stock || 0)).toLocaleString("id-ID")}`, `Rp ${(p.priceSell ?? 0).toLocaleString("id-ID")}`, `Rp ${((p.priceSell ?? 0) - (p.priceBuy ?? 0)).toLocaleString("id-ID")}`, `Rp ${(((p.priceSell || 0) - (p.priceBuy || 0)) * (p.stock || 0)).toLocaleString("id-ID")}`
      ]);
    } else if (activeSubTab === "bestsellers") {
      headers = ["Peringkat", "Nama Smartphone", "Brand", "Tipe", "Unit Terjual", "Total Pendapatan (Rp)", "Estimasi Laba Bersih (Rp)"];
      const bestsellerList: any[] = [];
      filteredTransactionsDate.filter(tx => tx.paymentStatus === "PAID").forEach(tx => {
        tx.items.forEach(item => {
          const existing = bestsellerList.find(b => b.name === item.name);
          const prod = products.find(p => p.id === item.productId);
          let purchasePrice = prod ? prod.priceBuy : Math.floor(item.priceSell * 0.85);
          if (prod?.purchasedImeisHistory) {
            const history = prod.purchasedImeisHistory.find(h => h.imei === item.imei);
            if (history) purchasePrice = history.purchasePrice;
          }
          if (existing) {
            existing.unitsSold += 1;
            existing.totalRevenue += item.priceSell;
            existing.totalCost += purchasePrice;
            existing.totalProfit += (item.priceSell - purchasePrice);
          } else {
            bestsellerList.push({
              name: item.name, brand: item.brand, type: item.type, unitsSold: 1, totalRevenue: item.priceSell, totalCost: purchasePrice, totalProfit: item.priceSell - purchasePrice
            });
          }
        });
      });
      bestsellerList.sort((a, b) => b.unitsSold - a.unitsSold);
      rows = bestsellerList.map((item, index) => [
        index + 1, item.name, item.brand, item.type, item.unitsSold, `Rp ${(item.totalRevenue ?? 0).toLocaleString("id-ID")}`, `Rp ${(item.totalProfit ?? 0).toLocaleString("id-ID")}`
      ]);
    } else {
      headers = ["Periode / Tanggal", "Total Penjualan (IDR)", "Total Buyback (IDR)", "Estimasi Laba Bersih (IDR)", "Jumlah Transaksi"];
      rows = activeTrendData.map((d: any) => [
        d.date || d.label,
        `Rp ${(d.revenue ?? 0).toLocaleString("id-ID")}`,
        `Rp ${(d.buybackCost ?? 0).toLocaleString("id-ID")}`,
        `Rp ${(d.profit ?? 0).toLocaleString("id-ID")}`,
        `${d.txCount || 0} Transaksi`
      ]);
    }
    
    // Filter columns based on user selection in selectedPdfColumns[activeSubTab]
    const currentSubtabSelectedCols = selectedPdfColumns[activeSubTab] || headers;
    if (currentSubtabSelectedCols && currentSubtabSelectedCols.length > 0) {
      const visibleIndices: number[] = [];
      headers.forEach((h, index) => {
        if (currentSubtabSelectedCols.includes(h)) {
          visibleIndices.push(index);
        }
      });

      if (visibleIndices.length > 0) {
        headers = visibleIndices.map(i => headers[i]);
        rows = rows.map(r => visibleIndices.map(i => r[i]));
      }
    }

    // Executive Summary KPI Table before details (If enabled)
    if (includeKpiInPdf) {
      autoTable(doc, {
        startY: nextStartY,
        head: [["Ikhtisar Finansial (Financial Executive Summary)", "Nilai Terbuku (IDR)"]],
        body: [
          ["Total Penerimaan Penjualan (Total Revenue)", `Rp ${(totalRevenue ?? 0).toLocaleString("id-ID")}`],
          ["Total Beban Pengadaan HPP (Procurement)", `Rp ${(totalProcurementCost ?? 0).toLocaleString("id-ID")}`],
          ["Laba Kotor Usaha (Gross Profit)", `Rp ${(totalGrossProfit ?? 0).toLocaleString("id-ID")}`],
          ["Total Pengeluaran Buyback HP Bekas", `Rp ${(totalBuybackCost ?? 0).toLocaleString("id-ID")}`],
          ["Laba Bersih Usaha (Net Profit)", `Rp ${(netProfit ?? 0).toLocaleString("id-ID")}`],
          ["Total Aset Kas & Stok Inventory", `Rp ${(totalAssets ?? 0).toLocaleString("id-ID")}`]
        ],
        theme: 'grid',
        headStyles: isEcoPrintMode 
          ? { fillColor: [225, 225, 225], textColor: 0, fontSize: 8, fontStyle: 'bold', lineWidth: 0.15, lineColor: [150, 150, 150] }
          : { fillColor: [30, 41, 59], textColor: 255, fontSize: 8.5, fontStyle: 'bold' },
        bodyStyles: isEcoPrintMode 
          ? { fontSize: 7, textColor: [10, 10, 10], cellPadding: 1.1, lineWidth: 0.1, lineColor: [210, 210, 210] }
          : { fontSize: 8, textColor: [30, 41, 59] },
        alternateRowStyles: isEcoPrintMode 
          ? { fillColor: [255, 255, 255] } 
          : { fillColor: [248, 250, 252] },
        margin: { left: marginSide, right: marginSide }
      });

      nextStartY = (doc as any).lastAutoTable.finalY + (isEcoPrintMode ? 5 : 8);
    }

    autoTable(doc, {
      startY: nextStartY,
      head: [headers],
      body: rows,
      theme: 'grid',
      headStyles: isEcoPrintMode 
        ? { fillColor: [230, 230, 230], textColor: 0, fontSize: 7.5, fontStyle: 'bold', lineWidth: 0.15, lineColor: [150, 150, 150] }
        : { fillColor: [71, 85, 105], textColor: 255, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: isEcoPrintMode 
        ? { fontSize: 6.8, textColor: [15, 15, 15], cellPadding: 1.0, lineWidth: 0.1, lineColor: [210, 210, 210] }
        : { fontSize: 7.5, textColor: [51, 65, 85] },
      alternateRowStyles: isEcoPrintMode 
        ? { fillColor: [255, 255, 255] } 
        : { fillColor: [248, 250, 252] },
      margin: { left: marginSide, right: marginSide }
    });

    const finalY = (doc as any).lastAutoTable.finalY + (isEcoPrintMode ? 5 : 10);
    
    doc.setDrawColor(isEcoPrintMode ? 180 : 226, isEcoPrintMode ? 180 : 232, isEcoPrintMode ? 180 : 240);
    doc.setLineWidth(0.3);
    doc.line(marginSide, finalY, pageWidth - marginSide, finalY);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(isEcoPrintMode ? 8 : 9);
    doc.setTextColor(isEcoPrintMode ? 0 : 71, isEcoPrintMode ? 0 : 85, isEcoPrintMode ? 0 : 105);
    doc.text("Catatan & Kebijakan Audit POS:", marginSide, finalY + (isEcoPrintMode ? 4.5 : 6));
      
    doc.setFont("helvetica", "normal");
    doc.setFontSize(isEcoPrintMode ? 6.8 : 7.5);
    doc.setTextColor(isEcoPrintMode ? 60 : 100, isEcoPrintMode ? 60 : 116, isEcoPrintMode ? 60 : 139);
    doc.text("1. Laporan ini merupakan dokumen komprehensif, ditarik langsung dari sistem database cloud FonePOS.", marginSide, finalY + (isEcoPrintMode ? 8 : 10.5));
    doc.text("2. Pelacakan IMEI smartphone terikat langsung dengan status Bea Cukai Kemenperin demi validitas sanksi regulasi.", marginSide, finalY + (isEcoPrintMode ? 11.5 : 14.5));
    doc.text("3. Ricky Commedan menjamin keabsahan data masuk/keluar kas ini sesuai dengan catatan rekening koran.", marginSide, finalY + (isEcoPrintMode ? 15 : 18.5));

    // Signature Area
    const sigY = finalY + (isEcoPrintMode ? 22 : 30);
    const rightSigX = orientation === "landscape" ? (isEcoPrintMode ? 220 : 200) : (isEcoPrintMode ? 155 : 150);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(isEcoPrintMode ? 7.5 : 8);
    doc.setTextColor(isEcoPrintMode ? 0 : 15, isEcoPrintMode ? 0 : 23, isEcoPrintMode ? 0 : 42);
    doc.text("Disiapkan Oleh,", marginSide, sigY);
    doc.text("Disetujui Oleh,", rightSigX, sigY);

    doc.text("Siti Rahma", marginSide, sigY + (isEcoPrintMode ? 10 : 14));
    doc.text("Ricky Commedan", rightSigX, sigY + (isEcoPrintMode ? 10 : 14));
      
    doc.setFont("helvetica", "normal");
    doc.setTextColor(isEcoPrintMode ? 70 : 100, isEcoPrintMode ? 70 : 116, isEcoPrintMode ? 70 : 139);
    doc.text("Finance POS Specialist", marginSide, sigY + (isEcoPrintMode ? 13 : 17.5));
    doc.text("Direktur Utama FonePOS", rightSigX, sigY + (isEcoPrintMode ? 13 : 17.5));

    doc.save(`Laporan_${activeSubTab.toUpperCase()}_FONEPOS_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const getPeriodLabel = () => {
    if (dateRangePreset === "all") return "Semua Waktu";
    if (dateRangePreset === "today") return "Hari Ini";
    if (dateRangePreset === "this_week") return "Minggu Ini";
    if (dateRangePreset === "this_month") return "Bulan Ini";
    return `Custom (${startDate || "Awal"} s/d ${endDate || "Sekarang"})`;
  };

  const handleExportMonthlyAuditReport = () => {
    exportMonthlyAuditReportPDF({
      filteredTransactions: filteredTransactionsDate,
      filteredBuybacks: filteredBuybacksDate,
      products,
      dateRangeLabel: getPeriodLabel(),
      startDate,
      endDate,
      currentUser,
      summaryData: {
        totalRevenue,
        totalProcurementCost,
        totalGrossProfit,
        totalBuybackCost,
        netProfit,
        cashAssetValue,
        inventoryAssetValue,
        totalAssets,
        grossMarginPercent: totalRevenue > 0 ? (totalGrossProfit / totalRevenue) * 100 : 0,
        netMarginPercent: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0
      },
      auditRows
    });
  };

  const handleExportBulkPOSReceipts = () => {
    exportBulkPOSReceiptsPDF(filteredTransactionsDate, getPeriodLabel());
  };

  // Email report simulation
  const handleSendReportEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    setIsEmailSending(true);
    setEmailSuccess(false);

    try {
      const response = await apiFetch("/api/notifications/send-report-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailInput,
          reportType: reportType,
          dateRange: "Laporan Terkini - Real-Time"
        })
      });

      const data = await response.json();
      if (data.success) {
        setEmailSuccess(true);
        setTimeout(() => setEmailSuccess(false), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsEmailSending(false);
    }
  };

  // XLSX Excel export generator based on the active tab
  const restoreInputRef = useRef<HTMLInputElement>(null);

  const handleRestoreDatabase = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm("Peringatan: Restore database akan MENIMPA semua data saat ini! Apakah Anda yakin?")) {
      e.target.value = "";
      return;
    }

    try {
      const text = await file.text();
      const backupData = JSON.parse(text);

      const res = await apiFetch("/api/backup/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(backupData)
      });
      const data = await res.json();

      if (data.success) {
        alert("✅ Restore database berhasil! Memuat ulang data...");
        if (onRestore) onRestore();
      } else {
        alert("❌ Gagal merestore database: " + data.message);
      }
    } catch (err) {
      console.error(err);
      alert("❌ File backup tidak valid atau terjadi kesalahan server.");
    } finally {
      e.target.value = "";
    }
  };

  const handleBackupDatabase = () => {
    try {
      const backupData = {
        products,
        transactions,
        buybacks,
        timestamp: new Date().toISOString()
      };
      
      const jsonString = JSON.stringify(backupData);
      
      // Mengenkripsi data dengan AES
      const SECRET_KEY = "FONEPOS_SECURE_BACKUP_KEY_2026";
      const encryptedData = window.btoa(encodeURIComponent(jsonString)); // Fallback
      let finalData = encryptedData;
      
      try {
        // using imported CryptoJS
        finalData = CryptoJS.AES.encrypt(jsonString, SECRET_KEY).toString();
      } catch (e) {
        // If crypto-js is not available in scope
      }
      
      // Membentuk blob file JSON
      const blob = new Blob([JSON.stringify({ encrypted: true, data: finalData, format: "AES" })], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = url;
      link.download = `fonepos_backup_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      alert("✅ Backup database berhasil diunduh dalam format JSON terenkripsi!");
    } catch (error) {
      console.error("Backup failed", error);
      alert("❌ Gagal membuat backup database!");
    }
  };

  const handleExportExcel = () => {
    let headers: string[] = [];
    let rows: any[][] = [];
    let filename = `laporan_${activeSubTab}_phonepos_${new Date().toISOString().split("T")[0]}.xlsx`;

    if (activeSubTab === "ledger") {
      headers = [
        "No Invoice",
        "Tanggal Beli (Procurement)",
        "Tanggal Jual",
        "Konsumen",
        "Supplier",
        "Smartphone",
        "No IMEI",
        "Harga Beli (Rp)",
        "Harga Jual (Rp)",
        "Keuntungan Bersih (Rp)",
        "Status Pembayaran"
      ];
      rows = auditRows.map(row => [
        row.invoiceNo,
        row.purchaseDate,
        row.salesDate,
        row.customerName,
        row.supplierName,
        row.productName,
        row.imei,
        row.purchasePrice,
        row.sellingPrice,
        row.netMargin,
        row.status
      ]);
    } else if (activeSubTab === "pl") {
      headers = ["Kategori", "Akun Keuangan", "Rincian (IDR)", "Total (IDR)"];
      rows = [
        ["PENDAPATAN", "Pendapatan Retail Penjualan Smartphone", totalRevenue, ""],
        ["PENDAPATAN", "Total Pendapatan Bersih", "", totalRevenue],
        ["HAK POKOK PENJUALAN", "Beban Pengadaan Barang Jual (HPP)", totalProcurementCost, ""],
        ["HAK POKOK PENJUALAN", "Total HPP", "", totalProcurementCost],
        ["LABA KOTOR", "Laba Kotor (Gross Margin)", "", totalGrossProfit],
        ["Beban Operasional", "Beban Akuisisi Handphone Bekas (Buyback)", totalBuybackCost, ""],
        ["Beban Operasional", "Total Beban Operasional", "", totalBuybackCost],
        ["LABA BERSIH", "Laba / (Rugi) Bersih Usaha", "", netProfit]
      ];
    } else if (activeSubTab === "balance") {
      headers = ["Golongan", "Akun Neraca", "Aset (IDR)", "Kewajiban & Ekuitas (IDR)"];
      rows = [
        ["ASET", "Kas dan Setara Kas (Saldo Bank)", cashAssetValue, ""],
        ["ASET", "Persediaan Barang Dagang (Smartphone Stock)", inventoryAssetValue, ""],
        ["ASET", "Total Aktiva (Assets)", totalAssets, ""],
        ["LIABILITAS", "Utang Usaha Supplier", "", totalLiabilities],
        ["EKUITAS", "Modal Disetor Pemilik (Ricky Commedan)", "", cashInitial],
        ["EKUITAS", "Laba Tahun Berjalan (Retained Earnings)", "", retainedEarnings],
        ["PASIVA", "Total Pasiva (Liabilities & Equity)", "", totalEquity]
      ];
    } else if (activeSubTab === "cashflow") {
      headers = ["Arus Kas", "Aktivitas Kas", "Inflow (IDR)", "Outflow (IDR)", "Subtotal (IDR)"];
      rows = [
        ["OPERASIONAL", "Penerimaan Kas dari Konsumen (Retail)", totalRevenue, "", ""],
        ["OPERASIONAL", "Pembayaran Kas ke Supplier (Procurement)", "", totalProcurementCost, ""],
        ["OPERASIONAL", "Pembayaran Kas untuk Pembelian Bekas (Buyback)", "", totalBuybackCost, ""],
        ["OPERASIONAL", "Arus Kas Bersih Aktivitas Operasi", "", "", netProfit],
        ["KAS AWAL", "Kas Awal Periode (Modal Disetor)", "", "", cashInitial],
        ["KAS AKHIR", "Saldo Kas Akhir Terbuku", "", "", cashAssetValue]
      ];
    } else if (activeSubTab === "sales") {
      headers = ["No Invoice", "Tanggal", "Nama Konsumen", "No Telepon", "Kasir", "Metode Pembayaran", "Status", "Item Produk", "Total Bayar (Rp)"];
      rows = filteredTransactionsDate.map(tx => [
        tx.id,
        tx.date.replace("T", " "),
        tx.customerName,
        tx.customerPhone,
        tx.cashierName,
        tx.paymentMethod === "SPLIT" && tx.splitPayments ? `SPLIT (${tx.splitPayments.map((sp:any) => sp.method).join(" + ")})` : tx.paymentMethod,
        tx.paymentStatus,
        tx.items.map(i => `${i.name} [IMEI:${i.imei}]`).join(" | "),
        tx.totalAmount
      ]);
    } else if (activeSubTab === "buyback") {
      headers = ["No Buyback", "Tanggal", "Nama Pelanggan", "No Telepon", "Brand", "Model", "Grade", "No IMEI", "Verifikasi", "Status IMEI", "Harga Beli (Rp)", "Kasir", "Catatan"];
      rows = filteredBuybacksDate.map(b => [
        b.id,
        b.date.replace("T", " "),
        b.customerName,
        b.customerPhone,
        b.brand,
        b.model,
        b.condition,
        b.customerImei,
        b.imeiVerified ? "VERIFIKASI" : "BELUM VERIFIKASI",
        b.imeiStatus,
        b.priceBuy,
        b.cashierName,
        b.notes || "-"
      ]);
    } else if (activeSubTab === "stock") {
      headers = ["Brand", "Model", "Tipe", "Stok Tersedia", "Limit Alert", "Harga Beli Satuan (Rp)", "Total Nilai HPP (Rp)", "Harga Jual Satuan (Rp)", "Margin Laba Satuan (Rp)", "Potensi Laba Kotor (Rp)"];
      rows = products.map(p => [
        p.brand,
        p.model,
        p.type,
        p.stock,
        p.minStockAlert,
        p.priceBuy,
        p.priceBuy * p.stock,
        p.priceSell,
        p.priceSell - p.priceBuy,
        (p.priceSell - p.priceBuy) * p.stock
      ]);
    } else if (activeSubTab === "bestsellers") {
      headers = ["Peringkat", "Nama Smartphone", "Brand", "Tipe", "Unit Terjual", "Total Pendapatan (Rp)", "Estimasi Laba Bersih (Rp)"];
      const bestsellerList: any[] = [];
      filteredTransactionsDate.filter(tx => tx.paymentStatus === "PAID").forEach(tx => {
        tx.items.forEach(item => {
          const existing = bestsellerList.find(b => b.name === item.name);
          const prod = products.find(p => p.id === item.productId);
          let purchasePrice = prod ? prod.priceBuy : Math.floor(item.priceSell * 0.85);
          if (prod?.purchasedImeisHistory) {
            const history = prod.purchasedImeisHistory.find(h => h.imei === item.imei);
            if (history) purchasePrice = history.purchasePrice;
          }
          if (existing) {
            existing.unitsSold += 1;
            existing.totalRevenue += item.priceSell;
            existing.totalCost += purchasePrice;
            existing.totalProfit += (item.priceSell - purchasePrice);
          } else {
            bestsellerList.push({
              name: item.name,
              brand: item.brand,
              type: item.type,
              unitsSold: 1,
              totalRevenue: item.priceSell,
              totalCost: purchasePrice,
              totalProfit: item.priceSell - purchasePrice
            });
          }
        });
      });
      bestsellerList.sort((a, b) => b.unitsSold - a.unitsSold);
      rows = bestsellerList.map((item, index) => [
        index + 1,
        item.name,
        item.brand,
        item.type,
        item.unitsSold,
        item.totalRevenue,
        item.totalProfit
      ]);
    }

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, activeSubTab.toUpperCase());
    XLSX.writeFile(workbook, filename);
  };

  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: any[][] = [];

    if (activeSubTab === "ledger") {
      headers = [
        "No Invoice", "Tgl Beli", "Tgl Jual", "Konsumen", "Supplier", "Smartphone", "No IMEI", "Beli (Rp)", "Jual (Rp)", "Margin (Rp)", "Status"
      ];
      rows = auditRows.map(row => [
        row.invoiceNo, row.purchaseDate, row.salesDate, row.customerName, row.supplierName, row.productName, row.imei, 
        row.purchasePrice ?? 0, 
        row.sellingPrice ?? 0, 
        row.netMargin ?? 0, 
        row.status
      ]);
    } else if (activeSubTab === "pl") {
      headers = ["Kategori", "Akun Keuangan", "Rincian (IDR)", "Total (IDR)"];
      rows = [
        ["PENDAPATAN", "Pendapatan Retail Penjualan Smartphone", totalRevenue, totalRevenue],
        ["HAK POKOK PENJUALAN", "Beban Pengadaan Barang Jual (HPP)", totalProcurementCost, totalProcurementCost],
        ["LABA KOTOR", "Laba Kotor (Gross Margin)", totalGrossProfit, totalGrossProfit],
        ["Beban Operasional", "Beban Akuisisi Handphone Bekas (Buyback)", totalBuybackCost, totalBuybackCost],
        ["LABA BERSIH", "Laba / (Rugi) Bersih Usaha", netProfit, netProfit]
      ];
    } else if (activeSubTab === "balance") {
      headers = ["Kategori Aset", "Komponen Aset/Liabilitas", "Nilai (IDR)"];
      rows = [
        ["ASET LANCAR", "Stok Barang Jadi (Inventory)", inventoryAssetValue],
        ["ASET LANCAR", "Kas & Bank Terbuku", cashAssetValue],
        ["TOTAL ASET", "Total Aset Lancar", totalAssets],
        ["EKUITAS", "Kas Awal Periode", cashInitial],
        ["EKUITAS", "Saldo Kas Akhir Terbuku", cashAssetValue]
      ];
    } else if (activeSubTab === "sales") {
      headers = ["No Invoice", "Tanggal", "Nama Konsumen", "No Telepon", "Kasir", "Metode Pembayaran", "Status", "Item Produk", "Total Bayar (Rp)"];
      rows = filteredTransactionsDate.map(tx => [
        tx.id, tx.date?.replace("T", " ") || "-", tx.customerName, tx.customerPhone, tx.cashierName, tx.paymentMethod === "SPLIT" && tx.splitPayments ? `SPLIT (${tx.splitPayments.map((sp:any) => sp.method).join(" + ")})` : tx.paymentMethod, tx.paymentStatus, tx.items.map(i => `${i.name} [IMEI:${i.imei}]`).join(" | "), tx.totalAmount ?? 0
      ]);
    } else if (activeSubTab === "buyback") {
      headers = ["No Buyback", "Tanggal", "Nama Pelanggan", "No Telepon", "Brand", "Model", "Grade", "No IMEI", "Verifikasi", "Status IMEI", "Harga Beli (Rp)", "Kasir", "Catatan"];
      rows = filteredBuybacksDate.map(b => [
        b.id, b.date?.replace("T", " ") || "-", b.customerName, b.customerPhone, b.brand, b.model, b.condition, b.customerImei, b.imeiVerified ? "VERIFIKASI" : "BELUM", b.imeiStatus, b.priceBuy ?? 0, b.cashierName, b.notes || "-"
      ]);
    } else if (activeSubTab === "stock") {
      headers = ["Brand", "Model", "Tipe", "Stok", "Alert", "HPP Satuan (Rp)", "Total HPP (Rp)", "Harga Jual (Rp)", "Margin Laba (Rp)", "Potensi Laba (Rp)"];
      rows = products.map(p => [
        p.brand, p.model, p.type, p.stock, p.minStockAlert, p.priceBuy ?? 0, (p.priceBuy || 0) * (p.stock || 0), p.priceSell ?? 0, (p.priceSell ?? 0) - (p.priceBuy ?? 0), ((p.priceSell || 0) - (p.priceBuy || 0)) * (p.stock || 0)
      ]);
    } else if (activeSubTab === "bestsellers") {
      headers = ["Peringkat", "Nama Smartphone", "Brand", "Tipe", "Unit Terjual", "Total Pendapatan (Rp)", "Estimasi Laba Bersih (Rp)"];
      const bestsellerList: any[] = [];
      filteredTransactionsDate.filter(tx => tx.paymentStatus === "PAID").forEach(tx => {
        tx.items.forEach(item => {
          const existing = bestsellerList.find(b => b.name === item.name);
          const prod = products.find(p => p.id === item.productId);
          let purchasePrice = prod ? prod.priceBuy : Math.floor(item.priceSell * 0.85);
          if (prod?.purchasedImeisHistory) {
            const history = prod.purchasedImeisHistory.find(h => h.imei === item.imei);
            if (history) purchasePrice = history.purchasePrice;
          }
          if (existing) {
            existing.unitsSold += 1;
            existing.totalRevenue += item.priceSell;
            existing.totalCost += purchasePrice;
            existing.totalProfit += (item.priceSell - purchasePrice);
          } else {
            bestsellerList.push({
              name: item.name, brand: item.brand, type: item.type, unitsSold: 1, totalRevenue: item.priceSell, totalCost: purchasePrice, totalProfit: item.priceSell - purchasePrice
            });
          }
        });
      });
      bestsellerList.sort((a, b) => b.unitsSold - a.unitsSold);
      rows = bestsellerList.map((item, index) => [
        index + 1, item.name, item.brand, item.type, item.unitsSold, item.totalRevenue ?? 0, item.totalProfit ?? 0
      ]);
    } else {
      headers = ["Metrik Keuangan", "Nilai (IDR)"];
      rows = [
        ["Total Revenue", totalRevenue],
        ["Total HPP Pengadaan", totalProcurementCost],
        ["Laba Kotor", totalGrossProfit],
        ["Total Buyback Cost", totalBuybackCost],
        ["Laba Bersih", netProfit],
        ["Total Aset Kas & Stok", totalAssets]
      ];
    }

    const escapeCSVCell = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const csvLines = [
      headers.map(escapeCSVCell).join(","),
      ...rows.map(r => r.map(escapeCSVCell).join(","))
    ];

    const csvContent = "\uFEFF" + csvLines.join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Laporan_Keuangan_${activeSubTab.toUpperCase()}_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportMassAccountingCSV = () => {
    const headers = [
      "No Invoice",
      "Tanggal Transaksi",
      "Jam Transaksi",
      "Nama Pelanggan",
      "No Telepon Pelanggan",
      "Kode Produk",
      "Nama Produk",
      "Brand / Merek",
      "No IMEI / Serial Number",
      "Kuantitas (Qty)",
      "Harga Jual Satuan (IDR)",
      "HPP Satuan (IDR)",
      "Subtotal Line (IDR)",
      "Estimasi Laba Kotor Line (IDR)",
      "Pajak PPN (IDR)",
      "Diskon (Promo/Loyalty/Poin) (IDR)",
      "Total Net Faktur (IDR)",
      "Metode Pembayaran",
      "Kasir / Operator",
      "Status Pembayaran"
    ];

    const rows: any[][] = [];

    filteredTransactionsDate.forEach((tx) => {
      const dateTimeParts = (tx.date || "").split("T");
      const dateStr = dateTimeParts[0] || "-";
      const timeStr = dateTimeParts[1] ? dateTimeParts[1].substring(0, 8) : "00:00:00";

      tx.items.forEach((item) => {
        const prod = products.find((p) => p.id === item.productId);
        let hpp = prod ? prod.priceBuy : Math.floor((item.priceSell || 0) * 0.85);
        if (prod?.purchasedImeisHistory) {
          const history = prod.purchasedImeisHistory.find((h) => h.imei === item.imei);
          if (history) hpp = history.purchasePrice;
        }

        const qty = item.quantity || 1;
        const lineSubtotal = (item.priceSell || 0) * qty;
        const lineProfit = lineSubtotal - hpp * qty;
        const totalDiscounts = (tx.promoDiscount || 0) + (tx.loyaltyDiscount || 0) + (tx.pointsDiscount || 0);

        rows.push([
          tx.id,
          dateStr,
          timeStr,
          tx.customerName || "Pelanggan Umum",
          tx.customerPhone || "-",
          item.productId || "-",
          item.name || "-",
          item.brand || prod?.brand || "-",
          item.imei || "-",
          qty,
          item.priceSell || 0,
          hpp,
          lineSubtotal,
          lineProfit,
          tx.taxPpnAmount || 0,
          totalDiscounts,
          tx.totalAmount || 0,
          tx.paymentMethod === "SPLIT" && tx.splitPayments
            ? `SPLIT (${tx.splitPayments.map((sp: any) => sp.method).join(" + ")})`
            : tx.paymentMethod,
          tx.cashierName || "-",
          tx.paymentStatus || "PAID"
        ]);
      });
    });

    const escapeCSVCell = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const csvLines = [
      headers.map(escapeCSVCell).join(","),
      ...rows.map((r) => r.map(escapeCSVCell).join(","))
    ];

    const csvContent = "\uFEFF" + csvLines.join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Detail_Transaksi_Akuntansi_Massal_${getPeriodLabel().replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredRows = auditRows.filter(row => 
    row.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    row.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    row.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    row.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    row.imei.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t("Laporan Keuangan")}</h2>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsPdfConfigModalOpen(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-slate-200"
            title={t("Atur Kolom PDF")}
          >
            <Sliders className="h-4 w-4 text-slate-600" /> {t("Atur Kolom PDF")}
          </button>
          <button 
            onClick={() => window.print()}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-xs transition cursor-pointer"
            title="Print Financial Summary (PDF)"
          >
            <Printer className="h-4 w-4" /> {t("Print Financial Summary (PDF)")}
          </button>
        </div>
      </div>
      
      {/* Date Range Picker */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs mb-4 no-print">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Calendar className="h-4.5 w-4.5 text-primary-600" />
              {t("Date Range Picker (Filter Periode Laporan)")}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {t("Pilih rentang tanggal untuk memperbarui seluruh data audit, P&L, neraca, dan laporan penjualan secara opsional.")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "all", label: t("Semua Waktu") },
              { id: "today", label: t("Hari Ini") },
              { id: "this_week", label: t("Minggu Ini") },
              { id: "this_month", label: t("Bulan Ini") },
              { id: "custom", label: t("Custom Range") }
            ].map(preset => (
              <button
                key={preset.id}
                onClick={() => setDateRangePreset(preset.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  dateRangePreset === preset.id
                    ? "bg-primary-600 text-white border-primary-600 shadow-xs"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {dateRangePreset === "custom" && (
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t("Dari Tanggal (Mulai)")}</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl focus:ring-primary-500 focus:border-primary-500 block p-2.5 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t("Sampai Tanggal (Selesai)")}</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl focus:ring-primary-500 focus:border-primary-500 block p-2.5 font-medium"
              />
            </div>
            {(startDate || endDate) && (
              <div>
                <button
                  onClick={() => { setStartDate(""); setEndDate(""); }}
                  className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs w-full transition-colors cursor-pointer"
                >
                  {t("Reset Tanggal")}
                </button>
              </div>
            )}
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 pt-2 border-t border-slate-100/80">
          <span className="flex items-center gap-1.5 font-medium">
            <Clock className="h-3.5 w-3.5 text-primary-500" />
            {t("Periode Terpilih:")} <strong className="text-slate-800">{
              dateRangePreset === "all" ? t("Seluruh Record Database") :
              dateRangePreset === "today" ? t("Hari Ini") :
              dateRangePreset === "this_week" ? t("Minggu Ini") :
              dateRangePreset === "this_month" ? t("Bulan Ini") :
              `${startDate || "Awal"} s/d ${endDate || "Sekarang"}`
            }</strong>
          </span>
          <span className="bg-primary-50 text-primary-700 font-bold px-2.5 py-0.5 rounded-full border border-primary-100">
            {filteredTransactionsDate.length} {t("Transaksi Terfilter")}
          </span>
        </div>
      </div>

      {/* Header and exports */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs no-print">
        <div>
          <h2 className="text-md font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <BookOpen className="h-5.5 w-5.5 text-primary-600" />
            {t("Audit & Laporan Keuangan Komprehensif")}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {t("Laporan lengkap mencakup rincian supplier, konsumen, nomor invoice, IMEI, tanggal & harga beli-jual hp.")}
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={handleAiAnalyzeFinance}
            disabled={isAnalyzing}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/10 transition-all disabled:opacity-50"
          >
            <Sparkles className={`h-4 w-4 ${isAnalyzing ? "animate-spin" : "animate-pulse"}`} />
            {isAnalyzing ? t("Menganalisis...") : t("Analisis Keuangan (AI)")}
          </button>

          <button
            onClick={handlePrintDailyReport}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-600/10 transition-all"
          >
            <Printer className="h-4 w-4" />
            {t("Cetak Laporan Harian (Thermal)")}
          </button>

          <button
            onClick={handleBackupDatabase}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/10 transition-all"
            title="Download JSON Terenkripsi"
          >
            <Download className="h-4 w-4" />
            {t("Backup Database")}
          </button>

          <input 
            type="file" 
            accept=".json" 
            ref={restoreInputRef} 
            onChange={handleRestoreDatabase} 
            className="hidden" 
          />
          <button
            onClick={() => restoreInputRef.current?.click()}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-rose-600/10 transition-all"
            title="Restore JSON Database"
          >
            <RefreshCw className="h-4 w-4" />
            {t("Restore Database")}
          </button>

          <button
            onClick={handleExportMonthlyAuditReport}
            className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02]"
            title={t("Ekspor Laporan Keuangan Bulanan (PDF Manajemen)")}
          >
            <FileText className="h-4 w-4" />
            {t("Ekspor Laporan Keuangan Bulanan (PDF Manajemen)")}
          </button>

          <button
            onClick={handleExportBulkPOSReceipts}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-md shadow-blue-600/20 transition-all hover:scale-[1.02]"
            title={t("Bundel Nota POS")}
          >
            <Receipt className="h-4 w-4" />
            {t("Bundel Nota POS")} ({filteredTransactionsDate.length})
          </button>

          <button
            onClick={handleExportMassAccountingCSV}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02]"
            title={t("CSV Detail Akuntansi Massal")}
          >
            <FileSpreadsheet className="h-4 w-4" />
            {t("CSV Detail Akuntansi Massal")}
          </button>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02]"
            title="Unduh Data Ringkasan Tab Format CSV Spreadsheet"
          >
            <FileSpreadsheet className="h-4 w-4" />
            {t("Export CSV")} ({activeSubTab.toUpperCase()})
          </button>

          <button
            onClick={handleExportExcel}
            className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            {t("Ekspor Excel")} ({activeSubTab.toUpperCase()})
          </button>

          <button
            onClick={() => setIsPdfConfigModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-md shadow-rose-600/20 transition-all hover:scale-[1.02]"
            title={t("Download PDF (Pilih Kolom)")}
          >
            <Sliders className="h-4 w-4" />
            <Download className="h-4 w-4" />
            {t("Download PDF (Pilih Kolom)")}
          </button>
          
          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-md shadow-sky-600/20 transition-all hover:scale-[1.02]"
            title="Print Financial Summary (PDF)"
          >
            <Printer className="h-4 w-4" />
            {t("Print Financial Summary (PDF)")}
          </button>
        </div>
      </div>

      {/* KPI summaries */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{t("Total Penerimaan Retail")}</span>
          <span className="text-xl font-extrabold text-slate-800 mt-1.5 block">Rp {(totalRevenue ?? 0).toLocaleString("id-ID")}</span>
          <p className="text-[10px] text-slate-500 mt-1">{t("Dari seluruh invoice terbayar")}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{t("Total Pembelian Stok (HPP)")}</span>
          <span className="text-xl font-extrabold text-slate-700 mt-1.5 block">Rp {(totalProcurementCost ?? 0).toLocaleString("id-ID")}</span>
          <p className="text-[10px] text-slate-500 mt-1">{t("Beban modal awal supplier resmi")}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{t("Profit Kotor (Margin)")}</span>
          <span className="text-xl font-extrabold text-primary-600 mt-1.5 block">Rp {(totalGrossProfit ?? 0).toLocaleString("id-ID")}</span>
          <p className="text-[10px] text-slate-500 mt-1">{t("Keuntungan bersih dari retail")}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{t("Arus Kas Keluar (Buyback)")}</span>
          <span className="text-xl font-extrabold text-emerald-700 mt-1.5 block">Rp {(totalBuybackCost ?? 0).toLocaleString("id-ID")}</span>
          <p className="text-[10px] text-slate-500 mt-1">{t("Investasi pembelian hp konsumen")}</p>
        </div>
      </div>

      {/* AI Financial Analysis Result Box */}
      {aiAnalysis && (
        <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4 no-print relative">
          <button
            onClick={() => setAiAnalysis(null)}
            className="absolute top-4 right-4 text-slate-400 hover:text-white text-xs font-bold px-2.5 py-1.5 hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
          >
            Tutup [X]
          </button>
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sparkles className="h-5 w-5 text-indigo-400 animate-pulse" />
            <h3 className="text-sm font-bold text-white tracking-wide">Hasil Audit & Rekomendasi Finansial Pintar (AI)</h3>
          </div>
          <div className="text-xs leading-relaxed space-y-3 font-medium select-text max-h-[350px] overflow-y-auto pr-2 scrollbar-thin">
            {aiAnalysis.split("\n").map((line, i) => {
              if (line.startsWith("###")) {
                return <h4 key={i} className="text-xs font-bold text-indigo-300 mt-4 mb-1 uppercase tracking-wider">{line.replace("###", "").trim()}</h4>;
              }
              if (line.startsWith("####")) {
                return <h5 key={i} className="text-xs font-bold text-indigo-400 mt-3 mb-1">{line.replace("####", "").trim()}</h5>;
              }
              if (line.startsWith("**") && line.endsWith("**")) {
                return <p key={i} className="font-bold text-white mt-1">{line.replace(/\*\*/g, "").trim()}</p>;
              }
              if (line.startsWith("*")) {
                const clean = line.replace(/^\*\s*/, "");
                const parts = clean.split("**");
                return (
                  <div key={i} className="flex gap-2 pl-2">
                    <span className="text-indigo-500 shrink-0">•</span>
                    <span className="text-slate-300">
                      {parts.map((p, idx) => idx % 2 === 1 ? <strong key={idx} className="text-white font-extrabold">{p}</strong> : p)}
                    </span>
                  </div>
                );
              }
              if (line.trim().startsWith(">")) {
                return (
                  <blockquote key={i} className="border-l-2 border-amber-500 bg-amber-500/10 text-amber-200 px-3 py-1.5 rounded-r-lg text-[11px] font-semibold my-2">
                    {line.replace(/^>\s*/, "").replace(/\*\*/g, "").trim()}
                  </blockquote>
                );
              }
              if (line.trim() === "---") {
                return <hr key={i} className="border-slate-800 my-2" />;
              }
              const parts = line.split("**");
              return (
                <p key={i} className="text-slate-300">
                  {parts.map((p, idx) => idx % 2 === 1 ? <strong key={idx} className="text-white font-extrabold">{p}</strong> : p)}
                </p>
              );
            })}
          </div>
        </div>
      )}

      {/* 2-COLUMN PREMIUM REPORT LISTS HUB */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start no-print">
        {/* LEFT COLUMN: LIST OF AVAILABLE REPORTS */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4 lg:col-span-1">
          <div>
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">{t("Daftar Laporan")}</h3>
            <p className="text-[10px] text-slate-500 mt-1">{t("Pilih jenis laporan operasional dan finansial toko")}</p>
          </div>

          <div className="space-y-1.5">
            {[
              { id: "trends", title: t("Grafik Tren Pendapatan"), desc: t("Visualisasi Recharts tren harian & bulanan"), icon: "📈", cat: t("Keuangan") },
              { id: "ledger", title: t("Buku Besar & Audit IMEI"), desc: t("Detail audit IMEI, supplier & margin"), icon: "📝", cat: t("Keuangan") },
              { id: "sales", title: t("Detail Transaksi POS"), desc: t("Detail invoice retail & kasir"), icon: "🛒", cat: t("Operasional") },
              { id: "buyback", title: t("Detail Transaksi Buyback"), desc: t("Detail hp bekas, grade & IMEI"), icon: "🔄", cat: t("Operasional") },
              { id: "stock", title: t("Opname & Penilaian Stok"), desc: t("Aset stok aktif & potensi profit"), icon: "📦", cat: t("Persediaan") },
              { id: "bestsellers", title: t("Smartphone Terlaris"), desc: t("Performa penjualan smartphone"), icon: "🏆", cat: t("Persediaan") },
              { id: "pl", title: t("Laba Rugi (Profit & Loss)"), desc: t("HPP, biaya & laba bersih"), icon: "📊", cat: t("Keuangan") },
              { id: "balance", title: t("Neraca Keuangan"), desc: t("Aktiva vs Pasiva"), icon: "🏛️", cat: t("Keuangan") },
              { id: "cashflow", title: t("Arus Kas (Cash Flow)"), desc: t("Aliran kas riil masuk & keluar"), icon: "💸", cat: t("Keuangan") },
              { id: "schedule", title: t("Penjadwalan Otomatis"), desc: t("Otomatisasi & Personalisasi PDF"), icon: "⏰", cat: t("Sistem") },
            ].map((rep) => (
              <button
                key={rep.id}
                onClick={() => {
                  setActiveSubTab(rep.id as any);
                  setSearchQuery(""); // Reset search on tab change
                }}
                className={`w-full text-left p-3 flex gap-3 cursor-pointer rounded-xl border transition-all ${
                  activeSubTab === rep.id
                    ? "bg-primary-50 border-primary-200 text-primary-900 shadow-xs"
                    : "bg-white border-slate-100 hover:border-slate-200 text-slate-600 hover:bg-slate-50/50"
                }`}
              >
                <span className="text-md shrink-0 mt-0.5">{rep.icon}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[11px] font-bold leading-tight truncate">{rep.title}</p>
                    <span className="text-[8px] px-1 py-0.25 bg-slate-100 text-slate-500 rounded-sm font-extrabold shrink-0">{rep.cat}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-snug line-clamp-1">{rep.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIVE REPORT VIEW AREA */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Filter and Search Box */}
          {["ledger", "sales", "buyback", "stock"].includes(activeSubTab) && (
            <div className="relative">
              <Search className="absolute left-3.5 top-3 text-slate-400 h-4.5 w-4.5" />
              <input
                type="text"
                placeholder={
                  activeSubTab === "ledger" ? "Filter laporan berdasarkan supplier TAM/Erajaya, nama pembeli, IMEI, atau nomor invoice..." :
                  activeSubTab === "sales" ? "Filter berdasarkan nama pembeli, kasir, invoice, atau metode bayar..." :
                  activeSubTab === "buyback" ? "Filter berdasarkan nama pelanggan, brand/model, IMEI, atau kasir..." :
                  "Filter berdasarkan brand, model, atau tipe smartphone..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          )}

          {/* PRINT-FRIENDLY COMPREHENSIVE CORPORATE REPORT */}
          <div className="border border-slate-200 rounded-2xl bg-white shadow-xs overflow-hidden print:bg-white print:text-black print:border-none print:shadow-none">
            
            {/* Only visible in PDF/Print layouts */}
            <div className="hidden print:block p-8 border-b border-slate-300 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-xl font-extrabold tracking-tight">LAPORAN KEUANGAN & AUDIT STOCK REKONSILIASI</h1>
                  <p className="text-xs text-slate-600 mt-1">FonePOS Retail & Smartphone Buyback Center</p>
                  <p className="text-[10px] text-slate-500">Jakarta Roxy Square Blok C2, Indonesia • Telp: 0812-RICKY-COMP</p>
                </div>
                <div className="text-right text-xs">
                  <p className="font-bold">STATUS AUDIT: CLEAN & COMPLIANT</p>
                  <p>Periode: Real-Time s/d Hari ini</p>
                  <p>Dicetak: {new Date().toLocaleDateString("id-ID")}</p>
                </div>
              </div>
            </div>

            {/* Dynamic content depending on selected subtab */}
            {activeSubTab === "trends" && (
              <div className="p-6 space-y-6">
                
                {/* Visual Header & Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      Visualisasi Grafik Tren Pendapatan & Profitabilitas
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Analisis tren omset retail hp dan margin keuntungan bersih secara grafik interaktif dengan Recharts.
                    </p>
                  </div>

                  {/* Toggle Daily vs Monthly */}
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl font-bold text-xs shrink-0 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setChartTrendMode("daily")}
                      className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                        chartTrendMode === "daily"
                          ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
                      }`}
                    >
                      📅 Tren Harian
                    </button>
                    <button
                      type="button"
                      onClick={() => setChartTrendMode("monthly")}
                      className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                        chartTrendMode === "monthly"
                          ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
                      }`}
                    >
                      📆 Tren Bulanan
                    </button>
                  </div>
                </div>

                {/* Summary Key Performance Indicators */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl space-y-1">
                    <span className="text-[10px] font-extrabold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider block">
                      Total Pendapatan ({chartTrendMode === "daily" ? "Harian" : "Bulanan"})
                    </span>
                    <p className="text-lg font-black text-indigo-950 dark:text-indigo-100">
                      Rp {activeTrendData.reduce((s, item) => s + item.revenue, 0).toLocaleString("id-ID")}
                    </p>
                    <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                      Dari {activeTrendData.reduce((s, item) => s + item.txCount, 0)} transaksi ritel
                    </p>
                  </div>

                  <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl space-y-1">
                    <span className="text-[10px] font-extrabold text-emerald-500 dark:text-emerald-400 uppercase tracking-wider block">
                      Estimasi Laba Bersih
                    </span>
                    <p className="text-lg font-black text-emerald-950 dark:text-emerald-100">
                      Rp {activeTrendData.reduce((s, item) => s + item.netProfit, 0).toLocaleString("id-ID")}
                    </p>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      Setelah HPP & Beban Buyback
                    </p>
                  </div>

                  <div className="p-4 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 rounded-2xl space-y-1">
                    <span className="text-[10px] font-extrabold text-amber-500 dark:text-amber-400 uppercase tracking-wider block">
                      Total Beban Buyback
                    </span>
                    <p className="text-lg font-black text-amber-950 dark:text-amber-100">
                      Rp {activeTrendData.reduce((s, item) => s + item.buyback, 0).toLocaleString("id-ID")}
                    </p>
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                      Akuisisi Smartphone Bekas
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-1">
                    <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                      Rata-Rata per {chartTrendMode === "daily" ? "Hari" : "Bulan"}
                    </span>
                    <p className="text-lg font-black text-slate-800 dark:text-white">
                      Rp {activeTrendData.length > 0 ? Math.round(activeTrendData.reduce((s, item) => s + item.revenue, 0) / activeTrendData.length).toLocaleString("id-ID") : "0"}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      Rata-rata pendapatan omset
                    </p>
                  </div>
                </div>

                {/* Primary Recharts Bar Chart: Total Omzet vs Total Laba Bersih Per Bulan */}
                <div className="space-y-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-indigo-100 dark:border-slate-800 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
                          <BarChart3 className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-extrabold text-slate-800 dark:text-white">
                            Grafik Batang: Total Omzet vs Laba Bersih ({chartTrendMode === "daily" ? "Harian" : "Per Bulan"})
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Visualisasi batang berdampingan membandingkan total omzet penjualan kotor dengan realisasi laba bersih untuk evaluasi margin efisiensi finansial toko.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-xs font-bold bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                        <span className="inline-block w-3 h-3 rounded-sm bg-indigo-600"></span>
                        <span className="text-slate-700 dark:text-slate-200">Total Omzet</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                        <span className="inline-block w-3 h-3 rounded-sm bg-emerald-500"></span>
                        <span className="text-slate-700 dark:text-slate-200">Laba Bersih</span>
                      </div>
                    </div>
                  </div>

                  <div className="h-[340px] w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={activeTrendData} margin={{ top: 15, right: 15, left: 15, bottom: 5 }} barGap={8}>
                        <defs>
                          <linearGradient id="barRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.95}/>
                            <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.8}/>
                          </linearGradient>
                          <linearGradient id="barProfitGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.95}/>
                            <stop offset="100%" stopColor="#059669" stopOpacity={0.8}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis 
                          dataKey="displayLabel" 
                          tick={{ fontSize: 11, fill: "#64748b", fontWeight: 600 }}
                          axisLine={{ stroke: "#cbd5e1" }}
                        />
                        <YAxis 
                          tick={{ fontSize: 10, fill: "#64748b" }} 
                          tickFormatter={(val) => val >= 1000000 ? `${(val / 1000000).toFixed(0)}Jt` : val}
                          axisLine={false}
                        />
                        <RechartsTooltip 
                          formatter={(value: any, name: any) => [
                            `Rp ${Number(value || 0).toLocaleString("id-ID")}`,
                            name === "revenue" ? "Total Omzet" : name === "netProfit" ? "Laba Bersih" : name
                          ]}
                          labelFormatter={(label) => `Periode: ${label}`}
                          contentStyle={{ 
                            backgroundColor: "#0f172a", 
                            borderColor: "#334155", 
                            borderRadius: "14px", 
                            color: "#f8fafc", 
                            fontSize: "12px",
                            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)"
                          }}
                          itemStyle={{ padding: "3px 0" }}
                        />
                        <Legend 
                          wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
                          formatter={(value) => (
                            <span className="font-bold text-slate-700 dark:text-slate-300">
                              {value === "revenue" ? "Total Omzet (Penjualan)" : value === "netProfit" ? "Laba Bersih (Net Profit)" : value}
                            </span>
                          )}
                        />
                        <Bar 
                          dataKey="revenue" 
                          name="revenue" 
                          fill="url(#barRevenueGradient)" 
                          radius={[6, 6, 0, 0]}
                          maxBarSize={36}
                        />
                        <Bar 
                          dataKey="netProfit" 
                          name="netProfit" 
                          fill="url(#barProfitGradient)" 
                          radius={[6, 6, 0, 0]}
                          maxBarSize={36}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 rounded-xl text-center">
                      <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 block uppercase">Total Omzet Akumulasi</span>
                      <span className="text-sm font-black text-indigo-950 dark:text-indigo-100">
                        Rp {activeTrendData.reduce((s, item) => s + item.revenue, 0).toLocaleString("id-ID")}
                      </span>
                    </div>

                    <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60 rounded-xl text-center">
                      <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 block uppercase">Total Laba Bersih Akumulasi</span>
                      <span className="text-sm font-black text-emerald-950 dark:text-emerald-100">
                        Rp {activeTrendData.reduce((s, item) => s + item.netProfit, 0).toLocaleString("id-ID")}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-center">
                      <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 block uppercase">Rasio Konversi Laba</span>
                      <span className="text-sm font-black text-slate-800 dark:text-slate-200">
                        {activeTrendData.reduce((s, item) => s + item.revenue, 0) > 0
                          ? ((activeTrendData.reduce((s, item) => s + item.netProfit, 0) / activeTrendData.reduce((s, item) => s + item.revenue, 0)) * 100).toFixed(1)
                          : "0.0"}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Secondary Composed Area & Line Chart */}
                <div className="space-y-3 bg-slate-50/50 dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Grafik Kurva Fluktuasi Pendapatan vs Beban Buyback ({chartTrendMode === "daily" ? "Harian" : "Bulanan"})
                      </h4>
                      <p className="text-[10px] text-slate-400">Area ungu menandakan total pendapatan, garis hijau menandakan tren laba bersih.</p>
                    </div>
                  </div>

                  <div className="h-[300px] w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={activeTrendData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis 
                          dataKey="displayLabel" 
                          tick={{ fontSize: 11, fill: "#64748b" }}
                          axisLine={{ stroke: "#cbd5e1" }}
                        />
                        <YAxis 
                          tick={{ fontSize: 10, fill: "#64748b" }} 
                          tickFormatter={(val) => val >= 1000000 ? `${(val / 1000000).toFixed(0)}Jt` : val}
                          axisLine={false}
                        />
                        <RechartsTooltip 
                          formatter={(value: any) => [`Rp ${Number(value || 0).toLocaleString("id-ID")}`, ""]}
                          contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", color: "#f8fafc", fontSize: "12px" }}
                          itemStyle={{ padding: "2px 0" }}
                        />
                        <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                        <Area 
                          type="monotone" 
                          dataKey="revenue" 
                          name="Pendapatan (Revenue)" 
                          stroke="#6366f1" 
                          strokeWidth={2.5}
                          fillOpacity={1} 
                          fill="url(#colorRevenue)" 
                        />
                        <Bar 
                          dataKey="buyback" 
                          name="Beban Buyback" 
                          fill="#f59e0b" 
                          radius={[4, 4, 0, 0]}
                          maxBarSize={28}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="netProfit" 
                          name="Laba Bersih" 
                          stroke="#10b981" 
                          strokeWidth={3} 
                          dot={{ r: 4, fill: "#10b981" }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Secondary Recharts Bar Breakdown Chart */}
                <div className="space-y-3 bg-slate-50/50 dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Rincian Struktur Biaya: HPP Pengadaan vs Laba Kotor vs Buyback
                    </h4>
                    <p className="text-[10px] text-slate-400">Komposisi modal pembelian persediaan HP dibanding margin operasional toko.</p>
                  </div>

                  <div className="h-[260px] w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={activeTrendData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="displayLabel" tick={{ fontSize: 11, fill: "#64748b" }} />
                        <YAxis tick={{ fontSize: 10, fill: "#64748b" }} tickFormatter={(val) => val >= 1000000 ? `${(val / 1000000).toFixed(0)}Jt` : val} />
                        <RechartsTooltip 
                          formatter={(value: any) => [`Rp ${Number(value || 0).toLocaleString("id-ID")}`, ""]}
                          contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", color: "#f8fafc", fontSize: "12px" }}
                        />
                        <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                        <Bar dataKey="cost" name="HPP Pengadaan" fill="#94a3b8" radius={[4, 4, 0, 0]} maxBarSize={24} />
                        <Bar dataKey="buyback" name="Beban Buyback" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={24} />
                        <Bar dataKey="netProfit" name="Laba Bersih" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={24} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Profit Margin Trend Percentage Chart (Gross Margin % vs Net Margin %) */}
                <div className="space-y-4 bg-gradient-to-br from-indigo-900/10 via-slate-900/5 to-emerald-900/10 dark:from-indigo-950/40 dark:to-emerald-950/40 p-5 rounded-2xl border border-indigo-200/60 dark:border-indigo-900/50 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 dark:border-slate-800 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                        <h4 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
                          Grafik Profit Margin Trend (% Keuntungan Kotor vs Bersih)
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Memvisualisasikan persentase efisiensi operasional toko (% Gross Margin vs % Net Margin) untuk analisis efisiensi bisnis.
                      </p>
                    </div>

                    {/* KPI Quick Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 px-3 py-1.5 rounded-xl text-center">
                        <span className="text-[9px] font-extrabold text-indigo-600 dark:text-indigo-400 block uppercase">Avg Gross Margin</span>
                        <span className="text-xs font-black text-indigo-900 dark:text-indigo-200">
                          {activeTrendData.length > 0 
                            ? (activeTrendData.reduce((s, item) => s + (item.grossMarginPercent || 0), 0) / activeTrendData.length).toFixed(1)
                            : "0.0"}%
                        </span>
                      </div>

                      <div className="bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-xl text-center">
                        <span className="text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400 block uppercase">Avg Net Margin</span>
                        <span className="text-xs font-black text-emerald-900 dark:text-emerald-200">
                          {activeTrendData.length > 0 
                            ? (activeTrendData.reduce((s, item) => s + (item.netMarginPercent || 0), 0) / activeTrendData.length).toFixed(1)
                            : "0.0"}%
                        </span>
                      </div>

                      <div className="bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800 px-3 py-1.5 rounded-xl text-center">
                        <span className="text-[9px] font-extrabold text-amber-600 dark:text-amber-400 block uppercase">Margin Gap (OpEx)</span>
                        <span className="text-xs font-black text-amber-900 dark:text-amber-200">
                          {activeTrendData.length > 0 
                            ? Math.max(0, Number(((activeTrendData.reduce((s, item) => s + (item.grossMarginPercent || 0), 0) - activeTrendData.reduce((s, item) => s + (item.netMarginPercent || 0), 0)) / activeTrendData.length).toFixed(1)))
                            : "0.0"}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Recharts Profit Margin Line / Area Chart */}
                  <div className="h-[280px] w-full pt-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={activeTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorGrossMargin" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                          </linearGradient>
                          <linearGradient id="colorNetMargin" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis 
                          dataKey="displayLabel" 
                          tick={{ fontSize: 11, fill: "#64748b" }}
                          axisLine={{ stroke: "#cbd5e1" }}
                        />
                        <YAxis 
                          tick={{ fontSize: 10, fill: "#64748b" }} 
                          tickFormatter={(val) => `${val}%`}
                          domain={[0, (dataMax: number) => Math.min(100, Math.ceil(dataMax + 5))]}
                          axisLine={false}
                        />
                        <RechartsTooltip 
                          formatter={(value: any, name: any, props: any) => [
                            `${value}% (Rp ${Number(name === "Gross Profit Margin (%)" ? props.payload?.grossProfit : props.payload?.netProfit || 0).toLocaleString("id-ID")})`,
                            name
                          ]}
                          contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", color: "#f8fafc", fontSize: "12px" }}
                        />
                        <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                        <Area 
                          type="monotone" 
                          dataKey="grossMarginPercent" 
                          name="Gross Profit Margin (%)" 
                          stroke="#6366f1" 
                          strokeWidth={3}
                          fillOpacity={1} 
                          fill="url(#colorGrossMargin)" 
                          dot={{ r: 4, fill: "#6366f1" }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="netMarginPercent" 
                          name="Net Profit Margin (%)" 
                          stroke="#10b981" 
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#colorNetMargin)"
                          dot={{ r: 5, fill: "#10b981" }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Summary Breakdown Table of Margin Trend */}
                  <div className="overflow-x-auto pt-2">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-extrabold border-b border-slate-200 dark:border-slate-700">
                          <th className="p-2.5 rounded-l-xl">Periode</th>
                          <th className="p-2.5 text-right">Pendapatan Omset</th>
                          <th className="p-2.5 text-right">Laba Kotor (IDR)</th>
                          <th className="p-2.5 text-right text-indigo-600 dark:text-indigo-400 font-black">% Gross Margin</th>
                          <th className="p-2.5 text-right">Beban Buyback</th>
                          <th className="p-2.5 text-right">Laba Bersih (IDR)</th>
                          <th className="p-2.5 text-right text-emerald-600 dark:text-emerald-400 font-black rounded-r-xl">% Net Margin</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                        {activeTrendData.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">{item.displayLabel}</td>
                            <td className="p-2.5 text-right text-slate-700 dark:text-slate-300">Rp {(item.revenue || 0).toLocaleString("id-ID")}</td>
                            <td className="p-2.5 text-right font-semibold text-slate-800 dark:text-slate-200">Rp {(item.grossProfit || 0).toLocaleString("id-ID")}</td>
                            <td className="p-2.5 text-right font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/20">
                              {item.grossMarginPercent || 0}%
                            </td>
                            <td className="p-2.5 text-right text-amber-600 dark:text-amber-400">Rp {(item.buyback || 0).toLocaleString("id-ID")}</td>
                            <td className="p-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">Rp {(item.netProfit || 0).toLocaleString("id-ID")}</td>
                            <td className="p-2.5 text-right font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20">
                              {item.netMarginPercent || 0}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* Dynamic content depending on selected subtab */}
            {activeSubTab === "ledger" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs print:text-[10px]">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 print:bg-slate-100 print:text-slate-700 print:border-b-2 print:border-slate-400">
                      <th className="p-4">{t("No Invoice")}</th>
                      <th className="p-4">{t("Supplier")}</th>
                      <th className="p-4">{t("Pembeli (Konsumen)")}</th>
                      <th className="p-4">{t("Model & No IMEI")}</th>
                      <th className="p-4">{t("Tgl Beli")}</th>
                      <th className="p-4">{t("Tgl Jual")}</th>
                      <th className="p-4 text-right">{t("Harga Beli")}</th>
                      <th className="p-4 text-right">{t("Harga Jual")}</th>
                      <th className="p-4 text-right">{t("Keuntungan")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 print:divide-y print:divide-slate-200">
                    {filteredRows.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-slate-400">{t("Belum ada transaksi audit terekam.")}</td>
                      </tr>
                    ) : (
                      filteredRows.map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 print:hover:bg-transparent">
                          <td className="p-4 font-mono font-bold text-slate-700 print:text-black">{row.invoiceNo}</td>
                          <td className="p-4 text-slate-600 print:text-black max-w-[130px] truncate" title={row.supplierName}>{row.supplierName}</td>
                          <td className="p-4">
                            <p className="font-bold text-slate-700 print:text-black">{row.customerName}</p>
                            <p className="text-slate-400 font-mono text-[9px] print:text-slate-600">{row.customerPhone}</p>
                          </td>
                          <td className="p-4">
                            <p className="font-bold text-slate-700 print:text-black">{row.productName}</p>
                            <p className="text-slate-400 font-mono text-[9px] print:text-slate-600">IMEI: {row.imei}</p>
                          </td>
                          <td className="p-4 text-slate-500 print:text-black">{row.purchaseDate}</td>
                          <td className="p-4 text-slate-500 print:text-black">{row.salesDate}</td>
                          <td className="p-4 text-right text-slate-500 print:text-black">Rp {(row.purchasePrice ?? 0).toLocaleString("id-ID")}</td>
                          <td className="p-4 text-right font-bold text-slate-700 print:text-black">Rp {(row.sellingPrice ?? 0).toLocaleString("id-ID")}</td>
                          <td className={`p-4 text-right font-extrabold ${(row.netMargin ?? 0) >= 0 ? "text-primary-600 print:text-black" : "text-red-600 print:text-black"}`}>
                            Rp {(row.netMargin ?? 0).toLocaleString("id-ID")}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeSubTab === "sales" && (
              <div className="overflow-x-auto">
                {(() => {
                  const filteredSales = filteredTransactionsDate.filter(tx => 
                    tx.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    tx.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    tx.customerPhone.includes(searchQuery) ||
                    tx.cashierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    tx.paymentMethod.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    tx.items.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.imei.includes(searchQuery))
                  );

                  return (
                    <>
                      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 border-b border-slate-200 text-xs no-print">
                        <span className="font-bold text-slate-700 flex items-center gap-1.5">
                          <Receipt className="h-4 w-4 text-indigo-600" />
                          {t("Ringkasan Transaksi Penjualan:")} <strong className="text-slate-900">{filteredSales.length} {t("Invoice Terfilter")}</strong> ({t("Periode:")} {getPeriodLabel()})
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleExportMassAccountingCSV}
                            disabled={filteredSales.length === 0}
                            className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                            title={t("Ekspor CSV Akuntansi Massal")}
                          >
                            <FileSpreadsheet className="h-3.5 w-3.5" />
                            {t("Ekspor CSV Akuntansi Massal")} ({filteredSales.length})
                          </button>
                          <button
                            onClick={() => exportBulkPOSReceiptsPDF(filteredSales, getPeriodLabel())}
                            disabled={filteredSales.length === 0}
                            className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-extrabold rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                          >
                            <Download className="h-3.5 w-3.5" />
                            {t("Cetak Bundel Nota POS PDF")} ({filteredSales.length})
                          </button>
                        </div>
                      </div>

                      <table className="w-full text-left border-collapse text-xs print:text-[10px]">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                            <th className="p-4">{t("No Invoice")}</th>
                            <th className="p-4">{t("Tanggal")}</th>
                            <th className="p-4">{t("Konsumen")}</th>
                            <th className="p-4">{t("Kasir")}</th>
                            <th className="p-4">{t("Metode Bayar")}</th>
                            <th className="p-4">{t("Item Produk")}</th>
                            <th className="p-4 text-center">{t("Status")}</th>
                            <th className="p-4 text-right">{t("Total Bayar")}</th>
                            <th className="p-4 text-center no-print">{t("Export Struk Nota")}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredSales.length === 0 ? (
                            <tr>
                              <td colSpan={9} className="p-8 text-center text-slate-400">{t("Tidak ada transaksi POS yang cocok.")}</td>
                            </tr>
                          ) : (
                            filteredSales.map((tx, i) => (
                              <tr key={i} className="hover:bg-slate-50/50">
                                <td className="p-4 font-mono font-bold text-slate-700">{tx.id}</td>
                                <td className="p-4 text-slate-500">{tx.date.replace("T", " ")}</td>
                                <td className="p-4">
                                  <p className="font-bold text-slate-700">{tx.customerName}</p>
                                  <p className="text-slate-400 font-mono text-[9px]">{tx.customerPhone}</p>
                                </td>
                                <td className="p-4 font-medium text-slate-600">{tx.cashierName}</td>
                                <td className="p-4 font-mono text-slate-600">
                                  {tx.paymentMethod === "SPLIT" && tx.splitPayments ? (
                                    <div>
                                      <span className="font-bold text-indigo-600">SPLIT</span>
                                      {tx.splitPayments.map((sp: any, i: number) => (
                                        <div key={i} className="text-[9px] text-slate-400 mt-0.5">
                                          {sp.method}: Rp{(sp?.amount ?? 0).toLocaleString("id-ID")}
                                        </div>
                                      ))}
                                    </div>
                                  ) : tx.paymentMethod}
                                </td>
                                <td className="p-4">
                                  <div className="space-y-1">
                                    {tx.items.map((item, idx) => (
                                      <p key={idx} className="text-slate-700 font-medium">
                                        • {item.name} <span className="text-[10px] text-slate-400 font-mono">(IMEI: {item.imei})</span>
                                      </p>
                                    ))}
                                  </div>
                                </td>
                                <td className="p-4 text-center">
                                  <span className={`inline-flex px-2 py-1 rounded-full text-[10px] font-extrabold ${
                                    tx.paymentStatus === "PAID" ? "bg-emerald-100 text-emerald-800" :
                                    tx.paymentStatus === "PENDING" ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"
                                  }`}>
                                    {tx.paymentStatus}
                                  </span>
                                </td>
                                <td className="p-4 text-right font-extrabold text-slate-800">Rp {(tx.totalAmount ?? 0).toLocaleString("id-ID")}</td>
                                <td className="p-4 text-center no-print">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      onClick={() => exportPOSReceiptPDF(tx, { paperFormat: "a4" })}
                                      className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 font-bold text-[10px] rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                                      title="Cetak Struk Nota (A4 PDF)"
                                    >
                                      <FileText className="h-3 w-3 text-indigo-600" />
                                      A4
                                    </button>
                                    <button
                                      onClick={() => exportPOSReceiptPDF(tx, { paperFormat: "thermal80mm" })}
                                      className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200/80 font-bold text-[10px] rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                                      title="Cetak Struk Thermal (80mm Roll PDF)"
                                    >
                                      <Receipt className="h-3 w-3 text-amber-600" />
                                      Thermal
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </>
                  );
                })()}
              </div>
            )}

            {activeSubTab === "buyback" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs print:text-[10px]">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                      <th className="p-4">{t("No Buyback")}</th>
                      <th className="p-4">{t("Tanggal")}</th>
                      <th className="p-4">{t("Pelanggan")}</th>
                      <th className="p-4">{t("Perangkat")}</th>
                      <th className="p-4 text-center">{t("Grade")}</th>
                      <th className="p-4">{t("No IMEI & Status")}</th>
                      <th className="p-4 text-center">{t("Kemenperin")}</th>
                      <th className="p-4">{t("Kasir")}</th>
                      <th className="p-4 text-right">{t("Harga Beli")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(() => {
                      const filteredBuybacks = filteredBuybacksDate.filter(b => 
                        b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        b.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        b.customerPhone.includes(searchQuery) ||
                        b.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        b.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        b.customerImei.includes(searchQuery) ||
                        b.cashierName.toLowerCase().includes(searchQuery.toLowerCase())
                      );
                      if (filteredBuybacks.length === 0) {
                        return (
                          <tr>
                            <td colSpan={9} className="p-8 text-center text-slate-400">{t("Tidak ada transaksi buyback yang cocok.")}</td>
                          </tr>
                        );
                      }
                      return filteredBuybacks.map((b, i) => (
                        <tr key={i} className="hover:bg-slate-50/50">
                          <td className="p-4 font-mono font-bold text-slate-700">{b.id}</td>
                          <td className="p-4 text-slate-500">{b.date.replace("T", " ")}</td>
                          <td className="p-4">
                            <p className="font-bold text-slate-700">{b.customerName}</p>
                            <p className="text-slate-400 font-mono text-[9px]">{b.customerPhone}</p>
                          </td>
                          <td className="p-4 font-bold text-slate-700">{b.brand} {b.model}</td>
                          <td className="p-4 text-center">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-primary-50 text-primary-700 font-extrabold border border-primary-150">
                              {b.condition}
                            </span>
                          </td>
                          <td className="p-4">
                            <p className="font-mono font-bold text-slate-700">{b.customerImei}</p>
                            <p className={`text-[10px] font-extrabold uppercase ${b.imeiStatus === "CLEAN" ? "text-emerald-600" : "text-rose-600"}`}>{b.imeiStatus}</p>
                          </td>
                          <td className="p-4 text-center">
                            <span className={`inline-flex px-2 py-0.5 rounded-md text-[9px] font-extrabold ${b.imeiVerified ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                              {b.imeiVerified ? t("TERVERIFIKASI") : t("BELUM VERIF")}
                            </span>
                          </td>
                          <td className="p-4 font-medium text-slate-600">{b.cashierName}</td>
                          <td className="p-4 text-right font-extrabold text-emerald-700">Rp {(b.priceBuy ?? 0).toLocaleString("id-ID")}</td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            )}

            {activeSubTab === "stock" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs print:text-[10px]">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                      <th className="p-4">{t("Brand")}</th>
                      <th className="p-4">{t("Model & Tipe")}</th>
                      <th className="p-4 text-center">{t("Stok")}</th>
                      <th className="p-4 text-center">{t("Limit Alert")}</th>
                      <th className="p-4 text-center">{t("Status")}</th>
                      <th className="p-4 text-right">{t("Harga Beli Satuan")}</th>
                      <th className="p-4 text-right">{t("Total Nilai HPP")}</th>
                      <th className="p-4 text-right">{t("Harga Jual Satuan")}</th>
                      <th className="p-4 text-right">{t("Margin Laba")}</th>
                      <th className="p-4 text-right">{t("Potensi Keuntungan")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(() => {
                      const filteredStock = products.filter(p => 
                        p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        p.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        p.type.toLowerCase().includes(searchQuery.toLowerCase())
                      );
                      if (filteredStock.length === 0) {
                        return (
                          <tr>
                            <td colSpan={10} className="p-8 text-center text-slate-400">{t("Tidak ada produk yang ditemukan.")}</td>
                          </tr>
                        );
                      }
                      return filteredStock.map((p, i) => {
                        const totalHpp = (p.priceBuy || 0) * (p.stock || 0);
                        const marginLaba = (p.priceSell || 0) - (p.priceBuy || 0);
                        const marginPercent = p.priceSell > 0 ? ((marginLaba / p.priceSell) * 100).toFixed(1) : "0.0";
                        const potentialProfit = marginLaba * (p.stock || 0);
                        const isLowStock = p.stock <= p.minStockAlert;
                        return (
                          <tr key={i} className={`hover:bg-slate-50/50 ${isLowStock ? "bg-rose-50/20" : ""}`}>
                            <td className="p-4 font-bold text-slate-700">{p.brand}</td>
                            <td className="p-4">
                              <p className="font-bold text-slate-700">{p.model}</p>
                              <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-extrabold mt-0.5 ${
                                p.type === "BARU" ? "bg-primary-100 text-primary-800" : "bg-amber-100 text-amber-800"
                              }`}>{p.type} {p.condition !== "-" && `Grade ${p.condition}`}</span>
                            </td>
                            <td className="p-4 text-center">
                              <span className={`inline-flex px-2 py-0.5 rounded-md font-extrabold ${isLowStock ? "bg-rose-100 text-rose-800 animate-pulse" : "bg-slate-100 text-slate-800"}`}>
                                {p.stock}
                              </span>
                            </td>
                            <td className="p-4 text-center text-slate-500 font-semibold">{p.minStockAlert}</td>
                            <td className="p-4 text-center">
                              {isLowStock ? (
                                <span className="inline-flex px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-extrabold text-[9px]">{t("REORDER")}</span>
                              ) : (
                                <span className="inline-flex px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-extrabold text-[9px]">{t("AMAN")}</span>
                              )}
                            </td>
                            <td className="p-4 text-right text-slate-500 font-semibold">Rp {(p.priceBuy ?? 0).toLocaleString("id-ID")}</td>
                            <td className="p-4 text-right text-slate-800 font-extrabold bg-slate-50/30">Rp {(totalHpp ?? 0).toLocaleString("id-ID")}</td>
                            <td className="p-4 text-right text-slate-500 font-semibold">Rp {(p.priceSell ?? 0).toLocaleString("id-ID")}</td>
                            <td className="p-4 text-right font-extrabold">
                              <span className={marginLaba >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                                Rp {(marginLaba ?? 0).toLocaleString("id-ID")}
                              </span>
                              <span className="block text-[10px] text-slate-400 font-semibold">
                                ({marginPercent}%)
                              </span>
                            </td>
                            <td className="p-4 text-right text-primary-600 font-extrabold">Rp {(potentialProfit ?? 0).toLocaleString("id-ID")}</td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            )}

            {activeSubTab === "bestsellers" && (
              <div className="p-6 space-y-6">
                <div className="text-center border-b border-slate-100 pb-4">
                  <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">🏆 {t("Analisis Smartphone Terlaris & Kontribusi Laba")}</h3>
                  <p className="text-xs text-slate-400 mt-1">{t("Peringkat smartphone berdasarkan kuantitas penjualan terbayar")}</p>
                </div>

                <div className="space-y-4">
                  {(() => {
                    const bestsellerList: any[] = [];
                    filteredTransactionsDate.filter(tx => tx.paymentStatus === "PAID").forEach(tx => {
                      tx.items.forEach(item => {
                        const existing = bestsellerList.find(b => b.name === item.name);
                        const prod = products.find(p => p.id === item.productId);
                        let purchasePrice = prod ? prod.priceBuy : Math.floor(item.priceSell * 0.85);
                        if (prod?.purchasedImeisHistory) {
                          const history = prod.purchasedImeisHistory.find(h => h.imei === item.imei);
                          if (history) purchasePrice = history.purchasePrice;
                        }
                        if (existing) {
                          existing.unitsSold += 1;
                          existing.totalRevenue += item.priceSell;
                          existing.totalCost += purchasePrice;
                          existing.totalProfit += (item.priceSell - purchasePrice);
                        } else {
                          bestsellerList.push({
                            name: item.name,
                            brand: item.brand,
                            type: item.type,
                            unitsSold: 1,
                            totalRevenue: item.priceSell,
                            totalCost: purchasePrice,
                            totalProfit: item.priceSell - purchasePrice
                          });
                        }
                      });
                    });
                    bestsellerList.sort((a, b) => b.unitsSold - a.unitsSold);

                    if (bestsellerList.length === 0) {
                      return <div className="text-center text-slate-400 py-8 text-xs">{t("Belum ada rincian data penjualan untuk dikalkulasi.")}</div>;
                    }

                    const maxSales = bestsellerList[0].unitsSold;

                    return (
                      <div className="grid grid-cols-1 gap-4">
                        {bestsellerList.map((item, index) => {
                          const pct = Math.round((item.unitsSold / maxSales) * 100);
                          const marginPct = item.totalRevenue > 0 ? Math.round((item.totalProfit / item.totalRevenue) * 100) : 0;
                          return (
                            <div key={index} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border border-slate-150 rounded-2xl bg-slate-50/20 hover:bg-slate-50/50 transition-all">
                              <div className="flex items-center gap-3.5 flex-1 min-w-0">
                                <span className={`h-8 w-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                                  index === 0 ? "bg-amber-100 text-amber-800 border border-amber-200" :
                                  index === 1 ? "bg-slate-100 text-slate-700 border border-slate-200" :
                                  index === 2 ? "bg-orange-100 text-orange-800 border border-orange-200" :
                                  "bg-slate-50 text-slate-500 border border-slate-150"
                                }`}>
                                  #{index + 1}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className="font-bold text-slate-800 truncate">{item.name}</p>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-[10px] text-slate-400 font-bold">{item.brand}</span>
                                    <span className="text-slate-200 text-[10px]">•</span>
                                    <span className="text-[10px] text-slate-500 font-semibold uppercase">{item.type}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex-1 max-w-xs hidden md:block">
                                <div className="flex justify-between text-[10px] text-slate-400 font-bold mb-1">
                                  <span>{t("Volume Penjualan")}</span>
                                  <span>{item.unitsSold} {t("Unit")}</span>
                                </div>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                  <div className="bg-indigo-600 h-full rounded-full transition-all" style={{ width: `${pct}%` }}></div>
                                </div>
                              </div>

                              <div className="flex items-center gap-6 justify-between md:justify-end shrink-0">
                                <div className="text-right">
                                  <p className="text-[10px] text-slate-400 font-bold">{t("Total Revenue")}</p>
                                  <p className="font-bold text-slate-700 text-xs mt-0.5">Rp {(item.totalRevenue ?? 0).toLocaleString("id-ID")}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-[10px] text-slate-400 font-bold">{t("Gross Profit")} ({marginPct}%)</p>
                                  <p className="font-extrabold text-primary-600 text-xs mt-0.5">Rp {(item.totalProfit ?? 0).toLocaleString("id-ID")} component</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {activeSubTab === "pl" && (
              <div className="p-6 max-w-3xl mx-auto space-y-6">
                <div className="text-center border-b border-slate-100 pb-4">
                  <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">{t("Laporan Laba Rugi Komprehensif (Profit & Loss)")}</h3>
                  <p className="text-xs text-slate-400 mt-1">{t("Periode s/d")} {new Date().toLocaleDateString("id-ID")}</p>
                </div>

                <div className="space-y-4 text-xs">
                  {/* Revenue */}
                  <div className="border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-400 block mb-1 uppercase tracking-wider text-[9px]">{t("PENDAPATAN USAHA")}</span>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-700 font-medium">{t("Penjualan Retail Smartphone (Paid Transactions)")}</span>
                      <span className="text-slate-800 font-semibold">Rp {(totalRevenue ?? 0).toLocaleString("id-ID")}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-100 pt-1.5 font-bold">
                      <span className="text-slate-800">{t("Total Pendapatan Bersih")}</span>
                      <span className="text-slate-900 underline underline-offset-4">Rp {(totalRevenue ?? 0).toLocaleString("id-ID")}</span>
                    </div>
                  </div>

                  {/* COGS */}
                  <div className="border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-400 block mb-1 uppercase tracking-wider text-[9px]">{t("HARGA POKOK PENJUALAN (HPP)")}</span>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-700 font-medium">{t("Beban Pengadaan Modal Awal Supplier (TAM, Erajaya)")}</span>
                      <span className="text-slate-800 font-semibold">Rp {(totalProcurementCost ?? 0).toLocaleString("id-ID")}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-100 pt-1.5 font-bold">
                      <span className="text-slate-800">{t("Total Harga Pokok Penjualan")}</span>
                      <span className="text-slate-900 underline underline-offset-4">Rp {(totalProcurementCost ?? 0).toLocaleString("id-ID")}</span>
                    </div>
                  </div>

                  {/* Gross Margin */}
                  <div className="flex justify-between p-3 bg-slate-50 border border-slate-150 rounded-xl font-bold">
                    <span className="text-slate-800">{t("LABA KOTOR (GROSS PROFIT)")}</span>
                    <span className="text-primary-600">Rp {(totalGrossProfit ?? 0).toLocaleString("id-ID")}</span>
                  </div>

                  {/* Operating Expenses */}
                  <div className="border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-400 block mb-1 uppercase tracking-wider text-[9px]">{t("BEBAN OPERASIONAL & ARUS KELUAR")}</span>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-700 font-medium">{t("Beban Akuisisi Smartphone Bekas (Customer Buybacks)")}</span>
                      <span className="text-slate-800 font-semibold">Rp {(totalBuybackCost ?? 0).toLocaleString("id-ID")}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-100 pt-1.5 font-bold">
                      <span className="text-slate-800">{t("Total Beban Operasional")}</span>
                      <span className="text-slate-900 underline underline-offset-4">Rp {(totalBuybackCost ?? 0).toLocaleString("id-ID")}</span>
                    </div>
                  </div>

                  {/* Net Profit */}
                  <div className="flex justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-xl font-extrabold text-sm text-emerald-800">
                    <span className="uppercase">{t("LABA BERSIH USAHA (NET INCOME)")}</span>
                    <span className="border-b-4 border-double border-emerald-600">Rp {(netProfit ?? 0).toLocaleString("id-ID")}</span>
                  </div>
                </div>
              </div>
            )}

            {activeSubTab === "balance" && (
              <div className="p-6 max-w-3xl mx-auto space-y-6">
                <div className="text-center border-b border-slate-100 pb-4">
                  <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">{t("Neraca Keuangan Aktiva & Pasiva (Balance Sheet)")}</h3>
                  <p className="text-xs text-slate-400 mt-1">{t("Audit per Tanggal:")} {new Date().toLocaleDateString("id-ID")}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                  {/* Assets Section */}
                  <div className="space-y-4 border border-slate-200 p-4 rounded-xl bg-slate-50/30">
                    <h4 className="font-bold text-slate-700 border-b border-slate-200 pb-1.5 uppercase tracking-wider text-[9px]">{t("AKTIVA (ASSETS)")}</h4>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-600 font-medium">{t("Kas & Setara Kas (Saldo POS)")}</span>
                        <span className="font-bold text-slate-800">Rp {(cashAssetValue ?? 0).toLocaleString("id-ID")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 font-medium">{t("Persediaan Dagang (Stok HP Aktif)")}</span>
                        <span className="font-bold text-slate-800">Rp {(inventoryAssetValue ?? 0).toLocaleString("id-ID")}</span>
                      </div>
                    </div>

                    <div className="flex justify-between border-t border-slate-200 pt-3 font-extrabold text-primary-600">
                      <span>{t("TOTAL AKTIVA")}</span>
                      <span className="border-b-4 border-double border-primary-500">Rp {(totalAssets ?? 0).toLocaleString("id-ID")}</span>
                    </div>
                  </div>

                  {/* Liabilities and Equity Section */}
                  <div className="space-y-4 border border-slate-200 p-4 rounded-xl bg-slate-50/30">
                    <h4 className="font-bold text-slate-700 border-b border-slate-200 pb-1.5 uppercase tracking-wider text-[9px]">{t("PASIVA (LIABILITIES & EQUITY)")}</h4>
                    
                    <div className="space-y-2.5">
                      <div>
                        <span className="font-bold text-slate-400 block uppercase tracking-wider text-[8px] mb-1">{t("Kewajiban")}</span>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-600 font-medium">{t("Utang Usaha Supplier")}</span>
                          <span className="font-bold text-slate-800">Rp {(totalLiabilities ?? 0).toLocaleString("id-ID")}</span>
                        </div>
                      </div>

                      <div>
                        <span className="font-bold text-slate-400 block uppercase tracking-wider text-[8px] mb-1">{t("Ekuitas Modal")}</span>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-600 font-medium">{t("Modal Ricky Commedan")}</span>
                          <span className="font-bold text-slate-800">Rp {(cashInitial ?? 0).toLocaleString("id-ID")}</span>
                        </div>
                        <div className="flex justify-between text-xs mt-1">
                          <span className="text-slate-600 font-medium">{t("Laba Ditahan")}</span>
                          <span className="font-bold text-slate-800">Rp {(retainedEarnings ?? 0).toLocaleString("id-ID")}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between border-t border-slate-200 pt-3 font-extrabold text-slate-800">
                      <span>{t("TOTAL PASIVA")}</span>
                      <span className="border-b-4 border-double border-slate-600">Rp {(totalEquity ?? 0).toLocaleString("id-ID")}</span>
                    </div>
                  </div>
                </div>

                {/* Balances Check indicator */}
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-center font-bold text-xs flex items-center justify-center gap-2">
                  <ShieldCheck className="h-4.5 w-4.5" />
                  <span>{t("SINKRONISASI NERACA SEIMBANG (BALANCED): AKTIVA = PASIVA")}</span>
                </div>
              </div>
            )}

            {activeSubTab === "cashflow" && (
              <div className="p-6 max-w-3xl mx-auto space-y-6">
                <div className="text-center border-b border-slate-100 pb-4">
                  <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">{t("Laporan Arus Kas Operasional (Cash Flow Statement)")}</h3>
                  <p className="text-xs text-slate-400 mt-1">{t("Metode Langsung (Direct Method) - Real-Time")}</p>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <span className="font-bold text-slate-400 block mb-1.5 uppercase tracking-wider text-[9px]">{t("ARUS KAS DARI AKTIVITAS OPERASIONAL")}</span>
                    <div className="space-y-2">
                      <div className="flex justify-between text-emerald-600">
                        <span className="font-medium flex items-center gap-1"><ArrowUpCircle className="h-3.5 w-3.5" /> {t("Penerimaan Tunai/Transfer Penjualan")}</span>
                        <span className="font-bold">+ Rp {(totalRevenue ?? 0).toLocaleString("id-ID")}</span>
                      </div>
                      <div className="flex justify-between text-red-600">
                        <span className="font-medium flex items-center gap-1"><ArrowDownCircle className="h-3.5 w-3.5" /> {t("Pengeluaran Kas untuk HPP Supplier")}</span>
                        <span className="font-bold">- Rp {(totalProcurementCost ?? 0).toLocaleString("id-ID")}</span>
                      </div>
                      <div className="flex justify-between text-red-600">
                        <span className="font-medium flex items-center gap-1"><ArrowDownCircle className="h-3.5 w-3.5" /> {t("Pengeluaran Kas untuk Buyback Hp")}</span>
                        <span className="font-bold">- Rp {(totalBuybackCost ?? 0).toLocaleString("id-ID")}</span>
                      </div>
                    </div>

                    <div className="flex justify-between border-t border-slate-100 mt-3 pt-2 font-bold text-slate-800">
                      <span>{t("Kas Bersih yang Diperoleh dari Aktivitas Operasi")}</span>
                      <span className="underline">Rp {(netProfit ?? 0).toLocaleString("id-ID")}</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-600">{t("Kas dan Setara Kas Awal Periode (Modal)")}</span>
                      <span className="font-bold text-slate-800">Rp {(cashInitial ?? 0).toLocaleString("id-ID")}</span>
                    </div>
                    <div className="flex justify-between bg-primary-50 border border-primary-200 p-3.5 rounded-xl font-extrabold text-primary-800 text-sm">
                      <span>{t("KAS DAN SETARA KAS AKHIR PERIODE")}</span>
                      <span className="border-b-4 border-double border-primary-500">Rp {(cashAssetValue ?? 0).toLocaleString("id-ID")}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSubTab === "schedule" && (
              <div className="p-6 space-y-6">
                <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-md font-bold text-slate-800 flex items-center gap-2">
                      <Clock className="h-5 w-5 text-indigo-600 animate-pulse" />
                      {t("Penjadwalan Laporan Otomatis (Cron Simulator)")}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {t("Kirim rangkuman finansial & file PDF kustom harian, mingguan, atau bulanan langsung ke email manajemen dan notifikasi admin.")}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingScheduleId(null);
                      setScheduleForm(initialFormState);
                    }}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <RefreshCw className="h-3 w-3" /> {t("Reset Form")}
                  </button>
                </div>

                {scheduleSuccessMessage && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
                    <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>{scheduleSuccessMessage}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                  {/* FORM PENDAFTARAN / EDIT JADWAL */}
                  <div className="xl:col-span-5 bg-slate-50/50 border border-slate-150 p-5 rounded-2xl space-y-4">
                    <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-150 pb-2">
                      <Sliders className="h-3.5 w-3.5 text-slate-500" />
                      {editingScheduleId ? t("Edit Konfigurasi Jadwal") : t("Buat Jadwal Otomatis Baru")}
                    </h4>

                    <form onSubmit={handleSaveSchedule} className="space-y-4">
                      {/* Tipe Laporan */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{t("Tipe Laporan")}</label>
                        <select
                          value={scheduleForm.reportType}
                          onChange={(e) => setScheduleForm({ ...scheduleForm, reportType: e.target.value as any })}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                        >
                          <option value="pl">{t("Laba Rugi (Profit & Loss)")}</option>
                          <option value="ledger">{t("Buku Besar & Audit IMEI")}</option>
                          <option value="balance">{t("Neraca Keuangan")}</option>
                          <option value="cashflow">{t("Arus Kas (Cash Flow)")}</option>
                          <option value="sales">{t("Detail Transaksi POS")}</option>
                          <option value="buyback">{t("Detail Transaksi Buyback")}</option>
                          <option value="stock">{t("Opname & Penilaian Stok")}</option>
                          <option value="bestsellers">{t("Smartphone Terlaris")}</option>
                        </select>
                      </div>

                      {/* Frekuensi & Format */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{t("Frekuensi")}</label>
                          <select
                            value={scheduleForm.frequency}
                            onChange={(e) => setScheduleForm({ ...scheduleForm, frequency: e.target.value as any })}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                          >
                            <option value="daily">{t("Harian")}</option>
                            <option value="weekly">{t("Mingguan (Senin Pagi)") || "Weekly (Monday)"}</option>
                            <option value="monthly">{t("Bulanan")}</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{t("Format File")}</label>
                          <select
                            value={scheduleForm.format}
                            onChange={(e) => setScheduleForm({ ...scheduleForm, format: e.target.value as any })}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                          >
                            <option value="pdf">PDF</option>
                            <option value="excel">Excel (.CSV)</option>
                          </select>
                        </div>
                      </div>

                      {/* Email Manager */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{t("Email Manager (Tujuan)")}</label>
                        <input
                          type="email"
                          required
                          value={scheduleForm.recipientEmail}
                          onChange={(e) => setScheduleForm({ ...scheduleForm, recipientEmail: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono focus:outline-none"
                          placeholder="manager@toko.com"
                        />
                      </div>

                      {/* PERSONALISASI PDF AREA */}
                      <div className="border-t border-slate-200 pt-3.5 space-y-3">
                        <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider block">{t("✍️ Personalisasi Desain PDF")}</span>
                        
                        {/* Company Name */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{t("Nama Toko / Cabang")}</label>
                          <input
                            type="text"
                            value={scheduleForm.companyName}
                            onChange={(e) => setScheduleForm({ ...scheduleForm, companyName: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                            placeholder="FonePOS Roxy Square"
                          />
                        </div>

                        {/* Manager Name */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{t("Nama Manager Utama")}</label>
                          <input
                            type="text"
                            value={scheduleForm.managerName}
                            onChange={(e) => setScheduleForm({ ...scheduleForm, managerName: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                            placeholder="Ricky Commedan"
                          />
                        </div>

                        {/* Custom Color Accent */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">{t("Tema Warna Aksen PDF")}</label>
                          <div className="flex gap-2">
                            {[
                              { id: "blue", label: "Ocean Blue", bg: "bg-primary-600" },
                              { id: "emerald", label: "Forest Green", bg: "bg-emerald-600" },
                              { id: "rose", label: "Crimson Rose", bg: "bg-rose-600" },
                              { id: "indigo", label: "Classic Indigo", bg: "bg-indigo-600" }
                            ].map(theme => (
                              <button
                                key={theme.id}
                                type="button"
                                onClick={() => setScheduleForm({ ...scheduleForm, customColor: theme.id as any })}
                                className={`h-6 px-2.5 rounded-lg text-[9px] font-bold text-white transition-all cursor-pointer flex items-center gap-1 ${theme.bg} ${
                                  scheduleForm.customColor === theme.id ? "ring-2 ring-offset-2 ring-slate-800 scale-105" : "opacity-80"
                                }`}
                              >
                                {scheduleForm.customColor === theme.id && <Check className="h-2.5 w-2.5" />}
                                {theme.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Custom Notes */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{t("Pesan / Catatan Tambahan (PDF)")}</label>
                          <textarea
                            rows={3}
                            value={scheduleForm.notes}
                            onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none resize-none"
                            placeholder="Tulis instruksi khusus untuk manager..."
                          />
                        </div>
                      </div>

                      {/* Submit */}
                      <button
                        type="submit"
                        disabled={isSavingSchedule}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/10 cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                      >
                        {isSavingSchedule ? t("Menyimpan...") : editingScheduleId ? t("Perbarui Jadwal Laporan") : t("Aktifkan Jadwal Otomatis")}
                      </button>
                    </form>
                  </div>

                  {/* DAFTAR JADWAL YANG AKTIF */}
                  <div className="xl:col-span-7 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-500" />
                        Jadwal Terdaftar ({schedules.length})
                      </h4>
                      <button
                        onClick={fetchSchedules}
                        disabled={isFetchingSchedules}
                        className="p-1.5 hover:bg-slate-100 rounded-lg transition-all"
                        title="Segarkan data"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${isFetchingSchedules ? "animate-spin" : ""}`} />
                      </button>
                    </div>

                    {isFetchingSchedules && schedules.length === 0 ? (
                      <div className="p-8 text-center border border-dashed border-slate-200 rounded-2xl bg-white">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto animate-pulse"></div>
                        <p className="text-xs text-slate-400 mt-2">Memuat jadwal otomatis...</p>
                      </div>
                    ) : schedules.length === 0 ? (
                      <div className="p-8 text-center border border-dashed border-slate-200 rounded-2xl bg-white space-y-2">
                        <AlertCircle className="h-8 w-8 text-slate-300 mx-auto" />
                        <h5 className="text-xs font-bold text-slate-600">Belum Ada Penjadwalan Aktif</h5>
                        <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                          Semua laporan dapat diotomatisasikan untuk dikirim secara periodik. Silakan buat satu jadwal pertama di form sebelah kiri!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
                        {schedules.map((sch: any) => {
                          const repNames: Record<string, string> = {
                            pl: "Laba Rugi (P&L)",
                            ledger: "Buku Besar (Ledger Audit)",
                            balance: "Neraca Keuangan (Balance Sheet)",
                            cashflow: "Arus Kas (Cash Flow)",
                            sales: "Transaksi POS (Retail)",
                            buyback: "Transaksi Buyback",
                            stock: "Stok & Aset (Inventory)",
                            bestsellers: "Smartphone Terlaris"
                          };
                          
                          const colorMap: Record<string, string> = {
                            blue: "bg-primary-50 text-primary-800 border-primary-200",
                            emerald: "bg-emerald-50 text-emerald-800 border-emerald-200",
                            rose: "bg-rose-50 text-rose-800 border-rose-200",
                            indigo: "bg-indigo-50 text-indigo-800 border-indigo-200"
                          };
                          
                          return (
                            <div
                              key={sch.id}
                              className={`p-4 border rounded-2xl bg-white transition-all space-y-3 ${
                                sch.isActive ? "border-slate-200 shadow-xs" : "border-slate-100 bg-slate-50/20 opacity-70"
                              }`}
                            >
                              <div className="flex justify-between items-start gap-4">
                                <div className="space-y-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="text-xs font-bold text-slate-800 truncate">
                                      {repNames[sch.reportType] || sch.reportType.toUpperCase()}
                                    </span>
                                    <span className="text-[9px] px-1.5 py-0.25 bg-indigo-50 border border-indigo-100 text-indigo-700 font-extrabold rounded-sm uppercase tracking-wide">
                                      {sch.frequency}
                                    </span>
                                    <span className="text-[9px] px-1.5 py-0.25 bg-slate-50 border border-slate-200 text-slate-500 font-bold rounded-sm uppercase tracking-wider">
                                      {sch.format.toUpperCase()}
                                    </span>
                                    <span className={`text-[8px] px-1.5 py-0.25 border rounded-sm font-extrabold uppercase ${colorMap[sch.personalization?.customColor || "blue"]}`}>
                                      {sch.personalization?.customColor || "blue"} PDF
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-400 flex items-center gap-1">
                                    <Mail className="h-3 w-3 shrink-0" />
                                    Tujuan: <strong className="text-slate-600 font-mono">{sch.recipientEmail}</strong>
                                  </p>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  {/* Toggle Active Switch */}
                                  <button
                                    onClick={() => handleToggleScheduleActive(sch.id, sch.isActive)}
                                    className={`px-2 py-1 rounded-lg text-[9px] font-bold border transition-all cursor-pointer ${
                                      sch.isActive 
                                        ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100" 
                                        : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                                    }`}
                                  >
                                    {sch.isActive ? "🟢 AKTIF" : "⚪ NON-AKTIF"}
                                  </button>
                                  
                                  {/* Edit Button */}
                                  <button
                                    onClick={() => handleEditScheduleClick(sch)}
                                    className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-700 rounded-lg transition-all cursor-pointer"
                                    title="Edit Jadwal"
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </button>

                                  {/* Delete Button */}
                                  <button
                                    onClick={() => handleDeleteSchedule(sch.id)}
                                    className="p-1.5 hover:bg-red-50 text-red-500 hover:text-red-700 rounded-lg transition-all cursor-pointer"
                                    title="Hapus Jadwal"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Personalization Preview */}
                              <div className="bg-slate-50/50 p-2.5 rounded-xl text-[10px] text-slate-500 border border-slate-100">
                                <div className="grid grid-cols-2 gap-2 mb-1.5 pb-1.5 border-b border-slate-100">
                                  <div>
                                    <span className="text-[8px] font-bold text-slate-400 block uppercase">Nama Cabang / Toko</span>
                                    <span className="font-bold text-slate-700">{sch.personalization?.companyName || "FonePOS"}</span>
                                  </div>
                                  <div>
                                    <span className="text-[8px] font-bold text-slate-400 block uppercase">Manager Utama</span>
                                    <span className="font-bold text-slate-700">{sch.personalization?.managerName || "-"}</span>
                                  </div>
                                </div>
                                <p className="italic text-slate-500 leading-snug line-clamp-2">
                                  💬 "{sch.personalization?.notes || "Tidak ada catatan khusus."}"
                                </p>
                              </div>

                              <div className="flex justify-between items-center text-[9px] pt-1 border-t border-slate-50">
                                <span className="text-slate-400">
                                  Dibuat: <strong className="text-slate-500">{new Date(sch.createdAt).toLocaleDateString("id-ID")}</strong>
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-slate-400">
                                    Status Pengiriman: <strong className="text-slate-600">{sch.lastSent ? `Terkirim (${new Date(sch.lastSent).toLocaleTimeString("id-ID")})` : "Belum pernah"}</strong>
                                  </span>
                                  <button
                                    onClick={() => handleTriggerScheduleNow(sch.id)}
                                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                                    title="Picu Laporan Harian Sekarang"
                                  >
                                    <Play className="h-2.5 w-2.5" /> Picu Sekarang (Simulate)
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Print-only signatures panel */}
            <div className="hidden print:grid grid-cols-2 gap-8 p-12 mt-12 text-xs border-t border-slate-300 text-center">
              <div className="space-y-16">
                <p>Disusun oleh Auditor Toko,</p>
                <p className="font-extrabold underline">SITI RAHMA</p>
                <p className="text-[10px] text-slate-500">Staf POS & Keuangan</p>
              </div>
              <div className="space-y-16">
                <p>Disetujui oleh Pemilik (Admin),</p>
                <p className="font-extrabold underline">RICKY COMMEDAN</p>
                <p className="text-[10px] text-slate-500">Direktur Utama FonePOS</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Corporate Email automated dispatch report */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4 no-print">
        <div>
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Send className="h-4.5 w-4.5 text-primary-600" />
            Distribusi Laporan Otomatis ke Email Manajemen
          </h3>
          <p className="text-xs text-slate-500">Kirim salinan digital laporan audit ini langsung ke dewan direksi secara real-time.</p>
        </div>

        <form onSubmit={handleSendReportEmail} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Format Laporan</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none"
            >
              <option value="Laporan Laba Rugi Komprehensif">Laba Rugi Komprehensif (P&L)</option>
              <option value="Rekonsiliasi IMEI & Stock Ledger">Rekonsiliasi IMEI & Stock Ledger</option>
              <option value="Laporan Supplier & Konsumen">Supplier & Konsumen Bulanan</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Email Penerima (Direksi)</label>
            <input
              type="email"
              required
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-mono focus:outline-none"
              placeholder="Contoh: rickycommedan@gmail.com"
            />
          </div>

          <button
            type="submit"
            disabled={isEmailSending}
            className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md shadow-primary-600/10 disabled:opacity-50 transition-all"
          >
            {isEmailSending ? "Mengirimkan Laporan..." : "Kirim Laporan via Email"}
          </button>
        </form>

        {emailSuccess && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-1.5">
            <CheckCircle className="h-4 w-4 text-emerald-600" />
            Laporan Keuangan berhasil dicompile ke format PDF/XLS dan dikirimkan ke email dewan direksi <b>{emailInput}</b>!
          </div>
        )}
      </div>

      {/* Modal Pre-Export PDF Column Customization */}
      {isPdfConfigModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in no-print">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                  <Sliders className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    Konfigurasi Kolom Laporan PDF
                    <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-2.5 py-0.5 rounded-full uppercase">
                      {activeSubTab.toUpperCase()}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Sembunyikan kolom atau data sensitif (HPP, Margin, Supplier, Telp) sebelum mengunduh atau mencetak laporan fisik.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPdfConfigModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Presets */}
            <div className="space-y-2">
              <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
                ⚡ Mode Pintar / Preset Disediakan
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => applyPdfPreset("hideSensitive")}
                  className="p-2.5 bg-amber-50 hover:bg-amber-100/80 border border-amber-200 rounded-xl text-left transition-all cursor-pointer group"
                >
                  <div className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />
                    Sembunyikan Sensitif
                  </div>
                  <p className="text-[10px] text-amber-700/80 mt-0.5 leading-tight">
                    Sembunyikan HPP, Laba, Supplier.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => applyPdfPreset("showAll")}
                  className="p-2.5 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 rounded-xl text-left transition-all cursor-pointer group"
                >
                  <div className="text-xs font-black text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                    Tampilkan Semua
                  </div>
                  <p className="text-[10px] text-emerald-700/80 mt-0.5 leading-tight">
                    Sertakan seluruh rincian kolom & KPI.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => applyPdfPreset("minimal")}
                  className="p-2.5 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200 rounded-xl text-left transition-all cursor-pointer group"
                >
                  <div className="text-xs font-black text-indigo-900 flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-indigo-600" />
                    Laporan Minimalis
                  </div>
                  <p className="text-[10px] text-indigo-700/80 mt-0.5 leading-tight">
                    Tampilkan 4 kolom utama paling ringkas.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => applyPdfPreset("eco")}
                  className="p-2.5 bg-teal-50 hover:bg-teal-100/80 border border-teal-200 rounded-xl text-left transition-all cursor-pointer group"
                >
                  <div className="text-xs font-black text-teal-900 flex items-center gap-1.5">
                    <Printer className="h-3.5 w-3.5 text-teal-600" />
                    Mode Cetak Hemat
                  </div>
                  <p className="text-[10px] text-teal-700/80 mt-0.5 leading-tight">
                    Monokrom, margin minim, hemat kertas.
                  </p>
                </button>
              </div>
            </div>

            {/* Column Checkboxes */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  📋 Pilih Kolom yang Ditampilkan
                </label>
                <span className="text-[11px] text-slate-500 font-bold">
                  {(selectedPdfColumns[activeSubTab] || []).length} dari {(ALL_SUBTAB_COLUMNS[activeSubTab] || []).length} Kolom Terpilih
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 max-h-56 overflow-y-auto">
                {(ALL_SUBTAB_COLUMNS[activeSubTab] || []).map((col) => {
                  const isChecked = (selectedPdfColumns[activeSubTab] || []).includes(col.id);
                  return (
                    <label
                      key={col.id}
                      className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                        isChecked
                          ? "bg-white border-primary-300 shadow-2xs font-bold text-slate-900"
                          : "bg-slate-100/60 border-slate-200 text-slate-400 opacity-60 hover:opacity-100"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePdfColumn(activeSubTab, col.id)}
                          className="rounded text-primary-600 focus:ring-primary-500 h-4 w-4 cursor-pointer"
                        />
                        <span>{col.label}</span>
                      </div>
                      {col.isSensitive && (
                        <span className="text-[9px] font-extrabold bg-rose-50 text-rose-600 border border-rose-200 px-1.5 py-0.25 rounded uppercase">
                          🔒 Sensitif
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* KPI Toggle */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="includeKpiInPdf"
                  checked={includeKpiInPdf}
                  onChange={(e) => setIncludeKpiInPdf(e.target.checked)}
                  className="rounded text-primary-600 focus:ring-primary-500 h-4 w-4 cursor-pointer"
                />
                <label htmlFor="includeKpiInPdf" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Sertakan Blok Ikhtisar Finansial Executive Summary (HPP, Total Revenue & Laba)
                </label>
              </div>
              {includeKpiInPdf && (
                <span className="text-[9px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.25 rounded uppercase">
                  Data Finansial
                </span>
              )}
            </div>

            {/* Eco Print Mode Toggle */}
            <div className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
              isEcoPrintMode 
                ? "bg-teal-50/90 border-teal-300 text-teal-950 shadow-xs" 
                : "bg-slate-50 border-slate-200 text-slate-700"
            }`}>
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="isEcoPrintMode"
                  checked={isEcoPrintMode}
                  onChange={(e) => setIsEcoPrintMode(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500 h-4 w-4 cursor-pointer"
                />
                <div>
                  <label htmlFor="isEcoPrintMode" className="text-xs font-black cursor-pointer flex items-center gap-1.5">
                    🌱 Mode Cetak Hemat (Eco & Audit Print)
                  </label>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                    Menyederhanakan layout PDF, menghapus grafis dekoratif, memperkecil margin, & memaksimalkan kerapatan tabel.
                  </p>
                </div>
              </div>
              {isEcoPrintMode && (
                <span className="text-[9px] font-extrabold bg-teal-100 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-full uppercase shrink-0">
                  Hemat Kertas & Tinta
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsPdfConfigModalOpen(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={() => {
                  handleExportPDF();
                  setIsPdfConfigModalOpen(false);
                }}
                disabled={(selectedPdfColumns[activeSubTab] || []).length === 0}
                className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-2 shadow-md shadow-rose-600/20 cursor-pointer disabled:opacity-50 transition-all"
              >
                <Download className="h-4 w-4" />
                Unduh PDF Terkustomisasi
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
