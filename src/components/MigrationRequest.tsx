import React, { useState, useEffect } from "react";
import { 
  Database, 
  Upload, 
  FileSpreadsheet, 
  Download, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Trash2, 
  Sparkles, 
  Send, 
  FileText, 
  ShieldCheck,
  Check,
  Layers,
  Search,
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  Receipt,
  Building2,
  Lock,
  XCircle,
  HelpCircle,
  ListChecks,
  AlertTriangle,
  Play,
  FileCheck2,
  FileBadge,
  Filter
} from "lucide-react";
import { MigrationRequestItem, UserRole } from "../types";
import { apiFetch, apiGet, apiPost, getResolvedTenantId } from "../lib/api";
import { useTenant } from "../hooks/useTenant";

interface MigrationRequestProps {
  userRole?: UserRole;
  currentUser?: any;
  onRefreshGlobalData?: () => void;
}

interface ParsedInventoryRow {
  rowNum: number;
  tenantId: string;
  name: string;
  brand: string;
  model: string;
  sku: string;
  type: string;
  category: string;
  condition: string;
  priceBuy: number;
  priceSell: number;
  stock: number;
  minStockAlert: number;
  imeis: string[];
  specifications: string;
  errors: string[];
  hasError: boolean;
}

interface ParsedTransactionRow {
  rowNum: number;
  tenantId: string;
  invoiceId: string;
  date: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  cashierName: string;
  salesName: string;
  itemsSummary: string;
  notes: string;
  errors: string[];
  hasError: boolean;
}

