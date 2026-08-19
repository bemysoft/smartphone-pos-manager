import React, { useState, useEffect } from "react";
import { 
  Building2, 
  ArrowLeftRight, 
  Plus, 
  Search, 
  Filter, 
  MapPin, 
  Phone, 
  User, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  XCircle, 
  Printer, 
  Boxes, 
  Send, 
  PackageCheck, 
  Edit3, 
  Trash2, 
  X, 
  Check, 
  FileText, 
  Sparkles, 
  ChevronRight, 
  Store, 
  QrCode,
  ShieldAlert,
  ArrowRight,
  Truck
} from "lucide-react";
import { apiFetch } from "../lib/api";
import { Outlet, StockTransfer, StockTransferItem, Product, UserRole } from "../types";
import { useLanguage } from "../contexts/LanguageContext";

export function TransferStatusBadge({ status, size = "md", showIcon = true }: { status: string; size?: "sm" | "md" | "lg"; showIcon?: boolean }) {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px] gap-1",
    md: "px-3 py-1 text-xs gap-1.5",
    lg: "px-3.5 py-1.5 text-xs font-black gap-2"
  }[size];

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-3.5 w-3.5",
    lg: "h-4 w-4"
  }[size];

  switch (status) {
    case "PENDING":
      return (
        <span className={`inline-flex items-center font-black rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-200 border border-amber-300 dark:border-amber-700/80 shadow-xs ${sizeClasses}`}>
          {showIcon && <Clock className={`${iconSizes} text-amber-700 dark:text-amber-400 animate-spin`} />}
          <span>Pending (Draf)</span>
        </span>
      );
    case "IN_TRANSIT":
      return (
        <span className={`inline-flex items-center font-black rounded-full bg-sky-100 text-sky-900 dark:bg-sky-950/80 dark:text-sky-200 border border-sky-300 dark:border-sky-700/80 shadow-xs ${sizeClasses}`}>
          {showIcon && <Truck className={`${iconSizes} text-sky-700 dark:text-sky-400 animate-bounce`} />}
          <span>In-Transit (Dalam Perjalanan)</span>
        </span>
      );
    case "RECEIVED":
    case "COMPLETED":
      return (
        <span className={`inline-flex items-center font-black rounded-full bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700/80 shadow-xs ${sizeClasses}`}>
          {showIcon && <CheckCircle2 className={`${iconSizes} text-emerald-700 dark:text-emerald-400`} />}
          <span>Completed (Selesai Diterima)</span>
        </span>
      );
    case "CANCELLED":
      return (
        <span className={`inline-flex items-center font-black rounded-full bg-rose-100 text-rose-900 dark:bg-rose-950/80 dark:text-rose-200 border border-rose-300 dark:border-rose-700/80 shadow-xs ${sizeClasses}`}>
          {showIcon && <XCircle className={`${iconSizes} text-rose-700 dark:text-rose-400`} />}
          <span>Dibatalkan</span>
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center font-bold rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700 ${sizeClasses}`}>
          <span>{status}</span>
        </span>
      );
  }
}

interface MultiOutletTransferProps {
  activeOutlet: Outlet | null;
  onSelectActiveOutlet: (outlet: Outlet) => void;
  userRole: UserRole;
  currentUser: any;
  products: Product[];
  onRefreshData?: () => void;
}

export default function MultiOutletTransfer({
  activeOutlet,
  onSelectActiveOutlet,
  userRole,
  currentUser,
  products,
  onRefreshData
}: MultiOutletTransferProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"outlets" | "transfers" | "history">("outlets");
  
  // Data States
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [toastMsg, setToastMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modal States
  const [showOutletModal, setShowOutletModal] = useState(false);
  const [editingOutlet, setEditingOutlet] = useState<Outlet | null>(null);
  const [outletFormData, setOutletFormData] = useState({
    code: "",
    name: "",
    address: "",
    phone: "",
    managerName: "",
    isMainBranch: false,
    status: "ACTIVE" as "ACTIVE" | "INACTIVE"
  });

  // Transfer Form Modal States
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [originOutletId, setOriginOutletId] = useState<string>("");
  const [destinationOutletId, setDestinationOutletId] = useState<string>("");
  const [transferNotes, setTransferNotes] = useState<string>("");
  const [dispatchImmediately, setDispatchImmediately] = useState<boolean>(true);
  
  // Selected Items for Transfer
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedImeis, setSelectedImeis] = useState<string[]>([]);
  const [transferItems, setTransferItems] = useState<StockTransferItem[]>([]);

  // Receive Transfer Modal
  const [receivingTransfer, setReceivingTransfer] = useState<StockTransfer | null>(null);
  const [receiveNotes, setReceiveNotes] = useState<string>("");

  // Bulk Transfer Selection & Confirm States
  const [selectedTransferIds, setSelectedTransferIds] = useState<string[]>([]);
  const [showBulkConfirmModal, setShowBulkConfirmModal] = useState(false);
  const [bulkNotes, setBulkNotes] = useState("");
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);

  // Surat Jalan / Printable Transfer Receipt Modal
  const [printingTransfer, setPrintingTransfer] = useState<StockTransfer | null>(null);

  // Fetch Outlets & Transfers
  const fetchData = async () => {
    setLoading(true);
    try {
      const [outletsRes, transfersRes] = await Promise.all([
        apiFetch("/api/outlets"),
        apiFetch("/api/stock-transfers")
      ]);

      if (outletsRes.ok) {
        const data = await outletsRes.json();
        setOutlets(data);
        if (!activeOutlet && data.length > 0) {
          const main = data.find((o: Outlet) => o.isMainBranch) || data[0];
          onSelectActiveOutlet(main);
        }
      }

      if (transfersRes.ok) {
        const data = await transfersRes.json();
        setTransfers(data);
      }
    } catch (err) {
      console.error("Gagal mengambil data outlet & transfer:", err);
      showToast("error", "Gagal memuat data outlet dan transfer stok.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (type: "success" | "error", text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 5000);
  };

  // Handle Outlet Modal Open
  const handleOpenAddOutlet = () => {
    setEditingOutlet(null);
    setOutletFormData({
      code: `CBG${outlets.length}`,
      name: "",
      address: "",
      phone: "",
      managerName: currentUser?.name || "",
      isMainBranch: false,
      status: "ACTIVE"
    });
    setShowOutletModal(true);
  };

  const handleOpenEditOutlet = (outlet: Outlet) => {
    setEditingOutlet(outlet);
    setOutletFormData({
      code: outlet.code,
      name: outlet.name,
      address: outlet.address,
      phone: outlet.phone,
      managerName: outlet.managerName || "",
      isMainBranch: outlet.isMainBranch,
      status: outlet.status
    });
    setShowOutletModal(true);
  };

  const handleSaveOutlet = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingOutlet ? `/api/outlets/${editingOutlet.id}` : "/api/outlets";
      const method = editingOutlet ? "PUT" : "POST";

      const res = await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(outletFormData)
      });

      if (res.ok) {
        showToast("success", editingOutlet ? "Outlet berhasil diperbarui!" : "Outlet baru berhasil ditambahkan!");
        setShowOutletModal(false);
        fetchData();
        if (onRefreshData) onRefreshData();
      } else {
        const err = await res.json();
        showToast("error", err.message || "Gagal menyimpan data outlet.");
      }
    } catch (err) {
      showToast("error", "Terjadi kesalahan server saat menyimpan outlet.");
    }
  };

  const handleDeleteOutlet = async (outlet: Outlet) => {
    if (outlet.isMainBranch) {
      showToast("error", "Outlet Utama / Pusat tidak boleh dihapus.");
      return;
    }
    if (!window.confirm(`Apakah Anda yakin ingin menghapus outlet '${outlet.name}'?`)) return;

    try {
      const res = await apiFetch(`/api/outlets/${outlet.id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("success", "Outlet berhasil dihapus.");
        fetchData();
      } else {
        const err = await res.json();
        showToast("error", err.message || "Gagal menghapus outlet.");
      }
    } catch (err) {
      showToast("error", "Terjadi kesalahan server.");
    }
  };

  // Open New Transfer Modal
  const handleOpenTransferModal = () => {
    const defaultOrigin = activeOutlet?.id || outlets[0]?.id || "";
    const defaultDest = outlets.find(o => o.id !== defaultOrigin)?.id || "";

    setOriginOutletId(defaultOrigin);
    setDestinationOutletId(defaultDest);
    setTransferNotes("");
    setDispatchImmediately(true);
    setTransferItems([]);
    setSelectedProductId("");
    setSelectedImeis([]);
    setShowTransferModal(true);
  };

  // Available products at selected origin outlet
  const originOutletObj = outlets.find(o => o.id === originOutletId);
  const availableProducts = products.filter(p => {
    if (!originOutletObj) return true;
    // Filter product by location or if location matches origin outlet name
    return (!p.location || p.location === originOutletObj.name || p.location === "Toko Utama") && p.stock > 0;
  });

  const selectedProductObj = products.find(p => p.id === selectedProductId);

  const handleAddItemToTransfer = () => {
    if (!selectedProductObj) return;
    if (selectedImeis.length === 0) {
      showToast("error", "Silakan pilih minimal 1 unit / IMEI untuk ditransfer.");
      return;
    }

    // Check if already in list
    const existingIndex = transferItems.findIndex(i => i.productId === selectedProductObj.id);
    if (existingIndex > -1) {
      const updated = [...transferItems];
      const mergedImeis = Array.from(new Set([...updated[existingIndex].imeis, ...selectedImeis]));
      updated[existingIndex].imeis = mergedImeis;
      updated[existingIndex].quantity = mergedImeis.length;
      setTransferItems(updated);
    } else {
      setTransferItems(prev => [
        ...prev,
        {
          productId: selectedProductObj.id,
          productName: selectedProductObj.name,
          brand: selectedProductObj.brand,
          model: selectedProductObj.model,
          type: selectedProductObj.type,
          imeis: [...selectedImeis],
          quantity: selectedImeis.length
        }
      ]);
    }

    // Reset selection
    setSelectedProductId("");
    setSelectedImeis([]);
  };

  const handleRemoveTransferItem = (productId: string) => {
    setTransferItems(prev => prev.filter(i => i.productId !== productId));
  };

  const handleCreateTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!originOutletId || !destinationOutletId) {
      showToast("error", "Outlet Asal dan Outlet Tujuan wajib dipilih.");
      return;
    }
    if (originOutletId === destinationOutletId) {
      showToast("error", "Outlet Asal dan Outlet Tujuan tidak boleh sama.");
      return;
    }
    if (transferItems.length === 0) {
      showToast("error", "Silakan tambahkan minimal 1 item barang yang akan ditransfer.");
      return;
    }

    const origObj = outlets.find(o => o.id === originOutletId);
    const destObj = outlets.find(o => o.id === destinationOutletId);

    try {
      const res = await apiFetch("/api/stock-transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originOutletId,
          originOutletName: origObj?.name || "Outlet Asal",
          destinationOutletId,
          destinationOutletName: destObj?.name || "Outlet Tujuan",
          items: transferItems,
          senderId: currentUser?.id || "EMP001",
          senderName: currentUser?.name || "Petugas Outlet",
          notes: transferNotes,
          dispatchImmediately
        })
      });

      if (res.ok) {
        showToast("success", dispatchImmediately ? "⚡ Barang berhasil dikirim (Status: Dalam Perjalanan)!" : "Draf pengiriman transfer stok berhasil dibuat!");
        setShowTransferModal(false);
        fetchData();
        if (onRefreshData) onRefreshData();
      } else {
        const err = await res.json();
        showToast("error", err.message || "Gagal membuat transfer stok.");
      }
    } catch (err) {
      showToast("error", "Terjadi kesalahan server.");
    }
  };

  // Actions for Transfer List
  const handleDispatchTransfer = async (transferId: string) => {
    try {
      const res = await apiFetch(`/api/stock-transfers/${transferId}/send`, { method: "PUT" });
      if (res.ok) {
        showToast("success", "Pengiriman barang dikonfirmasi! Stok di outlet asal telah dikurangi.");
        fetchData();
        if (onRefreshData) onRefreshData();
      } else {
        const err = await res.json();
        showToast("error", err.message || "Gagal mengirim barang.");
      }
    } catch (err) {
      showToast("error", "Terjadi kesalahan server.");
    }
  };

  const handleConfirmReceiveTransfer = async () => {
    if (!receivingTransfer) return;
    try {
      const res = await apiFetch(`/api/stock-transfers/${receivingTransfer.id}/receive`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: currentUser?.id || "EMP002",
          receiverName: currentUser?.name || "Penerima Outlet",
          notes: receiveNotes
        })
      });

      if (res.ok) {
        showToast("success", "✅ Penerimaan barang berhasil! Stok dan IMEI telah otomatis masuk ke inventaris outlet tujuan.");
        setReceivingTransfer(null);
        setReceiveNotes("");
        fetchData();
        if (onRefreshData) onRefreshData();
      } else {
        const err = await res.json();
        showToast("error", err.message || "Gagal mengonfirmasi penerimaan.");
      }
    } catch (err) {
      showToast("error", "Terjadi kesalahan server.");
    }
  };

  const handleCancelTransfer = async (transferId: string) => {
    if (!window.confirm("Apakah Anda yakin ingin membatalkan pengiriman transfer stok ini?")) return;
    try {
      const res = await apiFetch(`/api/stock-transfers/${transferId}/cancel`, { method: "PUT" });
      if (res.ok) {
        showToast("success", "Transfer stok telah dibatalkan.");
        fetchData();
        if (onRefreshData) onRefreshData();
      } else {
        const err = await res.json();
        showToast("error", err.message || "Gagal membatalkan transfer.");
      }
    } catch (err) {
      showToast("error", "Terjadi kesalahan server.");
    }
  };

  // Bulk Selection & Confirm Handlers
  const toggleSelectTransfer = (id: string) => {
    setSelectedTransferIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllInTransit = () => {
    const inTransitIds = filteredTransfers.filter(t => t.status === "IN_TRANSIT" || t.status === "PENDING").map(t => t.id);
    const allSelected = inTransitIds.length > 0 && inTransitIds.every(id => selectedTransferIds.includes(id));
    if (allSelected) {
      setSelectedTransferIds(prev => prev.filter(id => !inTransitIds.includes(id)));
    } else {
      setSelectedTransferIds(prev => Array.from(new Set([...prev, ...inTransitIds])));
    }
  };

  const handleBulkConfirmSubmit = async () => {
    if (selectedTransferIds.length === 0) {
      showToast("error", "Pilih minimal 1 transfer stok untuk dikonfirmasi.");
      return;
    }

    setIsBulkSubmitting(true);
    try {
      const res = await apiFetch("/api/stock-transfers/bulk-receive", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transferIds: selectedTransferIds,
          receiverId: currentUser?.id || "EMP002",
          receiverName: currentUser?.name || "Manager / Penerima",
          notes: bulkNotes
        })
      });

      if (res.ok) {
        const data = await res.json();
        showToast("success", `✅ Berhasil mengonfirmasi ${data.count || selectedTransferIds.length} transfer stok sekaligus ke Completed! Stok & IMEI telah dialokasikan.`);
        setSelectedTransferIds([]);
        setShowBulkConfirmModal(false);
        setBulkNotes("");
        fetchData();
        if (onRefreshData) onRefreshData();
      } else {
        const err = await res.json();
        showToast("error", err.message || "Gagal melakukan konfirmasi masal.");
      }
    } catch (err) {
      showToast("error", "Terjadi kesalahan server saat konfirmasi masal.");
    } finally {
      setIsBulkSubmitting(false);
    }
  };

  // Filter transfers
  const filteredTransfers = transfers.filter(t => {
    const matchesSearch = 
      t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.originOutletName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.destinationOutletName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.senderName.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === "ALL") return matchesSearch;
    return matchesSearch && t.status === statusFilter;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-white text-sm font-semibold transition-all animate-bounce ${
          toastMsg.type === "success" ? "bg-emerald-600 border border-emerald-400" : "bg-rose-600 border border-rose-400"
        }`}>
          {toastMsg.type === "success" ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Header Banner & Active Context */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white border border-indigo-500/20 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-indigo-400" />
                Sistem Multi-Outlet & Cabang POS
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold">
                {outlets.length} Cabang Aktif
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              Peluncuran Multi-Outlet & Transfer Stok
            </h1>
            <p className="text-xs sm:text-sm text-slate-300/90 max-w-2xl leading-relaxed">
              Kelola daftar cabang outlet, monitor pergerakan inventaris antar cabang, dan lakukan transfer stok dengan audit IMEI serta Cetak Surat Jalan otomatis.
            </p>
          </div>

          {/* Current Active Outlet Selector Card */}
          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 shrink-0 min-w-[260px]">
            <div className="text-[10px] font-bold uppercase text-indigo-300 tracking-wider mb-1 flex items-center justify-between">
              <span>Outlet Kerja Anda Saat Ini</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-base font-black text-white flex items-center gap-2">
                  <Store className="h-4 w-4 text-emerald-400" />
                  {activeOutlet ? activeOutlet.name : "Loading..."}
                </div>
                <div className="text-xs text-slate-300 flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3 text-indigo-300" />
                  {activeOutlet ? activeOutlet.code : "-"} • {activeOutlet?.address || "Pusat"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-white/10 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab("outlets")}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "outlets" 
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-2 ring-indigo-400" 
                : "bg-white/5 text-slate-300 hover:bg-white/10"
            }`}
          >
            <Building2 className="h-4 w-4" />
            Manajemen Outlet / Cabang ({outlets.length})
          </button>

          <button
            onClick={() => setActiveTab("transfers")}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "transfers" 
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-2 ring-indigo-400" 
                : "bg-white/5 text-slate-300 hover:bg-white/10"
            }`}
          >
            <ArrowLeftRight className="h-4 w-4" />
            Transfer Stok Antar Cabang ({transfers.length})
            {transfers.some(t => t.status === "IN_TRANSIT") && (
              <span className="bg-amber-500 text-slate-950 font-black px-1.5 py-0.5 rounded-full text-[10px] animate-pulse">
                {transfers.filter(t => t.status === "IN_TRANSIT").length} Transit
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "history" 
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-2 ring-indigo-400" 
                : "bg-white/5 text-slate-300 hover:bg-white/10"
            }`}
          >
            <FileText className="h-4 w-4" />
            Laporan Mutasi Stok
          </button>
        </div>
      </div>

      {/* ==================== TAB 1: MANAJEMEN OUTLET / CABANG ==================== */}
      {activeTab === "outlets" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Store className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                Daftar Cabang & Toko Fisik
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Kelola informasi alamat, manajer cabang, serta pengalihan konteks toko untuk operasional kasir.
              </p>
            </div>

            {userRole === UserRole.ADMIN && (
              <button
                onClick={handleOpenAddOutlet}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md shadow-indigo-500/20 transition-all hover:scale-105 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Tambah Cabang / Outlet Baru
              </button>
            )}
          </div>

          {/* Outlet Grid Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {outlets.map((outlet) => {
              const isSelected = activeOutlet?.id === outlet.id;
              const productCount = products.filter(p => !p.location || p.location === outlet.name || p.location === "Toko Utama").length;
              const totalStockCount = products
                .filter(p => !p.location || p.location === outlet.name || p.location === "Toko Utama")
                .reduce((sum, p) => sum + p.stock, 0);

              return (
                <div
                  key={outlet.id}
                  className={`bg-white dark:bg-slate-900 rounded-2xl p-6 border transition-all duration-200 shadow-md relative overflow-hidden flex flex-col justify-between ${
                    isSelected
                      ? "border-indigo-500 dark:border-indigo-500 ring-2 ring-indigo-500/30"
                      : "border-slate-200 dark:border-slate-800 hover:border-indigo-300"
                  }`}
                >
                  {/* Outlet Badge Header */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                        outlet.isMainBranch
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-300"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-300"
                      }`}>
                        {outlet.isMainBranch ? "⭐ Outlet Utama (Pusat)" : `Cabang [${outlet.code}]`}
                      </span>

                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        outlet.status === "ACTIVE"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      }`}>
                        {outlet.status === "ACTIVE" ? "Aktif Operasional" : "Nonaktif"}
                      </span>
                    </div>

                    <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2 flex items-center justify-between">
                      <span>{outlet.name}</span>
                    </h3>

                    <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 mb-4">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                        <span>{outlet.address || "Alamat belum diisi"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                        <span>{outlet.phone || "-"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-slate-400 shrink-0" />
                        <span>Manajer: <strong>{outlet.managerName || "Belum Ditentukan"}</strong></span>
                      </div>
                    </div>

                    {/* Stock Summary Mini Cards */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 mb-4 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Jenis Produk</span>
                        <strong className="text-slate-900 dark:text-white font-bold">{productCount} Item SKU</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Total Stok Unit</span>
                        <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{totalStockCount} Unit HP</strong>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <button
                      onClick={() => onSelectActiveOutlet(outlet)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:text-indigo-600"
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          Outlet Aktif
                        </>
                      ) : (
                        "Ganti ke Outlet Ini"
                      )}
                    </button>

                    {userRole === UserRole.ADMIN && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditOutlet(outlet)}
                          className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                          title="Edit Outlet"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        {!outlet.isMainBranch && (
                          <button
                            onClick={() => handleDeleteOutlet(outlet)}
                            className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-all cursor-pointer"
                            title="Hapus Outlet"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================== TAB 2: TRANSFER STOK ANTA CABANG ==================== */}
      {activeTab === "transfers" && (
        <div className="space-y-6">

          {/* Manager Bulk Confirm Action Banner */}
          {(userRole === UserRole.ADMIN || userRole === UserRole.MANAGER || userRole === UserRole.CASHIER) && (
            <div className="bg-gradient-to-r from-emerald-900/10 via-sky-900/10 to-indigo-900/10 dark:from-emerald-950/40 dark:via-sky-950/40 dark:to-indigo-950/40 border border-emerald-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
                  <PackageCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      Konfirmasi Masal (Bulk Confirm)
                    </span>
                    <span className="bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700">
                      Khusus Manager / Admin
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Pilih beberapa pengiriman transfer berstatus <strong className="text-sky-600 dark:text-sky-400">In-Transit</strong> untuk mengubah status ke <strong className="text-emerald-600 dark:text-emerald-400">Completed (Diterima)</strong> sekaligus.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
                {filteredTransfers.some(t => t.status === "IN_TRANSIT" || t.status === "PENDING") && (
                  <button
                    type="button"
                    onClick={handleSelectAllInTransit}
                    className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-300 dark:hover:bg-slate-700 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-sky-500" />
                    <span>
                      {filteredTransfers.filter(t => t.status === "IN_TRANSIT" || t.status === "PENDING").every(t => selectedTransferIds.includes(t.id))
                        ? "Batal Pilih"
                        : `Pilih Semua In-Transit (${filteredTransfers.filter(t => t.status === "IN_TRANSIT" || t.status === "PENDING").length})`}
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  disabled={selectedTransferIds.length === 0}
                  onClick={() => setShowBulkConfirmModal(true)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 shadow-md ${
                    selectedTransferIds.length > 0
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30 ring-2 ring-emerald-400 animate-pulse"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-60"
                  }`}
                >
                  <PackageCheck className="h-4 w-4" />
                  <span>Bulk Confirm ({selectedTransferIds.length} Dipilih)</span>
                </button>
              </div>
            </div>
          )}

          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari ID Transfer, Cabang Asal/Tujuan, atau Pengirim..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 dark:text-white"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {[
                { id: "ALL", label: "Semua Status" },
                { id: "PENDING", label: "Pending (Draf)" },
                { id: "IN_TRANSIT", label: "In-Transit" },
                { id: "RECEIVED", label: "Completed" },
                { id: "CANCELLED", label: "Dibatalkan" }
              ].map((st) => {
                const isActive = statusFilter === st.id;
                let activeColor = "bg-indigo-600 text-white shadow";
                if (st.id === "PENDING") activeColor = "bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/30 ring-2 ring-amber-300";
                if (st.id === "IN_TRANSIT") activeColor = "bg-sky-600 text-white font-black shadow-md shadow-sky-600/30 ring-2 ring-sky-300";
                if (st.id === "RECEIVED") activeColor = "bg-emerald-600 text-white font-black shadow-md shadow-emerald-600/30 ring-2 ring-emerald-300";
                if (st.id === "CANCELLED") activeColor = "bg-rose-600 text-white font-black shadow-md shadow-rose-600/30 ring-2 ring-rose-300";

                return (
                  <button
                    key={st.id}
                    onClick={() => setStatusFilter(st.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                      isActive
                        ? activeColor
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {st.id === "PENDING" && <Clock className="h-3 w-3 text-amber-500" />}
                    {st.id === "IN_TRANSIT" && <Truck className="h-3 w-3 text-sky-500" />}
                    {st.id === "RECEIVED" && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
                    {st.id === "CANCELLED" && <XCircle className="h-3 w-3 text-rose-500" />}
                    <span>{st.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Create Transfer CTA Button */}
            <button
              onClick={handleOpenTransferModal}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-500/20 transition-all shrink-0 cursor-pointer"
            >
              <Send className="h-4 w-4" />
              + Buat Pengiriman Transfer Stok
            </button>
          </div>

          {/* Transfers Table / List */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3.5 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={
                          filteredTransfers.filter(t => t.status === "IN_TRANSIT" || t.status === "PENDING").length > 0 &&
                          filteredTransfers.filter(t => t.status === "IN_TRANSIT" || t.status === "PENDING").every(t => selectedTransferIds.includes(t.id))
                        }
                        onChange={handleSelectAllInTransit}
                        disabled={!filteredTransfers.some(t => t.status === "IN_TRANSIT" || t.status === "PENDING")}
                        className="rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500 cursor-pointer disabled:opacity-40 h-4 w-4"
                        title="Pilih semua In-Transit/Pending"
                      />
                    </th>
                    <th className="px-5 py-3.5">ID Transfer & Waktu</th>
                    <th className="px-5 py-3.5">Rute Cabang (Asal ➔ Tujuan)</th>
                    <th className="px-5 py-3.5">Barang & Total Unit</th>
                    <th className="px-5 py-3.5">Pengirim / Penerima</th>
                    <th className="px-5 py-3.5 text-center">Status</th>
                    <th className="px-5 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  {filteredTransfers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                        <Boxes className="h-10 w-10 mx-auto mb-2 text-slate-300 opacity-60" />
                        <p className="font-semibold text-sm">Tidak Ada Transaksi Transfer Stok</p>
                        <p className="text-xs mt-1">Gunakan tombol "+ Buat Pengiriman Transfer Stok" untuk mengirim unit HP ke cabang lain.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredTransfers.map((trf) => {
                      const totalItemsCount = trf.items.reduce((sum, item) => sum + item.quantity, 0);
                      const isSelected = selectedTransferIds.includes(trf.id);
                      const isEligibleForReceive = trf.status === "IN_TRANSIT" || trf.status === "PENDING";

                      return (
                        <tr
                          key={trf.id}
                          className={`transition-all ${
                            isSelected
                              ? "bg-emerald-50/70 dark:bg-emerald-950/30"
                              : "hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                          }`}
                        >
                          {/* Selection Checkbox */}
                          <td className="px-4 py-4 text-center">
                            {isEligibleForReceive ? (
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectTransfer(trf.id)}
                                className="rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500 cursor-pointer h-4 w-4"
                              />
                            ) : (
                              <span className="text-slate-300 dark:text-slate-700 text-[10px]">—</span>
                            )}
                          </td>
                          {/* ID & Date */}
                          <td className="px-5 py-4">
                            <div className="font-black text-indigo-600 dark:text-indigo-400 text-sm">
                              {trf.id}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(trf.sentAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                            </div>
                          </td>

                          {/* Origin -> Destination Route */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                                {trf.originOutletName}
                              </span>
                              <ArrowRight className="h-4 w-4 text-indigo-500 shrink-0" />
                              <span className="font-bold text-slate-900 dark:text-white bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800">
                                {trf.destinationOutletName}
                              </span>
                            </div>
                          </td>

                          {/* Items summary */}
                          <td className="px-5 py-4">
                            <div className="font-bold text-slate-900 dark:text-white">
                              {trf.items.length} Jenis Produk ({totalItemsCount} Unit)
                            </div>
                            <div className="text-[11px] text-slate-500 max-w-xs truncate">
                              {trf.items.map(i => `${i.productName} (${i.quantity})`).join(", ")}
                            </div>
                          </td>

                          {/* Sender / Receiver */}
                          <td className="px-5 py-4">
                            <div className="text-xs">
                              <div>Pengirim: <strong>{trf.senderName}</strong></div>
                              {trf.receiverName && (
                                <div className="text-emerald-600 dark:text-emerald-400">
                                  Penerima: <strong>{trf.receiverName}</strong>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Status Badge */}
                          <td className="px-5 py-4 text-center">
                            <TransferStatusBadge status={trf.status} size="md" />
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Print Delivery Note */}
                              <button
                                onClick={() => setPrintingTransfer(trf)}
                                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 p-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                                title="Cetak Surat Jalan"
                              >
                                <Printer className="h-3.5 w-3.5 text-indigo-500" />
                                <span className="hidden sm:inline">Surat Jalan</span>
                              </button>

                              {/* Dispatch pending transfer */}
                              {trf.status === "PENDING" && userRole === UserRole.ADMIN && (
                                <button
                                  onClick={() => handleDispatchTransfer(trf.id)}
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow cursor-pointer"
                                >
                                  Kirim Sekarang
                                </button>
                              )}

                              {/* Receive transfer */}
                              {(trf.status === "IN_TRANSIT" || trf.status === "PENDING") && (
                                <button
                                  onClick={() => setReceivingTransfer(trf)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow cursor-pointer flex items-center gap-1"
                                >
                                  <PackageCheck className="h-3.5 w-3.5" />
                                  Terima Barang
                                </button>
                              )}

                              {/* Cancel transfer */}
                              {trf.status !== "RECEIVED" && trf.status !== "CANCELLED" && userRole === UserRole.ADMIN && (
                                <button
                                  onClick={() => handleCancelTransfer(trf.id)}
                                  className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 p-2 rounded-xl transition-all cursor-pointer"
                                  title="Batalkan Transfer"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 3: AUDIT & HISTORI MUTASI STOK ==================== */}
      {activeTab === "history" && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-md space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-600" />
              Laporan Mutasi & Audit Pergerakan Stok Antar Cabang
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Riwayat lengkap pencatatan penyesuaian stok, pengiriman, dan serah terima unit IMEI antar toko fisik.
            </p>
          </div>

          <div className="space-y-4">
            {transfers.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">Belum ada riwayat mutasi stok recorded.</p>
            ) : (
              transfers.map(trf => (
                <div key={trf.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-indigo-600 dark:text-indigo-400">{trf.id}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{trf.originOutletName} ➔ {trf.destinationOutletName}</span>
                      <TransferStatusBadge status={trf.status} size="sm" />
                    </div>
                    <span className="text-[11px] text-slate-400">{new Date(trf.sentAt).toLocaleString("id-ID")}</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-400 font-medium">Daftar IMEI Unit yang Berpindah:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {trf.items.map((item, idx) => (
                        <div key={idx} className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                          <strong className="block text-slate-800 dark:text-slate-200">{item.productName}</strong>
                          <span className="text-[10px] text-indigo-500 font-mono block truncate">
                            IMEI: {item.imeis?.join(", ") || "-"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ==================== MODAL 1: ADD / EDIT OUTLET ==================== */}
      {showOutletModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Store className="h-5 w-5 text-indigo-600" />
                {editingOutlet ? "Edit Data Outlet / Cabang" : "Tambah Outlet Cabang Baru"}
              </h3>
              <button onClick={() => setShowOutletModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOutlet} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Kode Cabang (Singkat)</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: CBG1, PST, BSD"
                  value={outletFormData.code}
                  onChange={(e) => setOutletFormData({ ...outletFormData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Nama Outlet / Toko</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Cabang 1 - Kelapa Gading"
                  value={outletFormData.name}
                  onChange={(e) => setOutletFormData({ ...outletFormData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Alamat Fisik Lengkap</label>
                <textarea
                  rows={2}
                  placeholder="Mall Kelapa Gading 3, Lt. G No. 12, Jakarta Utara"
                  value={outletFormData.address}
                  onChange={(e) => setOutletFormData({ ...outletFormData, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Nomor Telepon</label>
                  <input
                    type="text"
                    placeholder="021-4585123"
                    value={outletFormData.phone}
                    onChange={(e) => setOutletFormData({ ...outletFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Manajer Cabang</label>
                  <input
                    type="text"
                    placeholder="Nama Kepala Cabang"
                    value={outletFormData.managerName}
                    onChange={(e) => setOutletFormData({ ...outletFormData, managerName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={outletFormData.isMainBranch}
                    onChange={(e) => setOutletFormData({ ...outletFormData, isMainBranch: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                  <span className="font-bold text-slate-800 dark:text-slate-200">Jadikan Outlet Utama (Pusat)</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowOutletModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-500/20 cursor-pointer"
                >
                  Simpan Outlet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL 2: NEW STOCK TRANSFER FORM ==================== */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Send className="h-5 w-5 text-indigo-600" />
                Buat Pengiriman Transfer Stok Antar Cabang
              </h3>
              <button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTransferSubmit} className="space-y-4 text-xs">
              
              {/* Route Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Outlet Asal Pengirim</label>
                  <select
                    value={originOutletId}
                    onChange={(e) => {
                      setOriginOutletId(e.target.value);
                      setSelectedProductId("");
                      setSelectedImeis([]);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-indigo-600"
                  >
                    {outlets.map(o => (
                      <option key={o.id} value={o.id}>{o.name} ({o.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Outlet Tujuan Penerima</label>
                  <select
                    value={destinationOutletId}
                    onChange={(e) => setDestinationOutletId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-emerald-600"
                  >
                    {outlets.filter(o => o.id !== originOutletId).map(o => (
                      <option key={o.id} value={o.id}>{o.name} ({o.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Add Items to Transfer Section */}
              <div className="space-y-3 bg-indigo-50/50 dark:bg-indigo-950/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/40">
                <h4 className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                  <Boxes className="h-4 w-4" />
                  Pilih Produk & Unit IMEI yang Ditransfer
                </h4>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Pilih Produk</label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => {
                      setSelectedProductId(e.target.value);
                      setSelectedImeis([]);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold"
                  >
                    <option value="">-- Pilih Produk di Outlet Asal --</option>
                    {availableProducts.map(p => (
                      <option key={p.id} value={p.id}>{p.brand} {p.name} (Tersedia: {p.stock} Unit)</option>
                    ))}
                  </select>
                </div>

                {/* Available IMEIs Checkboxes */}
                {selectedProductObj && selectedProductObj.imeis.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold">
                      Pilih Nomor IMEI Unit ({selectedImeis.length} dipilih):
                    </label>
                    <div className="max-h-36 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                      {selectedProductObj.imeis.map(imei => {
                        const isChecked = selectedImeis.includes(imei);
                        return (
                          <label key={imei} className="flex items-center gap-2 cursor-pointer text-xs font-mono">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedImeis([...selectedImeis, imei]);
                                } else {
                                  setSelectedImeis(selectedImeis.filter(i => i !== imei));
                                }
                              }}
                              className="rounded text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className={isChecked ? "font-bold text-indigo-600" : "text-slate-600 dark:text-slate-300"}>
                              {imei}
                            </span>
                          </label>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={handleAddItemToTransfer}
                      className="w-full py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all cursor-pointer"
                    >
                      + Tambahkan Ke Daftar Transfer
                    </button>
                  </div>
                )}
              </div>

              {/* Added Transfer Items List */}
              {transferItems.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200">
                    Daftar Barang yang Akan Dikirim ({transferItems.length} Item):
                  </h4>

                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {transferItems.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div>
                          <strong className="block font-bold text-slate-900 dark:text-white">{item.productName}</strong>
                          <span className="text-[11px] text-indigo-500 font-mono">
                            IMEI ({item.quantity} unit): {item.imeis.join(", ")}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveTransferItem(item.productId)}
                          className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Catatan Pengiriman / Kurir Expres</label>
                <input
                  type="text"
                  placeholder="Contoh: Dikirim via Kurir Internal Express, No. HP 0812345678"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {/* Immediately Dispatch Toggle */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="dispatchImmediately"
                  checked={dispatchImmediately}
                  onChange={(e) => setDispatchImmediately(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                />
                <label htmlFor="dispatchImmediately" className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                  Kirim Sekarang (Status langsung "Dalam Perjalanan" dan stok dikurangi)
                </label>
              </div>

              {/* Footer CTA */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-lg shadow-indigo-500/25 cursor-pointer flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  Proses Pengiriman Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL 3: RECEIVE TRANSFER CONFIRMATION ==================== */}
      {receivingTransfer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 text-emerald-600">
                <PackageCheck className="h-5 w-5" />
                Konfirmasi Penerimaan Barang Transfer
              </h3>
              <button onClick={() => setReceivingTransfer(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl space-y-2 border border-slate-200 dark:border-slate-700">
                <div>ID Transfer: <strong className="font-mono text-indigo-600">{receivingTransfer.id}</strong></div>
                <div>Pengirim: <strong>{receivingTransfer.originOutletName}</strong></div>
                <div>Tujuan: <strong>{receivingTransfer.destinationOutletName}</strong></div>
              </div>

              <div>
                <span className="font-bold block mb-1">Rincian Barang Diterima:</span>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {receivingTransfer.items.map((item, idx) => (
                    <div key={idx} className="bg-emerald-50/50 dark:bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs">
                      <strong className="block text-emerald-950 dark:text-emerald-200">{item.productName}</strong>
                      <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400">
                        IMEI ({item.quantity} unit): {item.imeis.join(", ")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Catatan Pemeriksaan Fisik Penerima</label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Barang sudah dicek fisik segel utuh, IMEI sesuai dan berfungsi normal."
                  value={receiveNotes}
                  onChange={(e) => setReceiveNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setReceivingTransfer(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 font-bold hover:bg-slate-100 cursor-pointer text-xs"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmReceiveTransfer}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-lg shadow-emerald-600/25 cursor-pointer text-xs flex items-center gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                Terima & Masukkan Ke Stok
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== PRINTABLE SURAT JALAN MODAL ==================== */}
      {printingTransfer && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-3xl max-w-2xl w-full p-8 shadow-2xl space-y-6 my-8 relative">
            <button
              onClick={() => setPrintingTransfer(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 print:hidden"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Document Header */}
            <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-slate-900">SURAT JALAN / MUTASI STOK</h2>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">PHONE POS & INVENTORY SOLUTION</p>
              </div>
              <div className="text-right flex flex-col items-end gap-1">
                <div className="font-mono font-black text-lg text-indigo-700">{printingTransfer.id}</div>
                <TransferStatusBadge status={printingTransfer.status} size="sm" />
                <div className="text-xs text-slate-500">
                  Tanggal: {new Date(printingTransfer.sentAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                </div>
              </div>
            </div>

            {/* Addresses Grid */}
            <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Outlet Asal (Pengirim)</span>
                <strong className="text-sm text-slate-900 block">{printingTransfer.originOutletName}</strong>
                <p className="text-slate-600 mt-1">Petugas: {printingTransfer.senderName}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Outlet Tujuan (Penerima)</span>
                <strong className="text-sm text-indigo-700 block">{printingTransfer.destinationOutletName}</strong>
                <p className="text-slate-600 mt-1">Penerima: {printingTransfer.receiverName || "Belum Diterima"}</p>
              </div>
            </div>

            {/* Items Table */}
            <div>
              <table className="w-full text-left text-xs border border-slate-200">
                <thead className="bg-slate-100 font-bold uppercase text-slate-600">
                  <tr>
                    <th className="p-2.5 border">No</th>
                    <th className="p-2.5 border">Nama Produk & Merek</th>
                    <th className="p-2.5 border">Rincian Nomor IMEI</th>
                    <th className="p-2.5 border text-center">Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  {printingTransfer.items.map((item, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="p-2.5 border text-center font-bold">{idx + 1}</td>
                      <td className="p-2.5 border font-bold">{item.productName}</td>
                      <td className="p-2.5 border font-mono text-[11px] text-indigo-800">
                        {item.imeis?.join(", ") || "-"}
                      </td>
                      <td className="p-2.5 border text-center font-bold">{item.quantity} Unit</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Notes */}
            {printingTransfer.notes && (
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-900">
                <strong>Catatan Pengiriman:</strong> {printingTransfer.notes}
              </div>
            )}

            {/* Signatures Block */}
            <div className="grid grid-cols-3 gap-4 pt-8 text-center text-xs">
              <div>
                <p className="text-slate-500 mb-12">Pengirim (Outlet Asal)</p>
                <div className="border-t border-slate-400 pt-1 font-bold">{printingTransfer.senderName}</div>
              </div>
              <div>
                <p className="text-slate-500 mb-12">Sopir / Kurir Pengantar</p>
                <div className="border-t border-slate-400 pt-1 font-bold">(...................................)</div>
              </div>
              <div>
                <p className="text-slate-500 mb-12">Penerima (Outlet Tujuan)</p>
                <div className="border-t border-slate-400 pt-1 font-bold">{printingTransfer.receiverName || "(...................................)"}</div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 print:hidden">
              <button
                onClick={() => setPrintingTransfer(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 font-bold text-xs hover:bg-slate-100 cursor-pointer"
              >
                Tutup
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md cursor-pointer flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                Cetak Surat Jalan (Print)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL 4: BULK CONFIRM TRANSFERS MODAL ==================== */}
      {showBulkConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-300 dark:border-emerald-800">
                  <PackageCheck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900 dark:text-white">
                    Konfirmasi Penerimaan Masal (Bulk Confirm)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Ubah <strong className="text-emerald-600 dark:text-emerald-400">{selectedTransferIds.length} pengiriman transfer</strong> ke status <span className="font-bold text-emerald-600 dark:text-emerald-400">Completed (Selesai Diterima)</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBulkConfirmModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Daftar Transfer Stok Yang Akan Diterima:
              </p>
              <div className="space-y-2">
                {selectedTransferIds.map(trfId => {
                  const trf = transfers.find(t => t.id === trfId);
                  if (!trf) return null;
                  const totalUnits = trf.items.reduce((sum, item) => sum + item.quantity, 0);

                  return (
                    <div key={trf.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                          <span>{trf.id}</span>
                          <TransferStatusBadge status={trf.status} size="sm" showIcon={false} />
                        </div>
                        <div className="text-[11px] font-medium text-slate-600 dark:text-slate-300 mt-0.5">
                          {trf.originOutletName} ➔ <strong className="text-emerald-600 dark:text-emerald-400">{trf.destinationOutletName}</strong>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-900 dark:text-white bg-slate-200 dark:bg-slate-700 px-2.5 py-1 rounded-lg text-[11px]">
                          {trf.items.length} Jenis ({totalUnits} Unit)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Catatan Penerimaan Masal (Opsional):
              </label>
              <input
                type="text"
                value={bulkNotes}
                onChange={(e) => setBulkNotes(e.target.value)}
                placeholder="Contoh: Diterima masal dalam kondisi baik oleh Manager Toko"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <p>
                Tindakan ini akan mengonfirmasi <strong className="font-black">{selectedTransferIds.length} pengiriman</strong> sekaligus. Stok HP dan nomor IMEI barang yang ditransfer akan otomatis dialokasikan ke inventaris toko tujuan.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowBulkConfirmModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isBulkSubmitting}
                onClick={handleBulkConfirmSubmit}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-lg shadow-emerald-600/30 transition-all cursor-pointer flex items-center gap-2"
              >
                {isBulkSubmitting ? (
                  <>
                    <Clock className="h-4 w-4 animate-spin" />
                    <span>Memproses Bulk Confirm...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Konfirmasi {selectedTransferIds.length} Transfer Masal</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
