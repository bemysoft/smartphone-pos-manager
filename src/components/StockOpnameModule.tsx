import { apiFetch } from '../lib/api';
import React, { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import { 
  ClipboardCheck, 
  Search, 
  CheckCircle, 
  AlertTriangle, 
  Boxes, 
  Barcode, 
  Camera, 
  History, 
  RotateCcw, 
  Save, 
  FileSpreadsheet, 
  Printer, 
  Trash2, 
  X, 
  Plus, 
  Minus, 
  Filter, 
  Eye, 
  ChevronRight,
  TrendingDown,
  TrendingUp,
  ShieldAlert,
  Sparkles,
  Info
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { Product, StockOpname, StockOpnameItem } from "../types";

interface StockOpnameModuleProps {
  products: Product[];
  onProductsChange: () => void;
  currentUser?: any;
  userRole?: string;
}

export default function StockOpnameModule({ products, onProductsChange, currentUser }: StockOpnameModuleProps) {
  const [activeSubTab, setActiveSubTab] = useState<"ACTIVE" | "HISTORY">("ACTIVE");

  // Opname Session Info
  const [sessionTitle, setSessionTitle] = useState<string>(() => {
    const todayStr = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
    return `Stok Opname Rutin - ${todayStr}`;
  });
  const [sessionNotes, setSessionNotes] = useState<string>("");

  // Working Opname Items state
  const [opnameItems, setOpnameItems] = useState<StockOpnameItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Semua");
  const [discrepancyFilter, setDiscrepancyFilter] = useState<"ALL" | "DISCREPANCY" | "MATCHING">("ALL");

  // Camera Barcode Scanner State
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [cameras, setCameras] = useState<any[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [scanToast, setScanToast] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // USB Scanner Direct Input
  const [usbBarcodeBuffer, setUsbBarcodeBuffer] = useState("");
  const usbInputRef = useRef<HTMLInputElement>(null);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // History & Detail Modal State
  const [historyOpnames, setHistoryOpnames] = useState<StockOpname[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [selectedHistoryDetail, setSelectedHistoryDetail] = useState<StockOpname | null>(null);

  // Initialize opname items from products
  useEffect(() => {
    if (products && products.length > 0) {
      const items: StockOpnameItem[] = products.map(p => ({
        productId: p.id,
        productName: p.name,
        brand: p.brand,
        model: p.model,
        sku: p.id,
        category: p.category || "Smartphone",
        priceBuy: p.priceBuy || 0,
        priceSell: p.priceSell || 0,
        systemStock: p.stock || 0,
        physicalStock: p.stock || 0, // Default to system stock
        shrinkage: 0,
        discrepancy: 0,
        missingImeis: [],
        notes: ""
      }));
      setOpnameItems(items);
    }
  }, [products]);

  // Load History Opnames
  const fetchHistoryOpnames = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await apiFetch("/api/opnames");
      if (res.ok) {
        const data = await res.json();
        setHistoryOpnames(data || []);
      }
    } catch (err) {
      console.error("Gagal memuat riwayat opname:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === "HISTORY") {
      fetchHistoryOpnames();
    }
  }, [activeSubTab]);

  // Handle camera detection
  useEffect(() => {
    if (isScannerOpen) {
      Html5Qrcode.getCameras().then(devices => {
        if (devices && devices.length > 0) {
          setCameras(devices);
          const backCam = devices.find(d => 
            d.label.toLowerCase().includes("back") || 
            d.label.toLowerCase().includes("rear") || 
            d.label.toLowerCase().includes("environment")
          );
          setSelectedCameraId(backCam ? backCam.id : devices[0].id);
        }
      }).catch(err => {
        console.warn("Kamera tidak terdeteksi:", err);
      });
    }
  }, [isScannerOpen]);

  // Camera Scanner instance runner
  useEffect(() => {
    let isMounted = true;
    if (isScannerOpen) {
      const timer = setTimeout(() => {
        if (!isMounted) return;
        const container = document.getElementById("qr-reader-opname");
        if (!container) return;

        try {
          if (!scannerRef.current) {
            scannerRef.current = new Html5Qrcode("qr-reader-opname");
          }
          const cameraConfig = selectedCameraId ? selectedCameraId : { facingMode: "environment" };
          scannerRef.current.start(
            cameraConfig,
            { fps: 15, qrbox: { width: 250, height: 160 } },
            (decodedText) => {
              handleBarcodeScan(decodedText);
            },
            () => {}
          ).catch(err => console.warn(err));
        } catch (e) {
          console.error(e);
        }
      }, 300);

      return () => {
        isMounted = false;
        clearTimeout(timer);
        if (scannerRef.current && scannerRef.current.isScanning) {
          scannerRef.current.stop().then(() => scannerRef.current?.clear()).catch(console.error);
        }
      };
    }
  }, [isScannerOpen, selectedCameraId]);

  // Handle Barcode/IMEI Scan Logic
  const handleBarcodeScan = (scannedCode: string) => {
    const clean = scannedCode.trim();
    if (!clean) return;

    // Find product matching IMEI or ID/SKU or Name
    const targetIdx = opnameItems.findIndex(item => {
      const prod = products.find(p => p.id === item.productId);
      if (prod && prod.imeis && prod.imeis.includes(clean)) return true;
      if (item.productId === clean || item.sku === clean) return true;
      if (item.productName.toLowerCase().includes(clean.toLowerCase())) return true;
      return false;
    });

    if (targetIdx !== -1) {
      const target = opnameItems[targetIdx];
      // Increment physical stock by 1
      const newPhys = target.physicalStock + 1;
      updateItemPhysicalStock(target.productId, newPhys);

      setScanToast(`✅ Berhasil Scan: ${target.productName} (+1 Fisik = ${newPhys})`);
      setTimeout(() => setScanToast(null), 3000);
    } else {
      setScanToast(`⚠️ Kode/IMEI "${clean}" tidak ditemukan di daftar barang.`);
      setTimeout(() => setScanToast(null), 3000);
    }
  };

  // Physical Stock adjustment helper
  const updateItemPhysicalStock = (productId: string, newPhysicalCount: number) => {
    const val = Math.max(0, newPhysicalCount);
    setOpnameItems(prev => prev.map(item => {
      if (item.productId === productId) {
        const sys = item.systemStock;
        const disc = val - sys;
        const sh = sys - val;
        return {
          ...item,
          physicalStock: val,
          discrepancy: disc,
          shrinkage: sh
        };
      }
      return item;
    }));
  };

  const updateItemNotes = (productId: string, notes: string) => {
    setOpnameItems(prev => prev.map(item => {
      if (item.productId === productId) {
        return { ...item, notes };
      }
      return item;
    }));
  };

  // Quick reset all physical = system stock
  const handleResetAllToSystem = () => {
    if (confirm("Apakah Anda yakin ingin menyamakan seluruh Stok Fisik dengan Stok Sistem?")) {
      setOpnameItems(prev => prev.map(item => ({
        ...item,
        physicalStock: item.systemStock,
        discrepancy: 0,
        shrinkage: 0
      })));
    }
  };

  // Export Opname Draft to Excel (.xlsx) using SheetJS
  const handleExportExcel = () => {
    if (opnameItems.length === 0) {
      alert("Tidak ada item opname untuk diekspor!");
      return;
    }

    const headers = [
      "SKU/ID",
      "Nama Produk",
      "Brand",
      "Model",
      "Kategori",
      "HPP Beli (Rp)",
      "Harga Jual (Rp)",
      "Stok Sistem",
      "Stok Fisik Audit",
      "Selisih Unit",
      "Nilai Kerugian / Surplus HPP (Rp)",
      "Status Rekonsiliasi",
      "Catatan / Alasan"
    ];

    const rows = opnameItems.map(item => {
      const valueDiff = item.discrepancy * item.priceBuy;
      const status = item.discrepancy === 0 ? "Sesuai" : item.discrepancy < 0 ? "Kurang (Shrinkage)" : "Surplus";
      return [
        item.productId,
        item.productName,
        item.brand || "",
        item.model || "",
        item.category || "Smartphone",
        item.priceBuy,
        item.priceSell,
        item.systemStock,
        item.physicalStock,
        item.discrepancy,
        valueDiff,
        status,
        item.notes || ""
      ];
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws['!cols'] = [
      { wch: 12 }, { wch: 30 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
      { wch: 16 }, { wch: 16 }, { wch: 12 }, { wch: 14 }, { wch: 12 },
      { wch: 22 }, { wch: 18 }, { wch: 30 }
    ];
    XLSX.utils.book_append_sheet(wb, ws, "Draft Opname");

    const filename = `Laporan_Draft_Stok_Opname_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  // Export Opname Draft to CSV
  const handleExportCSV = () => {
    if (opnameItems.length === 0) return;
    const headers = [
      "SKU/ID",
      "Nama Produk",
      "Brand",
      "Model",
      "Kategori",
      "HPP Beli (Rp)",
      "Harga Jual (Rp)",
      "Stok Sistem",
      "Stok Fisik",
      "Selisih Unit",
      "Nilai Kerugian/Surplus (Rp)",
      "Catatan Alasan"
    ];

    const rows = opnameItems.map(item => [
      item.productId,
      item.productName,
      item.brand || "",
      item.model || "",
      item.category || "Smartphone",
      item.priceBuy,
      item.priceSell,
      item.systemStock,
      item.physicalStock,
      item.discrepancy,
      item.discrepancy * item.priceBuy,
      item.notes || ""
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const csvContent = "\uFEFF" + XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Laporan_Draft_Stok_Opname_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Filtered List
  const categoriesList = Array.from(new Set(["Semua", ...products.map(p => p.category || "Smartphone")]));

  const filteredOpnameItems = opnameItems.filter(item => {
    const matchesSearch = item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.brand && item.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.productId.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === "Semua" || item.category === categoryFilter;

    let matchesDiscrepancy = true;
    if (discrepancyFilter === "DISCREPANCY") {
      matchesDiscrepancy = item.discrepancy !== 0;
    } else if (discrepancyFilter === "MATCHING") {
      matchesDiscrepancy = item.discrepancy === 0;
    }

    return matchesSearch && matchesCategory && matchesDiscrepancy;
  });

  // Calculate Aggregates
  const totalSystemUnits = opnameItems.reduce((acc, item) => acc + item.systemStock, 0);
  const totalPhysicalUnits = opnameItems.reduce((acc, item) => acc + item.physicalStock, 0);
  const itemsWithDiscrepancy = opnameItems.filter(item => item.discrepancy !== 0);
  const totalDiscrepancyUnits = itemsWithDiscrepancy.reduce((acc, item) => acc + Math.abs(item.discrepancy), 0);
  
  // Total Financial Impact Value based on HPP priceBuy
  const totalLossValue = opnameItems.reduce((acc, item) => {
    if (item.discrepancy < 0) {
      return acc + (Math.abs(item.discrepancy) * item.priceBuy);
    }
    return acc;
  }, 0);

  const totalSurplusValue = opnameItems.reduce((acc, item) => {
    if (item.discrepancy > 0) {
      return acc + (item.discrepancy * item.priceBuy);
    }
    return acc;
  }, 0);

  // Submit Opname Execution to Backend
  const handleExecuteReconciliation = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        sessionTitle,
        employeeId: currentUser?.id || "EMP001",
        employeeName: currentUser?.name || "Manajer Toko",
        notes: sessionNotes,
        items: opnameItems.map(i => ({
          productId: i.productId,
          productName: i.productName,
          category: i.category,
          priceBuy: i.priceBuy,
          priceSell: i.priceSell,
          systemStock: i.systemStock,
          physicalStock: i.physicalStock,
          shrinkage: i.shrinkage,
          discrepancy: i.discrepancy,
          missingImeis: i.missingImeis || [],
          notes: i.notes || ""
        }))
      };

      const res = await apiFetch("/api/opnames", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        alert("🎉 Berhasil! Stok Opname telah diselesaikan dan stok inventaris disesuaikan secara otomatis.");
        setShowConfirmModal(false);
        onProductsChange(); // Refresh parent products
        setActiveSubTab("HISTORY");
      } else {
        alert("Gagal melakukan stok opname: " + (data.message || "Terjadi kesalahan."));
      }
    } catch (err) {
      console.error("Error executing opname:", err);
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteHistoryOpname = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus catatan riwayat audit opname ini?")) return;
    try {
      const res = await apiFetch(`/api/opnames/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchHistoryOpnames();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
              <ClipboardCheck className="h-3.5 w-3.5 text-indigo-400" />
              Audit Stok Fisik Toko & Rekonsiliasi Otomatis
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">
              Modul Stok Opname
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl">
              Pemeriksaan periodik persediaan smartphone & barang toko. Verifikasi stok sistem dengan stok fisik, catat selisih kerugian, dan sesuaikan inventaris otomatis.
            </p>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 self-start md:self-auto">
            <button
              onClick={() => setActiveSubTab("ACTIVE")}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                activeSubTab === "ACTIVE"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <ClipboardCheck className="h-4 w-4" />
              Sesi Opname Aktif
            </button>
            <button
              onClick={() => setActiveSubTab("HISTORY")}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                activeSubTab === "HISTORY"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <History className="h-4 w-4" />
              Riwayat Audit ({historyOpnames.length})
            </button>
          </div>
        </div>
      </div>

      {activeSubTab === "ACTIVE" ? (
        <div className="space-y-6">
          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Item Dicheck</span>
              <div className="flex items-center justify-between">
                <span className="text-xl font-extrabold text-slate-900">{opnameItems.length} Produk</span>
                <Boxes className="h-5 w-5 text-indigo-600" />
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Stok Sistem: {totalSystemUnits} unit</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Stok Fisik Diinput</span>
              <div className="flex items-center justify-between">
                <span className="text-xl font-extrabold text-slate-900">{totalPhysicalUnits} Unit</span>
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Fisik vs Sistem</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Produk Ada Selisih</span>
              <div className="flex items-center justify-between">
                <span className={`text-xl font-extrabold ${itemsWithDiscrepancy.length > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                  {itemsWithDiscrepancy.length} SKU ({totalDiscrepancyUnits} unit)
                </span>
                <AlertTriangle className={`h-5 w-5 ${itemsWithDiscrepancy.length > 0 ? "text-rose-500" : "text-emerald-500"}`} />
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Perlu Penyesuaian</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Estimasi Dampak HPP Loss</span>
              <div className="flex items-center justify-between">
                <span className={`text-xl font-extrabold ${totalLossValue > 0 ? "text-rose-600" : "text-slate-900"}`}>
                  Rp {totalLossValue.toLocaleString("id-ID")}
                </span>
                <TrendingDown className="h-5 w-5 text-rose-500" />
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Surplus: +Rp {totalSurplusValue.toLocaleString("id-ID")}</p>
            </div>
          </div>

          {/* Opname Title & Scanner Controls */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Judul Sesi Audit Opname
                </label>
                <input
                  type="text"
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  placeholder="Misal: Opname Bulanan Agustus 2026"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold rounded-xl px-3 py-2.5 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan Sesi / Nama Auditor
                </label>
                <input
                  type="text"
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder="Diperiksa oleh: Alex (Manager) & Budi (Kasir)"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold rounded-xl px-3 py-2.5 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Scanning Bar & Quick Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <div className="relative flex-1">
                  <Barcode className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    ref={usbInputRef}
                    type="text"
                    value={usbBarcodeBuffer}
                    onChange={(e) => setUsbBarcodeBuffer(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleBarcodeScan(usbBarcodeBuffer);
                        setUsbBarcodeBuffer("");
                      }
                    }}
                    placeholder="Scan Barcode SKU / IMEI dengan USB Barcode Scanner..."
                    className="w-full bg-indigo-50/50 border border-indigo-200 text-slate-900 text-xs font-semibold rounded-xl pl-9 pr-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <button
                  onClick={() => setIsScannerOpen(!isScannerOpen)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isScannerOpen 
                      ? "bg-rose-100 text-rose-700 border border-rose-200"
                      : "bg-indigo-600 text-white shadow-xs hover:bg-indigo-700"
                  }`}
                >
                  <Camera className="h-4 w-4" />
                  {isScannerOpen ? "Tutup Kamera" : "Scan Kamera"}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetAllToSystem}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Samakan seluruh stok fisik dengan stok sistem"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Samakan Semua dengan Sistem
                </button>

                <button
                  onClick={handleExportExcel}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  title="Ekspor Draft Opname ke Excel (.xlsx)"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-white" />
                  Export Draft Excel (.xlsx)
                </button>

                <button
                  onClick={handleExportCSV}
                  className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Ekspor Draft Opname ke CSV"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  Export Draft CSV
                </button>

                <button
                  onClick={() => setShowConfirmModal(true)}
                  disabled={opnameItems.length === 0}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-2 transition-all shadow-md shadow-indigo-600/20 active:scale-[0.98] cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  Selesaikan & Sesuaikan Stok
                </button>
              </div>
            </div>

            {/* Scan Feedback Toast */}
            {scanToast && (
              <div className="p-3 bg-indigo-900 text-white rounded-xl text-xs font-bold flex items-center justify-between animate-fade-in shadow-lg">
                <span>{scanToast}</span>
                <button onClick={() => setScanToast(null)} className="text-slate-300 hover:text-white">✕</button>
              </div>
            )}

            {/* Camera Viewport */}
            {isScannerOpen && (
              <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-white text-xs">
                  <span className="font-bold flex items-center gap-2">
                    <Camera className="h-4 w-4 text-indigo-400" />
                    Kamera Barcode / IMEI Reader Aktif
                  </span>
                  {cameras.length > 1 && (
                    <select
                      value={selectedCameraId}
                      onChange={(e) => setSelectedCameraId(e.target.value)}
                      className="bg-slate-800 text-white border border-slate-700 rounded-lg px-2 py-1 text-[11px]"
                    >
                      {cameras.map(c => (
                        <option key={c.id} value={c.id}>{c.label || `Kamera ${c.id}`}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div id="qr-reader-opname" className="overflow-hidden rounded-xl max-w-md mx-auto border-2 border-dashed border-indigo-500"></div>
                <p className="text-[11px] text-slate-400 text-center">
                  Arahkan kamera ke barcode serial IMEI atau barcode SKU di dus hp.
                </p>
              </div>
            )}
          </div>

          {/* Opname Table & Filters */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            {/* Table Search & Filter Bar */}
            <div className="p-4 bg-slate-50 border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama produk, brand, SKU..."
                    className="w-full bg-white border border-slate-200 text-slate-900 text-xs font-semibold rounded-xl pl-9 pr-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                {/* Category Filter */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {categoriesList.map(cat => (
                    <option key={cat} value={cat}>Kategori: {cat}</option>
                  ))}
                </select>
              </div>

              {/* Discrepancy Filter Toggles */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => setDiscrepancyFilter("ALL")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    discrepancyFilter === "ALL" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Semua ({opnameItems.length})
                </button>
                <button
                  onClick={() => setDiscrepancyFilter("DISCREPANCY")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    discrepancyFilter === "DISCREPANCY" ? "bg-rose-600 text-white" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Selisih Saja ({itemsWithDiscrepancy.length})
                </button>
                <button
                  onClick={() => setDiscrepancyFilter("MATCHING")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    discrepancyFilter === "MATCHING" ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Sesuai ({opnameItems.length - itemsWithDiscrepancy.length})
                </button>
              </div>
            </div>

            {/* Interactive Opname Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Info Produk & SKU</th>
                    <th className="py-3 px-3 text-right">HPP Beli</th>
                    <th className="py-3 px-3 text-center">Stok Sistem</th>
                    <th className="py-3 px-4 text-center">Stok Fisik Audit</th>
                    <th className="py-3 px-3 text-center">Status Selisih</th>
                    <th className="py-3 px-4 text-right">Dampak Rp HPP</th>
                    <th className="py-3 px-4">Catatan Alasan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium">
                  {filteredOpnameItems.length > 0 ? (
                    filteredOpnameItems.map((item) => {
                      const diff = item.discrepancy;
                      const impactRp = diff * item.priceBuy;

                      return (
                        <tr 
                          key={item.productId}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            diff < 0 ? "bg-rose-50/30" : diff > 0 ? "bg-indigo-50/30" : ""
                          }`}
                        >
                          <td className="py-3 px-4">
                            <div className="font-extrabold text-slate-900">{item.productName}</div>
                            <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2">
                              <span>SKU: {item.sku}</span>
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 font-sans font-bold text-slate-600">{item.category}</span>
                            </div>
                          </td>

                          <td className="py-3 px-3 text-right font-bold text-slate-700">
                            Rp {item.priceBuy.toLocaleString("id-ID")}
                          </td>

                          <td className="py-3 px-3 text-center">
                            <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-extrabold text-xs">
                              {item.systemStock}
                            </span>
                          </td>

                          {/* Physical Stock Interactive Controls */}
                          <td className="py-3 px-4 text-center">
                            <div className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-1">
                              <button
                                onClick={() => updateItemPhysicalStock(item.productId, item.physicalStock - 1)}
                                className="p-1 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer transition-colors"
                                title="Kurangi 1"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              
                              <input
                                type="number"
                                value={item.physicalStock}
                                onChange={(e) => updateItemPhysicalStock(item.productId, parseInt(e.target.value) || 0)}
                                className="w-14 text-center bg-white border border-slate-200 font-extrabold text-slate-900 rounded-lg py-1 text-xs focus:ring-indigo-500 focus:border-indigo-500"
                              />

                              <button
                                onClick={() => updateItemPhysicalStock(item.productId, item.physicalStock + 1)}
                                className="p-1 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer transition-colors"
                                title="Tambah 1"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>

                          {/* Status Selisih */}
                          <td className="py-3 px-3 text-center">
                            {diff === 0 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-extrabold text-[11px]">
                                <CheckCircle className="h-3 w-3" /> Sesuai
                              </span>
                            ) : diff < 0 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-300 font-extrabold text-[11px]">
                                <TrendingDown className="h-3 w-3" /> {diff} (Hilang)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-300 font-extrabold text-[11px]">
                                <TrendingUp className="h-3 w-3" /> +{diff} (Kelebihan)
                              </span>
                            )}
                          </td>

                          {/* Financial Impact */}
                          <td className="py-3 px-4 text-right font-extrabold">
                            {impactRp === 0 ? (
                              <span className="text-slate-400">Rp 0</span>
                            ) : impactRp < 0 ? (
                              <span className="text-rose-600">-Rp {Math.abs(impactRp).toLocaleString("id-ID")}</span>
                            ) : (
                              <span className="text-indigo-600">+Rp {impactRp.toLocaleString("id-ID")}</span>
                            )}
                          </td>

                          {/* Notes */}
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              value={item.notes || ""}
                              onChange={(e) => updateItemNotes(item.productId, e.target.value)}
                              placeholder={diff !== 0 ? "Alasan selisih..." : "Catatan opsional..."}
                              className={`w-full text-xs rounded-xl px-2.5 py-1.5 border transition-colors ${
                                diff !== 0 
                                  ? "bg-rose-50/50 border-rose-200 text-slate-900 focus:ring-rose-500" 
                                  : "bg-slate-50 border-slate-200 text-slate-700"
                              }`}
                            />
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <Boxes className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                        <p className="font-bold">Tidak ada data produk yang cocok dengan filter.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Sticky Action Footer */}
            <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Selisih</span>
                  <span className="font-extrabold text-sm text-rose-400">{itemsWithDiscrepancy.length} SKU ({totalDiscrepancyUnits} Unit)</span>
                </div>
                <div className="h-8 w-px bg-slate-800"></div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Nilai Kerugian (Loss)</span>
                  <span className="font-extrabold text-sm text-rose-400">Rp {totalLossValue.toLocaleString("id-ID")}</span>
                </div>
              </div>

              <button
                onClick={() => setShowConfirmModal(true)}
                disabled={opnameItems.length === 0}
                className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
              >
                <Save className="h-4 w-4" />
                Eksekusi Penyesuaian Stok Otomatis
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* HISTORY SUB-TAB */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <History className="h-5 w-5 text-indigo-600" />
                Riwayat Audit Stok Opname Toko
              </h3>
              <p className="text-xs text-slate-500">Laporan audit fisik masa lalu dan histori penyesuaian stok inventaris.</p>
            </div>
            <button
              onClick={fetchHistoryOpnames}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Refresh Data
            </button>
          </div>

          {isLoadingHistory ? (
            <div className="py-12 text-center text-slate-500 text-xs font-bold">
              Memuat riwayat stok opname...
            </div>
          ) : historyOpnames.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {historyOpnames.map((op) => (
                <div key={op.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/60 p-3 rounded-xl transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-sm">{op.sessionTitle || op.id}</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        {op.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
                      <span>ID: <strong className="font-mono text-slate-700">{op.id}</strong></span>
                      <span>Tanggal: {new Date(op.date).toLocaleString("id-ID")}</span>
                      <span>Auditor: <strong className="text-slate-700">{op.employeeName}</strong></span>
                    </div>
                    {op.notes && (
                      <p className="text-[11px] text-slate-600 italic">"{op.notes}"</p>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-700">
                        Selisih: <span className="text-rose-600 font-extrabold">{op.totalDiscrepancyItems || 0} Unit</span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Loss: Rp {(op.totalLossAmount || 0).toLocaleString("id-ID")}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setSelectedHistoryDetail(op)}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" /> Detail Laporan
                      </button>
                      <button
                        onClick={() => handleDeleteHistoryOpname(op.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                        title="Hapus riwayat"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400">
              <ClipboardCheck className="h-10 w-10 mx-auto mb-2 text-slate-300" />
              <p className="font-bold text-sm">Belum ada riwayat stok opname yang disimpan.</p>
              <p className="text-xs text-slate-500">Jalankan sesi opname aktif untuk mencatat hasil audit fisik pertama Anda.</p>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal Before Reconciliation */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-lg w-full shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Konfirmasi Penyesuaian Stok</h3>
                  <p className="text-xs text-slate-500">Rekonsiliasi otomatis persediaan fisik ke database</p>
                </div>
              </div>
              <button onClick={() => setShowConfirmModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">✕</button>
            </div>

            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div className="flex justify-between font-semibold">
                <span className="text-slate-600">Judul Sesi:</span>
                <span className="text-slate-900 font-bold">{sessionTitle}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span className="text-slate-600">Total Produk Berbeda Stok:</span>
                <span className="text-rose-600 font-extrabold">{itemsWithDiscrepancy.length} SKU</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span className="text-slate-600">Total Unit Selisih (Hilang/Lebih):</span>
                <span className="text-rose-600 font-extrabold">{totalDiscrepancyUnits} Unit</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span className="text-slate-600">Estimasi Kerugian Nilai (Loss HPP):</span>
                <span className="text-rose-600 font-extrabold">Rp {totalLossValue.toLocaleString("id-ID")}</span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 flex items-start gap-2">
              <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Dengan mengonfirmasi, stok fisik yang Anda input akan menjadi stok resmi sistem. Riwayat audit akan dicatat ke dalam log aktivitas tenant.
              </span>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleExecuteReconciliation}
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs transition-colors shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                {isSubmitting ? "Memproses..." : "Ya, Sesuaikan Stok Sekarang"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Detail Modal */}
      {selectedHistoryDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-3xl w-full shadow-2xl space-y-4 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">{selectedHistoryDetail.sessionTitle || selectedHistoryDetail.id}</h3>
                <p className="text-xs text-slate-500">
                  Waktu Audit: {new Date(selectedHistoryDetail.date).toLocaleString("id-ID")} | Auditor: {selectedHistoryDetail.employeeName}
                </p>
              </div>
              <button onClick={() => setSelectedHistoryDetail(null)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 block">Total Selisih Unit</span>
                <span className="text-base font-extrabold text-slate-900">{selectedHistoryDetail.totalDiscrepancyItems || 0} Unit</span>
              </div>
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                <span className="text-rose-600 block">Total Dampak Kerugian (HPP Loss)</span>
                <span className="text-base font-extrabold text-rose-700">Rp {(selectedHistoryDetail.totalLossAmount || 0).toLocaleString("id-ID")}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Rincian Item Discrepancy / Penyesuaian</h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 font-bold text-slate-700">
                    <tr>
                      <th className="p-2.5">Produk</th>
                      <th className="p-2.5 text-center">Stok Sistem</th>
                      <th className="p-2.5 text-center">Stok Fisik</th>
                      <th className="p-2.5 text-center">Selisih</th>
                      <th className="p-2.5">Catatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedHistoryDetail.items && selectedHistoryDetail.items.length > 0 ? (
                      selectedHistoryDetail.items.map((it: any, idx: number) => (
                        <tr key={idx} className={it.discrepancy !== 0 ? "bg-rose-50/40" : ""}>
                          <td className="p-2.5 font-bold text-slate-900">{it.productName}</td>
                          <td className="p-2.5 text-center text-slate-600">{it.systemStock}</td>
                          <td className="p-2.5 text-center font-bold text-slate-900">{it.physicalStock}</td>
                          <td className="p-2.5 text-center font-extrabold">
                            {it.discrepancy === 0 ? (
                              <span className="text-slate-400">0</span>
                            ) : it.discrepancy < 0 ? (
                              <span className="text-rose-600">{it.discrepancy}</span>
                            ) : (
                              <span className="text-indigo-600">+{it.discrepancy}</span>
                            )}
                          </td>
                          <td className="p-2.5 text-slate-600 italic">{it.notes || "-"}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-slate-400">Tidak ada rincian data item.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedHistoryDetail(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
