import { apiFetch } from '../lib/api';
import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { QRCodeSVG } from 'qrcode.react';
import { 
  Smartphone, 
  Search, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle, 
  CheckCircle2,
  Info,
  Database,
  AlertTriangle,
  Printer, 
  Trash2, 
  Coins, 
  Cpu, 
  FileCheck,
  Plus,
  Sparkles,
  TrendingUp,
  History,
  Calculator,
  Sliders,
  Box,
  Check,
  ArrowRight,
  Tag,
  Scale,
  Wrench,
  X
} from "lucide-react";
import { Buyback, Product } from "../types";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import BrandModelSearchInput from "./BrandModelSearchInput";

interface BuybackProps {
  buybacks: Buyback[];
  products?: Product[];
  onBuybacksChange: () => void;
  userRole: string;
  cashierUser: any;
}

export default function BuybackModule({ buybacks: initialBuybacks, products = [], onBuybacksChange, userRole, cashierUser }: BuybackProps) {
  const [buybacks, setBuybacks] = useState<Buyback[]>(initialBuybacks);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeView, setActiveView] = useState<"list" | "history">("list");
  const [showAddModal, setShowAddModal] = useState(false);

  // Form Fields
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerImei, setCustomerImei] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [condition, setCondition] = useState<"A" | "B" | "C" | "D">("A");
  const [priceBuy, setPriceBuy] = useState("");
  const [notes, setNotes] = useState("");
  const [linkedProductId, setLinkedProductId] = useState<string | null>(null);

  // Kalkulator Estimasi Buyback State
  const [showCalcModal, setShowCalcModal] = useState(false);
  const [calcBrand, setCalcBrand] = useState("Apple");
  const [calcModel, setCalcModel] = useState("iPhone 13 128GB");
  const [calcMarketPrice, setCalcMarketPrice] = useState<number>(7500000);
  const [calcPhysicalCondition, setCalcPhysicalCondition] = useState<"MULUS" | "LECET_HALUS" | "LECET_PARAH" | "LAYAR_RETAK">("MULUS");
  const [calcCompleteness, setCalcCompleteness] = useState<"FULLSET_ORI" | "FULLSET_OEM" | "BATANGAN">("FULLSET_ORI");
  const [calcBatteryHealth, setCalcBatteryHealth] = useState<"EXCELLENT" | "GOOD" | "POOR">("EXCELLENT");
  const [calcBiometric, setCalcBiometric] = useState<"NORMAL" | "OFF">("NORMAL");
  const [calcScreenStatus, setCalcScreenStatus] = useState<"ORIGINAL" | "REPLACED">("ORIGINAL");
  const [calcWarrantyStatus, setCalcWarrantyStatus] = useState<"EXPIRED" | "ACTIVE">("EXPIRED");

  // Auto update benchmark market price when calcModel changes
  useEffect(() => {
    if (!calcModel) return;
    const lower = calcModel.toLowerCase();
    const matched = products.find(p => p.name.toLowerCase().includes(lower) || (p.model && p.model.toLowerCase().includes(lower)));
    if (matched) {
      setCalcMarketPrice(matched.priceSell || matched.priceBuy || 7500000);
    } else {
      if (lower.includes("15 pro max")) setCalcMarketPrice(17500000);
      else if (lower.includes("15 pro")) setCalcMarketPrice(15000000);
      else if (lower.includes("15")) setCalcMarketPrice(12000000);
      else if (lower.includes("14 pro max")) setCalcMarketPrice(14500000);
      else if (lower.includes("14 pro")) setCalcMarketPrice(12500000);
      else if (lower.includes("14")) setCalcMarketPrice(9500000);
      else if (lower.includes("13")) setCalcMarketPrice(7500000);
      else if (lower.includes("s24 ultra")) setCalcMarketPrice(15500000);
      else if (lower.includes("s23")) setCalcMarketPrice(9000000);
    }
  }, [calcModel, products]);

  const calcResult = useMemo(() => {
    const base = Number(calcMarketPrice) || 0;

    let physPct = 0;
    let physLabel = "Mulus 98-100% (No Scratches)";
    if (calcPhysicalCondition === "LECET_HALUS") {
      physPct = -0.10;
      physLabel = "Lecet Halus Pemakaian (-10%)";
    } else if (calcPhysicalCondition === "LECET_PARAH") {
      physPct = -0.25;
      physLabel = "Lecet Parah / Jamur (-25%)";
    } else if (calcPhysicalCondition === "LAYAR_RETAK") {
      physPct = -0.40;
      physLabel = "Layar Retak / Bezel Penyok (-40%)";
    }

    let compPct = 0;
    let compLabel = "Fullset Original (Box+Charger)";
    if (calcCompleteness === "FULLSET_OEM") {
      compPct = -0.05;
      compLabel = "Fullset OEM / Dus Pengganti (-5%)";
    } else if (calcCompleteness === "BATANGAN") {
      compPct = -0.15;
      compLabel = "Batangan / Tanpa Box (-15%)";
    }

    let hwDeductions = 0;
    const hwDetails: string[] = [];

    if (calcBatteryHealth === "GOOD") {
      hwDeductions -= 150000;
      hwDetails.push("BH 75-84% (-Rp 150rb)");
    } else if (calcBatteryHealth === "POOR") {
      hwDeductions -= 350000;
      hwDetails.push("BH <75% / Service (-Rp 350rb)");
    }

    if (calcBiometric === "OFF") {
      hwDeductions -= 400000;
      hwDetails.push("FaceID/Fingerprint OFF (-Rp 400rb)");
    }

    if (calcScreenStatus === "REPLACED") {
      hwDeductions -= 300000;
      hwDetails.push("Layar Pernah Ganti/Shadow (-Rp 300rb)");
    }

    if (calcWarrantyStatus === "ACTIVE") {
      hwDeductions += 250000;
      hwDetails.push("Garansi Resmi Aktif (+Rp 250rb)");
    }

    const pctSum = 1 + physPct + compPct;
    const priceFromPct = base * Math.max(0.15, pctSum);
    const rawFinalOffer = priceFromPct + hwDeductions;
    const finalOffer = Math.max(100000, Math.floor(rawFinalOffer / 50000) * 50000);

    let derivedGrade: "A" | "B" | "C" | "D" = "A";
    if (calcPhysicalCondition === "LAYAR_RETAK" || calcBiometric === "OFF") {
      derivedGrade = "D";
    } else if (calcPhysicalCondition === "LECET_PARAH" || calcCompleteness === "BATANGAN" || calcBatteryHealth === "POOR") {
      derivedGrade = "C";
    } else if (calcPhysicalCondition === "LECET_HALUS" || calcCompleteness === "FULLSET_OEM" || calcBatteryHealth === "GOOD") {
      derivedGrade = "B";
    }

    const estimatedResellPrice = Math.floor((finalOffer * 1.25) / 50000) * 50000;
    const estimatedStoreMargin = estimatedResellPrice - finalOffer;

    const summaryNotes = `[Kalkulator Buyback] Fisik: ${physLabel} | Dus: ${compLabel}${hwDetails.length > 0 ? " | HW: " + hwDetails.join(", ") : ""}`;

    return {
      base,
      physPct,
      physLabel,
      compPct,
      compLabel,
      hwDeductions,
      hwDetails,
      finalOffer,
      derivedGrade,
      estimatedResellPrice,
      estimatedStoreMargin,
      summaryNotes
    };
  }, [calcMarketPrice, calcPhysicalCondition, calcCompleteness, calcBatteryHealth, calcBiometric, calcScreenStatus, calcWarrantyStatus]);

  const handleApplyCalcToForm = () => {
    setBrand(calcBrand);
    setModel(calcModel);
    setCondition(calcResult.derivedGrade);
    setPriceBuy(calcResult.finalOffer.toString());
    setNotes(calcResult.summaryNotes);
    setShowCalcModal(false);
    setShowAddModal(true);
  };

  // Real-time IMEI Blacklist & Audit Validation State
  const [imeiValidation, setImeiValidation] = useState<{
    isValidating: boolean;
    result: {
      valid?: boolean;
      status?: string;
      isBlacklisted?: boolean;
      isStolen?: boolean;
      riskScore?: number;
      reason?: string;
      details?: any;
    } | null;
  }>({ isValidating: false, result: null });

  useEffect(() => {
    const trimmed = (customerImei || "").trim().replace(/[\s-]/g, "");
    if (trimmed.length < 5) {
      setImeiValidation({ isValidating: false, result: null });
      return;
    }

    setImeiValidation(prev => ({ ...prev, isValidating: true }));
    const timer = setTimeout(async () => {
      try {
        const res = await apiFetch("/api/imei/validate", {
          method: "POST",
          body: JSON.stringify({ imei: trimmed, source: "Buyback Form" })
        });
        const data = await res.json();
        setImeiValidation({ isValidating: false, result: data });
      } catch (err) {
        setImeiValidation({ isValidating: false, result: null });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [customerImei]);

  // Real-time Catalog Validation Layer (Prevents Duplication & Recommends Product IDs)
  const catalogValidation = useMemo(() => {
    if (!brand.trim() && !model.trim()) {
      return { status: "EMPTY", exactMatch: null, suggestions: [] };
    }

    const cleanBrand = brand.trim().toLowerCase();
    const cleanModel = model.trim().toLowerCase();

    // 1. If explicitly linked to a Product ID
    if (linkedProductId) {
      const linked = products.find(p => p.id === linkedProductId);
      if (linked) {
        return { status: "LINKED", exactMatch: linked, suggestions: [] };
      }
    }

    // 2. Check for exact match in existing products catalog
    const exactMatch = products.find(p => {
      const pBrand = (p.brand || "").trim().toLowerCase();
      const pModel = (p.model || "").trim().toLowerCase();
      const pName = (p.name || "").trim().toLowerCase();

      const brandMatch = !cleanBrand || pBrand === cleanBrand;
      const modelMatch = (pModel && pModel === cleanModel) || (pName && pName === cleanModel) || (cleanModel.length > 2 && pName.includes(cleanModel));
      
      return brandMatch && modelMatch && (p.type === "BEKAS" || p.condition === condition);
    }) || products.find(p => {
      const pBrand = (p.brand || "").trim().toLowerCase();
      const pModel = (p.model || "").trim().toLowerCase();
      return (!cleanBrand || pBrand === cleanBrand) && pModel === cleanModel && pModel.length > 0;
    });

    if (exactMatch) {
      return { status: "EXACT_MATCH", exactMatch, suggestions: [] };
    }

    // 3. Find suggestions (products with matching brand or model substring)
    const suggestions = products.filter(p => {
      const pBrand = (p.brand || "").trim().toLowerCase();
      const pModel = (p.model || "").trim().toLowerCase();
      const pName = (p.name || "").trim().toLowerCase();

      if (cleanBrand && pBrand === cleanBrand) return true;
      if (cleanModel && (pModel.includes(cleanModel) || pName.includes(cleanModel) || cleanModel.includes(pModel))) return true;
      return false;
    }).slice(0, 3);

    if (suggestions.length > 0) {
      return { status: "SUGGESTIONS", exactMatch: null, suggestions };
    }

    return { status: "NEW_PRODUCT", exactMatch: null, suggestions: [] };
  }, [brand, model, condition, products, linkedProductId]);

  const [isTaksirAi, setIsTaksirAi] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  const handleAiTaksirHarga = async () => {
    if (!brand.trim() || !model.trim()) {
      alert("Harap masukkan Brand dan Model HP terlebih dahulu agar AI dapat menaksir.");
      return;
    }
    setIsTaksirAi(true);
    setAiAnalysis(null);

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
      const res = await apiFetch("/api/ai/suggest-buyback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand, model, condition, customConfig }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setPriceBuy((data.data.estimatedPrice ?? 0).toString());
        setAiAnalysis(`${data.data.analysis} (Rentang pasar: ${data.data.marketPriceRange})`);
      } else {
        alert("Gagal memanggil asisten taksir harga AI.");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan koneksi ke asisten taksir harga AI.");
    } finally {
      setIsTaksirAi(false);
    }
  };

  // Print modal
  const [selectedReceipt, setSelectedReceipt] = useState<Buyback | null>(null);

  useEffect(() => {
    setBuybacks(initialBuybacks);
  }, [initialBuybacks]);

  // Simulate pricing based on condition grade when brand/model changes
  useEffect(() => {
    if (brand && model) {
      // Basic simulation logic
      let basePrice = 5000000;
      if (model.toLowerCase().includes("15")) basePrice = 14000000;
      else if (model.toLowerCase().includes("14")) basePrice = 10000000;
      else if (model.toLowerCase().includes("13")) basePrice = 6500000;
      else if (model.toLowerCase().includes("s24")) basePrice = 12000000;

      // Grade modifiers
      let multiplier = 1.0;
      if (condition === "B") multiplier = 0.85;
      else if (condition === "C") multiplier = 0.70;
      else if (condition === "D") multiplier = 0.50;

      setPriceBuy(Math.floor(basePrice * multiplier).toString());
    }
  }, [brand, model, condition]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerImei || customerImei.length < 15) {
      alert("Harap masukkan nomor IMEI 15-digit yang valid untuk verifikasi.");
      return;
    }

    const targetProductId = linkedProductId || catalogValidation.exactMatch?.id;

    const payload = {
      customerName,
      customerPhone,
      customerImei,
      brand,
      model,
      condition,
      priceBuy: Number(priceBuy),
      notes,
      cashierId: cashierUser?.id || "EMP002",
      cashierName: cashierUser?.name || "Budi Santoso",
      linkedProductId: targetProductId || undefined
    };

    try {
      const response = await apiFetch("/api/buybacks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (data.success) {
        setShowAddModal(false);
        onBuybacksChange();
        
        // Show validation result alert
        const imeiResult = data.buyback.imeiStatus;
        if (imeiResult === "BLACKLISTED") {
          alert(`⚠️ PERINGATAN KEAMANAN IMEI!\n\nIMEI perangkat ini (${customerImei}) terindikasi BLACKLISTED atau hasil curian.\nTransaksi buyback direkam, namun perangkat tidak dimasukkan ke dalam stok penjualan aktif.`);
        } else {
          alert(`✅ VERIFIKASI IMEI BERHASIL!\n\nIMEI: ${customerImei} (${imeiResult})\nPerangkat lolos verifikasi keamanan dan otomatis ditambahkan ke Katalog HP Bekas untuk dijual kembali!`);
        }

        // Open print view immediately
        setSelectedReceipt(data.buyback);
      } else {
        alert("Gagal melakukan transaksi buyback.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Buyback history grouping
  const groupedBuybacks = buybacks.reduce((acc, curr) => {
    const key = `${curr.brand} ${curr.model}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(curr);
    return acc;
  }, {} as Record<string, Buyback[]>);

  Object.values(groupedBuybacks).forEach((arr: any) => {
    arr.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });

  const historyEntries = Object.entries(groupedBuybacks).filter(([model]) => model.toLowerCase().includes(searchQuery.toLowerCase())) as [string, Buyback[]][];

  const filtered = buybacks.filter(b => 

    b.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.customerImei.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      
      {/* Header and Add Buyback trigger */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-md font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Coins className="h-5.5 w-5.5 text-emerald-600" />
            Modul Buyback & Tukar Tambah HP Bekas
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Beli hp bekas dari pelanggan dengan verifikasi IMEI otomatis, pengecekan garansi, dan integrasi stok penjualan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowCalcModal(true)}
            className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs flex items-center gap-1.5 active:scale-[0.97] transition-all cursor-pointer border border-indigo-200"
            title="Kalkulator otomatis harga buyback berdasarkan kondisi fisik & kelengkapan kotak"
          >
            <Calculator className="h-4 w-4 text-indigo-600" />
            Kalkulator Estimasi Buyback
          </button>

          {userRole !== "CASHIER" && (
            <button
              id="btn-add-buyback-modal"
              onClick={() => {
                setCustomerName("");
                setCustomerPhone("");
                setCustomerImei("");
                setBrand("Apple");
                setModel("iPhone 13 128GB");
                setCondition("A");
                setNotes("");
                setLinkedProductId(null);
                setShowAddModal(true);
              }}
              className="px-4.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 active:scale-[0.97] transition-all cursor-pointer shadow-md shadow-emerald-600/10"
            >
              <Plus className="h-4 w-4" />
              Proses Buyback Baru
            </button>
          )}
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveView("list")}
          className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeView === "list" ? "border-emerald-500 text-emerald-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}
        >
          <Coins className="h-4 w-4" />
          Riwayat Transaksi
        </button>
        <button
          onClick={() => setActiveView("history")}
          className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeView === "history" ? "border-emerald-500 text-emerald-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}
        >
          <TrendingUp className="h-4 w-4" />
          Prediksi & Tren Harga Pasar
        </button>
      </div>

      {/* Filter and search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3 text-slate-400 h-4.5 w-4.5" />
        <input
          type="text"
          placeholder="Cari transaksi buyback berdasarkan nama konsumen, IMEI, brand, atau model hp..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>

{/* Buybacks List */}
      {activeView === "list" && (
        <>
          {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
          <Coins className="h-12 w-12 mx-auto mb-2.5 opacity-40" />
          <p className="text-sm font-semibold">Tidak ada transaksi buyback terdaftar.</p>
          <p className="text-xs text-slate-400 mt-1">Lakukan buyback baru untuk memasukkan hp bekas ke stok.</p>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <th className="p-4">No Buyback</th>
                <th className="p-4">Tanggal</th>
                <th className="p-4">Konsumen</th>
                <th className="p-4">Detail Perangkat</th>
                <th className="p-4">Status IMEI</th>
                <th className="p-4 text-right">Harga Beli</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/50">
                  <td className="p-4 font-mono font-bold text-slate-700">{b.id}</td>
                  <td className="p-4 text-slate-500">{new Date(b.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</td>
                  <td className="p-4">
                    <p className="font-bold text-slate-700">{b.customerName}</p>
                    <p className="text-slate-400 text-[10px] font-mono">{b.customerPhone}</p>
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-slate-700">{b.brand} {b.model}</p>
                    <p className="text-slate-400 font-mono text-[10px]">IMEI: {b.customerImei}</p>
                    <span className="inline-flex px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-slate-50 border border-slate-100 text-slate-500 mt-1 uppercase">Grade {b.condition}</span>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${b.imeiStatus === "CLEAN" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : b.imeiStatus === "WARRANTY_ACTIVE" ? "bg-primary-50 text-primary-700 border-primary-200" : b.imeiStatus === "WARRANTY_EXPIRED" ? "bg-slate-50 text-slate-500 border-slate-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                      {b.imeiStatus === "CLEAN" ? (
                        <>
                          <ShieldCheck className="h-3 w-3" />
                          IMEI Clean
                        </>
                      ) : b.imeiStatus === "WARRANTY_ACTIVE" ? (
                        <>
                          <CheckCircle className="h-3 w-3" />
                          Garansi Aktif
                        </>
                      ) : b.imeiStatus === "WARRANTY_EXPIRED" ? (
                        "Garansi Habis"
                      ) : (
                        <>
                          <ShieldAlert className="h-3 w-3 text-red-500" />
                          DIBLOKIR / PENADAHAN
                        </>
                      )}
                    </span>
                  </td>
                  <td className="p-4 text-right font-bold text-emerald-700">Rp {(b.priceBuy ?? 0).toLocaleString("id-ID")}</td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => setSelectedReceipt(b)}
                      className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg cursor-pointer"
                      title="Cetak Bukti Buyback"
                    >
                      <Printer className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
        </>
      )}

      {/* History View */}
      {activeView === "history" && (
        <div className="space-y-4">
          {historyEntries.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
              <History className="h-12 w-12 mx-auto mb-2.5 opacity-40" />
              <p className="text-sm font-semibold">Tidak ada riwayat harga yang ditemukan.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {historyEntries.map(([modelName, historyList]) => {
                const latestPrice = historyList[0].priceBuy;
                const lowestPrice = Math.min(...historyList.map(h => h.priceBuy));
                const highestPrice = Math.max(...historyList.map(h => h.priceBuy));
                
                return (
                  <div key={modelName} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between border-b border-slate-100 pb-3 mb-3">
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-800">{modelName}</h3>
                        <p className="text-[10px] text-slate-500 mt-0.5">Berdasarkan {historyList.length} transaksi</p>
                      </div>
                      <div className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md text-[10px] font-bold border border-emerald-100">
                        Harga Terakhir: Rp {(latestPrice ?? 0).toLocaleString("id-ID")}
                      </div>
                    </div>
                    
                    <div className="h-32 w-full mt-2 mb-3">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={[...historyList].reverse()} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="date" 
                            tickFormatter={(tick) => new Date(tick).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                            tick={{ fontSize: 9, fill: "#94a3b8" }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis hide domain={['dataMin', 'dataMax']} />
                          <Tooltip
                            contentStyle={{ 
                              backgroundColor: '#0f172a', 
                              border: 'none',
                              borderRadius: '8px',
                              color: '#fff',
                              fontSize: '10px',
                              fontWeight: 'bold'
                            }}
                            labelFormatter={(label) => new Date(label).toLocaleDateString("id-ID")}
                            formatter={(value) => [`Rp ${Number(value || 0).toLocaleString("id-ID")}`, "Harga Beli"]}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="priceBuy" 
                            stroke="#10b981" 
                            strokeWidth={3} 
                            dot={{ fill: '#10b981', r: 3 }}
                            activeDot={{ r: 5, fill: '#fff', stroke: '#10b981', strokeWidth: 2 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="space-y-2.5 max-h-32 overflow-y-auto pr-1">
                      {historyList.map((h, i) => (
                        <div key={h.id} className="flex justify-between items-center text-xs">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-700">{new Date(h.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</span>
                            <span className="text-[10px] text-slate-400 border border-slate-200 rounded px-1 w-max mt-0.5">Grade {h.condition}</span>
                          </div>
                          <span className={`font-mono font-bold ${i === 0 ? "text-emerald-600" : "text-slate-600"}`}>
                            Rp {(h.priceBuy ?? 0).toLocaleString("id-ID")}
                          </span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between text-[10px] text-slate-500 font-bold bg-slate-50 p-2 rounded-xl">
                      <span>Rendah: Rp {(lowestPrice ?? 0).toLocaleString("id-ID")}</span>
                      <span>Tinggi: Rp {(highestPrice ?? 0).toLocaleString("id-ID")}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Add Buyback Transaction Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 12 }}
              transition={{ type: "spring", duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl p-6 overflow-y-auto max-h-[90vh] space-y-6 shadow-xl"
            >
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="text-md font-bold text-slate-800 flex items-center gap-1.5">
                <Cpu className="h-5 w-5 text-emerald-600" />
                Registrasi & Verifikasi Buyback HP Bekas
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm bg-slate-50 border border-slate-200 p-2 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              
              {/* Customer data */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3.5">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Identitas Penjual (Konsumen)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-slate-500">Nama Lengkap Penjual</label>
                    <input
                      type="text"
                      required
                      value={customerName || ""}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                      placeholder="Contoh: Rudi Hartono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-slate-500">Nomor WhatsApp</label>
                    <input
                      type="text"
                      required
                      value={customerPhone || ""}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono focus:outline-none"
                      placeholder="Contoh: 081987654321"
                    />
                  </div>
                </div>
              </div>

              {/* Phone hardware description */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3.5">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Spesifikasi & Kondisi Perangkat</h4>
                
                <div className="space-y-4">
                  <BrandModelSearchInput
                    brand={brand}
                    setBrand={setBrand}
                    model={model}
                    setModel={setModel}
                    products={products}
                    buybacks={buybacks}
                    selectedProductId={linkedProductId}
                    setSelectedProductId={setLinkedProductId}
                    onSelectProduct={(p) => {
                      if (p) {
                        if (p.brand) setBrand(p.brand);
                        if (p.model) setModel(p.model);
                        else if (p.name) setModel(p.name);
                        setLinkedProductId(p.id);
                      }
                    }}
                  />

                  {/* Real-time Catalog Validation Layer (Prevents Duplicate Listings) */}
                  {(catalogValidation.status === "EXACT_MATCH" || catalogValidation.status === "LINKED") && catalogValidation.exactMatch && (
                    <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-3 text-xs space-y-2 animate-fade-in shadow-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span>Validasi Katalog: Produk Terdaftar di Stok Toko</span>
                        </div>
                        <span className="text-[10px] font-mono font-extrabold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded border border-emerald-300">
                          ID: {catalogValidation.exactMatch.id}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-emerald-900 gap-2 pt-0.5">
                        <div className="min-w-0">
                          <p className="font-bold truncate">{catalogValidation.exactMatch.name}</p>
                          <p className="text-[10px] text-emerald-700">
                            Stok Saat Ini: <span className="font-bold">{catalogValidation.exactMatch.stock} Unit</span> • Harga Jual: <span className="font-bold">Rp {catalogValidation.exactMatch.priceSell.toLocaleString('id-ID')}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[9px] font-extrabold bg-emerald-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Database className="h-3 w-3" />
                            Otomatis Gabung ke ID Ini
                          </span>
                          {linkedProductId && (
                            <button
                              type="button"
                              onClick={() => setLinkedProductId(null)}
                              className="text-[10px] text-slate-500 hover:text-slate-800 underline font-medium"
                            >
                              Lepas Tautan
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {catalogValidation.status === "SUGGESTIONS" && (
                    <div className="bg-blue-50/90 border border-blue-200 rounded-xl p-3 text-xs space-y-2 animate-fade-in shadow-xs">
                      <div className="flex items-center gap-1.5 font-bold text-blue-900">
                        <Info className="h-4 w-4 text-blue-600 shrink-0" />
                        <span>Validasi Katalog: Produk Serupa Ditemukan di Stok (Pilih ID untuk Mencegah Duplikasi)</span>
                      </div>
                      <div className="space-y-1.5 pt-1">
                        {catalogValidation.suggestions.map(p => (
                          <div key={p.id} className="flex items-center justify-between bg-white p-2 rounded-lg border border-blue-100 shadow-2xs gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-[9px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded border border-blue-200 shrink-0">
                                  {p.id}
                                </span>
                                <span className="font-bold text-slate-800 text-xs truncate">{p.name}</span>
                              </div>
                              <p className="text-[10px] text-slate-500 mt-0.5">
                                Stok: {p.stock} Unit • Harga Jual: Rp {p.priceSell.toLocaleString('id-ID')}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setLinkedProductId(p.id);
                                if (p.brand) setBrand(p.brand);
                                if (p.model) setModel(p.model);
                              }}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] rounded-lg transition-all shrink-0 cursor-pointer"
                            >
                              Gunakan ID ({p.id})
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {brand && model && catalogValidation.status === "NEW_PRODUCT" && (
                    <div className="bg-slate-100/80 border border-slate-200 rounded-xl p-2.5 text-[11px] text-slate-600 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Plus className="h-3.5 w-3.5 text-slate-500" />
                        Item Baru: Belum terdaftar di katalog. ID Produk baru akan otomatis dibuat.
                      </span>
                      <span className="font-mono font-bold text-[9px] bg-white text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                        ID BARU (OTOMATIS)
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-slate-500">Grade Kondisi HP</label>
                    <select
                      value={condition || "A"}
                      onChange={(e) => setCondition(e.target.value as any)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none"
                    >
                      <option value="A">Grade A (Mulus 98%, BH &gt; 85%, Box lengkap)</option>
                      <option value="B">Grade B (Normal, lecet tipis pemakaian, Box ada)</option>
                      <option value="C">Grade C (Jamur tipis, lecet sedang, Batangan)</option>
                      <option value="D">Grade D (Layar retak rambut / fungsi minus, Batangan)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-semibold text-slate-500">Nomor IMEI Perangkat (15 Digit)</label>
                      {imeiValidation.isValidating && (
                        <span className="text-[10px] text-amber-600 font-bold flex items-center gap-1 animate-pulse">
                          <Cpu className="h-3 w-3 animate-spin" />
                          Memeriksa Blacklist...
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      required
                      maxLength={15}
                      value={customerImei || ""}
                      onChange={(e) => setCustomerImei(e.target.value)}
                      className={`w-full bg-white border rounded-xl px-3 py-2 text-xs text-slate-800 font-mono focus:outline-none transition-all ${
                        imeiValidation.result?.isBlacklisted 
                          ? "border-red-500 ring-2 ring-red-500/30 bg-red-50/20" 
                          : imeiValidation.result?.status === "WARRANTY_ACTIVE" || imeiValidation.result?.status === "CLEAN"
                          ? "border-emerald-500 ring-1 ring-emerald-500/20"
                          : "border-slate-200"
                      }`}
                      placeholder="Sistem akan verifikasi otomatis ke Blacklist API..."
                    />

                    {/* Real-time Validation Banner Feedback */}
                    {imeiValidation.result && (
                      <div className="mt-1.5">
                        {imeiValidation.result.isBlacklisted ? (
                          <div className="p-3 bg-red-500/10 border-2 border-red-500/40 rounded-xl space-y-1 text-red-900 animate-shake">
                            <div className="flex items-center gap-1.5 font-extrabold text-xs text-red-700">
                              <ShieldAlert className="h-4 w-4 shrink-0 text-red-600 animate-bounce" />
                              <span>⚠️ IMEI DIBLOKIR / DILAPORKAN CURIAN!</span>
                            </div>
                            <p className="text-[10px] text-red-800 font-medium leading-relaxed">
                              {imeiValidation.result.reason}
                            </p>
                            {imeiValidation.result.details && (
                              <div className="text-[9px] bg-white/80 p-2 rounded-lg border border-red-200 space-y-0.5 text-slate-700 font-mono">
                                <div><b className="text-red-700">Sumber Registry:</b> {imeiValidation.result.details.source}</div>
                                <div><b className="text-red-700">No Laporan POLRI/Audit:</b> {imeiValidation.result.details.caseNumber}</div>
                                <div><b className="text-red-700">Instansi:</b> {imeiValidation.result.details.agency}</div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-[10px] font-semibold">
                            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                            <span>{imeiValidation.result.reason}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <span className="text-[9px] text-slate-400 block">Ketik IMEI berakhiran <b>000</b> atau prefix <b>35111</b> untuk mensimulasikan kegagalan blokir blacklist nasional.</span>
                  </div>
                </div>
              </div>
              </div>

              {/* Estimated Pricing & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Estimasi Harga Beli POS</label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          if (brand) setCalcBrand(brand);
                          if (model) setCalcModel(model);
                          setShowCalcModal(true);
                        }}
                        className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[9px] font-bold rounded-lg border border-indigo-200 flex items-center gap-1 transition-all cursor-pointer"
                        title="Hitung estimasi berdasarkan fisik & kelengkapan dus"
                      >
                        <Calculator className="h-2.5 w-2.5 text-indigo-600" />
                        <span>Kalkulator Matrix</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleAiTaksirHarga}
                        disabled={isTaksirAi}
                        className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 dark:hover:bg-emerald-950 text-[9px] font-bold rounded-lg border border-emerald-100 dark:border-emerald-900/50 flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Sparkles className={`h-2.5 w-2.5 ${isTaksirAi ? "animate-spin" : ""}`} />
                        <span>{isTaksirAi ? "Menghitung..." : "Taksir AI"}</span>
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    required
                    value={priceBuy || priceBuy === 0 || priceBuy === "0" ? Number(priceBuy).toLocaleString("id-ID") : ""}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      setPriceBuy(val);
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-emerald-600 font-extrabold focus:outline-none"
                  />
                  <span className="text-[9px] text-slate-400 block">Dihitung otomatis atau taksir dengan AI.</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Catatan Pemeriksaan Fisik</label>
                  <textarea
                    value={notes || ""}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 h-16 focus:outline-none"
                    placeholder="Contoh: BH 88%, FaceID on, TrueTone on, charger bawaan."
                  />
                </div>
              </div>

              {aiAnalysis && (
                <div className="p-3 bg-indigo-50/60 border border-indigo-100 text-indigo-900 dark:bg-indigo-950/25 dark:border-indigo-900/45 dark:text-indigo-300 rounded-xl text-[11px] flex gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5 animate-pulse" />
                  <p className="leading-relaxed font-medium">{aiAnalysis}</p>
                </div>
              )}

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
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg cursor-pointer shadow-md shadow-emerald-600/10"
                >
                  Verifikasi & Ambil Alih HP
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

      {/* BUYBACK PRICE ESTIMATOR CALCULATOR MODAL */}
      <AnimatePresence>
        {showCalcModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
            onClick={() => setShowCalcModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 12 }}
              transition={{ type: "spring", duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl p-6 space-y-5 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
                    <Calculator className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-md font-extrabold text-slate-800 flex items-center gap-2">
                      Kalkulator Estimasi Harga Buyback HP
                    </h3>
                    <p className="text-xs text-slate-500">
                      Penaksiran harga konsisten berdasarkan kondisi fisik, kelengkapan dus, dan fungsi hardware.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCalcModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Step 1: Model & Benchmark Price */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <h4 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Smartphone className="h-3.5 w-3.5 text-indigo-600" />
                  1. Perangkat & Harga Acuan Pasar
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600">Brand & Model HP</label>
                    <input
                      type="text"
                      value={calcModel}
                      onChange={(e) => setCalcModel(e.target.value)}
                      placeholder="Contoh: iPhone 13 128GB / Samsung S23"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600">Harga Acuan Pasar HP Mulus (IDR)</label>
                    <input
                      type="text"
                      value={calcMarketPrice ? Number(calcMarketPrice).toLocaleString("id-ID") : ""}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        setCalcMarketPrice(val ? Number(val) : 0);
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* Step 2: Physical Condition & Box Completeness */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Condition Physical */}
                <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                  <label className="text-[11px] font-extrabold text-slate-700 block flex items-center gap-1.5">
                    <Sliders className="h-3.5 w-3.5 text-indigo-600" />
                    Kondisi Fisik (Body & Bezel)
                  </label>
                  <div className="space-y-1.5">
                    {[
                      { id: "MULUS", label: "Mulus (98-100%)", sub: "Tanpa lecet / dent", pct: "0%" },
                      { id: "LECET_HALUS", label: "Lecet Halus", sub: "Pemakaian wajar / goresan tipis", pct: "-10%" },
                      { id: "LECET_PARAH", label: "Lecet Parah / Jamur", sub: "Jamur casing / dent bezel", pct: "-25%" },
                      { id: "LAYAR_RETAK", label: "Layar Retak / Minus", sub: "Retak rambut / bezel dent parah", pct: "-40%" }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setCalcPhysicalCondition(opt.id as any)}
                        className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-xs ${
                          calcPhysicalCondition === opt.id
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        <div>
                          <p className="font-bold">{opt.label}</p>
                          <p className={`text-[10px] ${calcPhysicalCondition === opt.id ? "text-indigo-100" : "text-slate-400"}`}>{opt.sub}</p>
                        </div>
                        <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${calcPhysicalCondition === opt.id ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-600"}`}>
                          {opt.pct}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Box Completeness */}
                <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                  <label className="text-[11px] font-extrabold text-slate-700 block flex items-center gap-1.5">
                    <Box className="h-3.5 w-3.5 text-indigo-600" />
                    Kelengkapan Box & Aksesoris
                  </label>
                  <div className="space-y-1.5">
                    {[
                      { id: "FULLSET_ORI", label: "Fullset Original", sub: "Dus ori + Charger bawaan + Manual", pct: "0%" },
                      { id: "FULLSET_OEM", label: "Fullset OEM", sub: "Dus pengganti / charger OEM", pct: "-5%" },
                      { id: "BATANGAN", label: "Batangan / Tanpa Box", sub: "Hanya unit HP tanpa kelengkapan", pct: "-15%" }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setCalcCompleteness(opt.id as any)}
                        className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-xs ${
                          calcCompleteness === opt.id
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        <div>
                          <p className="font-bold">{opt.label}</p>
                          <p className={`text-[10px] ${calcCompleteness === opt.id ? "text-indigo-100" : "text-slate-400"}`}>{opt.sub}</p>
                        </div>
                        <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${calcCompleteness === opt.id ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-600"}`}>
                          {opt.pct}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Step 3: Hardware Function Checks */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                <label className="text-[11px] font-extrabold text-slate-700 block flex items-center gap-1.5">
                  <Wrench className="h-3.5 w-3.5 text-indigo-600" />
                  Fungsi Hardware & Status Garansi
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Battery */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500">Kondisi Baterai (BH)</span>
                    <select
                      value={calcBatteryHealth}
                      onChange={(e) => setCalcBatteryHealth(e.target.value as any)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
                    >
                      <option value="EXCELLENT">BH &gt; 85% (Normal Sehat - Rp 0)</option>
                      <option value="GOOD">BH 75-84% (Sedang - Potong Rp 150.000)</option>
                      <option value="POOR">BH &lt; 75% / Service (Potong Rp 350.000)</option>
                    </select>
                  </div>

                  {/* Biometric */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500">Face ID / Fingerprint</span>
                    <select
                      value={calcBiometric}
                      onChange={(e) => setCalcBiometric(e.target.value as any)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
                    >
                      <option value="NORMAL">Normal Berfungsi (Rp 0)</option>
                      <option value="OFF">Mati / OFF / Failed (Potong Rp 400.000)</option>
                    </select>
                  </div>

                  {/* Screen */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500">Layar & TrueTone</span>
                    <select
                      value={calcScreenStatus}
                      onChange={(e) => setCalcScreenStatus(e.target.value as any)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
                    >
                      <option value="ORIGINAL">Original Bawaan (Rp 0)</option>
                      <option value="REPLACED">Pernah Ganti / Shadow / Spot (Potong Rp 300.000)</option>
                    </select>
                  </div>

                  {/* Warranty */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500">Garansi Resmi Store</span>
                    <select
                      value={calcWarrantyStatus}
                      onChange={(e) => setCalcWarrantyStatus(e.target.value as any)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
                    >
                      <option value="EXPIRED">Ex-Garansi / Habis (Rp 0)</option>
                      <option value="ACTIVE">Garansi Resmi Aktif (Bonus +Rp 250.000)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Result Calculation Card */}
              <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-5 rounded-2xl shadow-lg space-y-3">
                <div className="flex justify-between items-center border-b border-indigo-700/60 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Scale className="h-4 w-4 text-indigo-400" />
                    <span className="text-xs font-bold uppercase tracking-wide text-indigo-200">Hasil Penaksiran Buyback</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full font-black text-xs bg-indigo-500 text-white border border-indigo-400">
                    Grade {calcResult.derivedGrade}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-indigo-200">
                  <div>
                    <span className="block text-[10px] text-indigo-300">Potongan Kondisi Fisik:</span>
                    <span className="font-bold text-white">{calcResult.physLabel}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-indigo-300">Potongan Kelengkapan Box:</span>
                    <span className="font-bold text-white">{calcResult.compLabel}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-indigo-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-emerald-400 block tracking-wider">Rekomendasi Penawaran Harga Beli (Nett)</span>
                    <p className="text-2xl font-black text-emerald-400 font-mono mt-0.5">
                      Rp {calcResult.finalOffer.toLocaleString("id-ID")}
                    </p>
                  </div>

                  <div className="text-right sm:border-l border-indigo-700/60 sm:pl-4">
                    <span className="text-[10px] text-indigo-300 block">Proyeksi Margin Toko:</span>
                    <span className="text-xs font-bold text-white">Rp {calcResult.estimatedStoreMargin.toLocaleString("id-ID")}</span>
                    <span className="text-[9px] text-indigo-300 block">Est. Jual: Rp {calcResult.estimatedResellPrice.toLocaleString("id-ID")}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCalcModal(false)}
                  className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-bold text-xs cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={handleApplyCalcToForm}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-2 shadow-md shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer"
                >
                  <ArrowRight className="h-4 w-4" />
                  Gunakan Ke Form Buyback
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BUYBACK RECEIPT TICKET MODAL */}
      <AnimatePresence>
        {selectedReceipt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedReceipt(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 12 }}
              transition={{ type: "spring", duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-6 shadow-xl"
            >
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="text-md font-bold text-slate-800">Cetak Tanda Terima Buyback</h3>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm bg-slate-50 border border-slate-200 p-2 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Thermal buyback layout */}
            <div 
              className={`bg-white text-slate-950 rounded-2xl font-mono text-xs shadow-xl border border-slate-200 mx-auto max-w-[340px] space-y-3 ${
                (localStorage.getItem("print_padding_density") || "normal") === "compact" ? "p-4 space-y-2" : (localStorage.getItem("print_padding_density") || "normal") === "spacious" ? "p-6 space-y-4" : "p-5 space-y-3"
              }`}
            >
              {localStorage.getItem("print_show_shop_header") !== "false" && (
                <div className="text-center space-y-1">
                  {localStorage.getItem("print_shop_logo_url") && (
                    <div className="flex justify-center mb-1">
                      <img src={localStorage.getItem("print_shop_logo_url")!} alt="Logo" className="h-9 object-contain grayscale" />
                    </div>
                  )}
                  <h4 className="font-extrabold text-sm uppercase tracking-tight">
                    {localStorage.getItem("print_shop_title") || "FONEPOS & BUYBACK"}
                  </h4>
                  <p className="text-[9.5px] leading-tight text-slate-800">
                    {localStorage.getItem("print_shop_address") || "Roxy Mas Square Blok C2, Jakarta"}
                  </p>
                  <div className="flex justify-center items-center gap-2 text-[9px] text-slate-700 font-bold">
                    <span>WA: {localStorage.getItem("print_shop_phone") || "0812-RICKY-COMP"}</span>
                    {localStorage.getItem("print_social_media") && (
                      <span>• {localStorage.getItem("print_social_media")}</span>
                    )}
                  </div>
                </div>
              )}

              <div className="text-center border-y border-dashed border-slate-300 py-1.5 text-[9px] space-y-0.5">
                <p className="font-black text-[10px]">SERAH TERIMA BUYBACK HP BEKAS</p>
                <p>ID Transaksi: {selectedReceipt?.id}</p>
                <p>{selectedReceipt?.date ? new Date(selectedReceipt.date).toLocaleString("id-ID") : "-"}</p>
              </div>

              {localStorage.getItem("print_show_cashier_customer") !== "false" && (
                <div className="space-y-1 text-[10px] border-b border-dashed border-slate-200 pb-2">
                  <div className="flex justify-between">
                    <span>Nama Konsumen:</span>
                    <span className="font-bold">{selectedReceipt.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>WhatsApp:</span>
                    <span className="font-mono font-bold">{selectedReceipt.customerPhone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pemeriksa (Kasir):</span>
                    <span className="font-bold">{selectedReceipt.cashierName}</span>
                  </div>
                </div>
              )}

              <div className="space-y-1 text-[10px]">
                <p className="font-extrabold text-[11px] text-slate-900">{selectedReceipt.brand} {selectedReceipt.model}</p>
                <p className="text-[9.5px] font-mono font-bold">IMEI: {selectedReceipt.customerImei}</p>
                <p className="text-[9px]">Kondisi Fisik: Grade {selectedReceipt.condition}</p>
                {selectedReceipt.notes && (
                  <p className="text-[8.5px] text-slate-600 italic">Catatan: {selectedReceipt.notes}</p>
                )}
                
                {localStorage.getItem("print_show_kemenperin_tag") !== "false" && (
                  <div className="pt-1">
                    <span className="text-[7.5px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-1 py-0.2 rounded font-sans inline-block font-extrabold uppercase">
                      ✓ IMEI TERVERIFIKASI RESMI (KEMENPERIN/BEA CUKAI)
                    </span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-dashed border-slate-300 text-[10px]">
                <span className="font-bold uppercase text-slate-700">STATUS IMEI:</span>
                <span className="font-extrabold text-emerald-700 uppercase">{selectedReceipt.imeiStatus}</span>
              </div>

              <div className="flex justify-between items-center pt-2 font-black text-emerald-800 border-t border-dashed border-slate-300 text-[11px]">
                <span>JUMLAH DIBAYARKAN:</span>
                <span className="font-mono">Rp {(selectedReceipt?.priceBuy ?? 0).toLocaleString("id-ID")}</span>
              </div>

              {localStorage.getItem("print_show_qr") !== "false" && (
                <div className="pt-2 flex flex-col items-center justify-center space-y-1 border-t border-dashed border-slate-300">
                  <div className="p-1 bg-white border border-slate-300 rounded-lg shadow-2xs">
                    <QRCodeSVG
                      value={
                        (localStorage.getItem("print_qr_target_type") || "WARRANTY_TRACKING") === "WARRANTY_TRACKING"
                          ? `${localStorage.getItem("print_qr_custom_url") || "https://fonepos.id/garansi?sn="}${selectedReceipt.customerImei}`
                          : (localStorage.getItem("print_qr_target_type") || "") === "CATALOG_ONLINE"
                          ? localStorage.getItem("print_qr_custom_url") || "https://fonepos.id/katalog"
                          : (localStorage.getItem("print_qr_target_type") || "") === "CUSTOM_LINK"
                          ? localStorage.getItem("print_qr_custom_url") || "https://fonepos.id"
                          : selectedReceipt.id
                      }
                      size={72}
                      level="M"
                    />
                  </div>
                  <span className="text-[8px] text-slate-600 font-mono font-bold uppercase tracking-wider text-center max-w-[240px]">
                    {localStorage.getItem("print_qr_label") || "SCAN UNTUK KLAIM & CEK GARANSI"}
                  </span>
                </div>
              )}

              {localStorage.getItem("print_promo_message") && (
                <div className="text-center pt-2 border-t border-dashed border-slate-300">
                  <p className="text-[9.5px] font-bold border border-slate-300 p-1 rounded italic text-slate-800">
                    {localStorage.getItem("print_promo_message")}
                  </p>
                </div>
              )}

              <div className="text-center pt-2 border-t border-dashed border-slate-300 text-[8.5px] text-slate-600 space-y-0.5">
                <p className="font-bold text-slate-900">{localStorage.getItem("print_thanks_text") || "--- TERIMA KASIH ---"}</p>
                <p className="font-semibold">{localStorage.getItem("print_footer_text") || "Tanda terima resmi Buyback FonePOS. Pencairan instan."}</p>
              </div>
            </div>

            <button
              onClick={() => {
                alert("Mengirim ke Bluetooth Printer Thermal...");
                window.print();
              }}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-emerald-600/10"
            >
              <Printer className="h-4 w-4" />
              Cetak Dokumen
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </div>
  );
}
