import React, { useState, useMemo } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { 
  FileText, 
  Search, 
  Filter, 
  ArrowLeftRight, 
  DollarSign, 
  ShieldCheck, 
  Building2, 
  Calendar, 
  User, 
  CheckCircle2, 
  Download, 
  Printer, 
  Info, 
  Smartphone,
  Eye,
  RefreshCw,
  Lock,
  Layers,
  RotateCcw,
  Undo2,
  X
} from "lucide-react";
import { AuditLogEntry, UserRole } from "../types";

interface AuditLogProps {
  auditLogs: AuditLogEntry[];
  onRefresh?: () => void;
  currentUser?: { name: string; role: string; id: string };
}

export const AuditLog: React.FC<AuditLogProps> = ({ auditLogs = [], onRefresh, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [cashierQuery, setCashierQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"ALL" | "INVENTORY" | "FINANCIAL" | "SECURITY">("ALL");
  const [selectedLogType, setSelectedLogType] = useState<string>("ALL");
  const [selectedActionType, setSelectedActionType] = useState<string>("ALL");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("ALL");
  const [selectedOutlet, setSelectedOutlet] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [imeiSearchTerm, setImeiSearchTerm] = useState("");
  const [selectedLogForDetail, setSelectedLogForDetail] = useState<AuditLogEntry | null>(null);

  // Statistics
  const stats = useMemo(() => {
    const totalCount = auditLogs.length;
    const inventoryCount = auditLogs.filter(l => l.category === "INVENTORY").length;
    const financialCount = auditLogs.filter(l => l.category === "FINANCIAL").length;
    const crossBranchCount = auditLogs.filter(l => l.logType === "CROSS_BRANCH_TRANSFER").length;
    const totalFinancialValue = auditLogs
      .filter(l => l.category === "FINANCIAL" && l.financialValue)
      .reduce((sum, l) => sum + (l.financialValue || 0), 0);

    return { totalCount, inventoryCount, financialCount, crossBranchCount, totalFinancialValue };
  }, [auditLogs]);

  // Unique list of outlets from logs
  const outletsList = useMemo(() => {
    const set = new Set<string>();
    auditLogs.forEach(l => {
      if (l.sourceOutletName) set.add(l.sourceOutletName);
      if (l.destinationOutletName) set.add(l.destinationOutletName);
    });
    return Array.from(set);
  }, [auditLogs]);

  // Unique list of employees/cashiers from logs
  const employeesList = useMemo(() => {
    const map = new Map<string, { id: string; name: string; role: string }>();
    auditLogs.forEach(l => {
      if (l.userId || l.userName) {
        const key = l.userId || l.userName;
        if (!map.has(key)) {
          map.set(key, {
            id: l.userId || l.userName,
            name: l.userName || l.userId,
            role: l.userRole || ""
          });
        }
      }
    });
    return Array.from(map.values());
  }, [auditLogs]);

  // Filtered Audit Logs
  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      // 1. Category match
      if (selectedCategory !== "ALL" && log.category !== selectedCategory) return false;
      
      // 2. Log type match
      if (selectedLogType !== "ALL" && log.logType !== selectedLogType) return false;

      // 3. Action type match (Penjualan, Retur, Opname, Transfer, Buyback, Conflict, Security)
      if (selectedActionType !== "ALL") {
        const act = (log.action || "").toUpperCase();
        const title = (log.title || "").toUpperCase();
        const desc = (log.description || "").toUpperCase();
        const category = (log.category || "").toUpperCase();
        const type = (log.logType || "").toUpperCase();

        if (selectedActionType === "PENJUALAN") {
          const isSales = type === "HIGH_VALUE_TRANSACTION" || act.includes("SALE") || act.includes("PENJUALAN") || title.includes("PENJUALAN") || title.includes("TRANSAKSI") || desc.includes("PENJUALAN") || desc.includes("TRANSAKSI") || category === "FINANCIAL";
          if (!isSales) return false;
        } else if (selectedActionType === "RETUR") {
          const isReturn = act.includes("RETUR") || act.includes("RETURN") || title.includes("RETUR") || title.includes("RETURN") || desc.includes("RETUR") || desc.includes("RETURN");
          if (!isReturn) return false;
        } else if (selectedActionType === "OPNAME") {
          const isOpname = type === "STOCK_ADJUSTMENT" || act.includes("OPNAME") || title.includes("OPNAME") || title.includes("PENYESUAIAN") || desc.includes("OPNAME") || desc.includes("PENYESUAIAN");
          if (!isOpname) return false;
        } else if (selectedActionType === "TRANSFER") {
          const isTransfer = type === "CROSS_BRANCH_TRANSFER" || act.includes("TRANSFER") || title.includes("TRANSFER") || desc.includes("TRANSFER");
          if (!isTransfer) return false;
        } else if (selectedActionType === "PURCHASE_BUYBACK") {
          const isBuyback = act.includes("BUYBACK") || act.includes("PURCHASE") || title.includes("BUYBACK") || title.includes("PEMBELIAN") || desc.includes("BUYBACK") || desc.includes("PEMBELIAN");
          if (!isBuyback) return false;
        } else if (selectedActionType === "CONFLICT_RESOLUTION") {
          const isConflict = type === "CONFLICT_RESOLUTION" || act.includes("CONFLICT") || title.includes("KONFLIK") || desc.includes("KONFLIK");
          if (!isConflict) return false;
        } else if (selectedActionType === "SECURITY") {
          const isSec = category === "SECURITY" || category === "SYSTEM" || act.includes("LOGIN") || act.includes("SECURITY");
          if (!isSec) return false;
        }
      }

      // 4. Employee / Cashier Dropdown Filter
      if (selectedEmployee !== "ALL") {
        const matchId = log.userId === selectedEmployee;
        const matchName = log.userName && log.userName.toLowerCase() === selectedEmployee.toLowerCase();
        if (!matchId && !matchName) return false;
      }

      // 5. Cashier Name Query Input Filter
      if (cashierQuery.trim() !== "") {
        const q = cashierQuery.toLowerCase().trim();
        const matchName = log.userName && log.userName.toLowerCase().includes(q);
        const matchId = log.userId && log.userId.toLowerCase().includes(q);
        const matchRole = log.userRole && log.userRole.toLowerCase().includes(q);
        if (!matchName && !matchId && !matchRole) return false;
      }

      // 6. Outlet match
      if (selectedOutlet !== "ALL") {
        const matchesSource = log.sourceOutletName === selectedOutlet;
        const matchesDest = log.destinationOutletName === selectedOutlet;
        if (!matchesSource && !matchesDest) return false;
      }

      // 7. Date Range match (startDate & endDate)
      if (startDate) {
        const logTime = new Date(log.timestamp).getTime();
        const startTime = new Date(`${startDate}T00:00:00`).getTime();
        if (isNaN(logTime) || logTime < startTime) return false;
      }

      if (endDate) {
        const logTime = new Date(log.timestamp).getTime();
        const endTime = new Date(`${endDate}T23:59:59.999`).getTime();
        if (isNaN(logTime) || logTime > endTime) return false;
      }

      // 8. Search match
      if (searchTerm.trim() !== "") {
        const query = searchTerm.toLowerCase();
        const titleMatch = log.title.toLowerCase().includes(query);
        const descMatch = log.description.toLowerCase().includes(query);
        const userMatch = log.userName.toLowerCase().includes(query);
        const userIdMatch = log.userId ? log.userId.toLowerCase().includes(query) : false;
        const actionMatch = log.action ? log.action.toLowerCase().includes(query) : false;
        const refMatch = log.referenceId ? log.referenceId.toLowerCase().includes(query) : false;
        const itemsMatch = log.items ? log.items.some(i => 
          i.productName.toLowerCase().includes(query) || 
          (i.imeis && i.imeis.some(imei => imei.toLowerCase().includes(query)))
        ) : false;

        if (!titleMatch && !descMatch && !userMatch && !userIdMatch && !actionMatch && !refMatch && !itemsMatch) return false;
      }

      // 9. IMEI search match
      if (imeiSearchTerm.trim() !== "") {
        const query = imeiSearchTerm.toLowerCase();
        const itemsImeiMatch = log.items ? log.items.some(i => 
          (i.imeis && i.imeis.some(imei => imei.toLowerCase().includes(query))) ||
          (i.imei && i.imei.toLowerCase().includes(query)) ||
          (i.serialNumber && i.serialNumber.toLowerCase().includes(query))
        ) : false;
        const descImeiMatch = (log.description || "").toLowerCase().includes(query);
        const titleImeiMatch = (log.title || "").toLowerCase().includes(query);
        const refImeiMatch = (log.referenceId || "").toLowerCase().includes(query);

        if (!itemsImeiMatch && !descImeiMatch && !titleImeiMatch && !refImeiMatch) return false;
      }

      return true;
    });
  }, [auditLogs, selectedCategory, selectedLogType, selectedActionType, selectedEmployee, cashierQuery, selectedOutlet, startDate, endDate, searchTerm, imeiSearchTerm]);

  const handleSetDatePreset = (preset: "today" | "yesterday" | "week" | "30days" | "month" | "lastMonth" | "clear") => {
    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().split("T")[0];

    if (preset === "today") {
      const dateStr = formatDate(today);
      setStartDate(dateStr);
      setEndDate(dateStr);
    } else if (preset === "yesterday") {
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      const dateStr = formatDate(yesterday);
      setStartDate(dateStr);
      setEndDate(dateStr);
    } else if (preset === "week") {
      const past = new Date();
      past.setDate(today.getDate() - 7);
      setStartDate(formatDate(past));
      setEndDate(formatDate(today));
    } else if (preset === "30days") {
      const past = new Date();
      past.setDate(today.getDate() - 30);
      setStartDate(formatDate(past));
      setEndDate(formatDate(today));
    } else if (preset === "month") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(formatDate(firstDay));
      setEndDate(formatDate(today));
    } else if (preset === "lastMonth") {
      const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      setStartDate(formatDate(firstDayLastMonth));
      setEndDate(formatDate(lastDayLastMonth));
    } else {
      setStartDate("");
      setEndDate("");
    }
  };

  const handleResetAllFilters = () => {
    setSearchTerm("");
    setCashierQuery("");
    setSelectedCategory("ALL");
    setSelectedLogType("ALL");
    setSelectedActionType("ALL");
    setSelectedEmployee("ALL");
    setSelectedOutlet("ALL");
    setStartDate("");
    setEndDate("");
    setImeiSearchTerm("");
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchTerm.trim() !== "") count++;
    if (cashierQuery.trim() !== "") count++;
    if (selectedCategory !== "ALL") count++;
    if (selectedLogType !== "ALL") count++;
    if (selectedActionType !== "ALL") count++;
    if (selectedEmployee !== "ALL") count++;
    if (selectedOutlet !== "ALL") count++;
    if (startDate || endDate) count++;
    if (imeiSearchTerm.trim() !== "") count++;
    return count;
  }, [searchTerm, cashierQuery, selectedCategory, selectedLogType, selectedActionType, selectedEmployee, selectedOutlet, startDate, endDate, imeiSearchTerm]);

  const handleExportPDF = () => {
    const listToExport = filteredLogs;
    if (listToExport.length === 0) {
      alert("Tidak ada data log untuk diekspor!");
      return;
    }

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4"
    });

    // Header
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, 297, 20, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("LAPORAN AUDIT LOG NEXUSPOS", 14, 12);

    const tableBody = listToExport.map((l, idx) => [
      idx + 1,
      new Date(l.timestamp).toLocaleString("id-ID"),
      l.category,
      l.logType,
      l.title,
      l.userName,
      l.financialValue ? `Rp ${l.financialValue.toLocaleString("id-ID")}` : "-"
    ]);

    autoTable(doc, {
      startY: 25,
      head: [["No", "Waktu", "Kategori", "Tipe", "Judul", "Pengguna", "Nilai"]],
      body: tableBody,
      theme: "grid",
      headStyles: { fillColor: [30, 41, 59], textColor: 255, fontSize: 8 },
      bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59], cellPadding: 2 },
    });

    doc.save(`Audit_Log_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const handleExportCSV = () => {
    const headers = ["ID", "Waktu", "Kategori", "Tipe Log", "Judul", "Deskripsi", "Outlet Asal", "Outlet Tujuan", "Pengguna", "Nilai (IDR)", "Status Verifikasi"];
    const rows = filteredLogs.map(l => [
      l.id,
      l.timestamp ? new Date(l.timestamp).toLocaleString("id-ID") : "-",
      l.category,
      l.logType,
      `"${l.title.replace(/"/g, '""')}"`,
      `"${l.description.replace(/"/g, '""')}"`,
      l.sourceOutletName || "-",
      l.destinationOutletName || "-",
      l.userName,
      l.financialValue || 0,
      l.verificationStatus
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Audit_Log_NexusPOS_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER TITLE BAR */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="h-4 w-4 text-indigo-400 animate-pulse" />
              <span>Multi-Tenant Transparency & Isolation Audit</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Audit Log Transaksi & Stok Antar Cabang
            </h1>
            <p className="text-slate-300 text-xs md:text-sm max-w-2xl leading-relaxed">
              Pencatatan resmi seluruh perpindahan inventaris antar outlet, transaksi bernilai tinggi, serta aksi modifikasi persediaan demi transparansi dan akuntabilitas multi-cabang.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh Logs</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Download className="h-4 w-4" />
              <span>Ekspor (CSV)</span>
            </button>
            <button
              type="button"
              onClick={handleExportPDF}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20"
            >
              <FileText className="h-4 w-4" />
              <span>Ekspor (PDF)</span>
            </button>
          </div>
        </div>

        {/* METRICS SUMMARY GRID */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 mt-6 border-t border-slate-700/60">
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Catatan Audit</span>
            <div className="text-xl md:text-2xl font-extrabold text-white">{stats.totalCount} Log</div>
            <p className="text-[10px] text-slate-400">Tercatat secara otomatis</p>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 space-y-1">
            <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">Gerakan Stok Antar Cabang</span>
            <div className="text-xl md:text-2xl font-extrabold text-amber-400">{stats.crossBranchCount} Transfer</div>
            <p className="text-[10px] text-amber-200/70">Terverifikasi 1 Tenant</p>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 space-y-1">
            <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block">Vol. Transaksi Nilai Tinggi</span>
            <div className="text-xl md:text-2xl font-extrabold text-emerald-400">{formatCurrency(stats.totalFinancialValue)}</div>
            <p className="text-[10px] text-emerald-200/70">{stats.financialCount} Transaksi Utama</p>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 space-y-1">
            <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block">Isolasi Keuangan & Stok</span>
            <div className="text-sm font-extrabold text-emerald-400 flex items-center gap-1.5 mt-1">
              <Lock className="h-4 w-4 text-emerald-400" />
              <span>STRICT SEPARATION</span>
            </div>
            <p className="text-[10px] text-slate-400">Pemisahan log keuangan vs stok</p>
          </div>
        </div>
      </div>

      {/* CATEGORY TABS & FILTER CONTROLS */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          {/* Main Category Toggles */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedCategory("ALL")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                selectedCategory === "ALL"
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-md"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              <Layers className="h-4 w-4" />
              <span>Semua Log ({stats.totalCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategory("INVENTORY")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                selectedCategory === "INVENTORY"
                  ? "bg-amber-600 text-white shadow-md shadow-amber-600/20"
                  : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 hover:bg-amber-100"
              }`}
            >
              <ArrowLeftRight className="h-4 w-4" />
              <span>📦 Log Inventaris & Cabang ({stats.inventoryCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategory("FINANCIAL")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                selectedCategory === "FINANCIAL"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                  : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 hover:bg-emerald-100"
              }`}
            >
              <DollarSign className="h-4 w-4" />
              <span>💰 Log Keuangan Nilai Tinggi ({stats.financialCount})</span>
            </button>
          </div>

          <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Terverifikasi Tenant System</span>
          </div>
        </div>

        {/* ADVANCED FILTER PANEL: PENCARIAN RIWAYAT AKTIVITAS & INVESTIGASI */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5" />
              Investigasi Aktivitas Transaksi & Filter Audit Log
            </span>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={handleResetAllFilters}
                className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" />
                Reset Semua ({activeFilterCount}) Filter
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search Input Kata Kunci */}
            <div className="relative col-span-1 sm:col-span-2 lg:col-span-1">
              <label className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 mb-1 block">
                Kata Kunci / Invoice
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ID, Invoice, Produk..."
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Filter Input IMEI */}
            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 mb-1 block">
                Cari IMEI Spesifik
              </label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={imeiSearchTerm}
                  onChange={(e) => setImeiSearchTerm(e.target.value)}
                  placeholder="Ketik IMEI..."
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Filter Input Nama Kasir / Petugas */}
            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 mb-1 block">
                Cari Nama Kasir
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={cashierQuery}
                  onChange={(e) => setCashierQuery(e.target.value)}
                  placeholder="Ketik nama kasir..."
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Filter Pilih Karyawan Dropdown */}
            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 mb-1 block">
                Daftar Karyawan
              </label>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium text-slate-700 dark:text-slate-200"
              >
                <option value="ALL">Semua Kasir & Karyawan ({employeesList.length})</option>
                {employeesList.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} {emp.role ? `(${emp.role})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Tipe Aksi */}
            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 mb-1 block">
                Tipe Aktivitas
              </label>
              <select
                value={selectedActionType}
                onChange={(e) => setSelectedActionType(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium text-slate-700 dark:text-slate-200"
              >
                <option value="ALL">Semua Tipe Aktivitas</option>
                <option value="PENJUALAN">💰 Transaksi Penjualan POS</option>
                <option value="RETUR">↩️ Retur Penjualan</option>
                <option value="OPNAME">📦 Stock Opname & Penyesuaian</option>
                <option value="TRANSFER">🚚 Transfer Stok Cabang</option>
                <option value="PURCHASE_BUYBACK">🔄 Buyback & Pembelian</option>
                <option value="CONFLICT_RESOLUTION">⚡ Resolusi Konflik</option>
                <option value="SECURITY">🔒 Keamanan & Sistem</option>
              </select>
            </div>

            {/* Filter Cabang / Outlet */}
            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 mb-1 block">
                Cabang / Outlet
              </label>
              <select
                value={selectedOutlet}
                onChange={(e) => setSelectedOutlet(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium text-slate-700 dark:text-slate-200"
              >
                <option value="ALL">Semua Cabang Toko</option>
                {outletsList.map(outlet => (
                  <option key={outlet} value={outlet}>{outlet}</option>
                ))}
              </select>
            </div>
          </div>

          {/* RENTANG TANGGAL AUDIT & PRESETS */}
          <div className="bg-gradient-to-r from-slate-50 to-indigo-50/30 dark:from-slate-800/80 dark:to-slate-800/40 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-xs">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-2 shrink-0">
                <div className="p-1.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg">
                  <Calendar className="h-4 w-4" />
                </div>
                <span>Rentang Tanggal Audit:</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-400">Mulai:</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>
                <span className="text-slate-400 text-xs font-bold">s/d</span>
                <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-400">Selesai:</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Quick Date Presets */}
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
              <span className="text-[10px] font-semibold text-slate-400 mr-1 hidden xl:inline">Preset Cepat:</span>
              <button
                type="button"
                onClick={() => handleSetDatePreset("today")}
                className="px-2.5 py-1 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 dark:hover:bg-slate-600 transition-colors cursor-pointer"
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={() => handleSetDatePreset("yesterday")}
                className="px-2.5 py-1 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 dark:hover:bg-slate-600 transition-colors cursor-pointer"
              >
                Kemarin
              </button>
              <button
                type="button"
                onClick={() => handleSetDatePreset("week")}
                className="px-2.5 py-1 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 dark:hover:bg-slate-600 transition-colors cursor-pointer"
              >
                7 Hari
              </button>
              <button
                type="button"
                onClick={() => handleSetDatePreset("30days")}
                className="px-2.5 py-1 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 dark:hover:bg-slate-600 transition-colors cursor-pointer"
              >
                30 Hari
              </button>
              <button
                type="button"
                onClick={() => handleSetDatePreset("month")}
                className="px-2.5 py-1 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 dark:hover:bg-slate-600 transition-colors cursor-pointer"
              >
                Bulan Ini
              </button>
              <button
                type="button"
                onClick={() => handleSetDatePreset("lastMonth")}
                className="px-2.5 py-1 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 dark:hover:bg-slate-600 transition-colors cursor-pointer"
              >
                Bulan Lalu
              </button>
              {(startDate || endDate) && (
                <button
                  type="button"
                  onClick={() => handleSetDatePreset("clear")}
                  className="px-2.5 py-1 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-lg hover:bg-rose-100 transition-colors cursor-pointer font-bold flex items-center gap-1"
                >
                  <X className="h-3 w-3" /> Hapus Tanggal
                </button>
              )}
            </div>
          </div>

          {/* ACTIVE FILTER CHIPS / TAGS */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Filter Aktif:</span>
              
              {startDate && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-[11px] font-semibold">
                  <Calendar className="h-3 w-3 text-indigo-500" />
                  Mulai: {startDate}
                  <button type="button" onClick={() => setStartDate("")} className="hover:text-indigo-900 cursor-pointer ml-0.5"><X className="h-3 w-3" /></button>
                </span>
              )}

              {endDate && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-[11px] font-semibold">
                  <Calendar className="h-3 w-3 text-indigo-500" />
                  Selesai: {endDate}
                  <button type="button" onClick={() => setEndDate("")} className="hover:text-indigo-900 cursor-pointer ml-0.5"><X className="h-3 w-3" /></button>
                </span>
              )}

              {cashierQuery && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold">
                  <User className="h-3 w-3 text-emerald-500" />
                  Kasir: "{cashierQuery}"
                  <button type="button" onClick={() => setCashierQuery("")} className="hover:text-emerald-900 cursor-pointer ml-0.5"><X className="h-3 w-3" /></button>
                </span>
              )}

              {selectedEmployee !== "ALL" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold">
                  <User className="h-3 w-3 text-emerald-500" />
                  Karyawan: {employeesList.find(e => e.id === selectedEmployee)?.name || selectedEmployee}
                  <button type="button" onClick={() => setSelectedEmployee("ALL")} className="hover:text-emerald-900 cursor-pointer ml-0.5"><X className="h-3 w-3" /></button>
                </span>
              )}

              {searchTerm && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 text-[11px] font-semibold">
                  <Search className="h-3 w-3 text-sky-500" />
                  Kata Kunci: "{searchTerm}"
                  <button type="button" onClick={() => setSearchTerm("")} className="hover:text-sky-900 cursor-pointer ml-0.5"><X className="h-3 w-3" /></button>
                </span>
              )}

              {imeiSearchTerm && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-[11px] font-semibold">
                  <Smartphone className="h-3 w-3 text-rose-500" />
                  IMEI: "{imeiSearchTerm}"
                  <button type="button" onClick={() => setImeiSearchTerm("")} className="hover:text-rose-900 cursor-pointer ml-0.5"><X className="h-3 w-3" /></button>
                </span>
              )}

              {selectedActionType !== "ALL" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-[11px] font-semibold">
                  <Filter className="h-3 w-3 text-purple-500" />
                  Aktivitas: {selectedActionType}
                  <button type="button" onClick={() => setSelectedActionType("ALL")} className="hover:text-purple-900 cursor-pointer ml-0.5"><X className="h-3 w-3" /></button>
                </span>
              )}

              {selectedOutlet !== "ALL" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-[11px] font-semibold">
                  <Building2 className="h-3 w-3 text-amber-500" />
                  Cabang: {selectedOutlet}
                  <button type="button" onClick={() => setSelectedOutlet("ALL")} className="hover:text-amber-900 cursor-pointer ml-0.5"><X className="h-3 w-3" /></button>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* AUDIT LOG TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
              Riwayat Audit ({filteredLogs.length} Entri Ditemukan)
            </h3>
          </div>
          <span className="text-[11px] font-medium text-slate-500">
            Menampilkan data log real-time terpisah per kategori
          </span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <Search className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Tidak ada data audit yang cocok</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Coba sesuaikan kata kunci pencarian, filter kategori, atau cabang yang Anda pilih.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Waktu Audit</th>
                  <th className="py-3.5 px-4">Kategori & Log</th>
                  <th className="py-3.5 px-4">Judul & Rincian</th>
                  <th className="py-3.5 px-4">Arah Outlet</th>
                  <th className="py-3.5 px-4">Petugas / Role</th>
                  <th className="py-3.5 px-4 text-right">Nilai Rupiah</th>
                  <th className="py-3.5 px-4 text-center">Status Keamanan</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                {filteredLogs.map(log => {
                  const isFinancial = log.category === "FINANCIAL";
                  const isCrossBranch = log.logType === "CROSS_BRANCH_TRANSFER";

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {new Date(log.timestamp).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {new Date(log.timestamp).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            isFinancial 
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                          }`}>
                            {isFinancial ? <DollarSign className="h-3 w-3" /> : <ArrowLeftRight className="h-3 w-3" />}
                            {log.category}
                          </span>
                          <div className="text-[10px] text-slate-500 font-semibold block">
                            {log.logType.replace(/_/g, " ")}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5 max-w-xs">
                          <div className="font-extrabold text-slate-900 dark:text-white line-clamp-1">
                            {log.title}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-tight">
                            {log.description}
                          </p>
                          {log.referenceId && (
                            <span className="inline-block mt-0.5 text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-1.5 py-0.2 rounded">
                              Ref: {log.referenceId}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isCrossBranch ? (
                          <div className="space-y-1 text-[11px]">
                            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                              <span className="text-[9px] font-bold text-slate-400 uppercase">ASAL:</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">{log.sourceOutletName || "Pusat"}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                              <span className="text-[9px] font-bold text-indigo-400 uppercase">TUJUAN:</span>
                              <span className="font-bold">{log.destinationOutletName || "Cabang"}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-600 dark:text-slate-400 font-semibold">
                            {log.sourceOutletName || "Toko Utama"}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-xs shrink-0">
                            {log.userName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 dark:text-slate-200">{log.userName}</div>
                            <div className="text-[9px] font-bold text-slate-400 uppercase">{log.userRole}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {log.financialValue && log.financialValue > 0 ? (
                          <span className="font-extrabold text-slate-900 dark:text-white font-mono text-xs">
                            {formatCurrency(log.financialValue)}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px] italic">Non-Finansial</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                          <span>Tenant Isolated</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedLogForDetail(log)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Lihat Detail Log Audit"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      {selectedLogForDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-6 overflow-hidden relative">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest block">Audit Detail Record</span>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {selectedLogForDetail.id}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLogForDetail(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl space-y-2">
                <div className="font-bold text-slate-900 dark:text-white text-sm">{selectedLogForDetail.title}</div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{selectedLogForDetail.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="border border-slate-100 dark:border-slate-800 p-3 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Kategori</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">{selectedLogForDetail.category}</span>
                </div>
                <div className="border border-slate-100 dark:border-slate-800 p-3 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Tipe Aktivitas</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">{selectedLogForDetail.logType}</span>
                </div>
                <div className="border border-slate-100 dark:border-slate-800 p-3 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Eksekutor</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">{selectedLogForDetail.userName} ({selectedLogForDetail.userRole})</span>
                </div>
                <div className="border border-slate-100 dark:border-slate-800 p-3 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Waktu Record</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">{selectedLogForDetail?.timestamp ? new Date(selectedLogForDetail.timestamp).toLocaleString("id-ID") : "-"}</span>
                </div>
              </div>

              {selectedLogForDetail.items && selectedLogForDetail.items.length > 0 && (
                <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Rincian Barang / IMEI Terkait:</span>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedLogForDetail.items.map((item, idx) => (
                      <div key={idx} className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-800 dark:text-slate-200">{item.productName}</div>
                          {item.imeis && item.imeis.length > 0 && (
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              IMEI: {item.imeis.join(", ")}
                            </div>
                          )}
                        </div>
                        <span className="font-extrabold text-slate-700 dark:text-slate-300">
                          x{item.quantity || (item.imeis ? item.imeis.length : 1)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 p-3 rounded-2xl flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <div className="text-[11px] text-emerald-800 dark:text-emerald-300">
                  <strong>Pernyataan Keamanan Data:</strong> Catatan ini diisolasi secara otomatis berdasarkan ID Tenant (<code className="font-mono">{selectedLogForDetail.tenantId || "default"}</code>) dan tidak bercampur dengan tenant lain.
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedLogForDetail(null)}
                className="px-5 py-2.5 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold rounded-xl text-xs hover:bg-slate-800 transition-all cursor-pointer"
              >
                Tutup Rincian
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