export default function MigrationRequest({ userRole, currentUser, onRefreshGlobalData }: MigrationRequestProps) {
  const { tenantId, tenantDetails } = useTenant();
  const activeTenantId = tenantId || getResolvedTenantId() || currentUser?.tenantId || "default";
  const activeTenantName = tenantDetails?.name || activeTenantId;

  // Main active tab
  const [activeMainTab, setActiveMainTab] = useState<"BULK_IMPORT" | "TENANT_EXPORT" | "ASSISTED_TICKETS">("BULK_IMPORT");

  // Bulk Import States
  const [importCategory, setImportCategory] = useState<"INVENTORY" | "TRANSACTIONS">("INVENTORY");
  const [importMode, setImportMode] = useState<"UPSERT" | "APPEND">("UPSERT");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedInventoryRows, setParsedInventoryRows] = useState<ParsedInventoryRow[]>([]);
  const [parsedTransactionRows, setParsedTransactionRows] = useState<ParsedTransactionRow[]>([]);
  const [isProcessingImport, setIsProcessingImport] = useState(false);
  const [importSuccessResult, setImportSuccessResult] = useState<any | null>(null);
  const [importErrorMsg, setImportErrorMsg] = useState("");

  // Assisted Tickets States
  const [requests, setRequests] = useState<MigrationRequestItem[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [ticketTitle, setTicketTitle] = useState("");
  const [ticketType, setTicketType] = useState<"INVENTORY" | "CUSTOMERS" | "ALL">("INVENTORY");
  const [ticketNotes, setTicketNotes] = useState("");
  const [ticketFile, setTicketFile] = useState<File | null>(null);
  const [ticketFilePreview, setTicketFilePreview] = useState("");
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [ticketSuccessMsg, setTicketSuccessMsg] = useState("");
  const [ticketErrorMsg, setTicketErrorMsg] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Export Stats
  const [exportStats, setExportStats] = useState<{ productsCount: number; transactionsCount: number }>({
    productsCount: 0,
    transactionsCount: 0
  });
  const [loadingExportStats, setLoadingExportStats] = useState(false);

  // Fetch migration tickets
  const fetchMigrationRequests = async () => {
    try {
      setLoadingRequests(true);
      const res = await apiGet("/api/migration-requests");
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (err) {
      console.error("Gagal mengambil data permohonan migrasi:", err);
    } finally {
      setLoadingRequests(false);
    }
  };

  // Fetch export stats
  const fetchExportStats = async () => {
    try {
      setLoadingExportStats(true);
      const [prodRes, txRes] = await Promise.all([
        apiGet("/api/products"),
        apiGet("/api/transactions")
      ]);
      const prods = prodRes.ok ? await prodRes.json() : [];
      const txs = txRes.ok ? await txRes.json() : [];
      setExportStats({
        productsCount: Array.isArray(prods) ? prods.length : 0,
        transactionsCount: Array.isArray(txs) ? txs.length : 0
      });
    } catch (e) {
      console.warn("Gagal mengambil statistik ekspor:", e);
    } finally {
      setLoadingExportStats(false);
    }
  };

  useEffect(() => {
    fetchMigrationRequests();
    fetchExportStats();
  }, [activeTenantId]);

  // Parse Inventory CSV
  const parseInventoryCsv = (text: string) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length <= 1) {
      setParsedInventoryRows([]);
      setImportErrorMsg("File CSV kosong atau hanya berisi baris header.");
      return;
    }

    const firstLine = lines[0];
    const delimiter = firstLine.includes(";") && !firstLine.includes(",") ? ";" : ",";
    const headers = firstLine.split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase().replace(/[^a-z0-9]/g, ''));

    const findIdx = (keywords: string[]) => headers.findIndex(h => keywords.some(k => h.includes(k)));

    const nameIdx = findIdx(["nama", "product", "produk", "name", "item"]);
    const brandIdx = findIdx(["merek", "brand", "merk"]);
    const modelIdx = findIdx(["model", "tipe", "type"]);
    const skuIdx = findIdx(["sku", "kode", "barcode"]);
    const priceBuyIdx = findIdx(["modal", "buy", "beli", "hpp", "cost"]);
    const priceSellIdx = findIdx(["jual", "sell", "harga", "price"]);
    const stockIdx = findIdx(["stok", "stock", "qty", "jumlah"]);
    const imeiIdx = findIdx(["imei", "serial", "sn"]);
    const categoryIdx = findIdx(["kategori", "category", "cat"]);
    const conditionIdx = findIdx(["kondisi", "condition", "grade"]);
    const specIdx = findIdx(["spesifikasi", "spec", "deskripsi", "desc", "catatan"]);

    const rows: ParsedInventoryRow[] = [];

    lines.slice(1).forEach((line, idx) => {
      const cols = line.split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''));
      if (cols.every(c => c.length === 0)) return;

      const name = nameIdx >= 0 && cols[nameIdx] ? cols[nameIdx] : cols[0] || "";
      const brand = brandIdx >= 0 && cols[brandIdx] ? cols[brandIdx] : "Umum";
      const model = modelIdx >= 0 && cols[modelIdx] ? cols[modelIdx] : name;
      const sku = skuIdx >= 0 && cols[skuIdx] ? cols[skuIdx] : `SKU-${Date.now().toString().slice(-4)}-${idx + 1}`;
      const priceBuy = priceBuyIdx >= 0 && cols[priceBuyIdx] ? Number(cols[priceBuyIdx].replace(/[^0-9]/g, '')) || 0 : 0;
      const priceSell = priceSellIdx >= 0 && cols[priceSellIdx] ? Number(cols[priceSellIdx].replace(/[^0-9]/g, '')) || (priceBuy > 0 ? priceBuy * 1.15 : 0) : (priceBuy > 0 ? priceBuy * 1.15 : 0);
      const category = categoryIdx >= 0 && cols[categoryIdx] ? cols[categoryIdx] : "Smartphone";
      const condition = conditionIdx >= 0 && cols[conditionIdx] ? cols[conditionIdx] : "-";
      const specifications = specIdx >= 0 && cols[specIdx] ? cols[specIdx] : "";
      
      const rawImei = imeiIdx >= 0 && cols[imeiIdx] ? cols[imeiIdx] : "";
      const imeis = rawImei ? rawImei.split(/[,\n;|]+/).map(i => i.trim()).filter(i => i.length >= 6) : [];
      const stock = stockIdx >= 0 && cols[stockIdx] ? Number(cols[stockIdx]) || imeis.length || 1 : imeis.length || 1;

      const errors: string[] = [];
      if (!name) errors.push("Nama Produk Kosong");
      if (priceSell < 0) errors.push("Harga Jual Tidak Valid");
      if (imeis.length === 0 && stock <= 0) errors.push("Stok/IMEI Kosong");

      rows.push({
        rowNum: idx + 1,
        tenantId: activeTenantId, // Automatic injection preview
        name,
        brand,
        model,
        sku,
        type: name.toLowerCase().includes("bekas") || condition !== "-" ? "BEKAS" : "BARU",
        category,
        condition,
        priceBuy,
        priceSell,
        stock,
        minStockAlert: 2,
        imeis,
        specifications,
        errors,
        hasError: errors.length > 0
      });
    });

    setParsedInventoryRows(rows);
  };

  // Parse Transaction CSV
  const parseTransactionCsv = (text: string) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length <= 1) {
      setParsedTransactionRows([]);
      setImportErrorMsg("File CSV kosong atau hanya berisi baris header.");
      return;
    }

    const firstLine = lines[0];
    const delimiter = firstLine.includes(";") && !firstLine.includes(",") ? ";" : ",";
    const headers = firstLine.split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase().replace(/[^a-z0-9]/g, ''));

    const findIdx = (keywords: string[]) => headers.findIndex(h => keywords.some(k => h.includes(k)));

    const invIdx = findIdx(["invoice", "struk", "id", "transaksi", "trx"]);
    const dateIdx = findIdx(["tanggal", "date", "waktu", "time"]);
    const custIdx = findIdx(["pelanggan", "customer", "nama", "pembeli"]);
    const phoneIdx = findIdx(["hp", "phone", "telepon", "kontak", "wa"]);
    const totalIdx = findIdx(["total", "bayar", "amount", "nominal", "harga"]);
    const methodIdx = findIdx(["metode", "method", "pembayaran", "payment"]);
    const statusIdx = findIdx(["status"]);
    const cashierIdx = findIdx(["kasir", "cashier", "petugas"]);
    const salesIdx = findIdx(["sales", "pramuniaga"]);
    const summaryIdx = findIdx(["produk", "item", "ringkasan", "barang"]);
    const notesIdx = findIdx(["catatan", "notes", "keterangan"]);

    const rows: ParsedTransactionRow[] = [];

    lines.slice(1).forEach((line, idx) => {
      const cols = line.split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''));
      if (cols.every(c => c.length === 0)) return;

      const invoiceId = invIdx >= 0 && cols[invIdx] ? cols[invIdx] : `INV/${activeTenantId.toUpperCase()}/${new Date().toISOString().slice(0, 10).replace(/-/g, "")}/${String(idx + 1).padStart(4, "0")}`;
      const date = dateIdx >= 0 && cols[dateIdx] ? cols[dateIdx] : new Date().toISOString();
      const customerName = custIdx >= 0 && cols[custIdx] ? cols[custIdx] : "Pelanggan Umum";
      const customerPhone = phoneIdx >= 0 && cols[phoneIdx] ? cols[phoneIdx] : "-";
      const totalAmount = totalIdx >= 0 && cols[totalIdx] ? Number(cols[totalIdx].replace(/[^0-9]/g, '')) || 0 : 0;
      const paymentMethod = methodIdx >= 0 && cols[methodIdx] ? cols[methodIdx].toUpperCase() : "TUNAI";
      const paymentStatus = statusIdx >= 0 && cols[statusIdx] ? cols[statusIdx].toUpperCase() : "PAID";
      const cashierName = cashierIdx >= 0 && cols[cashierIdx] ? cols[cashierIdx] : "Kasir Admin";
      const salesName = salesIdx >= 0 && cols[salesIdx] ? cols[salesIdx] : cashierName;
      const itemsSummary = summaryIdx >= 0 && cols[summaryIdx] ? cols[summaryIdx] : "Item Smartphone / Aksesoris";
      const notes = notesIdx >= 0 && cols[notesIdx] ? cols[notesIdx] : "";

      const errors: string[] = [];
      if (totalAmount <= 0) errors.push("Total Pembayaran Kosong/Nol");

      rows.push({
        rowNum: idx + 1,
        tenantId: activeTenantId,
        invoiceId,
        date,
        customerName,
        customerPhone,
        totalAmount,
        paymentMethod,
        paymentStatus,
        cashierName,
        salesName,
        itemsSummary,
        notes,
        errors,
        hasError: errors.length > 0
      });
    });

    setParsedTransactionRows(rows);
  };

  // Handle file selection for Importer
  const handleImporterFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv") && !file.name.endsWith(".txt")) {
      setImportErrorMsg("Format berkas harus berformat CSV (.csv).");
      return;
    }

    setSelectedFile(file);
    setImportErrorMsg("");
    setImportSuccessResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        if (importCategory === "INVENTORY") {
          parseInventoryCsv(text);
        } else {
          parseTransactionCsv(text);
        }
      }
    };
    reader.readAsText(file);
  };

  // Trigger Bulk Import Execution
  const handleExecuteBulkImport = async () => {
    if (importCategory === "INVENTORY") {
      if (parsedInventoryRows.length === 0) {
        setImportErrorMsg("Tidak ada baris data inventori untuk diimpor.");
        return;
      }

      setIsProcessingImport(true);
      setImportErrorMsg("");
      setImportSuccessResult(null);

      try {
        const payload = {
          items: parsedInventoryRows.map(r => ({
            name: r.name,
            brand: r.brand,
            model: r.model,
            sku: r.sku,
            type: r.type,
            category: r.category,
            condition: r.condition,
            priceBuy: r.priceBuy,
            priceSell: r.priceSell,
            stock: r.stock,
            minStockAlert: r.minStockAlert,
            imeis: r.imeis,
            specifications: r.specifications
          })),
          importMode,
          userId: currentUser?.id || "EMP-ADMIN",
          userName: currentUser?.name || "Admin"
        };

        const res = await apiPost("/api/migration/bulk-import/inventory", payload);
        const data = await res.json();

        if (!res.ok) {
          setImportErrorMsg(data.message || "Gagal memproses impor inventori.");
        } else {
          setImportSuccessResult(data);
          setSelectedFile(null);
          setParsedInventoryRows([]);
          fetchExportStats();
          if (onRefreshGlobalData) onRefreshGlobalData();
        }
      } catch (err: any) {
        setImportErrorMsg(`Kesalahan jaringan: ${err.message}`);
      } finally {
        setIsProcessingImport(false);
      }
    } else {
      if (parsedTransactionRows.length === 0) {
        setImportErrorMsg("Tidak ada baris data transaksi untuk diimpor.");
        return;
      }

      setIsProcessingImport(true);
      setImportErrorMsg("");
      setImportSuccessResult(null);

      try {
        const payload = {
          transactions: parsedTransactionRows.map(r => ({
            id: r.invoiceId,
            date: r.date,
            customerName: r.customerName,
            customerPhone: r.customerPhone,
            totalAmount: r.totalAmount,
            paymentMethod: r.paymentMethod,
            paymentStatus: r.paymentStatus,
            cashierName: r.cashierName,
            salesName: r.salesName,
            items_summary: r.itemsSummary,
            notes: r.notes
          })),
          userId: currentUser?.id || "EMP-ADMIN",
          userName: currentUser?.name || "Admin"
        };

        const res = await apiPost("/api/migration/bulk-import/transactions", payload);
        const data = await res.json();

        if (!res.ok) {
          setImportErrorMsg(data.message || "Gagal memproses impor riwayat transaksi.");
        } else {
          setImportSuccessResult(data);
          setSelectedFile(null);
          setParsedTransactionRows([]);
          fetchExportStats();
          if (onRefreshGlobalData) onRefreshGlobalData();
        }
      } catch (err: any) {
        setImportErrorMsg(`Kesalahan jaringan: ${err.message}`);
      } finally {
        setIsProcessingImport(false);
      }
    }
  };

  // Submit Assisted Ticket
  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketTitle.trim()) {
      setTicketErrorMsg("Judul permohonan migrasi wajib diisi.");
      return;
    }
    if (!ticketFile) {
      setTicketErrorMsg("Harap unggah berkas CSV data.");
      return;
    }

    setSubmittingTicket(true);
    setTicketErrorMsg("");
    setTicketSuccessMsg("");

    try {
      const res = await apiPost("/api/migration-requests", {
        title: ticketTitle,
        migrationType: ticketType,
        fileName: ticketFile.name,
        fileData: ticketFilePreview,
        recordCount: 100,
        notes: ticketNotes,
        submittedBy: currentUser?.name ? `${currentUser.name} (${currentUser.role || 'Admin'})` : "Admin Tenant"
      });

      const data = await res.json();
      if (!res.ok) {
        setTicketErrorMsg(data.message || "Gagal mengajukan tiket.");
      } else {
        setTicketSuccessMsg("🎉 Tiket migrasi berhasil diajukan ke tim teknis!");
        setTicketTitle("");
        setTicketNotes("");
        setTicketFile(null);
        setTicketFilePreview("");
        fetchMigrationRequests();
      }
    } catch (err: any) {
      setTicketErrorMsg(err.message);
    } finally {
      setSubmittingTicket(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Top Banner Header with Tenant Security Badge */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-indigo-900/50 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute left-0 bottom-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-black uppercase flex items-center gap-1.5 shadow-xs">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                MULTI-TENANT BULK MIGRATION ENGINE
              </span>
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                Tenant ID: <strong className="font-mono text-white">{activeTenantId}</strong>
              </span>
              <span className="bg-emerald-400/10 text-emerald-300 px-2.5 py-0.5 rounded-md text-[10px] font-bold border border-emerald-500/20 flex items-center gap-1">
                <Lock className="h-3 w-3" /> Auto-Injected
              </span>
            </div>

            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Database className="h-7 w-7 text-indigo-400" />
              Bulk Data Migration & CSV Hub
            </h2>

            <p className="text-xs text-slate-300 leading-relaxed">
              Utilitas migrasi massal aman untuk toko tenant. Impor katalog inventaris & IMEI atau riwayat transaksi penjualan dalam format CSV. Parameter <code className="bg-slate-800 text-indigo-300 px-1.5 py-0.5 rounded font-mono">tenant_id</code> otomatis disuntikkan ke setiap record untuk menjamin isolasi data 100%.
            </p>
          </div>

          {/* Quick Template Download CTA */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-2 w-full md:w-auto shrink-0">
            <a
              href="/api/migration/templates/inventory.csv"
              download={`template_inventori_${activeTenantId}.csv`}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all hover:scale-102 cursor-pointer"
            >
              <Download className="h-4 w-4" />
              Template CSV Inventori (.CSV)
            </a>
            <a
              href="/api/migration/templates/transactions.csv"
              download={`template_transaksi_${activeTenantId}.csv`}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all hover:scale-102 cursor-pointer"
            >
              <Download className="h-4 w-4 text-emerald-400" />
              Template CSV Transaksi (.CSV)
            </a>
          </div>
        </div>
      </div>

      {/* Main Feature Tabs Switcher */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-3">
        <button
          onClick={() => setActiveMainTab("BULK_IMPORT")}
          className={`flex items-center gap-2 pb-3 px-4 text-xs font-extrabold border-b-2 transition-all cursor-pointer ${
            activeMainTab === "BULK_IMPORT"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          }`}
        >
          <ArrowDownToLine className="h-4 w-4" />
          📥 Impor Data Massal (Bulk Importer)
        </button>

        <button
          onClick={() => setActiveMainTab("TENANT_EXPORT")}
          className={`flex items-center gap-2 pb-3 px-4 text-xs font-extrabold border-b-2 transition-all cursor-pointer ${
            activeMainTab === "TENANT_EXPORT"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          }`}
        >
          <ArrowUpFromLine className="h-4 w-4" />
          📤 Ekspor Data Tenant (CSV Exporter)
        </button>

        <button
          onClick={() => setActiveMainTab("ASSISTED_TICKETS")}
          className={`flex items-center gap-2 pb-3 px-4 text-xs font-extrabold border-b-2 transition-all cursor-pointer ${
            activeMainTab === "ASSISTED_TICKETS"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          }`}
        >
          <FileBadge className="h-4 w-4" />
          📋 Tiket Bantuan Migrasi ({requests.length})
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: BULK CSV IMPORTER */}
      {/* ========================================================================= */}
      {activeMainTab === "BULK_IMPORT" && (
        <div className="space-y-6">
          
          {/* Importer Controls Card */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-xs space-y-5">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-700 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Upload className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  Konfigurasi Impor Massal CSV
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Pilih kategori data yang ingin dimasukkan ke database tenant <strong className="text-indigo-600 dark:text-indigo-400">{activeTenantId}</strong>.
                </p>
              </div>

              {/* Data Category Toggle */}
              <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setImportCategory("INVENTORY");
                    setSelectedFile(null);
                    setParsedInventoryRows([]);
                    setParsedTransactionRows([]);
                    setImportErrorMsg("");
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    importCategory === "INVENTORY"
                      ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <Boxes className="h-3.5 w-3.5" />
                  Katalog Inventaris & IMEI
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setImportCategory("TRANSACTIONS");
                    setSelectedFile(null);
                    setParsedInventoryRows([]);
                    setParsedTransactionRows([]);
                    setImportErrorMsg("");
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    importCategory === "TRANSACTIONS"
                      ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <Receipt className="h-3.5 w-3.5" />
                  Riwayat Transaksi Penjualan
                </button>
              </div>
            </div>

            {/* Error Message */}
            {importErrorMsg && (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-xs text-rose-700 dark:text-rose-300 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <strong className="block font-bold">Terjadi Kesalahan Impor:</strong>
                  <span>{importErrorMsg}</span>
                </div>
              </div>
            )}

            {/* Success Result Banner */}
            {importSuccessResult && (
              <div className="p-5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs text-emerald-800 dark:text-emerald-200 space-y-2">
                <div className="flex items-center gap-2 font-black text-sm">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  {importSuccessResult.message}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-200 dark:border-emerald-800/60 font-mono text-[11px]">
                  <div className="bg-white/60 dark:bg-slate-900/60 p-2 rounded-xl">
                    <span className="text-slate-500 block text-[9px] uppercase">Tenant Target</span>
                    <strong className="text-indigo-600 dark:text-indigo-400">{importSuccessResult.tenantId}</strong>
                  </div>
                  <div className="bg-white/60 dark:bg-slate-900/60 p-2 rounded-xl">
                    <span className="text-slate-500 block text-[9px] uppercase">Record Baru</span>
                    <strong className="text-emerald-600">+{importSuccessResult.importedCount}</strong>
                  </div>
                  <div className="bg-white/60 dark:bg-slate-900/60 p-2 rounded-xl">
                    <span className="text-slate-500 block text-[9px] uppercase">Record Diperbarui</span>
                    <strong className="text-amber-600">{importSuccessResult.updatedCount || 0}</strong>
                  </div>
                  <div className="bg-white/60 dark:bg-slate-900/60 p-2 rounded-xl">
                    <span className="text-slate-500 block text-[9px] uppercase">Dilewati / Duplikat</span>
                    <strong className="text-slate-600 dark:text-slate-400">{importSuccessResult.skippedCount}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Options Bar & Dropzone */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              
              {/* File Dropzone (8 Cols) */}
              <div className="md:col-span-8 space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Pilih atau Tarik Berkas CSV {importCategory === "INVENTORY" ? "Stok Inventaris" : "Transaksi"} *</span>
                  <span className="text-[10px] text-slate-400">Pemisah: Koma (,) atau Titik Koma (;)</span>
                </label>

                <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-indigo-500 dark:hover:border-indigo-400 bg-slate-50/60 dark:bg-slate-900/40 rounded-2xl p-6 text-center transition-all cursor-pointer group">
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleImporterFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  
                  <div className="space-y-2 pointer-events-none">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto border border-indigo-200 dark:border-indigo-800 group-hover:scale-110 transition-transform shadow-xs">
                      <FileSpreadsheet className="h-6 w-6" />
                    </div>

                    {selectedFile ? (
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                        </p>
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                          ✓ Terbaca {importCategory === "INVENTORY" ? parsedInventoryRows.length : parsedTransactionRows.length} baris rekam data.
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Klik untuk memilih berkas CSV atau seret ke area ini
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Format didukung: CSV UTF-8. Kolom <strong className="font-mono text-indigo-500">tenant_id</strong> akan disuntikkan secara otomatis.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Mode Selection and Security Info (4 Cols) */}
              <div className="md:col-span-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-3.5">
                <div className="space-y-1">
                  <span className="text-[11px] font-extrabold uppercase text-slate-400">Strategi Penanganan Duplikat</span>
                  <div className="space-y-2 pt-1">
                    <label className="flex items-start gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        name="importMode"
                        checked={importMode === "UPSERT"}
                        onChange={() => setImportMode("UPSERT")}
                        className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <span className="block font-bold">Upsert / Merge (Rekomendasi)</span>
                        <span className="text-[10px] text-slate-400 font-normal">Perbarui stok & IMEI jika produk/SKU sudah ada di database.</span>
                      </div>
                    </label>

                    <label className="flex items-start gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        name="importMode"
                        checked={importMode === "APPEND"}
                        onChange={() => setImportMode("APPEND")}
                        className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <span className="block font-bold">Hanya Tambah Baru (Append)</span>
                        <span className="text-[10px] text-slate-400 font-normal">Hanya buat item baru, lewati jika ada benturan ID.</span>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="p-2.5 bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 rounded-xl text-[10px] text-indigo-900 dark:text-indigo-300 space-y-1">
                  <div className="flex items-center gap-1 font-bold">
                    <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
                    Jaminan Isolasi Tenant
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">
                    Sistem otomatis mengikat seluruh baris ke <strong className="font-mono text-indigo-600 dark:text-indigo-400">{activeTenantId}</strong>. Tidak ada risiko data tertukar ke tenant lain.
                  </p>
                </div>
              </div>
            </div>

            {/* Live Preview Table with Auto-Injected Tenant ID */}
            {selectedFile && (
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ListChecks className="h-4 w-4 text-indigo-600" />
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Pratinjau Data CSV Terverifikasi ({importCategory === "INVENTORY" ? parsedInventoryRows.length : parsedTransactionRows.length} Baris):
                    </h4>
                  </div>
                  
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold flex items-center gap-1">
                      <Check className="h-3 w-3" /> Siap Diinjeksi
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 font-mono font-bold">
                      tenant_id: {activeTenantId}
                    </span>
                  </div>
                </div>

                {/* Table Container */}
                <div className="max-h-72 overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner">
                  {importCategory === "INVENTORY" ? (
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-extrabold sticky top-0 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="px-3 py-2 text-center w-10">#</th>
                          <th className="px-3 py-2 bg-indigo-50/60 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">tenant_id (Auto)</th>
                          <th className="px-3 py-2">Nama Produk</th>
                          <th className="px-3 py-2">Merek / SKU</th>
                          <th className="px-3 py-2 text-right">Harga Modal</th>
                          <th className="px-3 py-2 text-right">Harga Jual</th>
                          <th className="px-3 py-2 text-center">Stok / IMEI</th>
                          <th className="px-3 py-2">Status Validasi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                        {parsedInventoryRows.slice(0, 20).map((row) => (
                          <tr key={row.rowNum} className={row.hasError ? "bg-rose-50/80 dark:bg-rose-950/40 text-rose-900" : "hover:bg-slate-50 dark:hover:bg-slate-700/40"}>
                            <td className="px-3 py-2 text-center font-mono font-bold text-slate-400">
                              {row.rowNum}
                            </td>
                            <td className="px-3 py-2 font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/30 dark:bg-indigo-950/30">
                              {row.tenantId}
                            </td>
                            <td className="px-3 py-2 font-bold max-w-[160px] truncate">
                              {row.name}
                              <span className="block text-[9px] font-normal text-slate-400">{row.category} • {row.type}</span>
                            </td>
                            <td className="px-3 py-2 font-mono text-[10px]">
                              {row.brand} / {row.sku}
                            </td>
                            <td className="px-3 py-2 text-right font-mono">
                              Rp {row.priceBuy.toLocaleString("id-ID")}
                            </td>
                            <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              Rp {row.priceSell.toLocaleString("id-ID")}
                            </td>
                            <td className="px-3 py-2 text-center font-mono font-bold">
                              {row.stock} unit
                              {row.imeis.length > 0 && (
                                <span className="block text-[9px] font-normal text-slate-400">({row.imeis.length} IMEI)</span>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              {row.hasError ? (
                                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-rose-200 text-rose-900">
                                  {row.errors.join(", ")}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 inline-flex items-center gap-1">
                                  <Check className="h-3 w-3" /> Valid
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-extrabold sticky top-0 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="px-3 py-2 text-center w-10">#</th>
                          <th className="px-3 py-2 bg-indigo-50/60 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">tenant_id (Auto)</th>
                          <th className="px-3 py-2">No. Invoice</th>
                          <th className="px-3 py-2">Pelanggan</th>
                          <th className="px-3 py-2 text-right">Total Bayar</th>
                          <th className="px-3 py-2">Metode</th>
                          <th className="px-3 py-2">Ringkasan Item</th>
                          <th className="px-3 py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                        {parsedTransactionRows.slice(0, 20).map((row) => (
                          <tr key={row.rowNum} className={row.hasError ? "bg-rose-50/80 dark:bg-rose-950/40" : "hover:bg-slate-50 dark:hover:bg-slate-700/40"}>
                            <td className="px-3 py-2 text-center font-mono font-bold text-slate-400">
                              {row.rowNum}
                            </td>
                            <td className="px-3 py-2 font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/30 dark:bg-indigo-950/30">
                              {row.tenantId}
                            </td>
                            <td className="px-3 py-2 font-mono font-bold text-slate-800 dark:text-slate-200">
                              {row.invoiceId}
                            </td>
                            <td className="px-3 py-2 font-bold">
                              {row.customerName}
                              <span className="block text-[9px] font-normal text-slate-400 font-mono">{row.customerPhone}</span>
                            </td>
                            <td className="px-3 py-2 text-right font-mono font-black text-emerald-600 dark:text-emerald-400">
                              Rp {row.totalAmount.toLocaleString("id-ID")}
                            </td>
                            <td className="px-3 py-2 font-bold text-[10px]">
                              {row.paymentMethod}
                            </td>
                            <td className="px-3 py-2 max-w-[180px] truncate text-slate-500">
                              {row.itemsSummary}
                            </td>
                            <td className="px-3 py-2">
                              {row.hasError ? (
                                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-rose-200 text-rose-900">
                                  {row.errors.join(", ")}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 inline-flex items-center gap-1">
                                  <Check className="h-3 w-3" /> Siap
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {(importCategory === "INVENTORY" ? parsedInventoryRows.length : parsedTransactionRows.length) > 20 && (
                  <p className="text-[10px] text-slate-400 text-center italic">
                    Menampilkan 20 dari total {importCategory === "INVENTORY" ? parsedInventoryRows.length : parsedTransactionRows.length} baris data CSV.
                  </p>
                )}

                {/* Import Action Button */}
                <button
                  type="button"
                  onClick={handleExecuteBulkImport}
                  disabled={isProcessingImport || (importCategory === "INVENTORY" ? parsedInventoryRows.length === 0 : parsedTransactionRows.length === 0)}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isProcessingImport ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Memproses Injeksi Bulk Data ke Tenant {activeTenantId}...
                    </>
                  ) : (
                    <>
                      <ArrowDownToLine className="h-4 w-4" />
                      Proses Impor Massal Sekarang ({importCategory === "INVENTORY" ? parsedInventoryRows.length : parsedTransactionRows.length} Record)
                    </>
                  )}
                </button>
              </div>
            )}

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: TENANT CSV EXPORTER */}
      {/* ========================================================================= */}
      {activeMainTab === "TENANT_EXPORT" && (
        <div className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Export Inventory Card */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800">
                  <Boxes className="h-6 w-6" />
                </div>

                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Ekspor Katalog Inventaris & IMEI (.CSV)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Unduh seluruh data produk, varian, nomor serial IMEI, modal, harga jual, dan status stok saat ini dalam format CSV standar.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-500">Jumlah Produk Terdaftar:</span>
                  <strong className="text-indigo-600 dark:text-indigo-400 font-bold">
                    {loadingExportStats ? "..." : `${exportStats.productsCount} Model / Item`}
                  </strong>
                </div>

                <div className="text-[11px] text-slate-500 space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <Check className="h-3.5 w-3.5" /> Disertai kolom <code className="font-mono">tenant_id: {activeTenantId}</code>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <Check className="h-3.5 w-3.5" /> Kompatibel dengan Excel, Google Sheets, & Database SQL
                  </div>
                </div>
              </div>

              <a
                href="/api/migration/export/inventory.csv"
                download={`inventory_tenant_${activeTenantId}_${new Date().toISOString().slice(0, 10)}.csv`}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
              >
                <Download className="h-4 w-4" />
                Unduh Data Inventori Tenant ({exportStats.productsCount} Item)
              </a>
            </div>

            {/* Export Transactions Card */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
                  <Receipt className="h-6 w-6" />
                </div>

                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Ekspor Riwayat Transaksi & Struk (.CSV)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Unduh seluruh rekam invoice penjualan, nomor struk, rincian pelanggan, kasir, metode pembayaran, dan nominal transaksi.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-500">Jumlah Transaksi Terdaftar:</span>
                  <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                    {loadingExportStats ? "..." : `${exportStats.transactionsCount} Invoice`}
                  </strong>
                </div>

                <div className="text-[11px] text-slate-500 space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <Check className="h-3.5 w-3.5" /> Disertai kolom <code className="font-mono">tenant_id: {activeTenantId}</code>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <Check className="h-3.5 w-3.5" /> Lengkap dengan data tanggal ISO & status pembayaran
                  </div>
                </div>
              </div>

              <a
                href="/api/migration/export/transactions.csv"
                download={`transactions_tenant_${activeTenantId}_${new Date().toISOString().slice(0, 10)}.csv`}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <Download className="h-4 w-4" />
                Unduh Riwayat Transaksi Tenant ({exportStats.transactionsCount} Invoice)
              </a>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ASSISTED MIGRATION TICKETS & PHASE TRACKING */}
      {/* ========================================================================= */}
      {activeMainTab === "ASSISTED_TICKETS" && (
        <div className="space-y-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Form Ticket */}
            <div className="lg:col-span-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Send className="h-5 w-5 text-indigo-600" />
                Ajukan Permohonan Migrasi Bantuan Tim FonePOS
              </h3>

              {ticketErrorMsg && (
                <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{ticketErrorMsg}</span>
                </div>
              )}

              {ticketSuccessMsg && (
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{ticketSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmitTicket} className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Judul Permohonan Migrasi *
                  </label>
                  <input
                    type="text"
                    required
                    value={ticketTitle}
                    onChange={(e) => setTicketTitle(e.target.value)}
                    placeholder="Contoh: Migrasi Stok Database Accurate / Moka POS Lama"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Kategori Data
                    </label>
                    <select
                      value={ticketType}
                      onChange={(e) => setTicketType(e.target.value as any)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-white"
                    >
                      <option value="INVENTORY">Inventaris & IMEI</option>
                      <option value="CUSTOMERS">Pelanggan & Member</option>
                      <option value="ALL">Semua Data</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Tenant ID Terkait
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={activeTenantId}
                      className="w-full bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-500 font-mono rounded-xl px-3.5 py-2.5 text-xs cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Lampirkan Berkas CSV Sumber *
                  </label>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.txt"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        setTicketFile(f);
                        const r = new FileReader();
                        r.onload = (ev) => setTicketFilePreview((ev.target?.result as string).slice(0, 1000));
                        r.readAsText(f);
                      }
                    }}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Catatan / Instruksi Khusus
                  </label>
                  <textarea
                    rows={2}
                    value={ticketNotes}
                    onChange={(e) => setTicketNotes(e.target.value)}
                    placeholder="Contoh: Mohon bantu mapping kode SKU lama ke format FonePOS..."
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingTicket}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  {submittingTicket ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Kirim Tiket Permohonan Migrasi
                </button>
              </form>
            </div>

            {/* SOP Flow */}
            <div className="lg:col-span-6 space-y-4">
              <div className="bg-gradient-to-br from-indigo-50 to-slate-50 dark:from-slate-900 dark:to-slate-800 border border-indigo-100 dark:border-slate-700 rounded-3xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  Alur Fase Migrasi Terpandu
                </h3>

                <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-indigo-600 text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">1</div>
                    <p><strong>Fase 1 - Mapping:</strong> Pemetaan kolom (IMEI, Product Name, SKU, Stock, Customer) dan penyesuaian skema.</p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-indigo-600 text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</div>
                    <p><strong>Fase 2 - Uploading:</strong> Injeksi data massal disertai otomatisasi penyematan <code>tenant_id</code>.</p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-indigo-600 text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">3</div>
                    <p><strong>Fase 3 - Verification & Completed:</strong> Pemeriksaan QA oleh pemilik toko sebelum penyelesaian penuh.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Tickets Tracking Table */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="h-4 w-4 text-indigo-600" />
                Daftar Tiket Permohonan Migrasi Terdaftar
              </h3>
              <button
                onClick={fetchMigrationRequests}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 cursor-pointer"
                title="Segarkan Data"
              >
                <RefreshCw className={`h-4 w-4 ${loadingRequests ? "animate-spin text-indigo-600" : ""}`} />
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-extrabold uppercase text-[10px]">
                  <tr>
                    <th className="px-4 py-3">ID Tiket</th>
                    <th className="px-4 py-3">Judul & Berkas</th>
                    <th className="px-4 py-3">Kategori</th>
                    <th className="px-4 py-3">Fase Aktif</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                  {requests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                        Belum ada tiket migrasi bantuan yang diajukan.
                      </td>
                    </tr>
                  ) : (
                    requests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40">
                        <td className="px-4 py-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {req.id}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                          {req.title}
                          <span className="block text-[10px] font-mono text-slate-400 font-normal">{req.fileName}</span>
                        </td>
                        <td className="px-4 py-3 text-[11px]">
                          {req.migrationType}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                            {req.currentPhase || "Mapping"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[11px] font-bold">
                          {req.status}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={async () => {
                              if (confirm(`Hapus tiket ${req.id}?`)) {
                                await apiFetch(`/api/migration-requests/${req.id}`, { method: "DELETE" });
                                fetchMigrationRequests();
                              }
                            }}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg cursor-pointer"
                            title="Hapus Tiket"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
