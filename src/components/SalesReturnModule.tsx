import React, { useState, useEffect } from "react";
import { 
  Undo2, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Printer, 
  Plus, 
  FileText, 
  Calendar, 
  User, 
  Phone, 
  ArrowLeft,
  DollarSign,
  PackageCheck,
  ShieldAlert,
  X,
  Sparkles,
  Filter
} from "lucide-react";
import { Return, Transaction, Employee } from "../types";
import { apiFetch } from "../lib/api";

interface SalesReturnModuleProps {
  currentUser: Employee;
  transactions: Transaction[];
  onRefreshGlobalState?: () => void;
}

export default function SalesReturnModule({ currentUser, transactions, onRefreshGlobalState }: SalesReturnModuleProps) {
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterCondition, setFilterCondition] = useState<string>("ALL");

  // Process Return Modal state
  const [showProcessModal, setShowProcessModal] = useState<boolean>(false);
  const [invoiceSearchInput, setInvoiceSearchInput] = useState<string>("");
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [selectedReturnItems, setSelectedReturnItems] = useState<{
    productId: string;
    productName: string;
    brand?: string;
    model?: string;
    imei: string;
    reason: string;
    stockCondition: "LAYAK_JUAL" | "RUSAK";
    refundAmount: number;
  }[]>([]);
  const [returnNotes, setReturnNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Print Receipt Modal state
  const [selectedReceipt, setSelectedReceipt] = useState<Return | null>(null);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/api/returns");
      if (res.ok) {
        const data = await res.json();
        setReturns(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("Gagal mengambil data retur penjualan:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  const handleSearchInvoice = () => {
    if (!invoiceSearchInput.trim()) return;
    const term = invoiceSearchInput.trim().toLowerCase();
    const found = transactions.find(
      (t) =>
        t.id.toLowerCase() === term ||
        t.customerName.toLowerCase().includes(term) ||
        t.customerPhone.includes(term) ||
        t.items.some((i) => i.imei && i.imei.toLowerCase() === term)
    );

    if (found) {
      setSelectedTx(found);
      setSelectedReturnItems([]);
    } else {
      alert(`Invoice atau IMEI "${invoiceSearchInput}" tidak ditemukan dalam daftar transaksi.`);
      setSelectedTx(null);
    }
  };

  const handleToggleItemSelection = (item: any, isChecked: boolean) => {
    if (isChecked) {
      setSelectedReturnItems((prev) => [
        ...prev,
        {
          productId: item.productId,
          productName: item.name,
          brand: item.brand,
          model: item.model,
          imei: item.imei || "-",
          reason: "Barang tidak sesuai / Cacat pabrik",
          stockCondition: "RUSAK",
          refundAmount: item.priceSell || 0
        }
      ]);
    } else {
      setSelectedReturnItems((prev) => prev.filter((i) => i.imei !== item.imei));
    }
  };

  const handleUpdateItemField = (imei: string, field: string, value: any) => {
    setSelectedReturnItems((prev) =>
      prev.map((i) => (i.imei === imei ? { ...i, [field]: value } : i))
    );
  };

  const handleSubmitReturn = async () => {
    if (!selectedTx) return;
    if (selectedReturnItems.length === 0) {
      alert("Pilih setidaknya 1 produk yang ingin dikembalikan / diretur.");
      return;
    }

    // Validate reasons
    const missingReason = selectedReturnItems.some((i) => !i.reason.trim());
    if (missingReason) {
      alert("Mohon isi alasan retur untuk semua produk yang dipilih.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await apiFetch("/api/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: selectedTx.id,
          items: selectedReturnItems,
          cashierId: currentUser.id,
          cashierName: currentUser.name,
          notes: returnNotes
        })
      });

      if (res.ok) {
        const data = await res.json();
        alert("🎉 Retur Penjualan berhasil diproses! Stok inventaris telah disesuaikan secara otomatis.");
        setShowProcessModal(false);
        setSelectedTx(null);
        setSelectedReturnItems([]);
        setInvoiceSearchInput("");
        setReturnNotes("");
        fetchReturns();
        if (onRefreshGlobalState) onRefreshGlobalState();
      } else {
        const err = await res.json();
        alert(`Gagal memproses retur: ${err.message || "Terjadi kesalahan server."}`);
      }
    } catch (e) {
      console.error(e);
      alert("Gagal memproses retur penjualan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered returns list
  const filteredReturns = returns.filter((r) => {
    const matchesSearch =
      r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.invoiceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.items.some(
        (i) =>
          i.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          i.imei.toLowerCase().includes(searchQuery.toLowerCase()) ||
          i.reason.toLowerCase().includes(searchQuery.toLowerCase())
      );

    if (filterCondition === "ALL") return matchesSearch;
    if (filterCondition === "RUSAK") {
      return matchesSearch && r.items.some((i) => i.stockCondition === "RUSAK");
    }
    if (filterCondition === "LAYAK_JUAL") {
      return matchesSearch && r.items.some((i) => i.stockCondition === "LAYAK_JUAL");
    }
    return matchesSearch;
  });

  // Calculate metrics
  const totalReturnCount = returns.length;
  const totalRefundValue = returns.reduce((sum, r) => sum + (r.totalRefund || 0), 0);
  const totalDamagedItems = returns.reduce(
    (sum, r) => sum + r.items.filter((i) => i.stockCondition === "RUSAK").length,
    0
  );
  const totalSellableRestored = returns.reduce(
    (sum, r) => sum + r.items.filter((i) => i.stockCondition === "LAYAK_JUAL").length,
    0
  );

  return (
    <div className="space-y-6">
      {/* HEADER BAR */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200/80 dark:border-rose-800 text-rose-600 rounded-2xl">
            <Undo2 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              Modul Retur Penjualan
              <span className="px-2.5 py-0.5 bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 rounded-full text-[10px] font-black uppercase">
                Inventory Auto-Sync
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Kelola pengembalian barang pelanggan, catat alasan retur, dan sesuaikan stok 'layak jual' atau 'stok rusak'
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowProcessModal(true);
            setInvoiceSearchInput("");
            setSelectedTx(null);
            setSelectedReturnItems([]);
          }}
          className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Proses Retur Baru
        </button>
      </div>

      {/* METRICS SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl flex items-center gap-4 shadow-xs">
          <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Kasus Retur</p>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white">{totalReturnCount} <span className="text-xs text-slate-400 font-normal">transaksi</span></p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl flex items-center gap-4 shadow-xs">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 rounded-xl">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Refund Keluar</p>
            <p className="text-xl font-extrabold text-rose-600 dark:text-rose-400">Rp {totalRefundValue.toLocaleString("id-ID")}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl flex items-center gap-4 shadow-xs">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-xl">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Stok Cacat / Rusak</p>
            <p className="text-xl font-extrabold text-amber-600 dark:text-amber-400">{totalDamagedItems} <span className="text-xs text-slate-400 font-normal">unit</span></p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl flex items-center gap-4 shadow-xs">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-xl">
            <PackageCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Restok Layak Jual</p>
            <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{totalSellableRestored} <span className="text-xs text-slate-400 font-normal">unit</span></p>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari ID Retur, Invoice, Customer, atau IMEI..."
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          <button
            type="button"
            onClick={() => setFilterCondition("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              filterCondition === "ALL"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            Semua ({returns.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterCondition("RUSAK")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              filterCondition === "RUSAK"
                ? "bg-rose-600 text-white"
                : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100"
            }`}
          >
            🔴 Stok Rusak ({returns.filter((r) => r.items.some((i) => i.stockCondition === "RUSAK")).length})
          </button>
          <button
            type="button"
            onClick={() => setFilterCondition("LAYAK_JUAL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              filterCondition === "LAYAK_JUAL"
                ? "bg-emerald-600 text-white"
                : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100"
            }`}
          >
            🟢 Layak Jual ({returns.filter((r) => r.items.some((i) => i.stockCondition === "LAYAK_JUAL")).length})
          </button>
        </div>
      </div>

      {/* TABLE DATA LIST */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <div className="w-8 h-8 border-3 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold">Memuat riwayat retur penjualan...</p>
          </div>
        ) : filteredReturns.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Undo2 className="h-7 w-7" />
            </div>
            <p className="text-sm font-extrabold text-slate-700 dark:text-slate-300">Belum Ada Data Retur Penjualan</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Klik tombol 'Proses Retur Baru' untuk mencatat barang yang dikembalikan pelanggan.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">No. Retur & Tanggal</th>
                  <th className="py-3.5 px-4">Invoice Asal</th>
                  <th className="py-3.5 px-4">Pelanggan</th>
                  <th className="py-3.5 px-4">Rincian Produk & Alasan</th>
                  <th className="py-3.5 px-4 text-center">Status Stok</th>
                  <th className="py-3.5 px-4 text-right">Total Refund</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredReturns.map((ret) => (
                  <tr key={ret.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-extrabold text-slate-900 dark:text-white font-mono">{ret.id}</p>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3 w-3" />
                        {new Date(ret.date).toLocaleString("id-ID")}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-primary-600 dark:text-primary-400 font-bold">
                      {ret.invoiceId}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-800 dark:text-slate-200">{ret.customerName}</p>
                      {ret.customerPhone && <p className="text-[10px] text-slate-400 font-mono">{ret.customerPhone}</p>}
                    </td>
                    <td className="py-3.5 px-4 space-y-1.5 max-w-xs">
                      {ret.items.map((item, idx) => (
                        <div key={idx} className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-[11px]">
                          <p className="font-bold text-slate-800 dark:text-slate-200">{item.productName}</p>
                          <p className="text-[10px] text-slate-500 font-mono">IMEI: {item.imei}</p>
                          <p className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold italic mt-0.5">
                            📌 Alasan: "{item.reason}"
                          </p>
                        </div>
                      ))}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex flex-col gap-1 items-center">
                        {ret.items.map((item, idx) => (
                          <span
                            key={idx}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 ${
                              item.stockCondition === "LAYAK_JUAL"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                                : "bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800"
                            }`}
                          >
                            {item.stockCondition === "LAYAK_JUAL" ? (
                              <>🟢 Layak Jual</>
                            ) : (
                              <>🔴 Stok Rusak</>
                            )}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-rose-600 dark:text-rose-400 font-mono text-sm">
                      Rp {ret.totalRefund.toLocaleString("id-ID")}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedReceipt(ret)}
                        className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 mx-auto"
                        title="Cetak Struk Retur"
                      >
                        <Printer className="h-3.5 w-3.5" /> Struk
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: PROSES RETUR PENJUALAN */}
      {showProcessModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full p-6 space-y-5 max-h-[92vh] overflow-y-auto shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/50 text-rose-600 rounded-2xl">
                  <Undo2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Proses Retur Penjualan</h3>
                  <p className="text-xs text-slate-500">Cari nomor invoice transaksi untuk memilih barang yang dikembalikan</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowProcessModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Step 1: Search Invoice */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                Langkah 1: Cari Invoice / No. HP Pelanggan / IMEI Handphone
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={invoiceSearchInput}
                  onChange={(e) => setInvoiceSearchInput(e.target.value)}
                  placeholder="Contoh: INV/20260804/0001 atau No HP / IMEI..."
                  className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-500"
                  onKeyDown={(e) => e.key === "Enter" && handleSearchInvoice()}
                />
                <button
                  type="button"
                  onClick={handleSearchInvoice}
                  className="px-5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-2xl font-bold text-xs flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Search className="h-4 w-4" /> Cari Invoice
                </button>
              </div>
            </div>

            {/* Step 2: Show Transaction Items Selection */}
            {selectedTx ? (
              <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-widest block">Invoice Terpilih</span>
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white font-mono">{selectedTx.id}</h4>
                    <p className="text-xs text-slate-500">
                      Pelanggan: <b className="text-slate-800 dark:text-slate-200">{selectedTx.customerName}</b> ({selectedTx.customerPhone || "-"})
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Tanggal Transaksi:</p>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{new Date(selectedTx.date).toLocaleString("id-ID")}</p>
                    <p className="text-xs font-extrabold text-emerald-600">Total Net: Rp {selectedTx.totalAmount.toLocaleString("id-ID")}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                    Langkah 2: Pilih Produk, Alasan Retur, dan Kondisi Stok
                  </label>

                  {selectedTx.items.length === 0 ? (
                    <div className="p-4 bg-amber-50 text-amber-800 rounded-2xl text-xs font-bold text-center">
                      Semua produk dalam invoice ini sudah pernah diretur sebelumnya.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedTx.items.map((item, idx) => {
                        const isSelected = selectedReturnItems.some((ri) => ri.imei === item.imei);
                        const returnItemData = selectedReturnItems.find((ri) => ri.imei === item.imei);

                        return (
                          <div
                            key={idx}
                            className={`p-4 rounded-2xl border transition-all space-y-3 ${
                              isSelected
                                ? "bg-rose-50/50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 shadow-xs"
                                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => handleToggleItemSelection(item, e.target.checked)}
                                className="mt-1 h-4 w-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500 cursor-pointer"
                              />
                              <div className="flex-1">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-extrabold text-sm text-slate-900 dark:text-white">{item.name}</p>
                                    <p className="text-xs text-slate-500 font-mono">IMEI: <b className="text-slate-800 dark:text-slate-200">{item.imei || "-"}</b></p>
                                  </div>
                                  <span className="font-extrabold text-slate-900 dark:text-white font-mono text-xs">
                                    Rp {(item.priceSell || 0).toLocaleString("id-ID")}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Additional Input fields when selected */}
                            {isSelected && returnItemData && (
                              <div className="pt-2 border-t border-rose-200/60 dark:border-rose-900/60 space-y-3 pl-7">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {/* Alasan Retur */}
                                  <div>
                                    <label className="text-[10px] font-extrabold text-slate-600 dark:text-slate-300 uppercase block mb-1">
                                      Alasan Pengembalian (Wajib)
                                    </label>
                                    <select
                                      value={returnItemData.reason}
                                      onChange={(e) => handleUpdateItemField(item.imei, "reason", e.target.value)}
                                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold"
                                    >
                                      <option value="Cacat Pabrik / Software Corrupt">Cacat Pabrik / Software Corrupt</option>
                                      <option value="Layar Bergaris / Dead Pixel">Layar Bergaris / Dead Pixel</option>
                                      <option value="Baterai / Bodi Bermasalah">Baterai / Bodi Bermasalah</option>
                                      <option value="Batal Beli / Salah Tipe Tipe HP">Batal Beli / Salah Tipe HP</option>
                                      <option value="Garansi Tukar Unit Baru">Garansi Tukar Unit Baru</option>
                                      <option value="Lainnya">Lainnya (Ketik Manual)</option>
                                    </select>
                                  </div>

                                  {/* Opsi Stok: Stok Layak Jual vs Stok Rusak */}
                                  <div>
                                    <label className="text-[10px] font-extrabold text-slate-600 dark:text-slate-300 uppercase block mb-1">
                                      Opsi Penyesuaian Inventaris
                                    </label>
                                    <div className="flex gap-2">
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateItemField(item.imei, "stockCondition", "RUSAK")}
                                        className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1 transition-all cursor-pointer border ${
                                          returnItemData.stockCondition === "RUSAK"
                                            ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                                            : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200"
                                        }`}
                                      >
                                        <XCircle className="h-3.5 w-3.5" />
                                        🔴 Stok Rusak
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateItemField(item.imei, "stockCondition", "LAYAK_JUAL")}
                                        className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1 transition-all cursor-pointer border ${
                                          returnItemData.stockCondition === "LAYAK_JUAL"
                                            ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                                            : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200"
                                        }`}
                                      >
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        🟢 Layak Jual
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {/* Custom notes option */}
                                {returnItemData.reason === "Lainnya" && (
                                  <input
                                    type="text"
                                    placeholder="Tuliskan detail alasan retur..."
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold"
                                    onChange={(e) => handleUpdateItemField(item.imei, "reason", e.target.value)}
                                  />
                                )}

                                <p className="text-[10px] text-slate-500 italic">
                                  {returnItemData.stockCondition === "RUSAK" ? (
                                    <span className="text-rose-600 font-bold">
                                      ⚠️ 'Stok Rusak': Barang dimasukkan ke inventaris cacat/karantina dan TIDAK akan muncul di stok siap jual.
                                    </span>
                                  ) : (
                                    <span className="text-emerald-600 font-bold">
                                      ✓ 'Layak Jual': Barang dimasukkan kembali ke stok aktif dan IMEI {item.imei} siap dijual ulang.
                                    </span>
                                  )}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-slate-400 space-y-1">
                <Search className="h-8 w-8 mx-auto text-slate-300" />
                <p className="text-xs font-bold">Silakan ketik nomor invoice untuk mulai memilih produk retur.</p>
              </div>
            )}

            {/* Actions */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Total Pengembalian Dana:</p>
                <p className="text-lg font-extrabold text-rose-600 dark:text-rose-400 font-mono">
                  Rp{" "}
                  {selectedReturnItems
                    .reduce((acc, i) => acc + (i.refundAmount || 0), 0)
                    .toLocaleString("id-ID")}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowProcessModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSubmitReturn}
                  disabled={!selectedTx || selectedReturnItems.length === 0 || isSubmitting}
                  className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs transition-all shadow-md shadow-rose-600/20 disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <Undo2 className="h-4 w-4" /> Proses Retur Penjualan
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: PRINT STRUK RETUR */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Struk Pengembalian Barang (Retur)</h3>
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Simulated Receipt View */}
            <div className="bg-amber-50/50 dark:bg-slate-800 border border-amber-200/60 dark:border-slate-700 p-5 rounded-2xl font-mono text-xs text-slate-800 dark:text-slate-200 space-y-3">
              <div className="text-center space-y-0.5 border-b border-dashed border-slate-300 pb-2">
                <p className="font-extrabold text-sm text-slate-900 dark:text-white uppercase">FonePOS Roxy Square</p>
                <p className="text-[10px] text-slate-500">NOTA PENGEMBALIAN / STRUK RETUR</p>
                <p className="text-[10px] text-slate-400">ID Retur: {selectedReceipt.id}</p>
                <p className="text-[10px] text-slate-400">Ref Invoice: {selectedReceipt.invoiceId}</p>
                <p className="text-[10px] text-slate-400">{new Date(selectedReceipt.date).toLocaleString("id-ID")}</p>
              </div>

              <div className="space-y-1 text-[11px]">
                <p><b>Pelanggan:</b> {selectedReceipt.customerName}</p>
                <p><b>Kasir:</b> {selectedReceipt.cashierName}</p>
              </div>

              <div className="border-t border-b border-dashed border-slate-300 py-2 space-y-2 text-[11px]">
                {selectedReceipt.items.map((item, i) => (
                  <div key={i} className="space-y-0.5">
                    <p className="font-bold">{item.productName}</p>
                    <p className="text-[10px] text-slate-500">IMEI: {item.imei}</p>
                    <p className="text-[10px] text-rose-600 font-semibold">Alasan: {item.reason}</p>
                    <p className="text-[10px] font-bold">
                      Kondisi Stok: {item.stockCondition === "LAYAK_JUAL" ? "🟢 LAYAK JUAL" : "🔴 STOK RUSAK"}
                    </p>
                    <p className="text-right font-bold text-rose-600">Rp {item.refundAmount.toLocaleString("id-ID")}</p>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center font-bold text-sm text-rose-600 pt-1">
                <span>TOTAL REFUND:</span>
                <span>Rp {selectedReceipt.totalRefund.toLocaleString("id-ID")}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Printer className="h-4 w-4" /> Cetak Struk
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
